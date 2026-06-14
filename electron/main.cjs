// Minimal Electron shell for the desktop build. Loads the same `dist/` web
// build and wires up the Web Bluetooth device chooser so BLE works natively
// on Windows/macOS/Linux desktops.
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 380,
    backgroundColor: '#141218',
    title: 'Pinecil Companion',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true },
  })

  // Chromium fires this when navigator.bluetooth.requestDevice() is called.
  win.webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault()
    const pick =
      devices.find((d) => (d.deviceName || '').startsWith('Pinecil')) || devices[0]
    callback(pick ? pick.deviceId : '')
  })

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
