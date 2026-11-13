import { ref, watch } from 'vue'

export interface ButtonRipple {
  x: number
  y: number
  size: number
  key: number
  released: boolean
}

/** 只管理当前按钮的涟漪；不注册全局监听，不接管原生激活。 */
export function useButtonRipple(options: {
  disabled: () => boolean
  isLink: () => boolean
  surface?: () => HTMLElement | null
}) {
  const ripple = ref<ButtonRipple | null>(null)
  let rippleKey = 0

  watch(options.disabled, (disabled) => {
    if (disabled) ripple.value = null
  })

  function showRipple(event: PointerEvent | KeyboardEvent) {
    if (options.disabled() || event.defaultPrevented) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const keyboard = event.type === 'keydown'
    if (keyboard) {
      const { key, repeat } = event as KeyboardEvent
      if (repeat || (key !== 'Enter' && (key !== ' ' || options.isLink()))) return
    } else {
      const pointer = event as PointerEvent
      if (pointer.button !== 0 || pointer.isPrimary === false) return
    }

    const surface = options.surface?.() ?? (event.currentTarget as HTMLElement)
    const bounds = surface.getBoundingClientRect()
    const x = keyboard
      ? bounds.width / 2
      : Math.max(0, Math.min(bounds.width, (event as PointerEvent).clientX - bounds.left))
    const y = keyboard
      ? bounds.height / 2
      : Math.max(0, Math.min(bounds.height, (event as PointerEvent).clientY - bounds.top))
    const size = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y)) * 2

    ripple.value = { x, y, size, key: ++rippleKey, released: false }
  }

  function releaseRipple(event: Event) {
    if (event.type === 'keyup') {
      const key = (event as KeyboardEvent).key
      if (key !== 'Enter' && key !== ' ') return
    }

    if (ripple.value) ripple.value.released = true
  }

  function finishRipple(event: AnimationEvent) {
    if (event.animationName === 'mdv-button-ripple-fade') ripple.value = null
  }

  return { ripple, showRipple, releaseRipple, finishRipple }
}
