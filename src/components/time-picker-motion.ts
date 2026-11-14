import { animateBasicDialog } from './dialog-motion'
import type { DialogAnimator } from './dialog-motion'

/** 复用普通 Dialog 时序；整张内容随背景生长裁切，底部操作不会提前显露。 */
export const animateTimePicker: DialogAnimator = (elements, entering, previous) => {
  const sheet = elements.container.querySelector<HTMLElement>('.mdv-time-picker__sheet')
  const view = elements.container.ownerDocument.defaultView
  const sampled = previous && sheet ? view?.getComputedStyle(sheet).clipPath : undefined
  const basic = animateBasicDialog(elements, entering, previous)
  if (!sheet?.animate) return basic
  const style = view?.getComputedStyle(elements.container)
  const radius = style?.borderRadius || '28px'
  const collapsed = `inset(0 0 65% 0 round ${radius})`
  const expanded = `inset(0 0 0% 0 round ${radius})`
  const easing =
    style
      ?.getPropertyValue(
        entering
          ? '--mdv-sys-motion-easing-emphasized'
          : '--mdv-sys-motion-easing-emphasized-accelerate',
      )
      .trim() || (entering ? 'cubic-bezier(0.2, 0, 0, 1)' : 'cubic-bezier(0.3, 0, 0.8, 0.15)')
  const clip = sheet.animate(
    [
      { clipPath: sampled ?? (entering ? collapsed : expanded) },
      { clipPath: entering ? expanded : collapsed },
    ],
    { duration: entering ? 500 : 150, easing, fill: 'both' },
  )
  return {
    finished: Promise.all([basic.finished, clip.finished.catch(() => {})]),
    cancel: () => {
      basic.cancel()
      clip.cancel()
    },
    finish: () => {
      basic.finish()
      clip.finish()
    },
  }
}
