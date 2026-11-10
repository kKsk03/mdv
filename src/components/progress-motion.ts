import { onActivated, onBeforeUnmount, onDeactivated, onMounted, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import {
  drawProgress,
  indeterminateCircle,
  progressAmplitude,
  progressEasing,
} from './progress-geometry'
import type { ProgressFrame, ProgressOptions } from './progress-geometry'

interface ProgressElements {
  graphic: Readonly<Ref<SVGSVGElement | null>>
  active: Readonly<Ref<SVGPathElement | null>>
  track: Readonly<Ref<SVGPathElement | null>>
  stop: Readonly<Ref<SVGCircleElement | null>>
}

interface Tween {
  from: number
  to: number
  start: number
  ease: (fraction: number) => number
}

export function initialProgressFrame(options: ProgressOptions): ProgressFrame {
  return {
    progress: options.progress,
    amplitude: progressAmplitude(options),
    phase: 0,
    elapsed: 0,
    rotation: 0,
  }
}

/** One clock for progress, amplitude and phase; no reactive Vue updates on animation frames. */
export function useProgressMotion(
  options: ComputedRef<ProgressOptions>,
  elements: ProgressElements,
) {
  const frame = initialProgressFrame(options.value)
  const linear = (fraction: number) => fraction
  const standard = (fraction: number) => progressEasing(fraction, 0.2, 0, 0, 1)
  const accelerate = (fraction: number) => progressEasing(fraction, 0.3, 0, 0.8, 0.15)
  let valueTween: Tween | null = null
  let amplitudeTween: Tween | null = null
  let rotationTween: Tween | null = null
  let width = 240
  let frameId: number | null = null
  let lastTime: number | null = null
  let mounted = false
  let activated = true
  let intersecting = true
  let reducedMotion = false
  let media: MediaQueryList | undefined
  let resize: ResizeObserver | undefined
  let intersection: IntersectionObserver | undefined

  function sample(tween: Tween | null, now: number, fallback: number) {
    if (!tween) return fallback
    const fraction = Math.max(0, Math.min(1, (now - tween.start) / 500))
    return tween.from + (tween.to - tween.from) * tween.ease(fraction)
  }

  function updateTweens(now: number) {
    frame.progress = sample(valueTween, now, frame.progress)
    frame.amplitude = sample(amplitudeTween, now, frame.amplitude)
    frame.rotation = sample(rotationTween, now, frame.rotation)
    if (valueTween && now - valueTween.start >= 500) valueTween = null
    if (amplitudeTween && now - amplitudeTween.start >= 500) amplitudeTween = null
    if (rotationTween && now - rotationTween.start >= 500) {
      rotationTween = null
      frame.rotation = 0
    }
  }

  function paint() {
    const drawing = drawProgress(options.value, frame, width)
    elements.graphic.value?.setAttribute('viewBox', `0 0 ${drawing.width} ${drawing.height}`)
    elements.graphic.value?.setAttribute('stroke-width', String(drawing.thickness))
    elements.active.value?.setAttribute('d', drawing.active)
    elements.track.value?.setAttribute('d', drawing.track)
    elements.stop.value?.setAttribute('cx', String(drawing.stopX))
    elements.stop.value?.setAttribute('cy', String(drawing.height / 2))
    elements.stop.value?.setAttribute('r', String(drawing.stopRadius))
  }

  function cancelFrame() {
    if (frameId !== null) window.cancelAnimationFrame(frameId)
    frameId = null
    lastTime = null
  }

  function canAnimate() {
    return (
      mounted &&
      activated &&
      intersecting &&
      !reducedMotion &&
      document.visibilityState !== 'hidden'
    )
  }

  function needsAnimation() {
    return (
      !!valueTween ||
      !!amplitudeTween ||
      !!rotationTween ||
      options.value.indeterminate ||
      (options.value.wavy && frame.amplitude > 0)
    )
  }

  function schedule() {
    if (!needsAnimation()) {
      lastTime = null
      return
    }
    if (frameId === null && canAnimate() && typeof window.requestAnimationFrame === 'function') {
      frameId = window.requestAnimationFrame(tick)
    }
  }

  function tick(now: number) {
    frameId = null
    if (!canAnimate()) {
      lastTime = null
      return
    }
    const dt = lastTime === null ? 0 : Math.min(64, Math.max(0, now - lastTime))
    lastTime = now
    frame.elapsed += dt
    frame.phase = (frame.phase + (dt / 1000) * Math.PI * 2) % (Math.PI * 2)
    updateTweens(now)
    paint()
    schedule()
  }

  function snap() {
    frame.progress = options.value.progress
    frame.amplitude = progressAmplitude(options.value)
    frame.rotation = 0
    valueTween = amplitudeTween = rotationTween = null
    if (options.value.indeterminate) frame.elapsed = options.value.kind === 'linear' ? 875 : 1500
  }

  function refreshMotion() {
    cancelFrame()
    if (reducedMotion || typeof window.requestAnimationFrame !== 'function') snap()
    else updateTweens(performance.now())
    paint()
    schedule()
  }

  function measure() {
    const measuredWidth = elements.graphic.value?.getBoundingClientRect().width
    if (measuredWidth && Number.isFinite(measuredWidth)) width = measuredWidth
    paint()
  }

  function onMotionChange(event: MediaQueryListEvent) {
    reducedMotion = event.matches
    refreshMotion()
  }

  watch(
    options,
    (next, previous) => {
      if (!mounted) return
      const now = performance.now()
      updateTweens(now)
      if (next.indeterminate !== previous.indeterminate) {
        if (next.indeterminate) {
          frame.elapsed = 0
          frame.rotation = 0
          valueTween = rotationTween = null
        } else {
          const circle = indeterminateCircle(frame.elapsed)
          frame.progress = next.kind === 'circular' ? circle.progress : 0
          frame.rotation = next.kind === 'circular' ? circle.rotation % (Math.PI * 2) : 0
          rotationTween = frame.rotation
            ? { from: frame.rotation, to: Math.PI * 2, start: now, ease: standard }
            : null
        }
      }
      if (!next.indeterminate && valueTween?.to !== next.progress) {
        valueTween =
          frame.progress === next.progress
            ? null
            : {
                from: frame.progress,
                to: next.progress,
                start: now,
                ease: next.wavy ? linear : standard,
              }
      }
      const amplitude = progressAmplitude(next)
      if (!next.wavy) {
        frame.amplitude = 0
        amplitudeTween = null
      } else if (amplitudeTween?.to !== amplitude) {
        amplitudeTween =
          frame.amplitude === amplitude
            ? null
            : {
                from: frame.amplitude,
                to: amplitude,
                start: now,
                ease: amplitude > frame.amplitude ? standard : accelerate,
              }
      }
      if (reducedMotion || typeof window.requestAnimationFrame !== 'function') snap()
      measure()
      schedule()
    },
    { flush: 'post' },
  )

  onMounted(() => {
    mounted = true
    media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    reducedMotion = media?.matches === true
    media?.addEventListener('change', onMotionChange)
    document.addEventListener('visibilitychange', refreshMotion)
    if (typeof ResizeObserver !== 'undefined' && elements.graphic.value) {
      resize = new ResizeObserver(measure)
      resize.observe(elements.graphic.value)
    }
    if (typeof IntersectionObserver !== 'undefined' && elements.graphic.value) {
      intersection = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === elements.graphic.value) intersecting = entry.isIntersecting
        }
        refreshMotion()
      })
      intersection.observe(elements.graphic.value)
    }
    measure()
    refreshMotion()
  })

  onDeactivated(() => {
    activated = false
    cancelFrame()
  })
  onActivated(() => {
    activated = true
    if (mounted) refreshMotion()
  })
  onBeforeUnmount(() => {
    mounted = false
    cancelFrame()
    resize?.disconnect()
    intersection?.disconnect()
    media?.removeEventListener('change', onMotionChange)
    document.removeEventListener('visibilitychange', refreshMotion)
  })
}
