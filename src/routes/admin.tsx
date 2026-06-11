import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/admin')({
  component: Admin,
})

function Admin() {
  const access = useQuery(api.profiles.requireAdmin)
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

  if (access === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin</h1>
        <p>Checking access.</p>
      </section>
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

  return (
    <section className="content-page">
      <p className="eyebrow">Operations</p>
      <h1>Admin</h1>
      <p>
        Signed in as {access.profile.email} with {access.profile.role} access.
        Module-specific screens arrive in the next implementation tasks.
      </p>
      <div className="module-grid" aria-label="Planned admin modules">
        {modules.map((module) => (
          <span key={module}>{module}</span>
        ))}
      </div>
    </section>
  )
}
