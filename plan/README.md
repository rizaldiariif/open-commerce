# Muse Commerce Implementation Plan

This folder splits the MVP into workable implementation chunks. Each chunk should be small enough to complete, verify, and review independently while still moving toward the full single-brand ecommerce app.

## Required Workflow

Before starting any implementation task, read [WORKFLOW.md](WORKFLOW.md) and update [PROGRESS.md](PROGRESS.md). Each task should happen in a new Codex thread, pass build before completion, update docs/progress, then commit and push to `main`.

## Recommended Order

1. [Foundation and Tooling](01-foundation-and-tooling.md)
2. [Convex Schema and Core Domain](02-convex-schema-and-domain.md)
3. [Authentication, Roles, and Bootstrap](03-auth-roles-bootstrap.md)
4. [Admin Catalog and Content](04-admin-catalog-content.md)
5. [Storefront Catalog and Cart](05-storefront-catalog-cart.md)
6. [Checkout, Orders, and Coupons](06-checkout-orders-coupons.md)
7. [Xendit Payments and Webhooks](07-xendit-payments-webhooks.md)
8. [Email Notifications](08-email-notifications.md)
9. [Order Management and Fulfillment](09-order-management-fulfillment.md)
10. [Launch Readiness and QA](10-launch-readiness-qa.md)

## Working Rules

- Keep each chunk shippable before moving to the next.
- Prefer Convex mutations for business-critical writes so stock, coupon, and order updates stay transactional.
- Treat `.env` as local-only. Update `.env.example` when new required variables are introduced.
- Add tests or verification scripts for risky logic: stock movement, coupon redemption, payment webhook idempotency, and role guards.
- Keep the app single-brand. Do not add tenant tables, tenant routing, or tenant-level permissions during the MVP.
