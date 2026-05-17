import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="inspector-field">
      <span className="inspector-field-label">{label}</span>
      {children}
    </label>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="inspector-row">{children}</div>
}

export function Group({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <fieldset className="inspector-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

const SWATCHES = [
  '#000000', '#475569', '#94a3b8', '#ffffff',
  '#2563eb', '#16a34a', '#d97706', '#dc2626',
]

export function ColorPicker({
  value,
  onChange,
  testId,
}: {
  value: string | undefined
  onChange: (next: string) => void
  testId?: string
}) {
  return (
    <div className="color-picker" data-testid={testId}>
      <div className="color-swatches">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            className={`color-swatch ${value?.toLowerCase() === c ? 'is-selected' : ''}`}
            style={{ background: c }}
            aria-label={`Color ${c}`}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <input
        type="color"
        className="color-input"
        value={value ?? '#000000'}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId ? `${testId}-native` : undefined}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testId,
}: {
  options: { value: T; label: string; title?: string }[]
  value: T | undefined
  onChange: (v: T) => void
  testId?: string
}) {
  return (
    <div className="segmented" data-testid={testId} role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`segmented-option ${value === opt.value ? 'is-selected' : ''}`}
          onClick={() => onChange(opt.value)}
          role="radio"
          aria-checked={value === opt.value}
          title={opt.title ?? opt.label}
          data-testid={testId ? `${testId}-${opt.value}` : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
