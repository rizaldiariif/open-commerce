# 09. Order Management and Fulfillment

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

- `/admin/orders`
- `/admin/orders/$id`
- `/account`
- `/account/orders`
- `/account/orders/$orderNumber`
- Shipment mutations.
- Manual refund mutation.

## Acceptance Checks

- Customers can only see their own orders.
- Admins can manage all orders.
- Delivery progress updates `fulfillmentStatus`, not commercial `order.status`.
- Manual refund records do not call Xendit refund APIs.

## Dependencies

- 08 Email Notifications.

