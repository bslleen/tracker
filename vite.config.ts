import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Writes dist/bundle-stats.html on every build — gzip/brotli sizes per
    // chunk, treemap view. Not shipped (dist/ isn't deployed from source),
    // just a local report; see README's "Bundle analysis" section.
    visualizer({ filename: 'dist/bundle-stats.html', gzipSize: true, brotliSize: true, template: 'treemap' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', 'e2e-preview/**', 'firestore-rules/**'],
  },
})
