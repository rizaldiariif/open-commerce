import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'

import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Role } from './domain'

const adminRoles = new Set<Role>(['admin', 'superadmin'])

async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)

  if (!userId) {
    return null
  }

  const user = await ctx.db.get(userId)

  if (!user) {
    return null
  }

  return user
}

async function getProfileByUserId(ctx: QueryCtx | MutationCtx, userId: string) {
  return await ctx.db
    .query('profiles')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .unique()
}

async function hasSuperadmin(ctx: QueryCtx | MutationCtx) {
  const existing = await ctx.db
    .query('profiles')
    .withIndex('by_role', (q) => q.eq('role', 'superadmin'))
    .first()

  return existing !== null
}

function normalizeEmail(email: string | undefined) {
  return email?.trim().toLowerCase() ?? ''
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx)

    if (!user) {
      return null
    }

    const profile = await getProfileByUserId(ctx, user._id)

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      profile,
      isAdmin: profile ? adminRoles.has(profile.role) : false,
      isSuperadmin: profile?.role === 'superadmin',
    }
  },
})

export const bootstrapStatus = query({
  args: {},
  handler: async (ctx) => {
    return {
      hasSuperadmin: await hasSuperadmin(ctx),
    }
  },
})

export const ensureCurrentUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx)

    if (!user) {
      throw new ConvexError('Authentication is required.')
    }

    const email = normalizeEmail(user.email)

    if (!email) {
      throw new ConvexError('Authenticated user is missing an email address.')
    }

    const now = Date.now()
    const existing = await getProfileByUserId(ctx, user._id)

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name: user.name,
        updatedAt: now,
      })

      return existing._id
    }

    return await ctx.db.insert('profiles', {
      userId: user._id,
      email,
      name: user.name,
      role: 'customer',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const bootstrapSuperadmin = mutation({
  args: {
    setupToken: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedToken = process.env.SETUP_TOKEN

    if (!expectedToken) {
      throw new ConvexError('Superadmin bootstrap is not configured.')
    }

    if (args.setupToken !== expectedToken) {
      throw new ConvexError('Invalid setup token.')
    }

    if (await hasSuperadmin(ctx)) {
      throw new ConvexError('Superadmin bootstrap is already complete.')
    }

    const user = await getAuthUser(ctx)

    if (!user) {
      throw new ConvexError(
        'Sign in before bootstrapping the first superadmin.',
      )
    }

    const email = normalizeEmail(user.email)

    if (!email) {
      throw new ConvexError('Authenticated user is missing an email address.')
    }

    const now = Date.now()
    const existing = await getProfileByUserId(ctx, user._id)

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name: user.name,
        role: 'superadmin',
        updatedAt: now,
      })

      return existing._id
    }

    return await ctx.db.insert('profiles', {
      userId: user._id,
      email,
      name: user.name,
      role: 'superadmin',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const requireAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)

    if (!userId) {
      return { allowed: false, reason: 'unauthenticated' as const }
    }

    const profile = await getProfileByUserId(ctx, userId)

    if (!profile || !adminRoles.has(profile.role)) {
      return { allowed: false, reason: 'forbidden' as const }
    }

    return { allowed: true, profile }
  },
})

export const requireSuperadmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)

    if (!userId) {
      return { allowed: false, reason: 'unauthenticated' as const }
    }

    const profile = await getProfileByUserId(ctx, userId)

    if (profile?.role !== 'superadmin') {
      return { allowed: false, reason: 'forbidden' as const }
    }

    return { allowed: true, profile }
  },
})

export const requireCustomerAccount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)

    if (!userId) {
      return { allowed: false, reason: 'unauthenticated' as const }
    }

    const profile = await getProfileByUserId(ctx, userId)

    if (!profile) {
      return { allowed: false, reason: 'missing_profile' as const }
    }

    return { allowed: true, profile }
  },
})

export type CurrentProfile = Doc<'profiles'>
