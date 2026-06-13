export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  name,
  disabled = false,
}: Readonly<{
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  name?: string
  disabled?: boolean
}>) {
  const safeMax = max ?? Number.MAX_SAFE_INTEGER
  const nextValue = Math.min(safeMax, Math.max(min, value))

  function setQuantity(next: number) {
    onChange(Math.min(safeMax, Math.max(min, next)))
  }

  return (
    <span className="quantity-stepper">
      <button
        type="button"
        disabled={disabled || nextValue <= min}
        aria-label="Decrease quantity"
        onClick={() => setQuantity(nextValue - 1)}
      >
        -
      </button>
      <input
        name={name}
        type="number"
        min={min}
        max={max}
        value={nextValue}
        disabled={disabled}
        onChange={(event) => setQuantity(Number(event.target.value))}
      />
      <button
        type="button"
        disabled={disabled || nextValue >= safeMax}
        aria-label="Increase quantity"
        onClick={() => setQuantity(nextValue + 1)}
      >
        +
      </button>
    </span>
  )
}
