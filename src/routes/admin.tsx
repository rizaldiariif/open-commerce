import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: Admin,
})

function Admin() {
  const modules = [
    'Products',
    'Categories',
    'Orders',
    'Customers',
    'Coupons',
    'Content',
    'Settings',
    'Email',
    'Admins',
  ]

  return (
    <section className="content-page">
      <p className="eyebrow">Operations</p>
      <h1>Admin</h1>
      <p>
        Admin routing starts here. Role guards, bootstrap, and module-specific
        screens arrive in the next implementation tasks.
      </p>
      <div className="module-grid" aria-label="Planned admin modules">
        {modules.map((module) => (
          <span key={module}>{module}</span>
        ))}
      </div>
    </section>
  )
}
