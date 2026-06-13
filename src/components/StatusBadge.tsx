const friendlyLabels: Record<string, string> = {
  active: 'Active',
  archived: 'Archived',
  cancelled: 'Cancelled',
  delivered: 'Delivered',
  disabled: 'Disabled',
  draft: 'Draft',
  expired: 'Expired',
  failed: 'Failed',
  in_delivery: 'In delivery',
  in_stock: 'In stock',
  out_of_stock: 'Out of stock',
  paid: 'Paid',
  partially_refunded: 'Partially refunded',
  payment_failed: 'Payment failed',
  pending: 'Pending',
  pending_payment: 'Pending payment',
  processing: 'Processing',
  published: 'Published',
  queued: 'Queued',
  refunded: 'Refunded',
  sent: 'Sent',
  unfulfilled: 'Unfulfilled',
}

export function StatusBadge({
  value,
}: Readonly<{
  value: string
}>) {
  return (
    <span className={`status-badge ${toneForStatus(value)}`}>
      {statusLabel(value)}
    </span>
  )
}

export function statusLabel(value: string) {
  return friendlyLabels[value] ?? value.replaceAll('_', ' ')
}

function toneForStatus(value: string) {
  if (
    [
      'active',
      'in_stock',
      'paid',
      'delivered',
      'published',
      'sent',
      'processing',
    ].includes(value)
  ) {
    return 'positive'
  }
  if (
    [
      'failed',
      'expired',
      'cancelled',
      'out_of_stock',
      'payment_failed',
      'refunded',
      'partially_refunded',
      'archived',
    ].includes(value)
  ) {
    return 'danger'
  }
  if (
    ['pending', 'pending_payment', 'draft', 'unfulfilled', 'queued'].includes(
      value,
    )
  ) {
    return 'warning'
  }
  return 'neutral'
}
