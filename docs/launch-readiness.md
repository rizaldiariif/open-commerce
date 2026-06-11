# Launch Readiness

Use this checklist before pointing a real brand domain at Muse Commerce. Manual
testing is intentionally deferred until all plan tasks are complete.

## Environment Checklist

- Local `.env` exists and is not committed.
- `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, and `VITE_CONVEX_SITE_URL` point to
  the intended Convex deployment.
- Convex Auth values are set in the Convex deployment environment:
  `JWT_PRIVATE_KEY` and `JWKS`.
- Storefront/app values are set for the deployed web app:
  `SITE_URL`, `STORE_NAME`, `SUPPORT_EMAIL`, and `VITE_CONVEX_URL`.
- Xendit values are set only in Convex environment settings:
  `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`, and
  `XENDIT_CALLBACK_URL=https://<deployment>.convex.site/api/xendit/webhook`.
- Resend values are set only in Convex environment settings:
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL` or `EMAIL_FROM`, and optionally
  `ADMIN_NOTIFICATION_EMAIL`.
- Vercel has the same public web variables as local development, with no
  payment or email secrets committed to source control.

## Seed Data

Run default data first:

```sh
npx convex run bootstrap:seedDefaults
```

For QA/demo catalog data, run:

```sh
npx convex run bootstrap:seedDemoCatalog
```

The demo seed is idempotent. It creates:

- active `Daily Carry` and `Home Rituals` categories
- active `Canvas Market Tote` and `Ceramic Desk Cup` products
- four active variants with stock and inventory movement records
- active `LAUNCH10` percentage coupon with a minimum subtotal and per-customer
  limit
- a homepage launch banner when no banners are present

## Deployment Notes

- Build locally before deployment with `npm run build`.
- Deploy the TanStack Start app to Vercel with `VITE_CONVEX_URL` pointed at the
  production Convex deployment.
- Configure the Xendit callback URL to the Convex site endpoint, not the Vercel
  app URL.
- Configure the brand's sending domain in Resend before using a production
  from address.
- After deployment, register the first user, visit `/setup`, and enter the
  one-time `SETUP_TOKEN` to create the first superadmin.
- Run `npx convex run bootstrap:seedDefaults` after linking the target Convex
  deployment. Run `bootstrap:seedDemoCatalog` only when launch QA or demo data
  is wanted.

## Manual QA Notes

- Fresh setup:
  Register a user, visit `/setup`, submit the local setup token, and confirm
  the account can access `/admin`.
- Admin catalog/content:
  Create or review categories, products, variants, stock, homepage content,
  logo/favicon media, SEO fields, settings, coupons, and email templates.
- Customer checkout:
  Sign in as a customer, add an in-stock variant to the cart, apply `LAUNCH10`,
  complete checkout, and confirm the Xendit invoice handoff appears.
- Xendit sandbox:
  Pay the sandbox invoice and confirm the webhook marks the payment/order paid,
  reduces stock once, releases reserved stock, and consumes the coupon once.
- Webhook idempotency:
  Replay the same webhook payload and confirm a duplicate event is stored
  without changing order, stock, or coupon counts again.
- Expiry restoration:
  Create a pending order, let it expire or run the cleanup, and confirm order
  status becomes `payment_failed`, reserved stock is released, and reserved
  coupon usage is released.
- Fulfillment email:
  In `/admin/orders`, move a paid order through processing, in delivery, and
  delivered. Confirm shipment fields update and fulfillment email attempts are
  logged.
- Resend failure isolation:
  Temporarily use an invalid Resend key in a non-production deployment and
  confirm failed `emailEvents` are logged without rolling back payment or
  fulfillment updates.
- Permissions:
  Confirm signed-out users cannot access `/admin`, customers cannot access
  admin routes, customers can only view their own orders, and superadmin-only
  settings/email controls are hidden from regular admins.
- Responsive UI:
  Review `/`, `/products`, product detail, `/cart`, `/checkout`,
  `/payment/$orderNumber`, `/account/orders`, `/admin`, and admin order detail
  on mobile and desktop widths.
- SEO:
  Confirm root, products, product detail, and account/payment/admin routes emit
  sensible page titles/descriptions and that configured store SEO fields are
  reflected in storefront content.
- Media cleanup smoke:
  Upload media in `/admin`, assign it to content/catalog, soft delete it, and
  confirm it disappears from pickers and public storefront image output.

## Launch Gate

- `npm run build` passes.
- No real secrets are in git status, commits, logs, or docs.
- Manual QA notes above have been exercised against the target deployment.
- Xendit and Resend dashboards show expected sandbox/test activity.
- The first superadmin and at least one backup admin account are available to
  the brand owner.
