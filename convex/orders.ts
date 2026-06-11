import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'

import type { Doc, Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  assertFulfillmentStatusTransition,
  assertMoneyAmount,
  type FulfillmentStatus,
  type Role,
} from './domain'
import { enqueueOrderEmail, orderEmailVariables } from './emails'

const adminRoles = new Set<Role>(['admin', 'superadmin'])

const fulfillmentStatus = v.union(
  v.literal('unfulfilled'),
  v.literal('processing'),
  v.literal('in_delivery'),
  v.literal('delivered'),
  v.literal('cancelled'),
)

const orderStatus = v.union(
  v.literal('pending_payment'),
  v.literal('paid'),
  v.literal('cancelled'),
  v.literal('payment_failed'),
)

const paymentStatus = v.union(
  v.literal('pending'),
  v.literal('paid'),
  v.literal('failed'),
  v.literal('expired'),
  v.literal('refunded'),
)

async function currentProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) return null

  return await ctx.db
    .query('profiles')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .unique()
}

async function requireAdminProfile(ctx: QueryCtx | MutationCtx) {
  const profile = await currentProfile(ctx)
  if (!profile || !adminRoles.has(profile.role)) {
    throw new ConvexError('Admin access is required.')
  }
  return profile
}

async function requireCustomerProfile(ctx: QueryCtx | MutationCtx) {
  const profile = await currentProfile(ctx)
  if (!profile) throw new ConvexError('Authentication is required.')
  return profile
}

export const listAdminOrders = query({
  args: {
    orderStatus: v.optional(orderStatus),
    paymentStatus: v.optional(paymentStatus),
    fulfillmentStatus: v.optional(fulfillmentStatus),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminProfile(ctx)
    const orders = await ctx.db.query('orders').order('desc').take(100)
    const search = args.search?.trim().toLowerCase()

    return orders
      .filter((order) =>
        args.orderStatus ? order.orderStatus === args.orderStatus : true,
      )
      .filter((order) =>
        args.paymentStatus ? order.paymentStatus === args.paymentStatus : true,
      )
      .filter((order) =>
        args.fulfillmentStatus
          ? order.fulfillmentStatus === args.fulfillmentStatus
          : true,
      )
      .filter((order) => {
        if (!search) return true
        return (
          order.orderNumber.toLowerCase().includes(search) ||
          order.email.toLowerCase().includes(search) ||
          order.customerName.toLowerCase().includes(search)
        )
      })
  },
})

export const getAdminOrder = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    await requireAdminProfile(ctx)
    return await orderBundle(ctx, args.orderId)
  },
})

export const listCustomerOrders = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireCustomerProfile(ctx)
    return await ctx.db
      .query('orders')
      .withIndex('by_profile_created', (q) => q.eq('profileId', profile._id))
      .order('desc')
      .collect()
  },
})

export const getCustomerOrder = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireCustomerProfile(ctx)
    const order = await ctx.db
      .query('orders')
      .withIndex('by_order_number', (q) =>
        q.eq('orderNumber', args.orderNumber),
      )
      .unique()

    if (!order || order.profileId !== profile._id) return null
    return await orderBundle(ctx, order._id)
  },
})

export const updateShipment = mutation({
  args: {
    orderId: v.id('orders'),
    fulfillmentStatus: fulfillmentStatus,
    carrier: v.optional(v.string()),
    service: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const order = await ctx.db.get(args.orderId)
    if (!order) throw new ConvexError('Order not found.')
    if (order.orderStatus !== 'paid') {
      throw new ConvexError('Only paid orders can be fulfilled.')
    }

    assertFulfillmentStatusTransition(
      order.fulfillmentStatus,
      args.fulfillmentStatus,
    )

    const now = Date.now()
    const existing = await ctx.db
      .query('shipments')
      .withIndex('by_order', (q) => q.eq('orderId', order._id))
      .unique()
    const shipmentPatch = {
      carrier: cleanOptionalText(args.carrier),
      service: cleanOptionalText(args.service),
      trackingNumber: cleanOptionalText(args.trackingNumber),
      trackingUrl: cleanOptionalText(args.trackingUrl),
      status: args.fulfillmentStatus,
      shippedAt:
        args.fulfillmentStatus === 'in_delivery' ||
        args.fulfillmentStatus === 'delivered'
          ? (args.shippedAt ?? existing?.shippedAt ?? now)
          : args.shippedAt,
      deliveredAt:
        args.fulfillmentStatus === 'delivered'
          ? (args.deliveredAt ?? existing?.deliveredAt ?? now)
          : args.deliveredAt,
      adminProfileId: actor._id,
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, shipmentPatch)
    } else {
      await ctx.db.insert('shipments', {
        orderId: order._id,
        ...shipmentPatch,
        createdAt: now,
      })
    }

    await ctx.db.patch(order._id, {
      fulfillmentStatus: args.fulfillmentStatus,
      updatedAt: now,
    })

    await logActivity(ctx, actor, 'update', 'shipments', order._id, {
      orderNumber: order.orderNumber,
      fulfillmentStatus: args.fulfillmentStatus,
    })
    await sendFulfillmentEmail(ctx, order, args.fulfillmentStatus, {
      carrier: cleanOptionalText(args.carrier) ?? '',
      service: cleanOptionalText(args.service) ?? '',
      trackingNumber: cleanOptionalText(args.trackingNumber) ?? '',
    })
  },
})

