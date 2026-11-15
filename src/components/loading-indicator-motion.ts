import { onActivated, onBeforeUnmount, onDeactivated, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { loadingIndicatorFrame } from './loading-indicator-geometry'

interface LoadingIndicatorElements {
  root: Readonly<Ref<HTMLElement | null>>
  rotor: Readonly<Ref<SVGGElement | null>>
  path: Readonly<Ref<SVGPathElement | null>>
}

/** A local clock; animation frames update SVG attributes without rendering the component. */
export function useLoadingIndicatorMotion(
  paused: () => boolean,
  elements: LoadingIndicatorElements,
) {
  let view: Window | null = null
  let owner: Document | undefined
  let mounted = false
  let activated = true
  let intersecting = true
  let reducedMotion = false
  let elapsed = 0
  let previousTime: number | null = null
  let frameId: number | null = null
  let media: MediaQueryList | undefined
  let intersection: IntersectionObserver | undefined

  function paint() {
    const frame = loadingIndicatorFrame(reducedMotion ? 0 : elapsed)
    elements.path.value?.setAttribute('d', frame.path)
    elements.rotor.value?.setAttribute('transform', `rotate(${frame.rotation.toFixed(3)} 50 50)`)
  }

  function cancelFrame() {
    if (frameId !== null) view?.cancelAnimationFrame(frameId)
    frameId = null
    previousTime = null
  }

  function canAnimate() {
    return (
      mounted &&
      activated &&
      intersecting &&
      !paused() &&
      !reducedMotion &&
      owner?.visibilityState !== 'hidden'
    )
  }

  function schedule() {
    if (frameId === null && canAnimate() && typeof view?.requestAnimationFrame === 'function') {
      frameId = view.requestAnimationFrame(tick)
    }
  }

  function tick(time: number) {
    frameId = null
    if (!canAnimate()) {
      previousTime = null
      return
    }
    if (previousTime !== null) elapsed += Math.max(0, time - previousTime)
    previousTime = time
    paint()
    schedule()
  }

  function refresh() {
    cancelFrame()
    paint()
    schedule()
  }

  function onMotionChange(event: MediaQueryListEvent) {
    reducedMotion = event.matches
    refresh()
  }

  watch(paused, refresh, { flush: 'post' })

  onMounted(() => {
    owner = elements.root.value?.ownerDocument
    view = owner?.defaultView ?? null
    mounted = true
    media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
    reducedMotion = media?.matches === true
    media?.addEventListener('change', onMotionChange)
    owner?.addEventListener('visibilitychange', refresh)
    if (typeof IntersectionObserver !== 'undefined' && elements.root.value) {
      intersection = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === elements.root.value) intersecting = entry.isIntersecting
        }
        refresh()
      })
      intersection.observe(elements.root.value)
    }
    refresh()
  })

  onDeactivated(() => {
    activated = false
    cancelFrame()
  })

  onActivated(() => {
    activated = true
    if (mounted) refresh()
  })

  onBeforeUnmount(() => {
    mounted = false
    cancelFrame()
    intersection?.disconnect()
    media?.removeEventListener('change', onMotionChange)
    owner?.removeEventListener('visibilitychange', refresh)
  })
}
