import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'

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
  const [isStartingPayment, setIsStartingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  async function handlePayment() {
    if (!orderState) return

    setIsStartingPayment(true)
    setPaymentError(null)
    try {
      const result = await createInvoice({ orderId: orderState.order._id })
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
      }
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'Could not start payment.',
      )
    } finally {
      setIsStartingPayment(false)
    }
  }

  if (orderState === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Payment</p>
        <h1>Loading order</h1>
      </section>
    )
  }

  if (!orderState) {
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

  const activePaymentUrl = activeCheckoutUrl(orderState.payment)
  const canStartPayment = canPayOrder(
    orderState.order.orderStatus,
    orderState.order.paymentStatus,
  )

  return (
    <section className="checkout-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Payment</p>
          <h1>{orderState.order.orderNumber}</h1>
          <p>
            Status: {orderState.order.orderStatus.replace('_', ' ')} /{' '}
            {orderState.order.paymentStatus}
          </p>
        </div>
        <Link to="/products" className="secondary-link">
          Continue shopping
        </Link>
      </header>

      <div className="checkout-layout">
        <div className="admin-panel">
          <h2>Items</h2>
          <div className="stack-list">
            {orderState.items.map((item) => (
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
              <dd>{formatMoney(orderState.order.subtotal)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>-{formatMoney(orderState.order.discountTotal)}</dd>
            </div>
            <div>
              <dt>Grand total</dt>
              <dd>{formatMoney(orderState.order.grandTotal)}</dd>
            </div>
          </dl>
          <p className="notice">
            {paymentMessage(
              orderState.order.paymentStatus,
              activePaymentUrl,
            )}
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

function paymentMessage(status: string, checkoutUrl?: string) {
  if (status === 'paid') return 'Payment has been received.'
  if (status === 'refunded') return 'This payment has been refunded.'
  if (status === 'failed') return 'Payment failed. Create a new invoice to try again.'
  if (status === 'expired') return 'Payment expired. Create a new invoice to try again.'
  if (!checkoutUrl) {
    return 'Create an invoice to continue payment.'
  }
  return 'Complete payment through the secure Xendit invoice link.'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
