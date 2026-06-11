# 04. Admin Catalog and Content

Status: complete

## Goal

Build the admin surfaces for managing products, categories, variants, inventory, and fixed site content.

## Scope

- Admin dashboard shell/navigation.
- Category CRUD.
- Product CRUD.
- Variant CRUD with flexible attributes.
- Product image upload using Convex File Storage.
- Inventory editing through append-only `inventoryMovements`.
- Site settings editor:
  - store name
  - logo
  - favicon
  - support email
  - SEO fields
  - pending payment expiry minutes
- Site content editor:
  - hero title/subtitle/image
  - homepage banners
  - about/footer text
- Media soft deletion.
- Admin activity logging for important changes.

## Deliverables

- Admin catalog screens.
- Content/settings screens.
- File upload flow.
- Inventory movement records for stock changes.

## Acceptance Checks

- Admins can create products with variants and images.
- Product stock is derived from movements or kept consistent with movement writes.
- Superadmin-only settings are protected.
- Soft-deleted media no longer appears in picker/UI.

## Completion Notes

- Added `convex/admin.ts` with admin/superadmin guards, catalog CRUD-style
  mutations, media upload registration, media soft deletion, inventory
  adjustments, content/settings editors, and activity logging.
- Extended the schema for logo/favicon, pending payment expiry, homepage
  banners, about/footer text, and media soft deletion metadata.
- Replaced the `/admin` placeholder with a tabbed admin console for products,
  variants, categories, inventory, media, homepage content, settings, and
  recent activity.
- Inventory writes keep `productVariants.stockOnHand` in sync while recording
  append-only `inventoryMovements`.
- Settings writes are enforced by the backend as superadmin-only.
- Build passed with `npm run build`; lint passed with `npm run lint`.

## Manual Test

- Run `npm run dev:convex` and `npm run dev`, sign in as the bootstrapped
  superadmin, and open `/admin`.
- Upload an image, create a category, create a product with featured/gallery
  images, add a variant with initial stock, and adjust inventory.
- Confirm the inventory movement list updates and variant stock changes.
- Soft-delete the uploaded image and confirm it disappears from media pickers.
- Save homepage content as an admin/superadmin.
- Confirm only a superadmin can save store settings.

## Dependencies

- 03 Authentication, Roles, and Bootstrap.
