import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'

import type { Doc, Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  assertMoneyAmount,
  assertNonNegativeQuantity,
  assertValidSlug,
  COUPON_TYPES,
  defaultHomepageContent,
  defaultSiteSettings,
  DEFAULT_HOME_CONTENT_KEY,
  DEFAULT_SITE_SETTINGS_KEY,
  type Role,
} from './domain'

const adminRoles = new Set<Role>(['admin', 'superadmin'])

const productStatus = v.union(
  v.literal('draft'),
  v.literal('active'),
  v.literal('archived'),
)

const contentStatus = v.union(
  v.literal('draft'),
  v.literal('published'),
  v.literal('archived'),
)

const couponType = v.union(v.literal('percentage'), v.literal('fixed_amount'))

const optionValue = v.object({
  name: v.string(),
  value: v.string(),
})

const bannerInput = v.object({
  title: v.string(),
  body: v.optional(v.string()),
  imageId: v.optional(v.id('mediaAssets')),
  href: v.optional(v.string()),
})

type AdminProfile = Doc<'profiles'>

async function currentProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)

  if (!userId) {
    return null
  }

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

async function requireSuperadminProfile(ctx: QueryCtx | MutationCtx) {
  const profile = await currentProfile(ctx)

  if (profile?.role !== 'superadmin') {
    throw new ConvexError('Superadmin access is required.')
  }

  return profile
}

async function logActivity(
  ctx: MutationCtx,
  actor: AdminProfile,
  action: 'create' | 'update' | 'delete' | 'publish' | 'archive',
  targetTable: string,
  targetId: string,
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

function cleanOptionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function assertPositiveInteger(value: number, message: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ConvexError(message)
  }
}

async function assertUniqueCategorySlug(
  ctx: QueryCtx | MutationCtx,
  slug: string,
  exceptId?: Id<'categories'>,
) {
  const existing = await ctx.db
    .query('categories')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique()

  if (existing && existing._id !== exceptId) {
    throw new ConvexError('A category already uses this slug.')
  }
}

async function assertUniqueProductSlug(
  ctx: QueryCtx | MutationCtx,
  slug: string,
  exceptId?: Id<'products'>,
) {
  const existing = await ctx.db
    .query('products')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique()

  if (existing && existing._id !== exceptId) {
    throw new ConvexError('A product already uses this slug.')
  }
}

async function assertUniqueSku(
  ctx: QueryCtx | MutationCtx,
  sku: string,
  exceptId?: Id<'productVariants'>,
) {
  const existing = await ctx.db
    .query('productVariants')
    .withIndex('by_sku', (q) => q.eq('sku', sku))
    .unique()

  if (existing && existing._id !== exceptId) {
    throw new ConvexError('A variant already uses this SKU.')
  }
}

async function mediaWithUrls(ctx: QueryCtx, assets: Doc<'mediaAssets'>[]) {
  const visibleAssets = assets.filter((asset) => asset.deletedAt === undefined)

  return await Promise.all(
    visibleAssets.map(async (asset) => ({
      ...asset,
      url: await ctx.storage.getUrl(asset.storageId),
    })),
  )
}

