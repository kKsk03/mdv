import { onActivated, onBeforeUnmount, onDeactivated, onMounted, watch } from 'vue'
import type { WatchStopHandle } from 'vue'
import type { MdvExtendedFabProps } from './fab.types'

export function useFabScroll(options: {
  props: MdvExtendedFabProps
  element: () => HTMLElement | null
  canCollapse: () => boolean
  request: (expanded: boolean) => Promise<boolean>
}) {
  let target: Window | HTMLElement | null = null
  let active = false
  let last = 0
  let distance = 0
  let direction = 0
  let pointerDown = false
  let observer: MutationObserver | undefined
  let stop: WatchStopHandle | undefined

  function resolveTarget() {
    const root = options.element()
    if (!root) return null
    const requested = options.props.scrollTarget
    if (requested === undefined) return root.ownerDocument.defaultView
    if (typeof requested === 'function') return requested() ?? null
    if (typeof requested === 'string') {
      try {
        return root.ownerDocument.querySelector<HTMLElement>(requested)
      } catch {
        return null
      }
    }
    return requested
  }
  function position() {
    const value = target ? ('scrollY' in target ? target.scrollY : target.scrollTop) : 0
    return Number.isFinite(value) ? Math.max(0, value) : 0
  }
  function reset() {
    distance = direction = 0
  }
  function onScroll() {
    const y = position()
    const delta = y - last
    last = y
    const root = options.element()
    if (!delta || !root || !options.canCollapse()) return
    if (
      pointerDown ||
      root.contains(root.ownerDocument.activeElement) ||
      root.matches('[data-mdv-menu-trigger-open], [aria-haspopup][aria-expanded="true"]')
    ) {
      reset()
      return
    }
    const region = target && 'scrollY' in target ? root.ownerDocument.scrollingElement : target
    const range = region && 'scrollHeight' in region ? region.scrollHeight - region.clientHeight : 0
    if (y === 0 || (range > 0 && y >= range - 1)) {
      reset()
      void options.request(true)
      return
    }
    const next = delta > 0 ? 1 : -1
    if (direction !== next) {
      reset()
      direction = next
    }
    distance += Math.abs(delta)
    const threshold = options.props.scrollThreshold
    if (distance < (Number.isFinite(threshold) ? Math.max(0, threshold!) : 40)) return
    distance = 0
    void options.request(direction < 0)
  }
  function refresh() {
    const next =
      active && options.props.scrollBehavior === 'collapse' && options.canCollapse()
        ? resolveTarget()
        : null
    if (next === target) return
    target?.removeEventListener('scroll', onScroll)
    target = next
    target?.addEventListener('scroll', onScroll, { passive: true })
    last = position()
    reset()
  }
  function onPointerStart() {
    pointerDown = true
  }
  function onPointerEnd() {
    pointerDown = false
  }
  function connect() {
    const root = options.element()
    if (active || !root) return
    active = true
    stop = watch(
      () => [
        options.props.scrollBehavior,
        options.props.scrollTarget,
        options.canCollapse(),
        resolveTarget(),
      ],
      () => {
        observer?.disconnect()
        if (
          typeof options.props.scrollTarget === 'string' &&
          typeof MutationObserver !== 'undefined'
        ) {
          observer = new MutationObserver(refresh)
          observer.observe(root.ownerDocument.documentElement, { childList: true, subtree: true })
        }
        refresh()
      },
      { immediate: true, flush: 'post' },
    )
    root.addEventListener('pointerdown', onPointerStart)
    root.ownerDocument.addEventListener('pointerup', onPointerEnd, true)
    root.ownerDocument.addEventListener('pointercancel', onPointerEnd, true)
    root.ownerDocument.defaultView?.addEventListener('blur', onPointerEnd)
  }
  function disconnect() {
    const root = options.element()
    active = false
    target?.removeEventListener('scroll', onScroll)
    target = null
    stop?.()
    observer?.disconnect()
    root?.removeEventListener('pointerdown', onPointerStart)
    root?.ownerDocument.removeEventListener('pointerup', onPointerEnd, true)
    root?.ownerDocument.removeEventListener('pointercancel', onPointerEnd, true)
    root?.ownerDocument.defaultView?.removeEventListener('blur', onPointerEnd)
    pointerDown = false
    reset()
  }
  onMounted(connect)
  onActivated(connect)
  onDeactivated(disconnect)
  onBeforeUnmount(disconnect)
  return { refresh }
}
