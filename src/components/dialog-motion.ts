/*
 * Material Web dialog animation timings, Copyright 2023 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 * MDV coordinates its own Vue/native-dialog lifecycle and interruption handling.
 */
export interface DialogMotionElements {
  container: HTMLElement
  scrim: HTMLElement
  surface: HTMLElement | null
  content: HTMLElement
  header: HTMLElement | null
  actions: HTMLElement | null
  footer: HTMLElement | null
}

export interface DialogMotion {
  finished: Promise<unknown[]>
  cancel: () => void
  finish: () => void
}

export type DialogAnimator = (
  elements: DialogMotionElements,
  entering: boolean,
  previous?: DialogMotion,
) => DialogMotion

function createMotion(elements: DialogMotionElements, entering: boolean, previous?: DialogMotion) {
  const animations: Animation[] = []
  const view = elements.container.ownerDocument.defaultView
  const style = view?.getComputedStyle(elements.container)
  const sampled = new Map<HTMLElement, { opacity: string; transform: string; height: string }>()
  if (previous && view) {
    for (const element of Object.values(elements)) {
      if (!element) continue
      const current = view.getComputedStyle(element)
      sampled.set(element, {
        opacity: current.opacity,
        transform: current.transform,
        height: current.height,
      })
    }
  }
  previous?.cancel()
  const easing =
    style
      ?.getPropertyValue(
        entering
          ? '--mdv-sys-motion-easing-emphasized'
          : '--mdv-sys-motion-easing-emphasized-accelerate',
      )
      .trim() || (entering ? 'cubic-bezier(0.2, 0, 0, 1)' : 'cubic-bezier(0.3, 0, 0.8, 0.15)')

  function animate(
    element: HTMLElement | null,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    if (typeof element?.animate !== 'function') return
    const current = sampled.get(element)
    if (current) {
      const first = { ...frames[0] }
      for (const property of ['opacity', 'transform', 'height'] as const) {
        if (property in first) first[property] = current[property]
      }
      frames = [first, ...frames.slice(1).map((frame) => ({ ...frame, offset: undefined }))]
      if (frames.length > 2) frames.splice(1, frames.length - 2)
    }
    animations.push(element.animate(frames, { fill: 'both', ...options }))
  }

  function complete(): DialogMotion {
    return {
      finished: Promise.all(animations.map((animation) => animation.finished.catch(() => {}))),
      cancel: () => animations.forEach((animation) => animation.cancel()),
      finish: () => animations.forEach((animation) => animation.finish()),
    }
  }
  return { animate, easing, complete }
}

/** 普通款：背景高度变化和文字淡入分别执行，避免缩放文字。 */
export const animateBasicDialog: DialogAnimator = (elements, entering, previous) => {
  const { animate, easing, complete } = createMotion(elements, entering, previous)
  const duration = entering ? 500 : 150
  animate(
    elements.container,
    entering
      ? [{ transform: 'translateY(-50px)' }, { transform: 'translateY(0)' }]
      : [{ transform: 'translateY(0)' }, { transform: 'translateY(-50px)' }],
    { duration, easing },
  )
  animate(
    elements.surface,
    entering ? [{ height: '35%' }, { height: '100%' }] : [{ height: '100%' }, { height: '35%' }],
    { duration, easing },
  )
  animate(
    elements.surface,
    entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
    { duration: 50, delay: entering ? 0 : 100, easing: 'linear' },
  )
  for (const element of [elements.header, elements.content, elements.actions]) {
    const actions = element === elements.actions
    animate(
      element,
      entering
        ? [{ opacity: 0 }, { opacity: 0, offset: actions ? 0.5 : 0.2 }, { opacity: 1 }]
        : [{ opacity: 1 }, { opacity: 0 }],
      { duration: entering ? (actions ? 300 : 250) : 100, easing: 'linear' },
    )
  }
  animate(
    elements.scrim,
    entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
    { duration, easing: 'linear' },
  )
  return complete()
}

/** 全屏款：独立的纵向进入／退出，不执行普通款的背景生长动画。 */
export const animateFullscreenDialog: DialogAnimator = (elements, entering, previous) => {
  const { animate, easing, complete } = createMotion(elements, entering, previous)
  const duration = entering ? 300 : 200
  animate(
    elements.container,
    entering
      ? [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }]
      : [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
    { duration, easing },
  )
  animate(
    elements.scrim,
    entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
    { duration, easing: 'linear' },
  )
  return complete()
}
