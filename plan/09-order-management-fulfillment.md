# 09. Order Management and Fulfillment

Status: complete on 2026-06-11.

## Goal

Build admin order operations and customer order history through fulfillment.

## Scope

- Admin order list and filters.
- Admin order detail.
- Customer account page.
- Customer order history/detail.
- Mark fulfillment `processing`.
- Add/update shipment:
  - courier name
  - airwaybill number
  - shipped date
  - delivered date
  - admin user reference
- Mark fulfillment `in_delivery`.
- Mark fulfillment `delivered`.
- Manual refund status recording.
- Admin activity logging for order/shipment/refund changes.
- Send fulfillment/status emails.

## Deliverables

- Done: `/admin/orders`.
- Done: `/admin/orders/$id`.
- Done: `/account`.
- Done: `/account/orders`.
- Done: `/account/orders/$orderNumber`.
- Done: shipment mutations.
- Done: manual refund mutation.

## Acceptance Checks

- Done: customers can only see their own orders.
- Done: admins can manage all orders.
- Done: delivery progress updates `fulfillmentStatus`, not commercial
  `orderStatus`.
- Done: manual refund records do not call Xendit refund APIs.

## Completion Notes

- Added `convex/orders.ts` with admin order list/detail queries, customer
  order history/detail queries, shipment updates, fulfillment email enqueueing,
  and manual refund recording.
- Added shipment admin actor references and a `manualRefunds` table.
- Added admin order routes for filtering, shipment updates, and local-only
  refund status recording.
- Added account order history/detail routes for customer-owned orders.
- Build passed with `npm run build`; Convex bindings were regenerated with
  `npx convex codegen`.

## Manual Test Notes

- After all plan tasks are complete, sign in as an admin, open `/admin/orders`,
  and confirm recent orders can be filtered by text and fulfillment status.
- Open a paid order at `/admin/orders/$id`, mark it `processing`, then
  `in_delivery` with courier and airwaybill details, then `delivered`; confirm
  `fulfillmentStatus` changes while `orderStatus` remains `paid`.
- Confirm fulfillment email attempts are logged for processing, in-delivery, and
  delivered updates.
- Record a manual refund and confirm payment status becomes `refunded`, a
  `manualRefunds` record exists, admin activity is logged, and no Xendit refund
  API is called.
- Sign in as the customer who placed the order and confirm `/account/orders`
  and `/account/orders/$orderNumber` show only that customer's orders.

## Dependencies

- 08 Email Notifications.
