import { Capacitor, registerPlugin } from '@capacitor/core'

interface SystemThemePlugin {
  getAccent(): Promise<{ supported: boolean; color: string | null }>
  getInsets(): Promise<{ top: number; bottom: number }>
  setWindowBackground(opts: { color: string }): Promise<void>
}

const SystemTheme = registerPlugin<SystemThemePlugin>('SystemTheme')

/** Paint the native window background so system-bar regions match the app. */
export async function setWindowBackground(color: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await SystemTheme.setWindowBackground({ color })
  } catch {
    /* ignore */
  }
}

/** Native system-bar inset heights (CSS px). Zeroes off-Android. */
export async function getSystemInsets(): Promise<{ top: number; bottom: number }> {
  if (!Capacitor.isNativePlatform()) return { top: 0, bottom: 0 }
  try {
    return await SystemTheme.getInsets()
  } catch {
    return { top: 0, bottom: 0 }
  }
}

/** Whether we can read OS Material You colours (native Android only). */
export const canUseSystemColors = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

/** The Android 12+ wallpaper-derived accent, or null if unavailable. */
export async function getSystemAccent(): Promise<string | null> {
  if (!canUseSystemColors()) return null
  try {
    const r = await SystemTheme.getAccent()
    return r.supported ? r.color : null
  } catch {
    return null
  }
}
