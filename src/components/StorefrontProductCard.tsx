import { Link } from '@tanstack/react-router'

type ProductCardProduct = {
  slug: string
  name: string
  imageUrl?: string | null
  minPrice: number | null
  compareAtPrice?: number
  inStock?: boolean
  category?: {
    name: string
  } | null
}

export function StorefrontProductCard({
  product,
  priority = false,
}: Readonly<{
  product: ProductCardProduct
  priority?: boolean
}>) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="product-card"
    >
      <span className="product-card-media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" loading={priority ? 'eager' : 'lazy'} />
        ) : (
          <span className="product-image-placeholder">MUSE</span>
        )}
        <span aria-hidden="true" className="product-favorite">
          ♡
        </span>
      </span>
      <span className="product-card-meta">
        {product.category?.name ?? 'MUSE goods'}
      </span>
      <strong>{product.name}</strong>
      <span className="product-card-price">
        {product.minPrice === null ? 'Price pending' : formatMoney(product.minPrice)}
        {product.compareAtPrice ? (
          <span>{formatMoney(product.compareAtPrice)}</span>
        ) : null}
      </span>
      {product.inStock === false ? (
        <small className="product-card-note">Out of stock</small>
      ) : null}
    </Link>
  )
}

export function formatMoney(value: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
