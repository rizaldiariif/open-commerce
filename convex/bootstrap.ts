import type { Id } from './_generated/dataModel'
import { mutation } from './_generated/server'
import {
  assertMoneyAmount,
  assertNonNegativeQuantity,
  defaultEmailTemplates,
  defaultHomepageContent,
  defaultSiteSettings,
  EMAIL_TEMPLATE_KEYS,
  DEFAULT_HOME_CONTENT_KEY,
  DEFAULT_SITE_SETTINGS_KEY,
} from './domain'

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const existingSettings = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', DEFAULT_SITE_SETTINGS_KEY))
      .unique()

    if (!existingSettings) {
      await ctx.db.insert('siteSettings', {
        ...defaultSiteSettings,
        createdAt: now,
        updatedAt: now,
      })
    }

    const existingHomepage = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', DEFAULT_HOME_CONTENT_KEY))
      .unique()

    if (!existingHomepage) {
      await ctx.db.insert('siteContent', {
        ...defaultHomepageContent,
        status: 'published',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })
    }

    let emailTemplates = 0
    for (const key of EMAIL_TEMPLATE_KEYS) {
      const existingTemplate = await ctx.db
        .query('emailTemplates')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique()
      if (existingTemplate) continue

      await ctx.db.insert('emailTemplates', {
        key,
        ...defaultEmailTemplates[key],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      emailTemplates += 1
    }

    return {
      siteSettings: existingSettings ? 'exists' : 'created',
      homepageContent: existingHomepage ? 'exists' : 'created',
      emailTemplates,
    }
  },
})

const demoCategories = [
  {
    name: 'Daily Carry',
    slug: 'daily-carry',
    description: 'Functional pieces for workdays, errands, and travel.',
    sortOrder: 10,
  },
  {
    name: 'Home Rituals',
    slug: 'home-rituals',
    description: 'Small comforts for thoughtful daily routines.',
    sortOrder: 20,
  },
] as const

const demoProducts = [
  {
    name: 'Canvas Market Tote',
    slug: 'canvas-market-tote',
    description:
      'A structured cotton canvas tote sized for laptops, groceries, and weekend finds.',
    categorySlug: 'daily-carry',
    seoTitle: 'Canvas Market Tote | Muse Commerce',
    seoDescription:
      'A durable cotton canvas tote for everyday carry and market trips.',
    sortOrder: 10,
    variants: [
      {
        sku: 'MUSE-TOTE-NATURAL',
        name: 'Natural',
        optionValues: [{ name: 'Color', value: 'Natural' }],
        price: 249000,
        compareAtPrice: 299000,
        initialStock: 24,
        lowStockThreshold: 5,
        weightGrams: 450,
      },
      {
        sku: 'MUSE-TOTE-INK',
        name: 'Ink',
        optionValues: [{ name: 'Color', value: 'Ink' }],
        price: 249000,
        compareAtPrice: undefined,
        initialStock: 18,
        lowStockThreshold: 5,
        weightGrams: 450,
      },
    ],
  },
  {
    name: 'Ceramic Desk Cup',
    slug: 'ceramic-desk-cup',
    description:
      'A hand-finished ceramic cup for coffee, tea, or keeping pens close at hand.',
    categorySlug: 'home-rituals',
    seoTitle: 'Ceramic Desk Cup | Muse Commerce',
    seoDescription: 'A simple ceramic desk cup for daily rituals.',
    sortOrder: 20,
    variants: [
      {
        sku: 'MUSE-CUP-ASH',
        name: 'Ash',
        optionValues: [{ name: 'Color', value: 'Ash' }],
        price: 179000,
        compareAtPrice: undefined,
        initialStock: 30,
        lowStockThreshold: 6,
        weightGrams: 320,
      },
      {
        sku: 'MUSE-CUP-MILK',
        name: 'Milk',
        optionValues: [{ name: 'Color', value: 'Milk' }],
        price: 179000,
        compareAtPrice: undefined,
        initialStock: 28,
        lowStockThreshold: 6,
        weightGrams: 320,
      },
    ],
  },
] as const

const demoCoupon = {
  code: 'LAUNCH10',
  type: 'percentage' as const,
  value: 10,
  currency: 'IDR',
  minSubtotal: 200000,
  maxDiscount: 50000,
  usageLimit: 100,
  usageLimitPerCustomer: 1,
}

export const seedDemoCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    let categoriesCreated = 0
    let productsCreated = 0
    let variantsCreated = 0
    let inventoryMovementsCreated = 0

    const categoriesBySlug = new Map<string, Id<'categories'>>()

    for (const category of demoCategories) {
      const existing = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', category.slug))
        .unique()

      if (existing) {
        categoriesBySlug.set(category.slug, existing._id)
        continue
      }

      const categoryId = await ctx.db.insert('categories', {
        ...category,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      categoriesBySlug.set(category.slug, categoryId)
      categoriesCreated += 1
    }

    for (const product of demoProducts) {
      const existing = await ctx.db
        .query('products')
        .withIndex('by_slug', (q) => q.eq('slug', product.slug))
        .unique()

      let productId = existing?._id

      if (!productId) {
        productId = await ctx.db.insert('products', {
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: categoriesBySlug.get(product.categorySlug),
          status: 'active',
          galleryImageIds: [],
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          sortOrder: product.sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        productsCreated += 1
      }

      for (const variant of product.variants) {
        const sku = variant.sku.trim().toUpperCase()
        const existingVariant = await ctx.db
          .query('productVariants')
          .withIndex('by_sku', (q) => q.eq('sku', sku))
          .unique()

        if (existingVariant) continue

        assertMoneyAmount(variant.price)
        if (variant.compareAtPrice !== undefined) {
          assertMoneyAmount(variant.compareAtPrice)
        }
        assertNonNegativeQuantity(variant.initialStock)

        const variantId = await ctx.db.insert('productVariants', {
          productId,
          sku,
          name: variant.name,
          optionValues: variant.optionValues.map((option) => ({ ...option })),
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stockOnHand: variant.initialStock,
          reservedStock: 0,
          lowStockThreshold: variant.lowStockThreshold,
          weightGrams: variant.weightGrams,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        variantsCreated += 1

        if (variant.initialStock > 0) {
          await ctx.db.insert('inventoryMovements', {
            variantId,
            type: 'adjustment',
            quantityDelta: variant.initialStock,
            stockAfter: variant.initialStock,
            reason: 'Launch demo catalog seed',
            createdAt: now,
          })
          inventoryMovementsCreated += 1
        }
      }
    }

    const existingCoupon = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', demoCoupon.code))
      .unique()

    if (!existingCoupon) {
      await ctx.db.insert('coupons', {
        ...demoCoupon,
        redeemedCount: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
    }

    const homepage = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', DEFAULT_HOME_CONTENT_KEY))
      .unique()

    if (homepage) {
      const featuredCategorySlugs = Array.from(
        new Set([
          ...homepage.featuredCategorySlugs,
          ...demoCategories.map((category) => category.slug),
        ]),
      )

      await ctx.db.patch(homepage._id, {
        featuredCategorySlugs,
        homepageBanners: homepage.homepageBanners?.length
          ? homepage.homepageBanners
          : [
              {
                title: 'Launch collection',
                body: 'Starter products for checkout, coupon, payment, and fulfillment QA.',
                href: '/products',
              },
            ],
        updatedAt: now,
      })
    }

    return {
      categoriesCreated,
      productsCreated,
      variantsCreated,
      inventoryMovementsCreated,
      coupon: existingCoupon ? 'exists' : 'created',
    }
  },
})
