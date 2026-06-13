import type { ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import { LoadingState } from '../../components/RouteFeedback'
import { StatusBadge } from '../../components/StatusBadge'
import { adminModules } from './-shared'

type DashboardLink = '/admin/orders' | '/admin/inventory' | '/admin/emails'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const access = useQuery(api.profiles.requireAdmin)
  const workspace = useQuery(
    api.admin.getWorkspace,
    access?.allowed ? {} : 'skip',
  )
  const ordersState = useQuery(
    api.orders.listAdminOrders,
    access?.allowed ? {} : 'skip',
  )

  if (
    access === undefined ||
    (access.allowed && (workspace === undefined || ordersState === undefined))
  ) {
    return (
      <LoadingState
        eyebrow="Operations"
        title="Loading dashboard"
        body="Checking orders, stock, email health, and recent activity."
      />
    )
  }

  if (!access.allowed || !access.profile) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin access required</h1>
        <p>
          {access.reason === 'unauthenticated'
            ? 'Sign in with an admin account to continue.'
            : 'Your account does not have access to the admin workspace.'}
        </p>
        <div className="action-row">
          {access.reason === 'unauthenticated' ? (
            <Link
              to="/login"
              search={{ redirect: '/admin' }}
              className="primary-link"
            >
              Login
            </Link>
          ) : null}
          <Link to="/setup" className="secondary-link">
            First admin setup
          </Link>
        </div>
      </section>
    )
  }

  if (!workspace || ordersState?.status !== 'ready') {
    return (
      <LoadingState
        eyebrow="Operations"
        title="Loading dashboard"
        body="Preparing your admin overview."
      />
    )
  }

  const orders = ordersState.orders
  const fulfillmentQueue = orders.filter(
    (order) =>
      order.paymentStatus === 'paid' &&
      !['delivered', 'cancelled'].includes(order.fulfillmentStatus),
  )
  const paymentRecovery = orders.filter((order) =>
    ['failed', 'expired'].includes(order.paymentStatus),
  )
  const lowStockVariants = workspace.variants.filter(
    (variant) =>
      variant.lowStockThreshold !== undefined &&
      variant.stockOnHand <= variant.lowStockThreshold,
  )
  const failedEmails = workspace.recentEmailEvents.filter(
    (event) => event.status === 'failed',
  )

  return (
    <section className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin dashboard</h1>
          <p>
            Signed in as {workspace.profile.email} with {workspace.profile.role}{' '}
            access.
          </p>
        </div>
        <Link to="/admin/orders" className="secondary-link">
          Orders
        </Link>
      </header>

      <nav className="admin-tabs" aria-label="Admin modules">
        {adminModules.map((module) => (
          <Link key={module.id} to={module.to}>
            {module.label}
          </Link>
        ))}
      </nav>

      <div className="admin-dashboard">
        <DashboardCard
          title="Paid orders to fulfill"
          count={fulfillmentQueue.length}
          to="/admin/orders"
        >
          {fulfillmentQueue.slice(0, 4).map((order) => (
            <div key={order._id}>
              <strong>{order.orderNumber}</strong>
              <span>{order.customerName}</span>
              <StatusBadge value={order.fulfillmentStatus} />
            </div>
          ))}
        </DashboardCard>

        <DashboardCard
          title="Payment recovery"
          count={paymentRecovery.length}
          to="/admin/orders"
        >
          {paymentRecovery.slice(0, 4).map((order) => (
            <div key={order._id}>
              <strong>{order.orderNumber}</strong>
              <span>{order.email}</span>
              <StatusBadge value={order.paymentStatus} />
            </div>
          ))}
        </DashboardCard>

        <DashboardCard
          title="Low stock variants"
          count={lowStockVariants.length}
          to="/admin/inventory"
        >
          {lowStockVariants.slice(0, 4).map((variant) => (
            <div key={variant._id}>
              <strong>{variant.sku}</strong>
              <span>
                {variant.stockOnHand} on hand, threshold{' '}
                {variant.lowStockThreshold}
              </span>
            </div>
          ))}
        </DashboardCard>

        <DashboardCard
          title="Failed emails"
          count={failedEmails.length}
          to="/admin/emails"
        >
          {failedEmails.slice(0, 4).map((event) => (
            <div key={event._id}>
              <strong>{event.templateKey}</strong>
              <span>{event.recipientEmail}</span>
              <StatusBadge value={event.status} />
            </div>
          ))}
        </DashboardCard>
      </div>
    </section>
  )
}

function DashboardCard({
  title,
  count,
  to,
  children,
}: Readonly<{
  title: string
  count: number
  to: DashboardLink
  children: ReactNode
}>) {
  return (
    <section className="admin-panel">
      <div className="dashboard-card-heading">
        <h2>{title}</h2>
        <strong>{count}</strong>
      </div>
      <div className="stack-list">
        {count > 0 ? (
          children
        ) : (
          <p className="empty-state">Nothing needs attention.</p>
        )}
      </div>
      <Link to={to} className="text-link">
        Open
      </Link>
    </section>
  )
}
