import { Icon } from '../components/widgets'
import type { KnownDevice, Status } from '../hooks/usePinecil'

interface Props {
  status: Status
  error: string | null
  transportKind: 'web' | 'native'
  knownDevice: KnownDevice | null
  onConnect: () => void
  onReconnect: () => void
}

export function Connect({
  status,
  error,
  transportKind,
  knownDevice,
  onConnect,
  onReconnect,
}: Props) {
  const connecting = status === 'connecting'
  const unsupported = status === 'unsupported'

  return (
    <div className="connect fade-in">
      <div className="connect-art">
        <Icon name="settings_input_svideo" fill size={72} />
      </div>
      <h2 className="headline-medium">Rosin</h2>
      <p className="body-large">
        Monitor and tune your Pinecil V2 in real time over Bluetooth, wrapped in
        Material&nbsp;You.
      </p>

      {error && (
        <div className="banner">
          <Icon name="error" />
          <div className="body-medium">{error}</div>
        </div>
      )}

      {unsupported && (
        <div className="banner">
          <Icon name="bluetooth_disabled" />
          <div className="body-medium">
            Bluetooth isn't available here. Open this in Chrome on Android/desktop,
            or install the native app.
          </div>
        </div>
      )}

      {knownDevice && !connecting && (
        <button
          className="btn btn-filled state-layer"
          style={{ marginTop: 24, height: 56, padding: '0 28px', fontSize: 16 }}
          onClick={onReconnect}
          disabled={unsupported}
        >
          <Icon name="autorenew" fill />
          Reconnect to {knownDevice.name}
        </button>
      )}

      <button
        className={`btn state-layer ${knownDevice && !connecting ? 'btn-tonal' : 'btn-filled'}`}
        style={{
          marginTop: knownDevice && !connecting ? 12 : 24,
          height: 56,
          padding: '0 32px',
          fontSize: 16,
        }}
        onClick={onConnect}
        disabled={connecting || unsupported}
      >
        {connecting ? (
          <>
            <Icon name="progress_activity" className="spin" />
            {knownDevice ? 'Connecting…' : 'Pairing…'}
          </>
        ) : (
          <>
            <Icon name="bluetooth_searching" fill />
            {knownDevice ? 'Pair a different Pinecil' : 'Connect to Pinecil'}
          </>
        )}
      </button>

      <div className="banner info" style={{ marginTop: 28 }}>
        <Icon name={transportKind === 'native' ? 'smartphone' : 'public'} />
        <div className="body-small">
          {transportKind === 'native'
            ? 'Native Bluetooth. Turn on the iron, enable BLE in IronOS settings, then pair.'
            : 'Web Bluetooth. Turn on the iron and enable BLE in IronOS settings (Advanced → Bluetooth). Requires HTTPS + Chrome.'}
        </div>
      </div>
    </div>
  )
}
