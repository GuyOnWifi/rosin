// Synthetic transport - exercises the *real* decode path with fabricated bytes
// so the UI can be explored without a physical Pinecil. Enabled with `?demo`.
import {
  CHAR_BULK_BUILD,
  CHAR_BULK_DEVICE_ID,
  CHAR_BULK_DEVICE_SN,
  CHAR_BULK_LIVE_DATA,
  Setting,
  settingUuid,
} from './protocol'
import type { SelectedDevice, Transport } from './transport'

const enc = (s: string) => {
  const b = new TextEncoder().encode(s)
  return new DataView(b.buffer)
}
const u16 = (v: number) => new DataView(new Uint16Array([v]).buffer)
const u32frame = (vals: number[]) => new DataView(new Uint32Array(vals).buffer)

export class DemoTransport implements Transport {
  readonly kind = 'web' as const
  private connected = false
  private start = Date.now()
  private temp = 28
  private settings = new Map<number, number>([
    [Setting.SetpointTemp, 320],
    [Setting.SleepTemp, 150],
    [Setting.BoostTemp, 420],
    [Setting.PowerLimit, 65],
    [Setting.SleepTimeout, 5],
    [Setting.DisplayBrightness, 51],
    [Setting.InvertButtons, 0],
    [Setting.SolderScreenDetails, 1],
    [Setting.IdleScreenDetails, 1],
    [Setting.TempUnit, 0],
    [Setting.ShutdownTime, 10],
    [Setting.TempIncrementShort, 10],
    [Setting.TempIncrementLong, 20],
    [Setting.MinVoltagePerCell, 33],
    [Setting.QcIdealVoltage, 90],
    [Setting.MinDcVoltageCells, 0],
    [Setting.UsbPdMode, 1],
    [Setting.AccelSensitivity, 7],
    [Setting.HallSensitivity, 0],
    [Setting.OrientationMode, 0],
    [Setting.AnimationSpeed, 2],
    [Setting.DescScrollSpeed, 0],
    [Setting.LogoDuration, 1],
    [Setting.DisplayInvert, 0],
    [Setting.CoolingTempBlink, 1],
  ])

  async isSupported() {
    return true
  }
  async selectDevice(): Promise<SelectedDevice> {
    return { id: 'demo', name: 'Pinecil-DEMO' }
  }
  async restore(id: string): Promise<SelectedDevice | null> {
    return id === 'demo' ? { id: 'demo', name: 'Pinecil-DEMO' } : null
  }
  async connect() {
    this.connected = true
    this.start = Date.now()
  }
  async disconnect() {
    this.connected = false
  }
  isConnected() {
    return this.connected
  }

  async read(_service: string, characteristic: string): Promise<DataView> {
    if (characteristic === CHAR_BULK_LIVE_DATA) return this.liveFrame()
    if (characteristic === CHAR_BULK_BUILD) return enc('2.23')
    if (characteristic === CHAR_BULK_DEVICE_SN) return u32frame([0x9bc533aa, 0x33e27f])
    if (characteristic === CHAR_BULK_DEVICE_ID) return u32frame([0xc0ffee])
    // settings
    for (const [idx, val] of this.settings) {
      if (characteristic === settingUuid(idx)) return u16(val)
    }
    return u16(0)
  }

  async write(_service: string, characteristic: string, data: Uint8Array) {
    const value = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint16(0, true)
    for (const idx of this.settings.keys()) {
      if (characteristic === settingUuid(idx)) this.settings.set(idx, value)
    }
  }

  private liveFrame(): DataView {
    const setpoint = this.settings.get(Setting.SetpointTemp) ?? 320
    // Ease the live temperature toward the set-point with a little ripple.
    const elapsed = (Date.now() - this.start) / 1000
    this.temp += (setpoint - this.temp) * 0.12
    const ripple = Math.sin(elapsed * 1.7) * 2.2
    const live = Math.max(20, Math.round(this.temp + ripple))
    const heating = live + 5 < setpoint
    const watts = heating ? 58 + Math.sin(elapsed * 3) * 6 : 6 + Math.sin(elapsed) * 2
    const pwm = Math.round((watts / 65) * 255)

    return u32frame([
      live, // 0 live temp
      setpoint, // 1 setpoint
      203, // 2 dc voltage ×10 (20.3 V)
      Math.round((26 + Math.sin(elapsed * 0.3) * 1.5) * 10), // 3 handle temp ×10
      Math.min(255, pwm), // 4 pwm raw
      3, // 5 power source = PD
      65, // 6 tip resistance ×10 (6.5 Ω)
      Math.round(elapsed * 10), // 7 uptime ×10
      Math.round(elapsed * 10), // 8 movement ×10
      450, // 9 max tip temp
      Math.round(live * 32.5), // 10 raw tip voltage µV
      512, // 11 hall sensor
      heating ? 1 : 0, // 12 operating mode (soldering / idle)
      Math.round(watts * 10), // 13 est power ×10
    ])
  }
}
