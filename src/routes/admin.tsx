import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/admin')({
  component: Admin,
})

type AdminTab =
  | 'products'
  | 'categories'
  | 'inventory'
  | 'coupons'
  | 'media'
  | 'content'
  | 'settings'
  | 'activity'

type Message = {
  type: 'success' | 'error'
  text: string
}

type MediaAsset = Doc<'mediaAssets'> & {
  url: string | null
}

const adminTabs: { id: AdminTab; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'media', label: 'Media' },
  { id: 'content', label: 'Content' },
  { id: 'settings', label: 'Settings' },
  { id: 'activity', label: 'Activity' },
]

const emptyCategoryForm = {
  id: '',
  name: '',
  slug: '',
  description: '',
  parentCategoryId: '',
  imageId: '',
  sortOrder: '0',
  isActive: true,
}

const emptyProductForm = {
  id: '',
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  status: 'draft',
  featuredImageId: '',
  galleryImageIds: [] as string[],
  seoTitle: '',
  seoDescription: '',
  sortOrder: '0',
}

const emptyVariantForm = {
  id: '',
  productId: '',
  sku: '',
  name: '',
  optionValues: '',
  price: '0',
  compareAtPrice: '',
  initialStock: '0',
  lowStockThreshold: '',
  weightGrams: '',
  isActive: true,
}

const emptyInventoryForm = {
  variantId: '',
  quantityDelta: '',
  reason: '',
}

const emptyCouponForm = {
  id: '',
  code: '',
  type: 'percentage',
  value: '0',
  currency: 'IDR',
  minSubtotal: '',
  maxDiscount: '',
  usageLimit: '',
  usageLimitPerCustomer: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
}

function Admin() {
  const access = useQuery(api.profiles.requireAdmin)

  if (access === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin</h1>
        <p>Checking access.</p>
      </section>
    )
  }

  if (!access.allowed || !access.profile) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin access required</h1>
        <p>
          {access.reason === 'unauthenticated'
            ? 'Sign in with an admin account to continue.'
            : 'Your account does not have access to the admin workspace.'}
        </p>
        <div className="action-row">
          {access.reason === 'unauthenticated' ? (
            <Link
              to="/login"
              search={{ redirect: '/admin' }}
              className="primary-link"
            >
              Login
            </Link>
          ) : null}
          <Link to="/setup" className="secondary-link">
            First admin setup
          </Link>
        </div>
      </section>
    )
  }

  return <AdminWorkspace isSuperadmin={access.profile.role === 'superadmin'} />
}

function AdminWorkspace({ isSuperadmin }: Readonly<{ isSuperadmin: boolean }>) {
  const workspace = useQuery(api.admin.getWorkspace)
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [message, setMessage] = useState<Message | null>(null)

  if (workspace === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin</h1>
        <p>Loading catalog workspace.</p>
      </section>
    )
  }

  return (
    <section className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin</h1>
          <p>
            Signed in as {workspace.profile.email} with {workspace.profile.role}{' '}
            access.
          </p>
        </div>
        <div className="admin-kpis" aria-label="Catalog summary">
          <span>
            <strong>{workspace.products.length}</strong> products
          </span>
          <span>
            <strong>{workspace.variants.length}</strong> variants
          </span>
          <span>
            <strong>{workspace.mediaAssets.length}</strong> media
          </span>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin modules">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={activeTab === tab.id ? 'true' : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {message ? (
        <p className={`form-message ${message.type}`}>{message.text}</p>
      ) : null}

      {activeTab === 'products' ? (
        <ProductsPanel workspace={workspace} setMessage={setMessage} />
      ) : null}
      {activeTab === 'categories' ? (
        <CategoriesPanel workspace={workspace} setMessage={setMessage} />
      ) : null}
      {activeTab === 'inventory' ? (
        <InventoryPanel workspace={workspace} setMessage={setMessage} />
      ) : null}
      {activeTab === 'coupons' ? (
        <CouponsPanel workspace={workspace} setMessage={setMessage} />
      ) : null}
      {activeTab === 'media' ? (
        <MediaPanel workspace={workspace} setMessage={setMessage} />
      ) : null}
      {activeTab === 'content' ? (
        <ContentPanel workspace={workspace} setMessage={setMessage} />
      ) : null}
      {activeTab === 'settings' ? (
        <SettingsPanel
          workspace={workspace}
          isSuperadmin={isSuperadmin}
          setMessage={setMessage}
        />
      ) : null}
      {activeTab === 'activity' ? (
        <ActivityPanel workspace={workspace} />
      ) : null}
    </section>
  )
}

function ProductsPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
  setMessage: (message: Message) => void
}>) {
  const upsertProduct = useMutation(api.admin.upsertProduct)
  const archiveProduct = useMutation(api.admin.archiveProduct)
  const upsertVariant = useMutation(api.admin.upsertVariant)
  const deactivateVariant = useMutation(api.admin.deactivateVariant)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [variantForm, setVariantForm] = useState(emptyVariantForm)
  const categoryById = useMemo(
    () =>
      new Map(workspace.categories.map((category) => [category._id, category])),
    [workspace.categories],
  )
  const variantsByProductId = useMemo(() => {
    const variants = new Map<string, Doc<'productVariants'>[]>()

    for (const variant of workspace.variants) {
      const current = variants.get(variant.productId) ?? []
      current.push(variant)
      variants.set(variant.productId, current)
    }

    return variants
  }, [workspace.variants])

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await upsertProduct({
        id: idOrUndefined<'products'>(productForm.id),
        name: productForm.name,
        slug: productForm.slug,
        description: textOrUndefined(productForm.description),
        categoryId: idOrUndefined<'categories'>(productForm.categoryId),
        status: productForm.status as 'draft' | 'active' | 'archived',
        featuredImageId: idOrUndefined<'mediaAssets'>(
          productForm.featuredImageId,
        ),
        galleryImageIds: productForm.galleryImageIds as Id<'mediaAssets'>[],
        seoTitle: textOrUndefined(productForm.seoTitle),
        seoDescription: textOrUndefined(productForm.seoDescription),
        sortOrder: numberFromInput(productForm.sortOrder),
      })
      setProductForm(emptyProductForm)
      setMessage({ type: 'success', text: 'Product saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  async function handleVariantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await upsertVariant({
        id: idOrUndefined<'productVariants'>(variantForm.id),
        productId: variantForm.productId as Id<'products'>,
        sku: variantForm.sku,
        name: variantForm.name,
        optionValues: parseOptions(variantForm.optionValues),
        price: numberFromInput(variantForm.price),
        compareAtPrice: optionalNumberFromInput(variantForm.compareAtPrice),
        initialStock: variantForm.id
          ? undefined
          : numberFromInput(variantForm.initialStock),
        lowStockThreshold: optionalNumberFromInput(
          variantForm.lowStockThreshold,
        ),
        weightGrams: optionalNumberFromInput(variantForm.weightGrams),
        isActive: variantForm.isActive,
      })
      setVariantForm(emptyVariantForm)
      setMessage({ type: 'success', text: 'Variant saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <div className="admin-layout">
      <div className="admin-main">
        <Panel title="Products">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Variants</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspace.products.map((product) => {
                  const variants = variantsByProductId.get(product._id) ?? []
                  const stock = variants.reduce(
                    (total, variant) => total + variant.stockOnHand,
                    0,
                  )

                  return (
                    <tr key={product._id}>
                      <td>
                        <strong>{product.name}</strong>
                        <span>{product.slug}</span>
                      </td>
                      <td>{product.status}</td>
                      <td>
                        {product.categoryId
                          ? (categoryById.get(product.categoryId)?.name ??
                            'None')
                          : 'None'}
                      </td>
                      <td>{variants.length}</td>
                      <td>{stock}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              id: product._id,
                              name: product.name,
                              slug: product.slug,
                              description: product.description ?? '',
                              categoryId: product.categoryId ?? '',
                              status: product.status,
                              featuredImageId: product.featuredImageId ?? '',
                              galleryImageIds: product.galleryImageIds,
                              seoTitle: product.seoTitle ?? '',
                              seoDescription: product.seoDescription ?? '',
                              sortOrder: String(product.sortOrder),
                            })
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await archiveProduct({ id: product._id })
                              setMessage({
                                type: 'success',
                                text: 'Product archived.',
                              })
                            } catch (error) {
                              setMessage({
                                type: 'error',
                                text: errorMessage(error),
                              })
                            }
                          }}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Variants">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Options</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspace.variants.map((variant) => {
                  const product = workspace.products.find(
                    (candidate) => candidate._id === variant.productId,
                  )

                  return (
                    <tr key={variant._id}>
                      <td>
                        <strong>{variant.sku}</strong>
                        <span>{variant.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td>{product?.name ?? 'Missing product'}</td>
                      <td>
                        {variant.optionValues
                          .map((option) => `${option.name}: ${option.value}`)
                          .join(', ') || 'None'}
                      </td>
                      <td>{formatMoney(variant.price)}</td>
                      <td>{variant.stockOnHand}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setVariantForm({
                              id: variant._id,
                              productId: variant.productId,
                              sku: variant.sku,
                              name: variant.name,
                              optionValues: variant.optionValues
                                .map(
                                  (option) => `${option.name}:${option.value}`,
                                )
                                .join(', '),
                              price: String(variant.price),
                              compareAtPrice:
                                variant.compareAtPrice === undefined
                                  ? ''
                                  : String(variant.compareAtPrice),
                              initialStock: '0',
                              lowStockThreshold:
                                variant.lowStockThreshold === undefined
                                  ? ''
                                  : String(variant.lowStockThreshold),
                              weightGrams:
                                variant.weightGrams === undefined
                                  ? ''
                                  : String(variant.weightGrams),
                              isActive: variant.isActive,
                            })
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await deactivateVariant({ id: variant._id })
                              setMessage({
                                type: 'success',
                                text: 'Variant deactivated.',
                              })
                            } catch (error) {
                              setMessage({
                                type: 'error',
                                text: errorMessage(error),
                              })
                            }
                          }}
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <aside className="admin-side">
        <Panel title={productForm.id ? 'Edit product' : 'New product'}>
          <form className="admin-form" onSubmit={handleProductSubmit}>
            <TextField
              label="Name"
              value={productForm.name}
              onChange={(name) =>
                setProductForm((current) => ({ ...current, name }))
              }
            />
            <TextField
              label="Slug"
              value={productForm.slug}
              onChange={(slug) =>
                setProductForm((current) => ({ ...current, slug }))
              }
            />
            <TextArea
              label="Description"
              value={productForm.description}
              onChange={(description) =>
                setProductForm((current) => ({ ...current, description }))
              }
            />
            <label>
              Category
              <select
                value={productForm.categoryId}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
              >
                <option value="">None</option>
                {workspace.categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={productForm.status}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <MediaSelect
              label="Featured image"
              value={productForm.featuredImageId}
              mediaAssets={workspace.mediaAssets}
              onChange={(featuredImageId) =>
                setProductForm((current) => ({ ...current, featuredImageId }))
              }
            />
            <label>
              Gallery images
              <select
                multiple
                value={productForm.galleryImageIds}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    galleryImageIds: Array.from(
                      event.currentTarget.selectedOptions,
                    ).map((option) => option.value),
                  }))
                }
              >
                {workspace.mediaAssets.map((asset) => (
                  <option key={asset._id} value={asset._id}>
                    {asset.filename}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="SEO title"
              value={productForm.seoTitle}
              onChange={(seoTitle) =>
                setProductForm((current) => ({ ...current, seoTitle }))
              }
            />
            <TextArea
              label="SEO description"
              value={productForm.seoDescription}
              onChange={(seoDescription) =>
                setProductForm((current) => ({ ...current, seoDescription }))
              }
            />
            <TextField
              label="Sort order"
              value={productForm.sortOrder}
              inputMode="numeric"
              onChange={(sortOrder) =>
                setProductForm((current) => ({ ...current, sortOrder }))
              }
            />
            <div className="form-actions">
              <button type="submit">Save product</button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setProductForm(emptyProductForm)}
              >
                Reset
              </button>
            </div>
          </form>
        </Panel>

        <Panel title={variantForm.id ? 'Edit variant' : 'New variant'}>
          <form className="admin-form" onSubmit={handleVariantSubmit}>
            <label>
              Product
              <select
                required
                value={variantForm.productId}
                onChange={(event) =>
                  setVariantForm((current) => ({
                    ...current,
                    productId: event.target.value,
                  }))
                }
              >
                <option value="">Select product</option>
                {workspace.products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="SKU"
              value={variantForm.sku}
              onChange={(sku) =>
                setVariantForm((current) => ({ ...current, sku }))
              }
            />
            <TextField
              label="Name"
              value={variantForm.name}
              onChange={(name) =>
                setVariantForm((current) => ({ ...current, name }))
              }
            />
            <TextField
              label="Options"
              value={variantForm.optionValues}
              placeholder="Size:M, Color:Black"
              onChange={(optionValues) =>
                setVariantForm((current) => ({ ...current, optionValues }))
              }
            />
            <TextField
              label="Price"
              value={variantForm.price}
              inputMode="numeric"
              onChange={(price) =>
                setVariantForm((current) => ({ ...current, price }))
              }
            />
            <TextField
              label="Compare-at price"
              value={variantForm.compareAtPrice}
              inputMode="numeric"
              onChange={(compareAtPrice) =>
                setVariantForm((current) => ({
                  ...current,
                  compareAtPrice,
                }))
              }
            />
            {!variantForm.id ? (
              <TextField
                label="Initial stock"
                value={variantForm.initialStock}
                inputMode="numeric"
                onChange={(initialStock) =>
                  setVariantForm((current) => ({
                    ...current,
                    initialStock,
                  }))
                }
              />
            ) : null}
            <TextField
              label="Low-stock threshold"
              value={variantForm.lowStockThreshold}
              inputMode="numeric"
              onChange={(lowStockThreshold) =>
                setVariantForm((current) => ({
                  ...current,
                  lowStockThreshold,
                }))
              }
            />
            <TextField
              label="Weight grams"
              value={variantForm.weightGrams}
              inputMode="numeric"
              onChange={(weightGrams) =>
                setVariantForm((current) => ({ ...current, weightGrams }))
              }
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={variantForm.isActive}
                onChange={(event) =>
                  setVariantForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="form-actions">
              <button type="submit">Save variant</button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setVariantForm(emptyVariantForm)}
              >
                Reset
              </button>
            </div>
          </form>
        </Panel>
      </aside>
    </div>
  )
}

function CategoriesPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
  setMessage: (message: Message) => void
}>) {
  const upsertCategory = useMutation(api.admin.upsertCategory)
  const deleteCategory = useMutation(api.admin.deleteCategory)
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await upsertCategory({
        id: idOrUndefined<'categories'>(categoryForm.id),
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: textOrUndefined(categoryForm.description),
        parentCategoryId: idOrUndefined<'categories'>(
          categoryForm.parentCategoryId,
        ),
        imageId: idOrUndefined<'mediaAssets'>(categoryForm.imageId),
        sortOrder: numberFromInput(categoryForm.sortOrder),
        isActive: categoryForm.isActive,
      })
      setCategoryForm(emptyCategoryForm)
      setMessage({ type: 'success', text: 'Category saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Categories">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Sort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspace.categories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <strong>{category.name}</strong>
                    <span>{category.description ?? 'No description'}</span>
                  </td>
                  <td>{category.slug}</td>
                  <td>{category.sortOrder}</td>
                  <td>{category.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryForm({
                          id: category._id,
                          name: category.name,
                          slug: category.slug,
                          description: category.description ?? '',
                          parentCategoryId: category.parentCategoryId ?? '',
                          imageId: category.imageId ?? '',
                          sortOrder: String(category.sortOrder),
                          isActive: category.isActive,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteCategory({ id: category._id })
                          setMessage({
                            type: 'success',
                            text: 'Category removed or deactivated.',
                          })
                        } catch (error) {
                          setMessage({
                            type: 'error',
                            text: errorMessage(error),
                          })
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title={categoryForm.id ? 'Edit category' : 'New category'}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <TextField
              label="Name"
              value={categoryForm.name}
              onChange={(name) =>
                setCategoryForm((current) => ({ ...current, name }))
              }
            />
            <TextField
              label="Slug"
              value={categoryForm.slug}
              onChange={(slug) =>
                setCategoryForm((current) => ({ ...current, slug }))
              }
            />
            <TextArea
              label="Description"
              value={categoryForm.description}
              onChange={(description) =>
                setCategoryForm((current) => ({ ...current, description }))
              }
            />
            <label>
              Parent
              <select
                value={categoryForm.parentCategoryId}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    parentCategoryId: event.target.value,
                  }))
                }
              >
                <option value="">None</option>
                {workspace.categories
                  .filter((category) => category._id !== categoryForm.id)
                  .map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <MediaSelect
              label="Image"
              value={categoryForm.imageId}
              mediaAssets={workspace.mediaAssets}
              onChange={(imageId) =>
                setCategoryForm((current) => ({ ...current, imageId }))
              }
            />
            <TextField
              label="Sort order"
              value={categoryForm.sortOrder}
              inputMode="numeric"
              onChange={(sortOrder) =>
                setCategoryForm((current) => ({ ...current, sortOrder }))
              }
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="form-actions">
              <button type="submit">Save category</button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setCategoryForm(emptyCategoryForm)}
              >
                Reset
              </button>
            </div>
          </form>
        </Panel>
      </aside>
    </div>
  )
}

function InventoryPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
  setMessage: (message: Message) => void
}>) {
  const adjustInventory = useMutation(api.admin.adjustInventory)
  const [inventoryForm, setInventoryForm] = useState(emptyInventoryForm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await adjustInventory({
        variantId: inventoryForm.variantId as Id<'productVariants'>,
        quantityDelta: numberFromInput(inventoryForm.quantityDelta),
        reason: textOrUndefined(inventoryForm.reason),
      })
      setInventoryForm(emptyInventoryForm)
      setMessage({ type: 'success', text: 'Inventory adjusted.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Stock by variant">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Product</th>
                <th>On hand</th>
                <th>Reserved</th>
                <th>Low threshold</th>
              </tr>
            </thead>
            <tbody>
              {workspace.variants.map((variant) => {
                const product = workspace.products.find(
                  (candidate) => candidate._id === variant.productId,
                )

                return (
                  <tr key={variant._id}>
                    <td>
                      <strong>{variant.sku}</strong>
                      <span>{variant.name}</span>
                    </td>
                    <td>{product?.name ?? 'Missing product'}</td>
                    <td>{variant.stockOnHand}</td>
                    <td>{variant.reservedStock}</td>
                    <td>{variant.lowStockThreshold ?? 'None'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title="Adjust inventory">
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Variant
              <select
                required
                value={inventoryForm.variantId}
                onChange={(event) =>
                  setInventoryForm((current) => ({
                    ...current,
                    variantId: event.target.value,
                  }))
                }
              >
                <option value="">Select variant</option>
                {workspace.variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>
                    {variant.sku} - {variant.name}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Quantity delta"
              value={inventoryForm.quantityDelta}
              placeholder="10 or -2"
              inputMode="numeric"
              onChange={(quantityDelta) =>
                setInventoryForm((current) => ({
                  ...current,
                  quantityDelta,
                }))
              }
            />
            <TextArea
              label="Reason"
              value={inventoryForm.reason}
              onChange={(reason) =>
                setInventoryForm((current) => ({ ...current, reason }))
              }
            />
            <button type="submit">Record movement</button>
          </form>
        </Panel>

        <Panel title="Recent movements">
          <div className="stack-list">
            {workspace.recentInventoryMovements.map((movement) => {
              const variant = workspace.variants.find(
                (candidate) => candidate._id === movement.variantId,
              )

              return (
                <div key={movement._id}>
                  <strong>
                    {variant?.sku ?? 'Variant'}{' '}
                    {movement.quantityDelta > 0 ? '+' : ''}
                    {movement.quantityDelta}
                  </strong>
                  <span>
                    Stock after {movement.stockAfter}
                    {movement.reason ? ` - ${movement.reason}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>
      </aside>
    </div>
  )
}

function CouponsPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
  setMessage: (message: Message) => void
}>) {
  const upsertCoupon = useMutation(api.admin.upsertCoupon)
  const setCouponActive = useMutation(api.admin.setCouponActive)
  const [couponForm, setCouponForm] = useState(emptyCouponForm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await upsertCoupon({
        id: idOrUndefined<'coupons'>(couponForm.id),
        code: couponForm.code,
        type: couponForm.type as 'percentage' | 'fixed_amount',
        value: numberFromInput(couponForm.value),
        currency: textOrUndefined(couponForm.currency),
        minSubtotal: optionalNumberFromInput(couponForm.minSubtotal),
        maxDiscount: optionalNumberFromInput(couponForm.maxDiscount),
        usageLimit: optionalNumberFromInput(couponForm.usageLimit),
        usageLimitPerCustomer: optionalNumberFromInput(
          couponForm.usageLimitPerCustomer,
        ),
        startsAt: optionalDateFromInput(couponForm.startsAt),
        endsAt: optionalDateFromInput(couponForm.endsAt),
        isActive: couponForm.isActive,
      })
      setCouponForm(emptyCouponForm)
      setMessage({ type: 'success', text: 'Coupon saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Coupons">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspace.coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td>
                    <strong>{coupon.code}</strong>
                    <span>
                      {coupon.startsAt
                        ? new Date(coupon.startsAt).toLocaleDateString()
                        : 'Now'}{' '}
                      to{' '}
                      {coupon.endsAt
                        ? new Date(coupon.endsAt).toLocaleDateString()
                        : 'No end'}
                    </span>
                  </td>
                  <td>
                    {coupon.type === 'percentage'
                      ? `${coupon.value}%`
                      : formatMoney(coupon.value)}
                  </td>
                  <td>
                    Min {formatOptionalMoney(coupon.minSubtotal)}, cap{' '}
                    {formatOptionalMoney(coupon.maxDiscount)}
                  </td>
                  <td>
                    {coupon.redeemedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                  </td>
                  <td>{coupon.isActive ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        setCouponForm({
                          id: coupon._id,
                          code: coupon.code,
                          type: coupon.type,
                          value: String(coupon.value),
                          currency: coupon.currency ?? 'IDR',
                          minSubtotal:
                            coupon.minSubtotal === undefined
                              ? ''
                              : String(coupon.minSubtotal),
                          maxDiscount:
                            coupon.maxDiscount === undefined
                              ? ''
                              : String(coupon.maxDiscount),
                          usageLimit:
                            coupon.usageLimit === undefined
                              ? ''
                              : String(coupon.usageLimit),
                          usageLimitPerCustomer:
                            coupon.usageLimitPerCustomer === undefined
                              ? ''
                              : String(coupon.usageLimitPerCustomer),
                          startsAt: dateInput(coupon.startsAt),
                          endsAt: dateInput(coupon.endsAt),
                          isActive: coupon.isActive,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await setCouponActive({
                            id: coupon._id,
                            isActive: !coupon.isActive,
                          })
                          setMessage({
                            type: 'success',
                            text: coupon.isActive
                              ? 'Coupon disabled.'
                              : 'Coupon enabled.',
                          })
                        } catch (error) {
                          setMessage({
                            type: 'error',
                            text: errorMessage(error),
                          })
                        }
                      }}
                    >
                      {coupon.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title={couponForm.id ? 'Edit coupon' : 'New coupon'}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <TextField
              label="Code"
              value={couponForm.code}
              onChange={(code) =>
                setCouponForm((current) => ({ ...current, code }))
              }
            />
            <label>
              Type
              <select
                value={couponForm.type}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
              </select>
            </label>
            <TextField
              label="Value"
              value={couponForm.value}
              inputMode="numeric"
              onChange={(value) =>
                setCouponForm((current) => ({ ...current, value }))
              }
            />
            <TextField
              label="Currency"
              value={couponForm.currency}
              onChange={(currency) =>
                setCouponForm((current) => ({ ...current, currency }))
              }
            />
            <TextField
              label="Minimum subtotal"
              value={couponForm.minSubtotal}
              inputMode="numeric"
              onChange={(minSubtotal) =>
                setCouponForm((current) => ({ ...current, minSubtotal }))
              }
            />
            <TextField
              label="Percentage cap"
              value={couponForm.maxDiscount}
              inputMode="numeric"
              onChange={(maxDiscount) =>
                setCouponForm((current) => ({ ...current, maxDiscount }))
              }
            />
            <TextField
              label="Usage limit"
              value={couponForm.usageLimit}
              inputMode="numeric"
              onChange={(usageLimit) =>
                setCouponForm((current) => ({ ...current, usageLimit }))
              }
            />
            <TextField
              label="Per-customer limit"
              value={couponForm.usageLimitPerCustomer}
              inputMode="numeric"
              onChange={(usageLimitPerCustomer) =>
                setCouponForm((current) => ({
                  ...current,
                  usageLimitPerCustomer,
                }))
              }
            />
            <label>
              Starts at
              <input
                type="date"
                value={couponForm.startsAt}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Ends at
              <input
                type="date"
                value={couponForm.endsAt}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    endsAt: event.target.value,
                  }))
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={couponForm.isActive}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="form-actions">
              <button type="submit">Save coupon</button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setCouponForm(emptyCouponForm)}
              >
                Reset
              </button>
            </div>
          </form>
        </Panel>
      </aside>
    </div>
  )
}

function MediaPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
  setMessage: (message: Message) => void
}>) {
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl)
  const saveUploadedMedia = useMutation(api.admin.saveUploadedMedia)
  const softDeleteMedia = useMutation(api.admin.softDeleteMedia)
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setMessage({ type: 'error', text: 'Choose a file to upload.' })
      return
    }

    setIsUploading(true)

    try {
      const uploadUrl = await generateUploadUrl()
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadResult.ok) {
        throw new Error('Upload failed.')
      }

      const { storageId } = (await uploadResult.json()) as {
        storageId: string
      }

      await saveUploadedMedia({
        storageId,
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        altText: textOrUndefined(altText),
      })
      setFile(null)
      setAltText('')
      event.currentTarget.reset()
      setMessage({ type: 'success', text: 'Media uploaded.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Media library">
        <div className="media-grid">
          {workspace.mediaAssets.map((asset) => (
            <figure key={asset._id} className="media-card">
              {asset.url ? (
                <img src={asset.url} alt={asset.altText ?? asset.filename} />
              ) : (
                <div className="media-placeholder">No preview</div>
              )}
              <figcaption>
                <strong>{asset.filename}</strong>
                <span>{asset.altText ?? asset.contentType}</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await softDeleteMedia({ id: asset._id })
                      setMessage({
                        type: 'success',
                        text: 'Media hidden from pickers.',
                      })
                    } catch (error) {
                      setMessage({ type: 'error', text: errorMessage(error) })
                    }
                  }}
                >
                  Soft delete
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title="Upload media">
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              File
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <TextField label="Alt text" value={altText} onChange={setAltText} />
            <button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading' : 'Upload'}
            </button>
          </form>
        </Panel>
      </aside>
    </div>
  )
}

function ContentPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
  setMessage: (message: Message) => void
}>) {
  const updateHomepageContent = useMutation(api.admin.updateHomepageContent)
  const [contentForm, setContentForm] = useState({
    title: '',
    subtitle: '',
    heroImageId: '',
    heroCtaLabel: '',
    heroCtaHref: '',
    featuredCategorySlugs: '',
    homepageBanners: '',
    announcement: '',
    aboutText: '',
    footerText: '',
    status: 'draft',
  })

  useEffect(() => {
    setContentForm({
      title: workspace.homepageContent.title,
      subtitle: workspace.homepageContent.subtitle ?? '',
      heroImageId: workspace.homepageContent.heroImageId ?? '',
      heroCtaLabel: workspace.homepageContent.heroCtaLabel ?? '',
      heroCtaHref: workspace.homepageContent.heroCtaHref ?? '',
      featuredCategorySlugs:
        workspace.homepageContent.featuredCategorySlugs.join(', '),
      homepageBanners: (workspace.homepageContent.homepageBanners ?? [])
        .map((banner) =>
          [banner.title, banner.body ?? '', banner.href ?? ''].join('|'),
        )
        .join('\n'),
      announcement: workspace.homepageContent.announcement ?? '',
      aboutText: workspace.homepageContent.aboutText ?? '',
      footerText: workspace.homepageContent.footerText ?? '',
      status: workspace.homepageContent.status ?? 'draft',
    })
  }, [workspace.homepageContent])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await updateHomepageContent({
        title: contentForm.title,
        subtitle: textOrUndefined(contentForm.subtitle),
        heroImageId: idOrUndefined<'mediaAssets'>(contentForm.heroImageId),
        heroCtaLabel: textOrUndefined(contentForm.heroCtaLabel),
        heroCtaHref: textOrUndefined(contentForm.heroCtaHref),
        featuredCategorySlugs: contentForm.featuredCategorySlugs
          .split(',')
          .map((slug) => slug.trim())
          .filter(Boolean),
        homepageBanners: parseBanners(contentForm.homepageBanners),
        announcement: textOrUndefined(contentForm.announcement),
        aboutText: textOrUndefined(contentForm.aboutText),
        footerText: textOrUndefined(contentForm.footerText),
        status: contentForm.status as 'draft' | 'published' | 'archived',
      })
      setMessage({ type: 'success', text: 'Homepage content saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <Panel title="Homepage content">
      <form className="admin-form two-column-form" onSubmit={handleSubmit}>
        <TextField
          label="Hero title"
          value={contentForm.title}
          onChange={(title) =>
            setContentForm((current) => ({ ...current, title }))
          }
        />
        <TextField
          label="Hero subtitle"
          value={contentForm.subtitle}
          onChange={(subtitle) =>
            setContentForm((current) => ({ ...current, subtitle }))
          }
        />
        <MediaSelect
          label="Hero image"
          value={contentForm.heroImageId}
          mediaAssets={workspace.mediaAssets}
          onChange={(heroImageId) =>
            setContentForm((current) => ({ ...current, heroImageId }))
          }
        />
        <TextField
          label="Hero CTA label"
          value={contentForm.heroCtaLabel}
          onChange={(heroCtaLabel) =>
            setContentForm((current) => ({ ...current, heroCtaLabel }))
          }
        />
        <TextField
          label="Hero CTA href"
          value={contentForm.heroCtaHref}
          onChange={(heroCtaHref) =>
            setContentForm((current) => ({ ...current, heroCtaHref }))
          }
        />
        <TextField
          label="Featured category slugs"
          value={contentForm.featuredCategorySlugs}
          placeholder="new-arrivals, best-sellers"
          onChange={(featuredCategorySlugs) =>
            setContentForm((current) => ({
              ...current,
              featuredCategorySlugs,
            }))
          }
        />
        <TextArea
          label="Homepage banners"
          value={contentForm.homepageBanners}
          placeholder="Title|Body|/products"
          onChange={(homepageBanners) =>
            setContentForm((current) => ({ ...current, homepageBanners }))
          }
        />
        <TextArea
          label="Announcement"
          value={contentForm.announcement}
          onChange={(announcement) =>
            setContentForm((current) => ({ ...current, announcement }))
          }
        />
        <TextArea
          label="About text"
          value={contentForm.aboutText}
          onChange={(aboutText) =>
            setContentForm((current) => ({ ...current, aboutText }))
          }
        />
        <TextArea
          label="Footer text"
          value={contentForm.footerText}
          onChange={(footerText) =>
            setContentForm((current) => ({ ...current, footerText }))
          }
        />
        <label>
          Status
          <select
            value={contentForm.status}
            onChange={(event) =>
              setContentForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <button type="submit">Save content</button>
      </form>
    </Panel>
  )
}

function SettingsPanel({
  workspace,
  isSuperadmin,
  setMessage,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
  isSuperadmin: boolean
  setMessage: (message: Message) => void
}>) {
  const updateSiteSettings = useMutation(api.admin.updateSiteSettings)
  const [settingsForm, setSettingsForm] = useState({
    storeName: '',
    logoImageId: '',
    faviconImageId: '',
    supportEmail: '',
    seoTitle: '',
    seoDescription: '',
    pendingPaymentExpiryMinutes: '30',
  })

  useEffect(() => {
    setSettingsForm({
      storeName: workspace.siteSettings.storeName,
      logoImageId: workspace.siteSettings.logoImageId ?? '',
      faviconImageId: workspace.siteSettings.faviconImageId ?? '',
      supportEmail: workspace.siteSettings.supportEmail,
      seoTitle: workspace.siteSettings.seoTitle ?? '',
      seoDescription: workspace.siteSettings.seoDescription ?? '',
      pendingPaymentExpiryMinutes: String(
        workspace.siteSettings.pendingPaymentExpiryMinutes ?? 30,
      ),
    })
  }, [workspace.siteSettings])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isSuperadmin) {
      setMessage({
        type: 'error',
        text: 'Only superadmins can update store settings.',
      })
      return
    }

    try {
      await updateSiteSettings({
        storeName: settingsForm.storeName,
        logoImageId: idOrUndefined<'mediaAssets'>(settingsForm.logoImageId),
        faviconImageId: idOrUndefined<'mediaAssets'>(
          settingsForm.faviconImageId,
        ),
        supportEmail: settingsForm.supportEmail,
        seoTitle: textOrUndefined(settingsForm.seoTitle),
        seoDescription: textOrUndefined(settingsForm.seoDescription),
        pendingPaymentExpiryMinutes: numberFromInput(
          settingsForm.pendingPaymentExpiryMinutes,
        ),
      })
      setMessage({ type: 'success', text: 'Settings saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <Panel title="Store settings">
      {!isSuperadmin ? (
        <p className="notice">
          Superadmin access is required to save settings.
        </p>
      ) : null}
      <form className="admin-form two-column-form" onSubmit={handleSubmit}>
        <TextField
          label="Store name"
          value={settingsForm.storeName}
          onChange={(storeName) =>
            setSettingsForm((current) => ({ ...current, storeName }))
          }
        />
        <TextField
          label="Support email"
          value={settingsForm.supportEmail}
          onChange={(supportEmail) =>
            setSettingsForm((current) => ({ ...current, supportEmail }))
          }
        />
        <MediaSelect
          label="Logo"
          value={settingsForm.logoImageId}
          mediaAssets={workspace.mediaAssets}
          onChange={(logoImageId) =>
            setSettingsForm((current) => ({ ...current, logoImageId }))
          }
        />
        <MediaSelect
          label="Favicon"
          value={settingsForm.faviconImageId}
          mediaAssets={workspace.mediaAssets}
          onChange={(faviconImageId) =>
            setSettingsForm((current) => ({ ...current, faviconImageId }))
          }
        />
        <TextField
          label="SEO title"
          value={settingsForm.seoTitle}
          onChange={(seoTitle) =>
            setSettingsForm((current) => ({ ...current, seoTitle }))
          }
        />
        <TextArea
          label="SEO description"
          value={settingsForm.seoDescription}
          onChange={(seoDescription) =>
            setSettingsForm((current) => ({ ...current, seoDescription }))
          }
        />
        <TextField
          label="Pending payment expiry minutes"
          value={settingsForm.pendingPaymentExpiryMinutes}
          inputMode="numeric"
          onChange={(pendingPaymentExpiryMinutes) =>
            setSettingsForm((current) => ({
              ...current,
              pendingPaymentExpiryMinutes,
            }))
          }
        />
        <button type="submit" disabled={!isSuperadmin}>
          Save settings
        </button>
      </form>
    </Panel>
  )
}

function ActivityPanel({
  workspace,
}: Readonly<{
  workspace: NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
  >
}>) {
  return (
    <Panel title="Recent admin activity">
      <div className="stack-list">
        {workspace.recentActivity.map((activity) => (
          <div key={activity._id}>
            <strong>
              {activity.action} {activity.targetTable}
            </strong>
            <span>
              {activity.targetId ?? 'unknown target'} -{' '}
              {new Date(activity.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Panel({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="admin-panel">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function TextField({
  label,
  value,
  onChange,
  inputMode,
  placeholder,
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: 'numeric'
  placeholder?: string
}>) {
  return (
    <label>
      {label}
      <input
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}>) {
  return (
    <label>
      {label}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function MediaSelect({
  label,
  value,
  mediaAssets,
  onChange,
}: Readonly<{
  label: string
  value: string
  mediaAssets: MediaAsset[]
  onChange: (value: string) => void
}>) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">None</option>
        {mediaAssets.map((asset) => (
          <option key={asset._id} value={asset._id}>
            {asset.filename}
          </option>
        ))}
      </select>
    </label>
  )
}

function textOrUndefined(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function idOrUndefined<
  TableName extends keyof import('../../convex/_generated/dataModel').DataModel,
>(value: string) {
  return value ? (value as Id<TableName>) : undefined
}

function numberFromInput(value: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return parsed
}

function optionalNumberFromInput(value: string) {
  return value.trim() ? numberFromInput(value) : undefined
}

function optionalDateFromInput(value: string) {
  return value ? new Date(`${value}T00:00:00`).getTime() : undefined
}

function dateInput(value: number | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function parseOptions(value: string) {
  return value
    .split(',')
    .map((part) => {
      const [name, ...rest] = part.split(':')
      return {
        name: name?.trim() ?? '',
        value: rest.join(':').trim(),
      }
    })
    .filter((option) => option.name && option.value)
}

function parseBanners(value: string) {
  return value
    .split('\n')
    .map((line) => {
      const [title = '', body = '', href = ''] = line.split('|')
      return {
        title: title.trim(),
        body: textOrUndefined(body),
        href: textOrUndefined(href),
      }
    })
    .filter((banner) => banner.title)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatOptionalMoney(value: number | undefined) {
  return value === undefined ? 'none' : formatMoney(value)
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}
