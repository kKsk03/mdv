import type { DialogMotion } from './dialog-motion'

interface RailMotionOptions {
  element: () => HTMLElement | null
  scrim?: () => HTMLElement | null
  initiallyExpanded?: boolean
  modal?: boolean
}

/** 同一连续进度驱动宽度和内容，不缩放文字；反转继承当前位置与速度。 */
export function createNavigationRailMotion(options: RailMotionOptions) {
  let position = options.initiallyExpanded ? 1 : 0
  let opacity = position
  let velocity = 0
  let opacityVelocity = 0
  let target = position
  let running: { cancel: () => void; finish: () => void } | undefined

  function write() {
    options.element()?.style.setProperty('--mdv-rail-progress', String(position))
    options.scrim?.()?.style.setProperty('opacity', String(Math.max(0, Math.min(1, opacity))))
  }

  function jump(expanded: boolean) {
    running?.cancel()
    target = position = opacity = expanded ? 1 : 0
    velocity = opacityVelocity = 0
    write()
  }

  function play(expanded: boolean): DialogMotion {
    running?.cancel()
    target = expanded ? 1 : 0
    const view = options.element()?.ownerDocument.defaultView
    if (
      !view?.requestAnimationFrame ||
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      jump(expanded)
      return { finished: Promise.resolve([]), cancel() {}, finish() {} }
    }

    let resolve!: (value: unknown[]) => void
    const finished = new Promise<unknown[]>((done) => {
      resolve = done
    })
    let frame = 0
    let previous: number | undefined
    let elapsed = 0
    let settled = false
    const task = {
      cancel() {
        if (settled) return
        settled = true
        view.cancelAnimationFrame(frame)
        if (running === task) running = undefined
        resolve([])
      },
      finish() {
        if (settled) return
        position = opacity = target
        velocity = opacityVelocity = 0
        write()
        task.cancel()
      },
    }
    running = task

    function step(time: number) {
      if (settled) return
      let remaining =
        previous === undefined ? 1 / 60 : Math.min(0.064, Math.max(0, (time - previous) / 1000))
      previous = time
      elapsed += remaining
      const stiffness = options.modal ? 1400 : 700
      const damping = 2 * 0.9 * Math.sqrt(stiffness)
      // 小步积分避免低帧率或后台恢复时弹簧数值发散。
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 240)
        velocity += ((target - position) * stiffness - damping * velocity) * dt
        position += velocity * dt
        opacityVelocity += ((target - opacity) * 1600 - 80 * opacityVelocity) * dt
        opacity += opacityVelocity * dt
        remaining -= dt
      }
      write()
      if (
        elapsed > 2 ||
        (Math.abs(position - target) < 0.0001 &&
          Math.abs(velocity) < 0.001 &&
          Math.abs(opacity - target) < 0.0001)
      ) {
        task.finish()
      } else frame = view!.requestAnimationFrame(step)
    }
    frame = view.requestAnimationFrame(step)
    return { finished, cancel: task.cancel, finish: task.finish }
  }

  return { play, jump, cancel: () => running?.cancel(), finish: () => running?.finish() }
}
