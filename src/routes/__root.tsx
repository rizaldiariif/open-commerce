import type { ReactNode } from 'react'
import { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
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
        title: 'Muse Commerce',
      },
      {
        name: 'description',
        content: 'Single-brand ecommerce storefront and admin app.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} />
  ),
})

function RootComponent() {
  return (
    <RootDocument>
      <ToastProvider>
        <div className="app-shell">
          <header className="site-header">
            <Link to="/" className="brand-mark" aria-label="Muse Commerce home">
              Muse Commerce
            </Link>
            <nav className="primary-nav" aria-label="Primary navigation">
              <Link to="/products" activeProps={{ 'data-status': 'active' }}>
                Products
              </Link>
              <Link to="/cart" activeProps={{ 'data-status': 'active' }}>
                Cart
              </Link>
              <Link to="/account" activeProps={{ 'data-status': 'active' }}>
                Account
              </Link>
              <Link to="/setup" activeProps={{ 'data-status': 'active' }}>
                Setup
              </Link>
              <Link to="/admin" activeProps={{ 'data-status': 'active' }}>
                Admin
              </Link>
            </nav>
            <AuthStatus />
          </header>
          <main>
            <Outlet />
          </main>
        </div>
      </ToastProvider>
    </RootDocument>
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
