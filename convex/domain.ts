export const ROLES = ['customer', 'admin', 'superadmin'] as const
export type Role = (typeof ROLES)[number]

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'cancelled',
  'payment_failed',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'expired',
  'refunded',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const FULFILLMENT_STATUSES = [
  'unfulfilled',
  'processing',
  'in_delivery',
  'delivered',
  'cancelled',
] as const
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number]

export const INVENTORY_MOVEMENT_TYPES = [
  'adjustment',
  'sale',
  'reservation',
  'release',
  'return',
] as const
export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number]

export const COUPON_TYPES = ['percentage', 'fixed_amount'] as const
export type CouponType = (typeof COUPON_TYPES)[number]

export const ADMIN_ACTIVITY_ACTIONS = [
  'create',
  'update',
  'delete',
  'publish',
  'archive',
  'login',
] as const
export type AdminActivityAction = (typeof ADMIN_ACTIVITY_ACTIONS)[number]

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled', 'payment_failed'],
  paid: ['cancelled'],
  cancelled: [],
  payment_failed: ['pending_payment', 'cancelled'],
}

const paymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ['paid', 'failed', 'expired'],
  paid: ['refunded'],
  failed: [],
  expired: [],
  refunded: [],
}

const fulfillmentTransitions: Record<
  FulfillmentStatus,
  readonly FulfillmentStatus[]
> = {
  unfulfilled: ['processing', 'cancelled'],
  processing: ['in_delivery', 'cancelled'],
  in_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const isValidSlug = (value: string) => slugPattern.test(value)

export const assertValidSlug = (value: string) => {
  if (!isValidSlug(value)) {
    throw new Error('Slug must use lowercase letters, numbers, and hyphens.')
  }
}

export const assertPositiveQuantity = (value: number) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Quantity must be a positive whole number.')
  }
}

export const assertNonNegativeQuantity = (value: number) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Quantity must be a non-negative whole number.')
  }
}

export const assertMoneyAmount = (value: number) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Money amounts must be non-negative integer minor units.')
  }
}

export const canTransitionOrderStatus = (from: OrderStatus, to: OrderStatus) =>
  from === to || orderTransitions[from].includes(to)

export const canTransitionPaymentStatus = (
  from: PaymentStatus,
  to: PaymentStatus,
) => from === to || paymentTransitions[from].includes(to)

export const canTransitionFulfillmentStatus = (
  from: FulfillmentStatus,
  to: FulfillmentStatus,
) => from === to || fulfillmentTransitions[from].includes(to)

export const assertOrderStatusTransition = (
  from: OrderStatus,
  to: OrderStatus,
) => {
  if (!canTransitionOrderStatus(from, to)) {
    throw new Error(`Order cannot transition from ${from} to ${to}.`)
  }
}

export const assertPaymentStatusTransition = (
  from: PaymentStatus,
  to: PaymentStatus,
) => {
  if (!canTransitionPaymentStatus(from, to)) {
    throw new Error(`Payment cannot transition from ${from} to ${to}.`)
  }
}

export const assertFulfillmentStatusTransition = (
  from: FulfillmentStatus,
  to: FulfillmentStatus,
) => {
  if (!canTransitionFulfillmentStatus(from, to)) {
    throw new Error(`Fulfillment cannot transition from ${from} to ${to}.`)
  }
}

export const DEFAULT_SITE_SETTINGS_KEY = 'default'
export const DEFAULT_HOME_CONTENT_KEY = 'homepage'
export const EMAIL_TEMPLATE_KEYS = [
  'invoice_created',
  'payment_confirmed',
  'payment_failed',
  'payment_expired',
  'order_processing',
  'order_in_delivery',
  'order_delivered',
  'order_cancelled',
  'admin_paid_order',
  'admin_low_stock',
] as const
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number]

export const defaultSiteSettings = {
  key: DEFAULT_SITE_SETTINGS_KEY,
  storeName: 'Muse Commerce',
  supportEmail: 'support@example.com',
  currency: 'IDR',
  locale: 'id-ID',
  checkoutEnabled: true,
  maintenanceMode: false,
  seoTitle: 'Muse Commerce',
  seoDescription: 'A curated single-brand commerce experience.',
  pendingPaymentExpiryMinutes: 30,
} as const

export const defaultHomepageContent = {
  key: DEFAULT_HOME_CONTENT_KEY,
  title: 'Muse Commerce',
  subtitle: 'A considered catalog for everyday essentials.',
  heroCtaLabel: 'Shop new arrivals',
  heroCtaHref: '/products',
  featuredCategorySlugs: [] as string[],
  homepageBanners: [] as {
    title: string
    body?: string
    imageId?: never
    href?: string
  }[],
  announcement: 'Free shipping offers and launches will appear here soon.',
  aboutText: 'Muse Commerce is a focused single-brand storefront.',
  footerText: 'Curated essentials, packed with care.',
} as const

