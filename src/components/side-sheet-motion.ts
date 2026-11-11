import type { DialogMotion } from './dialog-motion'

interface Position {
  progress: number
  opacity: number
}

interface Sample extends Position {
  time: number
}

interface SideSheetMotionOptions {
  panel: () => HTMLElement | null
  scrim?: () => HTMLElement | null
  track?: () => HTMLElement | null
  direction: () => 1 | -1
  initiallyOpen?: boolean
}

/** 面板横移、Standard 布局占位、遮罩分别播放；不会缩放或淡出正文。 */
export function createSideSheetMotion(options: SideSheetMotionOptions) {
  let position: Position = {
    progress: options.initiallyOpen ? 1 : 0,
    opacity: options.initiallyOpen ? 1 : 0,
  }
  let active:
    | { animations: Animation[]; samples: Sample[]; target: Position; motion: DialogMotion }
    | undefined

  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  const transform = (progress: number) =>
    `translateX(${options.direction() * (1 - progress) * 100}%)`
  const size = (progress: number) => `calc(var(--mdv-side-sheet-extent) * ${clamp(progress)})`

  function write(value: Position) {
    const panel = options.panel()
    if (panel) panel.style.transform = transform(value.progress)
    const scrim = options.scrim?.()
    if (scrim) scrim.style.opacity = String(clamp(value.opacity))
    const track = options.track?.()
    if (track) track.style.inlineSize = size(value.progress)
  }

  function current(): Position {
    if (!active) return { ...position }
    const time = Number(active.animations[0]?.currentTime ?? 0)
    const samples = active.samples
    const end = samples[samples.length - 1]!
    if (time >= end.time) return { ...active.target }
    const index = Math.max(0, Math.min(samples.length - 2, Math.floor(time / (1000 / 120))))
    const a = samples[index]!
    const b = samples[index + 1]!
    const fraction = Math.max(0, Math.min(1, (time - a.time) / (b.time - a.time)))
    return {
      progress: a.progress + (b.progress - a.progress) * fraction,
      opacity: a.opacity + (b.opacity - a.opacity) * fraction,
    }
  }

  function stop() {
    if (!active) return
    position = current()
    const previous = active
    active = undefined
    write(position)
    previous.animations.forEach((animation) => animation.cancel())
  }

  function jump(open: boolean) {
    stop()
    position = { progress: open ? 1 : 0, opacity: open ? 1 : 0 }
    write(position)
  }

  function drag(progress: number) {
    stop()
    position.progress = clamp(progress)
    write(position)
  }

  function play(open: boolean, velocity = 0): DialogMotion {
    stop()
    const panel = options.panel()
    const target: Position = { progress: open ? 1 : 0, opacity: open ? 1 : 0 }
    const from = { ...position }
    position = target
    write(target)
    const reduced = panel?.ownerDocument.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!panel || typeof panel.animate !== 'function' || reduced) {
      return { finished: Promise.resolve([]), cancel() {}, finish() {} }
    }

    // 与 Material／m3ui 一致的 spatial、effects 分离；退出使用更快的临界阻尼。
    const stiffness = open ? 700 : 3800
    const damping = 2 * (open ? 0.9 : 1) * Math.sqrt(stiffness)
    const values = { ...from }
    const speeds: Position = { progress: velocity, opacity: 0 }
    const samples: Sample[] = [{ ...from, time: 0 }]
    for (let frame = 1; frame <= 360; frame++) {
      for (const key of ['progress', 'opacity'] as const) {
        const k = key === 'opacity' ? 1600 : stiffness
        const c = key === 'opacity' ? 2 * Math.sqrt(k) : damping
        for (let step = 0; step < 2; step++) {
          speeds[key] += (-k * (values[key] - target[key]) - c * speeds[key]) / 240
          values[key] += speeds[key] / 240
        }
      }
      samples.push({ ...values, time: (frame * 1000) / 120 })
      if (
        Math.abs(values.progress - target.progress) < 0.0001 &&
        Math.abs(values.opacity - target.opacity) < 0.001 &&
        Math.abs(speeds.progress) < 0.001 &&
        Math.abs(speeds.opacity) < 0.01
      )
        break
    }
    const duration = samples[samples.length - 1]!.time
    samples[samples.length - 1] = { ...target, time: duration }
    const timing: KeyframeAnimationOptions = { duration, easing: 'linear', fill: 'both' }
    const animations: Animation[] = []
    if (from.progress !== target.progress) {
      animations.push(
        panel.animate(
          samples.map((sample) => ({
            transform: transform(sample.progress),
            offset: sample.time / duration,
          })),
          timing,
        ),
      )
      const track = options.track?.()
      if (typeof track?.animate === 'function') {
        animations.push(
          track.animate(
            samples.map((sample) => ({
              inlineSize: size(sample.progress),
              offset: sample.time / duration,
            })),
            timing,
          ),
        )
      }
    }
    const scrim = options.scrim?.()
    if (from.opacity !== target.opacity && typeof scrim?.animate === 'function') {
      animations.push(
        scrim.animate(
          samples.map((sample) => ({
            opacity: clamp(sample.opacity),
            offset: sample.time / duration,
          })),
          timing,
        ),
      )
    }
    const motion: DialogMotion = {
      finished: Promise.all(animations.map((animation) => animation.finished.catch(() => {}))),
      cancel() {
        if (active?.motion === motion) stop()
      },
      finish() {
        if (active?.motion !== motion) return
        animations.forEach((animation) => animation.finish())
      },
    }
    if (animations.length) {
      active = { animations, samples, target, motion }
      void motion.finished.then(() => {
        if (active?.motion !== motion) return
        active = undefined
        position = { ...target }
        write(position)
        animations.forEach((animation) => animation.cancel())
      })
    }
    return motion
  }

  return { current, stop, jump, drag, play }
}

/** 逻辑位置与继承的 direction 一起确定物理滑出方向。 */
export function sideSheetDirection(
  element: HTMLElement | null,
  placement: 'start' | 'end',
): 1 | -1 {
  const rtl = element?.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
  return (placement === 'end') !== rtl ? 1 : -1
}