export const getWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireAdminProfile(ctx)
    const [
      categories,
      products,
      variants,
      mediaAssets,
      settings,
      homepageContent,
      recentActivity,
      recentInventoryMovements,
      coupons,
    ] = await Promise.all([
      ctx.db.query('categories').collect(),
      ctx.db.query('products').collect(),
      ctx.db.query('productVariants').collect(),
      ctx.db.query('mediaAssets').collect(),
      ctx.db
        .query('siteSettings')
        .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
        .unique(),
      ctx.db
        .query('siteContent')
        .withIndex('by_key', (q) => q.eq('key', DEFAULT_HOME_CONTENT_KEY))
        .unique(),
      ctx.db.query('adminActivityLogs').order('desc').take(12),
      ctx.db.query('inventoryMovements').order('desc').take(12),
      ctx.db.query('coupons').collect(),
    ])

    return {
      profile,
      categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
      products: products.sort((a, b) => a.sortOrder - b.sortOrder),
      variants: variants.sort((a, b) => a.name.localeCompare(b.name)),
      mediaAssets: await mediaWithUrls(ctx, mediaAssets),
      siteSettings: {
        ...defaultSiteSettings,
        ...settings,
        _id: settings?._id ?? null,
      },
      homepageContent: {
        ...defaultHomepageContent,
        ...homepageContent,
        _id: homepageContent?._id ?? null,
      },
      recentActivity,
      recentInventoryMovements,
      coupons: coupons.sort((a, b) => a.code.localeCompare(b.code)),
    }
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdminProfile(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const saveUploadedMedia = mutation({
  args: {
    storageId: v.string(),
    filename: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
    altText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const now = Date.now()
    const mediaId = await ctx.db.insert('mediaAssets', {
      storageId: args.storageId,
      filename: args.filename.trim() || 'uploaded-file',
      contentType: args.contentType || 'application/octet-stream',
      sizeBytes: Math.max(0, args.sizeBytes),
      altText: cleanOptionalText(args.altText),
      uploadedByProfileId: actor._id,
      createdAt: now,
    })

    await logActivity(ctx, actor, 'create', 'mediaAssets', mediaId)

    return mediaId
  },
})

export const softDeleteMedia = mutation({
  args: {
    id: v.id('mediaAssets'),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const asset = await ctx.db.get(args.id)

    if (!asset) {
      throw new ConvexError('Media asset not found.')
    }

    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
      deletedByProfileId: actor._id,
    })
    await logActivity(ctx, actor, 'delete', 'mediaAssets', args.id)

    return args.id
  },
})

