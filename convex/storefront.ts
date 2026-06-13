import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'

import type { Doc, Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  assertPositiveQuantity,
  defaultHomepageContent,
  defaultSiteSettings,
  DEFAULT_HOME_CONTENT_KEY,
  DEFAULT_SITE_SETTINGS_KEY,
} from './domain'

async function getCurrentProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)

  if (!userId) {
    return null
  }

  return await ctx.db
    .query('profiles')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .unique()
}

async function requireCustomerProfile(ctx: QueryCtx | MutationCtx) {
  const profile = await getCurrentProfile(ctx)

  if (!profile) {
    throw new ConvexError('Sign in before using the cart.')
  }

  return profile
}

async function getMediaUrl(
  ctx: QueryCtx | MutationCtx,
  id: Id<'mediaAssets'> | undefined,
) {
  if (!id) {
    return undefined
  }

  const asset = await ctx.db.get(id)

  if (!asset || asset.deletedAt !== undefined) {
    return undefined
  }

  return (await ctx.storage.getUrl(asset.storageId)) ?? undefined
}

async function productImageUrl(
  ctx: QueryCtx | MutationCtx,
  product: Doc<'products'>,
) {
  return await getMediaUrl(
    ctx,
    product.featuredImageId ?? product.galleryImageIds[0],
  )
}

function availableStock(variant: Doc<'productVariants'>) {
  return Math.max(0, variant.stockOnHand - variant.reservedStock)
}

async function productSummary(ctx: QueryCtx, product: Doc<'products'>) {
  const variants = (
    await ctx.db
      .query('productVariants')
      .withIndex('by_product', (q) => q.eq('productId', product._id))
      .collect()
  )
    .filter((variant) => variant.isActive)
    .sort((a, b) => a.price - b.price)

  const category = product.categoryId
    ? await ctx.db.get(product.categoryId)
    : undefined
  const activeVariants = variants.filter(
    (variant) => availableStock(variant) > 0,
  )

  return {
    ...product,
    category: category?.isActive ? category : null,
    imageUrl: await productImageUrl(ctx, product),
    minPrice: variants[0]?.price ?? null,
    compareAtPrice: variants.find((variant) => variant.compareAtPrice)
      ?.compareAtPrice,
    variantCount: variants.length,
    inStock: activeVariants.length > 0,
    totalAvailableStock: activeVariants.reduce(
      (total, variant) => total + availableStock(variant),
      0,
    ),
  }
}

async function getActiveProducts(ctx: QueryCtx) {
  return await ctx.db
    .query('products')
    .withIndex('by_status_sort', (q) => q.eq('status', 'active'))
    .collect()
}

export const getHome = query({
  args: {},
  handler: async (ctx) => {
    const [settings, content] = await Promise.all([
      ctx.db
        .query('siteSettings')
        .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
        .unique(),
      ctx.db
        .query('siteContent')
        .withIndex('by_key', (q) => q.eq('key', DEFAULT_HOME_CONTENT_KEY))
        .unique(),
    ])
    const homeContent =
      content?.status === 'published'
        ? { ...defaultHomepageContent, ...content }
        : defaultHomepageContent
    const activeProducts = (await getActiveProducts(ctx)).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    )
    const featuredProducts = homeContent.featuredCategorySlugs.length
      ? (
          await Promise.all(
            activeProducts.map(async (product) => {
              if (!product.categoryId) return null
              const category = await ctx.db.get(product.categoryId)
              return category &&
                homeContent.featuredCategorySlugs.includes(category.slug)
                ? product
                : null
            }),
          )
        ).filter((product) => product !== null)
      : activeProducts
    const products = featuredProducts.slice(0, 6)

    return {
      siteSettings: { ...defaultSiteSettings, ...settings },
      homepageContent: {
        ...homeContent,
        heroImageUrl: await getMediaUrl(
          ctx,
          'heroImageId' in homeContent ? homeContent.heroImageId : undefined,
        ),
        homepageBanners: await Promise.all(
          (homeContent.homepageBanners ?? []).map(async (banner) => ({
            ...banner,
            imageUrl: await getMediaUrl(ctx, banner.imageId),
          })),
        ),
      },
      featuredProducts: await Promise.all(
        products.map((product) => productSummary(ctx, product)),
      ),
    }
  },
})

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const [products, categories] = await Promise.all([
      getActiveProducts(ctx),
      ctx.db
        .query('categories')
        .withIndex('by_active_sort', (q) => q.eq('isActive', true))
        .collect(),
    ])

    return {
      categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
      products: await Promise.all(
        products
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((product) => productSummary(ctx, product)),
      ),
    }
  },
})

export const getProductBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()

    if (!product || product.status !== 'active') {
      return null
    }

    const [category, variants, galleryUrls] = await Promise.all([
      product.categoryId ? ctx.db.get(product.categoryId) : undefined,
      ctx.db
        .query('productVariants')
        .withIndex('by_product', (q) => q.eq('productId', product._id))
        .collect(),
      Promise.all(product.galleryImageIds.map((id) => getMediaUrl(ctx, id))),
    ])

    return {
      ...product,
      category: category?.isActive ? category : null,
      featuredImageUrl: await productImageUrl(ctx, product),
      galleryImageUrls: galleryUrls.filter((url) => url !== undefined),
      variants: variants
        .filter((variant) => variant.isActive)
        .sort((a, b) => a.price - b.price)
        .map((variant) => ({
          ...variant,
          availableStock: availableStock(variant),
        })),
    }
  },
})

