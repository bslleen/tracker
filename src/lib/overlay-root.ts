/**
 * The single source of the #overlay-root DOM node. Pass this to any Radix
 * `Portal` `container` prop (Dialog, Popover, Tooltip, DropdownMenu, …) per
 * CLAUDE.md LAYERING RULES #7 — never let a primitive portal into document.body.
 */
export function getOverlayRoot(): HTMLElement {
  const el = document.getElementById('overlay-root')
  if (!el) {
    throw new Error('#overlay-root is missing from index.html')
  }
  return el
}
