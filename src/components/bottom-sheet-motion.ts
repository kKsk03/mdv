import type { DialogMotion } from './dialog-motion'

interface Position {
  height: number
  offset: number
  opacity: number
}

interface Sample extends Position {
  time: number
}

/** 独立采样弹簧，以 Web Animations 播放；手势期间才直接写入尺寸。 */
export function createBottomSheetMotion(
  panel: () => HTMLElement | null,
  scrim: () => HTMLElement | null,
) {
  let position: Position = { height: 0, offset: 0, opacity: 0 }
  let active:
    | { animations: Animation[]; samples: Sample[]; target: Position; motion: DialogMotion }
    | undefined

  function write(value: Position) {
    const element = panel()
    if (element) {
      element.style.setProperty('--mdv-bottom-sheet-height', `${Math.max(0, value.height)}px`)
      element.style.transform = `translateY(${Math.max(0, value.offset)}px)`
    }
    const overlay = scrim()
    if (overlay) overlay.style.opacity = String(Math.max(0, Math.min(1, value.opacity)))
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
    const t = Math.max(0, Math.min(1, (time - a.time) / (b.time - a.time)))
    return {
      height: a.height + (b.height - a.height) * t,
      offset: a.offset + (b.offset - a.offset) * t,
      opacity: a.opacity + (b.opacity - a.opacity) * t,
    }
  }

  function stop() {
    if (!active) return
    position = current()
    const old = active
    active = undefined
    write(position)
    old.animations.forEach((animation) => animation.cancel())
  }

  function jump(value: Position) {
    stop()
    position = { ...value }
    write(position)
  }

  function play(target: Position, velocity = 0, hiding = false): DialogMotion {
    stop()
    const element = panel()
    const from = { ...position }
    position = { ...target }
    write(position)
    const reduced = element?.ownerDocument.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!element || typeof element.animate !== 'function' || reduced) {
      return { finished: Promise.resolve([]), cancel() {}, finish() {} }
    }
    // 参考 Material 的 spatial／effects 分离：内容只位移与变高，不整体淡入。
    const stiffness = hiding ? 3800 : 700
    const damping = 2 * (hiding ? 1 : 0.9) * Math.sqrt(stiffness)
    const values = { ...from }
    const speeds: Position = { height: velocity, offset: 0, opacity: 0 }
    const samples: Sample[] = [{ ...from, time: 0 }]
    for (let frame = 1; frame <= 360; frame++) {
      for (const key of ['height', 'offset', 'opacity'] as const) {
        const k = key === 'opacity' ? 1600 : stiffness
        const c = key === 'opacity' ? 2 * Math.sqrt(k) : damping
        // 两个小步避免快速退出弹簧在低采样率下失稳。
        for (let step = 0; step < 2; step++) {
          speeds[key] += (-k * (values[key] - target[key]) - c * speeds[key]) / 240
          values[key] += speeds[key] / 240
        }
      }
      samples.push({ ...values, time: (frame * 1000) / 120 })
      if (
        Math.abs(values.height - target.height) < 0.1 &&
        Math.abs(values.offset - target.offset) < 0.1 &&
        Math.abs(values.opacity - target.opacity) < 0.001 &&
        Math.abs(speeds.height) < 1 &&
        Math.abs(speeds.offset) < 1 &&
        Math.abs(speeds.opacity) < 0.01
      )
        break
    }
    const duration = samples[samples.length - 1]!.time
    samples[samples.length - 1] = { ...target, time: duration }
    const animations = [
      element.animate(
        samples.map((sample) => ({
          height: `${Math.max(0, sample.height)}px`,
          transform: `translateY(${Math.max(0, sample.offset)}px)`,
          offset: sample.time / duration,
        })),
        { duration, easing: 'linear', fill: 'both' },
      ),
    ]
    const overlay = scrim()
    if (typeof overlay?.animate === 'function') {
      animations.push(
        overlay.animate(
          samples.map((sample) => ({
            opacity: Math.max(0, Math.min(1, sample.opacity)),
            offset: sample.time / duration,
          })),
          { duration, easing: 'linear', fill: 'both' },
        ),
      )
    }
    const motion: DialogMotion = {
      finished: Promise.all(animations.map((animation) => animation.finished.catch(() => {}))),
      cancel() {
        if (active?.motion === motion) stop()
        else animations.forEach((animation) => animation.cancel())
      },
      finish() {
        if (active?.motion !== motion) return
        write(target)
        animations.forEach((animation) => animation.finish())
      },
    }
    active = { animations, samples, target, motion }
    void motion.finished.then(() => {
      if (active?.motion !== motion) return
      active = undefined
      position = { ...target }
      write(position)
      animations.forEach((animation) => animation.cancel())
    })
    return motion
  }

  return { current, jump, play, stop, finish: () => active?.motion.finish() }
}
