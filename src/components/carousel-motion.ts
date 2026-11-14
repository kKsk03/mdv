/* Copyright (c) 2026 Fadel, MIT; adapted for MDV. Full notice: ../../THIRD_PARTY_NOTICES.md.
 * https://github.com/SrWither/m3ui-vue/blob/main/src/components/MCarousel.vue
 */
/** 临界阻尼与惯性参数参考 MCarousel；不是独立的官方 Carousel 令牌。 */
export function createCarouselMotion(options: {
  view: Window
  read: () => number
  write: (value: number) => void
  max: () => number
}) {
  let frame: number | undefined
  let velocity = 0
  let previous = 0
  let animation:
    | { kind: 'spring'; target: number; done: () => void }
    | { kind: 'decay'; done: () => void }
    | undefined
  const clamp = (value: number) => Math.max(0, Math.min(options.max(), value))

  function stop() {
    if (frame !== undefined) options.view.cancelAnimationFrame(frame)
    frame = undefined
    animation = undefined
    velocity = 0
  }
  function step(now: number) {
    frame = undefined
    const current = animation
    if (!current) return
    const dt = Math.min(Math.max(0.001, (now - previous) / 1000), 1 / 30)
    previous = now
    let position = options.read()
    if (current.kind === 'spring') {
      for (let remaining = dt; remaining > 0; remaining -= 0.004) {
        const sub = Math.min(remaining, 0.004)
        velocity += (-400 * (position - current.target) - 40 * velocity) * sub
        position += velocity * sub
      }
      if (Math.abs(position - current.target) < 0.25 && Math.abs(velocity) < 5) {
        position = current.target
        animation = undefined
      }
    } else {
      velocity *= Math.exp(-4 * dt)
      position += velocity * dt
      if (position !== clamp(position) || Math.abs(velocity) < 15) animation = undefined
    }
    options.write(clamp(position))
    if (animation) frame = options.view.requestAnimationFrame(step)
    else {
      velocity = 0
      current.done()
    }
  }
  function start(next: NonNullable<typeof animation>) {
    animation = next
    if (frame !== undefined) return
    previous = options.view.performance.now()
    frame = options.view.requestAnimationFrame(step)
  }
  function springTo(target: number, done: () => void, initialVelocity?: number) {
    if (initialVelocity !== undefined) velocity = initialVelocity
    const destination = clamp(target)
    if (
      !options.view.requestAnimationFrame ||
      (Math.abs(destination - options.read()) < 0.25 && Math.abs(velocity) < 5)
    ) {
      stop()
      options.write(destination)
      done()
      return
    }
    start({ kind: 'spring', target: destination, done })
  }
  function coast(initialVelocity: number, done: () => void) {
    stop()
    velocity = initialVelocity
    if (!options.view.requestAnimationFrame || Math.abs(velocity) < 15) {
      done()
      return
    }
    start({ kind: 'decay', done })
  }
  return { stop, springTo, coast }
}
