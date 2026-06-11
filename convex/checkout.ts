import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'

import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  assertMoneyAmount,
  defaultSiteSettings,
  DEFAULT_SITE_SETTINGS_KEY,
} from './domain'
import { enqueueOrderEmail, orderEmailVariables } from './emails'

const addressInput = v.object({
  recipientName: v.string(),
  phone: v.string(),
  addressLine1: v.string(),
  addressLine2: v.optional(v.string()),
  city: v.string(),
  province: v.string(),
  postalCode: v.string(),
  country: v.string(),
})

function cleanText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function availableStock(variant: Doc<'productVariants'>) {
  return Math.max(0, variant.stockOnHand - variant.reservedStock)
}

async function currentProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) return null
  return await ctx.db
    .query('profiles')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .unique()
}

async function requireProfile(ctx: QueryCtx | MutationCtx) {
  const profile = await currentProfile(ctx)
  if (!profile) throw new ConvexError('Sign in before checkout.')
  return profile
}

async function activeCart(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<'profiles'>,
) {
  return await ctx.db
    .query('carts')
    .withIndex('by_profile_status', (q) =>
      q.eq('profileId', profileId).eq('status', 'active'),
    )
    .unique()
}

async function cartItems(ctx: QueryCtx | MutationCtx, cartId: Id<'carts'>) {
  return await ctx.db
    .query('cartItems')
    .withIndex('by_cart', (q) => q.eq('cartId', cartId))
    .collect()
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

async function couponDiscount(
  ctx: QueryCtx | MutationCtx,
  coupon: Doc<'coupons'>,
  subtotal: number,
  profileId: Id<'profiles'>,
  email: string,
) {
  const now = Date.now()
  if (!coupon.isActive) throw new ConvexError('Coupon is disabled.')
  if (coupon.startsAt !== undefined && coupon.startsAt > now) {
    throw new ConvexError('Coupon is not active yet.')
  }
  if (coupon.endsAt !== undefined && coupon.endsAt < now) {
    throw new ConvexError('Coupon has expired.')
  }
  if (coupon.minSubtotal !== undefined && subtotal < coupon.minSubtotal) {
    throw new ConvexError('Cart subtotal does not meet coupon minimum.')
  }

  const reservedOrConsumed = (
    await ctx.db
      .query('couponRedemptions')
      .withIndex('by_coupon', (q) => q.eq('couponId', coupon._id))
      .collect()
  ).filter((redemption) => redemption.status !== 'released')

  if (
    coupon.usageLimit !== undefined &&
    reservedOrConsumed.length >= coupon.usageLimit
  ) {
    throw new ConvexError('Coupon usage limit has been reached.')
  }

  if (coupon.usageLimitPerCustomer !== undefined) {
    const customerUses = reservedOrConsumed.filter(
      (redemption) =>
        redemption.profileId === profileId ||
        redemption.email.toLowerCase() === email.toLowerCase(),
    )
    if (customerUses.length >= coupon.usageLimitPerCustomer) {
      throw new ConvexError('Coupon customer limit has been reached.')
    }
  }

  const rawDiscount =
    coupon.type === 'fixed_amount'
      ? coupon.value
      : Math.floor((subtotal * coupon.value) / 100)
  const capped =
    coupon.maxDiscount === undefined
      ? rawDiscount
      : Math.min(rawDiscount, coupon.maxDiscount)

  return Math.min(subtotal, Math.max(0, capped))
}

async function settings(ctx: QueryCtx | MutationCtx) {
  const stored = await ctx.db
    .query('siteSettings')
    .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
    .unique()
  return { ...defaultSiteSettings, ...stored }
}

export const getCheckout = query({
  args: {},
  handler: async (ctx) => {
    const profile = await currentProfile(ctx)
    if (!profile) return { status: 'unauthenticated' as const }

    const [cart, addresses, storeSettings] = await Promise.all([
      activeCart(ctx, profile._id),
      ctx.db
        .query('customerAddresses')
        .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
        .collect(),
      settings(ctx),
    ])

    if (!cart) {
      return { status: 'ready' as const, profile, addresses, cart: null }
    }

    const items = await cartItems(ctx, cart._id)
    const hydrated = await Promise.all(
      items.map(async (item) => {
        const [product, variant] = await Promise.all([
          ctx.db.get(item.productId),
          ctx.db.get(item.variantId),
        ])
        const available =
          product?.status === 'active' && variant?.isActive
            ? availableStock(variant)
            : 0
        return {
          ...item,
          availableStock: available,
          lineTotal: item.quantity * item.unitPrice,
          isValid: Boolean(product?.status === 'active' && variant?.isActive),
          isQuantityAvailable: item.quantity <= available,
        }
      }),
    )

    return {
      status: 'ready' as const,
      profile,
      addresses: addresses.sort(
        (a, b) => Number(b.isDefault) - Number(a.isDefault),
      ),
      settings: storeSettings,
      cart: {
        cart,
        items: hydrated,
        subtotal: hydrated.reduce((total, item) => total + item.lineTotal, 0),
        canCheckout:
          hydrated.length > 0 &&
          hydrated.every((item) => item.isValid && item.isQuantityAvailable) &&
          storeSettings.checkoutEnabled,
      },
    }
  },
})

export const previewCoupon = query({
  args: { code: v.string(), subtotal: v.number() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    assertMoneyAmount(args.subtotal)
    const coupon = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', normalizeCode(args.code)))
      .unique()
    if (!coupon) return null
    return {
      coupon,
      discountAmount: await couponDiscount(
        ctx,
        coupon,
        args.subtotal,
        profile._id,
        profile.email,
      ),
    }
  },
})

export const saveAddress = mutation({
  args: { id: v.optional(v.id('customerAddresses')), address: addressInput },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const now = Date.now()
    const address = normalizeAddress(args.address)

    if (args.id) {
      const existing = await ctx.db.get(args.id)
      if (!existing || existing.profileId !== profile._id) {
        throw new ConvexError('Address not found.')
      }
      await ctx.db.patch(args.id, { ...address, updatedAt: now })
      return args.id
    }

    const existingAddresses = await ctx.db
      .query('customerAddresses')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect()
    return await ctx.db.insert('customerAddresses', {
      profileId: profile._id,
      label: address.city,
      ...address,
      isDefault: existingAddresses.length === 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const createOrder = mutation({
  args: {
    email: v.string(),
    customerName: v.string(),
    phone: v.optional(v.string()),
    addressId: v.optional(v.id('customerAddresses')),
    shippingAddress: addressInput,
    couponCode: v.optional(v.string()),
    notes: v.optional(v.string()),
    saveAddress: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const storeSettings = await settings(ctx)
    if (!storeSettings.checkoutEnabled) {
      throw new ConvexError('Checkout is currently disabled.')
    }

    const cart = await activeCart(ctx, profile._id)
    if (!cart) throw new ConvexError('Your cart is empty.')

    const items = await cartItems(ctx, cart._id)
    if (items.length === 0) throw new ConvexError('Your cart is empty.')

    const orderLines = []
    for (const item of items) {
      const [product, variant] = await Promise.all([
        ctx.db.get(item.productId),
        ctx.db.get(item.variantId),
      ])
      if (!product || product.status !== 'active' || !variant?.isActive) {
        throw new ConvexError('A cart item is no longer available.')
      }
      if (item.quantity > availableStock(variant)) {
        throw new ConvexError(
          `Only ${availableStock(variant)} left for ${variant.sku}.`,
        )
      }
      orderLines.push({ item, product, variant })
    }

    const subtotal = orderLines.reduce(
      (total, line) => total + line.item.quantity * line.variant.price,
      0,
    )
    let coupon: Doc<'coupons'> | null = null
    let discountTotal = 0
    const couponCode = cleanText(args.couponCode)
    if (couponCode) {
      coupon = await ctx.db
        .query('coupons')
        .withIndex('by_code', (q) => q.eq('code', normalizeCode(couponCode)))
        .unique()
      if (!coupon) throw new ConvexError('Coupon was not found.')
      discountTotal = await couponDiscount(
        ctx,
        coupon,
        subtotal,
        profile._id,
        args.email,
      )
    }

    const now = Date.now()
    const address = args.addressId
      ? await addressForOrder(ctx, args.addressId, profile._id)
      : normalizeAddress(args.shippingAddress)
    const orderId = await ctx.db.insert('orders', {
      orderNumber: `MUSE-${now}-${String(profile._id).slice(-6).toUpperCase()}`,
      profileId: profile._id,
      email: args.email.trim().toLowerCase(),
      customerName: args.customerName.trim(),
      phone: cleanText(args.phone),
      currency: storeSettings.currency,
      subtotal,
      discountTotal,
      shippingTotal: 0,
      taxTotal: 0,
      grandTotal: Math.max(0, subtotal - discountTotal),
      couponId: coupon?._id,
      orderStatus: 'pending_payment',
      paymentStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      shippingAddress: address,
      notes: cleanText(args.notes),
      placedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    for (const line of orderLines) {
      const nextReserved = line.variant.reservedStock + line.item.quantity
      await ctx.db.patch(line.variant._id, {
        reservedStock: nextReserved,
        updatedAt: now,
      })
      await ctx.db.insert('inventoryMovements', {
        variantId: line.variant._id,
        type: 'reservation',
        quantityDelta: -line.item.quantity,
        stockAfter: line.variant.stockOnHand - nextReserved,
        reason: 'Pending order reservation',
        orderId,
        createdAt: now,
      })
      await ctx.db.insert('orderItems', {
        orderId,
        productId: line.product._id,
        variantId: line.variant._id,
        sku: line.variant.sku,
        productName: line.product.name,
        productSlug: line.product.slug,
        variantName: line.variant.name,
        optionValues: line.variant.optionValues,
        imageUrl: line.item.productSnapshot.imageUrl,
        quantity: line.item.quantity,
        unitPrice: line.variant.price,
        lineSubtotal: line.item.quantity * line.variant.price,
        createdAt: now,
      })
    }

    if (coupon && discountTotal > 0) {
      await ctx.db.insert('couponRedemptions', {
        couponId: coupon._id,
        orderId,
        profileId: profile._id,
        email: args.email.trim().toLowerCase(),
        discountAmount: discountTotal,
        status: 'reserved',
        redeemedAt: now,
        updatedAt: now,
      })
    }

    if (args.saveAddress && !args.addressId) {
      const existingAddresses = await ctx.db
        .query('customerAddresses')
        .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
        .collect()
      await ctx.db.insert('customerAddresses', {
        profileId: profile._id,
        label: address.city,
        ...address,
        isDefault: existingAddresses.length === 0,
        createdAt: now,
        updatedAt: now,
      })
    }

    await ctx.db.patch(cart._id, { status: 'converted', updatedAt: now })
    await ctx.scheduler.runAfter(
      (storeSettings.pendingPaymentExpiryMinutes ?? 30) * 60 * 1000,
      internal.checkout.expirePendingOrder,
      { orderId },
    )

    const order = await ctx.db.get(orderId)
    return { orderId, orderNumber: order!.orderNumber }
  },
})

export const getPaymentOrder = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const order = await ctx.db
      .query('orders')
      .withIndex('by_order_number', (q) =>
        q.eq('orderNumber', args.orderNumber),
      )
      .unique()
    if (!order || order.profileId !== profile._id) return null
    const items = await ctx.db
      .query('orderItems')
      .withIndex('by_order', (q) => q.eq('orderId', order._id))
      .collect()
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', order._id))
      .unique()
    return { order, items, payment }
  },
})

export const expirePendingOrder = internalMutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    await releasePendingOrder(ctx, args.orderId, 'expired')
  },
})

export const cleanupExpiredPendingOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const storeSettings = await settings(ctx)
    const cutoff =
      Date.now() - (storeSettings.pendingPaymentExpiryMinutes ?? 30) * 60 * 1000
    const pending = await ctx.db
      .query('orders')
      .withIndex('by_order_status', (q) =>
        q.eq('orderStatus', 'pending_payment'),
      )
      .collect()

    for (const order of pending) {
      if (order.createdAt <= cutoff) {
        await releasePendingOrder(ctx, order._id, 'expired')
      }
    }
  },
})

