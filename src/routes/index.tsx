import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'
import { LoadingState } from '../components/RouteFeedback'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Muse Commerce' },
      {
        name: 'description',
        content: 'Curated single-brand shopping from Muse Commerce.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  const home = useQuery(api.storefront.getHome)

  if (home === undefined) {
    return (
      <LoadingState
        eyebrow="Storefront"
        title="Loading Muse Commerce"
        body="Fetching the latest homepage and catalog content."
      />
    )
  }

  const { homepageContent, featuredProducts, siteSettings } = home

  return (
    <section className="storefront-page">
      {homepageContent.announcement ? (
        <p className="announcement">{homepageContent.announcement}</p>
      ) : null}

      <div className="home-hero">
        <div>
          <p className="eyebrow">{siteSettings.storeName}</p>
          <h1>{homepageContent.title}</h1>
          {homepageContent.subtitle ? (
            <p className="lede">{homepageContent.subtitle}</p>
          ) : null}
        </div>
        {homepageContent.heroImageUrl ? (
          <img
            src={homepageContent.heroImageUrl}
            alt=""
            className="hero-image"
          />
        ) : null}
        <div className="action-row">
          <Link
            to={homepageContent.heroCtaHref ?? '/products'}
            className="primary-link"
          >
            {homepageContent.heroCtaLabel ?? 'Shop products'}
          </Link>
          <Link to="/cart" className="secondary-link">
            View cart
          </Link>
        </div>
      </div>

      {homepageContent.homepageBanners.length ? (
        <div className="banner-grid">
          {homepageContent.homepageBanners.map((banner) => (
            <Link
              key={`${banner.title}-${banner.href ?? ''}`}
              to={banner.href ?? '/products'}
              className="banner-card"
            >
              {banner.imageUrl ? <img src={banner.imageUrl} alt="" /> : null}
              <strong>{banner.title}</strong>
              {banner.body ? <span>{banner.body}</span> : null}
            </Link>
          ))}
        </div>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Featured products</h2>
          </div>
          <Link to="/products" className="text-link">
            Browse all
          </Link>
        </div>
        {featuredProducts.length ? (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No active products yet. Publish products from the admin catalog to
            fill this shelf.
          </p>
        )}
      </section>

      {homepageContent.aboutText ? (
        <section className="about-band">
          <p>{homepageContent.aboutText}</p>
        </section>
      ) : null}

      {homepageContent.footerText ? (
        <footer className="footer-band">{homepageContent.footerText}</footer>
      ) : null}
    </section>
  )
}

function ProductCard({
  product,
}: Readonly<{
  product: NonNullable<
    ReturnType<typeof useQuery<typeof api.storefront.getHome>>
  >['featuredProducts'][number]
}>) {
  return (
    <Link
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
          : formatMoney(product.minPrice, 'IDR')}
      </small>
    </Link>
  )
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
