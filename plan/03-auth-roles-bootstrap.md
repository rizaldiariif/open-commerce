# 03. Authentication, Roles, and Bootstrap

## Status

Complete on 2026-06-11.

## Goal

Implement Convex Auth, user profiles, role guards, and the one-time superadmin bootstrap.

## Scope

- Configure Convex Auth.
- Support email/password auth for MVP.
- Create/update profile records after signup/sign-in.
- Add roles: `superadmin`, `admin`, `customer`.
- Implement route guards:
  - Admin pages require `superadmin` or `admin`.
  - System settings/admin-user management require `superadmin`.
  - Customer account/order pages require authenticated customer.
- Implement one-time superadmin bootstrap guarded by `SETUP_TOKEN`.
- Disable bootstrap after the first superadmin exists.
- Add sign out flow.

## Deliverables

- Login/register screens.
- Auth-aware app shell.
- Admin route protection.
- Bootstrap action or page for first superadmin.

## Acceptance Checks

- [x] New users default to `customer`.
- [x] A valid setup token can create the first `superadmin`.
- [x] Invalid setup token fails.
- [x] Bootstrap cannot create a second superadmin after one exists.
- [x] Admin routes reject unauthenticated users and customers.

## Completion Notes

- Added Convex Auth with email/password provider, auth HTTP routes, auth tables, and generated bindings.
- Added profile synchronization for signed-in users and role guard queries for admin, superadmin, and account access.
- Added one-time `/setup` superadmin bootstrap that requires an authenticated user plus `SETUP_TOKEN`.
- Added working `/login`, `/register`, `/account`, and auth-aware shell/sign-out behavior.
- Added `/admin` access gating for `admin` and `superadmin` profiles.
- Verified with `npm run build`, `npm run lint`, and `npm run format:check`.

## Manual Test Notes

- Start Convex and the web app, register a user, and confirm `/account` shows the signed-in email.
- Visit `/setup`, enter the local `SETUP_TOKEN`, and confirm the account can open `/admin`.
- Confirm an invalid setup token shows an error and that `/setup` reports bootstrap complete after the first superadmin exists.

## Dependencies

- 01 Foundation and Tooling.
- 02 Convex Schema and Core Domain.
