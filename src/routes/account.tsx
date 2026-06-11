import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/account')({
  component: Account,
})

function Account() {
  const access = useQuery(api.profiles.requireCustomerAccount)

  if (access === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Account</p>
        <h1>Your account</h1>
        <p>Checking session.</p>
      </section>
    )
  }

  if (!access.allowed || !access.profile) {
    return (
      <section className="content-page">
        <p className="eyebrow">Account</p>
        <h1>Login required</h1>
        <p>Sign in to view your account and order history.</p>
        <div className="action-row">
          <Link
            to="/login"
            search={{ redirect: '/account' }}
            className="primary-link"
          >
            Login
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="content-page">
      <p className="eyebrow">Account</p>
      <h1>Your account</h1>
      <p>
        Signed in as {access.profile.email}. Order history and address
        management arrive with the checkout and order tasks.
      </p>
    </section>
  )
}
