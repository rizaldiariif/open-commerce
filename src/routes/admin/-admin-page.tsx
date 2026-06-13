import { type ReactNode, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import {
  type AdminMessage,
  type AdminModuleId,
  type AdminWorkspace,
  adminModules,
} from './-shared'

export function AdminModulePage({
  activeModule,
  children,
}: Readonly<{
  activeModule: AdminModuleId
  children: (props: {
    workspace: AdminWorkspace
    isSuperadmin: boolean
    setMessage: (message: AdminMessage) => void
  }) => ReactNode
}>) {
  const access = useQuery(api.profiles.requireAdmin)
  const workspace = useQuery(api.admin.getWorkspace)
  const [message, setMessage] = useState<AdminMessage | null>(null)

  if (access === undefined || workspace === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin</h1>
        <p>Loading admin workspace.</p>
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
    <section className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin</h1>
          <p>
            Signed in as {workspace.profile.email} with {workspace.profile.role}{' '}
            access.
          </p>
        </div>
        <div className="admin-kpis" aria-label="Catalog summary">
          <span>
            <strong>{workspace.products.length}</strong> products
          </span>
          <span>
            <strong>{workspace.variants.length}</strong> variants
          </span>
          <span>
            <strong>{workspace.mediaAssets.length}</strong> media
          </span>
          <Link to="/admin/orders" className="secondary-link">
            Orders
          </Link>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin modules">
        {adminModules.map((module) => (
          <Link
            key={module.id}
            to={module.to}
            data-active={activeModule === module.id ? 'true' : undefined}
          >
            {module.label}
          </Link>
        ))}
      </nav>

      {message ? (
        <p className={`form-message ${message.type}`}>{message.text}</p>
      ) : null}

      {children({
        workspace,
        isSuperadmin: access.profile.role === 'superadmin',
        setMessage,
      })}
    </section>
  )
}
