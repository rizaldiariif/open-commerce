import { useState } from 'react'

export function ProductGallery({
  featuredImageUrl,
  galleryImageUrls,
  productName,
}: Readonly<{
  featuredImageUrl?: string | null
  galleryImageUrls: string[]
  productName: string
}>) {
  const images = [featuredImageUrl, ...galleryImageUrls].filter(
    (url): url is string => Boolean(url),
  )
  const [selectedUrl, setSelectedUrl] = useState(images[0])

  if (!selectedUrl) {
    return <div className="detail-image-placeholder">MUSE</div>
  }

  return (
    <>
      <img className="product-gallery-main" src={selectedUrl} alt="" />
      {images.length > 1 ? (
        <div className="thumbnail-row" aria-label={`${productName} images`}>
          {images.map((url) => (
            <button
              key={url}
              type="button"
              data-active={selectedUrl === url ? 'true' : undefined}
              onClick={() => setSelectedUrl(url)}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}

export function DetailAccordion({
  description,
  categoryName,
}: Readonly<{
  description?: string
  categoryName?: string
}>) {
  return (
    <div className="detail-accordion">
      <details open>
        <summary>Product details</summary>
        <p>
          {description ??
            'A considered everyday object selected for simple use and clear materials.'}
        </p>
      </details>
      <details>
        <summary>Material and care</summary>
        <p>
          Review the product notes before use. Keep dry, clean gently, and store
          with similar everyday goods.
        </p>
      </details>
      <details>
        <summary>Shipping and returns</summary>
        <p>
          Orders are prepared from the MUSE catalog. Shipping and return
          availability may vary by destination and checkout status.
        </p>
      </details>
      {categoryName ? (
        <details>
          <summary>Category</summary>
          <p>This item is part of {categoryName}.</p>
        </details>
      ) : null}
    </div>
  )
}
