import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'
import { LoadingState } from '../components/RouteFeedback'

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
  const pieceCount = featuredProducts.length

  return (
    <section className="storefront-page">
      {homepageContent.announcement ? (
        <p className="announcement">{homepageContent.announcement}</p>
      ) : null}

      {/* Asymmetric hero: statement + meta column */}
      <div className="grid gap-12 md:grid-cols-[1.7fr_1fr] md:gap-16">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">{siteSettings.storeName}</p>
          <h1 className="text-[clamp(2.8rem,8vw,6.5rem)]">
            {homepageContent.title}
          </h1>
          {homepageContent.subtitle ? (
            <p className="lede">{homepageContent.subtitle}</p>
          ) : null}
          <div className="action-row">
            <Link
              to={homepageContent.heroCtaHref ?? '/products'}
              className="primary-link"
            >
              {homepageContent.heroCtaLabel ?? 'Shop the collection'}
            </Link>
            <Link to="/cart" className="secondary-link">
              View cart
            </Link>
          </div>
        </div>

        <dl className="grid content-center gap-0 self-stretch border-t border-ink md:border-l md:border-t-0 md:pl-10">
          <MetaRow label="Collection" value={siteSettings.storeName} />
          <MetaRow
            label="Catalogue"
            value={`${pieceCount} ${pieceCount === 1 ? 'piece' : 'pieces'}`}
          />
          <MetaRow label="Shipping" value="Worldwide" />
          <MetaRow label="Made" value="In limited runs" last />
        </dl>
      </div>

      {homepageContent.heroImageUrl ? (
        <div className="relative">
          <img
            src={homepageContent.heroImageUrl}
            alt=""
            className="aspect-[16/8] w-full object-cover"
          />
          <span className="absolute left-4 top-4 bg-ink px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-paper">
            New season
          </span>
        </div>
      ) : null}

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
            <p className="eyebrow">Catalogue</p>
            <h2>Featured objects</h2>
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
        <p className="footer-band">{homepageContent.footerText}</p>
      ) : null}
    </section>
  )
}

function MetaRow({
  label,
  value,
  last,
}: Readonly<{ label: string; value: string; last?: boolean }>) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-line py-4 ${
        last ? 'md:border-b-0' : ''
      }`}
    >
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="m-0 font-display text-base font-semibold tracking-[-0.01em] text-ink">
        {value}
      </dd>
    </div>
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
