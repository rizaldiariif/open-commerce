import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/account/')({
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
    <section className="checkout-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Your account</h1>
          <p>
            Signed in as {access.profile.email}. Review orders, open payments,
            and delivery progress from your MUSE workspace.
          </p>
        </div>
        <Link to="/products" className="secondary-link">
          Continue shopping
        </Link>
      </header>

      <div className="story-row">
        <article className="story-card">
          <p className="eyebrow">Orders</p>
          <h2>Order history</h2>
          <p>Track payment and delivery states for every order.</p>
          <div className="action-row">
            <Link to="/account/orders" className="primary-link">
              View orders
            </Link>
          </div>
        </article>
        <article className="story-card">
          <p className="eyebrow">Profile</p>
          <h2>Contact</h2>
          <p>{access.profile.name ?? access.profile.email}</p>
          {access.profile.phone ? <p>{access.profile.phone}</p> : null}
        </article>
        <article className="story-card">
          <p className="eyebrow">Cart</p>
          <h2>Saved checkout</h2>
          <p>Return to your cart to review quantities before payment.</p>
          <div className="action-row">
            <Link to="/cart" className="secondary-link">
              View cart
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
