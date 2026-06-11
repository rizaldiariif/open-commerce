# Progress

This file is the shared progress log for future Codex threads. Update it at the start and end of every task.

## Current Status

- TanStack Start app scaffold exists with the initial storefront/admin shell routes.
- Convex project files and generated bindings exist.
- `.gitignore` and `.env.example` exist and include the current local development variables.
- Local `.env` exists and is intentionally untracked.
- `SETUP_TOKEN`, `JWT_PRIVATE_KEY`, and `JWKS` were generated locally.
- `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, and `VITE_CONVEX_SITE_URL` are set in ignored local env files after Convex linking.
- Task 01 foundation/tooling is complete and ready for manual review.
- Task 02 Convex schema/domain is complete and ready for manual review.
- Task 03 authentication/roles/bootstrap is complete and ready for manual review.

## Task Log

### Task 03: Authentication, Roles, and Bootstrap

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added Convex Auth email/password configuration, auth HTTP routes, auth tables, and generated bindings.
  - Added authenticated profile synchronization with default `customer` role.
  - Added role guard queries for admin, superadmin, and customer account access.
  - Added one-time `/setup` bootstrap flow guarded by `SETUP_TOKEN` that promotes the signed-in first account to `superadmin` and disables itself afterward.
  - Added working login/register/sign-out UI, auth-aware shell navigation, guarded `/admin`, and guarded `/account`.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
  - Passed: `npm run lint`.
  - Passed: `npm run format:check`.
- Manual test:
  - Run `npm run dev:convex` and `npm run dev`, register a user, visit `/setup`, enter the local `SETUP_TOKEN`, and confirm `/admin` opens for the bootstrapped superadmin.
  - Confirm invalid setup tokens fail, `/setup` disables after the first superadmin exists, and unauthenticated/customer sessions cannot access `/admin`.
- Commit:
  - `a474445`.

### Task 02: Convex Schema and Core Domain

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added the full single-brand MVP Convex schema for profiles, settings/content, media, catalog, carts, addresses, orders, payments, shipments, coupons, admin activity, and email events.
  - Added shared domain constants and validation helpers for roles, statuses, status transitions, slugs, quantities, and money amounts.
  - Added idempotent `bootstrap:seedDefaults` mutation for default site settings and homepage content.
  - Updated README and this task file with schema/bootstrap notes.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
  - Passed: `npm run lint`.
  - Passed: `npm run format:check`.
- Manual test:
  - With Convex running, run `npx convex run bootstrap:seedDefaults` and confirm it reports `created` on the first run and `exists` afterward.
- Commit:
  - `f60437a`.

### Task 01: Foundation and Tooling

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Scaffolded TanStack Start with TypeScript, Vite, React, ESLint, Prettier, and npm scripts.
  - Added Convex packages, initialized Convex functions/schema, generated bindings, and linked a cloud dev deployment.
  - Synced real Convex deployment values into ignored local env files.
  - Added the app shell and routes for `/`, `/products`, `/cart`, `/login`, `/register`, `/admin`, and `/api/health`.
  - Updated README and `.env.example`.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npm run lint`.
  - Passed: `npm run format:check`.
  - Passed: `npm run dev:convex -- --once --tail-logs disable`.
  - Passed: dev-server HTTP 200 route sweep for the initial pages and health route.
  - Passed: browser smoke check for homepage title and hero heading.
- Manual test:
  - Run `npm run dev` and visit `/`, `/products`, `/cart`, `/login`, `/register`, `/admin`, and `/api/health`.
- Commit:
  - `bf7ad8b4123b167b00efa30c70755b93af978b87`.

### Planning Setup

- Status: complete
- Summary:
  - Created MVP plan in `muse-commerce-mvp-plan.html`.
  - Clarified status model, Xendit webhook behavior, coupon lifecycle, superadmin bootstrap, media deletion, and data model notes.
  - Created `.gitignore` and `.env.example`.
  - Created task plan files under `plan/`.
  - Added this workflow for future Codex threads.
- Build:
  - Not run. No app has been scaffolded yet.
- Manual test:
  - Not applicable yet.

## Next Task

Start `plan/03-auth-roles-bootstrap.md` in a new Codex thread after Task 02 is committed and pushed.
