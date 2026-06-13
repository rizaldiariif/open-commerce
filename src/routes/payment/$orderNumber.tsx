import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import { AccessRequired, LoadingState } from '../../components/RouteFeedback'
import { StatusBadge, statusLabel } from '../../components/StatusBadge'
import { useToast } from '../../components/Toast'

export const Route = createFileRoute('/payment/$orderNumber')({
  head: () => ({
    meta: [
      { title: 'Payment | Muse Commerce' },
      { name: 'description', content: 'Review pending order payment status.' },
    ],
  }),
  component: Payment,
})

function Payment() {
  const { orderNumber } = Route.useParams()
  const orderState = useQuery(api.checkout.getPaymentOrder, { orderNumber })
  const createInvoice = useAction(api.payments.createInvoiceForOrder)
  const { notify } = useToast()
  const [isStartingPayment, setIsStartingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  async function handlePayment() {
    if (orderState?.status !== 'ready') return

    setIsStartingPayment(true)
    setPaymentError(null)
    try {
      const result = await createInvoice({ orderId: orderState.order._id })
      if (result.checkoutUrl) {
        notify({ type: 'success', text: 'Payment invoice is ready.' })
        window.location.assign(result.checkoutUrl)
        return
      }
      notify({
        type: 'info',
        text: 'Invoice was created. Refreshing payment status.',
      })
    } catch (error) {
      const text =
        error instanceof Error ? error.message : 'Could not start payment.'
      setPaymentError(text)
      notify({ type: 'error', text })
    } finally {
      setIsStartingPayment(false)
    }
  }

  if (orderState === undefined) {
    return (
      <LoadingState
        eyebrow="Payment"
        title="Loading payment"
        body="Checking your order, invoice, and payment status."
      />
    )
  }

  if (orderState.status === 'unauthenticated') {
    return (
      <AccessRequired
        title="Login to pay"
        body="Payment links are tied to the customer account that placed the order."
        redirect={`/payment/${orderNumber}`}
      />
    )
  }

  if (orderState.status === 'not_found') {
    return (
      <section className="content-page">
        <p className="eyebrow">Payment</p>
        <h1>Order not found</h1>
        <Link to="/products" className="primary-link">
          Browse products
        </Link>
      </section>
    )
  }

  const { order, items, payment } = orderState
  const activePaymentUrl = activeCheckoutUrl(orderState.payment)
  const canStartPayment = canPayOrder(order.orderStatus, order.paymentStatus)

  return (
    <section className="checkout-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Payment</p>
          <h1>{order.orderNumber}</h1>
          <div className="status-row">
            <StatusBadge value={order.orderStatus} />
            <StatusBadge value={order.paymentStatus} />
          </div>
          <p>{paymentHeadline(order.paymentStatus, activePaymentUrl)}</p>
        </div>
        <Link to="/products" className="secondary-link">
          Continue shopping
        </Link>
      </header>

      <div className="checkout-layout">
        <div className="admin-panel">
          <h2>Items</h2>
          <div className="stack-list">
            {items.map((item) => (
              <div key={item._id}>
                <strong>{item.productName}</strong>
                <span>
                  {item.variantName} - {item.quantity} x{' '}
                  {formatMoney(item.unitPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <aside className="cart-summary">
          <h2>Total</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>-{formatMoney(order.discountTotal)}</dd>
            </div>
            <div>
              <dt>Grand total</dt>
              <dd>{formatMoney(order.grandTotal)}</dd>
            </div>
            <div>
              <dt>Invoice expires</dt>
              <dd>{formatDate(payment?.expiresAt)}</dd>
            </div>
          </dl>
          <p className="notice">
            {paymentMessage(order.paymentStatus, activePaymentUrl)}
          </p>
          {paymentError ? (
            <p className="form-message error">{paymentError}</p>
          ) : null}
          {activePaymentUrl ? (
            <a className="primary-link" href={activePaymentUrl}>
              Pay with Xendit
            </a>
          ) : canStartPayment ? (
            <button
              type="button"
              onClick={() => void handlePayment()}
              disabled={isStartingPayment}
            >
              {isStartingPayment
                ? 'Creating invoice'
                : retryLabel(order.paymentStatus)}
            </button>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

function activeCheckoutUrl(
  payment: {
    checkoutUrl?: string
    expiresAt?: number
    status: string
  } | null,
) {
  if (!payment?.checkoutUrl || payment.status !== 'pending') return undefined
  if (payment.expiresAt !== undefined && payment.expiresAt <= Date.now()) {
    return undefined
  }
  return payment.checkoutUrl
}

function canPayOrder(orderStatus: string, paymentStatus: string) {
  if (orderStatus === 'cancelled') return false
  return ['pending', 'failed', 'expired'].includes(paymentStatus)
}

function paymentMessage(status: string, checkoutUrl?: string) {
  if (status === 'paid') return 'Payment has been received.'
  if (status === 'partially_refunded')
    return 'This payment was partially refunded.'
  if (status === 'refunded') return 'This payment has been refunded.'
  if (status === 'failed')
    return 'Payment failed. Create a new invoice to try again.'
  if (status === 'expired')
    return 'Payment expired. Create a new invoice to try again.'
  if (!checkoutUrl) {
    return 'Create an invoice to continue payment.'
  }
  return 'Complete payment through the secure Xendit invoice link.'
}

function paymentHeadline(status: string, checkoutUrl?: string) {
  if (checkoutUrl) return 'Your invoice is ready to pay.'
  if (['expired', 'failed'].includes(status)) {
    return 'You can create a new invoice and pay again.'
  }
  return `${statusLabel(status)} payment.`
}

function retryLabel(status: string) {
  return ['expired', 'failed'].includes(status)
    ? 'Create new invoice'
    : 'Continue payment'
}

function formatDate(value: number | undefined) {
  return value ? new Date(value).toLocaleString('id-ID') : 'Not available'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
