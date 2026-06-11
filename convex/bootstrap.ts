import { mutation } from './_generated/server'
import {
  defaultHomepageContent,
  defaultSiteSettings,
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

    return {
      siteSettings: existingSettings ? 'exists' : 'created',
      homepageContent: existingHomepage ? 'exists' : 'created',
    }
  },
})
