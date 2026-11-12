import { onBeforeUnmount, onDeactivated, ref } from 'vue'
import type { createSideSheetMotion } from './side-sheet-motion'

interface SwipeOptions {
  panel: () => HTMLElement | null
  enabled: () => boolean
  direction: () => 1 | -1
  motion: ReturnType<typeof createSideSheetMotion>
  close: (velocity: number) => Promise<boolean>
  shouldStart?: (event: PointerEvent) => boolean
  dismissFraction?: number
  flingVelocity?: number
  towardEdgeOnly?: boolean
}

/** 先判断横向意图；调用方决定起点，正文继续使用原生纵向滚动。 */
export function useSideSheetSwipe(options: SwipeOptions) {
  const dragging = ref(false)
  let pointer:
    | {
        id: number
        edge: HTMLElement
        startX: number
        startY: number
        startProgress: number
        width: number
        lastAt: number
        lastProgress: number
        lastX: number
        velocity: number
      }
    | undefined
  let removeListeners: (() => void) | undefined
  let version = 0
  let suppressClick = false

  function cleanup() {
    const previous = pointer
    pointer = undefined
    dragging.value = false
    removeListeners?.()
    removeListeners = undefined
    if (previous?.edge.hasPointerCapture?.(previous.id)) {
      previous.edge.releasePointerCapture(previous.id)
    }
  }

  function cancel(restore = true) {
    version++
    const moving = dragging.value
    cleanup()
    if (moving && restore && options.enabled()) void options.motion.play(true).finished
  }

  function move(event: PointerEvent) {
    const value = pointer
    if (!value || event.pointerId !== value.id) return
    if (!options.enabled()) return cancel(false)
    const dx = event.clientX - value.startX
    const dy = event.clientY - value.startY
    if (!dragging.value) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) return cancel(false)
      if (options.towardEdgeOnly && dx * options.direction() <= 0) return cancel(false)
      value.startProgress = options.motion.current().progress
      dragging.value = true
      suppressClick = true
      value.edge.setPointerCapture?.(value.id)
    }
    event.preventDefault()
    const progress = Math.max(
      0,
      Math.min(1, value.startProgress - (dx * options.direction()) / value.width),
    )
    const elapsed = (event.timeStamp - value.lastAt) / 1000
    if (elapsed > 0) value.velocity = (progress - value.lastProgress) / elapsed
    value.lastAt = event.timeStamp
    value.lastProgress = progress
    value.lastX = event.clientX
    options.motion.drag(progress)
  }

  async function up(event: PointerEvent) {
    const value = pointer
    if (!value || event.pointerId !== value.id) return
    if (!options.enabled()) return cancel(false)
    if (!dragging.value) return cleanup()
    event.preventDefault()
    // pointerup 的坐标也可能比最后一个 move 更靠近边缘。
    if (event.clientX !== value.lastX) move(event)
    const progress = options.motion.current().progress
    const velocity = event.timeStamp - value.lastAt > 100 ? 0 : value.velocity
    const dismiss =
      (1 - progress) * value.width >
        (options.dismissFraction === undefined
          ? Math.min(100, value.width / 2)
          : value.width * options.dismissFraction) ||
      -velocity * value.width > (options.flingVelocity ?? 1000)
    const ticket = ++version
    cleanup()
    if (!dismiss) {
      void options.motion.play(true, velocity).finished
      return
    }
    const accepted = await options.close(velocity)
    if (!accepted && ticket === version && options.enabled()) {
      void options.motion.play(true, velocity).finished
    }
  }

  function down(event: PointerEvent) {
    // 新一轮真实按下不属于上一轮滑动的跟随 click，包括输入框等不接管的起点。
    if (!pointer) suppressClick = false
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.isPrimary === false ||
      pointer ||
      !options.enabled() ||
      options.shouldStart?.(event) === false
    )
      return
    const panel = options.panel()
    const view = panel?.ownerDocument.defaultView
    const width = panel?.getBoundingClientRect().width ?? 0
    if (!view || width <= 0) return
    version++
    pointer = {
      id: event.pointerId,
      edge: event.currentTarget as HTMLElement,
      startX: event.clientX,
      startY: event.clientY,
      startProgress: options.motion.current().progress,
      width,
      lastAt: event.timeStamp,
      lastProgress: options.motion.current().progress,
      lastX: event.clientX,
      velocity: 0,
    }
    const cancelled = (next: PointerEvent) => {
      if (next.pointerId === pointer?.id) cancel()
    }
    const lost = (next: PointerEvent) => {
      if (next.pointerId === pointer?.id) cancel()
    }
    const blur = () => cancel()
    const edge = pointer.edge
    view.addEventListener('pointermove', move, { passive: false })
    view.addEventListener('pointerup', up)
    view.addEventListener('pointercancel', cancelled)
    view.addEventListener('blur', blur)
    edge.addEventListener('lostpointercapture', lost)
    removeListeners = () => {
      view.removeEventListener('pointermove', move)
      view.removeEventListener('pointerup', up)
      view.removeEventListener('pointercancel', cancelled)
      view.removeEventListener('blur', blur)
      edge.removeEventListener('lostpointercapture', lost)
    }
  }

  function suspend() {
    cancel(false)
    options.motion.stop()
  }
  onDeactivated(suspend)
  onBeforeUnmount(suspend)
  function click(event: MouseEvent) {
    if (!suppressClick || event.detail === 0) return
    suppressClick = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  return { dragging, down, cancel, click }
}
