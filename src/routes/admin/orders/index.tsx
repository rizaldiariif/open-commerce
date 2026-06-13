import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import { LoadingState } from '../../../components/RouteFeedback'
import { StatusBadge } from '../../../components/StatusBadge'

export const Route = createFileRoute('/admin/orders/')({
  component: AdminOrders,
})

type FulfillmentFilter =
  | ''
  | 'unfulfilled'
  | 'processing'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'

function AdminOrders() {
  const [search, setSearch] = useState('')
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState<FulfillmentFilter>('')
  const ordersState = useQuery(api.orders.listAdminOrders, {
    search,
    fulfillmentStatus: fulfillmentStatus || undefined,
  })

  if (ordersState === undefined) {
    return (
      <LoadingState
        eyebrow="Operations"
        title="Loading orders"
        body="Preparing the order queue and filters."
      />
    )
  }

  if (ordersState.status !== 'ready') {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin access required</h1>
        <p>
          {ordersState.status === 'unauthenticated'
            ? 'Sign in with an admin account to manage orders.'
            : 'Your account does not have order management access.'}
        </p>
        <Link
          to={ordersState.status === 'unauthenticated' ? '/login' : '/admin'}
          search={
            ordersState.status === 'unauthenticated'
              ? { redirect: '/admin/orders' }
              : undefined
          }
          className="primary-link"
        >
          {ordersState.status === 'unauthenticated' ? 'Login' : 'Admin'}
        </Link>
      </section>
    )
  }

  const orders = ordersState.orders

  return (
    <section className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Orders</h1>
          <p>Manage payment visibility, fulfillment progress, and refunds.</p>
        </div>
        <Link to="/admin" className="secondary-link">
          Admin workspace
        </Link>
      </header>

      <div className="admin-panel">
        <form className="admin-form two-column-form">
          <label>
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order number, customer, email"
            />
          </label>
          <label>
            Fulfillment
            <select
              value={fulfillmentStatus}
              onChange={(event) =>
                setFulfillmentStatus(event.target.value as FulfillmentFilter)
              }
            >
              <option value="">All statuses</option>
              <option value="unfulfilled">Unfulfilled</option>
              <option value="processing">Processing</option>
              <option value="in_delivery">In delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </form>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
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
                  <span>{formatDate(order.placedAt)}</span>
                </td>
                <td>
                  <strong>{order.customerName}</strong>
                  <span>{order.email}</span>
                </td>
                <td>
                  <div className="status-row">
                    <StatusBadge value={order.fulfillmentStatus} />
                    <StatusBadge value={order.paymentStatus} />
                  </div>
                  <span>{label(order.orderStatus)}</span>
                </td>
                <td>{formatMoney(order.grandTotal, order.currency)}</td>
                <td>{formatDate(order.placedAt)}</td>
                <td>
                  <Link
                    to="/admin/orders/$id"
                    params={{ id: order._id }}
                    className="secondary-link"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6}>No orders match these filters.</td>
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
