import { useEffect, useState } from 'react'
import { ThemeSheet } from './components/ThemeSheet'
import { Icon } from './components/widgets'
import { applyNativeChrome } from './lib/nativeUI'
import { buildTheme } from './theme/theme'
import { useTheme } from './hooks/useTheme'
import { usePinecil } from './hooks/usePinecil'
import { Connect } from './screens/Connect'
import { Device } from './screens/Device'
import { Monitor } from './screens/Monitor'
import { SettingsScreen } from './screens/Settings'

type Tab = 'monitor' | 'settings' | 'device'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'monitor', icon: 'speed', label: 'Monitor' },
  { id: 'settings', icon: 'tune', label: 'Settings' },
  { id: 'device', icon: 'memory', label: 'Device' },
]

export default function App() {
  const theme = useTheme()
  const pc = usePinecil()
  const [tab, setTab] = useState<Tab>('monitor')
  const [themeOpen, setThemeOpen] = useState(false)

  // Keep the native status bar blended with the current Material You surface.
  useEffect(() => {
    const { vars } = buildTheme(theme.seed, theme.mode)
    void applyNativeChrome(theme.mode, vars['--md-sys-color-surface'])
  }, [theme.seed, theme.mode])

  const connected = pc.status === 'connected'

  const title = connected
    ? { monitor: 'Monitor', settings: 'Settings', device: 'Device' }[tab]
    : 'Pinecil'

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1 className="title-large">
          {title}
          {connected && (
            <div className="subtitle body-small">
              {pc.info?.name} · IronOS {pc.info?.build}
            </div>
          )}
        </h1>
        <button
          className="icon-btn state-layer"
          onClick={theme.toggleMode}
          aria-label="Toggle light/dark"
        >
          <Icon name={theme.mode === 'dark' ? 'dark_mode' : 'light_mode'} />
        </button>
        <button
          className="icon-btn state-layer"
          onClick={() => setThemeOpen(true)}
          aria-label="Theme colour"
        >
          <Icon name="palette" fill />
        </button>
      </header>

      {!connected ? (
        <Connect
          status={pc.status}
          error={pc.error}
          transportKind={pc.transportKind}
          knownDevice={pc.knownDevice}
          onConnect={pc.connect}
          onReconnect={pc.reconnect}
        />
      ) : (
        <>
          <main className="scroll-area">
            {tab === 'monitor' && <Monitor pc={pc} />}
            {tab === 'settings' && <SettingsScreen pc={pc} />}
            {tab === 'device' && (
              <Device
                info={pc.info}
                live={pc.live}
                transportKind={pc.transportKind}
                onDisconnect={pc.disconnect}
              />
            )}
          </main>

          <nav className="nav-bar">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`nav-item${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="pill">
                  <Icon name={t.icon} fill={tab === t.id} />
                </span>
                <span className="label">{t.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      {themeOpen && (
        <ThemeSheet
          seed={theme.seed}
          mode={theme.mode}
          dynamic={theme.dynamic}
          onSeed={theme.setSeed}
          onMode={theme.setMode}
          onDynamic={theme.setDynamic}
          onClose={() => setThemeOpen(false)}
        />
      )}
    </div>
  )
}
