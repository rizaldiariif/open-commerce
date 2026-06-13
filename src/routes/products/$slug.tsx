import { type FormEvent, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { DetailAccordion, ProductGallery } from '../../components/ProductDetailParts'
import { QuantityStepper } from '../../components/QuantityStepper'
import { LoadingState } from '../../components/RouteFeedback'
import { formatMoney } from '../../components/StorefrontProductCard'
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
  const [quantity, setQuantity] = useState(1)
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
        quantity,
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
        <ProductGallery
          featuredImageUrl={product.featuredImageUrl}
          galleryImageUrls={product.galleryImageUrls}
          productName={product.name}
        />
      </div>

      <div className="product-purchase">
        <Link to="/products" className="text-link">
          Home / Products
        </Link>
        <p className="product-sku">SKU {selectedVariant?.sku ?? 'pending'}</p>
        <h1>{product.name}</h1>
        <a className="review-link" href="#details">
          Product details and care
        </a>

        <form className="purchase-form" onSubmit={handleAddToCart}>
          <label>
            Variant
            <div className="variant-button-grid">
              {product.variants.map((variant) => (
                <button
                  key={variant._id}
                  type="button"
                  data-active={
                    selectedVariant?._id === variant._id ? 'true' : undefined
                  }
                  disabled={variant.availableStock <= 0}
                  onClick={() => setSelectedVariantId(variant._id)}
                >
                  {variant.name}
                </button>
              ))}
            </div>
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

          <div className="purchase-actions">
            <label>
              Quantity
              <QuantityStepper
                value={quantity}
                max={selectedVariant?.availableStock ?? 1}
                disabled={!selectedVariant || selectedVariant.availableStock <= 0}
                onChange={setQuantity}
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
          </div>
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

        <div id="details">
          <DetailAccordion
            description={product.description}
            categoryName={product.category?.name}
          />
        </div>
      </div>
    </section>
  )
}
