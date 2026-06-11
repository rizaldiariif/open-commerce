import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cart')({
  component: Cart,
})

function Cart() {
  return (
    <section className="content-page">
      <p className="eyebrow">Checkout path</p>
      <h1>Cart</h1>
      <p>
        The cart route is in place for the upcoming logged-in cart and order
        creation flow. Inventory reservations will happen in Convex mutations.
      </p>
    </section>
  )
}
