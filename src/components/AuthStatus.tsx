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
    return <span className="header-action muted">Checking session</span>
  }

  if (!isAuthenticated || !current) {
    return (
      <>
        <Link to="/login" search={{ redirect: undefined }}>
          Login
        </Link>
        <Link to="/register" className="header-action primary">
          Register
        </Link>
      </>
    )
  }

  const label = current.profile?.name ?? current.user.email ?? 'Account'

  return (
    <>
      <Link to="/account" className="header-action truncate">
        {label}
      </Link>
      <button
        type="button"
        onClick={() => {
          void signOut().then(() => navigate({ to: '/' }))
        }}
      >
        Sign out
      </button>
    </>
  )
}
