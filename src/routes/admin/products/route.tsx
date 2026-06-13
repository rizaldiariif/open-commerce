import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type FormEvent, useMemo, useState } from 'react'
import { useMutation } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  type AdminMessage,
  type AdminWorkspace,
  MediaSelect,
  Panel,
  TextArea,
  TextField,
  emptyProductForm,
  emptyVariantForm,
  errorMessage,
  formatMoney,
  idOrUndefined,
  numberFromInput,
  optionalNumberFromInput,
  parseOptions,
  textOrUndefined,
} from '../-shared'

function ProductsPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  setMessage: (message: AdminMessage) => void
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

export const Route = createFileRoute('/admin/products')({
  component: AdminProducts,
})

function AdminProducts() {
  return (
    <AdminModulePage activeModule="products">
      {({ workspace, setMessage }) => <ProductsPanel workspace={workspace} setMessage={setMessage} />}
    </AdminModulePage>
  )
}
