# 07. Xendit Payments and Webhooks

## Goal

Connect checkout orders to Xendit invoices and make payment status updates reliable and idempotent.

## Scope

- Create Xendit invoice after pending order creation.
- Store invoice ID, external ID, invoice URL, amount, currency, and status.
- Handle invoice creation failure:
  - mark order `payment_failed`
  - restore inventory
  - release coupon reservation
  - show retryable checkout error
- Implement `/api/xendit/webhook`.
- Verify webhook token/signature.
- Ignore duplicate webhook events.
- Validate amount, currency, and order reference.
- Map paid/settled to payment `paid` and order `paid`.
- Map failed to payment `failed` and order `payment_failed`.
- Map expired to payment `expired` and order `payment_failed`.
- Ensure failed/expired flows restore stock and release coupon reservation once.

## Deliverables

- Xendit invoice client/module.
- Webhook route.
- Payment status mutations.
- Webhook event metadata stored for debugging.

## Acceptance Checks

- Sandbox invoice can be created.
- Webhook updates the matching order.
- Duplicate webhooks do not double-restore stock or double-consume coupon usage.
- Mismatched amount/currency/order reference is rejected or flagged.

## Dependencies

- 06 Checkout, Orders, and Coupons.

