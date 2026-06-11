# 05. Storefront Catalog and Cart

## Status

Complete on 2026-06-11.

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

## Completion Notes

- Added `convex/storefront.ts` with public homepage/catalog/product queries and
  signed-in customer cart mutations.
- Homepage renders published editable content, banners, and featured active
  products.
- Product listing and product detail pages render active catalog data, media,
  variant prices, options, and current available stock.
- Add-to-cart requires a signed-in profile and validates active product,
  active variant, positive quantity, and available stock in Convex.
- Cart page supports signed-in cart review, quantity updates, item removal, and
  invalid/unavailable stock states before checkout.
- Basic route metadata was added for homepage, catalog, detail, and cart pages.
- Build passed with `npm run build`.

## Dependencies

- 04 Admin Catalog and Content.
