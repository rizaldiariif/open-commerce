# 01. Foundation and Tooling

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

- `npm install` or selected package manager install succeeds.
- Dev server renders the homepage.
- Convex dev starts without missing env errors unrelated to deployment linking.
- Typecheck passes.
- `.env` stays untracked.

## Dependencies

- Existing `.env` with user-provided service keys.

