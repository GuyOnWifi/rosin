// Transport abstraction so the exact same protocol/UI code runs on:
//   • the web  -> Web Bluetooth   (Chrome desktop & Chrome for Android)
//   • native   -> Capacitor BLE   (real Android/iOS app, tighter integration)
//
// A transport only knows how to find a device and shuttle bytes to/from GATT
// characteristics; all Pinecil-specific decoding lives in pinecil.ts.

export interface SelectedDevice {
  id: string
  name: string
}

export interface Transport {
  readonly kind: 'web' | 'native'

  /** Whether BLE is usable in this environment. */
  isSupported(): Promise<boolean>

  /** Show the OS/browser device chooser and remember the pick. */
  selectDevice(): Promise<SelectedDevice>

  /**
   * Silently re-select a previously paired device by id (no chooser), for
   * auto-reconnect on launch. Resolves null if it can't be restored.
   */
  restore(id: string): Promise<SelectedDevice | null>

  /** Connect (GATT) to the previously selected device. */
  connect(onDisconnect: () => void): Promise<void>

  disconnect(): Promise<void>
  isConnected(): boolean

  read(service: string, characteristic: string): Promise<DataView>
  write(service: string, characteristic: string, data: Uint8Array): Promise<void>
}