export const recordManualRefund = mutation({
  args: {
    orderId: v.id('orders'),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    assertMoneyAmount(args.amount)
    if (args.amount <= 0) {
      throw new ConvexError('Refund amount must be greater than zero.')
    }

    const order = await ctx.db.get(args.orderId)
    if (!order) throw new ConvexError('Order not found.')
    if (order.paymentStatus !== 'paid') {
      throw new ConvexError('Only paid orders can be marked refunded.')
    }

    const payment = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', order._id))
      .unique()
    const now = Date.now()

    await ctx.db.insert('manualRefunds', {
      orderId: order._id,
      paymentId: payment?._id,
      amount: args.amount,
      currency: order.currency,
      reason: cleanOptionalText(args.reason),
      adminProfileId: actor._id,
      createdAt: now,
    })
    await ctx.db.patch(order._id, { paymentStatus: 'refunded', updatedAt: now })
    if (payment) {
      await ctx.db.patch(payment._id, {
        status: 'refunded',
        rawStatus: 'manual_refund_recorded',
        updatedAt: now,
      })
    }
    await logActivity(ctx, actor, 'refund', 'orders', order._id, {
      orderNumber: order.orderNumber,
      amount: args.amount,
      reason: cleanOptionalText(args.reason),
      providerApiCalled: false,
    })
  },
})

async function orderBundle(ctx: QueryCtx, orderId: Id<'orders'>) {
  const order = await ctx.db.get(orderId)
  if (!order) return null

  const [items, payment, shipment, refunds, activity, emailEvents] =
    await Promise.all([
      ctx.db
        .query('orderItems')
        .withIndex('by_order', (q) => q.eq('orderId', order._id))
        .collect(),
      ctx.db
        .query('payments')
        .withIndex('by_order', (q) => q.eq('orderId', order._id))
        .unique(),
      ctx.db
        .query('shipments')
        .withIndex('by_order', (q) => q.eq('orderId', order._id))
        .unique(),
      ctx.db
        .query('manualRefunds')
        .withIndex('by_order', (q) => q.eq('orderId', order._id))
        .collect(),
      ctx.db
        .query('adminActivityLogs')
        .withIndex('by_target', (q) =>
          q.eq('targetTable', 'orders').eq('targetId', order._id),
        )
        .collect(),
      ctx.db
        .query('emailEvents')
        .withIndex('by_order', (q) => q.eq('orderId', order._id))
        .order('desc')
        .take(20),
    ])

  return {
    order,
    items,
    payment,
    shipment,
    refunds: refunds.sort((a, b) => b.createdAt - a.createdAt),
    activity: activity.sort((a, b) => b.createdAt - a.createdAt),
    emailEvents,
  }
}

async function logActivity(
  ctx: MutationCtx,
  actor: Doc<'profiles'>,
  action: 'update' | 'refund',
  targetTable: string,
  targetId: Id<'orders'>,
  metadata?: unknown,
) {
  await ctx.db.insert('adminActivityLogs', {
    actorProfileId: actor._id,
    action,
    targetTable,
    targetId,
    metadata,
    createdAt: Date.now(),
  })
}

async function sendFulfillmentEmail(
  ctx: MutationCtx,
  order: Doc<'orders'>,
  status: FulfillmentStatus,
  shipmentVariables: Record<string, string>,
) {
  const templateKey =
    status === 'processing'
      ? 'order_processing'
      : status === 'in_delivery'
        ? 'order_in_delivery'
        : status === 'delivered'
          ? 'order_delivered'
          : null

  if (!templateKey) return

  await enqueueOrderEmail(ctx, {
    templateKey,
    recipientEmail: order.email,
    orderId: order._id,
    variables: await orderEmailVariables(ctx, order, shipmentVariables),
    metadata: { fulfillmentStatus: status },
  })
}

function cleanOptionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
