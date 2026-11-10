export interface TooltipMotion {
  finished: Promise<void>
  cancel: () => void
}

export function animateTooltip(
  element: HTMLElement,
  opening: boolean,
  previous?: TooltipMotion,
): TooltipMotion {
  const view = element.ownerDocument.defaultView
  const current = previous && view?.getComputedStyle(element)
  const start = current
    ? { opacity: current.opacity, transform: current.transform }
    : { opacity: opening ? '0' : '1', transform: opening ? 'scale(0.96)' : 'none' }
  previous?.cancel()
  if (
    view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    typeof element.animate !== 'function'
  )
    return { finished: Promise.resolve(), cancel() {} }
  const animation = element.animate(
    [start, { opacity: opening ? '1' : '0', transform: opening ? 'none' : 'scale(0.96)' }],
    { duration: opening ? 150 : 100, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'both' },
  )
  return {
    finished: animation.finished.then(
      () => {},
      () => {},
    ),
    cancel: () => animation.cancel(),
  }
}
