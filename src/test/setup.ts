import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia at all. Default every query to
// "doesn't match" (reduced-motion off, coarse-pointer off, desktop-width
// off) — components that branch on it fall back to their safer path.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// Match index.html's fixed DOM roots so components that portal into
// #overlay-root / #toast-root (via getOverlayRoot()) don't throw in tests.
for (const id of ['bg-root', 'app-root', 'overlay-root', 'toast-root']) {
  if (!document.getElementById(id)) {
    const el = document.createElement('div')
    el.id = id
    document.body.appendChild(el)
  }
}
