# 02. Convex Schema and Core Domain

Status: complete

## Goal

Define the database schema and shared domain types that the rest of the MVP will build on.

## Scope

- Create Convex schema tables:
  - `profiles`
  - `siteSettings`
  - `siteContent`
  - `mediaAssets`
  - `categories`
  - `products`
  - `productVariants`
  - `inventoryMovements`
  - `carts`
  - `cartItems`
  - `customerAddresses`
  - `orders`
  - `orderItems`
  - `payments`
  - `shipments`
  - `coupons`
  - `couponRedemptions`
  - `adminActivityLogs`
  - `emailTemplates`
  - `emailEvents`
- Define status enums:
  - order: `pending_payment`, `paid`, `cancelled`, `payment_failed`
  - payment: `pending`, `paid`, `failed`, `expired`, `refunded`
  - fulfillment: `unfulfilled`, `processing`, `in_delivery`, `delivered`, `cancelled`
- Add shared validation helpers for money, quantities, slugs, and status transitions.
- Add seed/default records for site settings and homepage content.

## Deliverables

- Convex schema with indexes needed by early screens.
- Domain constants/types for statuses and roles.
- Seed or bootstrap mutation for settings/content defaults.

## Acceptance Checks

- Convex codegen succeeds.
- Schema supports product variants, order snapshots, inventory movements, coupon redemptions, and email event logging.
- No tenant fields are introduced.

## Dependencies

- 01 Foundation and Tooling.

## Completion Notes

- Added all MVP Convex tables with early indexes for profile lookup, active catalog browsing, cart retrieval, order/payment/fulfillment management, coupon redemption checks, and email event tracking.
- Added `convex/domain.ts` with role/status constants, status transition guards, slug validation, quantity validation, and integer minor-unit money validation.
- Added the idempotent `bootstrap:seedDefaults` mutation for default site settings and homepage content.
- Verified with `npx convex codegen`, `npm run lint`, `npm run format:check`, and `npm run build`.
