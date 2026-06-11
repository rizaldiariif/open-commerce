import { httpRouter } from 'convex/server'

import { auth } from './auth'
import { handleXenditWebhook } from './payments'

const http = httpRouter()

auth.addHttpRoutes(http)

http.route({
  path: '/api/xendit/webhook',
  method: 'POST',
  handler: handleXenditWebhook,
})

export default http
