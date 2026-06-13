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

  const linkClass =
    'px-3 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-muted no-underline transition-colors hover:text-ink'

  if (isLoading || current === undefined) {
    return (
      <span className="px-3 py-2 text-[0.74rem] uppercase tracking-[0.1em] text-faint">
        Checking session
      </span>
    )
  }

  if (!isAuthenticated || !current) {
    return (
      <>
        <Link
          to="/login"
          search={{ redirect: undefined }}
          className={linkClass}
        >
          Login
        </Link>
        <Link
          to="/register"
          className="inline-flex min-h-[36px] items-center bg-ink px-4 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-paper no-underline transition-colors hover:bg-ink-soft"
        >
          Register
        </Link>
      </>
    )
  }

  const label = current.profile?.name ?? current.user.email ?? 'Account'

  return (
    <>
      <Link to="/account" className={`${linkClass} max-w-[14ch] truncate`}>
        {label}
      </Link>
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent px-3 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
        onClick={() => {
          void signOut().then(() => navigate({ to: '/' }))
        }}
      >
        Sign out
      </button>
    </>
  )
}
