# 08. Email Notifications

## Goal

Send transactional email notifications through a provider-agnostic email module, using Resend for MVP.

## Scope

- Create email provider abstraction.
- Implement Resend provider.
- Add editable email templates where useful.
- Log email attempts in `emailEvents`.
- Send customer emails:
  - invoice created
  - payment confirmed
  - payment failed/expired
  - order processing
  - order in delivery with airwaybill
  - order delivered
  - order cancelled
- Optional admin emails:
  - paid order
  - low stock
- Handle email send failures without breaking order/payment state updates.

## Deliverables

- Email module.
- Email event logging.
- Template/default content.
- Admin email/template screen for superadmin.

## Acceptance Checks

- Emails are attempted at the correct lifecycle transitions.
- Failed email sends are visible in `emailEvents`.
- Payment/order mutations do not roll back just because an email provider call fails.

## Dependencies

- 07 Xendit Payments and Webhooks.

## Completion Notes

- Status: complete on 2026-06-11.
- Added `convex/emails.ts` with provider-agnostic email orchestration, Resend
  delivery, template rendering, and email event logging.
- Added seeded default templates for invoice created, payment confirmed,
  payment failed, payment expired, fulfillment statuses, order cancellation,
  paid-order admin notification, and low-stock admin notification.
- Connected invoice-created, payment-confirmed, payment-failed, and
  payment-expired sends to the existing checkout/payment lifecycle.
- Added optional admin paid-order and low-stock sends after paid webhooks.
- Added a superadmin Emails tab in `/admin` for template edits and recent email
  attempt review.
- Email send failures are recorded in `emailEvents` and do not roll back
  order/payment mutations.

## Build

- Passed: `npm run build`.
- Passed: `npx convex codegen`.

## Manual Test Notes

- Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` or `EMAIL_FROM`, and optionally
  `ADMIN_NOTIFICATION_EMAIL` in the Convex deployment environment.
- Run `npx convex run bootstrap:seedDefaults` and confirm default email
  templates appear in `/admin` under Emails.
- Complete checkout as a customer and confirm an invoice-created email attempt
  is logged.
- Pay a sandbox Xendit invoice and confirm customer payment-confirmed plus
  admin paid-order email attempts are logged.
- Trigger failed and expired payment flows and confirm the matching customer
  email attempts are logged while order/payment state still updates.
- Temporarily use an invalid Resend API key and confirm failed events appear in
  `/admin` without rolling back payment or order status changes.
