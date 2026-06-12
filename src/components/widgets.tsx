import type { ReactNode } from 'react'

export function Icon({
  name,
  fill,
  size,
  className = '',
  style,
}: {
  name: string
  fill?: boolean
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`icon${fill ? ' fill' : ''} ${className}`}
      style={{ ...(size ? { fontSize: size } : null), ...style }}
    >
      {name}
    </span>
  )
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      className={`switch${checked ? ' on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    />
  )
}

export function Stat({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: string
  label: string
  value: ReactNode
  unit?: string
  accent?: string
}) {
  return (
    <div className="stat fade-in">
      <div className="stat-head">
        <Icon name={icon} size={18} style={accent ? { color: accent } : undefined} />
        <span className="label-medium">{label}</span>
      </div>
      <div className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
    </div>
  )
}

export function CycleSelect<T extends number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  const cur = options[idx] ?? options[0]
  const advance = (dir: number) =>
    onChange(options[(idx + dir + options.length) % options.length].value)
  return (
    <div className="cycle">
      <button className="cycle-btn" onClick={() => advance(-1)} aria-label="Previous">
        <Icon name="chevron_left" size={20} />
      </button>
      <span className="cycle-label">{cur.label}</span>
      <button className="cycle-btn" onClick={() => advance(1)} aria-label="Next">
        <Icon name="chevron_right" size={20} />
      </button>
    </div>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T; icon?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={o.value === value ? 'sel' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={16} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
