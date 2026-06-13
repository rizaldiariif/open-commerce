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
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600;700&display=swap',
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
  { to: '/products', label: 'Shop' },
  { to: '/cart', label: 'Cart' },
  { to: '/account', label: 'Account' },
  { to: '/setup', label: 'Setup' },
  { to: '/admin', label: 'Admin' },
] as const

function RootComponent() {
  return (
    <RootDocument>
      <ToastProvider>
        <div className="flex min-h-screen flex-col bg-paper text-ink">
          {/* Shop-window ticker decal */}
          <div className="overflow-hidden border-b border-ink bg-band text-band-fg">
            <p className="m-0 px-4 py-2 text-center text-[0.66rem] font-semibold uppercase tracking-[0.28em]">
              Free shipping over Rp500.000 · Made in limited runs · New objects
              every season
            </p>
          </div>

          <header className="sticky top-0 z-40 border-b border-ink bg-paper/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-6 px-5 py-4 md:px-8">
              <Link
                to="/"
                aria-label="Muse home"
                className="font-display text-[1.7rem] font-extrabold leading-none tracking-[-0.05em] no-underline"
              >
                MUSE
              </Link>
              <nav
                aria-label="Primary navigation"
                className="flex flex-wrap items-center gap-1"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-muted no-underline transition-colors hover:text-ink"
                    activeProps={{
                      className:
                        'px-3 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink no-underline',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <span className="mx-2 hidden h-4 w-px bg-line sm:block" />
                <AuthStatus />
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1240px] grow px-5 py-12 md:px-8 md:py-20">
            <Outlet />
          </main>

          <SiteFooter />
        </div>
      </ToastProvider>
    </RootDocument>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-16 bg-band text-band-fg">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-16 md:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p className="m-0 text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-band-fg/55">
              Muse Studio
            </p>
            <p className="mt-4 font-body text-lg leading-relaxed text-band-fg/80">
              Considered everyday objects, made in limited runs and built to
              outlast the season.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-8 gap-y-3"
          >
            {navLinks.slice(0, 3).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-band-fg/70 no-underline transition-colors hover:text-band-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          to="/"
          aria-hidden="true"
          tabIndex={-1}
          className="mt-12 block font-display text-[clamp(4rem,18vw,13rem)] font-extrabold leading-[0.82] tracking-[-0.06em] text-band-fg no-underline"
        >
          MUSE
        </Link>
        <p className="mt-6 text-[0.74rem] text-band-fg/45">
          © {new Date().getFullYear()} Muse Commerce. All objects considered.
        </p>
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
