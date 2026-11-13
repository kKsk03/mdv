interface ToolbarMotionOptions {
  element: () => HTMLElement | null
  leading: () => HTMLElement | null
  trailing: () => HTMLElement | null
  body?: () => HTMLElement | null
  vertical: () => boolean
  expanded: () => boolean
}

/** 改变分组或配套 FAB 操作区的几何尺寸，保留原节点。 */
export function createToolbarMotion(options: ToolbarMotionOptions) {
  let position = options.expanded() ? 1 : 0
  let target = position
  let velocity = 0
  let frame: number | undefined
  let view: Window | null = null

  function measure() {
    const root = options.element()
    const axis = options.vertical() ? 'height' : 'width'
    for (const [name, element] of [
      ['leading', options.leading()],
      ['trailing', options.trailing()],
      ['body', options.body?.()],
    ] as const) {
      const size = element?.getBoundingClientRect()[axis] ?? 0
      root?.style.setProperty(`--mdv-toolbar-${name}-size`, `${Math.max(0, size)}px`)
    }
  }

  function paint() {
    options.element()?.style.setProperty('--mdv-toolbar-expansion', String(Math.max(0, position)))
  }

  function cancel() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    frame = undefined
  }

  function finish() {
    cancel()
    position = target
    velocity = 0
    paint()
    options.element()?.removeAttribute('data-mdv-toolbar-animating')
  }

  function jump(expanded: boolean) {
    target = expanded ? 1 : 0
    finish()
  }

  function play(expanded: boolean) {
    cancel()
    target = expanded ? 1 : 0
    view = options.element()?.ownerDocument.defaultView ?? null
    if (
      !view?.requestAnimationFrame ||
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      (position === target && velocity === 0)
    ) {
      finish()
      return
    }
    measure()
    options.element()?.setAttribute('data-mdv-toolbar-animating', '')
    paint()
    let previous: number | undefined
    let elapsed = 0
    function step(time: number) {
      let remaining =
        previous === undefined ? 1 / 60 : Math.min(0.064, Math.max(0, (time - previous) / 1000))
      previous = time
      elapsed += remaining
      // Expressive FastSpatial；来源与 MIT 许可见 THIRD_PARTY_NOTICES.md。
      const damping = 2 * 0.6 * Math.sqrt(800)
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 240)
        velocity += ((target - position) * 800 - damping * velocity) * dt
        position += velocity * dt
        remaining -= dt
      }
      paint()
      if (elapsed > 2 || (Math.abs(position - target) < 0.0001 && Math.abs(velocity) < 0.001))
        finish()
      else frame = view!.requestAnimationFrame(step)
    }
    frame = view.requestAnimationFrame(step)
  }

  return { play, jump, measure, finish, cancel }
}
