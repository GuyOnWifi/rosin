// Web Bluetooth implementation of Transport.
import { SVC_BULK, SVC_LIVE, SVC_SETTINGS } from './protocol'
import type { SelectedDevice, Transport } from './transport'

export class WebBluetoothTransport implements Transport {
  readonly kind = 'web' as const

  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private services = new Map<string, BluetoothRemoteGATTService>()
  private chars = new Map<string, BluetoothRemoteGATTCharacteristic>()
  private onDisconnect?: () => void

  async isSupported(): Promise<boolean> {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth
  }

  async selectDevice(): Promise<SelectedDevice> {
    if (!(await this.isSupported())) {
      throw new Error('Web Bluetooth is not available in this browser.')
    }
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Pinecil' }],
      optionalServices: [SVC_LIVE, SVC_SETTINGS, SVC_BULK],
    })
    this.device.addEventListener('gattserverdisconnected', this.handleDrop)
    return { id: this.device.id, name: this.device.name ?? 'Pinecil' }
  }

  async restore(id: string): Promise<SelectedDevice | null> {
    const bt = navigator.bluetooth as Bluetooth & {
      getDevices?: () => Promise<BluetoothDevice[]>
    }
    if (!bt?.getDevices) return null // not all Chromium versions expose this
    try {
      const devices = await bt.getDevices()
      const dev = devices.find((d) => d.id === id)
      if (!dev) return null
      this.device = dev
      dev.addEventListener('gattserverdisconnected', this.handleDrop)
      return { id: dev.id, name: dev.name ?? 'Pinecil' }
    } catch {
      return null
    }
  }

  private handleDrop = () => {
    this.server = null
    this.services.clear()
    this.chars.clear()
    this.onDisconnect?.()
  }

  async connect(onDisconnect: () => void): Promise<void> {
    if (!this.device?.gatt) throw new Error('No device selected.')
    this.onDisconnect = onDisconnect
    this.server = await this.device.gatt.connect()
  }

  async disconnect(): Promise<void> {
    this.server?.disconnect()
  }

  isConnected(): boolean {
    return !!this.server?.connected
  }

  private async characteristic(serviceUuid: string, charUuid: string) {
    const cached = this.chars.get(charUuid)
    if (cached) return cached
    if (!this.server) throw new Error('Not connected.')
    let svc = this.services.get(serviceUuid)
    if (!svc) {
      svc = await this.server.getPrimaryService(serviceUuid)
      this.services.set(serviceUuid, svc)
    }
    const c = await svc.getCharacteristic(charUuid)
    this.chars.set(charUuid, c)
    return c
  }

  async read(service: string, characteristic: string): Promise<DataView> {
    const c = await this.characteristic(service, characteristic)
    return c.readValue()
  }

  async write(
    service: string,
    characteristic: string,
    data: Uint8Array,
  ): Promise<void> {
    const c = await this.characteristic(service, characteristic)
    // Copy into a fresh ArrayBuffer-backed view to satisfy BufferSource typing.
    await c.writeValueWithResponse(new Uint8Array(data))
  }
}
