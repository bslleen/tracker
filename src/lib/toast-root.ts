/** The single source of the #toast-root DOM node — see CLAUDE.md LAYERING RULES #7. */
export function getToastRoot(): HTMLElement {
  const el = document.getElementById('toast-root')
  if (!el) {
    throw new Error('#toast-root is missing from index.html')
  }
  return el
}
