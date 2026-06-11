# 06. Checkout, Orders, and Coupons

Status: complete

## Goal

Implement logged-in checkout, order creation, stock deduction, coupon reservation, and pending payment expiry scheduling.

## Scope

- Checkout form for shipping/contact details.
- Customer address save/select.
- Coupon CRUD in admin.
- Coupon validation:
  - fixed amount
  - percentage
  - minimum order
  - percentage cap
  - usage limit
  - optional per-customer limit
  - active date range
  - enabled/disabled
- Create pending order from cart.
- Snapshot order line items, customer contact, address, discounts, and totals.
- Deduct stock in the same Convex mutation that creates the order.
- Reserve coupon redemption for pending order.
- Schedule expiry with `scheduler.runAfter`.
- Add periodic cleanup job as safety net.
- Restore stock and release coupon reservation when pending payment expires or is cancelled before payment.

## Deliverables

- Complete: `/checkout`
- Complete: `/payment/$orderNumber`
- Complete: Admin coupon screens.
- Complete: Order creation mutation.
- Complete: Expiry job.

## Acceptance Checks

- Two customers cannot oversell the same variant.
- Expired pending orders become `payment_failed`.
- Expiry restores inventory once, even if cleanup runs multiple times.
- Coupon usage is reserved while pending, consumed when paid, and released on failure/expiry/cancel before payment.

## Dependencies

- 05 Storefront Catalog and Cart.

## Completion Notes

- Added `convex/checkout.ts` for checkout data, address saving, coupon preview,
  pending order creation, stock reservation, coupon reservation, payment-order
  lookup, and idempotent pending order expiry.
- Added `convex/crons.ts` with a recurring cleanup job for expired pending
  payment orders.
- Added coupon redemption status tracking so pending reservations can be
  released on expiry and later consumed by the payment task.
- Added `/checkout` and `/payment/$orderNumber` routes and changed `/cart` to
  link into checkout when the cart is valid.
- Added coupon management to `/admin`.
- Build passed with `npm run build`.

## Manual Test Notes

- Run `npm run dev:convex` and `npm run dev`, sign in as an admin, create fixed
  and percentage coupons from `/admin`, including minimum subtotal, cap, usage
  limit, per-customer limit, active date range, and disabled scenarios.
- Sign in as a customer, add an in-stock variant to the cart, complete
  `/checkout`, and confirm `/payment/{orderNumber}` shows a pending order with
  snapshotted items and totals.
- Confirm variant `reservedStock` increases when the pending order is created
  and unavailable quantities cannot oversell the variant.
- Use a short pending payment expiry setting, create a pending order, and
  confirm the scheduled expiry or cleanup cron marks it `payment_failed`,
  releases stock once, and changes reserved coupon redemptions to released.
