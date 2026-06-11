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

## Completion Notes

- Status: complete on 2026-06-11.
- Added `convex/xendit.ts` for Xendit invoice creation and webhook token
  verification.
- Added `convex/payments.ts` with invoice creation, payment state mutations, and
  `/api/xendit/webhook` handling through `convex/http.ts`.
- Added `paymentWebhookEvents` for processed, duplicate, and rejected webhook
  decisions with raw payload metadata for debugging.
- Checkout now creates a Xendit invoice after the pending order is created, and
  `/payment/$orderNumber` shows the Xendit invoice link while payment is
  pending.
- Paid/settled webhooks mark payment/order paid, reduce stock, clear reserved
  stock, and consume reserved coupon redemptions once.
- Failed/expired webhooks mark the order `payment_failed`, update payment
  status, release reserved stock, and release reserved coupons through the same
  idempotent pending-order release helper used by expiry cleanup.

## Build

- Passed: `npm run build`.
- Passed: `npx convex codegen`.

## Manual Test Notes

- Set `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`, and
  `XENDIT_CALLBACK_URL=https://<deployment>.convex.site/api/xendit/webhook` in
  the Convex deployment environment.
- Run `npm run dev:convex` and `npm run dev`, complete checkout as a signed-in
  customer, and confirm the payment page shows a Xendit invoice link.
- Pay a sandbox invoice and confirm the webhook marks payment/order `paid`,
  reduces `stockOnHand`, reduces `reservedStock`, and consumes any reserved
  coupon exactly once.
- Send the same webhook payload again and confirm a duplicate webhook event is
  stored without changing stock or coupon counts again.
- Send failed and expired sandbox webhook payloads and confirm stock/coupon
  reservations are released exactly once.
- Send mismatched amount, currency, or external ID payloads and confirm they are
  recorded as rejected webhook events without changing order/payment state.
