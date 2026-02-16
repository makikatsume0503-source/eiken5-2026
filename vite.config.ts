import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '英検5級トレーニング',
        short_name: '英検5級',
        description: '英検5級トレーニングアプリ',
        theme_color: '#FFF5F8',
        icons: [
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        background_color: '#FFF5F8',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait'
      }
    })
  ],
})
