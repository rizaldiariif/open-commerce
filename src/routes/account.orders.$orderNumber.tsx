import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/account/orders/$orderNumber')({
  component: AccountOrderDetail,
})

function AccountOrderDetail() {
  const { orderNumber } = Route.useParams()
  const detail = useQuery(api.orders.getCustomerOrder, { orderNumber })

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

  return (
    <section className="checkout-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{detail.order.orderNumber}</h1>
          <p>
            {label(detail.order.fulfillmentStatus)} delivery status for{' '}
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
    </section>
  )
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
