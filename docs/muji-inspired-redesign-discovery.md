# MUJI-Inspired Redesign Discovery

## Locked Decisions

- Redesign scope includes both the customer storefront and the admin screens.
- The store name remains **MUSE**.
- Use an adjacent accent color instead of MUJI red: proposed MUSE cedar `#8a3a2d`, with darker hover `#5f241b`.

## Boundary

Do not copy MUJI trademarks, logos, proprietary imagery, exact copy, or trade dress one-to-one. Use the observable retail patterns and product-first restraint as inspiration for an original store identity.

## Sources Reviewed

- MUJI USA homepage: https://www.muji.us/
- MUJI USA stationery collection: https://www.muji.us/collections/stationery
- MUJI USA product detail example: https://www.muji.us/products/high-quality-paper-open-flat-lined-dotted-notebook
- MUJI concept page: https://www.muji.com/jp/about/en/
- Ryohin Keikaku About MUJI: https://www.ryohin-keikaku.jp/en/about-muji
- MUJI USA theme CSS: https://www.muji.us/cdn/shop/t/998/assets/theme.css

## Brand Principles To Translate

- "No-brand quality goods": product utility should be more important than decorative branding.
- Three product principles: selection of materials, streamlining of processes, simplification of packaging.
- Tone: rational, quiet, ordinary, confident, not luxury or hype-driven.
- Design posture: simple, anonymous, nature-oriented, low-waste, practical.
- Desired buying feeling: "this will do" with clarity and confidence.

## Visual Specs Observed

- Palette:
  - White: `#ffffff`
  - Near black: `#191919`, `#0f0f0f`, `#000000`
  - Main text: `#363636`
  - Muted text: `#4d4d4d`, `#525252`, `#808080`
  - Lines: `#b3b3b3`, `#ededed`, `#f0f0f0`
  - MUJI-observed brand/action red: `#7f0019`, `#80000f`, `#81000a`
  - MUSE redesign accent: use adjacent cedar `#8a3a2d`, not MUJI red directly.
  - Soft surfaces: `#f6f6f6`, `#f5f5f5`, `#f1f1f1`
- Typography:
  - Body family: Roboto-like neutral sans.
  - Display/control family: Roboto Condensed-like narrow sans.
  - Body size is compact, around `14px`.
  - Headings are restrained, often uppercase, around `26px` mobile and `30px` desktop rather than hero-scale.
  - Buttons and product titles use condensed sans with medium/bold weight.
- Shape and texture:
  - Mostly flat surfaces.
  - Thin borders.
  - Minimal shadow.
  - Radius is usually `0px` to `3px`; product/cart side drawers may use small radius only where useful.
- Image language:
  - Product photos are mostly square, clean, and centered.
  - Backgrounds are white or very light gray.
  - Editorial banners are useful, seasonal, and product/category-specific.
  - Avoid dark lifestyle imagery, heavy gradients, and decorative illustrations.
- Layout:
  - Max content width around `1200px`.
  - Product grids use simple repeated cards; observed skeleton fallback uses 3 columns desktop, 2 tablet, 1 mobile.
  - Gutters are modest, commonly near `20px`.
  - Homepage is a sequence of commerce modules, not a single oversized brand manifesto.

## Commerce UX Specs Observed

- Global navigation:
  - Dense category navigation: Sale, New, Women, Men, Accessories, Travel, Furniture, Home, Health & Beauty, Stationery, Food, Rewards.
  - Each top-level category expands into practical subgroups.
  - Header includes cart, wishlist, login/account, and search/category access.
- Homepage:
  - Promo/hero carousel.
  - Seasonal/category modules such as New Arrivals, Spring Essentials, gift guides, and editorial/news blocks.
  - Footer includes Get Help, About, Top Searches, Follow us, Subscribe, legal, country/currency.
- Collection page:
  - Collection banner image and description.
  - Product grid with square images.
  - Product card content includes price, title, short description, full-details link, and quick-shop action.
  - Badges support sale, sold out, free shipping, coming soon, and online-exclusive messages.
- Product detail page:
  - Breadcrumb back to Home.
  - Large gallery plus thumbnails and zoom affordance.
  - SKU shown near the title.
  - Title, price range/current price, variant controls, quantity, add to cart.
  - Important notices near purchase controls, such as final sale.
  - Detail sections: description, product details, measurements, country/region of origin, material/care, shipping/returns.
  - Reviews and Q&A can sit below details.

## Current App Fit

- Current app already has public routes for home, products, product detail, cart, checkout, payment, account, and admin.
- Current visual language is "Muse": high contrast, large expressive display type, editorial meta column, black bands, and price-tag cards.
- Redesign should mostly change shared styling and page composition, not core commerce behavior.
- Route files should stay focused. Extract repeated storefront pieces into small shared components instead of growing route files.

## Detailed HTML Specs

- Overview and asset library: `docs/muse-redesign-specs/00-index.html`
- Global shell: `docs/muse-redesign-specs/01-global-shell.html`
- Home page: `docs/muse-redesign-specs/02-home.html`
- Catalog page: `docs/muse-redesign-specs/03-catalog.html`
- Product detail page: `docs/muse-redesign-specs/04-product-detail.html`
- Cart, checkout, and payment: `docs/muse-redesign-specs/05-cart-checkout-payment.html`
- Account and auth: `docs/muse-redesign-specs/06-account-auth.html`
- Admin screens: `docs/muse-redesign-specs/07-admin.html`

Each HTML spec includes current-vs-reference screenshots, the differences to resolve, current components to keep or remove, missing components, and cropped MUJI reference assets for the React component targets.

## Proposed Change Areas

- Global shell:
  - Replace MUSE-heavy header/footer with compact retail navigation.
  - Keep a simple promo bar, but reduce tracking and typography.
  - Footer becomes practical link columns and newsletter area.
- Design tokens:
  - Replace Bricolage/Inter identity with neutral/condensed sans tokens.
  - Replace stark black-white editorial palette with white, charcoal, light gray, and adjacent cedar accent.
  - Reduce heading scale and remove negative tracking.
- Home:
  - Replace asymmetric hero/meta layout with a restrained promo/image module.
  - Add category/product modules instead of large brand statement blocks.
- Catalog:
  - Product cards become quieter: square image, price, product name, category, short availability/status.
  - Category chips become utilitarian filters/navigation.
  - Add quick-shop/quick-view later only if it stays simple.
- Product detail:
  - Square gallery, thumbnails, sticky purchase panel.
  - Surface SKU, measurements, material/care, shipping/returns as compact sections.
- Cart and checkout:
  - Use table-like rows, compact forms, thin borders, white surfaces, deep red primary action.
- Admin:
  - Bring admin into the same restrained MUSE system after storefront foundations are in place.
  - Keep admin dense and operational; do not turn admin into a marketing page.

## Implementation Plan

1. Lock design tokens and shared shell first.
2. Extract reusable storefront components for product cards, page headings, and simple section modules.
3. Redesign home and product listing routes.
4. Redesign product detail route.
5. Bring cart, checkout, account, and payment states into the same system.
6. Redesign admin screens with a dense operational variant of the same system.
7. Run build/typecheck and browser responsive checks.
