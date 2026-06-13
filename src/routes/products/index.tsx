import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import { LoadingState } from '../../components/RouteFeedback'
import { StorefrontProductCard } from '../../components/StorefrontProductCard'

type SortMode = 'featured' | 'price_asc' | 'price_desc' | 'name'

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
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('featured')

  const products = useMemo(() => {
    if (!catalog) return []

    const filtered = catalog.products.filter((product) => {
      const categoryMatches =
        activeCategoryId === 'all' || product.category?._id === activeCategoryId
      const stockMatches = !inStockOnly || product.inStock
      return categoryMatches && stockMatches
    })

    return [...filtered].sort((a, b) => {
      if (sortMode === 'price_asc') {
        return (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER)
      }
      if (sortMode === 'price_desc') {
        return (b.minPrice ?? 0) - (a.minPrice ?? 0)
      }
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name)
      }
      return a.sortOrder - b.sortOrder
    })
  }, [activeCategoryId, catalog, inStockOnly, sortMode])

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
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>Shop by use</h2>
            </div>
          </div>
          <div className="category-row" aria-label="Active categories">
            <button
              type="button"
              data-active={activeCategoryId === 'all' ? 'true' : undefined}
              onClick={() => setActiveCategoryId('all')}
            >
              All goods
            </button>
            {catalog.categories.map((category) => (
              <button
                key={category._id}
                type="button"
                data-active={
                  activeCategoryId === category._id ? 'true' : undefined
                }
                onClick={() => setActiveCategoryId(category._id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{products.length} results</p>
            <h2>All everyday goods</h2>
          </div>
          <div className="filter-sort-bar">
            <button
              type="button"
              data-active={inStockOnly ? 'true' : undefined}
              onClick={() => setInStockOnly((value) => !value)}
            >
              In stock
            </button>
            <label>
              Sort
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price low to high</option>
                <option value="price_desc">Price high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
        </div>

        {products.length ? (
          <div className="product-grid">
            {products.map((product, index) => (
              <StorefrontProductCard
                key={product._id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No products match those filters. Clear the category or stock filter
            to see more goods.
          </p>
        )}
      </section>
    </section>
  )
}