export const defaultEmailTemplates: Record<
  EmailTemplateKey,
  {
    subject: string
    previewText: string
    htmlBody: string
    textBody: string
  }
> = {
  invoice_created: {
    subject: 'Invoice for order {{orderNumber}}',
    previewText: 'Your payment invoice is ready.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>Your invoice for order <strong>{{orderNumber}}</strong> is ready.</p><p>Total: {{grandTotal}}.</p><p><a href="{{paymentUrl}}">Open payment invoice</a></p>',
    textBody:
      'Hi {{customerName}}, your invoice for order {{orderNumber}} is ready. Total: {{grandTotal}}. Pay here: {{paymentUrl}}',
  },
  payment_confirmed: {
    subject: 'Payment confirmed for {{orderNumber}}',
    previewText: 'We received your payment.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>Payment for order <strong>{{orderNumber}}</strong> is confirmed. We will start preparing it soon.</p>',
    textBody:
      'Hi {{customerName}}, payment for order {{orderNumber}} is confirmed. We will start preparing it soon.',
  },
  payment_failed: {
    subject: 'Payment failed for {{orderNumber}}',
    previewText: 'Your payment could not be completed.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>Payment for order <strong>{{orderNumber}}</strong> could not be completed. Your reserved items have been released.</p>',
    textBody:
      'Hi {{customerName}}, payment for order {{orderNumber}} could not be completed. Your reserved items have been released.',
  },
  payment_expired: {
    subject: 'Payment expired for {{orderNumber}}',
    previewText: 'Your payment window has expired.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>The payment window for order <strong>{{orderNumber}}</strong> has expired. Your reserved items have been released.</p>',
    textBody:
      'Hi {{customerName}}, the payment window for order {{orderNumber}} has expired. Your reserved items have been released.',
  },
  order_processing: {
    subject: 'Order {{orderNumber}} is being prepared',
    previewText: 'Your order is now processing.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>Order <strong>{{orderNumber}}</strong> is now being prepared.</p>',
    textBody:
      'Hi {{customerName}}, order {{orderNumber}} is now being prepared.',
  },
  order_in_delivery: {
    subject: 'Order {{orderNumber}} is on the way',
    previewText: 'Your order is in delivery.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>Order <strong>{{orderNumber}}</strong> is on the way.</p><p>Courier: {{carrier}} {{service}}<br />Airwaybill: {{trackingNumber}}</p>',
    textBody:
      'Hi {{customerName}}, order {{orderNumber}} is on the way. Courier: {{carrier}} {{service}}. Airwaybill: {{trackingNumber}}',
  },
  order_delivered: {
    subject: 'Order {{orderNumber}} was delivered',
    previewText: 'Your order has been delivered.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>Order <strong>{{orderNumber}}</strong> has been delivered. Thank you for shopping with us.</p>',
    textBody:
      'Hi {{customerName}}, order {{orderNumber}} has been delivered. Thank you for shopping with us.',
  },
  order_cancelled: {
    subject: 'Order {{orderNumber}} was cancelled',
    previewText: 'Your order has been cancelled.',
    htmlBody:
      '<p>Hi {{customerName}},</p><p>Order <strong>{{orderNumber}}</strong> has been cancelled.</p>',
    textBody: 'Hi {{customerName}}, order {{orderNumber}} has been cancelled.',
  },
  admin_paid_order: {
    subject: 'Paid order {{orderNumber}}',
    previewText: 'A customer order was paid.',
    htmlBody:
      '<p>Order <strong>{{orderNumber}}</strong> was paid.</p><p>Customer: {{customerName}} ({{customerEmail}})<br />Total: {{grandTotal}}</p>',
    textBody:
      'Order {{orderNumber}} was paid. Customer: {{customerName}} ({{customerEmail}}). Total: {{grandTotal}}',
  },
  admin_low_stock: {
    subject: 'Low stock: {{sku}}',
    previewText: 'A variant has reached its low-stock threshold.',
    htmlBody:
      '<p>Variant <strong>{{sku}}</strong> has low stock.</p><p>Available: {{availableStock}}. Threshold: {{lowStockThreshold}}.</p>',
    textBody:
      'Variant {{sku}} has low stock. Available: {{availableStock}}. Threshold: {{lowStockThreshold}}.',
  },
}
