import type { DialogAnimator } from './dialog-motion'

/** Contained 使用官网 .9 / 1400 弹簧；仅改变容器几何，不缩放文字。 */
export function createSearchAnimator(anchor: () => HTMLElement | null): DialogAnimator {
  let progress = 0
  let velocity = 0
  return (elements, entering, previous) => {
    const interrupted = !!previous
    previous?.cancel()
    const { container, content, scrim } = elements
    const view = container.ownerDocument.defaultView!
    if (!interrupted) {
      progress = entering ? 0 : 1
      velocity = 0
    }
    const box = anchor()?.getBoundingClientRect()
    const target = container.getBoundingClientRect()
    const dx = box ? box.left - target.left : 0
    const dy = box ? box.top - target.top : 0
    const startWidth = box ? Math.min(box.width, target.width) : target.width
    const startHeight = box?.height ?? 56
    const destination = entering ? 1 : 0
    let frame: number | undefined
    let last = 0
    let resolve!: () => void
    const finished = new Promise<void>((done) => {
      resolve = done
    })
    function paint() {
      const p = Math.max(0, Math.min(1, progress))
      container.style.transform = `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px)`
      container.style.setProperty(
        '--mdv-search-motion-width',
        `${startWidth + (target.width - startWidth) * p}px`,
      )
      container.style.setProperty(
        '--mdv-search-motion-height',
        `${startHeight + (target.height - startHeight) * p}px`,
      )
      content.style.opacity = String(p)
      scrim.style.opacity = String(p)
    }
    function clear() {
      container.style.removeProperty('transform')
      container.style.removeProperty('--mdv-search-motion-width')
      container.style.removeProperty('--mdv-search-motion-height')
      content.style.removeProperty('opacity')
      scrim.style.removeProperty('opacity')
    }
    function cancel() {
      if (frame !== undefined) view.cancelAnimationFrame(frame)
      frame = undefined
      clear()
      resolve()
    }
    function finish() {
      progress = destination
      velocity = 0
      paint()
      if (frame !== undefined) view.cancelAnimationFrame(frame)
      frame = undefined
      resolve()
    }
    function tick(now: number) {
      let dt = last ? Math.min((now - last) / 1000, 0.064) : 1 / 60
      last = now
      while (dt > 0) {
        const step = Math.min(dt, 1 / 240)
        velocity += (-1400 * (progress - destination) - 2 * 0.9 * Math.sqrt(1400) * velocity) * step
        progress += velocity * step
        dt -= step
      }
      paint()
      if (Math.abs(progress - destination) < 0.001 && Math.abs(velocity) < 0.001) finish()
      else frame = view.requestAnimationFrame(tick)
    }
    if (typeof container.animate !== 'function' || !view.requestAnimationFrame) finish()
    else {
      paint()
      frame = view.requestAnimationFrame(tick)
    }
    return { finished: finished.then(() => []), cancel, finish }
  }
}
