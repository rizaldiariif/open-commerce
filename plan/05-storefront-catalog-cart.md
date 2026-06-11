# 05. Storefront Catalog and Cart

## Goal

Build the public shopping experience up to the point before checkout.

## Scope

- Homepage renders editable site content.
- Product listing page.
- Product detail page with variants and images.
- Add-to-cart for logged-in customers.
- Cart page.
- Cart quantity update/remove.
- Stock-aware cart validation.
- Empty/loading/error states.
- Basic SEO metadata.

## Deliverables

- `/`
- `/products`
- `/products/$slug`
- `/cart`

## Acceptance Checks

- Customers can browse products without logging in.
- Checkout action requires login.
- Cart cannot persist invalid variant IDs or impossible quantities.
- Product pages use current product data while future orders snapshot historical data separately.

## Dependencies

- 04 Admin Catalog and Content.

