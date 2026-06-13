import {
  makeFunctionReference,
  type FunctionReference,
} from 'convex/server'
import { v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import { action, internalMutation, mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
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

const destructiveSeedConfirm = 'RESET_MUSE_DEMO_DATA' as const
const pexelsLicense = 'Pexels License: free use, no attribution required'

const stockImages = [
  {
    key: 'hero',
    filename: 'muse-plain-canvas-tote.jpg',
    contentType: 'image/jpeg',
    width: 1400,
    height: 933,
    altText: 'Plain canvas tote bag on a neutral background.',
    sourceProvider: 'Pexels',
    sourceLicense: pexelsLicense,
    sourcePage: 'https://www.pexels.com/photo/plain-tote-bag-9869067/',
    sourceUrl:
      'https://images.pexels.com/photos/9869067/pexels-photo-9869067.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    key: 'mug',
    filename: 'muse-white-ceramic-mug.jpg',
    contentType: 'image/jpeg',
    width: 1400,
    height: 933,
    altText: 'White ceramic mug on a clean tabletop.',
    sourceProvider: 'Pexels',
    sourceLicense: pexelsLicense,
    sourcePage:
      'https://www.pexels.com/photo/a-white-ceramic-mug-on-a-white-surface-11075707/',
    sourceUrl:
      'https://images.pexels.com/photos/11075707/pexels-photo-11075707.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    key: 'notebook',
    filename: 'muse-grey-felt-journal.jpg',
    contentType: 'image/jpeg',
    width: 1400,
    height: 933,
    altText: 'Grey felt journal on a white desk.',
    sourceProvider: 'Pexels',
    sourceLicense: pexelsLicense,
    sourcePage:
      'https://www.pexels.com/photo/grey-felt-journal-to-do-list-on-a-white-desk-6423/',
    sourceUrl:
      'https://images.pexels.com/photos/6423/desk-notebook-office-grey.jpg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    key: 'candle',
    filename: 'muse-ceramic-soy-candle.jpg',
    contentType: 'image/jpeg',
    width: 1094,
    height: 1400,
    altText: 'Ceramic soy candle held in natural light.',
    sourceProvider: 'Pexels',
    sourceLicense: pexelsLicense,
    sourcePage:
      'https://www.pexels.com/photo/soy-wax-candle-home-decor-27911353/',
    sourceUrl:
      'https://images.pexels.com/photos/27911353/pexels-photo-27911353.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
] as const

type StockImageKey = (typeof stockImages)[number]['key']

type SeededImage = {
  key: StockImageKey
  storageId: string
  filename: string
  contentType: string
  sizeBytes: number
  altText: string
  width: number
  height: number
  sourceProvider: string
  sourceLicense: string
  sourcePage: string
  sourceUrl: string
}

type ReplaceCommerceDataResult = {
  deleted: Record<string, number>
  inserted: Record<string, number>
  oldStorageIds: string[]
}

type ResetAndSeedDemoResult = Omit<
  ReplaceCommerceDataResult,
  'oldStorageIds'
> & {
  oldStorageFilesDeleted: number
  oldStorageDeleteFailures: number
}

const replaceCommerceDataRef = makeFunctionReference(
  'bootstrap:replaceCommerceData',
) as unknown as FunctionReference<
  'mutation',
  'internal',
  { images: SeededImage[] },
  ReplaceCommerceDataResult
>

const stockImageKey = v.union(
  v.literal('hero'),
  v.literal('mug'),
  v.literal('notebook'),
  v.literal('candle'),
)

const seededImageInput = v.object({
  key: stockImageKey,
  storageId: v.string(),
  filename: v.string(),
  contentType: v.string(),
  sizeBytes: v.number(),
  altText: v.string(),
  width: v.number(),
  height: v.number(),
  sourceProvider: v.string(),
  sourceLicense: v.string(),
  sourcePage: v.string(),
  sourceUrl: v.string(),
})

export const resetAndSeedDemo = action({
  args: {
    seedToken: v.string(),
    confirm: v.literal(destructiveSeedConfirm),
  },
  handler: async (ctx, args): Promise<ResetAndSeedDemoResult> => {
    const expectedToken = process.env.SEED_TOKEN

    if (!expectedToken) {
      throw new Error('SEED_TOKEN is not configured.')
    }

    if (args.seedToken !== expectedToken) {
      throw new Error('Invalid seed token.')
    }

    const uploadedStorageIds: string[] = []

    try {
      const images: SeededImage[] = []

      for (const image of stockImages) {
        const response = await fetch(image.sourceUrl)

        if (!response.ok) {
          throw new Error(
            `Unable to download seed image ${image.filename}: ${response.status}`,
          )
        }

        const remoteBlob = await response.blob()
        const contentType =
          response.headers.get('content-type')?.split(';')[0] ??
          image.contentType
        const storageBlob =
          remoteBlob.type === contentType
            ? remoteBlob
            : new Blob([await remoteBlob.arrayBuffer()], { type: contentType })
        const storageId = String(await ctx.storage.store(storageBlob))
        uploadedStorageIds.push(storageId)

        images.push({
          key: image.key,
          storageId,
          filename: image.filename,
          contentType,
          sizeBytes: storageBlob.size,
          altText: image.altText,
          width: image.width,
          height: image.height,
          sourceProvider: image.sourceProvider,
          sourceLicense: image.sourceLicense,
          sourcePage: image.sourcePage,
          sourceUrl: image.sourceUrl,
        })
      }

      const result = await ctx.runMutation(replaceCommerceDataRef, { images })
      const { oldStorageIds, ...summary } = result
      let oldStorageFilesDeleted = 0
      let oldStorageDeleteFailures = 0

      for (const storageId of oldStorageIds) {
        try {
          await ctx.storage.delete(storageId)
          oldStorageFilesDeleted += 1
        } catch {
          oldStorageDeleteFailures += 1
        }
      }

      return {
        ...summary,
        oldStorageFilesDeleted,
        oldStorageDeleteFailures,
      }
    } catch (error) {
      await Promise.all(
        uploadedStorageIds.map(async (storageId) => {
          try {
            await ctx.storage.delete(storageId)
          } catch {
            // Best-effort cleanup for images uploaded before a failed seed run.
          }
        }),
      )
      throw error
    }
  },
})

const seededCategories = [
  {
    name: 'Daily Carry',
    slug: 'daily-carry',
    description: 'Bags and small goods for errands, workdays, and travel.',
    imageKey: 'hero',
    sortOrder: 10,
  },
  {
    name: 'Home Rituals',
    slug: 'home-rituals',
    description: 'Quiet pieces for coffee, candlelight, and slow mornings.',
    imageKey: 'candle',
    sortOrder: 20,
  },
  {
    name: 'Workspace',
    slug: 'workspace',
    description: 'Desk objects that keep notes, tools, and ideas in reach.',
    imageKey: 'notebook',
    sortOrder: 30,
  },
] as const

const seededProducts = [
  {
    name: 'Canvas Market Tote',
    slug: 'canvas-market-tote',
    description:
      'A sturdy cotton canvas tote with a clean silhouette for market runs, laptops, and everyday carry.',
    categorySlug: 'daily-carry',
    imageKey: 'hero',
    galleryImageKeys: ['hero'],
    seoTitle: 'Canvas Market Tote | Muse Studio',
    seoDescription:
      'A structured cotton canvas tote made for daily carry and weekend errands.',
    sortOrder: 10,
    variants: [
      {
        sku: 'MUSE-TOTE-NATURAL',
        name: 'Natural',
        optionValues: [{ name: 'Color', value: 'Natural' }],
        price: 249000,
        compareAtPrice: 299000,
        stockOnHand: 24,
        lowStockThreshold: 5,
        weightGrams: 450,
      },
      {
        sku: 'MUSE-TOTE-INK',
        name: 'Ink',
        optionValues: [{ name: 'Color', value: 'Ink' }],
        price: 249000,
        stockOnHand: 16,
        lowStockThreshold: 5,
        weightGrams: 450,
      },
    ],
  },
  {
    name: 'Ceramic Desk Mug',
    slug: 'ceramic-desk-mug',
    description:
      'A simple ceramic mug for coffee, tea, and the kind of desk rituals that make work feel lighter.',
    categorySlug: 'home-rituals',
    imageKey: 'mug',
    galleryImageKeys: ['mug'],
    seoTitle: 'Ceramic Desk Mug | Muse Studio',
    seoDescription: 'A clean white ceramic mug for daily drinks and desk use.',
    sortOrder: 20,
    variants: [
      {
        sku: 'MUSE-MUG-MILK',
        name: 'Milk',
        optionValues: [{ name: 'Color', value: 'Milk' }],
        price: 179000,
        stockOnHand: 30,
        lowStockThreshold: 6,
        weightGrams: 320,
      },
      {
        sku: 'MUSE-MUG-FOG',
        name: 'Fog',
        optionValues: [{ name: 'Color', value: 'Fog' }],
        price: 179000,
        stockOnHand: 22,
        lowStockThreshold: 6,
        weightGrams: 320,
      },
    ],
  },
  {
    name: 'Grey Felt Journal',
    slug: 'grey-felt-journal',
    description:
      'A soft-cover journal for lists, sketches, and loose plans, finished with a tactile felt wrap.',
    categorySlug: 'workspace',
    imageKey: 'notebook',
    galleryImageKeys: ['notebook'],
    seoTitle: 'Grey Felt Journal | Muse Studio',
    seoDescription:
      'A tactile grey felt journal for notes, sketches, and planning.',
    sortOrder: 30,
    variants: [
      {
        sku: 'MUSE-JOURNAL-A5',
        name: 'A5',
        optionValues: [{ name: 'Size', value: 'A5' }],
        price: 159000,
        stockOnHand: 34,
        lowStockThreshold: 8,
        weightGrams: 280,
      },
      {
        sku: 'MUSE-JOURNAL-A6',
        name: 'A6',
        optionValues: [{ name: 'Size', value: 'A6' }],
        price: 129000,
        stockOnHand: 28,
        lowStockThreshold: 8,
        weightGrams: 180,
      },
    ],
  },
  {
    name: 'Ceramic Soy Candle',
    slug: 'ceramic-soy-candle',
    description:
      'A hand-poured soy candle in a reusable ceramic vessel, made for quiet evenings and soft light.',
    categorySlug: 'home-rituals',
    imageKey: 'candle',
    galleryImageKeys: ['candle'],
    seoTitle: 'Ceramic Soy Candle | Muse Studio',
    seoDescription:
      'A ceramic soy candle for warm light and considered home rituals.',
    sortOrder: 40,
    variants: [
      {
        sku: 'MUSE-CANDLE-CEDAR',
        name: 'Cedar',
        optionValues: [{ name: 'Scent', value: 'Cedar' }],
        price: 219000,
        stockOnHand: 3,
        lowStockThreshold: 5,
        weightGrams: 520,
      },
      {
        sku: 'MUSE-CANDLE-AMBER',
        name: 'Amber',
        optionValues: [{ name: 'Scent', value: 'Amber' }],
        price: 219000,
        stockOnHand: 12,
        lowStockThreshold: 5,
        weightGrams: 520,
      },
    ],
  },
  {
    name: 'Morning Ritual Set',
    slug: 'morning-ritual-set',
    description:
      'A bundled mug and candle set for gifting or making the first hour of the day feel intentional.',
    categorySlug: 'home-rituals',
    imageKey: 'mug',
    galleryImageKeys: ['mug', 'candle'],
    seoTitle: 'Morning Ritual Set | Muse Studio',
    seoDescription:
      'A simple gift set pairing the Muse ceramic mug with a soy candle.',
    sortOrder: 50,
    variants: [
      {
        sku: 'MUSE-RITUAL-MILK-CEDAR',
        name: 'Milk mug + Cedar candle',
        optionValues: [
          { name: 'Mug', value: 'Milk' },
          { name: 'Candle', value: 'Cedar' },
        ],
        price: 369000,
        compareAtPrice: 398000,
        stockOnHand: 10,
        lowStockThreshold: 4,
        weightGrams: 920,
      },
    ],
  },
] as const

const seededCoupons = [
  {
    code: 'WELCOME10',
    type: 'percentage' as const,
    value: 10,
    currency: 'IDR',
    minSubtotal: 200000,
    maxDiscount: 60000,
    usageLimit: 200,
    usageLimitPerCustomer: 1,
  },
  {
    code: 'RITUAL25K',
    type: 'fixed_amount' as const,
    value: 25000,
    currency: 'IDR',
    minSubtotal: 300000,
    maxDiscount: 25000,
    usageLimit: 100,
    usageLimitPerCustomer: 2,
  },
] as const

const seededOrders = [
  {
    orderNumber: 'MUSE-1001',
    email: 'sari.wibowo@example.com',
    customerName: 'Sari Wibowo',
    phone: '+628111112222',
    couponCode: 'WELCOME10',
    orderStatus: 'paid' as const,
    paymentStatus: 'paid' as const,
    fulfillmentStatus: 'processing' as const,
    shippingTotal: 25000,
    taxTotal: 0,
    placedMinutesAgo: 360,
    paidMinutesAgo: 340,
    notes: 'Please pack the candle separately.',
    shippingAddress: {
      recipientName: 'Sari Wibowo',
      phone: '+628111112222',
      addressLine1: 'Jl. Kemang Raya No. 18',
      addressLine2: 'Apt 3B',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12730',
      country: 'Indonesia',
    },
    items: [
      { sku: 'MUSE-TOTE-NATURAL', quantity: 1 },
      { sku: 'MUSE-CANDLE-CEDAR', quantity: 1 },
    ],
    shipment: {
      carrier: 'JNE',
      service: 'REG',
      trackingNumber: 'JNE-SEED-1001',
      trackingUrl: 'https://www.jne.co.id/id/tracking/trace',
      status: 'processing' as const,
    },
  },
  {
    orderNumber: 'MUSE-1002',
    email: 'bayu.pratama@example.com',
    customerName: 'Bayu Pratama',
    phone: '+628122223333',
    orderStatus: 'payment_failed' as const,
    paymentStatus: 'failed' as const,
    fulfillmentStatus: 'unfulfilled' as const,
    shippingTotal: 20000,
    taxTotal: 0,
    placedMinutesAgo: 1260,
    notes: 'Failed card payment from demo data.',
    shippingAddress: {
      recipientName: 'Bayu Pratama',
      phone: '+628122223333',
      addressLine1: 'Jl. Ciumbuleuit No. 42',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40141',
      country: 'Indonesia',
    },
    items: [{ sku: 'MUSE-JOURNAL-A5', quantity: 2 }],
  },
  {
    orderNumber: 'MUSE-1003',
    email: 'maya.putri@example.com',
    customerName: 'Maya Putri',
    phone: '+628133334444',
    couponCode: 'RITUAL25K',
    orderStatus: 'paid' as const,
    paymentStatus: 'paid' as const,
    fulfillmentStatus: 'delivered' as const,
    shippingTotal: 30000,
    taxTotal: 0,
    placedMinutesAgo: 4320,
    paidMinutesAgo: 4300,
    shippingAddress: {
      recipientName: 'Maya Putri',
      phone: '+628133334444',
      addressLine1: 'Jl. Sriwedari No. 9',
      city: 'Ubud',
      province: 'Bali',
      postalCode: '80571',
      country: 'Indonesia',
    },
    items: [{ sku: 'MUSE-RITUAL-MILK-CEDAR', quantity: 1 }],
    shipment: {
      carrier: 'SiCepat',
      service: 'BEST',
      trackingNumber: 'SCP-SEED-1003',
      trackingUrl: 'https://www.sicepat.com/checkAwb',
      status: 'delivered' as const,
    },
  },
] as const

export const replaceCommerceData = internalMutation({
  args: {
    images: v.array(seededImageInput),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const cleared = await clearCommerceData(ctx)
    const { oldStorageIds, ...deleted } = cleared
    const imageIdsByKey = new Map<StockImageKey, Id<'mediaAssets'>>()
    const categoryIdsBySlug = new Map<string, Id<'categories'>>()
    const couponIdsByCode = new Map<string, Id<'coupons'>>()
    const variantsBySku = new Map<
      string,
      {
        productId: Id<'products'>
        variantId: Id<'productVariants'>
        productName: string
        productSlug: string
        variantName: string
        imageId: Id<'mediaAssets'>
        optionValues: { name: string; value: string }[]
        price: number
      }
    >()

    for (const image of args.images) {
      const mediaId = await ctx.db.insert('mediaAssets', {
        storageId: image.storageId,
        filename: image.filename,
        contentType: image.contentType,
        sizeBytes: image.sizeBytes,
        altText: image.altText,
        width: image.width,
        height: image.height,
        createdAt: now,
      })
      imageIdsByKey.set(image.key, mediaId)
    }

    for (const category of seededCategories) {
      const categoryId = await ctx.db.insert('categories', {
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageId: mustGet(imageIdsByKey, category.imageKey, 'image'),
        sortOrder: category.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      categoryIdsBySlug.set(category.slug, categoryId)
    }

    for (const product of seededProducts) {
      const featuredImageId = mustGet(imageIdsByKey, product.imageKey, 'image')
      const productId = await ctx.db.insert('products', {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: mustGet(categoryIdsBySlug, product.categorySlug, 'category'),
        status: 'active',
        featuredImageId,
        galleryImageIds: product.galleryImageKeys.map((key) =>
          mustGet(imageIdsByKey, key, 'image'),
        ),
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        sortOrder: product.sortOrder,
        createdAt: now,
        updatedAt: now,
      })

      for (const variant of product.variants) {
        const compareAtPrice =
          'compareAtPrice' in variant ? variant.compareAtPrice : undefined

        assertMoneyAmount(variant.price)
        if (compareAtPrice !== undefined) {
          assertMoneyAmount(compareAtPrice)
        }
        assertNonNegativeQuantity(variant.stockOnHand)

        const variantId = await ctx.db.insert('productVariants', {
          productId,
          sku: variant.sku,
          name: variant.name,
          optionValues: variant.optionValues.map((option) => ({ ...option })),
          price: variant.price,
          compareAtPrice,
          stockOnHand: variant.stockOnHand,
          reservedStock: 0,
          lowStockThreshold: variant.lowStockThreshold,
          weightGrams: variant.weightGrams,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })

        await ctx.db.insert('inventoryMovements', {
          variantId,
          type: 'adjustment',
          quantityDelta: variant.stockOnHand,
          stockAfter: variant.stockOnHand,
          reason: 'Destructive demo seed opening stock',
          createdAt: now,
        })

        variantsBySku.set(variant.sku, {
          productId,
          variantId,
          productName: product.name,
          productSlug: product.slug,
          variantName: variant.name,
          imageId: featuredImageId,
          optionValues: variant.optionValues.map((option) => ({ ...option })),
          price: variant.price,
        })
      }
    }

    const settingsId = await ctx.db.insert('siteSettings', {
      ...defaultSiteSettings,
      storeName: 'Muse Studio',
      supportEmail: 'care@example.com',
      pendingPaymentExpiryMinutes: 60,
      seoTitle: 'Muse Studio - Goods of Considered Make',
      seoDescription:
        'A focused catalog of bags, desk tools, and home ritual objects.',
      createdAt: now,
      updatedAt: now,
    })

    const contentId = await ctx.db.insert('siteContent', {
      ...defaultHomepageContent,
      title: 'Goods of Considered Make',
      subtitle:
        'A tight edit of carry goods, ceramics, journals, and candlelit rituals for everyday use.',
      heroImageId: mustGet(imageIdsByKey, 'hero', 'image'),
      heroCtaLabel: 'Shop the collection',
      heroCtaHref: '/products',
      featuredCategorySlugs: seededCategories.map((category) => category.slug),
      homepageBanners: [
        {
          title: 'Daily carry, pared back',
          body: 'Canvas bags and compact essentials for workdays and errands.',
          imageId: mustGet(imageIdsByKey, 'hero', 'image'),
          href: '/products',
        },
        {
          title: 'Ritual objects for home',
          body: 'Ceramics, soy candles, and warm details for slower hours.',
          imageId: mustGet(imageIdsByKey, 'candle', 'image'),
          href: '/products',
        },
      ],
      announcement: 'Seeded launch catalog is live. Use WELCOME10 at checkout.',
      aboutText:
        'Muse Studio makes quiet objects with a practical point of view: useful first, handsome always, and easy to live with.',
      footerText: 'Packed with care from the Muse Studio seed collection.',
      status: 'published',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    for (const coupon of seededCoupons) {
      const couponId = await ctx.db.insert('coupons', {
        ...coupon,
        redeemedCount: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      couponIdsByCode.set(coupon.code, couponId)
    }

    for (const key of EMAIL_TEMPLATE_KEYS) {
      await ctx.db.insert('emailTemplates', {
        key,
        ...defaultEmailTemplates[key],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
    }

    for (const order of seededOrders) {
      const placedAt = now - order.placedMinutesAgo * 60 * 1000
      const couponCode = 'couponCode' in order ? order.couponCode : undefined
      const notes = 'notes' in order ? order.notes : undefined
      const shipment = 'shipment' in order ? order.shipment : undefined
      const paidAt =
        'paidMinutesAgo' in order && order.paidMinutesAgo !== undefined
          ? now - order.paidMinutesAgo * 60 * 1000
          : undefined
      const orderItems = order.items.map((item) => {
        const seededVariant = mustGet(variantsBySku, item.sku, 'variant')
        return {
          ...seededVariant,
          sku: item.sku,
          quantity: item.quantity,
          lineSubtotal: seededVariant.price * item.quantity,
        }
      })
      const subtotal = orderItems.reduce(
        (total, item) => total + item.lineSubtotal,
        0,
      )
      const couponId = couponCode
        ? mustGet(couponIdsByCode, couponCode, 'coupon')
        : undefined
      const discountTotal = couponCode
        ? couponCode === 'WELCOME10'
          ? Math.min(Math.floor(subtotal * 0.1), 60000)
          : 25000
        : 0
      const grandTotal =
        subtotal - discountTotal + order.shippingTotal + order.taxTotal
      const orderId = await ctx.db.insert('orders', {
        orderNumber: order.orderNumber,
        email: order.email,
        customerName: order.customerName,
        phone: order.phone,
        currency: 'IDR',
        subtotal,
        discountTotal,
        shippingTotal: order.shippingTotal,
        taxTotal: order.taxTotal,
        grandTotal,
        couponId,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        shippingAddress: order.shippingAddress,
        notes,
        placedAt,
        paidAt,
        createdAt: placedAt,
        updatedAt: now,
      })

      for (const item of orderItems) {
        await ctx.db.insert('orderItems', {
          orderId,
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          productName: item.productName,
          productSlug: item.productSlug,
          variantName: item.variantName,
          optionValues: item.optionValues,
          imageUrl: await mediaUrl(ctx, item.imageId),
          quantity: item.quantity,
          unitPrice: item.price,
          lineSubtotal: item.lineSubtotal,
          createdAt: placedAt,
        })
      }

      await ctx.db.insert('payments', {
        orderId,
        provider: 'xendit',
        providerInvoiceId: `seed-${order.orderNumber.toLowerCase()}`,
        providerReference: order.orderNumber,
        checkoutUrl:
          order.paymentStatus === 'paid'
            ? undefined
            : `https://checkout.example.com/${order.orderNumber}`,
        amount: grandTotal,
        currency: 'IDR',
        status: order.paymentStatus,
        rawStatus: order.paymentStatus,
        paidAt,
        createdAt: placedAt,
        updatedAt: now,
      })

      if (couponId) {
        await ctx.db.insert('couponRedemptions', {
          couponId,
          orderId,
          email: order.email,
          discountAmount: discountTotal,
          status: order.paymentStatus === 'paid' ? 'consumed' : 'released',
          redeemedAt: placedAt,
          updatedAt: now,
        })
      }

      if (shipment) {
        const shippedAt =
          shipment.status === 'delivered'
            ? placedAt + 24 * 60 * 60 * 1000
            : undefined
        const deliveredAt =
          shipment.status === 'delivered'
            ? placedAt + 72 * 60 * 60 * 1000
            : undefined

        await ctx.db.insert('shipments', {
          orderId,
          carrier: shipment.carrier,
          service: shipment.service,
          trackingNumber: shipment.trackingNumber,
          trackingUrl: shipment.trackingUrl,
          status: shipment.status,
          shippedAt,
          deliveredAt,
          createdAt: placedAt,
          updatedAt: now,
        })
      }

      await ctx.db.insert('emailEvents', {
        templateKey:
          order.paymentStatus === 'paid'
            ? 'payment_confirmed'
            : 'payment_failed',
        recipientEmail: order.email,
        orderId,
        provider: 'seed',
        providerMessageId: `seed-email-${order.orderNumber.toLowerCase()}`,
        status: order.paymentStatus === 'paid' ? 'sent' : 'failed',
        errorMessage:
          order.paymentStatus === 'paid'
            ? undefined
            : 'Seeded failed email event for dashboard QA.',
        metadata: { seeded: true },
        createdAt: now,
        updatedAt: now,
      })

      await ctx.db.insert('adminActivityLogs', {
        action: order.paymentStatus === 'paid' ? 'create' : 'update',
        targetTable: 'orders',
        targetId: orderId,
        metadata: {
          seeded: true,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
        },
        createdAt: now,
      })
    }

    await ctx.db.insert('adminActivityLogs', {
      action: 'publish',
      targetTable: 'siteContent',
      targetId: contentId,
      metadata: {
        seeded: true,
        imageSources: args.images.map((image) => ({
          key: image.key,
          provider: image.sourceProvider,
          license: image.sourceLicense,
          page: image.sourcePage,
        })),
      },
      createdAt: now,
    })

    await ctx.db.insert('adminActivityLogs', {
      action: 'update',
      targetTable: 'siteSettings',
      targetId: settingsId,
      metadata: { seeded: true },
      createdAt: now,
    })

    return {
      deleted,
      inserted: {
        mediaAssets: args.images.length,
        categories: seededCategories.length,
        products: seededProducts.length,
        variants: Array.from(variantsBySku).length,
        coupons: seededCoupons.length,
        orders: seededOrders.length,
        emailTemplates: EMAIL_TEMPLATE_KEYS.length,
      },
      oldStorageIds,
    }
  },
})

async function clearCommerceData(ctx: MutationCtx) {
  const oldStorageIds = (
    await ctx.db.query('mediaAssets').collect()
  ).map((asset) => asset.storageId)

  const deleted = {
    emailEvents: await deleteAll(ctx, 'emailEvents'),
    emailTemplates: await deleteAll(ctx, 'emailTemplates'),
    adminActivityLogs: await deleteAll(ctx, 'adminActivityLogs'),
    couponRedemptions: await deleteAll(ctx, 'couponRedemptions'),
    manualRefunds: await deleteAll(ctx, 'manualRefunds'),
    shipments: await deleteAll(ctx, 'shipments'),
    paymentWebhookEvents: await deleteAll(ctx, 'paymentWebhookEvents'),
    payments: await deleteAll(ctx, 'payments'),
    orderItems: await deleteAll(ctx, 'orderItems'),
    orders: await deleteAll(ctx, 'orders'),
    customerAddresses: await deleteAll(ctx, 'customerAddresses'),
    cartItems: await deleteAll(ctx, 'cartItems'),
    carts: await deleteAll(ctx, 'carts'),
    inventoryMovements: await deleteAll(ctx, 'inventoryMovements'),
    productVariants: await deleteAll(ctx, 'productVariants'),
    products: await deleteAll(ctx, 'products'),
    categories: await deleteAll(ctx, 'categories'),
    coupons: await deleteAll(ctx, 'coupons'),
    siteContent: await deleteAll(ctx, 'siteContent'),
    siteSettings: await deleteAll(ctx, 'siteSettings'),
    mediaAssets: await deleteAll(ctx, 'mediaAssets'),
  }

  return { ...deleted, oldStorageIds }
}

async function deleteAll(
  ctx: MutationCtx,
  tableName:
    | 'adminActivityLogs'
    | 'cartItems'
    | 'carts'
    | 'categories'
    | 'couponRedemptions'
    | 'coupons'
    | 'customerAddresses'
    | 'emailEvents'
    | 'emailTemplates'
    | 'inventoryMovements'
    | 'manualRefunds'
    | 'mediaAssets'
    | 'orderItems'
    | 'orders'
    | 'payments'
    | 'paymentWebhookEvents'
    | 'productVariants'
    | 'products'
    | 'shipments'
    | 'siteContent'
    | 'siteSettings',
) {
  const docs = await ctx.db.query(tableName).collect()

  for (const doc of docs) {
    await ctx.db.delete(doc._id)
  }

  return docs.length
}

function mustGet<Key, Value>(map: Map<Key, Value>, key: Key, label: string) {
  const value = map.get(key)

  if (value === undefined) {
    throw new Error(`Missing seeded ${label}: ${String(key)}`)
  }

  return value
}

async function mediaUrl(ctx: MutationCtx, id: Id<'mediaAssets'>) {
  const asset = await ctx.db.get(id)

  if (!asset) {
    return undefined
  }

  return (await ctx.storage.getUrl(asset.storageId)) ?? undefined
}
