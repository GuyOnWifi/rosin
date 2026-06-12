import { Icon, Segmented, Switch } from './widgets'
import { canUseSystemColors } from '../lib/systemTheme'
import { SEED_PRESETS, type Mode } from '../theme/theme'

interface Props {
  seed: string
  mode: Mode
  dynamic: boolean
  onSeed: (hex: string) => void
  onMode: (m: Mode) => void
  onDynamic: (v: boolean) => void
  onClose: () => void
}

export function ThemeSheet({
  seed,
  mode,
  dynamic,
  onSeed,
  onMode,
  onDynamic,
  onClose,
}: Props) {
  const systemAvailable = canUseSystemColors()
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Icon name="palette" fill />
          <span className="title-large" style={{ flex: 1 }}>
            Material You
          </span>
          <Segmented<Mode>
            value={mode}
            onChange={onMode}
            options={[
              { label: 'Light', value: 'light', icon: 'light_mode' },
              { label: 'Dark', value: 'dark', icon: 'dark_mode' },
            ]}
          />
        </div>
        {systemAvailable && (
          <div className="row" style={{ padding: '8px 4px' }}>
            <span className="row-lead">
              <Icon name="auto_awesome" fill />
            </span>
            <div className="row-text">
              <div className="title-medium row-title">Use system colours</div>
              <div className="body-small row-sub">
                Follow Android’s wallpaper-based Material You palette
              </div>
            </div>
            <Switch checked={dynamic} onChange={onDynamic} />
          </div>
        )}
        <p className="body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 8px' }}>
          {dynamic
            ? 'Following your device’s Material You colours. Pick a colour below to override.'
            : 'Pick a seed colour — the whole app re-tones from it, just like Android.'}
        </p>
        <div className="color-dots">
          {SEED_PRESETS.map((p) => (
            <button
              key={p.hex}
              className="color-dot"
              style={{ background: p.hex }}
              aria-label={p.name}
              onClick={() => onSeed(p.hex)}
            >
              {seed.toLowerCase() === p.hex.toLowerCase() && <Icon name="check" fill />}
            </button>
          ))}
          <label
            className="color-dot"
            style={{
              background:
                'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
              position: 'relative',
            }}
            aria-label="Custom colour"
          >
            <Icon name="colorize" fill />
            <input
              type="color"
              value={seed}
              onChange={(e) => onSeed(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
