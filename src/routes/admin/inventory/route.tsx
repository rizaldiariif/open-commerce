import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type FormEvent, useState } from 'react'
import { useMutation } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import {
  type AdminMessage,
  type AdminWorkspace,
  Panel,
  TextArea,
  TextField,
  emptyInventoryForm,
  errorMessage,
  numberFromInput,
  textOrUndefined,
} from '../-shared'

function InventoryPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  setMessage: (message: AdminMessage) => void
}>) {
  const adjustInventory = useMutation(api.admin.adjustInventory)
  const [inventoryForm, setInventoryForm] = useState(emptyInventoryForm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await adjustInventory({
        variantId: inventoryForm.variantId as Id<'productVariants'>,
        quantityDelta: numberFromInput(inventoryForm.quantityDelta),
        reason: textOrUndefined(inventoryForm.reason),
      })
      setInventoryForm(emptyInventoryForm)
      setMessage({ type: 'success', text: 'Inventory adjusted.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Stock by variant">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Product</th>
                <th>On hand</th>
                <th>Reserved</th>
                <th>Low threshold</th>
              </tr>
            </thead>
            <tbody>
              {workspace.variants.map((variant) => {
                const product = workspace.products.find(
                  (candidate) => candidate._id === variant.productId,
                )

                return (
                  <tr key={variant._id}>
                    <td>
                      <strong>{variant.sku}</strong>
                      <span>{variant.name}</span>
                    </td>
                    <td>{product?.name ?? 'Missing product'}</td>
                    <td>{variant.stockOnHand}</td>
                    <td>{variant.reservedStock}</td>
                    <td>{variant.lowStockThreshold ?? 'None'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title="Adjust inventory">
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Variant
              <select
                required
                value={inventoryForm.variantId}
                onChange={(event) =>
                  setInventoryForm((current) => ({
                    ...current,
                    variantId: event.target.value,
                  }))
                }
              >
                <option value="">Select variant</option>
                {workspace.variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>
                    {variant.sku} - {variant.name}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Quantity delta"
              value={inventoryForm.quantityDelta}
              placeholder="10 or -2"
              inputMode="numeric"
              onChange={(quantityDelta) =>
                setInventoryForm((current) => ({
                  ...current,
                  quantityDelta,
                }))
              }
            />
            <TextArea
              label="Reason"
              value={inventoryForm.reason}
              onChange={(reason) =>
                setInventoryForm((current) => ({ ...current, reason }))
              }
            />
            <button type="submit">Record movement</button>
          </form>
        </Panel>

        <Panel title="Recent movements">
          <div className="stack-list">
            {workspace.recentInventoryMovements.map((movement) => {
              const variant = workspace.variants.find(
                (candidate) => candidate._id === movement.variantId,
              )

              return (
                <div key={movement._id}>
                  <strong>
                    {variant?.sku ?? 'Variant'}{' '}
                    {movement.quantityDelta > 0 ? '+' : ''}
                    {movement.quantityDelta}
                  </strong>
                  <span>
                    Stock after {movement.stockAfter}
                    {movement.reason ? ` - ${movement.reason}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>
      </aside>
    </div>
  )
}

export const Route = createFileRoute('/admin/inventory')({
  component: AdminInventory,
})

function AdminInventory() {
  return (
    <AdminModulePage activeModule="inventory">
      {({ workspace, setMessage }) => <InventoryPanel workspace={workspace} setMessage={setMessage} />}
    </AdminModulePage>
  )
}
