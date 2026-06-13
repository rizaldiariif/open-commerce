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
  parseBanners,
  textOrUndefined,
} from '../-shared'

function ContentPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  setMessage: (message: AdminMessage) => void
}>) {
  const updateHomepageContent = useMutation(api.admin.updateHomepageContent)
  const [contentForm, setContentForm] = useState({
    title: '',
    subtitle: '',
    heroImageId: '',
    heroCtaLabel: '',
    heroCtaHref: '',
    featuredCategorySlugs: '',
    homepageBanners: '',
    announcement: '',
    aboutText: '',
    footerText: '',
    status: 'draft',
  })

  useEffect(() => {
    setContentForm({
      title: workspace.homepageContent.title,
      subtitle: workspace.homepageContent.subtitle ?? '',
      heroImageId: workspace.homepageContent.heroImageId ?? '',
      heroCtaLabel: workspace.homepageContent.heroCtaLabel ?? '',
      heroCtaHref: workspace.homepageContent.heroCtaHref ?? '',
      featuredCategorySlugs:
        workspace.homepageContent.featuredCategorySlugs.join(', '),
      homepageBanners: (workspace.homepageContent.homepageBanners ?? [])
        .map((banner) =>
          [banner.title, banner.body ?? '', banner.href ?? ''].join('|'),
        )
        .join('\n'),
      announcement: workspace.homepageContent.announcement ?? '',
      aboutText: workspace.homepageContent.aboutText ?? '',
      footerText: workspace.homepageContent.footerText ?? '',
      status: workspace.homepageContent.status ?? 'draft',
    })
  }, [workspace.homepageContent])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await updateHomepageContent({
        title: contentForm.title,
        subtitle: textOrUndefined(contentForm.subtitle),
        heroImageId: idOrUndefined<'mediaAssets'>(contentForm.heroImageId),
        heroCtaLabel: textOrUndefined(contentForm.heroCtaLabel),
        heroCtaHref: textOrUndefined(contentForm.heroCtaHref),
        featuredCategorySlugs: contentForm.featuredCategorySlugs
          .split(',')
          .map((slug) => slug.trim())
          .filter(Boolean),
        homepageBanners: parseBanners(contentForm.homepageBanners),
        announcement: textOrUndefined(contentForm.announcement),
        aboutText: textOrUndefined(contentForm.aboutText),
        footerText: textOrUndefined(contentForm.footerText),
        status: contentForm.status as 'draft' | 'published' | 'archived',
      })
      setMessage({ type: 'success', text: 'Homepage content saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <Panel title="Homepage content">
      <form className="admin-form two-column-form" onSubmit={handleSubmit}>
        <TextField
          label="Hero title"
          value={contentForm.title}
          onChange={(title) =>
            setContentForm((current) => ({ ...current, title }))
          }
        />
        <TextField
          label="Hero subtitle"
          value={contentForm.subtitle}
          onChange={(subtitle) =>
            setContentForm((current) => ({ ...current, subtitle }))
          }
        />
        <MediaSelect
          label="Hero image"
          value={contentForm.heroImageId}
          mediaAssets={workspace.mediaAssets}
          onChange={(heroImageId) =>
            setContentForm((current) => ({ ...current, heroImageId }))
          }
        />
        <TextField
          label="Hero CTA label"
          value={contentForm.heroCtaLabel}
          onChange={(heroCtaLabel) =>
            setContentForm((current) => ({ ...current, heroCtaLabel }))
          }
        />
        <TextField
          label="Hero CTA href"
          value={contentForm.heroCtaHref}
          onChange={(heroCtaHref) =>
            setContentForm((current) => ({ ...current, heroCtaHref }))
          }
        />
        <TextField
          label="Featured category slugs"
          value={contentForm.featuredCategorySlugs}
          placeholder="new-arrivals, best-sellers"
          onChange={(featuredCategorySlugs) =>
            setContentForm((current) => ({
              ...current,
              featuredCategorySlugs,
            }))
          }
        />
        <TextArea
          label="Homepage banners"
          value={contentForm.homepageBanners}
          placeholder="Title|Body|/products"
          onChange={(homepageBanners) =>
            setContentForm((current) => ({ ...current, homepageBanners }))
          }
        />
        <TextArea
          label="Announcement"
          value={contentForm.announcement}
          onChange={(announcement) =>
            setContentForm((current) => ({ ...current, announcement }))
          }
        />
        <TextArea
          label="About text"
          value={contentForm.aboutText}
          onChange={(aboutText) =>
            setContentForm((current) => ({ ...current, aboutText }))
          }
        />
        <TextArea
          label="Footer text"
          value={contentForm.footerText}
          onChange={(footerText) =>
            setContentForm((current) => ({ ...current, footerText }))
          }
        />
        <label>
          Status
          <select
            value={contentForm.status}
            onChange={(event) =>
              setContentForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <button type="submit">Save content</button>
      </form>
    </Panel>
  )
}

export const Route = createFileRoute('/admin/content')({
  component: AdminContent,
})

function AdminContent() {
  return (
    <AdminModulePage activeModule="content">
      {({ workspace, setMessage }) => <ContentPanel workspace={workspace} setMessage={setMessage} />}
    </AdminModulePage>
  )
}