export async function releasePendingOrder(
  ctx: MutationCtx,
  orderId: Id<'orders'>,
  paymentStatus: 'expired' | 'failed' = 'expired',
) {
  const order = await ctx.db.get(orderId)
  if (!order || order.orderStatus !== 'pending_payment') return

  const now = Date.now()
  const items = await ctx.db
    .query('orderItems')
    .withIndex('by_order', (q) => q.eq('orderId', orderId))
    .collect()

  for (const item of items) {
    if (!item.variantId) continue
    const variant = await ctx.db.get(item.variantId)
    if (!variant) continue
    const nextReserved = Math.max(0, variant.reservedStock - item.quantity)
    await ctx.db.patch(item.variantId, {
      reservedStock: nextReserved,
      updatedAt: now,
    })
    await ctx.db.insert('inventoryMovements', {
      variantId: item.variantId,
      type: 'release',
      quantityDelta: item.quantity,
      stockAfter: variant.stockOnHand - nextReserved,
      reason:
        paymentStatus === 'failed'
          ? 'Pending order payment failed'
          : 'Pending order expired',
      orderId,
      createdAt: now,
    })
  }

  const redemptions = await ctx.db
    .query('couponRedemptions')
    .withIndex('by_order', (q) => q.eq('orderId', orderId))
    .collect()
  for (const redemption of redemptions) {
    if (redemption.status === 'reserved') {
      await ctx.db.patch(redemption._id, { status: 'released', updatedAt: now })
    }
  }

  await ctx.db.patch(orderId, {
    orderStatus: 'payment_failed',
    paymentStatus,
    updatedAt: now,
  })
  await enqueueOrderEmail(ctx, {
    templateKey:
      paymentStatus === 'failed' ? 'payment_failed' : 'payment_expired',
    recipientEmail: order.email,
    orderId,
    variables: await orderEmailVariables(ctx, order),
    metadata: { paymentStatus },
  })
}

async function addressForOrder(
  ctx: QueryCtx | MutationCtx,
  addressId: Id<'customerAddresses'>,
  profileId: Id<'profiles'>,
) {
  const address = await ctx.db.get(addressId)
  if (!address || address.profileId !== profileId) {
    throw new ConvexError('Address not found.')
  }
  return {
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
  }
}

function normalizeAddress(address: {
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country: string
}) {
  const normalized = {
    recipientName: address.recipientName.trim(),
    phone: address.phone.trim(),
    addressLine1: address.addressLine1.trim(),
    addressLine2: cleanText(address.addressLine2),
    city: address.city.trim(),
    province: address.province.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country.trim() || 'Indonesia',
  }
  if (
    !normalized.recipientName ||
    !normalized.phone ||
    !normalized.addressLine1 ||
    !normalized.city ||
    !normalized.province ||
    !normalized.postalCode
  ) {
    throw new ConvexError('Complete shipping address is required.')
  }
  return normalized
}
