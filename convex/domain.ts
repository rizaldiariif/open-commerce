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
} as const

export const defaultHomepageContent = {
  key: DEFAULT_HOME_CONTENT_KEY,
  title: 'Muse Commerce',
  subtitle: 'A considered catalog for everyday essentials.',
  heroCtaLabel: 'Shop new arrivals',
  heroCtaHref: '/products',
  featuredCategorySlugs: [] as string[],
  announcement: 'Free shipping offers and launches will appear here soon.',
} as const
