/** 先区分横滑与纵向滚动，再接管 touchmove；不在整个面板上禁用原生横向滚动。 */
export function createTabsSwipe(options: {
  root: () => HTMLElement | null
  enabled: () => boolean
  panel: () => HTMLElement | null
  navigate: (direction: 1 | -1) => void
}) {
  let cleanup: (() => void) | undefined

  function cancel() {
    cleanup?.()
    cleanup = undefined
  }

  function start(event: TouchEvent) {
    cancel()
    const root = options.root()
    const panel = options.panel()
    const touch = event.touches[0]
    const target = event.target as HTMLElement | null
    const view = root?.ownerDocument.defaultView
    if (
      !root ||
      !panel ||
      !view ||
      !touch ||
      !target?.closest ||
      !options.enabled() ||
      event.defaultPrevented ||
      event.touches.length !== 1 ||
      !panel.contains(target) ||
      target.closest('.mdv-tabs') !== root ||
      view.getSelection()?.toString()
    )
      return

    const interactive =
      'input, textarea, select, button, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="slider"], .mdv-slider, [data-mdv-tab-swipe-ignore]'
    for (let node: HTMLElement | null = target; node; node = node.parentElement) {
      if (node.matches(interactive)) return
      const overflow = view.getComputedStyle(node).overflowX
      if (/(auto|scroll)/.test(overflow) && node.scrollWidth > node.clientWidth) return
      if (node === panel) break
    }

    const initialX = touch.clientX
    const initialY = touch.clientY
    const identifier = touch.identifier
    let horizontal = false
    let x = initialX
    let y = initialY

    function move(next: TouchEvent) {
      if (
        next.touches.length !== 1 ||
        next.defaultPrevented ||
        !options.enabled() ||
        view!.getSelection()?.toString()
      ) {
        cancel()
        return
      }
      const point = Array.from(next.touches).find((entry) => entry.identifier === identifier)
      if (!point) return
      x = point.clientX
      y = point.clientY
      const dx = Math.abs(x - initialX)
      const dy = Math.abs(y - initialY)
      if (!horizontal && Math.max(dx, dy) >= 8) {
        if (dy >= dx) {
          cancel()
          return
        }
        horizontal = true
      }
      if (horizontal && next.cancelable) next.preventDefault()
    }

    function end(next: TouchEvent) {
      const point = Array.from(next.changedTouches).find((entry) => entry.identifier === identifier)
      if (!point) return
      x = point.clientX
      y = point.clientY
      const threshold = Math.max(32, Math.min(80, panel!.getBoundingClientRect().width * 0.18))
      const dx = x - initialX
      const dy = y - initialY
      const accepted =
        horizontal &&
        !next.defaultPrevented &&
        !view!.getSelection()?.toString() &&
        Math.abs(dx) >= threshold &&
        Math.abs(dx) > Math.abs(dy) * 1.2
      cancel()
      if (!accepted || !options.enabled()) return
      const rtl =
        (view!.getComputedStyle(root!).direction || root!.closest('[dir]')?.getAttribute('dir')) ===
        'rtl'
      options.navigate(dx < 0 !== rtl ? 1 : -1)
    }

    view.addEventListener('touchmove', move, { passive: false })
    view.addEventListener('touchend', end)
    view.addEventListener('touchcancel', cancel)
    view.addEventListener('blur', cancel)
    cleanup = () => {
      view.removeEventListener('touchmove', move)
      view.removeEventListener('touchend', end)
      view.removeEventListener('touchcancel', cancel)
      view.removeEventListener('blur', cancel)
    }
  }

  return { start, cancel }
}
