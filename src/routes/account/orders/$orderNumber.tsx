import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAction, useQuery } from 'convex/react'

import { api } from '../../../../convex/_generated/api'

export const Route = createFileRoute('/account/orders/$orderNumber')({
  component: AccountOrderDetail,
})

function AccountOrderDetail() {
  const { orderNumber } = Route.useParams()
  const detail = useQuery(api.orders.getCustomerOrder, { orderNumber })
  const createInvoice = useAction(api.payments.createInvoiceForOrder)
  const navigate = useNavigate()
  const [isStartingPayment, setIsStartingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  async function handlePayment() {
    if (!detail) return

    setIsStartingPayment(true)
    setPaymentError(null)
    try {
      const result = await createInvoice({ orderId: detail.order._id })
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
        return
      }
      await navigate({
        to: '/payment/$orderNumber',
        params: { orderNumber: detail.order.orderNumber },
      })
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'Could not start payment.',
      )
    } finally {
      setIsStartingPayment(false)
    }
  }

  if (detail === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Account</p>
        <h1>Loading order</h1>
      </section>
    )
  }

  if (!detail) {
    return (
      <section className="content-page">
        <p className="eyebrow">Account</p>
        <h1>Order not found</h1>
        <Link to="/account/orders" className="primary-link">
          Back to orders
        </Link>
      </section>
    )
  }

  const activePaymentUrl = activeCheckoutUrl(detail.payment)
  const canStartPayment = canPayOrder(
    detail.order.orderStatus,
    detail.order.paymentStatus,
  )

  return (
    <section className="checkout-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{detail.order.orderNumber}</h1>
          <p>
            {label(detail.order.paymentStatus)} payment /{' '}
            {label(detail.order.fulfillmentStatus)} delivery for{' '}
            {formatMoney(detail.order.grandTotal, detail.order.currency)}
          </p>
        </div>
        <Link to="/account/orders" className="secondary-link">
          Back to orders
        </Link>
      </header>

      <div className="checkout-layout">
        <div className="admin-panel">
          <h2>Items</h2>
          <div className="stack-list">
            {detail.items.map((item) => (
              <div key={item._id}>
                <strong>{item.productName}</strong>
                <span>
                  {item.variantName} - {item.quantity} x{' '}
                  {formatMoney(item.unitPrice, detail.order.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="checkout-side-stack">
          <aside className="cart-summary">
            <h2>Payment</h2>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>{label(detail.order.paymentStatus)}</dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd>{label(detail.order.orderStatus)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  {formatMoney(detail.order.grandTotal, detail.order.currency)}
                </dd>
              </div>
              <div>
                <dt>Invoice</dt>
                <dd>{formatDate(detail.payment?.expiresAt)}</dd>
              </div>
            </dl>
            <p className="notice">
              {paymentMessage(detail.order.paymentStatus, activePaymentUrl)}
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
                {isStartingPayment ? 'Creating invoice' : 'Continue payment'}
              </button>
            ) : null}
          </aside>

          <aside className="cart-summary">
            <h2>Delivery</h2>
            <dl>
              <div>
                <dt>Fulfillment</dt>
                <dd>{label(detail.order.fulfillmentStatus)}</dd>
              </div>
              <div>
                <dt>Courier</dt>
                <dd>{detail.shipment?.carrier ?? 'Not set'}</dd>
              </div>
              <div>
                <dt>Airwaybill</dt>
                <dd>{detail.shipment?.trackingNumber ?? 'Not set'}</dd>
              </div>
              <div>
                <dt>Shipped</dt>
                <dd>{formatDate(detail.shipment?.shippedAt)}</dd>
              </div>
              <div>
                <dt>Delivered</dt>
                <dd>{formatDate(detail.shipment?.deliveredAt)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  )
}

function activeCheckoutUrl(
  payment:
    | {
        checkoutUrl?: string
        expiresAt?: number
        status: string
      }
    | null,
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

function paymentMessage(status: string, activePaymentUrl?: string) {
  if (status === 'paid') return 'Payment has been received.'
  if (status === 'refunded') return 'This payment has been refunded.'
  if (activePaymentUrl) return 'Your invoice is ready.'
  if (status === 'failed') return 'Payment failed. Create a new invoice to try again.'
  if (status === 'expired') return 'Payment expired. Create a new invoice to try again.'
  return 'Create an invoice to continue payment.'
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function formatDate(value: number | undefined) {
  return value ? new Date(value).toLocaleString('id-ID') : 'Not set'
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
