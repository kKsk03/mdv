import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, useAttrs, useId } from 'vue'
import type { ReferenceElement } from '@floating-ui/dom'
import type { MenuPanelContext, MenuTreeContext } from './menu-context'
import { menuPanelKey, menuTreeKey } from './menu-context'
import { acquireMenuLayer } from './menu-stack'
import { dialogTabStops, topDialog } from './dialog-modal'
import type {
  MdvMenuCloseDetail,
  MdvMenuCloseReason,
  MdvMenuProps,
  MdvMenuTriggerProps,
  MenuTriggerElement,
} from './menu.types'

export type MenuEmits = {
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvMenuCloseDetail]
  closed: [detail: MdvMenuCloseDetail]
}

interface MenuEmit {
  (event: 'update:modelValue', value: boolean): void
  (event: 'open'): void
  (event: 'opened'): void
  (event: 'close', detail: MdvMenuCloseDetail): void
  (event: 'closed', detail: MdvMenuCloseDetail): void
}

function usable(element: HTMLElement) {
  if (
    element.matches(':disabled, input[type="hidden"], [aria-disabled="true"]') ||
    element.closest('[hidden], [inert]')
  )
    return false
  const view = element.ownerDocument.defaultView
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = view?.getComputedStyle(current)
    if (style?.display === 'none' || style?.visibility === 'hidden') return false
    if (
      current.tagName === 'DETAILS' &&
      !(current as HTMLDetailsElement).open &&
      !current.querySelector(':scope > summary')?.contains(element)
    )
      return false
  }
  return true
}

