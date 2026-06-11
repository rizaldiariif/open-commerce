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
