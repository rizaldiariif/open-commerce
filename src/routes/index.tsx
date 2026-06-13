import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'
import { LoadingState } from '../components/RouteFeedback'
import { StorefrontProductCard } from '../components/StorefrontProductCard'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Muse — Goods of Considered Make' },
      {
        name: 'description',
        content: 'Curated single-brand objects from the Muse studio.',
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
        title="Loading the studio"
        body="Fetching the latest homepage and catalog content."
      />
    )
  }

  const { homepageContent, featuredProducts, siteSettings } = home
  const categoryTiles = Array.from(
    new Map(
      featuredProducts
        .filter((product) => product.category)
        .map((product) => [
          product.category!._id,
          {
            id: product.category!._id,
            name: product.category!.name,
            imageUrl: product.imageUrl,
          },
        ]),
    ).values(),
  ).slice(0, 6)

  return (
    <section className="storefront-page">
      {homepageContent.announcement ? (
        <p className="announcement">{homepageContent.announcement}</p>
      ) : null}

      <section className="home-hero">
        {homepageContent.heroImageUrl ? (
          <img src={homepageContent.heroImageUrl} alt="" />
        ) : (
          <div className="category-tile-placeholder">MUSE</div>
        )}
        <div className="home-hero-content">
          <h1>{homepageContent.title}</h1>
          {homepageContent.subtitle ? (
            <p className="lede">{homepageContent.subtitle}</p>
          ) : null}
          <Link
            to={homepageContent.heroCtaHref ?? '/products'}
            className="primary-link"
          >
            {homepageContent.heroCtaLabel ?? 'Shop the collection'}
          </Link>
        </div>
      </section>

      {categoryTiles.length ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{siteSettings.storeName}</p>
              <h2>Shop by use</h2>
            </div>
            <Link to="/products" className="text-link">
              Browse all
            </Link>
          </div>
          <div className="category-tile-grid">
            {categoryTiles.map((category) => (
              <Link
                key={category.id}
                to="/products"
                className="category-tile"
              >
                {category.imageUrl ? (
                  <img src={category.imageUrl} alt="" />
                ) : (
                  <span className="category-tile-placeholder">MUSE</span>
                )}
                <strong>{category.name}</strong>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">New arrivals</p>
            <h2>Everyday goods</h2>
          </div>
          <Link to="/products" className="text-link">
            Browse all
          </Link>
        </div>
        {featuredProducts.length ? (
          <div className="product-grid">
            {featuredProducts.map((product, index) => (
              <StorefrontProductCard
                key={product._id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No active products yet. Publish products from the admin catalog to
            fill this shelf.
          </p>
        )}
      </section>

      {homepageContent.homepageBanners.length ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Guides</p>
              <h2>Useful ways to shop</h2>
            </div>
          </div>
          <div className="editorial-grid">
            {homepageContent.homepageBanners.map((banner) => (
              <Link
                key={`${banner.title}-${banner.href ?? ''}`}
                to={banner.href ?? '/products'}
                className="editorial-card"
              >
                {banner.imageUrl ? <img src={banner.imageUrl} alt="" /> : null}
                <span className="editorial-card-body">
                  <strong>{banner.title}</strong>
                  {banner.body ? <span>{banner.body}</span> : null}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {homepageContent.aboutText || homepageContent.footerText ? (
        <section className="story-row">
          {homepageContent.aboutText ? (
            <article className="story-card">
              <p className="eyebrow">Materials</p>
              <h2>Considered by use</h2>
              <p>{homepageContent.aboutText}</p>
            </article>
          ) : null}
          {homepageContent.footerText ? (
            <article className="story-card">
              <p className="eyebrow">Service</p>
              <h2>Before checkout</h2>
              <p>{homepageContent.footerText}</p>
            </article>
          ) : null}
          <article className="story-card">
            <p className="eyebrow">MUSE</p>
            <h2>Made to be used</h2>
            <p>
              Everyday objects selected for simple care, clear materials, and a
              long life at home.
            </p>
          </article>
        </section>
      ) : null}
    </section>
  )
}
