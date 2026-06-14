import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Use a relative base so the build works when served from a subpath
  // (e.g. GitHub Pages / static hosts) as well as from root.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Rosin',
        short_name: 'Rosin',
        description:
          'A Material You companion for the Pinecil V2 soldering iron over Bluetooth',
        theme_color: '#ff7a3d',
        background_color: '#141218',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
})
