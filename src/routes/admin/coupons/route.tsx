import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type FormEvent, useState } from 'react'
import { useMutation } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import {
  type AdminMessage,
  type AdminWorkspace,
  Panel,
  TextField,
  dateInput,
  emptyCouponForm,
  errorMessage,
  formatMoney,
  formatOptionalMoney,
  idOrUndefined,
  numberFromInput,
  optionalDateFromInput,
  optionalNumberFromInput,
  textOrUndefined,
} from '../-shared'

function CouponsPanel({
  workspace,
  setMessage,
}: Readonly<{
  workspace: AdminWorkspace
  setMessage: (message: AdminMessage) => void
}>) {
  const upsertCoupon = useMutation(api.admin.upsertCoupon)
  const setCouponActive = useMutation(api.admin.setCouponActive)
  const [couponForm, setCouponForm] = useState(emptyCouponForm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await upsertCoupon({
        id: idOrUndefined<'coupons'>(couponForm.id),
        code: couponForm.code,
        type: couponForm.type as 'percentage' | 'fixed_amount',
        value: numberFromInput(couponForm.value),
        currency: textOrUndefined(couponForm.currency),
        minSubtotal: optionalNumberFromInput(couponForm.minSubtotal),
        maxDiscount: optionalNumberFromInput(couponForm.maxDiscount),
        usageLimit: optionalNumberFromInput(couponForm.usageLimit),
        usageLimitPerCustomer: optionalNumberFromInput(
          couponForm.usageLimitPerCustomer,
        ),
        startsAt: optionalDateFromInput(couponForm.startsAt),
        endsAt: optionalDateFromInput(couponForm.endsAt),
        isActive: couponForm.isActive,
      })
      setCouponForm(emptyCouponForm)
      setMessage({ type: 'success', text: 'Coupon saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error) })
    }
  }

  return (
    <div className="admin-layout">
      <Panel title="Coupons">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspace.coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td>
                    <strong>{coupon.code}</strong>
                    <span>
                      {coupon.startsAt
                        ? new Date(coupon.startsAt).toLocaleDateString()
                        : 'Now'}{' '}
                      to{' '}
                      {coupon.endsAt
                        ? new Date(coupon.endsAt).toLocaleDateString()
                        : 'No end'}
                    </span>
                  </td>
                  <td>
                    {coupon.type === 'percentage'
                      ? `${coupon.value}%`
                      : formatMoney(coupon.value)}
                  </td>
                  <td>
                    Min {formatOptionalMoney(coupon.minSubtotal)}, cap{' '}
                    {formatOptionalMoney(coupon.maxDiscount)}
                  </td>
                  <td>
                    {coupon.redeemedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                  </td>
                  <td>{coupon.isActive ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        setCouponForm({
                          id: coupon._id,
                          code: coupon.code,
                          type: coupon.type,
                          value: String(coupon.value),
                          currency: coupon.currency ?? 'IDR',
                          minSubtotal:
                            coupon.minSubtotal === undefined
                              ? ''
                              : String(coupon.minSubtotal),
                          maxDiscount:
                            coupon.maxDiscount === undefined
                              ? ''
                              : String(coupon.maxDiscount),
                          usageLimit:
                            coupon.usageLimit === undefined
                              ? ''
                              : String(coupon.usageLimit),
                          usageLimitPerCustomer:
                            coupon.usageLimitPerCustomer === undefined
                              ? ''
                              : String(coupon.usageLimitPerCustomer),
                          startsAt: dateInput(coupon.startsAt),
                          endsAt: dateInput(coupon.endsAt),
                          isActive: coupon.isActive,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await setCouponActive({
                            id: coupon._id,
                            isActive: !coupon.isActive,
                          })
                          setMessage({
                            type: 'success',
                            text: coupon.isActive
                              ? 'Coupon disabled.'
                              : 'Coupon enabled.',
                          })
                        } catch (error) {
                          setMessage({
                            type: 'error',
                            text: errorMessage(error),
                          })
                        }
                      }}
                    >
                      {coupon.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <aside className="admin-side">
        <Panel title={couponForm.id ? 'Edit coupon' : 'New coupon'}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <TextField
              label="Code"
              value={couponForm.code}
              onChange={(code) =>
                setCouponForm((current) => ({ ...current, code }))
              }
            />
            <label>
              Type
              <select
                value={couponForm.type}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
              </select>
            </label>
            <TextField
              label="Value"
              value={couponForm.value}
              inputMode="numeric"
              onChange={(value) =>
                setCouponForm((current) => ({ ...current, value }))
              }
            />
            <TextField
              label="Currency"
              value={couponForm.currency}
              onChange={(currency) =>
                setCouponForm((current) => ({ ...current, currency }))
              }
            />
            <TextField
              label="Minimum subtotal"
              value={couponForm.minSubtotal}
              inputMode="numeric"
              onChange={(minSubtotal) =>
                setCouponForm((current) => ({ ...current, minSubtotal }))
              }
            />
            <TextField
              label="Percentage cap"
              value={couponForm.maxDiscount}
              inputMode="numeric"
              onChange={(maxDiscount) =>
                setCouponForm((current) => ({ ...current, maxDiscount }))
              }
            />
            <TextField
              label="Usage limit"
              value={couponForm.usageLimit}
              inputMode="numeric"
              onChange={(usageLimit) =>
                setCouponForm((current) => ({ ...current, usageLimit }))
              }
            />
            <TextField
              label="Per-customer limit"
              value={couponForm.usageLimitPerCustomer}
              inputMode="numeric"
              onChange={(usageLimitPerCustomer) =>
                setCouponForm((current) => ({
                  ...current,
                  usageLimitPerCustomer,
                }))
              }
            />
            <label>
              Starts at
              <input
                type="date"
                value={couponForm.startsAt}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Ends at
              <input
                type="date"
                value={couponForm.endsAt}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    endsAt: event.target.value,
                  }))
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={couponForm.isActive}
                onChange={(event) =>
                  setCouponForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="form-actions">
              <button type="submit">Save coupon</button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setCouponForm(emptyCouponForm)}
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

export const Route = createFileRoute('/admin/coupons')({
  component: AdminCoupons,
})

function AdminCoupons() {
  return (
    <AdminModulePage activeModule="coupons">
      {({ workspace, setMessage }) => <CouponsPanel workspace={workspace} setMessage={setMessage} />}
    </AdminModulePage>
  )
}
