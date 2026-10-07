import { defineConfig } from '@playwright/test'

// Separate from playwright.config.ts (which runs e2e/ against `npm run dev`,
// fast iteration against source). This one runs e2e-preview/ against the
// actual production build + `vite preview` — the pre-deploy smoke check:
// does the built artifact, not just dev-server source, actually work.
export default defineConfig({
  testDir: './e2e-preview',
  fullyParallel: true,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4173',
  },
})
