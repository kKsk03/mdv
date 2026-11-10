import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
} from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { topDialog } from './dialog-modal'
import { attachTooltipAria } from './tooltip-aria'
import { acquireTooltipLayer } from './tooltip-layer'
import { animateTooltip } from './tooltip-motion'
import type { TooltipMotion } from './tooltip-motion'
import { observeTooltipPosition } from './tooltip-position'
import type {
  MdvRichTooltipProps,
  MdvTooltipCloseDetail,
  MdvTooltipCloseReason,
  MdvTooltipTriggerProps,
} from './tooltip.types'

export type TooltipEmits = {
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvTooltipCloseDetail]
  closed: [detail: MdvTooltipCloseDetail]
}

interface TooltipEmit {
  (event: 'update:modelValue', value: boolean): void
  (event: 'open'): void
  (event: 'opened'): void
  (event: 'close', detail: MdvTooltipCloseDetail): void
  (event: 'closed', detail: MdvTooltipCloseDetail): void
}

function delay(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? Math.max(0, value ?? fallback) : fallback
}

export function useTooltip(props: MdvRichTooltipProps, emit: TooltipEmit, rich = false) {
  const attrs = useAttrs()
  const generatedId = 'mdv-tooltip-' + useId()
  const id = typeof attrs.id === 'string' ? attrs.id : generatedId
  const panel = shallowRef<HTMLElement | null>(null)
  const trigger = shallowRef<HTMLElement | null>(null)
  const localOpen = ref(false)
  const suppressed = ref(false)
  const live = ref(true)
  const mounted = ref(false)
  const hasContent = ref(false)
  const rendered = ref(false)
  const visible = ref(false)
  const phase = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
  const requestedOpen = computed(() => props.modelValue ?? localOpen.value)
  const isOpen = computed(
    () =>
      requestedOpen.value && !suppressed.value && !props.disabled && hasContent.value && live.value,
  )
  const persistent = computed(() => rich && props.persistent === true)
  let sequence = 0
  let session = false
  let closeDetail: MdvTooltipCloseDetail = { reason: 'model' }
  let requestedClose = false
  let pendingRequest: boolean | undefined
  let hoveredTrigger = false
  let hoveredPanel = false
  let keyboardFocus = false
  let pointerFocus = false
  let nativeHiding = false
  let restoringFocus = false
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let pressTimer: ReturnType<typeof setTimeout> | undefined
  let press: { id: number; x: number; y: number; held: boolean } | undefined
  let suppressClickUntil = 0
  let releasePress: (() => void) | undefined
  let releaseLayer: (() => void) | undefined
  let releaseOwners: (() => void) | undefined
  let position: ReturnType<typeof observeTooltipPosition> | undefined
  let aria: ReturnType<typeof attachTooltipAria> | undefined
  let motion: TooltipMotion | undefined
  let contentObserver: MutationObserver | undefined
  let media: MediaQueryList | undefined

  function contains(target: EventTarget | null) {
    const node = target as Node | null
    return (
      !!node && (trigger.value?.contains(node) === true || panel.value?.contains(node) === true)
    )
  }

  function clearOpen() {
    clearTimeout(openTimer)
    openTimer = undefined
  }

  function clearClose() {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }

  function stopPress() {
    if (press?.held) suppressClickUntil = Date.now() + 750
    clearTimeout(pressTimer)
    pressTimer = undefined
    releasePress?.()
    releasePress = undefined
    press = undefined
  }

  function clearTimers() {
    clearOpen()
    clearClose()
    stopPress()
  }

  function syncAria() {
    aria?.update(
      live.value && !props.disabled && hasContent.value,
      visible.value && phase.value !== 'closing',
    )
  }

  function contentChanged() {
    hasContent.value = !!panel.value?.textContent?.trim()
    syncAria()
  }

  function setOpen(value: boolean) {
    if (requestedOpen.value === value || pendingRequest === value) return
    pendingRequest = value
    if (props.modelValue === undefined) localOpen.value = value
    emit('update:modelValue', value)
    void nextTick(() => {
      pendingRequest = undefined
    })
  }

  function canShow() {
    const target = trigger.value
    const element = panel.value
    if (
      !mounted.value ||
      !live.value ||
      !target?.isConnected ||
      !element?.isConnected ||
      target.ownerDocument !== element.ownerDocument ||
      target.matches(':disabled') ||
      target.closest('[hidden], [inert]')
    )
      return false
    const modal = topDialog(target.ownerDocument)
    if (modal && !modal.contains(target)) return false
    for (let node: HTMLElement | null = target; node; node = node.parentElement) {
      if (node.hasAttribute('popover') && !node.matches(':popover-open')) return false
      if (node.tagName === 'DIALOG' && !(node as HTMLDialogElement).open) return false
      const style = node.ownerDocument.defaultView?.getComputedStyle(node)
      if (style?.display === 'none' || style?.visibility === 'hidden') return false
    }
    return true
  }

  function open() {
    clearOpen()
    clearClose()
    if (props.disabled || !live.value || !trigger.value) return
    suppressed.value = false
    requestedClose = false
    setOpen(true)
    if (requestedOpen.value && mounted.value) void show()
  }

  function close(reason: MdvTooltipCloseReason = 'programmatic') {
    clearTimers()
    if (!requestedOpen.value) return
    closeDetail = { reason }
    requestedClose = true
    setOpen(false)
    void nextTick(() => {
      if (requestedOpen.value) requestedClose = false
    })
  }

  function restoreFocus() {
    const element = panel.value
    const target = trigger.value
    if (
      element?.contains(element.ownerDocument.activeElement) &&
      target?.isConnected &&
      !target.matches(':disabled') &&
      !target.closest('[hidden], [inert]')
    ) {
      restoringFocus = true
      try {
        target.focus({ preventScroll: true })
      } finally {
        restoringFocus = false
      }
    }
  }

  function stopPosition() {
    position?.stop()
    position = undefined
  }

  function finishHide() {
    const element = panel.value
    if (element?.matches(':popover-open')) {
      nativeHiding = true
      try {
        element.hidePopover()
      } finally {
        nativeHiding = false
      }
    }
    element?.style.removeProperty('visibility')
    rendered.value = false
    visible.value = false
    phase.value = 'closed'
    syncAria()
  }

  function dispose() {
    ++sequence
    clearTimers()
    stopPosition()
    releaseLayer?.()
    releaseLayer = undefined
    releaseOwners?.()
    releaseOwners = undefined
    motion?.cancel()
    motion = undefined
    finishHide()
  }

  function dismiss(reason: MdvTooltipCloseReason) {
    if (reason !== 'replaced' && reason !== 'owner') return close(reason)
    const wasOpen = session
    closeDetail = { reason }
    requestedClose = true
    suppressed.value = true
    setOpen(false)
    if (reason === 'replaced') restoreFocus()
    // 所属浮层关闭、被新提示替换时同步退出，不能等待受控回传或退场动画。
    dispose()
    session = false
    if (wasOpen) {
      emit('close', { ...closeDetail })
      emit('closed', { ...closeDetail })
    }
  }

  function observeOwners() {
    const owners: HTMLElement[] = []
    for (let node = trigger.value?.parentElement; node; node = node.parentElement) {
      if (node.hasAttribute('popover') || node.tagName === 'DIALOG') owners.push(node)
    }
    const beforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'closed') dismiss('owner')
    }
    const closed = () => dismiss('owner')
    for (const owner of owners) {
      owner.addEventListener('beforetoggle', beforeToggle)
      owner.addEventListener('close', closed)
    }
    return () => {
      for (const owner of owners) {
        owner.removeEventListener('beforetoggle', beforeToggle)
        owner.removeEventListener('close', closed)
      }
    }
  }

  async function reposition() {
    stopPosition()
    if (!panel.value || !trigger.value || !visible.value) return
    position = observeTooltipPosition({
      element: panel.value,
      trigger: trigger.value,
      placement: props.placement ?? (rich ? 'bottom-start' : 'top'),
      offset: delay(props.offset, 4),
      hidden: () => dismiss('owner'),
    })
    await position.update()
  }

  async function show() {
    if (!isOpen.value) return
    if (!canShow()) {
      if (mounted.value && trigger.value) dismiss('owner')
      return
    }
    if (phase.value === 'open' || phase.value === 'opening') return
    const ticket = ++sequence
    rendered.value = true
    phase.value = 'opening'
    await nextTick()
    const element = panel.value
    const target = trigger.value
    if (!element || !target || ticket !== sequence || !isOpen.value) return
    if (!canShow()) {
      dismiss('owner')
      return
    }
    element.style.visibility = 'hidden'
    if (!visible.value) {
      if (typeof element.showPopover !== 'function') {
        dismiss('owner')
        return
      }
      element.showPopover()
      if (!element.matches(':popover-open')) {
        dismiss('owner')
        return
      }
      visible.value = true
    }
    releaseLayer?.()
    releaseLayer = acquireTooltipLayer(element.ownerDocument, {
      owner: element,
      trigger: target,
      rich,
      contains,
      dismiss,
    })
    releaseOwners?.()
    releaseOwners = observeOwners()
    session = true
    syncAria()
    emit('open')
    await reposition()
    if (ticket !== sequence || !isOpen.value || !mounted.value) return
    if (!canShow()) {
      dismiss('owner')
      return
    }
    element.style.visibility = ''
    motion = animateTooltip(element, true, motion)
    await motion.finished
    if (ticket !== sequence || !mounted.value) return
    motion?.cancel()
    motion = undefined
    phase.value = 'open'
    emit('opened')
  }

  async function hide() {
    if (phase.value === 'closed' || phase.value === 'closing') return
    const ticket = ++sequence
    clearTimers()
    stopPosition()
    releaseLayer?.()
    releaseLayer = undefined
    releaseOwners?.()
    releaseOwners = undefined
    if (!requestedClose)
      closeDetail = { reason: props.disabled ? 'disabled' : !hasContent.value ? 'empty' : 'model' }
    requestedClose = false
    const detail = { ...closeDetail }
    if (!['outside', 'focus-out', 'owner', 'leave'].includes(detail.reason)) restoreFocus()
    phase.value = 'closing'
    syncAria()
    const hadSession = session
    session = false
    if (hadSession) emit('close', detail)
    if (panel.value && visible.value) {
      motion = animateTooltip(panel.value, false, motion)
      await motion.finished
    }
    if (ticket !== sequence || !mounted.value) return
    motion?.cancel()
    motion = undefined
    finishHide()
    if (hadSession) emit('closed', detail)
  }

  function scheduleClose(source: 'trigger' | 'panel' | 'touch' = 'trigger') {
    clearOpen()
    clearClose()
    if (persistent.value || hoveredTrigger || hoveredPanel || keyboardFocus || press?.held) return
    const fallback = source === 'touch' ? 1500 : rich && source === 'trigger' ? 120 : 0
    const duration = delay(props.closeDelay, fallback)
    if (duration === 0) close('leave')
    else closeTimer = setTimeout(() => close('leave'), duration)
  }

  function pointerEnter(event: PointerEvent, insidePanel = false) {
    if (event.pointerType === 'touch') return
    if (!insidePanel) triggerEvent(event)
    if (insidePanel) hoveredPanel = true
    else hoveredTrigger = true
    clearClose()
    if (insidePanel || persistent.value || isOpen.value || props.disabled) return
    clearOpen()
    openTimer = setTimeout(open, delay(props.openDelay, 600))
  }

  function pointerLeave(event: PointerEvent, insidePanel = false) {
    if (event.pointerType === 'touch') return
    if (insidePanel) hoveredPanel = false
    else hoveredTrigger = false
    if (contains(event.relatedTarget)) {
      clearOpen()
      return
    }
    scheduleClose(insidePanel ? 'panel' : 'trigger')
  }

  function focusIn(event: FocusEvent) {
    if (restoringFocus) return
    if (panel.value?.contains(event.target as Node)) {
      keyboardFocus = true
      clearClose()
    } else {
      triggerEvent(event)
      if (!pointerFocus && !persistent.value) {
        keyboardFocus = true
        open()
      }
    }
  }

  function focusOut(event: FocusEvent) {
    if (contains(event.relatedTarget)) return
    pointerFocus = false
    keyboardFocus = false
    void nextTick(() => {
      if (contains(panel.value?.ownerDocument.activeElement ?? null)) return
      if (!hoveredTrigger && !hoveredPanel) close('focus-out')
    })
  }

  function pointerDown(event: PointerEvent) {
    triggerEvent(event)
    pointerFocus = true
    keyboardFocus = false
    if (
      persistent.value ||
      props.disabled ||
      event.defaultPrevented ||
      event.pointerType !== 'touch' ||
      event.isPrimary === false ||
      event.button !== 0
    )
      return
    clearTimers()
    keyboardFocus = false
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, held: false }
    const doc = trigger.value?.ownerDocument
    if (!doc) return
    const move = (next: PointerEvent) => {
      if (!press || next.pointerId !== press.id) return
      if (Math.hypot(next.clientX - press.x, next.clientY - press.y) <= 10) return
      const held = press.held
      stopPress()
      if (held) close('leave')
    }
    const end = (next: PointerEvent) => {
      if (!press || next.pointerId !== press.id) return
      const held = press.held
      stopPress()
      if (held) {
        suppressClickUntil = Date.now() + 750
        if (next.type === 'pointercancel') close('leave')
        else scheduleClose('touch')
      }
    }
    doc.addEventListener('pointermove', move, true)
    doc.addEventListener('pointerup', end, true)
    doc.addEventListener('pointercancel', end, true)
    releasePress = () => {
      doc.removeEventListener('pointermove', move, true)
      doc.removeEventListener('pointerup', end, true)
      doc.removeEventListener('pointercancel', end, true)
    }
    pressTimer = setTimeout(() => {
      if (!press || !canShow()) return
      press.held = true
      suppressClickUntil = Number.POSITIVE_INFINITY
      open()
    }, 500)
  }

  function clickCapture(event: MouseEvent) {
    if (
      suppressClickUntil > 0 &&
      Date.now() <= suppressClickUntil &&
      (event.detail !== 0 || (event as PointerEvent).pointerType === 'touch')
    ) {
      suppressClickUntil = 0
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  function contextCapture(event: MouseEvent) {
    if (suppressClickUntil > 0 && Date.now() <= suppressClickUntil) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  function click(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0) return
    if (persistent.value) {
      if (isOpen.value) close('trigger')
      else open()
    } else close('trigger')
  }

  function keydown(event: KeyboardEvent) {
    triggerEvent(event)
    pointerFocus = false
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape') clearTimers()
    if (!persistent.value || event.repeat || !['Enter', ' '].includes(event.key)) return
    const target = trigger.value
    if (target && target.tagName !== 'BUTTON' && (target.tagName !== 'A' || event.key === ' ')) {
      event.preventDefault()
      target.click()
    }
  }

  function setTrigger(value: Element | ComponentPublicInstance | null) {
    const element = value && ('$el' in value ? (value.$el as Element) : value)
    const next = element?.nodeType === 1 ? (element as HTMLElement) : null
    // 组件把事件透传给内部控件时，以真实 currentTarget 为锚点；后续 ref 更新不退回外壳。
    if (value && '$el' in value && next && trigger.value && next.contains(trigger.value)) return
    if (next === trigger.value) return
    aria?.dispose()
    aria = undefined
    trigger.value = next
    if (next) {
      aria = attachTooltipAria(next, id, rich)
      syncAria()
    }
    if (visible.value && next) void reposition()
  }

  function triggerEvent(event: Event) {
    const target = event.currentTarget as HTMLElement | null
    if (target?.nodeType === 1 && target !== panel.value) setTrigger(target)
  }

  const triggerProps: MdvTooltipTriggerProps = {
    ref: setTrigger,
    onPointerenter: (event) => pointerEnter(event),
    onPointerleave: (event) => pointerLeave(event),
    onPointerdown: pointerDown,
    onFocusin: focusIn,
    onFocusout: focusOut,
    onKeydown: keydown,
    onClick: click,
    onClickCapture: clickCapture,
    onContextmenuCapture: contextCapture,
  }

  watch(
    [isOpen, trigger, mounted],
    () => {
      syncAria()
      if (mounted.value && isOpen.value && trigger.value) void show()
      else void hide()
    },
    { flush: 'post' },
  )
  watch(
    () => props.modelValue,
    () => {
      suppressed.value = false
    },
  )
  watch([() => props.placement, () => props.offset], () => {
    if (visible.value) void reposition()
  })
  watch([() => props.disabled, persistent], () => {
    clearTimers()
    hoveredTrigger = false
    hoveredPanel = false
    keyboardFocus = false
  })

  function reducedChanged() {
    if (media?.matches) motion?.cancel()
  }

  onMounted(() => {
    mounted.value = true
    contentChanged()
    const view = panel.value?.ownerDocument.defaultView
    media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
    media?.addEventListener('change', reducedChanged)
    const Observer = view?.MutationObserver
    if (Observer && panel.value) {
      contentObserver = new Observer(() => {
        contentChanged()
        if (visible.value) void position?.update()
      })
      contentObserver.observe(panel.value, { childList: true, characterData: true, subtree: true })
    }
  })
  onUpdated(() => {
    contentChanged()
    if (visible.value) void position?.update()
  })
  onActivated(() => {
    live.value = true
  })
  onDeactivated(() => {
    live.value = false
    dismiss('owner')
    syncAria()
  })
  onBeforeUnmount(() => {
    mounted.value = false
    dispose()
    session = false
    aria?.dispose()
    contentObserver?.disconnect()
    media?.removeEventListener('change', reducedChanged)
  })

  return {
    id,
    panel,
    rendered,
    phase,
    isOpen,
    triggerProps,
    open,
    close: () => close(),
    toggle: () => (isOpen.value ? close('trigger') : open()),
    panelEvents: {
      pointerenter: (event: PointerEvent) => pointerEnter(event, true),
      pointerleave: (event: PointerEvent) => pointerLeave(event, true),
      focusin: focusIn,
      focusout: focusOut,
      beforetoggle: (event: Event) => {
        if (!nativeHiding && (event as ToggleEvent).newState === 'closed') dismiss('owner')
      },
    },
  }
}
