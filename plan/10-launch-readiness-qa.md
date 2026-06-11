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

- Launch checklist.
- Seed data script/mutation.
- Deployment notes.
- QA notes for payment and email flows.

## Acceptance Checks

- Fresh setup can create first superadmin.
- Admin can create catalog/content.
- Customer can place a paid sandbox order.
- Payment webhook updates order exactly once.
- Fulfillment emails send when shipment status changes.
- No real secrets are committed.

## Dependencies

- 09 Order Management and Fulfillment.

