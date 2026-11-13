import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'
import type MdvMenu from './MdvMenu.vue'
import { acquireMenuLayer } from './menu-stack'
import { topDialog } from './dialog-modal'
import { createFabMenuMotion } from './fab-menu-motion'
import { observeFabMenuPosition } from './fab-menu-position'
import type {
  MdvFabMenuCloseDetail,
  MdvFabMenuCloseReason,
  MdvFabMenuProps,
} from './fab-menu.types'

export interface FabMenuEmits {
  (event: 'update:modelValue', value: boolean): void
  (event: 'open'): void
  (event: 'opened'): void
  (event: 'close', detail: MdvFabMenuCloseDetail): void
  (event: 'closed', detail: MdvFabMenuCloseDetail): void
}

export function useFabMenu(props: MdvFabMenuProps, emit: FabMenuEmits) {
  const element = useTemplateRef<HTMLElement>('element')
  const layer = useTemplateRef<HTMLElement>('layer')
  const viewport = useTemplateRef<HTMLElement>('viewport')
  const baseline = useTemplateRef<InstanceType<typeof MdvMenu>>('baseline')
  const triggerElement = shallowRef<HTMLButtonElement | null>(null)
  const local = ref(false)
  const live = ref(true)
  const isOpen = computed(() => props.modelValue ?? local.value)
  const rendered = ref(false)
  let mounted = false
  let disposed = false
  let lifted = false
  let activeLayer: HTMLElement | null = null
  let nativeHiding = false
  let ticket = 0
  let releaseLayer: (() => void) | undefined
  let stopPosition: (() => void) | undefined
  let owner: HTMLDialogElement | null = null
  let reduced: MediaQueryList | undefined
  let detail: MdvFabMenuCloseDetail = { reason: 'model' }
  let requested = false
  let restore = false
  let focusOnOpen = false
  let tabbing = false
  let tabTimer: ReturnType<typeof setTimeout> | undefined

  function request(value: boolean) {
    if (value === isOpen.value) return
    if (props.modelValue === undefined) local.value = value
    emit('update:modelValue', value)
  }
  function contains(target: EventTarget | null) {
    return !!target && (activeLayer ?? layer.value)?.contains(target as Node) === true
  }
  function restoreFocus() {
    const trigger = triggerElement.value
    if (!trigger?.isConnected) return
    const doc = trigger.ownerDocument
    const active = doc.activeElement
    const modal = topDialog(doc)
    if (
      (!modal || modal.contains(trigger)) &&
      (contains(active) || active === doc.body || active === null)
    )
      trigger.focus({ preventScroll: true })
  }
  function close(reason: MdvFabMenuCloseReason = 'programmatic', returnFocus = true) {
    if (props.variant === 'baseline') {
      baseline.value?.close()
      return
    }
    if (!isOpen.value) return
    requested = true
    detail = { reason }
    restore = returnFocus
    request(false)
    void nextTick(() => {
      if (isOpen.value) {
        requested = restore = false
      }
    })
  }
  function open() {
    if (props.variant === 'baseline') baseline.value?.open()
    else {
      if (triggerElement.value?.matches(':disabled, [aria-disabled="true"]')) return
      focusOnOpen = true
      request(true)
      if (isOpen.value && rendered.value) triggerElement.value?.focus({ preventScroll: true })
      void nextTick(() => {
        if (!isOpen.value) focusOnOpen = false
      })
    }
  }
  function toggle() {
    if (isOpen.value) close('trigger')
    else open()
  }
  function removeTopLayer() {
    const root = activeLayer
    if (root?.hasAttribute('popover')) {
      nativeHiding = true
      try {
        if (root.matches(':popover-open')) root.hidePopover()
        root.removeAttribute('popover')
      } finally {
        nativeHiding = false
      }
    }
    stopPosition?.()
    stopPosition = undefined
    lifted = false
    activeLayer = null
  }
  const motion = createFabMenuMotion({
    element: () => activeLayer ?? layer.value,
    items: () => [
      ...((activeLayer ?? layer.value)?.querySelectorAll<HTMLElement>('[data-mdv-fab-menu-item]') ??
        []),
    ],
    opened: () => isOpen.value && live.value && props.variant !== 'baseline',
    settled(opened) {
      if (disposed) return
      if (opened) emit('opened')
      else if (lifted) {
        if (restore) restoreFocus()
        rendered.value = false
        removeTopLayer()
        emit('closed', { ...detail })
      }
    },
  })
  function ownerClosed() {
    close('outside', false)
  }
  function release() {
    releaseLayer?.()
    releaseLayer = undefined
    owner?.removeEventListener('close', ownerClosed)
    owner = null
    clearTimeout(tabTimer)
    tabbing = false
  }
  async function show() {
    const current = ++ticket
    rendered.value = true
    await nextTick()
    const anchor = element.value
    const root = layer.value
    const body = viewport.value
    if (!mounted || !live.value || current !== ticket || !isOpen.value || !anchor || !root || !body)
      return
    if (!lifted) {
      const focused = root.contains(root.ownerDocument.activeElement)
      if (typeof root.showPopover !== 'function') {
        rendered.value = false
        request(false)
        return
      }
      root.setAttribute('popover', 'manual')
      root.showPopover()
      activeLayer = root
      lifted = true
      stopPosition = observeFabMenuPosition({
        anchor,
        layer: root,
        viewport: body,
        unavailable: () => close('outside', false),
      })
      if (focusOnOpen || focused) triggerElement.value?.focus({ preventScroll: true })
      focusOnOpen = false
    }
    if (!releaseLayer)
      releaseLayer = acquireMenuLayer(root.ownerDocument, {
        owner: root,
        contains,
        escape: () => close('escape'),
        tab() {
          tabbing = true
          clearTimeout(tabTimer)
          tabTimer = setTimeout(() => {
            if (!contains(root.ownerDocument.activeElement)) close('tab', false)
            tabbing = false
          }, 0)
          return false
        },
        dismiss: (reason) => close(tabbing && reason === 'focus-out' ? 'tab' : reason, false),
        restoreTarget: () => triggerElement.value,
      })
    if (!owner) {
      owner = anchor.closest('dialog')
      owner?.addEventListener('close', ownerClosed)
    }
    requested = restore = false
    emit('open')
    motion.update()
  }
  function hide() {
    ++ticket
    focusOnOpen = false
    if (!rendered.value) return
    if (!requested) {
      detail = { reason: 'model' }
      restore = true
    }
    requested = false
    // 在操作打开新 Dialog 前交还返回点；新焦点已经离开时不抢回。
    if (restore) restoreFocus()
    release()
    emit('close', { ...detail })
    if (lifted) motion.update()
    else rendered.value = false
  }
  function dispose() {
    ++ticket
    release()
    if (contains(activeLayer?.ownerDocument.activeElement ?? null)) restoreFocus()
    motion.reset()
    removeTopLayer()
    rendered.value = false
  }
  function beforeToggle(event: Event) {
    if ((event as ToggleEvent).newState === 'closed' && !nativeHiding && lifted && isOpen.value) {
      close('outside', false)
      void nextTick(() => {
        if (isOpen.value && layer.value?.isConnected) layer.value.showPopover()
        else if (lifted) motion.finish()
      })
    }
  }
  function reducedChanged() {
    if (reduced?.matches && rendered.value) motion.finish()
  }
  watch(
    [isOpen, () => props.variant, live],
    () => {
      if (!mounted) return
      if (props.variant === 'baseline') dispose()
      else if (isOpen.value && live.value) void show()
      else hide()
    },
    { flush: 'post' },
  )
  onMounted(() => {
    mounted = true
    reduced = element.value?.ownerDocument.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )
    reduced?.addEventListener('change', reducedChanged)
    if (isOpen.value && props.variant !== 'baseline') void show()
  })
  onActivated(() => {
    live.value = true
  })
  onDeactivated(() => {
    live.value = false
    dispose()
  })
  onBeforeUnmount(() => {
    disposed = true
    mounted = false
    dispose()
    reduced?.removeEventListener('change', reducedChanged)
  })
  return {
    isOpen,
    rendered,
    triggerElement,
    request,
    open,
    close,
    toggle,
    beforeToggle,
    focus: (options?: FocusOptions) => triggerElement.value?.focus(options),
  }
}
