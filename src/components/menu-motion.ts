export interface MenuMotion {
  finished: Promise<void>
  cancel: () => void
}

/** 在原生 top layer 内做局部动效；反向时从当前可见帧开始。 */
export function animateMenu(
  element: HTMLElement,
  opening: boolean,
  push: boolean,
  rtl: boolean,
  previous?: MenuMotion,
): MenuMotion {
  const view = element.ownerDocument.defaultView
  const reduced = view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const current = previous && view?.getComputedStyle(element)
  const start = current
    ? { transform: current.transform, opacity: current.opacity }
    : {
        transform: opening ? (push ? `translateX(${rtl ? -30 : 30}px)` : 'scale(0.8)') : 'none',
        opacity: opening ? '0' : '1',
      }
  previous?.cancel()
  if (reduced || typeof element.animate !== 'function') {
    return { finished: Promise.resolve(), cancel() {} }
  }
  const end = {
    transform: opening ? 'none' : push ? `translateX(${rtl ? -30 : 30}px)` : 'scale(0.8)',
    opacity: opening ? '1' : '0',
  }
  const animation = element.animate([start, end], {
    duration: opening ? 200 : 130,
    easing: opening ? 'cubic-bezier(0.2, 0, 0, 1)' : 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    fill: 'both',
  })
  return {
    finished: animation.finished.then(
      () => {},
      () => {},
    ),
    cancel: () => animation.cancel(),
  }
}
