import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts's jsdom-based unit test run: these tests hit
// a real Firestore emulator over the network (see firestore-rules/), so they
// need Node, not jsdom, and must never run as part of the default `npm test`
// (which shouldn't require the emulator to be up). Invoked via `npm run
// test:rules`, which starts/stops the emulator around this run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['firestore-rules/**/*.test.ts'],
    testTimeout: 20_000,
  },
})
