// Native BLE implementation of Transport, backed by @capacitor-community/bluetooth-le.
// Used when the app runs as a packaged Android/iOS build (Capacitor), giving
// real native Bluetooth instead of the browser's Web Bluetooth bridge.
import { BleClient, type BleDevice } from '@capacitor-community/bluetooth-le'
import { SVC_BULK, SVC_LIVE, SVC_SETTINGS } from './protocol'
import type { SelectedDevice, Transport } from './transport'

export class CapacitorBleTransport implements Transport {
  readonly kind = 'native' as const

  private device: BleDevice | null = null
  private connectedFlag = false
  private initialised = false

  async isSupported(): Promise<boolean> {
    // On a native build the plugin is always present. Don't initialize here —
    // that would trigger the runtime permission prompt on app launch. We defer
    // initialization to selectDevice(), i.e. when the user taps Connect.
    return true
  }

  private async ensureInit() {
    if (this.initialised) return
    await BleClient.initialize({ androidNeverForLocation: true })
    this.initialised = true
  }

  async selectDevice(): Promise<SelectedDevice> {
    await this.ensureInit()
    this.device = await BleClient.requestDevice({
      namePrefix: 'Pinecil',
      optionalServices: [SVC_LIVE, SVC_SETTINGS, SVC_BULK],
    })
    return { id: this.device.deviceId, name: this.device.name ?? 'Pinecil' }
  }

  async restore(id: string): Promise<SelectedDevice | null> {
    // Native BLE can connect straight to a known deviceId, no re-scan needed.
    await this.ensureInit()
    this.device = { deviceId: id, name: 'Pinecil' }
    return { id, name: 'Pinecil' }
  }

  async connect(onDisconnect: () => void): Promise<void> {
    if (!this.device) throw new Error('No device selected.')
    await BleClient.connect(this.device.deviceId, () => {
      this.connectedFlag = false
      onDisconnect()
    })
    this.connectedFlag = true
  }

  async disconnect(): Promise<void> {
    if (this.device) await BleClient.disconnect(this.device.deviceId)
    this.connectedFlag = false
  }

  isConnected(): boolean {
    return this.connectedFlag
  }

  async read(service: string, characteristic: string): Promise<DataView> {
    if (!this.device) throw new Error('Not connected.')
    return BleClient.read(this.device.deviceId, service, characteristic)
  }

  async write(
    service: string,
    characteristic: string,
    data: Uint8Array,
  ): Promise<void> {
    if (!this.device) throw new Error('Not connected.')
    const copy = new Uint8Array(data) // ArrayBuffer-backed
    const view = new DataView(copy.buffer)
    await BleClient.write(this.device.deviceId, service, characteristic, view)
  }
}
