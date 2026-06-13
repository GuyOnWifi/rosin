import { Icon } from '../components/widgets'
import type { DeviceInfo } from '../ble/pinecil'
import { fmtDuration } from '../lib/format'
import type { LiveData } from '../ble/protocol'

interface Props {
  info: DeviceInfo | null
  live: LiveData | null
  transportKind: 'web' | 'native'
  onDisconnect: () => void
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="row">
      <span className="row-lead">
        <Icon name={icon} />
      </span>
      <div className="row-text">
        <div className="body-small row-sub">{label}</div>
        <div className="title-medium row-title" style={{ wordBreak: 'break-all' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

export function Device({ info, live, transportKind, onDisconnect }: Props) {
  return (
    <div className="fade-in content-narrow">
      <div
        className="card-high card"
        style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}
      >
        <div
          className="connect-art"
          style={{ width: 64, height: 64, marginBottom: 0, borderRadius: 'var(--md-shape-lg)' }}
        >
          <Icon name="settings_input_svideo" fill size={36} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="title-large">{info?.name ?? 'Pinecil'}</div>
          <div className="body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            <span className="dot" style={{ background: 'var(--md-sys-color-primary)', marginRight: 6 }} />
            Connected · {transportKind === 'native' ? 'Native BLE' : 'Web Bluetooth'}
          </div>
        </div>
      </div>

      <div className="section-label label-medium">Identity</div>
      <div className="card">
        <InfoRow icon="memory" label="IronOS build" value={info?.build ?? '—'} />
        <InfoRow icon="tag" label="Serial number" value={info?.deviceSn ?? '—'} />
        <InfoRow icon="fingerprint" label="Device ID" value={info?.deviceId ?? '—'} />
        {live && (
          <InfoRow icon="schedule" label="Uptime" value={fmtDuration(live.uptime)} />
        )}
      </div>

      <button
        className="btn btn-error state-layer"
        style={{ width: '100%', height: 52, marginTop: 22 }}
        onClick={onDisconnect}
      >
        <Icon name="bluetooth_disabled" />
        Disconnect
      </button>
    </div>
  )
}