export function useMenu(props: MdvMenuProps, emit: MenuEmit, contextMenu = false) {
  const attrs = useAttrs()
  const generatedId = 'mdv-menu-' + useId()
  const id = typeof attrs.id === 'string' ? attrs.id : generatedId
  const localOpen = ref(false)
  const isOpen = computed(() => props.modelValue ?? localOpen.value)
  const trigger = shallowRef<HTMLElement | null>(null)
  const anchor = shallowRef<ReferenceElement | null>(null)
  const root = shallowRef<MenuPanelContext | null>(null)
  const intent = ref<'first' | 'last'>('first')
  const keyboard = ref(false)
  let previousFocus: HTMLElement | null = null
  let closeDetail: MdvMenuCloseDetail = { reason: 'model' }
  let requested = false
  let shouldRestore = false
  let releaseLayer: (() => void) | undefined

  function setOpen(value: boolean) {
    if (isOpen.value === value) return
    if (props.modelValue === undefined) localOpen.value = value
    emit('update:modelValue', value)
  }

  function close(reason: MdvMenuCloseReason = 'programmatic', restore = true) {
    if (!isOpen.value) return
    closeDetail = { reason }
    shouldRestore = restore
    requested = true
    setOpen(false)
    void nextTick(() => {
      if (isOpen.value) {
        requested = false
        shouldRestore = false
      }
    })
  }

  function contains(target: EventTarget | null) {
    const node = target as Node | null
    return (
      !!node &&
      (root.value?.element.value?.contains(node) === true || trigger.value?.contains(node) === true)
    )
  }

  function tab(backward: boolean) {
    const panel = root.value?.element.value
    if (!panel) return false
    const doc = panel.ownerDocument
    const modal = topDialog(doc)
    const scope = modal ?? doc.body
    const candidates = modal
      ? dialogTabStops(modal)
      : [
          ...scope.querySelectorAll<HTMLElement>(
            'a[href], area[href], button, input, select, textarea, summary, iframe, object, embed, [tabindex], [contenteditable="true"]',
          ),
        ].filter((item) => item.tabIndex >= 0 && usable(item))
    const stops = candidates
      .filter((item) => {
        if (item.closest('[data-mdv-menu-panel]')) return false
        if (item.tagName !== 'INPUT') return true
        const input = item as HTMLInputElement
        if (input.type !== 'radio' || !input.name) return true
        const group = candidates.filter(
          (candidate): candidate is HTMLInputElement =>
            candidate.tagName === 'INPUT' &&
            (candidate as HTMLInputElement).type === 'radio' &&
            (candidate as HTMLInputElement).name === input.name &&
            (candidate as HTMLInputElement).form === input.form,
        )
        return (group.find((candidate) => candidate.checked) ?? group[0]) === item
      })
      .sort(
        (a, b) =>
          (a.tabIndex > 0 ? a.tabIndex : Number.MAX_SAFE_INTEGER) -
          (b.tabIndex > 0 ? b.tabIndex : Number.MAX_SAFE_INTEGER),
      )
    const from = trigger.value ?? previousFocus
    const index = from ? stops.indexOf(from) : -1
    let destination =
      index >= 0
        ? stops[index + (backward ? -1 : 1)]
        : from
          ? backward
            ? stops.filter((item) => !!(from.compareDocumentPosition(item) & 2)).pop()
            : stops.find((item) => !!(from.compareDocumentPosition(item) & 4))
          : stops[0]
    if (!destination && modal) destination = backward ? stops[stops.length - 1] : stops[0]
    close('tab', false)
    if (destination) {
      destination.focus({ preventScroll: true })
      return true
    } else if (modal) {
      modal.focus({ preventScroll: true })
      return true
    } else {
      // 文档首尾交给同一次原生 Tab，允许进入浏览器工具栏，不形成焦点循环。
      from?.focus({ preventScroll: true })
      return false
    }
  }

  function acquire(panel: MenuPanelContext) {
    releaseLayer?.()
    const element = panel.element.value
    if (!element) return () => {}
    previousFocus = element.ownerDocument.activeElement as HTMLElement | null
    releaseLayer = acquireMenuLayer(element.ownerDocument, {
      owner: element,
      contains,
      escape() {
        let deepest = panel
        while (deepest.child.value?.visible.value) deepest = deepest.child.value
        if (deepest === panel) close('escape')
        else deepest.close(true)
      },
      tab,
      dismiss: (reason) => close(reason, false),
      restoreTarget: () => trigger.value ?? previousFocus,
    })
    return () => {
      releaseLayer?.()
      releaseLayer = undefined
    }
  }

  const tree: MenuTreeContext = {
    id,
    variant: computed(() => props.variant ?? 'expressive'),
    colorScheme: computed(() =>
      props.variant === 'baseline' ? 'standard' : (props.colorScheme ?? 'standard'),
    ),
    layout: computed(() =>
      props.variant === 'baseline' ? 'standard' : (props.layout ?? 'standard'),
    ),
    submenuMode: computed(() => props.submenuMode ?? 'flyout'),
    placement: computed(() => props.placement ?? 'bottom-start'),
    offset: computed(() => (Number.isFinite(props.offset) ? Math.max(0, props.offset ?? 4) : 4)),
    anchor,
    trigger,
    root,
    intent,
    keyboard,
    close,
    acquire,
  }
  provide(menuTreeKey, tree)
  provide(menuPanelKey, null)

  function setTrigger(value: MenuTriggerElement) {
    const element = value && ('$el' in value ? (value.$el as Element) : value)
    trigger.value = element?.nodeType === 1 ? (element as HTMLElement) : null
    if (!contextMenu || !anchor.value) anchor.value = trigger.value
  }

  function show(edge: 'first' | 'last' = 'first', fromKeyboard = false) {
    intent.value = edge
    keyboard.value = fromKeyboard
    if (contextMenu && !anchor.value) anchor.value = trigger.value
    if (!anchor.value) return
    requested = false
    shouldRestore = false
    if (isOpen.value) root.value?.focus(edge)
    else setOpen(true)
  }

  function point(x: number, y: number) {
    const contextElement = trigger.value ?? undefined
    anchor.value = {
      contextElement,
      getBoundingClientRect: () => ({
        x,
        y,
        top: y,
        bottom: y,
        left: x,
        right: x,
        width: 0,
        height: 0,
      }),
    }
  }

  function disabledTrigger(event: Event) {
    const element = event.currentTarget as HTMLElement
    return element.matches(':disabled, [aria-disabled="true"]') || event.defaultPrevented
  }

  function click(event: MouseEvent) {
    if (disabledTrigger(event) || event.button !== 0) return
    if (isOpen.value) close('trigger')
    else show('first', event.detail === 0)
  }

  function context(event: MouseEvent) {
    if (disabledTrigger(event)) return
    event.preventDefault()
    root.value?.closeChildren()
    point(event.clientX, event.clientY)
    show()
  }

  function keydown(event: KeyboardEvent) {
    if (disabledTrigger(event) || event.isComposing || event.repeat) return
    if (contextMenu) {
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
      event.preventDefault()
      const box = trigger.value?.getBoundingClientRect()
      if (box) point(box.left, box.bottom)
      show('first', true)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      show(event.key === 'ArrowUp' ? 'last' : 'first', true)
    } else if (event.key === 'Enter' || event.key === ' ') {
      // 由原生 button 的 click 激活，避免按键与 click 各执行一次。
      const tag = (event.currentTarget as HTMLElement).tagName
      if (tag !== 'BUTTON' && (tag !== 'A' || event.key === ' ')) {
        event.preventDefault()
        if (isOpen.value) close('trigger')
        else show('first', true)
      }
    }
  }

  function triggerProps(): MdvMenuTriggerProps {
    return {
      ref: setTrigger,
      id: id + '-trigger',
      'aria-haspopup': 'menu',
      'aria-controls': id,
      'aria-expanded': isOpen.value,
      'data-mdv-menu-trigger-open': isOpen.value ? '' : undefined,
      onClick: contextMenu ? undefined : click,
      onContextmenu: contextMenu ? context : undefined,
      onKeydown: keydown,
    }
  }

  function opened() {
    emit('opened')
  }

  function closing() {
    if (!requested) {
      closeDetail = { reason: 'model' }
      shouldRestore = true
    }
    requested = false
    // 操作可能在同一轮渲染中打开 Dialog，先将其返回点交还给菜单触发器。
    if (closeDetail.reason === 'select' && shouldRestore) restoreFocus()
    emit('close', { ...closeDetail })
  }

  function restoreFocus() {
    const element = root.value?.element.value
    const doc = element?.ownerDocument ?? trigger.value?.ownerDocument
    const active = doc?.activeElement
    const modal = doc && topDialog(doc)
    const destination = trigger.value ?? previousFocus
    if (
      destination &&
      usable(destination) &&
      destination.isConnected &&
      (!modal || modal.contains(destination)) &&
      (!active || active === doc?.body || contains(active))
    )
      destination.focus({ preventScroll: true })
  }

  function closed() {
    if (shouldRestore && !isOpen.value) restoreFocus()
    shouldRestore = false
    emit('closed', { ...closeDetail })
  }

  onBeforeUnmount(() => releaseLayer?.())
  return {
    id,
    tree,
    isOpen,
    triggerProps,
    show,
    close: () => close(),
    toggle: () => (isOpen.value ? close('trigger') : show()),
    focus: (edge: 'first' | 'last' = 'first') => root.value?.focus(edge),
    panelEvents: {
      open: () => emit('open'),
      opened,
      close: closing,
      closed: () => void nextTick(closed),
    },
  }
}