export const upsertCategory = mutation({
  args: {
    id: v.optional(v.id('categories')),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentCategoryId: v.optional(v.id('categories')),
    imageId: v.optional(v.id('mediaAssets')),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const name = args.name.trim()
    const slug = args.slug.trim()

    if (!name) {
      throw new ConvexError('Category name is required.')
    }

    assertValidSlug(slug)
    await assertUniqueCategorySlug(ctx, slug, args.id)

    if (args.id) {
      const existing = await ctx.db.get(args.id)

      if (!existing) {
        throw new ConvexError('Category not found.')
      }

      if (args.parentCategoryId === args.id) {
        throw new ConvexError('A category cannot be its own parent.')
      }

      await ctx.db.patch(args.id, {
        name,
        slug,
        description: cleanOptionalText(args.description),
        parentCategoryId: args.parentCategoryId,
        imageId: args.imageId,
        sortOrder: args.sortOrder,
        isActive: args.isActive,
        updatedAt: Date.now(),
      })
      await logActivity(ctx, actor, 'update', 'categories', args.id)

      return args.id
    }

    const now = Date.now()
    const categoryId = await ctx.db.insert('categories', {
      name,
      slug,
      description: cleanOptionalText(args.description),
      parentCategoryId: args.parentCategoryId,
      imageId: args.imageId,
      sortOrder: args.sortOrder,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, actor, 'create', 'categories', categoryId)

    return categoryId
  },
})

export const deleteCategory = mutation({
  args: {
    id: v.id('categories'),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const category = await ctx.db.get(args.id)

    if (!category) {
      throw new ConvexError('Category not found.')
    }

    const productUsingCategory = await ctx.db
      .query('products')
      .withIndex('by_category_status', (q) => q.eq('categoryId', args.id))
      .first()

    if (productUsingCategory) {
      await ctx.db.patch(args.id, {
        isActive: false,
        updatedAt: Date.now(),
      })
      await logActivity(ctx, actor, 'delete', 'categories', args.id, {
        mode: 'deactivated',
      })
      return args.id
    }

    await ctx.db.delete(args.id)
    await logActivity(ctx, actor, 'delete', 'categories', args.id, {
      mode: 'deleted',
    })

    return args.id
  },
})

export const upsertProduct = mutation({
  args: {
    id: v.optional(v.id('products')),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id('categories')),
    status: productStatus,
    featuredImageId: v.optional(v.id('mediaAssets')),
    galleryImageIds: v.array(v.id('mediaAssets')),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const name = args.name.trim()
    const slug = args.slug.trim()

    if (!name) {
      throw new ConvexError('Product name is required.')
    }

    assertValidSlug(slug)
    await assertUniqueProductSlug(ctx, slug, args.id)

    if (args.id) {
      const product = await ctx.db.get(args.id)

      if (!product) {
        throw new ConvexError('Product not found.')
      }

      await ctx.db.patch(args.id, {
        name,
        slug,
        description: cleanOptionalText(args.description),
        categoryId: args.categoryId,
        status: args.status,
        featuredImageId: args.featuredImageId,
        galleryImageIds: args.galleryImageIds,
        seoTitle: cleanOptionalText(args.seoTitle),
        seoDescription: cleanOptionalText(args.seoDescription),
        sortOrder: args.sortOrder,
        updatedAt: Date.now(),
      })
      await logActivity(ctx, actor, 'update', 'products', args.id, {
        status: args.status,
      })

      return args.id
    }

    const now = Date.now()
    const productId = await ctx.db.insert('products', {
      name,
      slug,
      description: cleanOptionalText(args.description),
      categoryId: args.categoryId,
      status: args.status,
      featuredImageId: args.featuredImageId,
      galleryImageIds: args.galleryImageIds,
      seoTitle: cleanOptionalText(args.seoTitle),
      seoDescription: cleanOptionalText(args.seoDescription),
      sortOrder: args.sortOrder,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, actor, 'create', 'products', productId, {
      status: args.status,
    })

    return productId
  },
})

export const archiveProduct = mutation({
  args: {
    id: v.id('products'),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const product = await ctx.db.get(args.id)

    if (!product) {
      throw new ConvexError('Product not found.')
    }

    await ctx.db.patch(args.id, {
      status: 'archived',
      updatedAt: Date.now(),
    })
    await logActivity(ctx, actor, 'archive', 'products', args.id)

    return args.id
  },
})

export const upsertVariant = mutation({
  args: {
    id: v.optional(v.id('productVariants')),
    productId: v.id('products'),
    sku: v.string(),
    name: v.string(),
    optionValues: v.array(optionValue),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    initialStock: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
    weightGrams: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const sku = args.sku.trim().toUpperCase()
    const name = args.name.trim()

    if (!sku || !name) {
      throw new ConvexError('Variant SKU and name are required.')
    }

    assertMoneyAmount(args.price)

    if (args.compareAtPrice !== undefined) {
      assertMoneyAmount(args.compareAtPrice)
    }

    if (args.lowStockThreshold !== undefined) {
      assertNonNegativeQuantity(args.lowStockThreshold)
    }

    if (args.weightGrams !== undefined) {
      assertNonNegativeQuantity(args.weightGrams)
    }

    await assertUniqueSku(ctx, sku, args.id)

    const product = await ctx.db.get(args.productId)

    if (!product) {
      throw new ConvexError('Product not found.')
    }

    const optionValues = args.optionValues
      .map((option) => ({
        name: option.name.trim(),
        value: option.value.trim(),
      }))
      .filter((option) => option.name && option.value)

    if (args.id) {
      const variant = await ctx.db.get(args.id)

      if (!variant) {
        throw new ConvexError('Variant not found.')
      }

      await ctx.db.patch(args.id, {
        productId: args.productId,
        sku,
        name,
        optionValues,
        price: args.price,
        compareAtPrice: args.compareAtPrice,
        lowStockThreshold: args.lowStockThreshold,
        weightGrams: args.weightGrams,
        isActive: args.isActive,
        updatedAt: Date.now(),
      })
      await logActivity(ctx, actor, 'update', 'productVariants', args.id)

      return args.id
    }

    const initialStock = args.initialStock ?? 0
    assertNonNegativeQuantity(initialStock)

    const now = Date.now()
    const variantId = await ctx.db.insert('productVariants', {
      productId: args.productId,
      sku,
      name,
      optionValues,
      price: args.price,
      compareAtPrice: args.compareAtPrice,
      stockOnHand: initialStock,
      reservedStock: 0,
      lowStockThreshold: args.lowStockThreshold,
      weightGrams: args.weightGrams,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    })

    if (initialStock !== 0) {
      await ctx.db.insert('inventoryMovements', {
        variantId,
        type: 'adjustment',
        quantityDelta: initialStock,
        stockAfter: initialStock,
        reason: 'Initial stock',
        actorProfileId: actor._id,
        createdAt: now,
      })
    }

    await logActivity(ctx, actor, 'create', 'productVariants', variantId, {
      initialStock,
    })

    return variantId
  },
})

export const deactivateVariant = mutation({
  args: {
    id: v.id('productVariants'),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const variant = await ctx.db.get(args.id)

    if (!variant) {
      throw new ConvexError('Variant not found.')
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    })
    await logActivity(ctx, actor, 'delete', 'productVariants', args.id, {
      mode: 'deactivated',
    })

    return args.id
  },
})

