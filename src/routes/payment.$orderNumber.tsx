import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

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
            {paymentMessage(orderState.order.paymentStatus)}
          </p>
          {orderState.payment?.checkoutUrl &&
          orderState.order.paymentStatus === 'pending' ? (
            <a className="primary-link" href={orderState.payment.checkoutUrl}>
              Pay with Xendit
            </a>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

function paymentMessage(status: string) {
  if (status === 'paid') return 'Payment has been received.'
  if (status === 'failed') return 'Payment failed. Please place a new order.'
  if (status === 'expired') return 'Payment expired. Please place a new order.'
  return 'Complete payment through the secure Xendit invoice link.'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
