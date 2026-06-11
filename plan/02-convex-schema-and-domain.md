# 02. Convex Schema and Core Domain

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

