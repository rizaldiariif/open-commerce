import { mutation } from './_generated/server'
import {
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
