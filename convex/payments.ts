import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'

import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import {
  action,
  httpAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { releasePendingOrder } from './checkout'
import { createXenditInvoice, xenditWebhookAuthorized } from './xendit'

type WebhookDecisionStatus = 'processed' | 'duplicate' | 'rejected'
type PreparedInvoiceOrder = Doc<'orders'> & {
  existingPayment: Doc<'payments'> | null
}

const xenditStatus = v.union(
  v.literal('pending'),
  v.literal('paid'),
  v.literal('failed'),
  v.literal('expired'),
)

export const createInvoiceForOrder = action({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args): Promise<{ checkoutUrl?: string }> => {
    const order = (await ctx.runQuery(
      internal.payments.prepareInvoiceForOrder,
      {
        orderId: args.orderId,
      },
    )) as PreparedInvoiceOrder

    if (order.existingPayment?.checkoutUrl) {
      return { checkoutUrl: order.existingPayment.checkoutUrl }
    }

    const baseUrl = process.env.SITE_URL ?? 'http://localhost:3000'
    try {
      const invoice = await createXenditInvoice({
        externalId: order.orderNumber,
        amount: order.grandTotal,
        currency: order.currency,
        payerEmail: order.email,
        description: `Muse Commerce order ${order.orderNumber}`,
        successRedirectUrl: `${baseUrl}/payment/${order.orderNumber}`,
        failureRedirectUrl: `${baseUrl}/payment/${order.orderNumber}`,
        callbackUrl: process.env.XENDIT_CALLBACK_URL,
      })

      const payment = (await ctx.runMutation(
        internal.payments.recordInvoiceCreated,
        {
          orderId: args.orderId,
          providerInvoiceId: invoice.id,
          providerReference: invoice.external_id,
          checkoutUrl: invoice.invoice_url,
          amount: invoice.amount,
          currency: invoice.currency ?? order.currency,
          rawStatus: invoice.status,
          expiresAt: invoice.expiry_date
            ? Date.parse(invoice.expiry_date)
            : undefined,
        },
      )) as Doc<'payments'> | null
      return { checkoutUrl: payment?.checkoutUrl }
    } catch (error) {
      await ctx.runMutation(internal.payments.markInvoiceCreationFailed, {
        orderId: args.orderId,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Xendit invoice creation failed.',
      })
      throw error
    }
  },
})

export const prepareInvoiceForOrder = internalQuery({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError('Sign in before payment.')
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .unique()
    if (!profile) throw new ConvexError('Sign in before payment.')

    const order = await ctx.db.get(args.orderId)
    if (!order || order.profileId !== profile._id) {
      throw new ConvexError('Order not found.')
    }
    if (
      order.orderStatus !== 'pending_payment' ||
      order.paymentStatus !== 'pending'
    ) {
      throw new ConvexError('Order is not awaiting payment.')
    }

    const existingPayment = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', order._id))
      .unique()
    return { ...order, existingPayment }
  },
})

export const recordInvoiceCreated = internalMutation({
  args: {
    orderId: v.id('orders'),
    providerInvoiceId: v.string(),
    providerReference: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    rawStatus: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        providerInvoiceId: args.providerInvoiceId,
        providerReference: args.providerReference,
        checkoutUrl: args.checkoutUrl,
        amount: args.amount,
        currency: args.currency,
        rawStatus: args.rawStatus,
        expiresAt: args.expiresAt,
        updatedAt: now,
      })
      return await ctx.db.get(existing._id)
    }

    const paymentId = await ctx.db.insert('payments', {
      orderId: args.orderId,
      provider: 'xendit',
      providerInvoiceId: args.providerInvoiceId,
      providerReference: args.providerReference,
      checkoutUrl: args.checkoutUrl,
      amount: args.amount,
      currency: args.currency,
      status: 'pending',
      rawStatus: args.rawStatus,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    return await ctx.db.get(paymentId)
  },
})

export const markInvoiceCreationFailed = internalMutation({
  args: { orderId: v.id('orders'), errorMessage: v.string() },
  handler: async (ctx, args) => {
    await releasePendingOrder(ctx, args.orderId, 'failed')
    const now = Date.now()
    await ctx.db.insert('paymentWebhookEvents', {
      provider: 'xendit',
      providerEventId: `invoice-create-failed:${args.orderId}:${now}`,
      orderId: args.orderId,
      status: 'rejected',
      reason: args.errorMessage,
      payload: { source: 'invoice_creation' },
      createdAt: now,
    })
  },
})

