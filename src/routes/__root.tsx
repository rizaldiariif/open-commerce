import type { ReactNode } from 'react'
import { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'

import appCss from '../styles/app.css?url'
import { AuthStatus } from '../components/AuthStatus'
import { RouteError } from '../components/RouteFeedback'
import { ToastProvider } from '../components/Toast'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Muse — Goods of Considered Make',
      },
      {
        name: 'description',
        content: 'A single-brand studio for considered everyday objects.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} />
  ),
})

const navLinks = [
  { to: '/products', label: 'All goods' },
  { to: '/products', label: 'New' },
  { to: '/products', label: 'Home' },
  { to: '/products', label: 'Storage' },
  { to: '/products', label: 'Stationery' },
  { to: '/products', label: 'Travel' },
] as const

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAdmin = pathname.startsWith('/admin')

  return (
    <RootDocument>
      <ToastProvider>
        <div className={`app-shell ${isAdmin ? 'admin-shell' : ''}`}>
          <div className="promo-bar">
            <p>
              {isAdmin
                ? 'MUSE operations workspace'
                : 'Free shipping over Rp500.000 · New everyday goods are ready now'}
            </p>
          </div>

          <header className="store-header">
            <div className="store-header-main">
              <Link
                to="/"
                aria-label="Muse home"
                className="store-brand"
              >
                MUSE
              </Link>
              <form className="store-search" action="/products" role="search">
                <select aria-label="Search category" defaultValue="all">
                  <option value="all">All categories</option>
                  <option value="home">Home</option>
                  <option value="storage">Storage</option>
                  <option value="stationery">Stationery</option>
                </select>
                <input
                  name="q"
                  type="search"
                  placeholder="What are you looking for?"
                  aria-label="Search products"
                />
                <button type="submit">Search</button>
              </form>
              <nav aria-label="Account navigation" className="header-actions">
                <Link to="/cart">Cart</Link>
                <AuthStatus />
              </nav>
            </div>
            {!isAdmin ? (
              <nav className="category-nav" aria-label="Primary navigation">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    activeProps={{ 'data-active': 'true' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </header>

          <main className="app-main">
            <Outlet />
          </main>

          {!isAdmin ? <SiteFooter /> : null}
        </div>
      </ToastProvider>
    </RootDocument>
  )
}

function SiteFooter() {
  const footerGroups = [
    {
      title: 'Get help',
      links: ['Shipping policy', 'Returns', 'FAQ', 'Contact us'],
    },
    {
      title: 'About',
      links: ['About MUSE', 'Materials', 'Store information', 'Care guide'],
    },
    {
      title: 'Top searches',
      links: ['Storage', 'Bags', 'Tableware', 'Stationery'],
    },
  ]

  return (
    <footer className="store-footer">
      <div className="store-footer-main">
        {footerGroups.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((label) => (
                <li key={label}>
                  <Link to="/products">{label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="newsletter-panel">
          <h2>Subscribe</h2>
          <p>
            Receive product notes, care guides, and seasonal arrivals from
            MUSE.
          </p>
          <div className="newsletter-form">
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
            />
            <button type="button">Sign up</button>
          </div>
        </section>
      </div>
      <div className="store-footer-bottom">
        <Link to="/" className="store-footer-brand">
          MUSE
        </Link>
        <p>© {new Date().getFullYear()} Muse Commerce. All goods considered.</p>
      </div>
    </footer>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
