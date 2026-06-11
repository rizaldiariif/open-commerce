import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products')({
  component: Products,
})

function Products() {
  return (
    <section className="content-page">
      <p className="eyebrow">Storefront</p>
      <h1>Products</h1>
      <p>
        Product listing will connect to Convex catalog queries in the catalog
        task. This page is ready for category filters, variant pricing, and
        stock-aware product cards.
      </p>
    </section>
  )
}
