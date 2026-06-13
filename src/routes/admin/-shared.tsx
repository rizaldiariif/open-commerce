import { type ReactNode, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import type { DataModel, Doc, Id } from '../../../convex/_generated/dataModel'

export type AdminWorkspace = NonNullable<
  ReturnType<typeof useQuery<typeof api.admin.getWorkspace>>
>

export type AdminMessage = {
  type: 'success' | 'error'
  text: string
}

export type MediaAsset = Doc<'mediaAssets'> & {
  url: string | null
}

export const adminModules = [
  { id: 'products', label: 'Products', to: '/admin/products' },
  { id: 'categories', label: 'Categories', to: '/admin/categories' },
  { id: 'inventory', label: 'Inventory', to: '/admin/inventory' },
  { id: 'coupons', label: 'Coupons', to: '/admin/coupons' },
  { id: 'media', label: 'Media', to: '/admin/media' },
  { id: 'content', label: 'Content', to: '/admin/content' },
  { id: 'emails', label: 'Emails', to: '/admin/emails' },
  { id: 'settings', label: 'Settings', to: '/admin/settings' },
  { id: 'activity', label: 'Activity', to: '/admin/activity' },
] as const

export type AdminModuleId = (typeof adminModules)[number]['id']

export const emptyCategoryForm = {
  id: '',
  name: '',
  slug: '',
  description: '',
  parentCategoryId: '',
  imageId: '',
  sortOrder: '0',
  isActive: true,
}

export const emptyProductForm = {
  id: '',
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  status: 'draft',
  featuredImageId: '',
  galleryImageIds: [] as string[],
  seoTitle: '',
  seoDescription: '',
  sortOrder: '0',
}

export const emptyVariantForm = {
  id: '',
  productId: '',
  sku: '',
  name: '',
  optionValues: '',
  price: '0',
  compareAtPrice: '',
  initialStock: '0',
  lowStockThreshold: '',
  weightGrams: '',
  isActive: true,
}

export const emptyInventoryForm = {
  variantId: '',
  quantityDelta: '',
  reason: '',
}

export const emptyCouponForm = {
  id: '',
  code: '',
  type: 'percentage',
  value: '0',
  currency: 'IDR',
  minSubtotal: '',
  maxDiscount: '',
  usageLimit: '',
  usageLimitPerCustomer: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
}

export const emptyEmailTemplateForm = {
  id: '',
  key: 'invoice_created',
  subject: '',
  previewText: '',
  htmlBody: '',
  textBody: '',
  isActive: true,
}

export function Panel({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="admin-panel">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function TextField({
  label,
  value,
  onChange,
  inputMode,
  type = 'text',
  placeholder,
  disabled = false,
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: 'numeric'
  type?: string
  placeholder?: string
  disabled?: boolean
}>) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}>) {
  return (
    <label>
      {label}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function MediaSelect({
  label,
  value,
  mediaAssets,
  onChange,
}: Readonly<{
  label: string
  value: string
  mediaAssets: MediaAsset[]
  onChange: (value: string) => void
}>) {
  const selectedAsset = mediaAssets.find((asset) => asset._id === value)

  return (
    <div className="media-picker">
      <label>
        {label}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">None</option>
          {mediaAssets.map((asset) => (
            <option key={asset._id} value={asset._id}>
              {asset.filename}
            </option>
          ))}
          {value && !selectedAsset ? (
            <option value={value}>Uploaded image</option>
          ) : null}
        </select>
      </label>
      {selectedAsset ? (
        <div className="media-option selected">
          {selectedAsset.url ? (
            <img src={selectedAsset.url} alt="" />
          ) : (
            <span>No preview</span>
          )}
          <strong>{selectedAsset.filename}</strong>
        </div>
      ) : null}
      <InlineMediaUpload onUploaded={onChange} />
    </div>
  )
}

export function MediaMultiSelect({
  label,
  values,
  mediaAssets,
  onChange,
}: Readonly<{
  label: string
  values: string[]
  mediaAssets: MediaAsset[]
  onChange: (values: string[]) => void
}>) {
  function toggle(assetId: string) {
    onChange(
      values.includes(assetId)
        ? values.filter((value) => value !== assetId)
        : [...values, assetId],
    )
  }

  return (
    <div className="media-picker">
      <span className="media-picker-label">{label}</span>
      <div className="media-option-grid">
        {mediaAssets.map((asset) => (
          <button
            key={asset._id}
            type="button"
            className={`media-option ${values.includes(asset._id) ? 'selected' : ''}`}
            onClick={() => toggle(asset._id)}
          >
            {asset.url ? (
              <img src={asset.url} alt="" />
            ) : (
              <span>No preview</span>
            )}
            <strong>{asset.filename}</strong>
          </button>
        ))}
        {mediaAssets.length === 0 ? (
          <p className="form-help">Upload an image below to build a gallery.</p>
        ) : null}
      </div>
      <InlineMediaUpload
        onUploaded={(mediaId) => onChange([...values, mediaId])}
      />
    </div>
  )
}

export function ConfirmButton({
  children,
  confirmText,
  onConfirm,
  className,
}: Readonly<{
  children: ReactNode
  confirmText: string
  onConfirm: () => void | Promise<void>
  className?: string
}>) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.confirm(confirmText)) {
          void onConfirm()
        }
      }}
    >
      {children}
    </button>
  )
}

