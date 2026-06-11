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
- recent admin activity and inventory movement review

Build and typecheck:

```sh
npm run build
```

## Domain Model

Convex schema tables live in `convex/schema.ts`. Shared MVP domain constants,
status transitions, and validation helpers live in `convex/domain.ts`.

## Environment

Copy `.env.example` to `.env` for local development. Keep `.env` local-only; it contains setup, auth, payment, and email secrets.

Convex linking writes real values for `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`. Until then, those values remain placeholders.
