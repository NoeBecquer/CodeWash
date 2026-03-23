import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,        // opens automatically
      filename: 'stats.html', // output file
      gzipSize: true,
      brotliSize: true
    })
  ]
})