export const handleXenditWebhook = httpAction(async (ctx, request) => {
  if (!xenditWebhookAuthorized(request)) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null
  if (!payload) return json({ ok: false, error: 'invalid_json' }, 400)

  const invoiceId = stringField(payload, 'id')
  const externalId = stringField(payload, 'external_id')
  const rawStatus = stringField(payload, 'status')
  const amount = numberField(payload, 'amount')
  const currency = stringField(payload, 'currency') ?? 'IDR'
  const providerEventId =
    stringField(payload, 'event') ??
    stringField(payload, 'event_id') ??
    `${invoiceId ?? 'unknown'}:${rawStatus ?? 'unknown'}`

  const normalizedStatus = normalizeXenditStatus(rawStatus)
  if (!invoiceId || !externalId || !normalizedStatus) {
    await ctx.runMutation(internal.payments.recordWebhookDecision, {
      providerEventId,
      providerInvoiceId: invoiceId,
      externalId,
      status: 'rejected',
      reason: 'Missing invoice ID, external ID, or supported status.',
      payload,
    })
    return json({ ok: false, error: 'invalid_payload' }, 400)
  }

  const result = await ctx.runMutation(internal.payments.applyXenditWebhook, {
    providerEventId,
    providerInvoiceId: invoiceId,
    externalId,
    amount,
    currency,
    rawStatus,
    status: normalizedStatus,
    paidAt: parseOptionalDate(payload, 'paid_at'),
    payload,
  })

  return json({ ok: true, status: result.status, reason: result.reason })
})

export const applyXenditWebhook = internalMutation({
  args: {
    providerEventId: v.string(),
    providerInvoiceId: v.string(),
    externalId: v.string(),
    amount: v.optional(v.number()),
    currency: v.string(),
    rawStatus: v.optional(v.string()),
    status: xenditStatus,
    paidAt: v.optional(v.number()),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db
      .query('paymentWebhookEvents')
      .withIndex('by_provider_event', (q) =>
        q.eq('provider', 'xendit').eq('providerEventId', args.providerEventId),
      )
      .unique()
    if (existingEvent) {
      await recordWebhook(ctx, args, 'duplicate', existingEvent.reason)
      return { status: 'duplicate' as const, reason: existingEvent.reason }
    }

    const payment = await ctx.db
      .query('payments')
      .withIndex('by_provider_invoice', (q) =>
        q.eq('providerInvoiceId', args.providerInvoiceId),
      )
      .unique()
    const order = payment ? await ctx.db.get(payment.orderId) : null

    const rejection = validateWebhookOrder(args, payment, order)
    if (rejection) {
      await recordWebhook(ctx, args, 'rejected', rejection, order?._id)
      return { status: 'rejected' as const, reason: rejection }
    }

    if (args.status === 'paid') {
      await markOrderPaid(ctx, order!, payment!, args.rawStatus, args.paidAt)
    } else if (args.status === 'failed' || args.status === 'expired') {
      await releasePendingOrder(ctx, order!._id, args.status)
      await patchPayment(ctx, payment!._id, args.status, args.rawStatus)
    } else {
      await patchPayment(ctx, payment!._id, 'pending', args.rawStatus)
    }

    await recordWebhook(ctx, args, 'processed', undefined, order!._id)
    return { status: 'processed' as const }
  },
})

export const recordWebhookDecision = internalMutation({
  args: {
    providerEventId: v.string(),
    providerInvoiceId: v.optional(v.string()),
    externalId: v.optional(v.string()),
    status: v.union(
      v.literal('processed'),
      v.literal('duplicate'),
      v.literal('rejected'),
    ),
    reason: v.optional(v.string()),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('paymentWebhookEvents', {
      provider: 'xendit',
      providerEventId: args.providerEventId,
      providerInvoiceId: args.providerInvoiceId,
      externalId: args.externalId,
      status: args.status,
      reason: args.reason,
      payload: args.payload,
      createdAt: Date.now(),
    })
  },
})

