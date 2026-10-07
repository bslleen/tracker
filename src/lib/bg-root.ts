/** #bg-root already has `position: fixed; inset: 0; z-index: var(--z-bg); pointer-events: none` from globals.css — anything mounted here just needs to fill it, never its own fixed positioning or z-index. */
export function getBgRoot(): HTMLElement {
  const el = document.getElementById('bg-root')
  if (!el) {
    throw new Error('#bg-root is missing from index.html')
  }
  return el
}