async function getOrCreateCart(
  ctx: MutationCtx,
  profileId: Id<'profiles'>,
  currency: string,
) {
  const existing = await ctx.db
    .query('carts')
    .withIndex('by_profile_status', (q) =>
      q.eq('profileId', profileId).eq('status', 'active'),
    )
    .unique()

  if (existing) {
    return existing
  }

  const now = Date.now()
  const cartId = await ctx.db.insert('carts', {
    profileId,
    currency,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })

  return (await ctx.db.get(cartId))!
}

async function cartDetails(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<'profiles'>,
) {
  const cart = await ctx.db
    .query('carts')
    .withIndex('by_profile_status', (q) =>
      q.eq('profileId', profileId).eq('status', 'active'),
    )
    .unique()

  if (!cart) {
    return null
  }

  const items = await ctx.db
    .query('cartItems')
    .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
    .collect()

  const details = await Promise.all(
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
        product,
        variant,
        availableStock: available,
        lineTotal: item.quantity * item.unitPrice,
        isValid: Boolean(product?.status === 'active' && variant?.isActive),
        isQuantityAvailable: item.quantity <= available,
      }
    }),
  )

  return {
    cart,
    items: details.sort((a, b) => a.createdAt - b.createdAt),
    subtotal: details.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    ),
    itemCount: details.reduce((total, item) => total + item.quantity, 0),
    canCheckout:
      details.length > 0 &&
      details.every((item) => item.isValid && item.isQuantityAvailable),
  }
}

export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getCurrentProfile(ctx)

    if (!profile) {
      return { status: 'unauthenticated' as const }
    }

    const [details, settings] = await Promise.all([
      cartDetails(ctx, profile._id),
      ctx.db
        .query('siteSettings')
        .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
        .unique(),
    ])
    const checkoutEnabled = settings?.checkoutEnabled ?? true

    return {
      status: 'ready' as const,
      profile,
      checkoutEnabled,
      cart: details
        ? {
            ...details,
            canCheckout: details.canCheckout && checkoutEnabled,
          }
        : details,
    }
  },
})

export const addToCart = mutation({
  args: {
    variantId: v.id('productVariants'),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await requireCustomerProfile(ctx)
    assertPositiveQuantity(args.quantity)

    const variant = await ctx.db.get(args.variantId)

    if (!variant || !variant.isActive) {
      throw new ConvexError('This product option is no longer available.')
    }

    const product = await ctx.db.get(variant.productId)

    if (!product || product.status !== 'active') {
      throw new ConvexError('This product is no longer available.')
    }

    const available = availableStock(variant)

    if (args.quantity > available) {
      throw new ConvexError('Requested quantity is not available.')
    }

    const settings = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
      .unique()
    const cart = await getOrCreateCart(
      ctx,
      profile._id,
      settings?.currency ?? defaultSiteSettings.currency,
    )
    const existing = await ctx.db
      .query('cartItems')
      .withIndex('by_cart_variant', (q) =>
        q.eq('cartId', cart._id).eq('variantId', variant._id),
      )
      .unique()
    const now = Date.now()
    const nextQuantity = (existing?.quantity ?? 0) + args.quantity

    if (nextQuantity > available) {
      throw new ConvexError('Cart quantity exceeds available stock.')
    }

    const imageUrl = await productImageUrl(ctx, product)

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: nextQuantity,
        unitPrice: variant.price,
        productSnapshot: {
          name: product.name,
          slug: product.slug,
          imageUrl,
        },
        variantSnapshot: {
          sku: variant.sku,
          name: variant.name,
          optionValues: variant.optionValues,
        },
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('cartItems', {
        cartId: cart._id,
        productId: product._id,
        variantId: variant._id,
        quantity: args.quantity,
        unitPrice: variant.price,
        productSnapshot: {
          name: product.name,
          slug: product.slug,
          imageUrl,
        },
        variantSnapshot: {
          sku: variant.sku,
          name: variant.name,
          optionValues: variant.optionValues,
        },
        createdAt: now,
        updatedAt: now,
      })
    }

    await ctx.db.patch(cart._id, { updatedAt: now })

    return await cartDetails(ctx, profile._id)
  },
})

export const updateCartItem = mutation({
  args: {
    cartItemId: v.id('cartItems'),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await requireCustomerProfile(ctx)
    assertPositiveQuantity(args.quantity)

    const details = await cartDetails(ctx, profile._id)
    const item = details?.items.find(
      (cartItem) => cartItem._id === args.cartItemId,
    )

    if (!details || !item) {
      throw new ConvexError('Cart item not found.')
    }

    if (!item.isValid) {
      await ctx.db.delete(args.cartItemId)
      return await cartDetails(ctx, profile._id)
    }

    if (args.quantity > item.availableStock) {
      throw new ConvexError('Requested quantity is not available.')
    }

    const now = Date.now()
    await ctx.db.patch(args.cartItemId, {
      quantity: args.quantity,
      unitPrice: item.variant!.price,
      updatedAt: now,
    })
    await ctx.db.patch(details.cart._id, { updatedAt: now })

    return await cartDetails(ctx, profile._id)
  },
})

export const removeCartItem = mutation({
  args: {
    cartItemId: v.id('cartItems'),
  },
  handler: async (ctx, args) => {
    const profile = await requireCustomerProfile(ctx)
    const details = await cartDetails(ctx, profile._id)
    const item = details?.items.find(
      (cartItem) => cartItem._id === args.cartItemId,
    )

    if (!details || !item) {
      throw new ConvexError('Cart item not found.')
    }

    await ctx.db.delete(args.cartItemId)
    await ctx.db.patch(details.cart._id, { updatedAt: Date.now() })

    return await cartDetails(ctx, profile._id)
  },
})
