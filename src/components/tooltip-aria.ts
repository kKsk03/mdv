/** 保留调用方的描述 ID；移除时只撤销本实例拥有的关联与状态。 */
export function attachTooltipAria(element: HTMLElement, id: string, rich: boolean) {
  const originals = new Map<string, string | null>()
  const written = new Map<string, string>()
  let enabled = false
  let expanded = false

  function token(attribute: string, include: boolean) {
    const current = element.getAttribute(attribute)
    const values = (current ?? '').split(/\s+/).filter((value) => value && value !== id)
    if (include) values.push(id)
    const next = [...new Set(values)].join(' ')
    if (next === (current ?? '')) return
    if (next) element.setAttribute(attribute, next)
    else element.removeAttribute(attribute)
  }

  function state(attribute: string, value: string) {
    const current = element.getAttribute(attribute)
    if (!originals.has(attribute) || (written.has(attribute) && current !== written.get(attribute)))
      originals.set(attribute, current)
    written.set(attribute, value)
    if (current !== value) element.setAttribute(attribute, value)
  }

  function restoreState() {
    for (const [attribute, value] of written) {
      if (element.getAttribute(attribute) !== value) continue
      const original = originals.get(attribute)
      if (original == null) element.removeAttribute(attribute)
      else element.setAttribute(attribute, original)
    }
    originals.clear()
    written.clear()
  }

  function sync() {
    if (rich) {
      token('aria-controls', enabled)
      if (enabled) {
        state('aria-haspopup', 'dialog')
        state('aria-expanded', String(expanded))
      } else restoreState()
    } else token('aria-describedby', enabled)
  }

  const Observer = element.ownerDocument.defaultView?.MutationObserver
  const observer = Observer && new Observer(sync)
  observer?.observe(element, {
    attributes: true,
    attributeFilter: rich
      ? ['aria-controls', 'aria-haspopup', 'aria-expanded']
      : ['aria-describedby'],
  })
  return {
    update(available: boolean, open: boolean) {
      enabled = available
      expanded = open
      sync()
    },
    dispose() {
      observer?.disconnect()
      token(rich ? 'aria-controls' : 'aria-describedby', false)
      restoreState()
    },
  }
}
