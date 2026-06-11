import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useMemo,
  useState,
} from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAction, useMutation, useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/checkout')({
  head: () => ({
    meta: [
      { title: 'Checkout | Muse Commerce' },
      {
        name: 'description',
        content: 'Enter shipping details and place order.',
      },
    ],
  }),
  component: Checkout,
})

const emptyAddress = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'Indonesia',
}

function Checkout() {
  const checkout = useQuery(api.checkout.getCheckout)
  const createOrder = useMutation(api.checkout.createOrder)
  const createInvoice = useAction(api.payments.createInvoiceForOrder)
  const navigate = useNavigate()
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [address, setAddress] = useState(emptyAddress)
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [couponCode, setCouponCode] = useState('')
  const [notes, setNotes] = useState('')
  const [saveAddress, setSaveAddress] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedAddress = useMemo(
    () =>
      checkout?.status === 'ready'
        ? checkout.addresses.find((item) => item._id === selectedAddressId)
        : undefined,
    [checkout, selectedAddressId],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (checkout?.status !== 'ready' || !checkout.cart?.canCheckout) return

    setIsSubmitting(true)
    setMessage(null)
    try {
      const result = await createOrder({
        email: contact.email,
        customerName: contact.name,
        phone: contact.phone || undefined,
        addressId: selectedAddressId
          ? (selectedAddressId as Id<'customerAddresses'>)
          : undefined,
        shippingAddress: selectedAddress
          ? {
              recipientName: selectedAddress.recipientName,
              phone: selectedAddress.phone,
              addressLine1: selectedAddress.addressLine1,
              addressLine2: selectedAddress.addressLine2,
              city: selectedAddress.city,
              province: selectedAddress.province,
              postalCode: selectedAddress.postalCode,
              country: selectedAddress.country,
            }
          : address,
        couponCode: couponCode || undefined,
        notes: notes || undefined,
        saveAddress,
      })
      await createInvoice({ orderId: result.orderId })
      await navigate({
        to: '/payment/$orderNumber',
        params: { orderNumber: result.orderNumber },
      })
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not place order.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkout === undefined) {
    return (
      <section className="content-page">
        <p className="eyebrow">Checkout</p>
        <h1>Loading checkout</h1>
      </section>
    )
  }

  if (checkout.status === 'unauthenticated') {
    return (
      <section className="content-page">
        <p className="eyebrow">Checkout</p>
        <h1>Login to checkout</h1>
        <p>Orders are attached to signed-in customer accounts.</p>
        <Link
          to="/login"
          search={{ redirect: '/checkout' }}
          className="primary-link"
        >
          Login
        </Link>
      </section>
    )
  }

  if (!checkout.cart || checkout.cart.items.length === 0) {
    return (
      <section className="content-page">
        <p className="eyebrow">Checkout</p>
        <h1>Your cart is empty</h1>
        <Link to="/products" className="primary-link">
          Browse products
        </Link>
      </section>
    )
  }

  return (
    <section className="checkout-page">
      <header className="catalog-heading">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Shipping and payment</h1>
          <p>Create a Xendit invoice and continue to secure payment.</p>
        </div>
        <Link to="/cart" className="secondary-link">
          Back to cart
        </Link>
      </header>

      {message ? <p className="form-message error">{message}</p> : null}

      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="admin-panel">
          <h2>Contact</h2>
          <label>
            Full name
            <input
              required
              value={contact.name}
              onChange={(event) =>
                setContact((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={contact.email}
              onChange={(event) =>
                setContact((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Phone
            <input
              value={contact.phone}
              onChange={(event) =>
                setContact((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </label>

          <h2>Shipping address</h2>
          {checkout.addresses.length ? (
            <label>
              Saved address
              <select
                value={selectedAddressId}
                onChange={(event) => setSelectedAddressId(event.target.value)}
              >
                <option value="">Use a new address</option>
                {checkout.addresses.map((saved) => (
                  <option key={saved._id} value={saved._id}>
                    {saved.recipientName}, {saved.city}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {!selectedAddressId ? (
            <AddressFields address={address} setAddress={setAddress} />
          ) : null}

          {!selectedAddressId ? (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
              />
              Save this address
            </label>
          ) : null}

          <label>
            Order notes
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="stack-list">
            {checkout.cart.items.map((item) => (
              <div key={item._id}>
                <strong>{item.productSnapshot.name}</strong>
                <span>
                  {item.quantity} x {formatMoney(item.unitPrice)}
                </span>
              </div>
            ))}
          </div>
          <label>
            Coupon
            <input
              value={couponCode}
              placeholder="WELCOME10"
              onChange={(event) => setCouponCode(event.target.value)}
            />
          </label>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(checkout.cart.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{formatMoney(0)}</dd>
            </div>
          </dl>
          {!checkout.cart.canCheckout ? (
            <p className="cart-warning">Resolve cart issues before checkout.</p>
          ) : null}
          <button
            type="submit"
            disabled={!checkout.cart.canCheckout || isSubmitting}
          >
            {isSubmitting ? 'Creating invoice' : 'Continue to payment'}
          </button>
        </aside>
      </form>
    </section>
  )
}

function AddressFields({
  address,
  setAddress,
}: Readonly<{
  address: typeof emptyAddress
  setAddress: Dispatch<SetStateAction<typeof emptyAddress>>
}>) {
  const fields: (keyof typeof emptyAddress)[] = [
    'recipientName',
    'phone',
    'addressLine1',
    'addressLine2',
    'city',
    'province',
    'postalCode',
    'country',
  ]
  return (
    <>
      {fields.map((field) => (
        <label key={field}>
          {fieldLabels[field]}
          <input
            required={field !== 'addressLine2'}
            value={address[field]}
            onChange={(event) =>
              setAddress((current) => ({
                ...current,
                [field]: event.target.value,
              }))
            }
          />
        </label>
      ))}
    </>
  )
}

const fieldLabels: Record<keyof typeof emptyAddress, string> = {
  recipientName: 'Recipient name',
  phone: 'Recipient phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  province: 'Province',
  postalCode: 'Postal code',
  country: 'Country',
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
