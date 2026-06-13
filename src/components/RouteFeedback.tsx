import { Link } from '@tanstack/react-router'

export function LoadingState({
  eyebrow = 'Loading',
  title,
  body,
}: Readonly<{
  eyebrow?: string
  title: string
  body?: string
}>) {
  return (
    <section className="loading-state" aria-busy="true">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {body ? <p>{body}</p> : null}
      </div>
      <div className="skeleton-panel">
        <span />
        <span />
        <span />
      </div>
    </section>
  )
}

export function AccessRequired({
  title,
  body,
  redirect,
}: Readonly<{
  title: string
  body: string
  redirect: string
}>) {
  return (
    <section className="content-page">
      <p className="eyebrow">Access</p>
      <h1>{title}</h1>
      <p>{body}</p>
      <div className="action-row">
        <Link to="/login" search={{ redirect }} className="primary-link">
          Login
        </Link>
        <Link to="/products" className="secondary-link">
          Browse products
        </Link>
      </div>
    </section>
  )
}

export function RouteError({
  error,
  reset,
}: Readonly<{
  error: unknown
  reset?: () => void
}>) {
  const message =
    error instanceof Error ? error.message : 'Something went wrong.'

  return (
    <section className="content-page">
      <p className="eyebrow">Problem</p>
      <h1>We could not load this page</h1>
      <p>{message}</p>
      <div className="action-row">
        {reset ? (
          <button type="button" className="primary-link" onClick={reset}>
            Try again
          </button>
        ) : null}
        <Link to="/" className="secondary-link">
          Go home
        </Link>
      </div>
    </section>
  )
}
