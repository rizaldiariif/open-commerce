import { type FormEvent, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { LoadingState } from '../../components/RouteFeedback'
import { useToast } from '../../components/Toast'

export const Route = createFileRoute('/products/$slug')({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | Muse Commerce` },
      {
        name: 'description',
        content: 'View product details, variants, images, and availability.',
      },
    ],
  }),
  component: ProductDetail,
})

function ProductDetail() {
  const { slug } = Route.useParams()
  const product = useQuery(api.storefront.getProductBySlug, { slug })
  const current = useQuery(api.profiles.current)
  const addToCart = useMutation(api.storefront.addToCart)
  const { notify } = useToast()
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const selectedVariant = useMemo(() => {
    const fallback = product?.variants.find(
      (variant) => variant.availableStock > 0,
    )

    return (
      product?.variants.find((variant) => variant._id === selectedVariantId) ??
      fallback ??
      product?.variants[0]
    )
  }, [product, selectedVariantId])

  async function handleAddToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedVariant) {
      const nextMessage = {
        type: 'error' as const,
        text: 'Choose an available product option.',
      }
      setMessage(nextMessage)
      notify(nextMessage)
      return
    }

    setIsAdding(true)
    try {
      await addToCart({
        variantId: selectedVariant._id as Id<'productVariants'>,
        quantity: Number(quantity),
      })
      const nextMessage = { type: 'success' as const, text: 'Added to cart.' }
      setMessage(nextMessage)
      notify(nextMessage)
    } catch (error) {
      const nextMessage = {
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not add to cart.',
      } as const
      setMessage(nextMessage)
      notify(nextMessage)
    } finally {
      setIsAdding(false)
    }
  }

  if (product === undefined) {
    return (
      <LoadingState
        eyebrow="Product"
        title="Loading product"
        body="Fetching the latest price, stock, and images."
      />
    )
  }

  if (!product) {
    return (
      <section className="content-page">
        <p className="eyebrow">Product</p>
        <h1>Product not found</h1>
        <p>This product is unavailable or has been archived.</p>
        <Link to="/products" className="primary-link">
          Browse products
        </Link>
      </section>
    )
  }

  return (
    <section className="product-detail">
      <div className="product-media">
        {product.featuredImageUrl ? (
          <img src={product.featuredImageUrl} alt="" />
        ) : (
          <div className="detail-image-placeholder">Muse</div>
        )}
        {product.galleryImageUrls.length ? (
          <div className="thumbnail-row">
            {product.galleryImageUrls.map((url) => (
              <img key={url} src={url} alt="" />
            ))}
          </div>
        ) : null}
      </div>

      <div className="product-purchase">
        <Link to="/products" className="text-link">
          All products
        </Link>
        <p className="eyebrow">{product.category?.name ?? 'Muse Collection'}</p>
        <h1>{product.name}</h1>
        {product.description ? (
          <p className="lede">{product.description}</p>
        ) : null}

        <form className="purchase-form" onSubmit={handleAddToCart}>
          <label>
            Variant
            <select
              value={selectedVariant?._id ?? ''}
              onChange={(event) => setSelectedVariantId(event.target.value)}
            >
              {product.variants.map((variant) => (
                <option key={variant._id} value={variant._id}>
                  {variant.name} - {formatMoney(variant.price)}
                  {variant.availableStock <= 0 ? ' - out of stock' : ''}
                </option>
              ))}
            </select>
          </label>

          {selectedVariant ? (
            <div className="variant-summary">
              <strong>{formatMoney(selectedVariant.price)}</strong>
              {selectedVariant.compareAtPrice ? (
                <span>{formatMoney(selectedVariant.compareAtPrice)}</span>
              ) : null}
              <small>
                {selectedVariant.availableStock > 0
                  ? `${selectedVariant.availableStock} available`
                  : 'Out of stock'}
              </small>
              {selectedVariant.optionValues.length ? (
                <ul>
                  {selectedVariant.optionValues.map((option) => (
                    <li key={`${option.name}-${option.value}`}>
                      {option.name}: {option.value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <label>
            Quantity
            <input
              type="number"
              min="1"
              max={selectedVariant?.availableStock ?? 1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          {current === undefined ? (
            <button type="button" disabled>
              Checking session
            </button>
          ) : current === null ? (
            <Link
              to="/login"
              search={{ redirect: `/products/${product.slug}` }}
              className="primary-link"
            >
              Login to add to cart
            </Link>
          ) : (
            <button
              type="submit"
              disabled={
                isAdding ||
                !selectedVariant ||
                selectedVariant.availableStock <= 0
              }
            >
              {isAdding ? 'Adding' : 'Add to cart'}
            </button>
          )}
        </form>

        {message ? (
          <div className={`form-message ${message.type}`}>
            <p>{message.text}</p>
            {message.type === 'success' ? (
              <Link to="/cart" className="text-link">
                View cart
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
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
