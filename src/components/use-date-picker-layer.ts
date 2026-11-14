import { nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { autoUpdate, computePosition, offset } from '@floating-ui/dom'
import { acquireDialog, observeDialogs, topDialog, trapDialogTab } from './dialog-modal'
import { animateBasicDialog, animateFullscreenDialog } from './dialog-motion'
import type { DialogMotion } from './dialog-motion'
import type { MdvDatePickerCloseDetail, MdvDatePickerCloseReason } from './date-picker.types'

function observeDatePickerPosition(
  element: HTMLElement,
  anchor: HTMLElement,
  positioned: () => void,
) {
  let active = true
  let sequence = 0
  async function update() {
    const ticket = ++sequence
    // Docked 始终贴着输入框，随页面滚出视口，不执行边缘避让或尺寸压缩。
    const result = await computePosition(anchor, element, {
      strategy: 'fixed',
      placement: 'bottom-start',
      middleware: [offset(4)],
    })
    if (!active || ticket !== sequence) return
    element.style.left = `${result.x}px`
    element.style.top = `${result.y}px`
    positioned()
  }
  const cleanup = autoUpdate(anchor, element, () => void update(), {
    elementResize: typeof element.ownerDocument.defaultView?.ResizeObserver === 'function',
    layoutShift: typeof element.ownerDocument.defaultView?.IntersectionObserver === 'function',
  })
  return {
    update,
    stop() {
      active = false
      sequence++
      cleanup()
    },
  }
}

export type DateLayerLayout = 'docked' | 'modal' | 'fullscreen'
export interface DateLayerEvents {
  (event: 'update:open', value: boolean): void
  (event: 'open'): void
  (event: 'opened'): void
  (event: 'cancel', detail: MdvDatePickerCloseDetail): void
  (event: 'close', detail: MdvDatePickerCloseDetail): void
  (event: 'closed', detail: MdvDatePickerCloseDetail): void
}
export function useDatePickerLayer(options: {
  open: () => boolean
  disabled: () => boolean
  layout: () => DateLayerLayout
  compact: Ref<boolean>
  root: Readonly<Ref<HTMLElement | null>>
  surface: Readonly<Ref<HTMLElement | null>>
  anchor: Readonly<Ref<HTMLElement | null>>
  emit: DateLayerEvents
  prepare: () => void
  focus: () => void
}) {
  const shown = ref(false)
  const ready = ref(false)
  const layout = ref<DateLayerLayout>('modal')
  const phase = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
  const compact = options.compact
  let mounted = false
  let active = true
  let ticket = 0
  let pending: MdvDatePickerCloseDetail | undefined
  let modal: ReturnType<typeof acquireDialog> | undefined
  let position: ReturnType<typeof observeDatePickerPosition> | undefined
  let finishPosition: (() => void) | undefined
  let removeListeners: (() => void) | undefined
  let media: MediaQueryList | undefined
  let reduced: MediaQueryList | undefined
  let motion: Animation[] = []
  let dialogMotion: DialogMotion | undefined
  let returnFocus: HTMLElement | null = null
  let outsidePointer: number | null = null
  let composing = false

  function cancelMotion() {
    dialogMotion?.cancel()
    dialogMotion = undefined
    for (const animation of motion) animation.cancel()
    motion = []
  }
  async function animate(entering: boolean) {
    const element = options.surface.value
    const target = layout.value === 'docked' ? options.root.value : element
    const style = motion.length && target ? getComputedStyle(target) : undefined
    const sampled = style
      ? { opacity: style.opacity, transform: style.transform, clipPath: style.clipPath }
      : undefined
    const previous = dialogMotion
    dialogMotion = undefined
    cancelMotion()
    if (!element?.animate || !ready.value || reduced?.matches) {
      previous?.cancel()
      return
    }
    if (layout.value !== 'docked') {
      const container = layout.value === 'modal' ? element.parentElement : element
      const scrim = options.root.value?.querySelector<HTMLElement>('.mdv-date-picker__scrim')
      const content = element.querySelector<HTMLElement>(
        '.mdv-date-calendar, .mdv-date-picker__input-view',
      )
      if (container && scrim && content) {
        const animator = layout.value === 'modal' ? animateBasicDialog : animateFullscreenDialog
        dialogMotion = animator(
          {
            container,
            scrim,
            surface: container.querySelector<HTMLElement>('.mdv-date-picker__background'),
            content,
            header: element.querySelector<HTMLElement>('.mdv-date-picker__header'),
            actions: element.querySelector<HTMLElement>('.mdv-date-picker__actions'),
            footer: null,
          },
          entering,
          previous,
        )
        if (layout.value === 'modal') {
          const easing =
            getComputedStyle(container)
              .getPropertyValue(
                entering
                  ? '--mdv-sys-motion-easing-emphasized'
                  : '--mdv-sys-motion-easing-emphasized-accelerate',
              )
              .trim() ||
            (entering ? 'cubic-bezier(0.2, 0, 0, 1)' : 'cubic-bezier(0.3, 0, 0.8, 0.15)')
          const collapsed = 'inset(0 0 65% 0 round 28px)'
          const expanded = 'inset(0 0 0% 0 round 28px)'
          // 裁切与背景高度使用相同时序，底部日期和操作区不会先露在背景外。
          motion = [
            element.animate(
              [
                { clipPath: sampled?.clipPath ?? (entering ? collapsed : expanded) },
                { clipPath: entering ? expanded : collapsed },
              ],
              { duration: entering ? 500 : 150, easing, fill: 'both' },
            ),
          ]
        }
        await Promise.allSettled([
          dialogMotion.finished,
          ...motion.map((animation) => animation.finished),
        ])
        return
      }
    }
    previous?.cancel()
    const panel = target ?? element
    motion = [
      panel.animate(
        [
          {
            opacity: sampled?.opacity ?? (entering ? 0 : 1),
            transform: sampled?.transform ?? (entering ? 'translateY(-8px) scale(0.96)' : 'none'),
          },
          {
            opacity: entering ? 1 : 0,
            transform: entering ? 'none' : 'translateY(-8px) scale(0.96)',
          },
        ],
        {
          duration: entering ? 220 : 120,
          easing: entering ? 'cubic-bezier(0.2, 0, 0, 1)' : 'cubic-bezier(0.3, 0, 0.8, 0.15)',
          fill: 'both',
        },
      ),
    ]
    await Promise.allSettled(motion.map((animation) => animation.finished))
  }
  function detach() {
    ready.value = false
    removeListeners?.()
    removeListeners = undefined
    position?.stop()
    position = undefined
    finishPosition?.()
    finishPosition = undefined
    const element = options.root.value
    const previousModal = modal
    modal = undefined
    previousModal?.release()
    if (layout.value === 'docked') {
      if (element?.matches(':popover-open')) element.hidePopover()
    } else if ((element as HTMLDialogElement | null)?.open) {
      ;(element as HTMLDialogElement).close()
    }
    return previousModal
  }
  function canHandle() {
    if (modal) return modal.isTop()
    const element = options.root.value
    if (!element) return false
    const top = topDialog(element.ownerDocument)
    return !top || top.contains(element)
  }
  function keydown(event: KeyboardEvent) {
    if (event.defaultPrevented || !canHandle()) return
    if (event.key === 'Escape' && !event.isComposing && !composing && event.keyCode !== 229) {
      event.preventDefault()
      event.stopPropagation()
      void close('escape')
    } else if (event.key === 'Tab' && modal) {
      event.stopPropagation()
      trapDialogTab(options.root.value as HTMLDialogElement, event)
    }
  }
  async function attach() {
    const element = options.root.value!
    const doc = element.ownerDocument
    const view = doc.defaultView!
    const viewport = view.visualViewport
    const refreshViewport = () => {
      if (layout.value === 'docked') return
      for (const [name, value] of Object.entries({
        top: viewport?.offsetTop ?? 0,
        left: viewport?.offsetLeft ?? 0,
        width: viewport?.width ?? view.innerWidth,
        height: viewport?.height ?? view.innerHeight,
      }))
        element.style.setProperty(`--mdv-date-viewport-${name}`, `${value}px`)
    }
    refreshViewport()
    view.addEventListener('resize', refreshViewport)
    viewport?.addEventListener('resize', refreshViewport)
    viewport?.addEventListener('scroll', refreshViewport)
    const owner = options.anchor.value?.closest('dialog')
    const outside = (event: Event) =>
      !event.composedPath().includes(element) &&
      !event.composedPath().includes(options.anchor.value as EventTarget)
    const pointerdown = (event: PointerEvent) => {
      if (!canHandle()) return
      if (layout.value === 'docked') {
        if (outside(event)) void close('outside')
      } else {
        outsidePointer = !event.composedPath().includes(options.surface.value as EventTarget)
          ? event.pointerId
          : null
      }
    }
    const pointerup = (event: PointerEvent) => {
      if (
        outsidePointer === event.pointerId &&
        !event.composedPath().includes(options.surface.value as EventTarget) &&
        canHandle()
      )
        void close('scrim')
      outsidePointer = null
    }
    const focusin = (event: FocusEvent) => {
      if (layout.value === 'docked' && !event.composedPath().includes(element) && canHandle())
        void close('blur')
    }
    const ownerClosed = () => {
      void close('outside')
    }
    doc.addEventListener('pointerdown', pointerdown, true)
    doc.addEventListener('pointerup', pointerup, true)
    doc.addEventListener('focusin', focusin)
    const stopDialogs =
      layout.value === 'docked'
        ? observeDialogs(doc, () => {
            if (!canHandle()) void close('outside')
          })
        : undefined
    owner?.addEventListener('close', ownerClosed)
    removeListeners = () => {
      view.removeEventListener('resize', refreshViewport)
      viewport?.removeEventListener('resize', refreshViewport)
      viewport?.removeEventListener('scroll', refreshViewport)
      doc.removeEventListener('pointerdown', pointerdown, true)
      doc.removeEventListener('pointerup', pointerup, true)
      doc.removeEventListener('focusin', focusin)
      stopDialogs?.()
      owner?.removeEventListener('close', ownerClosed)
    }
    if (layout.value === 'docked') {
      element.showPopover()
      const anchor =
        options.anchor.value!.querySelector<HTMLElement>('.mdv-text-field__container') ??
        options.anchor.value!
      // Popover 必须先显示才能测量；首轮定位期间保持不可见，避免先在原点入场。
      await new Promise<void>((resolve) => {
        finishPosition = resolve
        position = observeDatePickerPosition(element, anchor, () => {
          ready.value = true
          finishPosition?.()
          finishPosition = undefined
        })
      })
    } else {
      const dialog = element as HTMLDialogElement
      modal = acquireDialog(dialog, returnFocus)
      try {
        dialog.showModal()
      } catch (error) {
        detach()
        throw error
      }
      ready.value = true
    }
  }
  async function show() {
    if (!mounted || !active || !options.open() || options.disabled()) return
    const reopening = shown.value && phase.value === 'closing'
    if (shown.value && !reopening) return
    const current = ++ticket
    if (!reopening) {
      cancelMotion()
      options.prepare()
      layout.value = options.layout()
      shown.value = true
      phase.value = 'opening'
      if (!returnFocus)
        returnFocus = options.root.value?.ownerDocument.activeElement as HTMLElement | null
      await nextTick()
      if (current !== ticket || !mounted || !active || !options.open()) return
      await attach()
      await nextTick()
      if (current !== ticket || !mounted || !active || !options.open()) return
    } else {
      phase.value = 'opening'
    }
    options.focus()
    options.emit('open')
    await animate(true)
    if (current !== ticket) return
    cancelMotion()
    phase.value = 'open'
    options.emit('opened')
  }
  async function hide(detail: MdvDatePickerCloseDetail) {
    if (!shown.value || phase.value === 'closing') return
    const current = ++ticket
    phase.value = 'closing'
    if (detail.reason !== 'confirm') options.emit('cancel', detail)
    options.emit('close', detail)
    await animate(false)
    if (current !== ticket) return
    cancelMotion()
    const previous = detach()
    shown.value = false
    phase.value = 'closed'
    await nextTick()
    if (current !== ticket) return
    const preserve = ['outside', 'blur', 'model', 'disabled'].includes(detail.reason)
    if (!preserve) {
      if (previous) previous.restoreFocus()
      else if (
        returnFocus?.isConnected &&
        !returnFocus.matches(':disabled') &&
        !returnFocus.closest('[hidden], [inert]')
      )
        returnFocus.focus({ preventScroll: true })
    }
    returnFocus = null
    options.emit('closed', detail)
  }
  async function open(event?: Event) {
    if (options.disabled()) return false
    if (options.open()) return true
    const doc = options.anchor.value?.ownerDocument
    returnFocus =
      event?.currentTarget instanceof HTMLElement
        ? event.currentTarget
        : (doc?.activeElement as HTMLElement | null)
    options.emit('update:open', true)
    await nextTick()
    return options.open()
  }
  async function close(reason: MdvDatePickerCloseReason = 'programmatic') {
    if (!options.open()) return false
    if (pending) {
      await nextTick()
      return !options.open()
    }
    const detail = { reason }
    pending = detail
    options.emit('update:open', false)
    await nextTick()
    if (pending === detail) pending = undefined
    return !options.open()
  }
  async function migrate() {
    if (!shown.value || phase.value === 'closing' || layout.value === options.layout()) return
    const current = ++ticket
    const element = options.root.value!
    const focused = element.ownerDocument.activeElement as HTMLInputElement | null
    const inside = !!focused && element.contains(focused)
    const key = focused?.getAttribute('data-date-focus')
    const id = focused?.id
    const selection =
      focused?.tagName === 'INPUT' ? [focused.selectionStart, focused.selectionEnd] : null
    cancelMotion()
    detach()
    layout.value = options.layout()
    await nextTick()
    if (current !== ticket || !options.open() || !active) return
    await attach()
    await nextTick()
    if (current !== ticket || !mounted || !options.open() || !active) return
    if (inside) {
      const candidate = key
        ? [...options.root.value!.querySelectorAll<HTMLElement>('[data-date-focus]')].find(
            (node) => node.dataset.dateFocus === key,
          )
        : id
          ? options.root.value!.ownerDocument.getElementById(id)
          : null
      if (candidate) {
        candidate.focus({ preventScroll: true })
        if (
          selection &&
          candidate instanceof HTMLInputElement &&
          selection[0] !== null &&
          selection[1] !== null
        )
          candidate.setSelectionRange(selection[0]!, selection[1]!)
      } else if (key === 'month' || key === 'previous-year' || key === 'next-year') {
        options.root.value
          ?.querySelector<HTMLElement>('[data-date-focus="year"]')
          ?.focus({ preventScroll: true })
      } else if (key?.startsWith('month-')) {
        options.root.value
          ?.querySelector<HTMLElement>('[data-choice="true"]')
          ?.focus({ preventScroll: true })
      } else options.focus()
    }
    phase.value = 'open'
  }
  watch(options.open, (value) => {
    if (value) void show()
    else {
      const detail = pending ?? { reason: 'model' }
      pending = undefined
      void hide(detail)
    }
  })
  watch(options.layout, () => {
    void migrate()
  })
  watch(options.disabled, (disabled) => {
    if (disabled) {
      void close('disabled').then((accepted) => {
        if (!accepted) void hide({ reason: 'disabled' })
      })
    } else if (options.open()) void show()
  })
  function suspend() {
    active = false
    ticket++
    cancelMotion()
    detach()?.restoreFocus()
    shown.value = false
    phase.value = 'closed'
    returnFocus = null
  }
  const resize = () => {
    compact.value = media?.matches ?? false
  }
  const reduceMotion = () => {
    if (reduced?.matches) {
      dialogMotion?.finish()
      for (const animation of motion) animation.finish()
    }
  }
  onMounted(() => {
    mounted = true
    media = options.anchor.value?.ownerDocument.defaultView?.matchMedia?.('(max-width: 599px)')
    reduced = options.anchor.value?.ownerDocument.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )
    resize()
    media?.addEventListener('change', resize)
    reduced?.addEventListener('change', reduceMotion)
    if (options.open()) void show()
  })
  onActivated(() => {
    if (!active) {
      active = true
      if (options.open()) void show()
    }
  })
  onDeactivated(suspend)
  onBeforeUnmount(() => {
    mounted = false
    suspend()
    media?.removeEventListener('change', resize)
    reduced?.removeEventListener('change', reduceMotion)
  })
  return {
    shown,
    ready,
    layout,
    compact,
    phase,
    open,
    close,
    listeners: {
      keydown,
      cancel(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        if (!composing) void close('escape')
      },
      close() {
        if (
          shown.value &&
          phase.value !== 'closing' &&
          layout.value !== 'docked' &&
          !(options.root.value as HTMLDialogElement)?.open
        ) {
          void close('model').then((accepted) => {
            if (!accepted && shown.value && mounted && active && !options.disabled()) {
              detach()
              void attach().then(() => {
                if (shown.value && mounted && active && !options.disabled()) options.focus()
              })
            }
          })
        }
      },
      compositionstart: () => {
        composing = true
      },
      compositionend: () => {
        composing = false
      },
      pointercancel: () => {
        outsidePointer = null
      },
    },
  }
}
