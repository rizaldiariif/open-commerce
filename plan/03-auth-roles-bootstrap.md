# 03. Authentication, Roles, and Bootstrap

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

- New users default to `customer`.
- A valid setup token can create the first `superadmin`.
- Invalid setup token fails.
- Bootstrap cannot create a second superadmin after one exists.
- Admin routes reject unauthenticated users and customers.

## Dependencies

- 01 Foundation and Tooling.
- 02 Convex Schema and Core Domain.

