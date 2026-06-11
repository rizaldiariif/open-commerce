# Progress

This file is the shared progress log for future Codex threads. Update it at the start and end of every task.

## Current Status

- TanStack Start app scaffold exists with the initial storefront/admin shell routes.
- Convex project files and generated bindings exist.
- `.gitignore` and `.env.example` exist and include the current local development variables.
- Local `.env` exists and is intentionally untracked.
- `SETUP_TOKEN`, `JWT_PRIVATE_KEY`, and `JWKS` were generated locally.
- `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, and `VITE_CONVEX_SITE_URL` are set in ignored local env files after Convex linking.
- Task 01 foundation/tooling is complete and ready for manual review.
- Task 02 Convex schema/domain is complete and ready for manual review.
- Task 03 authentication/roles/bootstrap is complete and ready for manual review.
- Task 04 admin catalog/content is complete and ready for manual review.
- Task 05 storefront catalog/cart is complete and ready for manual review.
- Task 06 checkout/orders/coupons is complete and ready for manual review.
- Task 07 Xendit payments/webhooks is complete and ready for manual review.

## Task Log

### Task 07: Xendit Payments and Webhooks

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added a Xendit invoice client/action that creates invoices after pending
    order creation and records provider invoice ID, external ID/reference,
    checkout URL, amount, currency, raw status, and expiry.
  - Added `/api/xendit/webhook` on the Convex HTTP router with callback-token
    verification, payload validation, duplicate event detection, and
    debuggable webhook event storage.
  - Added idempotent payment mutations for paid/settled, failed, expired, and
    pending webhook states.
  - Paid/settled webhooks now mark payment/order paid, reduce stock, release
    reserved stock, and consume reserved coupons exactly once.
  - Failed/expired invoice creation or webhooks now mark orders
    `payment_failed`, update payment status, release stock reservations, and
    release coupon reservations through the pending-order release helper.
  - Updated checkout to create the invoice before redirecting to payment, and
    updated the payment page to show the Xendit invoice link while pending.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
- Docs updated:
  - Updated `README.md`.
  - Updated `.env.example`.
  - Updated `plan/07-xendit-payments-webhooks.md`.
- Manual test:
  - Set `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`, and
    `XENDIT_CALLBACK_URL=https://<deployment>.convex.site/api/xendit/webhook`
    in the Convex deployment environment.
  - Run `npm run dev:convex` and `npm run dev`, complete checkout as a signed-in
    customer, and confirm the payment page shows a Xendit invoice link.
  - Pay a sandbox invoice and confirm webhook handling marks the order/payment
    paid, reduces stock, clears reserved stock, and consumes any reserved coupon
    exactly once.
  - Replay the same webhook payload and confirm a duplicate event is stored
    without changing stock or coupon counts again.
  - Send failed/expired webhook payloads and confirm reservations are released
    exactly once.
  - Send mismatched amount, currency, or external ID payloads and confirm
    rejected webhook events are stored without state changes.
- Commit:
  - `f0e205a`.

### Task 06: Checkout, Orders, and Coupons

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added logged-in checkout data, saved address support, pending order
    creation, line/contact/address snapshots, stock reservation, coupon
    reservation, and payment-order lookup in Convex.
  - Added idempotent pending order expiry plus a recurring cleanup cron that
    marks expired orders `payment_failed`, releases reserved stock, and releases
    reserved coupon redemptions.
  - Added admin coupon CRUD for fixed amount and percentage discounts with
    minimum subtotal, percentage cap, total usage limit, per-customer limit,
    active window, and enable/disable controls.
  - Added `/checkout` and `/payment/$orderNumber`, and updated `/cart` to enter
    checkout when cart items are valid.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
- Docs updated:
  - Updated `README.md`.
  - Updated `plan/06-checkout-orders-coupons.md`.
- Manual test:
  - Run `npm run dev:convex` and `npm run dev`, sign in as an admin, and create
    fixed and percentage coupons from `/admin` covering minimum subtotal, cap,
    total/per-customer limits, active dates, and disabled states.
  - Sign in as a customer, add an in-stock variant to the cart, complete
    `/checkout`, and confirm `/payment/{orderNumber}` shows the pending order.
  - Confirm pending order creation increases variant `reservedStock`, prevents
    oversell, reserves coupon usage, and expiry releases stock/coupon
    reservation exactly once.
- Commit:
  - `72ec2d9`.

### Task 05: Storefront Catalog and Cart

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added public Convex storefront queries for homepage content, active product listing, and product details with media URLs, categories, variants, pricing, and available stock.
  - Added logged-in customer cart mutations for add-to-cart, quantity updates, item removal, and server-side validation of product/variant availability and stock.
  - Replaced placeholder `/`, `/products`, and `/cart` screens with live storefront views and added `/products/$slug` product detail pages.
  - Added responsive storefront/cart styling and basic SEO metadata for the new public routes.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
- Docs updated:
  - Updated `README.md`.
  - Updated `plan/05-storefront-catalog-cart.md`.
