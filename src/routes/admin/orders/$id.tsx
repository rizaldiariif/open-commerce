import { type FormEvent, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/admin/orders/$id')({
  component: AdminOrderDetail,
})

type FulfillmentStatus =
  | 'unfulfilled'
  | 'processing'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'

const emptyShipment = {
  fulfillmentStatus: 'processing' as FulfillmentStatus,
  carrier: '',
  service: '',
  trackingNumber: '',
  trackingUrl: '',
  shippedAt: '',
  deliveredAt: '',
}

function AdminOrderDetail() {
  const { id } = Route.useParams()
  const orderId = id as Id<'orders'>
  const detail = useQuery(api.orders.getAdminOrder, { orderId })
  const updateShipment = useMutation(api.orders.updateShipment)
  const recordManualRefund = useMutation(api.orders.recordManualRefund)
  const [shipment, setShipment] = useState(emptyShipment)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!detail) return
    setShipment({
      fulfillmentStatus: nextFulfillmentStatus(detail.order.fulfillmentStatus),
      carrier: detail.shipment?.carrier ?? '',
      service: detail.shipment?.service ?? '',
      trackingNumber: detail.shipment?.trackingNumber ?? '',
      trackingUrl: detail.shipment?.trackingUrl ?? '',
      shippedAt: dateInput(detail.shipment?.shippedAt),
      deliveredAt: dateInput(detail.shipment?.deliveredAt),
    })
    setRefundAmount(String(detail.order.grandTotal))
  }, [detail])

  if (detail === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Loading order</h1>
      </section>
    )
  }

  if (!detail) {
    return (
      <section className="content-page">
        <p className="eyebrow">Operations</p>
        <h1>Order not found</h1>
        <Link to="/admin/orders" className="primary-link">
          Back to orders
        </Link>
      </section>
    )
  }

  async function submitShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    await updateShipment({
      orderId,
      fulfillmentStatus: shipment.fulfillmentStatus,
      carrier: shipment.carrier || undefined,
      service: shipment.service || undefined,
      trackingNumber: shipment.trackingNumber || undefined,
      trackingUrl: shipment.trackingUrl || undefined,
      shippedAt: timestampInput(shipment.shippedAt),
      deliveredAt: timestampInput(shipment.deliveredAt),
    })
    setMessage('Shipment updated.')
  }

  async function submitRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    await recordManualRefund({
      orderId,
      amount: Number(refundAmount),
      reason: refundReason || undefined,
    })
    setMessage('Manual refund recorded without calling Xendit.')
  }

  return (
    <section className="checkout-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>{detail.order.orderNumber}</h1>
          <p>
            {detail.order.customerName} -{' '}
            {formatMoney(detail.order.grandTotal, detail.order.currency)}
          </p>
        </div>
        <Link to="/admin/orders" className="secondary-link">
          Back to orders
        </Link>
      </header>

      {message ? <p className="form-message success">{message}</p> : null}

      <div className="checkout-layout">
        <div className="admin-main">
          <section className="admin-panel">
            <h2>Items</h2>
            <div className="stack-list">
              {detail.items.map((item) => (
                <div key={item._id}>
                  <strong>{item.productName}</strong>
                  <span>
                    {item.sku} - {item.variantName} - {item.quantity} x{' '}
                    {formatMoney(item.unitPrice, detail.order.currency)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <h2>Shipment</h2>
            <form
              className="admin-form two-column-form"
              onSubmit={submitShipment}
            >
              <label>
                Fulfillment status
                <select
                  value={shipment.fulfillmentStatus}
                  onChange={(event) =>
                    setShipment((current) => ({
                      ...current,
                      fulfillmentStatus: event.target
                        .value as FulfillmentStatus,
                    }))
                  }
                >
                  <option value="processing">Processing</option>
                  <option value="in_delivery">In delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <Field
                label="Courier"
                value={shipment.carrier}
                onChange={(carrier) =>
                  setShipment((current) => ({ ...current, carrier }))
                }
              />
              <Field
                label="Service"
                value={shipment.service}
                onChange={(service) =>
                  setShipment((current) => ({ ...current, service }))
                }
              />
              <Field
                label="Airwaybill number"
                value={shipment.trackingNumber}
                onChange={(trackingNumber) =>
                  setShipment((current) => ({ ...current, trackingNumber }))
                }
              />
              <Field
                label="Tracking URL"
                value={shipment.trackingUrl}
                onChange={(trackingUrl) =>
                  setShipment((current) => ({ ...current, trackingUrl }))
                }
              />
              <Field
                label="Shipped date"
                type="datetime-local"
                value={shipment.shippedAt}
                onChange={(shippedAt) =>
                  setShipment((current) => ({ ...current, shippedAt }))
                }
              />
              <Field
                label="Delivered date"
                type="datetime-local"
                value={shipment.deliveredAt}
                onChange={(deliveredAt) =>
                  setShipment((current) => ({ ...current, deliveredAt }))
                }
              />
              <button type="submit">Save shipment</button>
            </form>
          </section>

          <section className="admin-panel">
            <h2>Manual refund</h2>
            <form
              className="admin-form two-column-form"
              onSubmit={submitRefund}
            >
              <Field
                label={`Amount (${detail.order.currency})`}
                type="number"
                value={refundAmount}
                onChange={setRefundAmount}
              />
              <Field
                label="Reason"
                value={refundReason}
                onChange={setRefundReason}
              />
              <button type="submit">Record refund</button>
            </form>
            <p className="notice">
              This records refund status in Muse Commerce only. It does not call
              Xendit refund APIs.
            </p>
          </section>
        </div>

        <aside className="cart-summary">
          <h2>Status</h2>
          <dl>
            <div>
              <dt>Order</dt>
              <dd>{label(detail.order.orderStatus)}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{label(detail.order.paymentStatus)}</dd>
            </div>
            <div>
              <dt>Fulfillment</dt>
              <dd>{label(detail.order.fulfillmentStatus)}</dd>
            </div>
            <div>
              <dt>Courier</dt>
              <dd>{detail.shipment?.carrier ?? 'Not set'}</dd>
            </div>
            <div>
              <dt>Airwaybill</dt>
              <dd>{detail.shipment?.trackingNumber ?? 'Not set'}</dd>
            </div>
          </dl>
          <h2>Refunds</h2>
          <div className="stack-list">
            {detail.refunds.map((refund) => (
              <div key={refund._id}>
                <strong>{formatMoney(refund.amount, refund.currency)}</strong>
                <span>{refund.reason ?? 'No reason'} </span>
              </div>
            ))}
            {detail.refunds.length === 0 ? <p>No refunds recorded.</p> : null}
          </div>
        </aside>
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}>) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function nextFulfillmentStatus(status: string): FulfillmentStatus {
  if (status === 'unfulfilled') return 'processing'
  if (status === 'processing') return 'in_delivery'
  if (status === 'in_delivery') return 'delivered'
  if (status === 'delivered') return 'delivered'
  return 'cancelled'
}

function dateInput(value: number | undefined) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

function timestampInput(value: string) {
  if (!value) return undefined
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? undefined : timestamp
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
