import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <section className="page-grid">
      <div className="hero-panel">
        <p className="eyebrow">Single-brand commerce MVP</p>
        <h1>
          Launch a focused storefront with inventory, checkout, and admin
          operations.
        </h1>
        <p className="lede">
          Muse Commerce starts with the routes and backend wiring the MVP needs,
          then grows into catalog, cart, order, payment, and fulfillment
          workflows.
        </p>
        <div className="action-row">
          <Link to="/products" className="primary-link">
            Browse products
          </Link>
          <Link to="/admin" className="secondary-link">
            Open admin
          </Link>
        </div>
      </div>
      <aside className="status-panel" aria-label="Foundation status">
        <h2>Foundation</h2>
        <dl>
          <div>
            <dt>Framework</dt>
            <dd>TanStack Start</dd>
          </div>
          <div>
            <dt>Backend</dt>
            <dd>Convex</dd>
          </div>
          <div>
            <dt>Health</dt>
            <dd>/api/health</dd>
          </div>
        </dl>
      </aside>
    </section>
  )
}
