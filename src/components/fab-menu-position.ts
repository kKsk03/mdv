import { autoUpdate } from '@floating-ui/dom'

/** 保留原 FAB 占位，整个操作组提升到 top layer；按钮节点及原主题继承不变。 */
export function observeFabMenuPosition(options: {
  anchor: HTMLElement
  layer: HTMLElement
  viewport: HTMLElement
  unavailable(): void
}) {
  const { anchor, layer, viewport } = options
  const view = anchor.ownerDocument.defaultView
  const visual = view?.visualViewport
  function update() {
    const box = anchor.getBoundingClientRect()
    const top = visual?.offsetTop ?? 0
    const left = visual?.offsetLeft ?? 0
    const width = visual?.width ?? view?.innerWidth ?? 0
    const height = visual?.height ?? view?.innerHeight ?? 0
    const rtl = view?.getComputedStyle(anchor).direction === 'rtl'
    if (box.height > 0 && (box.bottom <= top || box.top >= top + height)) {
      options.unavailable()
      return
    }
    layer.style.setProperty('left', `${box.left}px`)
    layer.style.setProperty('top', `${box.top}px`)
    layer.style.setProperty('width', `${box.width}px`)
    layer.style.setProperty('height', `${box.height}px`)
    const offset = Number.parseFloat(
      view?.getComputedStyle(anchor).getPropertyValue('--mdv-fab-menu-offset') ?? '',
    )
    const margin = Number.isFinite(offset) ? offset : 16
    layer.style.setProperty(
      '--mdv-fab-menu-available-height',
      `${Math.max(56, box.top + 56 - top - margin)}px`,
    )
    layer.style.setProperty(
      '--mdv-fab-menu-available-width',
      `${Math.max(56, (rtl ? left + width - box.left : box.right - left) - margin + 6)}px`,
    )
  }
  const stop = autoUpdate(anchor, layer, update)
  visual?.addEventListener('resize', update)
  visual?.addEventListener('scroll', update)
  let lastFocused: HTMLElement | null = null
  function keepFocusVisible() {
    const active = anchor.ownerDocument.activeElement
    if (!(active instanceof HTMLElement) || !viewport.contains(active)) return
    lastFocused = active
    const box = active.getBoundingClientRect()
    const bounds = viewport.getBoundingClientRect()
    const bottom = Math.min(bounds.bottom - 64, anchor.getBoundingClientRect().top - 8)
    if (box.top < bounds.top + 6) viewport.scrollTop -= bounds.top + 6 - box.top
    else if (box.bottom > bottom) viewport.scrollTop += box.bottom - bottom
  }
  viewport.addEventListener('focusin', keepFocusVisible)
  const observer =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          update()
          keepFocusVisible()
        })
      : undefined
  observer?.observe(viewport)
  const mutations = new MutationObserver(() => {
    const active = anchor.ownerDocument.activeElement
    if (
      lastFocused &&
      (!viewport.contains(lastFocused) ||
        lastFocused.matches(':disabled, [aria-disabled="true"]')) &&
      (active === lastFocused || active === anchor.ownerDocument.body)
    ) {
      layer
        .querySelector<HTMLButtonElement>('.mdv-fab-menu__trigger')
        ?.focus({ preventScroll: true })
      lastFocused = null
    }
    keepFocusVisible()
  })
  mutations.observe(viewport, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-disabled'],
  })
  return () => {
    stop()
    observer?.disconnect()
    mutations.disconnect()
    viewport.removeEventListener('focusin', keepFocusVisible)
    visual?.removeEventListener('resize', update)
    visual?.removeEventListener('scroll', update)
    for (const name of [
      'left',
      'top',
      'width',
      'height',
      '--mdv-fab-menu-available-height',
      '--mdv-fab-menu-available-width',
    ])
      layer.style.removeProperty(name)
  }
}
