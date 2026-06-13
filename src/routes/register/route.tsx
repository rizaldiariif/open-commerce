import { useEffect, useState } from 'react'
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'

import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/register')({
  component: Register,
})

function Register() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const ensureProfile = useMutation(api.profiles.ensureCurrentUserProfile)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shouldCompleteSignup, setShouldCompleteSignup] = useState(false)

  useEffect(() => {
    if (!shouldCompleteSignup || isLoading || !isAuthenticated) {
      return
    }

    let cancelled = false

    void ensureProfile()
      .then(() => {
        if (!cancelled) {
          void navigate({ to: '/account' })
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Unable to finish account setup.',
          )
          setShouldCompleteSignup(false)
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
    shouldCompleteSignup,
  ])

  return (
    <section className="auth-page">
      <p className="eyebrow">Account</p>
      <h1>Register</h1>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)

          setError(null)
          setIsSubmitting(true)

          void signIn('password', {
            flow: 'signUp',
            name: String(form.get('name') ?? ''),
            email: String(form.get('email') ?? ''),
            password: String(form.get('password') ?? ''),
          })
            .then(() => setShouldCompleteSignup(true))
            .catch((caught: unknown) => {
              setError(
                caught instanceof Error
                  ? caught.message
                  : 'Unable to create account.',
              )
              setIsSubmitting(false)
            })
        }}
      >
        <label>
          Name
          <input type="text" name="name" autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error ? <p className="form-message error">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account' : 'Create account'}
        </button>
      </form>
    </section>
  )
}
