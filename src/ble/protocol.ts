// Pinecil V2 / IronOS Bluetooth LE GATT protocol.
// Reference: https://ralim.github.io/IronOS/Bluetooth/
// and the IronOS firmware `ble_characteristics.h`.
//
// All multi-byte values are little-endian. Live values are unsigned 32-bit;
// settings are unsigned 16-bit.

const LIVE_SUFFIX = '-168e-4a71-aa55-33e27f9bc533'
const SETTINGS_SUFFIX = '-5a10-4eba-aa55-33e27f9bc533'
const BULK_SUFFIX = '-9d0d-48c5-aa55-33e27f9bc533'

export const SVC_LIVE = `d85ef000${LIVE_SUFFIX}`
// NOTE: the settings *service* is 0xf6d8_0000 even though its *characteristics*
// are 0xf6d7_xxxx (per IronOS ble_characteristics.h: BT_UUID_SVC_SETTINGS_DATA).
export const SVC_SETTINGS = `f6d80000${SETTINGS_SUFFIX}`
export const SVC_BULK = `9eae1000${BULK_SUFFIX}`

// Bulk service — one read returns the entire live-data frame.
export const CHAR_BULK_LIVE_DATA = `9eae1001${BULK_SUFFIX}`
export const CHAR_BULK_ACCEL_NAME = `9eae1002${BULK_SUFFIX}`
export const CHAR_BULK_BUILD = `9eae1003${BULK_SUFFIX}`
export const CHAR_BULK_DEVICE_SN = `9eae1004${BULK_SUFFIX}`
export const CHAR_BULK_DEVICE_ID = `9eae1005${BULK_SUFFIX}`

// Settings: f6d7 + 4-hex index. Save = ffff, Reset = fffe.
export const settingUuid = (index: number): string =>
  `f6d7${index.toString(16).padStart(4, '0')}${SETTINGS_SUFFIX}`
export const CHAR_SETTINGS_SAVE = `f6d7ffff${SETTINGS_SUFFIX}`
export const CHAR_SETTINGS_RESET = `f6d7fffe${SETTINGS_SUFFIX}`

// ---- Setting indices (from IronOS / pynecil) ----
export const Setting = {
  SetpointTemp: 0,
  SleepTemp: 1,
  SleepTimeout: 2,
  MinDcVoltageCells: 3,
  MinVoltagePerCell: 4,
  QcIdealVoltage: 5,
  OrientationMode: 6,
  AccelSensitivity: 7,
  AnimationLoop: 8,
  AnimationSpeed: 9,
  AutostartMode: 10,
  ShutdownTime: 11,
  CoolingTempBlink: 12,
  IdleScreenDetails: 13,
  SolderScreenDetails: 14,
  TempUnit: 15,
  DescScrollSpeed: 16,
  LockingMode: 17,
  BoostTemp: 22,
  PowerLimit: 24,
  InvertButtons: 25,
  TempIncrementLong: 26,
  TempIncrementShort: 27,
  HallSensitivity: 28,
  DisplayInvert: 33,
  DisplayBrightness: 34,
  LogoDuration: 35,
  BleEnabled: 37,
  UsbPdMode: 38,
} as const

// ---- Enums ----
export enum PowerSource {
  DC = 0,
  QC = 1,
  PD_VBUS = 2,
  PD = 3,
}

export enum OperatingMode {
  Idle = 0,
  Soldering = 1,
  Boost = 2,
  Sleeping = 3,
  Settings = 4,
  Debug = 5,
  SolderingProfile = 6,
  TemperatureAdjust = 7,
  UsbPdDebug = 8,
  ThermalRunaway = 9,
  StartupLogo = 10,
  CjcCalibration = 11,
  StartupWarnings = 12,
  InitialisationDone = 13,
  Hibernating = 14,
}

export const POWER_SOURCE_LABEL: Record<number, string> = {
  [PowerSource.DC]: 'DC',
  [PowerSource.QC]: 'Quick Charge',
  [PowerSource.PD_VBUS]: 'USB-PD (VBUS)',
  [PowerSource.PD]: 'USB-PD',
}

export const OPERATING_MODE_LABEL: Record<number, string> = {
  [OperatingMode.Idle]: 'Idle',
  [OperatingMode.Soldering]: 'Soldering',
  [OperatingMode.Boost]: 'Boost',
  [OperatingMode.Sleeping]: 'Sleeping',
  [OperatingMode.Settings]: 'Settings',
  [OperatingMode.Debug]: 'Debug',
  [OperatingMode.SolderingProfile]: 'Profile',
  [OperatingMode.TemperatureAdjust]: 'Adjusting',
  [OperatingMode.UsbPdDebug]: 'PD Debug',
  [OperatingMode.ThermalRunaway]: 'Thermal runaway',
  [OperatingMode.StartupLogo]: 'Booting',
  [OperatingMode.CjcCalibration]: 'Calibrating',
  [OperatingMode.StartupWarnings]: 'Warnings',
  [OperatingMode.InitialisationDone]: 'Ready',
  [OperatingMode.Hibernating]: 'Hibernating',
}

export interface LiveData {
  liveTemp: number // °C
  setpointTemp: number // °C
  dcVoltage: number // V
  handleTemp: number // °C
  pwmLevel: number // 0–100 %
  powerSrc: PowerSource
  tipResistance: number // Ω
  uptime: number // s
  movementTime: number // s since last movement
  maxTipTempAbility: number // °C
  tipVoltage: number // µV (raw)
  hallSensor: number
  operatingMode: OperatingMode
  estimatedPower: number // W
}

// Decode the 56-byte (14 × uint32 LE) bulk live-data frame.
export function decodeLiveData(view: DataView): LiveData {
  const u = (i: number) => view.getUint32(i * 4, true)
  return {
    liveTemp: u(0),
    setpointTemp: u(1),
    dcVoltage: u(2) / 10,
    handleTemp: u(3) / 10,
    pwmLevel: Math.round((u(4) / 255) * 100),
    powerSrc: u(5) as PowerSource,
    tipResistance: u(6) / 10,
    uptime: u(7) / 10,
    movementTime: u(8) / 10,
    maxTipTempAbility: u(9),
    tipVoltage: u(10),
    hallSensor: u(11),
    operatingMode: u(12) as OperatingMode,
    estimatedPower: u(13) / 10,
  }
}

export function decodeString(view: DataView): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  return new TextDecoder().decode(bytes).replace(/\0+$/, '').trim()
}

export function decodeUint(view: DataView): number {
  // Variable-width little-endian unsigned int (1–4 bytes).
  let result = 0
  for (let i = view.byteLength - 1; i >= 0; i--) {
    result = result * 256 + view.getUint8(i)
  }
  return result
}

// Little-endian byte blob -> hex string, via BigInt so 64-bit IDs keep every
// digit (a plain Number would lose precision past 2^53).
export function decodeHex(view: DataView): string {
  let result = 0n
  for (let i = view.byteLength - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(view.getUint8(i))
  }
  return result.toString(16)
}

export function encodeUint16(value: number): Uint8Array {
  const buf = new Uint8Array(2)
  new DataView(buf.buffer).setUint16(0, value & 0xffff, true)
  return buf
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))
