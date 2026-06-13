import { type ReactNode, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import { LoadingState } from '../../components/RouteFeedback'
import { useToast } from '../../components/Toast'
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
  const workspace = useQuery(
    api.admin.getWorkspace,
    access?.allowed ? { module: activeModule } : 'skip',
  )
  const [message, setMessage] = useState<AdminMessage | null>(null)
  const { notify } = useToast()

  function showMessage(nextMessage: AdminMessage) {
    setMessage(nextMessage)
    notify({
      type: nextMessage.type,
      text: nextMessage.text,
    })
  }

  if (access === undefined || (access.allowed && workspace === undefined)) {
    return (
      <LoadingState
        eyebrow="Operations"
        title="Loading admin workspace"
        body="Preparing the tools for this admin module."
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

  if (workspace === undefined) {
    return (
      <LoadingState
        eyebrow="Operations"
        title="Loading admin workspace"
        body="Preparing the tools for this admin module."
      />
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
        setMessage: showMessage,
      })}
    </section>
  )
}
