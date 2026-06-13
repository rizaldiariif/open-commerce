import { ConvexError } from 'convex/values'

export type XenditInvoiceRequest = {
  externalId: string
  amount: number
  currency: string
  payerEmail: string
  description: string
  successRedirectUrl: string
  failureRedirectUrl: string
  callbackUrl?: string
}

export type XenditInvoice = {
  id: string
  external_id?: string
  invoice_url?: string
  amount: number
  currency?: string
  status?: string
  expiry_date?: string
}

export async function createXenditInvoice(
  input: XenditInvoiceRequest,
): Promise<XenditInvoice> {
  const secretKey = process.env.XENDIT_SECRET_KEY
  if (!secretKey) throw new ConvexError('Xendit secret key is not configured.')

  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      currency: input.currency,
      payer_email: input.payerEmail,
      description: input.description,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      callback_url: input.callbackUrl,
    }),
  })

  const data = (await response.json().catch(() => null)) as
    | (Partial<XenditInvoice> & { message?: string; error_code?: string })
    | null

  if (
    !response.ok ||
    !data?.id ||
    !data.invoice_url ||
    typeof data.amount !== 'number'
  ) {
    const detail = data?.message ?? data?.error_code ?? response.statusText
    throw new ConvexError(`Xendit invoice creation failed: ${detail}`)
  }

  return {
    id: data.id,
    external_id: data.external_id,
    invoice_url: data.invoice_url,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    expiry_date: data.expiry_date,
  }
}

export function xenditWebhookAuthorized(request: Request) {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN
  if (!expected) return false
  return request.headers.get('x-callback-token') === expected
}
