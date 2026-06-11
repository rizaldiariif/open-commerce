import { useEffect, useState } from 'react'
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { createFileRoute } from '@tanstack/react-router'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation } from 'convex/react'

import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === 'string' && search.redirect.startsWith('/')
        ? search.redirect
        : undefined,
  }),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const { signIn } = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const ensureProfile = useMutation(api.profiles.ensureCurrentUserProfile)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingRedirect || isLoading || !isAuthenticated) {
      return
    }

    let cancelled = false

    void ensureProfile()
      .then(() => {
        if (!cancelled) {
          void navigate({ to: pendingRedirect })
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Unable to finish sign in.',
          )
          setPendingRedirect(null)
          setIsSubmitting(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    ensureProfile,
    isAuthenticated,
    isLoading,
    navigate,
    pendingRedirect,
  ])

  return (
    <section className="auth-page">
      <p className="eyebrow">Account</p>
      <h1>Login</h1>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)

          setError(null)
          setIsSubmitting(true)

          void signIn('password', {
            flow: 'signIn',
            email: String(form.get('email') ?? ''),
            password: String(form.get('password') ?? ''),
          })
            .then(() => setPendingRedirect(search.redirect ?? '/account'))
            .catch((caught: unknown) => {
              setError(
                caught instanceof Error ? caught.message : 'Unable to sign in.',
              )
              setIsSubmitting(false)
            })
        }}
      >
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="form-message error">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in' : 'Login'}
        </button>
      </form>
    </section>
  )
}
