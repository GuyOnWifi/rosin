import { useEffect, useState } from 'react'
import { Slider } from '../components/Slider'
import { CycleSelect, Icon, Segmented, Switch } from '../components/widgets'
import { Setting } from '../ble/protocol'
import type { PinecilState } from '../hooks/usePinecil'
import { tempRange, unitSymbol, type Unit } from '../lib/format'

// Brightness is stored as a raw value (25·level − 24) for level 1–5.
const rawToLevel = (raw: number) => Math.max(1, Math.min(5, Math.round((raw + 24) / 25)))
const levelToRaw = (level: number) => 25 * level - 24

type Opt = { label: string; value: number }

type Item =
  | {
      kind: 'slider'
      key: number
      icon: string
      title: string
      sub?: string
      min: number
      max: number
      step: number
      suffix?: string
      dec?: number
      read?: (raw: number) => number
      write?: (v: number) => number
    }
  | { kind: 'toggle'; key: number; icon: string; title: string; sub?: string }
  | { kind: 'cycle'; key: number; icon: string; title: string; sub?: string; options: Opt[] }
  | { kind: 'seg'; key: number; icon: string; title: string; sub?: string; options: Opt[] }

interface Group {
  title: string
  items: Item[]
}

function buildGroups(unit: Unit): Group[] {
  const r = tempRange(unit)
  const u = unitSymbol(unit)
  return [
    {
      title: 'Temperature',
      items: [
        { kind: 'slider', key: Setting.SleepTemp, icon: 'bedtime', title: 'Sleep temperature', sub: 'Idle cool-down target', min: r.min, max: unit === 'F' ? 580 : 300, step: r.step, suffix: u },
        { kind: 'slider', key: Setting.BoostTemp, icon: 'local_fire_department', title: 'Boost temperature', sub: 'Front-button boost', min: r.min, max: r.max, step: r.step, suffix: u },
        { kind: 'slider', key: Setting.SleepTimeout, icon: 'hourglass_empty', title: 'Sleep timeout', sub: 'Idle time before sleeping', min: 0, max: 15, step: 1, suffix: 'min' },
        { kind: 'slider', key: Setting.ShutdownTime, icon: 'power_settings_new', title: 'Shutdown timeout', sub: 'Idle time before power-off', min: 0, max: 60, step: 1, suffix: 'min' },
        { kind: 'slider', key: Setting.TempIncrementShort, icon: 'exposure_plus_1', title: 'Short-press step', sub: 'Temp change per tap', min: 1, max: 50, step: 1, suffix: u },
        { kind: 'slider', key: Setting.TempIncrementLong, icon: 'keyboard_double_arrow_up', title: 'Long-press step', sub: 'Temp change when held', min: 5, max: 90, step: 5, suffix: u },
      ],
    },
    {
      title: 'Power',
      items: [
        { kind: 'slider', key: Setting.PowerLimit, icon: 'bolt', title: 'Power limit', sub: 'Max output wattage', min: 0, max: 120, step: 5, suffix: 'W' },
        { kind: 'cycle', key: Setting.MinDcVoltageCells, icon: 'battery_full', title: 'Power source', sub: 'Under-voltage cutoff', options: [{ label: 'DC', value: 0 }, { label: '3S', value: 1 }, { label: '4S', value: 2 }, { label: '5S', value: 3 }, { label: '6S', value: 4 }] },
        { kind: 'slider', key: Setting.MinVoltagePerCell, icon: 'battery_alert', title: 'Min cell voltage', sub: 'Battery cutoff per cell', min: 2.4, max: 3.8, step: 0.1, suffix: 'V', dec: 1, read: (x) => x / 10, write: (v) => Math.round(v * 10) },
        { kind: 'slider', key: Setting.QcIdealVoltage, icon: 'electric_bolt', title: 'QC voltage', sub: 'QuickCharge target', min: 9, max: 22, step: 0.1, suffix: 'V', dec: 1, read: (x) => x / 10, write: (v) => Math.round(v * 10) },
        { kind: 'cycle', key: Setting.UsbPdMode, icon: 'usb', title: 'USB-PD mode', sub: 'PPS & EPR power', options: [{ label: 'Off', value: 0 }, { label: 'On', value: 1 }, { label: 'Safe', value: 2 }] },
      ],
    },
    {
      title: 'Motion',
      items: [
        { kind: 'slider', key: Setting.AccelSensitivity, icon: 'vibration', title: 'Motion sensitivity', sub: '0 off · 9 most sensitive', min: 0, max: 9, step: 1 },
        { kind: 'slider', key: Setting.HallSensitivity, icon: 'sensors', title: 'Hall sensitivity', sub: 'Magnetic sleep (if fitted)', min: 0, max: 9, step: 1 },
      ],
    },
    {
      title: 'Display',
      items: [
        { kind: 'slider', key: Setting.DisplayBrightness, icon: 'brightness_6', title: 'Brightness', sub: 'Screen backlight', min: 1, max: 5, step: 1, suffix: '/5', read: rawToLevel, write: levelToRaw },
        { kind: 'cycle', key: Setting.OrientationMode, icon: 'screen_rotation', title: 'Orientation', sub: 'Display handedness', options: [{ label: 'Right', value: 0 }, { label: 'Left', value: 1 }, { label: 'Auto', value: 2 }] },
        { kind: 'cycle', key: Setting.AnimationSpeed, icon: 'animation', title: 'Animations', sub: 'Transition speed', options: [{ label: 'Off', value: 0 }, { label: 'Slow', value: 1 }, { label: 'Medium', value: 2 }, { label: 'Fast', value: 3 }] },
        { kind: 'seg', key: Setting.DescScrollSpeed, icon: 'format_size', title: 'Scroll speed', sub: 'Description text', options: [{ label: 'Slow', value: 0 }, { label: 'Fast', value: 1 }] },
        { kind: 'cycle', key: Setting.LogoDuration, icon: 'image', title: 'Boot logo', sub: 'Splash duration', options: [{ label: 'Off', value: 0 }, { label: '1s', value: 1 }, { label: '2s', value: 2 }, { label: '3s', value: 3 }, { label: '4s', value: 4 }, { label: '5s', value: 5 }, { label: 'Loop', value: 6 }] },
        { kind: 'toggle', key: Setting.DisplayInvert, icon: 'invert_colors', title: 'Invert colours', sub: 'Dark-on-light display' },
        { kind: 'toggle', key: Setting.CoolingTempBlink, icon: 'ac_unit', title: 'Cool-down blink', sub: 'Flash temp until under 50°' },
      ],
    },
    {
      title: 'Buttons & screens',
      items: [
        { kind: 'toggle', key: Setting.InvertButtons, icon: 'swap_horiz', title: 'Swap +/− buttons', sub: 'Invert button assignment' },
        { kind: 'toggle', key: Setting.SolderScreenDetails, icon: 'view_agenda', title: 'Detailed solder screen' },
        { kind: 'toggle', key: Setting.IdleScreenDetails, icon: 'dashboard', title: 'Detailed idle screen' },
      ],
    },
  ]
}

