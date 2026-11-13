interface FabMotionOptions {
  element: () => HTMLElement | null
  surface: () => HTMLElement | null
  label: () => HTMLElement | null
  icon: () => HTMLElement | null
  expanded: () => boolean
}

/** 几何与透明度分别积分；标签始终留在原按钮内，收合不改变可访问名称。 */
export function createFabMotion(options: FabMotionOptions) {
  let position = options.expanded() ? 1 : 0
  let alpha = position
  let target = position
  let velocity = 0
  let alphaVelocity = 0
  let frame: number | undefined
  let view: Window | null = null
  let full = 0
  let size = 56
  let icon = 24
  let padding = 16

  function paint() {
    const root = options.element()
    const p = Math.min(1, Math.max(0, position))
    root?.style.setProperty(
      '--mdv-fab-width',
      `${Math.max(size, size + (full - size) * Math.max(0, position))}px`,
    )
    root?.style.setProperty(
      '--mdv-fab-leading-space',
      `${(size - icon) / 2 + (padding - (size - icon) / 2) * p}px`,
    )
    root?.style.setProperty('--mdv-fab-label-opacity', String(Math.min(1, Math.max(0, alpha))))
  }
  function measure() {
    const surface = options.surface()
    const label = options.label()
    const root = options.element()
    const hadAnimation = root?.hasAttribute('data-mdv-fab-animating') ?? false
    const collapsed = root?.classList.contains('mdv-extended-fab--collapsed') ?? false
    if (collapsed && !hadAnimation) root?.setAttribute('data-mdv-fab-animating', '')
    const style = surface?.ownerDocument.defaultView?.getComputedStyle(surface)
    size = Number.parseFloat(style?.minBlockSize ?? '') || 56
    padding = Number.parseFloat(style?.paddingInlineEnd ?? '') || 0
    icon = options.icon()?.getBoundingClientRect().width ?? 0
    // 已稳定收合时标签为视觉隐藏；测量瞬间恢复其自然布局，不克隆插槽节点。
    const previous = label?.getAttribute('style')
    if (label) {
      label.style.position = 'static'
      label.style.inlineSize = 'max-content'
    }
    const width = label ? Math.max(label.scrollWidth, label.getBoundingClientRect().width) : 0
    if (label) {
      if (previous === null) label.removeAttribute('style')
      else if (previous !== undefined) label.setAttribute('style', previous)
    }
    if (collapsed && !hadAnimation) root?.removeAttribute('data-mdv-fab-animating')
    const gap = icon ? Number.parseFloat(style?.columnGap ?? '') || 0 : 0
    full = Math.max(size, padding * 2 + icon + gap + width)
    paint()
  }
  function cancel() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    frame = undefined
  }
  function finish() {
    cancel()
    position = alpha = target
    velocity = alphaVelocity = 0
    paint()
    options.element()?.removeAttribute('data-mdv-fab-animating')
  }
  function jump(expanded: boolean) {
    target = expanded ? 1 : 0
    measure()
    finish()
  }
  function play(expanded: boolean) {
    cancel()
    target = expanded ? 1 : 0
    view = options.element()?.ownerDocument.defaultView ?? null
    options.element()?.setAttribute('data-mdv-fab-animating', '')
    measure()
    if (
      !view?.requestAnimationFrame ||
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      (position === target && alpha === target && velocity === 0 && alphaVelocity === 0)
    ) {
      finish()
      return
    }
    let previous: number | undefined
    let elapsed = 0
    function step(time: number) {
      let remaining =
        previous === undefined ? 1 / 60 : Math.min(0.064, Math.max(0, (time - previous) / 1000))
      previous = time
      elapsed += remaining
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 240)
        // m3ui Expressive FastSpatial / FastEffects，MIT 来源见第三方说明。
        velocity += ((target - position) * 800 - 2 * 0.6 * Math.sqrt(800) * velocity) * dt
        position += velocity * dt
        alphaVelocity += ((target - alpha) * 3800 - 2 * Math.sqrt(3800) * alphaVelocity) * dt
        alpha += alphaVelocity * dt
        remaining -= dt
      }
      paint()
      if (
        elapsed > 2 ||
        (Math.abs(position - target) < 0.0001 &&
          Math.abs(velocity) < 0.001 &&
          Math.abs(alpha - target) < 0.0001 &&
          Math.abs(alphaVelocity) < 0.001)
      )
        finish()
      else frame = view!.requestAnimationFrame(step)
    }
    frame = view.requestAnimationFrame(step)
  }
  return { measure, play, jump, finish, cancel }
}
