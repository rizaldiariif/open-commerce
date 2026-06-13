import { type FormEvent, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [
      { title: 'Cart | Muse Commerce' },
      {
        name: 'description',
        content: 'Review cart items before checkout.',
      },
    ],
  }),
  component: Cart,
})

function Cart() {
  const cartState = useQuery(api.storefront.getCart)
  const updateCartItem = useMutation(api.storefront.updateCartItem)
  const removeCartItem = useMutation(api.storefront.removeCartItem)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function handleQuantitySubmit(
    event: FormEvent<HTMLFormElement>,
    cartItemId: Id<'cartItems'>,
  ) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const quantity = Number(formData.get('quantity'))

    try {
      await updateCartItem({ cartItemId, quantity })
      setMessage({ type: 'success', text: 'Cart updated.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not update cart.',
      })
    }
  }

  async function handleRemove(cartItemId: Id<'cartItems'>) {
    try {
      await removeCartItem({ cartItemId })
      setMessage({ type: 'success', text: 'Item removed.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not remove item.',
      })
    }
  }

  if (cartState === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Checkout path</p>
        <h1>Cart</h1>
        <p>Loading your cart.</p>
      </section>
    )
  }

  if (cartState.status === 'unauthenticated') {
    return (
      <section className="content-page">
        <p className="eyebrow">Checkout path</p>
        <h1>Login to view your cart</h1>
        <p>Customer carts are saved to signed-in accounts for this MVP.</p>
        <div className="action-row">
          <Link to="/login" search={{ redirect: '/cart' }} className="primary-link">
            Login
          </Link>
          <Link to="/products" className="secondary-link">
            Browse products
          </Link>
        </div>
      </section>
    )
  }

  const cart = cartState.cart

  if (!cart || cart.items.length === 0) {
    return (
      <section className="content-page">
        <p className="eyebrow">Checkout path</p>
        <h1>Your cart is empty</h1>
        <p>Add products from the catalog before checkout.</p>
        <Link to="/products" className="primary-link">
          Browse products
        </Link>
      </section>
    )
  }

  return (
    <section className="cart-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Checkout path</p>
          <h1>Cart</h1>
          <p>
            Review quantities against current product availability before
            moving to checkout.
          </p>
        </div>
        <Link to="/products" className="secondary-link">
          Continue shopping
        </Link>
      </header>

      {message ? (
        <p className={`form-message ${message.type}`}>{message.text}</p>
      ) : null}

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item) => (
            <article key={item._id} className="cart-item">
              {item.productSnapshot.imageUrl ? (
                <img src={item.productSnapshot.imageUrl} alt="" />
              ) : (
                <div className="cart-image-placeholder">Muse</div>
              )}
              <div>
                <Link
                  to="/products/$slug"
                  params={{ slug: item.productSnapshot.slug }}
                  className="cart-product-link"
                >
                  {item.productSnapshot.name}
                </Link>
                <p>{item.variantSnapshot.name}</p>
                {item.variantSnapshot.optionValues.length ? (
                  <small>
                    {item.variantSnapshot.optionValues
                      .map((option) => `${option.name}: ${option.value}`)
                      .join(', ')}
                  </small>
                ) : null}
                {!item.isValid ? (
                  <strong className="cart-warning">
                    This item is no longer available.
                  </strong>
                ) : !item.isQuantityAvailable ? (
                  <strong className="cart-warning">
                    Only {item.availableStock} available.
                  </strong>
                ) : null}
              </div>
              <form
                className="cart-quantity-form"
                onSubmit={(event) =>
                  handleQuantitySubmit(event, item._id as Id<'cartItems'>)
                }
              >
                <label>
                  Qty
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max={Math.max(1, item.availableStock)}
                    defaultValue={item.quantity}
                  />
                </label>
                <button type="submit">Update</button>
                <button
                  type="button"
                  onClick={() => handleRemove(item._id as Id<'cartItems'>)}
                >
                  Remove
                </button>
              </form>
              <strong className="line-total">{formatMoney(item.lineTotal)}</strong>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Summary</h2>
          <dl>
            <div>
              <dt>Items</dt>
              <dd>{cart.itemCount}</dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(cart.subtotal)}</dd>
            </div>
          </dl>
          {cart.canCheckout ? (
            <Link to="/checkout" className="primary-link">
              Checkout
            </Link>
          ) : (
            <p className="cart-warning">
              Resolve unavailable items before checkout.
            </p>
          )}
        </aside>
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
