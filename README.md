# Muse Commerce

Muse Commerce is a single-brand ecommerce MVP built with TanStack Start and Convex.

## Development

Install dependencies:

```sh
npm install
```

Run the web app:

```sh
npm run dev
```

Run Convex in a separate terminal after the project is linked:

```sh
npm run dev:convex
```

Seed default site settings and homepage content after Convex is running:

```sh
npx convex run bootstrap:seedDefaults
```

The same seed command also creates default transactional email templates when
they are missing.

For launch QA or demos, seed a small active catalog and coupon after defaults:

```sh
npx convex run bootstrap:seedDemoCatalog
```

The demo seed is idempotent and creates active categories, products, variants
with stock movement records, and a `LAUNCH10` coupon.

Authentication uses Convex Auth with email/password accounts. Register or log in
through `/register` and `/login`; signed-in users get a `customer` profile by
default.

To create the first superadmin, sign in with the account that should own the
store setup, visit `/setup`, and enter the local `SETUP_TOKEN`. Bootstrap is
disabled after the first `superadmin` profile exists. Admin screens at `/admin`
require an `admin` or `superadmin` profile.

The admin workspace at `/admin` includes catalog and content operations for:

- categories, products, variants, and image assignments
- Convex File Storage media uploads with soft deletion from pickers
- append-only inventory adjustments that keep variant stock in sync
- homepage content and banner text
- superadmin-only store settings, including logo, favicon, SEO fields, support
  email, and pending payment expiry
- coupon creation and editing for fixed amount or percentage discounts, minimum
  subtotals, percentage caps, total/per-customer limits, active windows, and
  enable/disable controls
- superadmin-only transactional email template editing and recent email attempt
  review
- recent admin activity and inventory movement review

Order operations live at `/admin/orders` and `/admin/orders/$id`. Admins can
filter recent orders, inspect line items and shipment data, move paid orders
through `processing`, `in_delivery`, and `delivered` fulfillment states, enter
courier and airwaybill details, and record manual refunds. Manual refunds only
update Muse Commerce order/payment records and activity logs; they do not call
Xendit refund APIs.

The public storefront includes:

- editable homepage content from Convex site content/settings
- `/products` catalog browsing for active products and categories
- `/products/$slug` product detail pages with image galleries, variants, stock,
  and login-aware add-to-cart
- `/cart` for signed-in customer cart review, quantity updates, removal, and
  stock validation
- `/checkout` for signed-in customer contact/shipping details, saved address
  selection, coupon entry, pending order creation, and Xendit invoice creation
- `/payment/$orderNumber` for the payment handoff screen with Xendit invoice
  links and live order/payment status
- `/account`, `/account/orders`, and `/account/orders/$orderNumber` for
  customer-only order history and delivery details

Pending checkout orders reserve stock and coupon capacity in Convex. Scheduled
expiry and a recurring cleanup cron mark expired pending orders as
`payment_failed`, release reserved stock, and release reserved coupon
redemptions idempotently.

Xendit invoices are created from Convex actions after checkout order creation.
Configure `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`, and
`XENDIT_CALLBACK_URL` in the Convex deployment environment. The callback URL
should point at the Convex site endpoint:
`https://<deployment>.convex.site/api/xendit/webhook`. Webhooks store a
debuggable event record, reject mismatched amount/currency/order references, and
ignore duplicate event IDs before changing stock, coupons, orders, or payments.

Transactional emails are sent through a provider abstraction backed by Resend
for the MVP. Configure `RESEND_API_KEY` plus either `RESEND_FROM_EMAIL` or
`EMAIL_FROM` in the Convex deployment environment. Invoice, payment confirmed,
payment failed, payment expired, admin paid-order, and admin low-stock emails
are attempted from the current payment lifecycle. Fulfillment status emails are
attempted when admins mark paid orders as processing, in delivery, or delivered.
Email attempts are logged in `emailEvents`, and failed sends do not roll back
order, payment, or fulfillment updates.

Build and typecheck:

```sh
npm run build
```

Launch checklist, deployment notes, and manual QA flows live in
[`docs/launch-readiness.md`](docs/launch-readiness.md).

## Domain Model

Convex schema tables live in `convex/schema.ts`. Shared MVP domain constants,
status transitions, and validation helpers live in `convex/domain.ts`.

## Environment

Copy `.env.example` to `.env` for local development. Keep `.env` local-only; it contains setup, auth, payment, and email secrets.

Convex linking writes real values for `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`. Until then, those values remain placeholders.