export const adjustInventory = mutation({
  args: {
    variantId: v.id('productVariants'),
    quantityDelta: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const variant = await ctx.db.get(args.variantId)

    if (!variant) {
      throw new ConvexError('Variant not found.')
    }

    if (!Number.isInteger(args.quantityDelta) || args.quantityDelta === 0) {
      throw new ConvexError('Inventory adjustment must be a non-zero integer.')
    }

    const stockAfter = variant.stockOnHand + args.quantityDelta

    if (stockAfter < 0) {
      throw new ConvexError('Stock cannot be adjusted below zero.')
    }

    const now = Date.now()
    await ctx.db.patch(args.variantId, {
      stockOnHand: stockAfter,
      updatedAt: now,
    })
    await ctx.db.insert('inventoryMovements', {
      variantId: args.variantId,
      type: 'adjustment',
      quantityDelta: args.quantityDelta,
      stockAfter,
      reason: cleanOptionalText(args.reason),
      actorProfileId: actor._id,
      createdAt: now,
    })
    await logActivity(
      ctx,
      actor,
      'update',
      'inventoryMovements',
      args.variantId,
      {
        quantityDelta: args.quantityDelta,
        stockAfter,
      },
    )

    return stockAfter
  },
})

export const updateSiteSettings = mutation({
  args: {
    storeName: v.string(),
    logoImageId: v.optional(v.id('mediaAssets')),
    faviconImageId: v.optional(v.id('mediaAssets')),
    supportEmail: v.string(),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    pendingPaymentExpiryMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requireSuperadminProfile(ctx)
    const storeName = args.storeName.trim()
    const supportEmail = args.supportEmail.trim().toLowerCase()

    if (!storeName) {
      throw new ConvexError('Store name is required.')
    }

    if (!supportEmail.includes('@')) {
      throw new ConvexError('Support email must be valid.')
    }

    assertPositiveInteger(
      args.pendingPaymentExpiryMinutes,
      'Pending payment expiry must be a positive whole number of minutes.',
    )

    const now = Date.now()
    const existing = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        storeName,
        logoImageId: args.logoImageId,
        faviconImageId: args.faviconImageId,
        supportEmail,
        seoTitle: cleanOptionalText(args.seoTitle),
        seoDescription: cleanOptionalText(args.seoDescription),
        pendingPaymentExpiryMinutes: args.pendingPaymentExpiryMinutes,
        updatedAt: now,
      })
      await logActivity(ctx, actor, 'update', 'siteSettings', existing._id)
      return existing._id
    }

    const settingsId = await ctx.db.insert('siteSettings', {
      ...defaultSiteSettings,
      storeName,
      logoImageId: args.logoImageId,
      faviconImageId: args.faviconImageId,
      supportEmail,
      seoTitle: cleanOptionalText(args.seoTitle),
      seoDescription: cleanOptionalText(args.seoDescription),
      pendingPaymentExpiryMinutes: args.pendingPaymentExpiryMinutes,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, actor, 'create', 'siteSettings', settingsId)

    return settingsId
  },
})

