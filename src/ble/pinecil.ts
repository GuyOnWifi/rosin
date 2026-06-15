// High-level Pinecil client. Protocol decode/encode lives here; raw byte
// transport (Web Bluetooth vs native Capacitor BLE) is injected.
import { Capacitor } from '@capacitor/core'
import { CapacitorBleTransport } from './capacitorTransport'
import { DemoTransport } from './demoTransport'
import {
  CHAR_BULK_BUILD,
  CHAR_BULK_DEVICE_ID,
  CHAR_BULK_DEVICE_SN,
  CHAR_BULK_LIVE_DATA,
  CHAR_SETTINGS_SAVE,
  decodeHex,
  decodeLiveData,
  decodeString,
  decodeUint,
  encodeUint16,
  settingUuid,
  SVC_BULK,
  SVC_SETTINGS,
  type LiveData,
} from './protocol'
import type { Transport } from './transport'
import { WebBluetoothTransport } from './webTransport'

export interface DeviceInfo {
  name: string
  build: string
  deviceSn: string
  deviceId: string
}

/** Pick the right transport for the current runtime. */
export function createTransport(): Transport {
  if (
    typeof location !== 'undefined' &&
    /[?&]demo\b/.test(location.search)
  ) {
    return new DemoTransport()
  }
  return Capacitor.isNativePlatform()
    ? new CapacitorBleTransport()
    : new WebBluetoothTransport()
}

export class PinecilClient {
  private settingsAvailable = false
  private deviceId: string | null = null
  // Serialise every GATT operation. A BLE connection allows only one
  // read/write in flight at a time - overlapping the 1 Hz live poll with
  // settings reads makes the native stack reject ops, which previously showed
  // up as settings falling back to their minimum. This queue prevents that.
  private opChain: Promise<unknown> = Promise.resolve()

  constructor(private transport: Transport = createTransport()) {}

  private serialize<T>(op: () => Promise<T>): Promise<T> {
    const result = this.opChain.then(op, op)
    this.opChain = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  get kind() {
    return this.transport.kind
  }

  get currentDeviceId(): string | null {
    return this.deviceId
  }

  get connected(): boolean {
    return this.transport.isConnected()
  }

  get settingsWritable(): boolean {
    return this.settingsAvailable
  }

  isSupported(): Promise<boolean> {
    return this.transport.isSupported()
  }

  /** Show the chooser, connect, and read identity. */
  async connect(onDisconnect: () => void): Promise<DeviceInfo> {
    const picked = await this.transport.selectDevice()
    return this.open(picked, onDisconnect)
  }

  /** Silently reconnect to a remembered device id (no chooser). */
  async reconnect(id: string, onDisconnect: () => void): Promise<DeviceInfo | null> {
    const picked = await this.transport.restore(id)
    if (!picked) return null
    return this.open(picked, onDisconnect)
  }

  private async open(
    picked: { id: string; name: string },
    onDisconnect: () => void,
  ): Promise<DeviceInfo> {
    this.deviceId = picked.id
    await this.transport.connect(onDisconnect)

    // IronOS BLE (latest stable v2.23) is a plain on/off toggle with no
    // read-only mode - once connected, the settings service is present and
    // fully read/write. So we assume full write access.
    this.settingsAvailable = true

    return this.readDeviceInfo(picked.name)
  }

  private async readDeviceInfo(name: string): Promise<DeviceInfo> {
    const safe = (uuid: string) =>
      this.serialize(() => this.transport.read(SVC_BULK, uuid)).catch(() => null)
    const [build, sn, id] = await Promise.all([
      safe(CHAR_BULK_BUILD),
      safe(CHAR_BULK_DEVICE_SN),
      safe(CHAR_BULK_DEVICE_ID),
    ])
    return {
      name,
      build: build ? decodeString(build) : '-',
      deviceSn: sn ? decodeHex(sn).padStart(16, '0') : '-',
      deviceId: id ? decodeHex(id) : '-',
    }
  }

  disconnect(): Promise<void> {
    return this.transport.disconnect()
  }

  async readLiveData(): Promise<LiveData> {
    const value = await this.serialize(() =>
      this.transport.read(SVC_BULK, CHAR_BULK_LIVE_DATA),
    )
    return decodeLiveData(value)
  }

  async readSetting(index: number): Promise<number> {
    const value = await this.serialize(() =>
      this.transport.read(SVC_SETTINGS, settingUuid(index)),
    )
    return decodeUint(value)
  }

  /**
   * Write a raw uint16 setting. Applies immediately in RAM; call `save()` to
   * persist to flash. We avoid auto-saving every change to spare flash wear.
   */
  async writeSetting(index: number, value: number): Promise<void> {
    await this.serialize(() =>
      this.transport.write(SVC_SETTINGS, settingUuid(index), encodeUint16(value)),
    )
  }

  async save(): Promise<void> {
    if (!this.settingsAvailable) return
    await this.serialize(() =>
      this.transport.write(SVC_SETTINGS, CHAR_SETTINGS_SAVE, encodeUint16(1)),
    )
  }
}
