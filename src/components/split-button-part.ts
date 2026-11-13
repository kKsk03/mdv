import { onBeforeUnmount, onDeactivated, onActivated, ref, watch } from 'vue'
import { useButtonRipple } from './button-ripple'

/** 每个原生控件独立记录反馈；只在按压期间监听窗口释放，不模拟 click。 */
export function useSplitButtonPart(options: {
  element(): HTMLElement | null
  surface(): HTMLElement | null
  disabled(): boolean
  isLink(): boolean
  changed(): void
}) {
  const hovered = ref(false)
  const pressed = ref(false)
  const focused = ref(false)
  let pointer: number | undefined
  let key: string | undefined
  let pulse: ReturnType<typeof setTimeout> | undefined
  let view: Window | null = null
  let active = true
  const feedback = useButtonRipple({ ...options, disabled: blocked })

  function blocked() {
    const element = options.element()
    return (
      !active ||
      options.disabled() ||
      !!element?.matches(':disabled, [aria-disabled="true"]') ||
      !!element?.closest('[hidden], [inert]')
    )
  }
  function release() {
    if (pulse !== undefined) clearTimeout(pulse)
    pulse = pointer = key = undefined
    pressed.value = false
    if (feedback.ripple.value) feedback.ripple.value.released = true
    view?.removeEventListener('pointerup', endPointer, true)
    view?.removeEventListener('pointercancel', endPointer, true)
    view?.removeEventListener('keyup', endKey, true)
    view?.removeEventListener('blur', reset)
    view = null
    options.changed()
  }
  function listen() {
    if (view) return
    view = options.element()?.ownerDocument.defaultView ?? null
    view?.addEventListener('pointerup', endPointer, true)
    view?.addEventListener('pointercancel', endPointer, true)
    view?.addEventListener('keyup', endKey, true)
    view?.addEventListener('blur', reset)
  }
  function endPointer(event: PointerEvent) {
    if (pointer !== undefined && (event.pointerId === pointer || event.pointerId === undefined))
      release()
  }
  function endKey(event: KeyboardEvent) {
    if (key === event.key) release()
  }
  function reset() {
    hovered.value = focused.value = false
    release()
    feedback.ripple.value = null
  }
  const events = {
    onPointerenter(event: PointerEvent) {
      if (blocked() || event.pointerType === 'touch') return
      if (!options.element()?.ownerDocument.defaultView?.matchMedia?.('(hover: hover)').matches)
        return
      hovered.value = true
      options.changed()
    },
    onPointerleave() {
      hovered.value = false
      release()
    },
    onPointerdown(event: PointerEvent) {
      if (blocked() || event.defaultPrevented || event.button !== 0 || event.isPrimary === false)
        return
      release()
      focused.value = false
      pressed.value = true
      pointer = event.pointerId
      listen()
      feedback.showRipple(event)
      options.changed()
    },
    onPointercancel: release,
    onFocus() {
      focused.value = options.element()?.matches(':focus-visible') ?? false
      options.changed()
    },
    onBlur() {
      focused.value = false
      release()
    },
    onKeydown(event: KeyboardEvent) {
      if (
        blocked() ||
        event.defaultPrevented ||
        event.repeat ||
        (event.key !== 'Enter' && (event.key !== ' ' || options.isLink()))
      )
        return
      release()
      focused.value = pressed.value = true
      key = event.key
      listen()
      feedback.showRipple(event)
      options.changed()
    },
    onClick(event: MouseEvent) {
      if (blocked() || event.defaultPrevented || event.button !== 0 || pressed.value) return
      if (event.detail === 0) {
        pressed.value = true
        pulse = setTimeout(release, 100)
        options.changed()
      }
    },
  }
  watch(options.disabled, (value) => {
    if (value) reset()
  })
  onActivated(() => {
    active = true
  })
  onDeactivated(() => {
    reset()
    active = false
  })
  onBeforeUnmount(() => {
    reset()
    active = false
  })
  return {
    events,
    blocked,
    pressed,
    interactive: () => !blocked() && (hovered.value || pressed.value || focused.value),
    clearRipple: () => {
      feedback.ripple.value = null
    },
    ...feedback,
  }
}
