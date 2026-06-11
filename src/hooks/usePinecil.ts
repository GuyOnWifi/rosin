import { useCallback, useEffect, useRef, useState } from 'react'
import { PinecilClient, type DeviceInfo } from '../ble/pinecil'
import { Setting } from '../ble/protocol'
import type { LiveData } from '../ble/protocol'
import type { Unit } from '../lib/format'

export type Status = 'idle' | 'unsupported' | 'connecting' | 'connected' | 'error'

export interface Sample {
  t: number
  temp: number
  setpoint: number
}

const HISTORY = 90 // ~90 s of trace at 1 Hz
const POLL_MS = 1000
const KNOWN_KEY = 'pinecil.device'

export interface KnownDevice {
  id: string
  name: string
}

function loadKnown(): KnownDevice | null {
  try {
    const raw = localStorage.getItem(KNOWN_KEY)
    return raw ? (JSON.parse(raw) as KnownDevice) : null
  } catch {
    return null
  }
}

export interface PinecilState {
  status: Status
  error: string | null
  info: DeviceInfo | null
  live: LiveData | null
  history: Sample[]
  unit: Unit
  settingsWritable: boolean
  transportKind: 'web' | 'native'
  knownDevice: KnownDevice | null
  connect: () => Promise<void>
  reconnect: () => Promise<boolean>
  disconnect: () => void
  setTarget: (value: number) => Promise<void>
  setUnit: (u: Unit) => Promise<void>
  /** Briefly true right after settings are auto-persisted to flash. */
  saved: boolean
  readSetting: (index: number) => Promise<number>
  writeSetting: (index: number, value: number) => Promise<void>
}

export function usePinecil(): PinecilState {
  const clientRef = useRef<PinecilClient | null>(null)
  if (!clientRef.current) clientRef.current = new PinecilClient()
  const client = clientRef.current

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<DeviceInfo | null>(null)
  const [live, setLive] = useState<LiveData | null>(null)
  const [history, setHistory] = useState<Sample[]>([])
  const [unit, setUnitState] = useState<Unit>('C')
  const [settingsWritable, setSettingsWritable] = useState(false)
  const [knownDevice, setKnownDevice] = useState<KnownDevice | null>(loadKnown)
  const [saved, setSaved] = useState(false)
  const pollRef = useRef<number | null>(null)
  const tickRef = useRef(0)
  const autoTried = useRef(false)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    client.isSupported().then((ok) => {
      if (!ok) setStatus((s) => (s === 'idle' ? 'unsupported' : s))
    })
  }, [client])

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    const poll = async () => {
      try {
        const data = await client.readLiveData()
        setLive(data)
        setHistory((prev) => {
          const next = [
            ...prev,
            { t: tickRef.current++, temp: data.liveTemp, setpoint: data.setpointTemp },
          ]
          return next.length > HISTORY ? next.slice(next.length - HISTORY) : next
        })
      } catch {
        /* transient read failure — keep polling */
      }
    }
    poll()
    pollRef.current = window.setInterval(poll, POLL_MS)
  }, [client, stopPolling])

  const handleDisconnect = useCallback(() => {
    stopPolling()
    setStatus('idle')
    setLive(null)
    setInfo(null)
  }, [stopPolling])

  const finishConnect = useCallback(
    async (di: DeviceInfo) => {
      setInfo(di)
      setSettingsWritable(client.settingsWritable)
      if (client.currentDeviceId) {
        const kd = { id: client.currentDeviceId, name: di.name }
        localStorage.setItem(KNOWN_KEY, JSON.stringify(kd))
        setKnownDevice(kd)
      }
      if (client.settingsWritable) {
        try {
          const u = await client.readSetting(Setting.TempUnit)
          setUnitState(u === 1 ? 'F' : 'C')
        } catch {
          /* ignore */
        }
      }
      setStatus('connected')
      setHistory([])
      tickRef.current = 0
      startPolling()
    },
    [client, startPolling],
  )

  const connect = useCallback(async () => {
    setError(null)
    setStatus('connecting')
    try {
      await finishConnect(await client.connect(handleDisconnect))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // The user cancelling the chooser shouldn't read as an error.
      if (/cancel|user|chooser/i.test(msg)) {
        setStatus('idle')
      } else {
        setError(msg)
        setStatus('error')
      }
    }
  }, [client, handleDisconnect, finishConnect])

  // Silent auto-reconnect to the last paired device (best effort).
  const reconnect = useCallback(async (): Promise<boolean> => {
    const kd = loadKnown()
    if (!kd) return false
    setError(null)
    setStatus('connecting')
    try {
      const di = await client.reconnect(kd.id, handleDisconnect)
      if (!di) {
        setStatus('idle')
        return false
      }
      await finishConnect(di)
      return true
    } catch {
      setStatus('idle')
      return false
    }
  }, [client, handleDisconnect, finishConnect])

  // On launch, try to silently reconnect once if we have a remembered device.
  useEffect(() => {
    if (autoTried.current) return
    autoTried.current = true
    if (loadKnown()) {
      client.isSupported().then((ok) => ok && reconnect())
    }
  }, [client, reconnect])

  const disconnect = useCallback(() => {
    stopPolling()
    client.disconnect()
    setStatus('idle')
    setLive(null)
    setInfo(null)
  }, [client, stopPolling])

  // Setting writes take effect immediately (in the iron's RAM). We additionally
  // persist them to flash automatically, debounced so a burst of changes (e.g.
  // dragging a slider) results in a single flash write once things settle —
  // matching how IronOS saves on menu exit, without an explicit Save button.
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      client
        .save()
        .then(() => {
          setSaved(true)
          window.setTimeout(() => setSaved(false), 1600)
        })
        .catch(() => {})
    }, 1500)
  }, [client])

  const setTarget = useCallback(
    async (value: number) => {
      await client.writeSetting(Setting.SetpointTemp, value)
      setLive((prev) => (prev ? { ...prev, setpointTemp: value } : prev))
      scheduleSave()
    },
    [client, scheduleSave],
  )

  const readSetting = useCallback(
    (index: number) => client.readSetting(index),
    [client],
  )
  const writeSetting = useCallback(
    async (index: number, value: number) => {
      await client.writeSetting(index, value)
      scheduleSave()
    },
    [client, scheduleSave],
  )

  const setUnit = useCallback(
    async (u: Unit) => {
      await client.writeSetting(Setting.TempUnit, u === 'F' ? 1 : 0)
      setUnitState(u)
      scheduleSave()
    },
    [client, scheduleSave],
  )

  useEffect(
    () => () => {
      stopPolling()
      if (saveTimer.current) clearTimeout(saveTimer.current)
    },
    [stopPolling],
  )

  return {
    status,
    error,
    info,
    live,
    history,
    unit,
    settingsWritable,
    transportKind: client.kind,
    knownDevice,
    connect,
    reconnect,
    disconnect,
    setTarget,
    setUnit,
    saved,
    readSetting,
    writeSetting,
  }
}
