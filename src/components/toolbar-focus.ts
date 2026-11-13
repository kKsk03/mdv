const controls =
  'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"]'
const widgets =
  'input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"], [role="combobox"], [role="tablist"], [role="listbox"], [role="menu"], [role="tree"], [role="grid"]'

export function toolbarControls(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(controls)].filter((element) => {
    if (
      element.tabIndex < 0 ||
      element.matches(':disabled, [aria-disabled="true"], input[type="hidden"]') ||
      element.closest('[hidden], [inert], [aria-hidden="true"]') ||
      element.closest('[data-mdv-toolbar]') !== root
    )
      return false
    const layer = element.closest('dialog, [popover], [role="menu"], [role="listbox"]')
    if (layer && root.contains(layer)) return false
    const view = root.ownerDocument.defaultView
    for (let node: HTMLElement | null = element; node; node = node.parentElement) {
      const style = view?.getComputedStyle(node)
      if (style?.display === 'none' || style?.visibility === 'hidden') return false
      if (node.tagName === 'DETAILS' && !node.hasAttribute('open')) {
        if (!node.querySelector(':scope > summary')?.contains(element)) return false
      }
      if (node === root) break
    }
    return true
  })
}

export function navigateToolbar(event: KeyboardEvent, root: HTMLElement, vertical: boolean) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
    return
  const target = event.target as HTMLElement | null
  if (!target?.closest || target.closest('[data-mdv-toolbar]') !== root) return
  const layer = target.closest('dialog, [popover]')
  if (layer && root.contains(layer)) return
  const widget = target.closest(widgets)
  if (widget && root.contains(widget)) return
  const candidates = toolbarControls(root)
  const index = candidates.indexOf(root.ownerDocument.activeElement as HTMLElement)
  if (index < 0) return
  let next: number
  const rtl = root.ownerDocument.defaultView?.getComputedStyle(root).direction === 'rtl'
  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = candidates.length - 1
  else if (vertical && event.key === 'ArrowDown') next = index + 1
  else if (vertical && event.key === 'ArrowUp') next = index - 1
  else if (!vertical && event.key === 'ArrowRight') next = index + (rtl ? -1 : 1)
  else if (!vertical && event.key === 'ArrowLeft') next = index + (rtl ? 1 : -1)
  else return
  event.preventDefault()
  candidates[(next + candidates.length) % candidates.length]?.focus({ preventScroll: true })
}
