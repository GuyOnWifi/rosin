// Material You dynamic colour. We generate a full tonal scheme from a single
// seed colour using Google's HCT-based material-color-utilities — the exact
// algorithm Android uses for "Material You" — then project it onto CSS custom
// properties (`--md-sys-color-*`) consumed by the stylesheet.

import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  type Theme,
} from '@material/material-color-utilities'

export type Mode = 'light' | 'dark'

// Neutral tones used to synthesise the MD3 layered "surface container" roles
// that the base Scheme doesn't expose directly.
const SURFACE_TONES: Record<Mode, Record<string, number>> = {
  light: {
    surfaceDim: 87,
    surfaceBright: 98,
    surfaceContainerLowest: 100,
    surfaceContainerLow: 96,
    surfaceContainer: 94,
    surfaceContainerHigh: 92,
    surfaceContainerHighest: 90,
  },
  dark: {
    surfaceDim: 6,
    surfaceBright: 24,
    surfaceContainerLowest: 4,
    surfaceContainerLow: 10,
    surfaceContainer: 12,
    surfaceContainerHigh: 17,
    surfaceContainerHighest: 22,
  },
}

const camelToKebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

export interface BuiltTheme {
  vars: Record<string, string>
  source: string
}

export function buildTheme(seedHex: string, mode: Mode): BuiltTheme {
  const theme: Theme = themeFromSourceColor(argbFromHex(seedHex))
  const scheme = theme.schemes[mode]
  const vars: Record<string, string> = {}

  // Core roles from the generated scheme.
  for (const [role, argb] of Object.entries(scheme.toJSON())) {
    vars[`--md-sys-color-${camelToKebab(role)}`] = hexFromArgb(argb as number)
  }

  // Layered surface roles derived from the neutral tonal palette.
  const neutral = theme.palettes.neutral
  for (const [role, tone] of Object.entries(SURFACE_TONES[mode])) {
    vars[`--md-sys-color-${camelToKebab(role)}`] = hexFromArgb(neutral.tone(tone))
  }

  return { vars, source: seedHex }
}

export function applyTheme(seedHex: string, mode: Mode): void {
  const { vars } = buildTheme(seedHex, mode)
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  root.style.colorScheme = mode
  const meta = document.querySelector<HTMLMetaElement>(
    `meta[name="theme-color"]:not([media])`,
  )
  if (meta) meta.content = vars['--md-sys-color-surface-container']
}

// A small curated set of seed colours users can pick — plus the Pinecil orange.
export const SEED_PRESETS: { name: string; hex: string }[] = [
  { name: 'Pinecil', hex: '#ff7a3d' },
  { name: 'Ember', hex: '#e5484d' },
  { name: 'Amber', hex: '#f5a524' },
  { name: 'Lime', hex: '#86b300' },
  { name: 'Teal', hex: '#00a3a3' },
  { name: 'Ocean', hex: '#3b82f6' },
  { name: 'Iris', hex: '#7c5cff' },
  { name: 'Magenta', hex: '#d6409f' },
]
