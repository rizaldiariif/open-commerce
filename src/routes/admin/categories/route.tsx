import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type FormEvent, useState } from 'react'
import { useMutation } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  type AdminMessage,
  type AdminWorkspace,
  ConfirmButton,
  MediaSelect,
  Panel,
  TextArea,
  TextField,
  emptyCategoryForm,
  errorMessage,
  idOrUndefined,
  numberFromInput,
  textOrUndefined,
} from '../-shared'

function CategoriesPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  setMessage: (message: AdminMessage) => void
}>) {
  const upsertCategory = useMutation(api.admin.upsertCategory)
  const deleteCategory = useMutation(api.admin.deleteCategory)
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await upsertCategory({
        id: idOrUndefined<'categories'>(categoryForm.id),
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: textOrUndefined(categoryForm.description),
        parentCategoryId: idOrUndefined<'categories'>(
          categoryForm.parentCategoryId,
        ),
        imageId: idOrUndefined<'mediaAssets'>(categoryForm.imageId),
        sortOrder: numberFromInput(categoryForm.sortOrder),
        isActive: categoryForm.isActive,
      })
      setCategoryForm(emptyCategoryForm)
      setMessage({ type: 'success', text: 'Category saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Categories">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Sort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspace.categories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <strong>{category.name}</strong>
                    <span>{category.description ?? 'No description'}</span>
                  </td>
                  <td>{category.slug}</td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <StatusBadge
                      value={category.isActive ? 'active' : 'disabled'}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryForm({
                          id: category._id,
                          name: category.name,
                          slug: category.slug,
                          description: category.description ?? '',
                          parentCategoryId: category.parentCategoryId ?? '',
                          imageId: category.imageId ?? '',
                          sortOrder: String(category.sortOrder),
                          isActive: category.isActive,
                        })
                      }
                    >
                      Edit
                    </button>
                    <ConfirmButton
                      confirmText={`Delete or deactivate ${category.name}? Products that use it will keep their category but the category may be hidden.`}
                      onConfirm={async () => {
                        try {
                          await deleteCategory({ id: category._id })
                          setMessage({
                            type: 'success',
                            text: 'Category removed or deactivated.',
                          })
                        } catch (error) {
                          setMessage({
                            type: 'error',
                            text: errorMessage(error),
                          })
                        }
                      }}
                    >
                      Delete
                    </ConfirmButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title={categoryForm.id ? 'Edit category' : 'New category'}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <TextField
              label="Name"
              value={categoryForm.name}
              onChange={(name) =>
                setCategoryForm((current) => ({ ...current, name }))
              }
            />
            <TextField
              label="Slug"
              value={categoryForm.slug}
              onChange={(slug) =>
                setCategoryForm((current) => ({ ...current, slug }))
              }
            />
            <TextArea
              label="Description"
              value={categoryForm.description}
              onChange={(description) =>
                setCategoryForm((current) => ({ ...current, description }))
              }
            />
            <label>
              Parent
              <select
                value={categoryForm.parentCategoryId}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    parentCategoryId: event.target.value,
                  }))
                }
              >
                <option value="">None</option>
                {workspace.categories
                  .filter((category) => category._id !== categoryForm.id)
                  .map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <MediaSelect
              label="Image"
              value={categoryForm.imageId}
              mediaAssets={workspace.mediaAssets}
              onChange={(imageId) =>
                setCategoryForm((current) => ({ ...current, imageId }))
              }
            />
            <TextField
              label="Sort order"
              value={categoryForm.sortOrder}
              inputMode="numeric"
              onChange={(sortOrder) =>
                setCategoryForm((current) => ({ ...current, sortOrder }))
              }
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="form-actions">
              <button type="submit">Save category</button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setCategoryForm(emptyCategoryForm)}
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

export const Route = createFileRoute('/admin/categories')({
  component: AdminCategories,
})

function AdminCategories() {
  return (
    <AdminModulePage activeModule="categories">
      {({ workspace, setMessage }) => (
        <CategoriesPanel workspace={workspace} setMessage={setMessage} />
      )}
    </AdminModulePage>
  )
}
