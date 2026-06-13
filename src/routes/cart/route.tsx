import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { CartLineItem } from '../../components/CartLineItem'
import { AccessRequired, LoadingState } from '../../components/RouteFeedback'
import { formatMoney } from '../../components/StorefrontProductCard'
import { useToast } from '../../components/Toast'

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
  const { notify } = useToast()
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)

  async function handleQuantitySubmit(
    cartItemId: Id<'cartItems'>,
    quantity: number,
  ) {
    setPendingItemId(cartItemId)
    try {
      await updateCartItem({ cartItemId, quantity })
      setMessage({ type: 'success', text: 'Cart updated.' })
      notify({ type: 'success', text: 'Cart updated.' })
    } catch (error) {
      const nextMessage = {
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not update cart.',
      } as const
      setMessage(nextMessage)
      notify(nextMessage)
    } finally {
      setPendingItemId(null)
    }
  }

  async function handleRemove(cartItemId: Id<'cartItems'>) {
    setPendingItemId(cartItemId)
    try {
      await removeCartItem({ cartItemId })
      setMessage({ type: 'success', text: 'Item removed.' })
      notify({ type: 'success', text: 'Item removed.' })
    } catch (error) {
      const nextMessage = {
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not remove item.',
      } as const
      setMessage(nextMessage)
      notify(nextMessage)
    } finally {
      setPendingItemId(null)
    }
  }

  if (cartState === undefined) {
    return (
      <LoadingState
        eyebrow="Checkout path"
        title="Loading cart"
        body="Checking item availability before checkout."
      />
    )
  }

  if (cartState.status === 'unauthenticated') {
    return (
      <AccessRequired
        title="Login to view your cart"
        body="Customer carts are saved to signed-in accounts for this MVP."
        redirect="/cart"
      />
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
            Review quantities against current product availability before moving
            to checkout.
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
            <CartLineItem
              key={item._id}
              item={item}
              isPending={pendingItemId === item._id}
              onUpdate={(cartItemId, quantity) =>
                void handleQuantitySubmit(cartItemId, quantity)
              }
              onRemove={(cartItemId) => void handleRemove(cartItemId)}
            />
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
          ) : !cartState.checkoutEnabled ? (
            <p className="cart-warning">
              Checkout is temporarily disabled by store settings.
            </p>
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
