# Pinecil Companion

A **Material You** (Material Design 3) companion app for the **Pinecil V2**
soldering iron, talking to it over **Bluetooth LE** ([IronOS BLE spec](https://ralim.github.io/IronOS/Bluetooth/)).

One React + TypeScript codebase, three targets:

| Target | BLE backend | Notes |
| --- | --- | --- |
| **Android (native)** | `@capacitor-community/bluetooth-le` | Real APK, tightest integration. Also works on iOS. |
| **Web** | Web Bluetooth API | Chrome on Android & desktop. Installable as a PWA. |
| **Demo** | synthetic generator | Append `?demo` to the URL — no hardware needed. |

The BLE transport is abstracted (`src/ble/transport.ts`); the protocol decode
and the entire UI are identical across all three.

## Features

- **Live monitor** — expressive radial gauge whose colour tracks tip temperature
  (cool blue → amber → red), operating-mode chip, and a live temperature trace.
- **Temperature control** — slider, ±steppers, and quick-pick presets. Changes
  apply instantly; an explicit *Save* persists to flash (sparing flash wear).
- **Settings** — sleep/boost temperature, power limit, sleep timeout, display
  brightness, °C/°F, button inversion, detailed screens — read from and written
  to the iron live.
- **Device** — IronOS build, serial number, device ID, uptime.
- **Material You** — full HCT dynamic-colour theming generated from a seed colour
  via Google's `material-color-utilities` (the real Android algorithm), light/dark
  modes, MD3 type scale, elevation, motion, navigation bar, and components.

## Develop (web / demo)

```bash
npm install
npm run dev            # then open the printed URL
# preview the UI without a Pinecil:  <url>/?demo
```

Web Bluetooth requires a secure context (HTTPS or `localhost`) and Chromium.

## Build the web app / PWA

```bash
npm run build         # outputs to dist/
npm run preview        # serve the production build
```

## Build the native Android app

Requires **Android Studio** (or the Android SDK + JDK 17).

```bash
npm run android        # build web, sync, and open in Android Studio
# or, with a device/emulator attached:
npm run android:run
```

Then Run ▶ from Android Studio to install on a device/emulator. The Bluetooth
runtime permissions are already declared in
`android/app/src/main/AndroidManifest.xml`.

## On the iron

Enable Bluetooth on the Pinecil (IronOS **Settings → Advanced → Bluetooth**).
For editing settings from the app, make sure BLE isn't in read-only mode.

## Project layout

```
src/
  ble/
    protocol.ts          UUIDs, enums, encode/decode (IronOS spec)
    transport.ts         transport interface
    webTransport.ts      Web Bluetooth implementation
    capacitorTransport.ts native BLE implementation
    demoTransport.ts     synthetic data for ?demo
    pinecil.ts           high-level client (picks a transport)
  theme/theme.ts         Material You colour generation
  hooks/                 usePinecil (BLE state + polling), useTheme
  components/            Gauge, Slider, Sparkline, widgets, ThemeSheet
  screens/               Connect, Monitor, Settings, Device
```
