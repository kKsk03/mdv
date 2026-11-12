import type { MdvAppBarScrollBehavior } from './app-bar.types'

interface AppBarScrollOptions {
  view: () => Window | null
  behavior: () => MdvAppBarScrollBehavior
  heights: () => { expanded: number; compact: number }
  update: (collapse: number, hidden: number, colorProgress: number) => void
}

/** 与 m3ui 一致的 FastOutLinearIn (.4, 0, 1, 1)，输入为滚动比例而非时间。 */
function colorEasing(fraction: number) {
  if (fraction <= 0) return 0
  if (fraction >= 1) return 1
  let low = 0
  let high = 1
  for (let i = 0; i < 16; i++) {
    const t = (low + high) / 2
    const x = 1.2 * t + 0.6 * t * t - 0.8 * t * t * t
    if (x < fraction) low = t
    else high = t
  }
  const t = (low + high) / 2
  return (3 - 2 * t) * t * t
}

/** 滚动只改变视觉偏移，布局始终保留展开高度，避免正文反过来改变 scrollTop。 */
export function createAppBarScroll(options: AppBarScrollOptions) {
  let offset = 0
  let lastScroll = 0
  let focused = false
  let timer: number | undefined
  let frame: number | undefined
  let velocity = 0

  const range = () => Math.max(0, options.heights().expanded - options.heights().compact)
  const limit = () => (options.behavior() === 'enter-always' ? options.heights().expanded : range())

  function write() {
    const collapse = Math.min(range(), offset)
    const behavior = options.behavior()
    const followsCollapse =
      range() > 0 && (behavior === 'exit-until-collapsed' || behavior === 'enter-always')
    // 两行随收合逐步混色；单行／固定栏随一个操作行高度的滚动距离混色。
    const fraction = followsCollapse
      ? collapse / range()
      : lastScroll / Math.max(1, options.heights().compact)
    options.update(collapse, Math.max(0, offset - collapse), colorEasing(fraction))
  }

  function stop() {
    const view = options.view()
    if (timer !== undefined) view?.clearTimeout(timer)
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    timer = frame = undefined
    velocity = 0
  }

  function settle() {
    stop()
    if (focused || options.behavior() !== 'enter-always') return
    // 两行先收合到 Small，再隐藏操作行；每段均吸附到最近的端点。
    const boundary = offset <= range() ? range() : limit()
    const start = offset <= range() ? 0 : range()
    const target = offset - start < (boundary - start) / 2 ? start : boundary
    if (offset === target) return
    const view = options.view()
    if (
      !view?.requestAnimationFrame ||
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      offset = target
      write()
      return
    }
    let previous: number | undefined
    let elapsed = 0
    function step(time: number) {
      let remaining =
        previous === undefined ? 1 / 60 : Math.min(0.064, Math.max(0, (time - previous) / 1000))
      previous = time
      elapsed += remaining
      // m3ui DefaultEffects：临界阻尼、刚度 1600；小步积分避免低帧率发散。
      while (remaining > 0) {
        const dt = Math.min(remaining, 0.004)
        velocity += ((target - offset) * 1600 - 80 * velocity) * dt
        offset += velocity * dt
        remaining -= dt
      }
      offset = Math.min(limit(), Math.max(0, offset))
      if (elapsed > 2 || (Math.abs(target - offset) < 0.1 && Math.abs(velocity) < 1)) {
        offset = target
        frame = undefined
        velocity = 0
        write()
      } else {
        write()
        frame = view!.requestAnimationFrame(step)
      }
    }
    frame = view.requestAnimationFrame(step)
  }

  function scroll(value: number) {
    const y = Number.isFinite(value) ? Math.max(0, value) : 0
    const delta = y - lastScroll
    lastScroll = y
    stop()
    if (focused) {
      write()
      return
    }
    if (options.behavior() === 'exit-until-collapsed') offset = Math.min(range(), y)
    else if (options.behavior() === 'enter-always') {
      offset = y === 0 ? 0 : Math.max(0, Math.min(limit(), offset + delta))
      if (delta) timer = options.view()?.setTimeout(settle, 150)
    } else offset = 0
    write()
  }

  function reset(y: number) {
    stop()
    lastScroll = Number.isFinite(y) ? Math.max(0, y) : 0
    offset =
      !focused && options.behavior() === 'exit-until-collapsed' ? Math.min(range(), lastScroll) : 0
    write()
  }

  function resize() {
    stop()
    if (options.behavior() === 'exit-until-collapsed' && !focused)
      offset = Math.min(range(), lastScroll)
    else offset = Math.max(0, Math.min(limit(), offset))
    write()
  }

  function focus(value: boolean) {
    focused = value
    stop()
    if (value) offset = 0
    else if (options.behavior() === 'exit-until-collapsed') offset = Math.min(range(), lastScroll)
    write()
  }

  return { scroll, reset, resize, focus, stop, settle }
}
