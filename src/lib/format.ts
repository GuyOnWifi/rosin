export const clampTip = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Math.round(v)))

export const fmt = (n: number, digits = 0): string =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

export function fmtDuration(seconds: number): string {
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

// Temperature unit handling. Live values come from the device already in its
// configured unit; we keep numbers as-is and just attach the right symbol.
export type Unit = 'C' | 'F'

export const unitSymbol = (u: Unit) => (u === 'F' ? '°F' : '°C')

export const tempRange = (u: Unit) =>
  u === 'F' ? { min: 60, max: 840, step: 10 } : { min: 10, max: 450, step: 5 }

// Common solder set-points per unit, for quick-pick chips.
export const tempPresets = (u: Unit): number[] =>
  u === 'F' ? [480, 600, 660, 750] : [250, 300, 320, 380]
