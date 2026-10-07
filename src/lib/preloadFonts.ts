// ?url resolves to the final, content-hashed asset URL at build time — the
// only way to preload a fontsource file correctly, since its real URL isn't
// knowable from a static <link> in index.html. Only the latin, normal-weight
// variable-font file is preloaded (not italic or other unicode-range
// subsets): the one guaranteed to be needed for first paint of this app's
// English UI text.
import geistLatinUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url'
import geistMonoLatinUrl from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url'

function preload(href: string) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = href
  document.head.appendChild(link)
}

/** Called once, synchronously, before React mounts — see main.tsx. */
export function preloadFonts(): void {
  preload(geistLatinUrl)
  preload(geistMonoLatinUrl)
}
