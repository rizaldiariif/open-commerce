import { query } from './_generated/server'

export const check = query({
  args: {},
  handler: async () => ({
    ok: true,
    service: 'muse-commerce',
  }),
})
