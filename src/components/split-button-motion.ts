import type { MdvButtonSize } from './button.types'

// 官网 Split Button 测量图及 TOKEN_TABLE.624e8f2da4007fc8；单位 px 对应 dp。
export const splitButtonSizes = {
  xs: { height: 32, width: 48, icon: 22, start: 12, end: 10, inner: 4, active: 8, shift: 1 },
  s: { height: 40, width: 48, icon: 22, start: 16, end: 12, inner: 4, active: 12, shift: 1 },
  m: { height: 56, width: 56, icon: 26, start: 24, end: 24, inner: 4, active: 12, shift: 2 },
  l: { height: 96, width: 96, icon: 38, start: 48, end: 48, inner: 8, active: 20, shift: 3 },
  xl: { height: 136, width: 136, icon: 50, start: 64, end: 64, inner: 12, active: 20, shift: 6 },
} as const

interface SplitMotionOptions {
  element(): HTMLElement | null
  action(): HTMLElement | null
  menu(): HTMLElement | null
  size(): MdvButtonSize
  expanded(): boolean
  actionActive(): boolean
  menuActive(): boolean
}

/** Standard FastSpatial；两侧圆角、箭头角度及光学位移独立保速。 */
export function createSplitButtonMotion(options: SplitMotionOptions) {
  let position: number[] = []
  let velocity: number[] = []
  let target: number[] = []
  let frame: number | undefined
  let view: Window | null = null
  let actionOuter = 0
  let menuOuter = 0

  function targets() {
    const root = options.element()
    view = root?.ownerDocument.defaultView ?? null
    const size = splitButtonSizes[options.size()]
    const style = root && view?.getComputedStyle(root)
    function value(name: string, fallback: number) {
      const parsed = Number.parseFloat(style?.getPropertyValue(name) ?? '')
      return Number.isFinite(parsed) ? parsed : fallback
    }
    const inner = value('--mdv-split-inner', size.inner)
    const active = value('--mdv-split-active', size.active)
    const action = options.action()?.getBoundingClientRect()
    const menu = options.menu()?.getBoundingClientRect()
    // 过大的单侧圆角会触发 CSS 比例缩放，连带把另一侧的小圆角压成近似直角。
    actionOuter = Math.min(action?.width || size.height, action?.height || size.height) / 2
    menuOuter = Math.min(menu?.width || size.width, menu?.height || size.height) / 2
    target = [
      options.actionActive() ? active : inner,
      options.expanded() ? menuOuter : options.menuActive() ? active : inner,
      options.expanded() ? 180 : 0,
      options.expanded() ? 0 : -value('--mdv-split-shift', size.shift),
    ]
  }
  function paint() {
    const root = options.element()
    root?.style.setProperty('--mdv-split-action-outer-radius', `${actionOuter}px`)
    root?.style.setProperty('--mdv-split-menu-outer-radius', `${menuOuter}px`)
    root?.style.setProperty('--mdv-split-action-radius', `${Math.max(0, position[0]!)}px`)
    root?.style.setProperty('--mdv-split-menu-radius', `${Math.max(0, position[1]!)}px`)
    root?.style.setProperty('--mdv-split-angle', `${position[2]}deg`)
    root?.style.setProperty('--mdv-split-offset', `${position[3]}px`)
  }
  function cancel() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    frame = undefined
  }
  function finish() {
    cancel()
    targets()
    position = [...target]
    velocity = target.map(() => 0)
    paint()
  }
  function update(jump = false) {
    targets()
    if (
      jump ||
      !position.length ||
      !view?.requestAnimationFrame ||
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      finish()
      return
    }
    paint()
    if (
      frame !== undefined ||
      target.every((value, i) => value === position[i] && velocity[i] === 0)
    )
      return
    let previous: number | undefined
    let elapsed = 0
    function step(time: number) {
      let remaining =
        previous === undefined ? 1 / 60 : Math.min(0.064, Math.max(0, (time - previous) / 1000))
      previous = time
      elapsed += remaining
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 240)
        position.forEach((value, i) => {
          velocity[i] =
            velocity[i]! +
            ((target[i]! - value) * 1400 - 2 * 0.9 * Math.sqrt(1400) * velocity[i]!) * dt
          position[i] = value + velocity[i]! * dt
        })
        remaining -= dt
      }
      paint()
      if (
        elapsed > 2 ||
        target.every(
          (value, i) => Math.abs(value - position[i]!) < 0.001 && Math.abs(velocity[i]!) < 0.01,
        )
      )
        finish()
      else frame = view!.requestAnimationFrame(step)
    }
    frame = view.requestAnimationFrame(step)
  }
  function reset() {
    cancel()
    position = velocity = target = []
    for (const name of [
      'action-outer-radius',
      'menu-outer-radius',
      'action-radius',
      'menu-radius',
      'angle',
      'offset',
    ])
      options.element()?.style.removeProperty(`--mdv-split-${name}`)
  }
  return { update, finish, reset }
}
