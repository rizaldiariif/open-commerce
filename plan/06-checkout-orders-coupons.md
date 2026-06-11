# 06. Checkout, Orders, and Coupons

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

- `/checkout`
- `/payment/$orderNumber`
- Admin coupon screens.
- Order creation mutation.
- Expiry job.

## Acceptance Checks

- Two customers cannot oversell the same variant.
- Expired pending orders become `payment_failed`.
- Expiry restores inventory once, even if cleanup runs multiple times.
- Coupon usage is reserved while pending, consumed when paid, and released on failure/expiry/cancel before payment.

## Dependencies

- 05 Storefront Catalog and Cart.

