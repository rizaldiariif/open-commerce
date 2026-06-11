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