export const updateHomepageContent = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    heroImageId: v.optional(v.id('mediaAssets')),
    heroCtaLabel: v.optional(v.string()),
    heroCtaHref: v.optional(v.string()),
    featuredCategorySlugs: v.array(v.string()),
    homepageBanners: v.array(bannerInput),
    announcement: v.optional(v.string()),
    aboutText: v.optional(v.string()),
    footerText: v.optional(v.string()),
    status: contentStatus,
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const title = args.title.trim()

    if (!title) {
      throw new ConvexError('Hero title is required.')
    }

    const now = Date.now()
    const featuredCategorySlugs = args.featuredCategorySlugs
      .map((slug) => slug.trim())
      .filter(Boolean)

    for (const slug of featuredCategorySlugs) {
      assertValidSlug(slug)
    }

    const homepageBanners = args.homepageBanners
      .map((banner) => ({
        title: banner.title.trim(),
        body: cleanOptionalText(banner.body),
        imageId: banner.imageId,
        href: cleanOptionalText(banner.href),
      }))
      .filter((banner) => banner.title)

    const patch = {
      title,
      subtitle: cleanOptionalText(args.subtitle),
      heroImageId: args.heroImageId,
      heroCtaLabel: cleanOptionalText(args.heroCtaLabel),
      heroCtaHref: cleanOptionalText(args.heroCtaHref),
      featuredCategorySlugs,
      homepageBanners,
      announcement: cleanOptionalText(args.announcement),
      aboutText: cleanOptionalText(args.aboutText),
      footerText: cleanOptionalText(args.footerText),
      status: args.status,
      publishedAt: args.status === 'published' ? now : undefined,
      updatedAt: now,
    }

    const existing = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', DEFAULT_HOME_CONTENT_KEY))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, patch)
      await logActivity(ctx, actor, 'update', 'siteContent', existing._id, {
        status: args.status,
      })
      return existing._id
    }

    const contentId = await ctx.db.insert('siteContent', {
      key: DEFAULT_HOME_CONTENT_KEY,
      ...patch,
      createdAt: now,
    })

    await logActivity(ctx, actor, 'create', 'siteContent', contentId, {
      status: args.status,
    })

    return contentId
  },
})

export const upsertCoupon = mutation({
  args: {
    id: v.optional(v.id('coupons')),
    code: v.string(),
    type: couponType,
    value: v.number(),
    currency: v.optional(v.string()),
    minSubtotal: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    usageLimitPerCustomer: v.optional(v.number()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const code = args.code.trim().toUpperCase()

    if (!code) {
      throw new ConvexError('Coupon code is required.')
    }

    if (!COUPON_TYPES.includes(args.type)) {
      throw new ConvexError('Coupon type is invalid.')
    }

    assertMoneyAmount(args.value)
    for (const amount of [args.minSubtotal, args.maxDiscount]) {
      if (amount !== undefined) assertMoneyAmount(amount)
    }
    for (const limit of [args.usageLimit, args.usageLimitPerCustomer]) {
      if (
        limit !== undefined &&
        (!Number.isInteger(limit) || limit <= 0)
      ) {
        throw new ConvexError('Coupon limits must be positive whole numbers.')
      }
    }
    if (
      args.startsAt !== undefined &&
      args.endsAt !== undefined &&
      args.startsAt >= args.endsAt
    ) {
      throw new ConvexError('Coupon start must be before its end.')
    }

    const existing = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', code))
      .unique()
    if (existing && existing._id !== args.id) {
      throw new ConvexError('A coupon already uses this code.')
    }

    const now = Date.now()
    const patch = {
      code,
      type: args.type,
      value: args.value,
      currency: args.currency?.trim().toUpperCase() || undefined,
      minSubtotal: args.minSubtotal,
      maxDiscount: args.maxDiscount,
      usageLimit: args.usageLimit,
      usageLimitPerCustomer: args.usageLimitPerCustomer,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      isActive: args.isActive,
      updatedAt: now,
    }

    if (args.id) {
      const coupon = await ctx.db.get(args.id)
      if (!coupon) throw new ConvexError('Coupon not found.')
      await ctx.db.patch(args.id, patch)
      await logActivity(ctx, actor, 'update', 'coupons', args.id)
      return args.id
    }

    const couponId = await ctx.db.insert('coupons', {
      ...patch,
      redeemedCount: 0,
      createdAt: now,
    })
    await logActivity(ctx, actor, 'create', 'coupons', couponId)
    return couponId
  },
})

export const setCouponActive = mutation({
  args: { id: v.id('coupons'), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const actor = await requireAdminProfile(ctx)
    const coupon = await ctx.db.get(args.id)
    if (!coupon) throw new ConvexError('Coupon not found.')
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    })
    await logActivity(ctx, actor, 'update', 'coupons', args.id, {
      isActive: args.isActive,
    })
    return args.id
  },
})
