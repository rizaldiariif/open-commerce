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

## Task Log

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

Start `plan/02-convex-schema-and-domain.md` in a new Codex thread after Task 01 is committed and pushed.
