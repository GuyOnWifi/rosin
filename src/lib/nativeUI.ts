// Native chrome (Android status bar / nav bar) tuning. No-op on the web.
// The Android theme paints both system bars the Material You surface colour
// (set at window creation, so there's never a black band). Here we additionally
// repaint them to the *live* surface (seed/mode aware) and set icon contrast.
import { Capacitor } from '@capacitor/core'
import { setWindowBackground } from './systemTheme'
import type { Mode } from '../theme/theme'

export async function applyNativeChrome(mode: Mode, surfaceHex: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await setWindowBackground(surfaceHex)
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    // Style.Dark => light icons (for a dark surface); Style.Light => dark icons.
    await StatusBar.setStyle({ style: mode === 'dark' ? Style.Dark : Style.Light })
  } catch {
    /* plugin unavailable - ignore */
  }
}
