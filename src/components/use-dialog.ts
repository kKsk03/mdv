import {
  nextTick,
  normalizeStyle,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { StyleValue } from 'vue'
import { acquireDialog, focusDialog, trapDialogTab } from './dialog-modal'
import type { DialogAnimator, DialogMotion } from './dialog-motion'
import type { MdvDialogCloseDetail, MdvDialogCloseReason, MdvDialogProps } from './dialog.types'

export type DialogEmits = {
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvDialogCloseDetail]
  closed: [detail: MdvDialogCloseDetail]
}

interface DialogEmit {
  (event: 'update:modelValue', value: boolean): void
  (event: 'open'): void
  (event: 'opened'): void
  (event: 'close', detail: MdvDialogCloseDetail): void
  (event: 'closed', detail: MdvDialogCloseDetail): void
}

interface DialogOptions {
  name: string
  role: 'dialog' | 'alertdialog'
  hasTitle: () => boolean
  hasContentSlot: () => boolean
  animate: DialogAnimator
  prepare?: () => void | Promise<void>
  preserveExternalFocus?: boolean
  returnFocus?: () => HTMLElement | null | undefined
}

/** 共用模态生命周期，各组件分别维护模板、布局和动画。 */
export function useDialog(props: MdvDialogProps, emit: DialogEmit, options: DialogOptions) {
  const attrs = useAttrs()
  const id = `mdv-dialog-${useId()}`
  const dialog = useTemplateRef<HTMLDialogElement>('dialog')
  const container = useTemplateRef<HTMLDivElement>('container')
  const scrim = useTemplateRef<HTMLDivElement>('scrim')
  const surface = useTemplateRef<HTMLDivElement>('surface')
  const header = useTemplateRef<HTMLElement>('header')
  const content = useTemplateRef<HTMLDivElement>('content')
  const actions = useTemplateRef<HTMLDivElement>('actions')
  const footer = useTemplateRef<HTMLDivElement>('footer')
  const phase = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
  const rendered = ref(!props.destroyOnClose || props.modelValue)
  const scrollable = ref(false)
  let mounted = false
  let active = true
  let transition = 0
  let request = 0
  let closeTask: Promise<boolean> | null = null
  let requestedClose: MdvDialogCloseDetail | null = null
  let modal: ReturnType<typeof acquireDialog> | undefined
  let motion: DialogMotion | undefined
  let motionMedia: MediaQueryList | undefined
  let resize: ResizeObserver | undefined
  let mutation: MutationObserver | undefined
  let measuring = false
  let pointerStart: number | null = null
  let composing = false
  let closeDetail: MdvDialogCloseDetail = { reason: 'model', returnValue: '' }

  function rootAttrs() {
    const result = { ...attrs }
    // open 由 showModal()/close() 管理，避免降级为非模态或绕过退出清理。
    for (const key of ['open', 'closedby', 'class', 'style', 'tabindex']) delete result[key]
    if (!result.role) result.role = options.role
    if (!result['aria-label'] && !result['aria-labelledby'] && options.hasTitle()) {
      result['aria-labelledby'] = `${id}-title`
    }
    if (!result['aria-describedby'] && !options.hasContentSlot() && props.description) {
      result['aria-describedby'] = `${id}-description`
    }
    return result
  }

  function rootStyle() {
    // 尺寸作用于可见容器；变量同时放在原生根节点，让遮罩也继承局部主题。
    return Object.fromEntries(
      Object.entries(normalizeStyle([attrs.style as StyleValue]) ?? {}).filter(([key]) =>
        key.startsWith('--'),
      ),
    )
  }

  function invalidateRequest() {
    request++
    closeTask = null
    requestedClose = null
  }

  function measure() {
    if (!dialog.value?.open) return
    const body = content.value
    scrollable.value = !!body && body.scrollHeight > body.clientHeight + 1
    if (scrollable.value && body && dialog.value.ownerDocument.activeElement === dialog.value) {
      // 等待 tabindex 随 scrollable 更新，且不抢走期间用户已经移动的焦点。
      void nextTick(() => {
        if (dialog.value?.open && dialog.value.ownerDocument.activeElement === dialog.value) {
          body.focus({ preventScroll: true })
        }
      })
    }
  }

  function scheduleMeasure() {
    if (measuring) return
    measuring = true
    void nextTick(() => {
      measuring = false
      if (mounted && active) measure()
    })
  }

  function stopObservers() {
    resize?.disconnect()
    mutation?.disconnect()
    resize = undefined
    mutation = undefined
  }

  function observe() {
    stopObservers()
    if (!container.value || !dialog.value?.open) return
    const view = dialog.value.ownerDocument.defaultView
    if (typeof view?.ResizeObserver === 'function') {
      resize = new view.ResizeObserver(scheduleMeasure)
      for (const element of [container.value, content.value, actions.value, footer.value]) {
        if (element) resize.observe(element)
      }
    }
    if (typeof view?.MutationObserver === 'function') {
      mutation = new view.MutationObserver(scheduleMeasure)
      mutation.observe(container.value, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    }
    scheduleMeasure()
  }

  function finishNativeClose() {
    stopObservers()
    const previousModal = modal
    modal = undefined
    const element = dialog.value
    const doc = element?.ownerDocument
    const focused = doc?.activeElement
    const restore =
      !options.preserveExternalFocus ||
      !focused ||
      focused === doc?.body ||
      focused === doc?.documentElement ||
      (element?.contains(focused) && focused.closest('dialog') === element)
    previousModal?.release()
    if (element?.open) element.close(closeDetail.returnValue)
    if (restore) previousModal?.restoreFocus()
  }

  async function runMotion(entering: boolean, ticket: number) {
    const oldMotion = motion
    motion = undefined
    if (!motionMedia?.matches && container.value && scrim.value && content.value) {
      motion = options.animate(
        {
          container: container.value,
          scrim: scrim.value,
          surface: surface.value,
          content: content.value,
          header: header.value,
          actions: actions.value,
          footer: footer.value,
        },
        entering,
        oldMotion,
      )
      await motion.finished
    } else oldMotion?.cancel()
    // 入口可能随 modelValue 解除 disabled／隐藏；等待本轮 DOM 更新后再恢复焦点。
    if (!entering) await nextTick()
    if (ticket !== transition || !mounted || !active) return
    motion?.cancel()
    motion = undefined
    if (entering) {
      phase.value = 'open'
      emit('opened')
    } else {
      phase.value = 'closed'
      finishNativeClose()
      if (props.destroyOnClose) rendered.value = false
      emit('closed', { ...closeDetail })
    }
  }

  async function show() {
    if (!mounted || !active || !props.modelValue) return
    const ticket = ++transition
    invalidateRequest()
    rendered.value = true
    composing = false
    await nextTick()
    const element = dialog.value
    if (!element || !mounted || !active || ticket !== transition || !props.modelValue) return
    if (!element.open) {
      modal = acquireDialog(element, options.returnFocus?.())
      try {
        element.showModal()
      } catch (error) {
        modal.release()
        modal = undefined
        throw error
      }
      element.returnValue = ''
      if (options.prepare) {
        await options.prepare()
        await nextTick()
        if (!mounted || !active || ticket !== transition || !props.modelValue) return
      }
      focusDialog(element)
    }
    phase.value = 'opening'
    observe()
    emit('open')
    await nextTick()
    if (ticket === transition && props.modelValue) await runMotion(true, ticket)
  }

  function hide(detail: MdvDialogCloseDetail) {
    const ticket = ++transition
    invalidateRequest()
    pointerStart = null
    if (!dialog.value?.open) {
      phase.value = 'closed'
      if (props.destroyOnClose) rendered.value = false
      return
    }
    closeDetail = { ...detail }
    phase.value = 'closing'
    emit('close', { ...closeDetail })
    void runMotion(false, ticket)
  }

  function requestClose(reason: MdvDialogCloseReason, returnValue = ''): Promise<boolean> {
    if (closeTask) return closeTask
    if (!dialog.value?.open || !modal?.isTop() || phase.value === 'closing' || !props.modelValue) {
      return Promise.resolve(false)
    }
    const ticket = ++request
    const detail: MdvDialogCloseDetail = { reason, returnValue }
    closeTask = (async () => {
      try {
        const allowed = await props.beforeClose?.(Object.freeze({ ...detail }))
        if (allowed === false || ticket !== request || !mounted || !active || !props.modelValue)
          return false
        requestedClose = detail
        emit('update:modelValue', false)
        await nextTick()
        return !props.modelValue
      } catch (error) {
        // 拦截失败保留弹窗；避免 DOM 监听产生未处理的 Promise rejection。
        console.error(`[MDV] ${options.name}: beforeClose failed; the dialog remains open.`, error)
        return false
      } finally {
        if (ticket === request) {
          closeTask = null
          requestedClose = null
        }
      }
    })()
    return closeTask
  }

  function close(returnValue = '') {
    return requestClose('action', returnValue)
  }

  function keydown(event: KeyboardEvent) {
    const element = dialog.value
    if (!element || !modal?.isTop() || event.defaultPrevented) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (!composing && !event.isComposing && event.keyCode !== 229 && props.closeOnEsc)
        void requestClose('escape')
    } else if (event.key === 'Tab') trapDialogTab(element, event)
  }

  function cancel(event: Event) {
    const prevented = event.defaultPrevented
    event.preventDefault()
    if (!prevented && !composing && props.closeOnEsc) void requestClose('escape')
  }

  function pointerdown(event: PointerEvent) {
    pointerStart =
      event.button === 0 &&
      modal?.isTop() &&
      !event.composedPath().includes(container.value as EventTarget)
        ? event.pointerId
        : null
  }

  function pointerup(event: PointerEvent) {
    const outside = !event.composedPath().includes(container.value as EventTarget)
    const startedOutside = pointerStart !== null && pointerStart === event.pointerId
    pointerStart = null
    if (outside && startedOutside && props.closeOnScrim) void requestClose('scrim')
  }

  function submit(event: SubmitEvent) {
    const form = event.target as HTMLFormElement
    if (
      event.defaultPrevented ||
      form.tagName !== 'FORM' ||
      form.closest('dialog') !== dialog.value
    )
      return
    const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null
    const method = submitter?.getAttribute('formmethod') ?? form.getAttribute('method') ?? ''
    if (method.toLowerCase() !== 'dialog') return
    event.preventDefault()
    void requestClose('form', submitter?.value ?? '')
  }

  function nativeClose() {
    // 兼容通过原生节点 close() 的关闭；组件自己的排队 close 事件不会重复处理。
    if (dialog.value?.open || phase.value === 'closed') return
    transition++
    invalidateRequest()
    motion?.cancel()
    motion = undefined
    closeDetail = {
      reason: 'model',
      returnValue: dialog.value?.returnValue ?? '',
    }
    if (phase.value !== 'closing') emit('close', { ...closeDetail })
    finishNativeClose()
    phase.value = 'closed'
    if (props.destroyOnClose) rendered.value = false
    emit('update:modelValue', false)
    emit('closed', { ...closeDetail })
  }

  function refreshMotion() {
    if (motionMedia?.matches) motion?.finish()
  }

  function suspend() {
    active = false
    transition++
    invalidateRequest()
    motion?.cancel()
    motion = undefined
    phase.value = 'closed'
    finishNativeClose()
    pointerStart = null
  }

  watch(
    () => props.modelValue,
    (value) => {
      if (value) void show()
      else hide(requestedClose ?? { reason: 'model', returnValue: '' })
    },
  )
  watch(
    () => props.destroyOnClose,
    (value) => {
      if (phase.value === 'closed') rendered.value = !value || props.modelValue
    },
  )
  onUpdated(() => {
    if (dialog.value?.open) observe()
  })
  onMounted(() => {
    mounted = true
    const view = dialog.value?.ownerDocument.defaultView
    motionMedia = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
    motionMedia?.addEventListener('change', refreshMotion)
    if (props.modelValue) void show()
  })
  onActivated(() => {
    if (active) return
    active = true
    if (props.modelValue) void show()
  })
  onDeactivated(suspend)
  onBeforeUnmount(() => {
    mounted = false
    suspend()
    motionMedia?.removeEventListener('change', refreshMotion)
  })

  return {
    elements: { dialog, container, scrim, content },
    attrs,
    id,
    phase,
    rendered,
    scrollable,
    rootAttrs,
    rootStyle,
    close,
    requestClose,
    listeners: {
      keydown,
      cancel,
      close: nativeClose,
      pointerdown,
      pointerup,
      submit,
      pointercancel: () => {
        pointerStart = null
      },
      pointerleave: () => {
        pointerStart = null
      },
      compositionstart: () => {
        composing = true
      },
      compositionend: () => {
        composing = false
      },
    },
  }
}
