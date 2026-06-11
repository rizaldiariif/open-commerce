# 01. Foundation and Tooling

## Status

- Complete as of 2026-06-11.
- Commit: `bf7ad8b4123b167b00efa30c70755b93af978b87`.
- Notes:
  - Scaffolded the TanStack Start app directly in this repository.
  - Linked a Convex cloud development deployment through the local CLI.
  - Local `.env` now contains real Convex deployment URLs and remains ignored.

## Goal

Create the runnable TanStack Start application skeleton with Convex connected, basic project tooling, and environment loading in place.

## Scope

- Scaffold TanStack Start app in the current repository.
- Configure TypeScript, linting, formatting, and package scripts.
- Install Convex client/server packages.
- Initialize Convex project files.
- Link local Convex development deployment.
- Fill real `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` in local `.env`.
- Add basic app shell routes:
  - `/`
  - `/products`
  - `/cart`
  - `/login`
  - `/register`
  - `/admin`
- Add simple health route or page check.

## Deliverables

- `package.json` with dev/build/typecheck scripts.
- TanStack Start source structure.
- Convex initialized.
- Local dev server can boot.
- Convex dev can boot.
- `.env.example` remains accurate.

## Acceptance Checks

- Complete: `npm install` succeeds.
- Complete: dev server renders the homepage at `/`.
- Complete: Convex dev starts with `npm run dev:convex -- --once --tail-logs disable`.
- Complete: `npm run build` passes, including `tsc --noEmit`.
- Complete: `.env` and `.env.local` stay untracked/ignored.

## Implementation Notes

- Package manager: npm.
- Primary scripts:
  - `npm run dev`
  - `npm run dev:convex`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run format:check`
- Added app routes:
  - `/`
  - `/products`
  - `/cart`
  - `/login`
  - `/register`
  - `/admin`
  - `/api/health`
- Verification completed:
  - `npm run lint`
  - `npm run format:check`
  - `npm run build`
  - HTTP 200 route sweep for `/`, `/products`, `/cart`, `/login`, `/register`, `/admin`, and `/api/health`.
  - Browser smoke check confirmed the homepage title and hero heading.

## Dependencies

- Existing `.env` with user-provided service keys.
