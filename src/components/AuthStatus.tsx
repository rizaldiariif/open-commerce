import { useEffect } from 'react'
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

export function AuthStatus() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const current = useQuery(api.profiles.current)
  const ensureProfile = useMutation(api.profiles.ensureCurrentUserProfile)

  useEffect(() => {
    if (isAuthenticated && current && !current.profile) {
      void ensureProfile()
    }
  }, [current, ensureProfile, isAuthenticated])

  if (isLoading || current === undefined) {
    return (
      <nav className="account-nav" aria-label="Account navigation">
        <span className="nav-muted">Checking session</span>
      </nav>
    )
  }

  if (!isAuthenticated || !current) {
    return (
      <nav className="account-nav" aria-label="Account navigation">
        <Link
          to="/login"
          search={{ redirect: undefined }}
          activeProps={{ 'data-status': 'active' }}
        >
          Login
        </Link>
        <Link to="/register" activeProps={{ 'data-status': 'active' }}>
          Register
        </Link>
      </nav>
    )
  }

  const label = current.profile?.name ?? current.user.email ?? 'Account'

  return (
    <nav className="account-nav" aria-label="Account navigation">
      <Link to="/account" activeProps={{ 'data-status': 'active' }}>
        {label}
      </Link>
      <button
        type="button"
        className="nav-button"
        onClick={() => {
          void signOut().then(() => navigate({ to: '/' }))
        }}
      >
        Sign out
      </button>
    </nav>
  )
}
