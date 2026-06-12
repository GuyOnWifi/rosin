import type { Sample } from '../hooks/usePinecil'

interface Props {
  data: Sample[]
}

// Compact live temperature trace with a dashed set-point reference.
export function Sparkline({ data }: Props) {
  const W = 320
  const H = 96
  if (data.length < 2) {
    return (
      <div
        className="body-small"
        style={{
          height: H,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        Collecting data…
      </div>
    )
  }

  const temps = data.map((d) => d.temp)
  const sets = data.map((d) => d.setpoint)
  const lo = Math.min(...temps, ...sets) - 10
  const hi = Math.max(...temps, ...sets) + 10
  const span = Math.max(1, hi - lo)

  const x = (i: number) => (i / (data.length - 1)) * W
  const y = (v: number) => H - ((v - lo) / span) * H

  const line = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')

  const area = `${line(temps)} L${W} ${H} L0 ${H} Z`
  const lastSet = sets[sets.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        y1={y(lastSet)}
        x2={W}
        y2={y(lastSet)}
        stroke="var(--md-sys-color-on-surface-variant)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.6"
      />
      <path d={area} fill="url(#trace)" />
      <path
        d={line(temps)}
        fill="none"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
