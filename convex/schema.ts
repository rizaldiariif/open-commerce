import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal('customer'),
      v.literal('admin'),
      v.literal('superadmin'),
    ),
    phone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_id', ['userId'])
    .index('by_email', ['email'])
    .index('by_role', ['role']),

  siteSettings: defineTable({
    key: v.string(),
    storeName: v.string(),
    supportEmail: v.string(),
    currency: v.string(),
    locale: v.string(),
    checkoutEnabled: v.boolean(),
    maintenanceMode: v.boolean(),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_key', ['key']),

  siteContent: defineTable({
    key: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    heroImageId: v.optional(v.id('mediaAssets')),
    heroCtaLabel: v.optional(v.string()),
    heroCtaHref: v.optional(v.string()),
    featuredCategorySlugs: v.array(v.string()),
    announcement: v.optional(v.string()),
    status: v.union(
      v.literal('draft'),
      v.literal('published'),
      v.literal('archived'),
    ),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_status', ['status']),

  mediaAssets: defineTable({
    storageId: v.string(),
    filename: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
    altText: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    uploadedByProfileId: v.optional(v.id('profiles')),
    createdAt: v.number(),
  })
    .index('by_storage_id', ['storageId'])
    .index('by_uploaded_by', ['uploadedByProfileId']),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentCategoryId: v.optional(v.id('categories')),
    imageId: v.optional(v.id('mediaAssets')),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_active_sort', ['isActive', 'sortOrder'])
    .index('by_parent', ['parentCategoryId']),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id('categories')),
    status: v.union(
      v.literal('draft'),
      v.literal('active'),
      v.literal('archived'),
    ),
    featuredImageId: v.optional(v.id('mediaAssets')),
    galleryImageIds: v.array(v.id('mediaAssets')),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_status_sort', ['status', 'sortOrder'])
    .index('by_category_status', ['categoryId', 'status']),

  productVariants: defineTable({
    productId: v.id('products'),
    sku: v.string(),
    name: v.string(),
    optionValues: v.array(
      v.object({
        name: v.string(),
        value: v.string(),
      }),
    ),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    stockOnHand: v.number(),
    reservedStock: v.number(),
    lowStockThreshold: v.optional(v.number()),
    weightGrams: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_product', ['productId'])
    .index('by_sku', ['sku'])
    .index('by_active', ['isActive']),

  inventoryMovements: defineTable({
    variantId: v.id('productVariants'),
    type: v.union(
      v.literal('adjustment'),
      v.literal('sale'),
      v.literal('reservation'),
      v.literal('release'),
      v.literal('return'),
    ),
    quantityDelta: v.number(),
    stockAfter: v.number(),
    reason: v.optional(v.string()),
    orderId: v.optional(v.id('orders')),
    actorProfileId: v.optional(v.id('profiles')),
    createdAt: v.number(),
  })
    .index('by_variant_created', ['variantId', 'createdAt'])
    .index('by_order', ['orderId']),

  carts: defineTable({
    profileId: v.optional(v.id('profiles')),
    anonymousId: v.optional(v.string()),
    currency: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('converted'),
      v.literal('abandoned'),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_profile_status', ['profileId', 'status'])
    .index('by_anonymous_status', ['anonymousId', 'status']),

  cartItems: defineTable({
    cartId: v.id('carts'),
    productId: v.id('products'),
    variantId: v.id('productVariants'),
    quantity: v.number(),
    unitPrice: v.number(),
    productSnapshot: v.object({
      name: v.string(),
      slug: v.string(),
      imageUrl: v.optional(v.string()),
    }),
    variantSnapshot: v.object({
      sku: v.string(),
      name: v.string(),
      optionValues: v.array(
        v.object({
          name: v.string(),
          value: v.string(),
        }),
      ),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_cart', ['cartId'])
    .index('by_cart_variant', ['cartId', 'variantId']),

  customerAddresses: defineTable({
    profileId: v.id('profiles'),
    label: v.optional(v.string()),
    recipientName: v.string(),
    phone: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    province: v.string(),
    postalCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_default', ['profileId', 'isDefault']),

  orders: defineTable({
    orderNumber: v.string(),
    profileId: v.optional(v.id('profiles')),
    email: v.string(),
    customerName: v.string(),
    phone: v.optional(v.string()),
    currency: v.string(),
    subtotal: v.number(),
    discountTotal: v.number(),
    shippingTotal: v.number(),
    taxTotal: v.number(),
    grandTotal: v.number(),
    couponId: v.optional(v.id('coupons')),
    orderStatus: v.union(
      v.literal('pending_payment'),
      v.literal('paid'),
      v.literal('cancelled'),
      v.literal('payment_failed'),
    ),
    paymentStatus: v.union(
      v.literal('pending'),
      v.literal('paid'),
      v.literal('failed'),
      v.literal('expired'),
      v.literal('refunded'),
    ),
    fulfillmentStatus: v.union(
      v.literal('unfulfilled'),
      v.literal('processing'),
      v.literal('in_delivery'),
      v.literal('delivered'),
      v.literal('cancelled'),
    ),
    shippingAddress: v.object({
      recipientName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      province: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
    notes: v.optional(v.string()),
    placedAt: v.number(),
    paidAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_order_number', ['orderNumber'])
    .index('by_profile_created', ['profileId', 'createdAt'])
    .index('by_email_created', ['email', 'createdAt'])
    .index('by_order_status', ['orderStatus'])
    .index('by_payment_status', ['paymentStatus'])
    .index('by_fulfillment_status', ['fulfillmentStatus']),

  orderItems: defineTable({
    orderId: v.id('orders'),
    productId: v.optional(v.id('products')),
    variantId: v.optional(v.id('productVariants')),
    sku: v.string(),
    productName: v.string(),
    productSlug: v.string(),
    variantName: v.string(),
    optionValues: v.array(
      v.object({
        name: v.string(),
        value: v.string(),
      }),
    ),
    imageUrl: v.optional(v.string()),
    quantity: v.number(),
    unitPrice: v.number(),
    lineSubtotal: v.number(),
    createdAt: v.number(),
  }).index('by_order', ['orderId']),

  payments: defineTable({
    orderId: v.id('orders'),
    provider: v.union(v.literal('xendit')),
    providerInvoiceId: v.string(),
    providerReference: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('paid'),
      v.literal('failed'),
      v.literal('expired'),
      v.literal('refunded'),
    ),
    rawStatus: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_order', ['orderId'])
    .index('by_provider_invoice', ['providerInvoiceId'])
    .index('by_status', ['status']),

  shipments: defineTable({
    orderId: v.id('orders'),
    carrier: v.optional(v.string()),
    service: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
    status: v.union(
      v.literal('unfulfilled'),
      v.literal('processing'),
      v.literal('in_delivery'),
      v.literal('delivered'),
      v.literal('cancelled'),
    ),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_order', ['orderId'])
    .index('by_status', ['status']),

  coupons: defineTable({
    code: v.string(),
    type: v.union(v.literal('percentage'), v.literal('fixed_amount')),
    value: v.number(),
    currency: v.optional(v.string()),
    minSubtotal: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    usageLimitPerCustomer: v.optional(v.number()),
    redeemedCount: v.number(),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_active', ['isActive']),

  couponRedemptions: defineTable({
    couponId: v.id('coupons'),
    orderId: v.id('orders'),
    profileId: v.optional(v.id('profiles')),
    email: v.string(),
    discountAmount: v.number(),
    redeemedAt: v.number(),
  })
    .index('by_coupon', ['couponId'])
    .index('by_order', ['orderId'])
    .index('by_coupon_profile', ['couponId', 'profileId'])
    .index('by_coupon_email', ['couponId', 'email']),

  adminActivityLogs: defineTable({
    actorProfileId: v.optional(v.id('profiles')),
    action: v.union(
      v.literal('create'),
      v.literal('update'),
      v.literal('delete'),
      v.literal('publish'),
      v.literal('archive'),
      v.literal('login'),
    ),
    targetTable: v.string(),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_actor_created', ['actorProfileId', 'createdAt'])
    .index('by_target', ['targetTable', 'targetId']),

  emailTemplates: defineTable({
    key: v.string(),
    subject: v.string(),
    previewText: v.optional(v.string()),
    htmlBody: v.string(),
    textBody: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_active', ['isActive']),

  emailEvents: defineTable({
    templateKey: v.string(),
    recipientEmail: v.string(),
    orderId: v.optional(v.id('orders')),
    provider: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),
    status: v.union(
      v.literal('queued'),
      v.literal('sent'),
      v.literal('delivered'),
      v.literal('failed'),
    ),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_recipient_created', ['recipientEmail', 'createdAt'])
    .index('by_order', ['orderId'])
    .index('by_status', ['status']),
})
