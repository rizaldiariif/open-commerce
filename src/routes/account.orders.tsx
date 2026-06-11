import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/account/orders')({
  component: AccountOrders,
})

function AccountOrders() {
  const orders = useQuery(api.orders.listCustomerOrders)

  if (orders === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Account</p>
        <h1>Orders</h1>
        <p>Loading your order history.</p>
      </section>
    )
  }

  return (
    <section className="content-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Orders</h1>
          <p>Your purchase history and delivery progress.</p>
        </div>
      </header>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Total</th>
              <th>Placed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  <span>{order.email}</span>
                </td>
                <td>
                  <strong>{label(order.fulfillmentStatus)}</strong>
                  <span>
                    {label(order.orderStatus)} / {label(order.paymentStatus)}
                  </span>
                </td>
                <td>{formatMoney(order.grandTotal, order.currency)}</td>
                <td>{formatDate(order.placedAt)}</td>
                <td>
                  <Link
                    to="/account/orders/$orderNumber"
                    params={{ orderNumber: order.orderNumber }}
                    className="secondary-link"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5}>No orders yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
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
