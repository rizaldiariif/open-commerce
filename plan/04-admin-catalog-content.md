# 04. Admin Catalog and Content

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

## Dependencies

- 03 Authentication, Roles, and Bootstrap.

