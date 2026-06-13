import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type FormEvent, useState } from 'react'
import { useMutation } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import {
  type AdminMessage,
  type AdminWorkspace,
  ConfirmButton,
  Panel,
  TextField,
  errorMessage,
  textOrUndefined,
} from '../-shared'

function MediaPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  setMessage: (message: AdminMessage) => void
}>) {
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl)
  const saveUploadedMedia = useMutation(api.admin.saveUploadedMedia)
  const softDeleteMedia = useMutation(api.admin.softDeleteMedia)
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setMessage({ type: 'error', text: 'Choose a file to upload.' })
      return
    }

    setIsUploading(true)

    try {
      const uploadUrl = await generateUploadUrl()
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadResult.ok) {
        throw new Error('Upload failed.')
      }

      const { storageId } = (await uploadResult.json()) as {
        storageId: string
      }

      await saveUploadedMedia({
        storageId,
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        altText: textOrUndefined(altText),
      })
      setFile(null)
      setAltText('')
      event.currentTarget.reset()
      setMessage({ type: 'success', text: 'Media uploaded.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Media library">
        <div className="media-grid">
          {workspace.mediaAssets.map((asset) => (
            <figure key={asset._id} className="media-card">
              {asset.url ? (
                <img src={asset.url} alt={asset.altText ?? asset.filename} />
              ) : (
                <div className="media-placeholder">No preview</div>
              )}
              <figcaption>
                <strong>{asset.filename}</strong>
                <span>{asset.altText ?? asset.contentType}</span>
                <ConfirmButton
                  confirmText={`Hide ${asset.filename} from media pickers? Existing product images may keep using it until changed.`}
                  onConfirm={async () => {
                    try {
                      await softDeleteMedia({ id: asset._id })
                      setMessage({
                        type: 'success',
                        text: 'Media hidden from pickers.',
                      })
                    } catch (error) {
                      setMessage({ type: 'error', text: errorMessage(error) })
                    }
                  }}
                >
                  Soft delete
                </ConfirmButton>
              </figcaption>
            </figure>
          ))}
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title="Upload media">
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              File
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <TextField label="Alt text" value={altText} onChange={setAltText} />
            <button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading' : 'Upload'}
            </button>
          </form>
        </Panel>
      </aside>
    </div>
  )
}

export const Route = createFileRoute('/admin/media')({
  component: AdminMedia,
})

function AdminMedia() {
  return (
    <AdminModulePage activeModule="media">
      {({ workspace, setMessage }) => (
        <MediaPanel workspace={workspace} setMessage={setMessage} />
      )}
    </AdminModulePage>
  )
}
