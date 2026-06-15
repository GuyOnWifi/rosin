import { OPERATING_MODE_LABEL, OperatingMode } from '../ble/protocol'
import { unitSymbol, type Unit } from '../lib/format'

interface Props {
  temp: number
  setpoint: number
  max: number
  mode: OperatingMode
  unit: Unit
}

// Map a tip temperature to an expressive colour: a cool blue when the tip is
// cold/cooling, then a warm amber→red ramp across the soldering range.
function tempColor(t: number, unit: Unit): string {
  const c = unit === 'F' ? ((t - 32) * 5) / 9 : t
  if (c < 45) return 'hsl(202 72% 60%)' // cold / cooling down
  const f = Math.max(0, Math.min(1, (c - 45) / 345))
  const hue = 46 - 40 * Math.pow(f, 0.8) // 46° amber → 6° red
  const light = 57 - f * 6
  return `hsl(${hue} 92% ${light}%)`
}

const SWEEP = 0.75 // 270° gauge
const R = 88
const C = 2 * Math.PI * R

export function Gauge({ temp, setpoint, max, mode, unit }: Props) {
  const ceiling = Math.max(max || 0, setpoint, 400)
  const frac = Math.max(0, Math.min(1, temp / ceiling))
  const setFrac = Math.max(0, Math.min(1, setpoint / ceiling))
  const color = tempColor(temp, unit)

  const heating = temp + 6 < setpoint
  const modeLabel = OPERATING_MODE_LABEL[mode] ?? '-'

  return (
    <div className="gauge-wrap">
      <div className="gauge">
        <svg viewBox="0 0 200 200">
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--md-sys-color-surface-container-highest)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${SWEEP * C} ${C}`}
          />
          {/* Setpoint tick */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--md-sys-color-on-surface-variant)"
            strokeWidth="16"
            strokeLinecap="butt"
            strokeDasharray={`2 ${C}`}
            strokeDashoffset={-setFrac * SWEEP * C}
            opacity="0.9"
          />
          {/* Live value */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${frac * SWEEP * C} ${C}`}
            style={{ transition: 'stroke-dasharray 0.6s var(--ease-emphasized), stroke 0.6s' }}
          />
        </svg>

        <div className="gauge-center">
          <div
            className="mode-chip"
            style={{
              background: heating
                ? 'var(--md-sys-color-tertiary-container)'
                : 'var(--md-sys-color-secondary-container)',
              color: heating
                ? 'var(--md-sys-color-on-tertiary-container)'
                : 'var(--md-sys-color-on-secondary-container)',
            }}
          >
            <span className={`icon fill${heating ? ' spin-slow' : ''}`}>
              {heating ? 'local_fire_department' : 'bolt'}
            </span>
            {modeLabel}
          </div>
          <div className="gauge-temp">
            {Math.round(temp)}
            <span className="gauge-unit">{unitSymbol(unit)}</span>
          </div>
          <div className="gauge-target body-medium">
            <span className="icon" style={{ fontSize: 16 }}>
              adjust
            </span>
            {Math.round(setpoint)}
            {unitSymbol(unit)} target
          </div>
        </div>
      </div>
    </div>
  )
}
