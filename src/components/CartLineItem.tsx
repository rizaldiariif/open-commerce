import { type FormEvent, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import type { Id } from '../../convex/_generated/dataModel'
import { formatMoney } from './StorefrontProductCard'
import { QuantityStepper } from './QuantityStepper'

type CartItemView = {
  _id: Id<'cartItems'>
  quantity: number
  availableStock: number
  lineTotal: number
  isValid: boolean
  isQuantityAvailable: boolean
  productSnapshot: {
    name: string
    slug: string
    imageUrl?: string
  }
  variantSnapshot: {
    name: string
    optionValues: {
      name: string
      value: string
    }[]
  }
}

export function CartLineItem({
  item,
  isPending,
  onUpdate,
  onRemove,
}: Readonly<{
  item: CartItemView
  isPending: boolean
  onUpdate: (cartItemId: Id<'cartItems'>, quantity: number) => void
  onRemove: (cartItemId: Id<'cartItems'>) => void
}>) {
  const [quantity, setQuantity] = useState(item.quantity)

  useEffect(() => {
    setQuantity(item.quantity)
  }, [item.quantity])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onUpdate(item._id, quantity)
  }

  return (
    <article className="cart-item">
      {item.productSnapshot.imageUrl ? (
        <img src={item.productSnapshot.imageUrl} alt="" />
      ) : (
        <div className="cart-image-placeholder">MUSE</div>
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
      <form className="cart-quantity-form" onSubmit={handleSubmit}>
        <label>
          Qty
          <QuantityStepper
            value={quantity}
            max={Math.max(1, item.availableStock)}
            disabled={isPending}
            onChange={setQuantity}
          />
        </label>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Updating' : 'Update'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => onRemove(item._id)}
        >
          Remove
        </button>
      </form>
      <strong className="line-total">{formatMoney(item.lineTotal)}</strong>
    </article>
  )
}