function InlineMediaUpload({
  onUploaded,
}: Readonly<{
  onUploaded: (mediaId: string) => void
}>) {
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl)
  const saveUploadedMedia = useMutation(api.admin.saveUploadedMedia)
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [message, setMessage] = useState<AdminMessage | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleUpload() {
    if (!file) {
      setMessage({ type: 'error', text: 'Choose an image to upload.' })
      return
    }

    setIsUploading(true)
    setMessage(null)
    try {
      const uploadUrl = await generateUploadUrl()
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })

      if (!uploadResult.ok) {
        throw new Error('Upload failed.')
      }

      const { storageId } = (await uploadResult.json()) as {
        storageId: string
      }
      const mediaId = await saveUploadedMedia({
        storageId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        altText: textOrUndefined(altText),
      })

      setFile(null)
      setAltText('')
      setMessage({ type: 'success', text: 'Image uploaded and selected.' })
      onUploaded(mediaId)
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="media-upload">
      <label>
        Upload image
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <label>
        Alt text
        <input
          value={altText}
          placeholder="Short image description"
          onChange={(event) => setAltText(event.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={() => void handleUpload()}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading' : 'Upload and select'}
      </button>
      {message ? (
        <p className={`form-message ${message.type}`}>{message.text}</p>
      ) : null}
    </div>
  )
}

export function textOrUndefined(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export function idOrUndefined<TableName extends keyof DataModel>(
  value: string,
) {
  return value ? (value as Id<TableName>) : undefined
}

export function numberFromInput(value: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return parsed
}

export function optionalNumberFromInput(value: string) {
  return value.trim() ? numberFromInput(value) : undefined
}

export function optionalDateFromInput(value: string) {
  return value ? new Date(`${value}T00:00:00`).getTime() : undefined
}

export function dateInput(value: number | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export function parseOptions(value: string) {
  return value
    .split(',')
    .map((part) => {
      const [name, ...rest] = part.split(':')
      return {
        name: name?.trim() ?? '',
        value: rest.join(':').trim(),
      }
    })
    .filter((option) => option.name && option.value)
}

export function parseBanners(value: string) {
  return value
    .split('\n')
    .map((line) => {
      const [title = '', body = '', href = ''] = line.split('|')
      return {
        title: title.trim(),
        body: textOrUndefined(body),
        href: textOrUndefined(href),
      }
    })
    .filter((banner) => banner.title)
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatOptionalMoney(value: number | undefined) {
  return value === undefined ? 'none' : formatMoney(value)
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}
