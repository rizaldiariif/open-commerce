import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import { LoadingState } from '../../components/RouteFeedback'
import { StatusBadge } from '../../components/StatusBadge'

export const Route = createFileRoute('/products/')({
  head: () => ({
    meta: [
      { title: 'Products | Muse Commerce' },
      {
        name: 'description',
        content: 'Browse the current Muse Commerce catalog.',
      },
    ],
  }),
  component: ProductsIndex,
})

function ProductsIndex() {
  const catalog = useQuery(api.storefront.listProducts)

  if (catalog === undefined) {
    return (
      <LoadingState
        eyebrow="Storefront"
        title="Loading products"
        body="Fetching current pricing, variants, and stock availability."
      />
    )
  }

  return (
    <section className="storefront-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Storefront</p>
          <h1>Products</h1>
          <p>
            Browse active products with current pricing, variants, and stock
            availability.
          </p>
        </div>
        <Link to="/cart" className="secondary-link">
          View cart
        </Link>
      </header>

      {catalog.categories.length ? (
        <div className="category-row" aria-label="Active categories">
          {catalog.categories.map((category) => (
            <span key={category._id}>{category.name}</span>
          ))}
        </div>
      ) : null}

      {catalog.products.length ? (
        <div className="product-grid">
          {catalog.products.map((product) => (
            <Link
              key={product._id}
              to="/products/$slug"
              params={{ slug: product.slug }}
              className="product-card"
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" />
              ) : (
                <div className="product-image-placeholder">Muse</div>
              )}
              <span>{product.category?.name ?? 'Muse Collection'}</span>
              <strong>{product.name}</strong>
              <small>
                {product.minPrice === null
                  ? 'Price pending'
                  : formatMoney(product.minPrice)}
              </small>
              <StatusBadge
                value={product.inStock ? 'in_stock' : 'out_of_stock'}
              />
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          No active products are published yet. Check back after the catalog is
          stocked.
        </p>
      )}
    </section>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