- Manual test:
  - Run `npm run dev:convex` and `npm run dev`, publish at least one active product with an active variant from `/admin`, then visit `/`, `/products`, and `/products/{slug}` while signed out.
  - Confirm browsing works while signed out and add-to-cart prompts login.
  - Sign in as a customer, add an in-stock variant to the cart, update quantity, remove it, and confirm impossible quantities are rejected.

### Task 04: Admin Catalog and Content

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added guarded Convex admin functions for categories, products, variants, media, inventory adjustments, homepage content, superadmin-only settings, and activity logging.
  - Extended schema/default content for logo, favicon, pending payment expiry minutes, homepage banners, about/footer text, and media soft deletion metadata.
  - Replaced the `/admin` placeholder with a tabbed admin console covering catalog, inventory, media, content, settings, and activity review.
  - Kept variant stock consistent through append-only `inventoryMovements` on initial stock and later adjustments.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
  - Passed: `npm run lint`.
- Docs updated:
  - Updated `README.md`.
  - Updated `plan/04-admin-catalog-content.md`.
- Manual test:
  - Run `npm run dev:convex` and `npm run dev`, sign in as the bootstrapped superadmin, and open `/admin`.
  - Upload media, create a category, create a product with images, create a variant with initial stock, and adjust inventory.
  - Confirm activity/inventory logs update, soft-deleted media disappears from pickers, content saves, and settings save only as superadmin.

### Task 03: Authentication, Roles, and Bootstrap

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added Convex Auth email/password configuration, auth HTTP routes, auth tables, and generated bindings.
  - Added authenticated profile synchronization with default `customer` role.
  - Added role guard queries for admin, superadmin, and customer account access.
  - Added one-time `/setup` bootstrap flow guarded by `SETUP_TOKEN` that promotes the signed-in first account to `superadmin` and disables itself afterward.
  - Added working login/register/sign-out UI, auth-aware shell navigation, guarded `/admin`, and guarded `/account`.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
  - Passed: `npm run lint`.
  - Passed: `npm run format:check`.
- Manual test:
  - Run `npm run dev:convex` and `npm run dev`, register a user, visit `/setup`, enter the local `SETUP_TOKEN`, and confirm `/admin` opens for the bootstrapped superadmin.
  - Confirm invalid setup tokens fail, `/setup` disables after the first superadmin exists, and unauthenticated/customer sessions cannot access `/admin`.
- Commit:
  - `9a89a4e`.

### Task 02: Convex Schema and Core Domain

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Added the full single-brand MVP Convex schema for profiles, settings/content, media, catalog, carts, addresses, orders, payments, shipments, coupons, admin activity, and email events.
  - Added shared domain constants and validation helpers for roles, statuses, status transitions, slugs, quantities, and money amounts.
  - Added idempotent `bootstrap:seedDefaults` mutation for default site settings and homepage content.
  - Updated README and this task file with schema/bootstrap notes.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npx convex codegen`.
  - Passed: `npm run lint`.
  - Passed: `npm run format:check`.
- Manual test:
  - With Convex running, run `npx convex run bootstrap:seedDefaults` and confirm it reports `created` on the first run and `exists` afterward.
- Commit:
  - `f60437a`.

### Task 01: Foundation and Tooling

- Status: complete
- Started: 2026-06-11
- Completed: 2026-06-11
- Summary:
  - Scaffolded TanStack Start with TypeScript, Vite, React, ESLint, Prettier, and npm scripts.
  - Added Convex packages, initialized Convex functions/schema, generated bindings, and linked a cloud dev deployment.
  - Synced real Convex deployment values into ignored local env files.
  - Added the app shell and routes for `/`, `/products`, `/cart`, `/login`, `/register`, `/admin`, and `/api/health`.
  - Updated README and `.env.example`.
- Build:
  - Passed: `npm run build`.
- Additional checks:
  - Passed: `npm run lint`.
  - Passed: `npm run format:check`.
  - Passed: `npm run dev:convex -- --once --tail-logs disable`.
  - Passed: dev-server HTTP 200 route sweep for the initial pages and health route.
  - Passed: browser smoke check for homepage title and hero heading.
- Manual test:
  - Run `npm run dev` and visit `/`, `/products`, `/cart`, `/login`, `/register`, `/admin`, and `/api/health`.
- Commit:
  - `bf7ad8b4123b167b00efa30c70755b93af978b87`.

### Planning Setup

- Status: complete
- Summary:
  - Created MVP plan in `muse-commerce-mvp-plan.html`.
  - Clarified status model, Xendit webhook behavior, coupon lifecycle, superadmin bootstrap, media deletion, and data model notes.
  - Created `.gitignore` and `.env.example`.
  - Created task plan files under `plan/`.
  - Added this workflow for future Codex threads.
- Build:
  - Not run. No app has been scaffolded yet.
- Manual test:
  - Not applicable yet.

## Next Task

Start `plan/07-xendit-payments-webhooks.md` in a new Codex thread after Task 06 is committed and pushed.
