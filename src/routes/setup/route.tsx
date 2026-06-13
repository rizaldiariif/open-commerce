import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/setup')({
  component: Setup,
})

function Setup() {
  const status = useQuery(api.profiles.bootstrapStatus)
  const current = useQuery(api.profiles.current)
  const bootstrapSuperadmin = useMutation(api.profiles.bootstrapSuperadmin)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status?.hasSuperadmin) {
    return (
      <section className="auth-page">
        <p className="eyebrow">Setup</p>
        <h1>Bootstrap complete</h1>
        <p>The first superadmin already exists, so setup is disabled.</p>
        <div className="action-row">
          <Link to="/admin" className="primary-link">
            Open admin
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page">
      <p className="eyebrow">Setup</p>
      <h1>First superadmin</h1>
      <p>
        Sign in or register, then enter the local setup token to promote this
        account.
      </p>
      {!current ? (
        <div className="action-row">
          <Link
            to="/login"
            search={{ redirect: '/setup' }}
            className="primary-link"
          >
            Login
          </Link>
          <Link to="/register" className="secondary-link">
            Register
          </Link>
        </div>
      ) : (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)

            setError(null)
            setMessage(null)
            setIsSubmitting(true)

            void bootstrapSuperadmin({
              setupToken: String(form.get('setupToken') ?? ''),
            })
              .then(() => {
                setMessage('Superadmin bootstrap complete.')
              })
              .catch((caught: unknown) => {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : 'Unable to complete setup.',
                )
              })
              .finally(() => setIsSubmitting(false))
          }}
        >
          <label>
            Setup token
            <input
              type="password"
              name="setupToken"
              autoComplete="one-time-code"
              required
            />
          </label>
          {message ? <p className="form-message success">{message}</p> : null}
          {error ? <p className="form-message error">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Bootstrapping' : 'Create superadmin'}
          </button>
        </form>
      )}
    </section>
  )
}
