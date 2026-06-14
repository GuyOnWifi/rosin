import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'dev.easonhuang.rosin',
  appName: 'Rosin',
  webDir: 'dist',
  backgroundColor: '#141218',
  android: {
    backgroundColor: '#141218',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#141218',
      showSpinner: false,
    },
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for Pinecil…',
        cancel: 'Cancel',
        availableDevices: 'Available Pinecils',
        noDeviceFound: 'No Pinecil found',
      },
    },
  },
}

export default config
