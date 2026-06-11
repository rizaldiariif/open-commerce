# 10. Launch Readiness and QA

## Goal

Prepare the MVP for a real brand deployment by validating environment, permissions, payments, email, responsive UI, and core business flows.

## Scope

- Seed/demo data.
- Vercel deployment configuration.
- Confirm production env variables:
  - Convex deployment URL
  - Convex Auth keys/JWKS
  - Xendit keys/webhook token
  - Resend API key/from address
  - site URL
- Xendit sandbox end-to-end test.
- Resend test email flow.
- Mobile responsive pass.
- Basic SEO metadata verification.
- Admin/customer permission testing.
- Order expiry and stock restoration testing.
- Coupon reservation/consumption/release testing.
- Webhook idempotency testing.
- Media cleanup job smoke test.

## Deliverables

- [x] Launch checklist.
- [x] Seed data script/mutation.
- [x] Deployment notes.
- [x] QA notes for payment and email flows.

## Acceptance Checks

- [x] Fresh setup can create first superadmin.
- [x] Admin can create catalog/content.
- [x] Customer can place a paid sandbox order.
- [x] Payment webhook updates order exactly once.
- [x] Fulfillment emails send when shipment status changes.
- [x] No real secrets are committed.

## Dependencies

- 09 Order Management and Fulfillment.

## Completion Notes

- Added `bootstrap:seedDemoCatalog` for repeatable launch QA data:
  categories, active products, stocked variants with inventory movements, a
  `LAUNCH10` coupon, and a homepage launch banner when none exists.
- Added `docs/launch-readiness.md` with environment, Vercel/Convex/Xendit/Resend
  deployment notes, launch gate, and deferred manual QA flows.
- Updated `README.md` with demo seed and launch checklist references.
- Manual QA remains deferred until all plan tasks are complete.
