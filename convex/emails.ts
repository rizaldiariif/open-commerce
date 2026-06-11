import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'

import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  defaultEmailTemplates,
  defaultSiteSettings,
  DEFAULT_SITE_SETTINGS_KEY,
  EMAIL_TEMPLATE_KEYS,
  type EmailTemplateKey,
} from './domain'

const templateKey = v.union(
  v.literal('invoice_created'),
  v.literal('payment_confirmed'),
  v.literal('payment_failed'),
  v.literal('payment_expired'),
  v.literal('order_processing'),
  v.literal('order_in_delivery'),
  v.literal('order_delivered'),
  v.literal('order_cancelled'),
  v.literal('admin_paid_order'),
  v.literal('admin_low_stock'),
)

type EmailPayload = {
  templateKey: EmailTemplateKey
  recipientEmail: string
  orderId?: Id<'orders'>
  variables: Record<string, string>
  metadata?: unknown
}

type PreparedEmail = EmailPayload & {
  subject: string
  previewText?: string
  htmlBody: string
  textBody?: string
  fromEmail: string
}

export const sendOrderEmail = internalAction({
  args: {
    templateKey,
    recipientEmail: v.string(),
    orderId: v.optional(v.id('orders')),
    variables: v.record(v.string(), v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const prepared = (await ctx.runQuery(internal.emails.prepareEmail, {
      templateKey: args.templateKey,
      recipientEmail: args.recipientEmail,
      orderId: args.orderId,
      variables: args.variables,
      metadata: args.metadata,
    })) as PreparedEmail | null

    if (!prepared) return

    const eventId = (await ctx.runMutation(internal.emails.recordEmailQueued, {
      templateKey: prepared.templateKey,
      recipientEmail: prepared.recipientEmail,
      orderId: prepared.orderId,
      provider: 'resend',
      metadata: prepared.metadata,
    })) as Id<'emailEvents'>

    try {
      const result = await sendWithResend(prepared)
      await ctx.runMutation(internal.emails.recordEmailSent, {
        eventId,
        providerMessageId: result.id,
      })
    } catch (error) {
      await ctx.runMutation(internal.emails.recordEmailFailed, {
        eventId,
        errorMessage:
          error instanceof Error ? error.message : 'Email send failed.',
      })
    }
  },
})

export const prepareEmail = internalQuery({
  args: {
    templateKey,
    recipientEmail: v.string(),
    orderId: v.optional(v.id('orders')),
    variables: v.record(v.string(), v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<PreparedEmail | null> => {
    const template = await templateForKey(ctx, args.templateKey)
    if (!template?.isActive) return null

    const settings = await siteSettings(ctx)
    const variables = {
      storeName: settings.storeName,
      supportEmail: settings.supportEmail,
      ...args.variables,
    }

    return {
      ...args,
      fromEmail:
        process.env.RESEND_FROM_EMAIL ??
        process.env.EMAIL_FROM ??
        `${settings.storeName} <${settings.supportEmail}>`,
      subject: renderTemplate(template.subject, variables),
      previewText: template.previewText
        ? renderTemplate(template.previewText, variables)
        : undefined,
      htmlBody: renderTemplate(template.htmlBody, variables),
      textBody: template.textBody
        ? renderTemplate(template.textBody, variables)
        : undefined,
    }
  },
})

export const recordEmailQueued = internalMutation({
  args: {
    templateKey,
    recipientEmail: v.string(),
    orderId: v.optional(v.id('orders')),
    provider: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('emailEvents', {
      templateKey: args.templateKey,
      recipientEmail: args.recipientEmail.trim().toLowerCase(),
      orderId: args.orderId,
      provider: args.provider,
      status: 'queued',
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const recordEmailSent = internalMutation({
  args: {
    eventId: v.id('emailEvents'),
    providerMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      providerMessageId: args.providerMessageId,
      status: 'sent',
      updatedAt: Date.now(),
    })
  },
})

export const recordEmailFailed = internalMutation({
  args: {
    eventId: v.id('emailEvents'),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      status: 'failed',
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    })
  },
})

export const seedDefaultTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    let created = 0

    for (const key of EMAIL_TEMPLATE_KEYS) {
      const existing = await ctx.db
        .query('emailTemplates')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique()
      if (existing) continue

      await ctx.db.insert('emailTemplates', {
        key,
        ...defaultEmailTemplates[key],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      created += 1
    }

    return { created }
  },
})

export const upsertEmailTemplate = mutation({
  args: {
    id: v.optional(v.id('emailTemplates')),
    key: templateKey,
    subject: v.string(),
    previewText: v.optional(v.string()),
    htmlBody: v.string(),
    textBody: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireSuperadminProfile(ctx)
    const subject = args.subject.trim()
    const htmlBody = args.htmlBody.trim()
    if (!subject || !htmlBody) {
      throw new ConvexError('Template subject and HTML body are required.')
    }

    const now = Date.now()
    if (args.id) {
      await ctx.db.patch(args.id, {
        key: args.key,
        subject,
        previewText: cleanOptionalText(args.previewText),
        htmlBody,
        textBody: cleanOptionalText(args.textBody),
        isActive: args.isActive,
        updatedAt: now,
      })
      return args.id
    }

    const existing = await ctx.db
      .query('emailTemplates')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        subject,
        previewText: cleanOptionalText(args.previewText),
        htmlBody,
        textBody: cleanOptionalText(args.textBody),
        isActive: args.isActive,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('emailTemplates', {
      key: args.key,
      subject,
      previewText: cleanOptionalText(args.previewText),
      htmlBody,
      textBody: cleanOptionalText(args.textBody),
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export function enqueueOrderEmail(
  ctx: MutationCtx,
  email: EmailPayload,
  delayMs = 0,
) {
  return ctx.scheduler.runAfter(delayMs, internal.emails.sendOrderEmail, email)
}

export async function orderEmailVariables(
  ctx: QueryCtx | MutationCtx,
  order: Doc<'orders'>,
  extra: Record<string, string> = {},
) {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.email,
    grandTotal: formatMoney(order.grandTotal, order.currency),
    ...extra,
  }
}

async function sendWithResend(email: PreparedEmail) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: email.fromEmail,
      to: [email.recipientEmail],
      subject: email.subject,
      html: email.previewText
        ? `<span style="display:none">${escapeHtml(email.previewText)}</span>${email.htmlBody}`
        : email.htmlBody,
      text: email.textBody,
    }),
  })

  const body = (await response.json().catch(() => ({}))) as {
    id?: string
    message?: string
    name?: string
  }
  if (!response.ok) {
    throw new Error(body.message ?? body.name ?? 'Resend API request failed.')
  }
  return { id: body.id }
}

async function templateForKey(ctx: QueryCtx, key: EmailTemplateKey) {
  const stored = await ctx.db
    .query('emailTemplates')
    .withIndex('by_key', (q) => q.eq('key', key))
    .unique()
  if (stored) return stored

  const defaults = defaultEmailTemplates[key]
  return {
    key,
    ...defaults,
    isActive: true,
  }
}

async function siteSettings(ctx: QueryCtx) {
  const stored = await ctx.db
    .query('siteSettings')
    .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
    .unique()
  return { ...defaultSiteSettings, ...stored }
}

async function requireSuperadminProfile(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new ConvexError('Superadmin access is required.')
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .unique()
  if (profile?.role !== 'superadmin') {
    throw new ConvexError('Superadmin access is required.')
  }
  return profile
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => {
    return variables[key] ?? ''
  })
}

function cleanOptionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
