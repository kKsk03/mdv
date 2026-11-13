interface FabMenuMotionOptions {
  element(): HTMLElement | null
  items(): HTMLElement[]
  opened(): boolean
  settled(open: boolean): void
}

/** 逐项空间与透明度分别推进；保留位置、速度以承接快速反向，不缩放文字。 */
export function createFabMenuMotion(options: FabMenuMotionOptions) {
  let progress = 0
  let velocity = 0
  let target = 0
  let frame: number | undefined
  let previous: number | undefined
  let elapsed = 0
  let view: Window | null = null

  function paint() {
    const root = options.element()
    const p = Math.max(0, Math.min(1, progress))
    root?.style.setProperty('--mdv-fab-menu-progress', String(p))
    const items = options.items()
    items.forEach((item, index) => {
      // 最靠近 FAB 的项目先进入，最顶部的项目先退出；延迟通过连续进度而非定时器表达。
      const delay = (items.length - index - 1) * 0.055
      const reveal = Math.max(0, Math.min(1, (p - delay) / Math.max(0.5, 1 - delay)))
      item.style.setProperty('--mdv-fab-menu-reveal', String(reveal))
      item.setAttribute('data-mdv-fab-menu-revealed', String(reveal === 1))
    })
  }
  function cancel() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    frame = previous = undefined
  }
  function finish() {
    cancel()
    progress = target = options.opened() ? 1 : 0
    velocity = 0
    paint()
    options.settled(target === 1)
  }
  function update(jump = false) {
    view = options.element()?.ownerDocument.defaultView ?? null
    target = options.opened() ? 1 : 0
    if (
      jump ||
      !view?.requestAnimationFrame ||
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      finish()
      return
    }
    paint()
    if (frame !== undefined) return
    elapsed = 0
    function step(time: number) {
      let remaining =
        previous === undefined ? 1 / 60 : Math.min(0.064, Math.max(0, (time - previous) / 1000))
      previous = time
      elapsed += remaining
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 240)
        // 本库对 enter／exit 的动效选择；官网 FAB Menu 未公布独立 spring 参数。
        velocity += ((target - progress) * 800 - 2 * 0.8 * Math.sqrt(800) * velocity) * dt
        progress += velocity * dt
        remaining -= dt
      }
      paint()
      if (elapsed > 2 || (Math.abs(target - progress) < 0.001 && Math.abs(velocity) < 0.01))
        finish()
      else frame = view!.requestAnimationFrame(step)
    }
    frame = view.requestAnimationFrame(step)
  }
  function reset() {
    cancel()
    progress = velocity = target = 0
    options.element()?.style.removeProperty('--mdv-fab-menu-progress')
    options.items().forEach((item) => {
      item.style.removeProperty('--mdv-fab-menu-reveal')
      item.removeAttribute('data-mdv-fab-menu-revealed')
    })
  }
  return { update, finish, reset }
}