async function markOrderPaid(
  ctx: MutationCtx,
  order: Doc<'orders'>,
  payment: Doc<'payments'>,
  rawStatus: string | undefined,
  paidAt: number | undefined,
) {
  if (order.orderStatus !== 'pending_payment' || payment.status === 'paid') {
    await patchPayment(ctx, payment._id, 'paid', rawStatus, paidAt)
    return
  }

  const now = Date.now()
  const items = await ctx.db
    .query('orderItems')
    .withIndex('by_order', (q) => q.eq('orderId', order._id))
    .collect()

  for (const item of items) {
    if (!item.variantId) continue
    const variant = await ctx.db.get(item.variantId)
    if (!variant) continue
    const nextReserved = Math.max(0, variant.reservedStock - item.quantity)
    const nextStock = Math.max(0, variant.stockOnHand - item.quantity)
    await ctx.db.patch(item.variantId, {
      reservedStock: nextReserved,
      stockOnHand: nextStock,
      updatedAt: now,
    })
    await ctx.db.insert('inventoryMovements', {
      variantId: item.variantId,
      type: 'sale',
      quantityDelta: -item.quantity,
      stockAfter: nextStock - nextReserved,
      reason: 'Xendit payment paid',
      orderId: order._id,
      createdAt: now,
    })
  }

  const redemptions = await ctx.db
    .query('couponRedemptions')
    .withIndex('by_order', (q) => q.eq('orderId', order._id))
    .collect()
  for (const redemption of redemptions) {
    if (redemption.status === 'reserved') {
      await ctx.db.patch(redemption._id, { status: 'consumed', updatedAt: now })
      const coupon = await ctx.db.get(redemption.couponId)
      if (coupon) {
        await ctx.db.patch(coupon._id, {
          redeemedCount: coupon.redeemedCount + 1,
          updatedAt: now,
        })
      }
    }
  }

  await ctx.db.patch(order._id, {
    orderStatus: 'paid',
    paymentStatus: 'paid',
    paidAt: paidAt ?? now,
    updatedAt: now,
  })
  await patchPayment(ctx, payment._id, 'paid', rawStatus, paidAt ?? now)
}

async function patchPayment(
  ctx: MutationCtx,
  paymentId: Id<'payments'>,
  status: 'pending' | 'paid' | 'failed' | 'expired',
  rawStatus: string | undefined,
  paidAt?: number,
) {
  await ctx.db.patch(paymentId, {
    status,
    rawStatus,
    paidAt,
    updatedAt: Date.now(),
  })
}

function validateWebhookOrder(
  args: {
    externalId: string
    amount?: number
    currency: string
  },
  payment: Doc<'payments'> | null,
  order: Doc<'orders'> | null,
) {
  if (!payment || !order) return 'Payment record was not found.'
  if (args.externalId !== order.orderNumber)
    return 'External ID does not match order.'
  if (args.amount !== undefined && args.amount !== payment.amount) {
    return 'Invoice amount does not match payment record.'
  }
  if (args.currency.toUpperCase() !== payment.currency.toUpperCase()) {
    return 'Invoice currency does not match payment record.'
  }
  return null
}

async function recordWebhook(
  ctx: MutationCtx,
  args: {
    providerEventId: string
    providerInvoiceId: string
    externalId: string
    payload: unknown
  },
  status: WebhookDecisionStatus,
  reason?: string,
  orderId?: Id<'orders'>,
) {
  await ctx.db.insert('paymentWebhookEvents', {
    provider: 'xendit',
    providerEventId: args.providerEventId,
    providerInvoiceId: args.providerInvoiceId,
    orderId,
    externalId: args.externalId,
    status,
    reason,
    payload: args.payload,
    createdAt: Date.now(),
  })
}

function normalizeXenditStatus(status: string | undefined) {
  switch (status) {
    case 'PAID':
    case 'SETTLED':
      return 'paid' as const
    case 'FAILED':
      return 'failed' as const
    case 'EXPIRED':
      return 'expired' as const
    case 'PENDING':
      return 'pending' as const
    default:
      return null
  }
}

function stringField(payload: Record<string, unknown>, key: string) {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function numberField(payload: Record<string, unknown>, key: string) {
  const value = payload[key]
  return typeof value === 'number' ? value : undefined
}

function parseOptionalDate(payload: Record<string, unknown>, key: string) {
  const value = stringField(payload, key)
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