export function SettingsScreen({ pc }: { pc: PinecilState }) {
  const { unit, settingsWritable } = pc
  const [values, setValues] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  const groups = buildGroups(unit)

  useEffect(() => {
    if (!settingsWritable) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const items = groups.flatMap((g) => g.items)
    ;(async () => {
      const out: Record<number, number> = {}
      for (const item of items) {
        // Retry once — BLE reads can transiently fail under contention.
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const raw = await pc.readSetting(item.key)
            out[item.key] = item.kind === 'slider' && item.read ? item.read(raw) : raw
            break
          } catch {
            /* retry, then give up */
          }
        }
      }
      if (active) {
        setValues(out)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsWritable, unit])

  if (!settingsWritable) {
    return (
      <div className="banner info fade-in content-narrow" style={{ marginTop: 16 }}>
        <Icon name="sync_problem" />
        <div className="body-medium">
          Couldn’t reach the iron’s settings service. Make sure Bluetooth is switched
          on in IronOS (Settings → Advanced → Bluetooth), then reconnect.
        </div>
      </div>
    )
  }

  const writeRaw = (item: Item, controlValue: number) => {
    const raw =
      item.kind === 'slider' && item.write ? item.write(controlValue) : controlValue
    setValues((v) => ({ ...v, [item.key]: controlValue }))
    void pc.writeSetting(item.key, raw)
  }

  const renderItem = (item: Item, first: boolean) => {
    const val = values[item.key]
    const top = first ? ({ borderTop: 'none' } as const) : undefined

    if (item.kind === 'slider') {
      const cur = val ?? item.min
      const shown = item.dec ? cur.toFixed(item.dec) : Math.round(cur)
      return (
        <div key={item.key} className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 18, paddingBottom: 18, ...top }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="row-lead"><Icon name={item.icon} /></span>
            <div className="row-text">
              <div className="title-medium row-title">{item.title}</div>
              {item.sub && <div className="body-small row-sub">{item.sub}</div>}
            </div>
            <span className="title-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
              {shown}
              {item.suffix && <span className="body-small"> {item.suffix}</span>}
            </span>
          </div>
          <Slider
            value={cur}
            min={item.min}
            max={item.max}
            step={item.step}
            onChange={(v) => setValues((vv) => ({ ...vv, [item.key]: v }))}
            onCommit={(v) => writeRaw(item, v)}
          />
        </div>
      )
    }

    const control =
      item.kind === 'toggle' ? (
        <Switch checked={!!val} onChange={(v) => writeRaw(item, v ? 1 : 0)} />
      ) : item.kind === 'cycle' ? (
        <CycleSelect value={val ?? item.options[0].value} options={item.options} onChange={(v) => writeRaw(item, v)} />
      ) : (
        <Segmented value={val ?? item.options[0].value} options={item.options} onChange={(v) => writeRaw(item, v)} />
      )

    return (
      <div key={item.key} className="row" style={top}>
        <span className="row-lead"><Icon name={item.icon} /></span>
        <div className="row-text">
          <div className="title-medium row-title">{item.title}</div>
          {item.sub && <div className="body-small row-sub">{item.sub}</div>}
        </div>
        {control}
      </div>
    )
  }

  return (
    <div className="fade-in content-narrow">
      <div className="section-label label-medium">Temperature unit</div>
      <div className="card">
        <div className="row" style={{ borderTop: 'none' }}>
          <span className="row-lead"><Icon name="thermostat" /></span>
          <div className="row-text">
            <div className="title-medium row-title">Units</div>
            <div className="body-small row-sub">Display scale on iron & app</div>
          </div>
          <Segmented<Unit>
            value={unit}
            onChange={(u) => pc.setUnit(u)}
            options={[{ label: '°C', value: 'C' }, { label: '°F', value: 'F' }]}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: 48, color: 'var(--md-sys-color-on-surface-variant)' }}>
          <Icon name="progress_activity" className="spin" size={32} />
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="section-label label-medium">{g.title}</div>
              <div className="card">{g.items.map((it, i) => renderItem(it, i === 0))}</div>
            </div>
          ))}

          <div
            className="body-small"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              margin: '20px 0 4px',
              color: pc.saved
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
              transition: 'color 0.3s',
            }}
          >
            <Icon name={pc.saved ? 'cloud_done' : 'cloud_sync'} size={18} fill={pc.saved} />
            {pc.saved ? 'Saved to your iron' : 'Changes save to your iron automatically'}
          </div>
        </>
      )}
    </div>
  )
}
