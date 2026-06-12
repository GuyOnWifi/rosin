import { useEffect, useState } from 'react'
import { Gauge } from '../components/Gauge'
import { Slider } from '../components/Slider'
import { Sparkline } from '../components/Sparkline'
import { Icon, Stat } from '../components/widgets'
import { POWER_SOURCE_LABEL } from '../ble/protocol'
import type { PinecilState } from '../hooks/usePinecil'
import {
  clampTip,
  fmt,
  fmtDuration,
  tempPresets,
  tempRange,
  unitSymbol,
} from '../lib/format'

export function Monitor({ pc }: { pc: PinecilState }) {
  const { live, history, unit, settingsWritable } = pc
  const range = tempRange(unit)
  const [target, setTarget] = useState(live?.setpointTemp ?? range.min)
  const [editing, setEditing] = useState(false)

  // Keep the slider in sync with the device unless the user is actively dragging.
  useEffect(() => {
    if (!editing && live) setTarget(live.setpointTemp)
  }, [live, editing])

  if (!live) return null

  const commit = async (v: number) => {
    const clamped = clampTip(v, range.min, range.max)
    setTarget(clamped)
    setEditing(false)
    await pc.setTarget(clamped)
  }
  const nudge = (delta: number) => {
    const v = clampTip(target + delta, range.min, range.max)
    setTarget(v)
    setEditing(true)
    void pc.setTarget(v)
  }

  return (
    <div className="fade-in monitor">
      <div className="monitor-col">
      <Gauge
        temp={live.liveTemp}
        setpoint={live.setpointTemp}
        max={live.maxTipTempAbility}
        mode={live.operatingMode}
        unit={unit}
      />

      {/* Temperature control */}
      {settingsWritable && (
        <div className="card" style={{ marginTop: 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span className="title-medium" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Target temperature
              {pc.saved && (
                <Icon name="cloud_done" size={16} fill style={{ color: 'var(--md-sys-color-primary)' }} />
              )}
            </span>
            <span className="headline-small" style={{ color: 'var(--md-sys-color-primary)' }}>
              {Math.round(target)}
              <span className="title-medium">{unitSymbol(unit)}</span>
            </span>
          </div>

          <div className="temp-control">
            <div className="temp-control-row">
              <button className="stepper" onClick={() => nudge(-range.step)} aria-label="Lower">
                <Icon name="remove" />
              </button>
              <Slider
                value={target}
                min={range.min}
                max={range.max}
                step={range.step}
                onChange={(v) => {
                  setEditing(true)
                  setTarget(v)
                }}
                onCommit={commit}
              />
              <button className="stepper" onClick={() => nudge(range.step)} aria-label="Raise">
                <Icon name="add" />
              </button>
            </div>

            <div className="preset-row">
              {tempPresets(unit).map((p) => (
                <button
                  key={p}
                  className={`chip${Math.round(target) === p ? ' selected' : ''}`}
                  onClick={() => commit(p)}
                >
                  {p}
                  {unitSymbol(unit)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>

      <div className="monitor-col">
      {/* Live trace */}
      <div className="card" style={{ marginTop: 4 }}>
        <div className="stat-head" style={{ marginBottom: 6 }}>
          <Icon name="show_chart" size={18} />
          <span className="label-medium">LIVE TRACE · {unitSymbol(unit)}</span>
        </div>
        <Sparkline data={history} />
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginTop: 4 }}>
        <Stat
          icon="bolt"
          label="POWER"
          value={fmt(live.estimatedPower, 1)}
          unit="W"
          accent="var(--md-sys-color-primary)"
        />
        <Stat icon="battery_charging_full" label="INPUT" value={fmt(live.dcVoltage, 1)} unit="V" />
        <Stat icon="speed" label="PWM DUTY" value={fmt(live.pwmLevel)} unit="%" />
        <Stat
          icon="power"
          label="SOURCE"
          value={
            <span style={{ fontSize: 20 }}>
              {POWER_SOURCE_LABEL[live.powerSrc] ?? '—'}
            </span>
          }
        />
        <Stat icon="device_thermostat" label="HANDLE" value={fmt(live.handleTemp, 1)} unit={unitSymbol(unit)} />
        <Stat icon="thermostat" label="MAX TIP" value={fmt(live.maxTipTempAbility)} unit={unitSymbol(unit)} />
        <Stat icon="cable" label="TIP RES" value={fmt(live.tipResistance, 1)} unit="Ω" />
        <Stat icon="timer" label="UPTIME" value={<span style={{ fontSize: 20 }}>{fmtDuration(live.uptime)}</span>} />
      </div>
      </div>
    </div>
  )
}
