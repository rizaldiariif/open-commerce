import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type FormEvent, useEffect, useState } from 'react'
import { useMutation } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import {
  type AdminMessage,
  type AdminWorkspace,
  MediaSelect,
  Panel,
  TextArea,
  TextField,
  errorMessage,
  idOrUndefined,
  numberFromInput,
  textOrUndefined,
} from '../-shared'

function SettingsPanel({
  workspace,
  isSuperadmin,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  isSuperadmin: boolean
  setMessage: (message: AdminMessage) => void
}>) {
  const updateSiteSettings = useMutation(api.admin.updateSiteSettings)
  const [settingsForm, setSettingsForm] = useState({
    storeName: '',
    logoImageId: '',
    faviconImageId: '',
    supportEmail: '',
    seoTitle: '',
    seoDescription: '',
    pendingPaymentExpiryMinutes: '30',
  })

  useEffect(() => {
    setSettingsForm({
      storeName: workspace.siteSettings.storeName,
      logoImageId: workspace.siteSettings.logoImageId ?? '',
      faviconImageId: workspace.siteSettings.faviconImageId ?? '',
      supportEmail: workspace.siteSettings.supportEmail,
      seoTitle: workspace.siteSettings.seoTitle ?? '',
      seoDescription: workspace.siteSettings.seoDescription ?? '',
      pendingPaymentExpiryMinutes: String(
        workspace.siteSettings.pendingPaymentExpiryMinutes ?? 30,
      ),
    })
  }, [workspace.siteSettings])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isSuperadmin) {
      setMessage({
        type: 'error',
        text: 'Only superadmins can update store settings.',
      })
      return
    }

    try {
      await updateSiteSettings({
        storeName: settingsForm.storeName,
        logoImageId: idOrUndefined<'mediaAssets'>(settingsForm.logoImageId),
        faviconImageId: idOrUndefined<'mediaAssets'>(
          settingsForm.faviconImageId,
        ),
        supportEmail: settingsForm.supportEmail,
        seoTitle: textOrUndefined(settingsForm.seoTitle),
        seoDescription: textOrUndefined(settingsForm.seoDescription),
        pendingPaymentExpiryMinutes: numberFromInput(
          settingsForm.pendingPaymentExpiryMinutes,
        ),
      })
      setMessage({ type: 'success', text: 'Settings saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <Panel title="Store settings">
      {!isSuperadmin ? (
        <p className="notice">
          Superadmin access is required to save settings.
        </p>
      ) : null}
      <form className="admin-form two-column-form" onSubmit={handleSubmit}>
        <TextField
          label="Store name"
          value={settingsForm.storeName}
          onChange={(storeName) =>
            setSettingsForm((current) => ({ ...current, storeName }))
          }
        />
        <TextField
          label="Support email"
          value={settingsForm.supportEmail}
          onChange={(supportEmail) =>
            setSettingsForm((current) => ({ ...current, supportEmail }))
          }
        />
        <MediaSelect
          label="Logo"
          value={settingsForm.logoImageId}
          mediaAssets={workspace.mediaAssets}
          onChange={(logoImageId) =>
            setSettingsForm((current) => ({ ...current, logoImageId }))
          }
        />
        <MediaSelect
          label="Favicon"
          value={settingsForm.faviconImageId}
          mediaAssets={workspace.mediaAssets}
          onChange={(faviconImageId) =>
            setSettingsForm((current) => ({ ...current, faviconImageId }))
          }
        />
        <TextField
          label="SEO title"
          value={settingsForm.seoTitle}
          onChange={(seoTitle) =>
            setSettingsForm((current) => ({ ...current, seoTitle }))
          }
        />
        <TextArea
          label="SEO description"
          value={settingsForm.seoDescription}
          onChange={(seoDescription) =>
            setSettingsForm((current) => ({ ...current, seoDescription }))
          }
        />
        <TextField
          label="Pending payment expiry minutes"
          value={settingsForm.pendingPaymentExpiryMinutes}
          inputMode="numeric"
          onChange={(pendingPaymentExpiryMinutes) =>
            setSettingsForm((current) => ({
              ...current,
              pendingPaymentExpiryMinutes,
            }))
          }
        />
        <button type="submit" disabled={!isSuperadmin}>
          Save settings
        </button>
      </form>
    </Panel>
  )
}

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettings,
})

function AdminSettings() {
  return (
    <AdminModulePage activeModule="settings">
      {({ workspace, isSuperadmin, setMessage }) => <SettingsPanel workspace={workspace} isSuperadmin={isSuperadmin} setMessage={setMessage} />}
    </AdminModulePage>
  )
}
