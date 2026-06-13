import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type FormEvent, useState } from 'react'
import { useMutation } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  type AdminMessage,
  type AdminWorkspace,
  Panel,
  TextArea,
  TextField,
  emptyEmailTemplateForm,
  errorMessage,
  idOrUndefined,
  textOrUndefined,
} from '../-shared'

function EmailsPanel({
  workspace,
  isSuperadmin,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  isSuperadmin: boolean
  setMessage: (message: AdminMessage) => void
}>) {
  const upsertEmailTemplate = useMutation(api.emails.upsertEmailTemplate)
  const [templateForm, setTemplateForm] = useState(emptyEmailTemplateForm)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isSuperadmin) {
      setMessage({
        type: 'error',
        text: 'Only superadmins can update email templates.',
      })
      return
    }

    setIsSaving(true)
    try {
      await upsertEmailTemplate({
        id: idOrUndefined<'emailTemplates'>(templateForm.id),
        key: templateForm.key as
          | 'invoice_created'
          | 'payment_confirmed'
          | 'payment_failed'
          | 'payment_expired'
          | 'order_processing'
          | 'order_in_delivery'
          | 'order_delivered'
          | 'order_cancelled'
          | 'admin_paid_order'
          | 'admin_low_stock',
        subject: templateForm.subject,
        previewText: textOrUndefined(templateForm.previewText),
        htmlBody: templateForm.htmlBody,
        textBody: textOrUndefined(templateForm.textBody),
        isActive: templateForm.isActive,
      })
      setTemplateForm(emptyEmailTemplateForm)
      setMessage({ type: 'success', text: 'Email template saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-layout">
      <div className="admin-main">
        <Panel title="Email templates">
          {!isSuperadmin ? (
            <p className="notice">
              Superadmin access is required to save templates.
            </p>
          ) : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspace.emailTemplates.map((template) => (
                  <tr key={template._id}>
                    <td>
                      <strong>{template.key}</strong>
                      <span>{template.previewText ?? 'No preview text'}</span>
                    </td>
                    <td>{template.subject}</td>
                    <td>
                      <StatusBadge
                        value={template.isActive ? 'active' : 'disabled'}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setTemplateForm({
                            id: template._id,
                            key: template.key,
                            subject: template.subject,
                            previewText: template.previewText ?? '',
                            htmlBody: template.htmlBody,
                            textBody: template.textBody ?? '',
                            isActive: template.isActive,
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent email attempts">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {workspace.recentEmailEvents.map((event) => (
                  <tr key={event._id}>
                    <td>
                      <strong>{event.templateKey}</strong>
                      <span>{event.errorMessage ?? event.provider ?? ''}</span>
                    </td>
                    <td>{event.recipientEmail}</td>
                    <td>
                      <StatusBadge value={event.status} />
                    </td>
                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <aside className="admin-side">
        <Panel title={templateForm.id ? 'Edit template' : 'New template'}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Template
              <select
                value={templateForm.key}
                onChange={(event) =>
                  setTemplateForm((current) => ({
                    ...current,
                    key: event.target.value,
                  }))
                }
              >
                {[
                  'invoice_created',
                  'payment_confirmed',
                  'payment_failed',
                  'payment_expired',
                  'order_processing',
                  'order_in_delivery',
                  'order_delivered',
                  'order_cancelled',
                  'admin_paid_order',
                  'admin_low_stock',
                ].map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Subject"
              value={templateForm.subject}
              onChange={(subject) =>
                setTemplateForm((current) => ({ ...current, subject }))
              }
            />
            <TextField
              label="Preview text"
              value={templateForm.previewText}
              onChange={(previewText) =>
                setTemplateForm((current) => ({ ...current, previewText }))
              }
            />
            <TextArea
              label="HTML body"
              value={templateForm.htmlBody}
              onChange={(htmlBody) =>
                setTemplateForm((current) => ({ ...current, htmlBody }))
              }
            />
            <TextArea
              label="Text body"
              value={templateForm.textBody}
              onChange={(textBody) =>
                setTemplateForm((current) => ({ ...current, textBody }))
              }
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={templateForm.isActive}
                onChange={(event) =>
                  setTemplateForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="form-actions">
              <button type="submit" disabled={!isSuperadmin || isSaving}>
                {isSaving ? 'Saving template' : 'Save template'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setTemplateForm(emptyEmailTemplateForm)}
              >
                Reset
              </button>
            </div>
          </form>
        </Panel>
      </aside>
    </div>
  )
}

export const Route = createFileRoute('/admin/emails')({
  component: AdminEmails,
})

function AdminEmails() {
  return (
    <AdminModulePage activeModule="emails">
      {({ workspace, isSuperadmin, setMessage }) => (
        <EmailsPanel
          workspace={workspace}
          isSuperadmin={isSuperadmin}
          setMessage={setMessage}
        />
      )}
    </AdminModulePage>
  )
}
