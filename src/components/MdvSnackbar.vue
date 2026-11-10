<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { StyleValue, VNode } from 'vue'
import closeIcon from '@iconify-icons/material-symbols/close'
import MdvIcon from './MdvIcon.vue'
import { resolveButtonColor } from './button-color'
import { observeDialogs, topDialog } from './dialog-modal'
import type {
  MdvSnackbarActionSlotProps,
  MdvSnackbarCloseDetail,
  MdvSnackbarCloseReason,
  MdvSnackbarProps,
  MdvSnackbarSlotProps,
} from './snackbar.types'

defineOptions({ name: 'MdvSnackbar', inheritAttrs: false })
const props = withDefaults(defineProps<MdvSnackbarProps>(), {
  modelValue: false,
  message: '',
  closable: undefined,
  closeLabel: '关闭通知',
  actionLayout: 'auto',
  placement: 'bottom',
  offset: 16,
  pauseOnHover: true,
  closeOnEsc: true,
  focusShortcut: 'Alt+G',
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvSnackbarCloseDetail]
  closed: [detail: MdvSnackbarCloseDetail]
  action: [event: MouseEvent]
  actionError: [error: unknown]
}>()
const slots = defineSlots<{
  default?(props: MdvSnackbarSlotProps): VNode[]
  action?(props: MdvSnackbarActionSlotProps): VNode[]
}>()
const attrs = useAttrs()
const initiallyHydrated = !!getCurrentInstance()?.vnode.el
const anchor = useTemplateRef<HTMLElement>('anchor')
const root = useTemplateRef<HTMLElement>('root')
const blocked = ref(false)
const actionPending = ref(false)
const hasAction = computed(() => !!props.action || !!slots.action)
const duration = computed(() => {
  const value = props.duration ?? (hasAction.value ? 0 : 4000)
  return Number.isFinite(value) ? Math.max(0, value) : 0
})
const isClosable = computed(() => props.closable ?? duration.value === 0)
const colorStyle = computed(() => {
  const colors = resolveButtonColor(props.color)
  if (!colors) return undefined
  return {
    '--mdv-snackbar-surface': colors['--mdv-button-color'],
    '--mdv-snackbar-foreground': colors['--mdv-button-on-color'],
    '--mdv-snackbar-action': colors['--mdv-button-on-color'],
  }
})
const positionStyle = computed(() => ({
  '--mdv-snackbar-offset': `${Number.isFinite(props.offset) ? Math.max(0, props.offset) : 16}px`,
}))

if (import.meta.env.DEV) {
  watch(
    () => props.color,
    (color) => {
      if (color !== undefined && !colorStyle.value) {
        console.warn(
          '[MDV] MdvSnackbar: unsupported color. Use a theme color or a #RGB/#RRGGBB seed.',
        )
      }
    },
    { immediate: true },
  )
}

type PauseReason = 'hover' | 'focus' | 'hidden' | 'manual' | 'modal' | 'inactive' | 'action'
const pauseReasons = new Set<PauseReason>()
let doc: Document | undefined
let unobserveDialogs: (() => void) | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let startedAt = 0
let remaining = 0
let active = true
let entered = false
let enterFinished = false
let pendingClose: MdvSnackbarCloseDetail | undefined
let closeDetail: MdvSnackbarCloseDetail = { reason: 'model' }
let restoreTarget: HTMLElement | null = null
let restoreOnClose = false
let actionVersion = 0

function stopTimer() {
  if (timer === undefined) return
  clearTimeout(timer)
  timer = undefined
  remaining = Math.max(0, remaining - (Date.now() - startedAt))
}

function startTimer() {
  if (
    timer !== undefined ||
    !props.modelValue ||
    !entered ||
    !active ||
    pauseReasons.size ||
    duration.value <= 0 ||
    remaining <= 0
  )
    return
  startedAt = Date.now()
  timer = setTimeout(() => {
    timer = undefined
    remaining = 0
    requestClose('timeout')
  }, remaining)
}

function setPaused(reason: PauseReason, value: boolean) {
  if (value) {
    if (!pauseReasons.has(reason)) stopTimer()
    pauseReasons.add(reason)
  } else {
    pauseReasons.delete(reason)
    startTimer()
  }
}

function pause() {
  setPaused('manual', true)
}

function resume() {
  setPaused('manual', false)
}

function containsFocus(element = root.value) {
  return !!element && !!doc && element.contains(doc.activeElement)
}

function focus() {
  const element = root.value
  if (!doc || !element || blocked.value || !props.modelValue || !active) return
  const previous = doc.activeElement
  if (previous instanceof HTMLElement && !element.contains(previous)) restoreTarget = previous
  const target = element.querySelector<HTMLElement>(
    'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )
  ;(target ?? element).focus({ preventScroll: true })
}

function requestClose(reason: MdvSnackbarCloseReason = 'programmatic') {
  if (!props.modelValue || pendingClose) return
  const detail: MdvSnackbarCloseDetail = { reason }
  pendingClose = detail
  emit('update:modelValue', false)
  void nextTick(() => {
    if (pendingClose === detail) pendingClose = undefined
  })
}

function close() {
  requestClose('programmatic')
}

function onAction(event: MouseEvent) {
  if (actionPending.value) return
  emit('action', event)
  let result: void | Promise<void>
  try {
    result = props.action?.onClick?.()
  } catch (error) {
    emit('actionError', error)
    return
  }
  const shouldClose = !event.defaultPrevented
  if (result && typeof result.then === 'function') {
    const version = ++actionVersion
    actionPending.value = true
    setPaused('action', true)
    void result.then(
      () => {
        if (version !== actionVersion) return
        actionPending.value = false
        setPaused('action', false)
        if (shouldClose && props.modelValue) requestClose('action')
      },
      (error: unknown) => {
        if (version !== actionVersion) return
        actionPending.value = false
        setPaused('action', false)
        emit('actionError', error)
      },
    )
  } else if (shouldClose) requestClose('action')
}

function onKeydown(event: KeyboardEvent) {
  if (
    !event.defaultPrevented &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    props.closeOnEsc &&
    event.key === 'Escape' &&
    containsFocus()
  ) {
    event.preventDefault()
    event.stopPropagation()
    requestClose('escape')
  }
}

function matchesShortcut(event: KeyboardEvent) {
  if (!props.focusShortcut) return false
  const parts = props.focusShortcut.split('+').map((part) => part.trim().toLowerCase())
  const key = parts[parts.length - 1]
  return (
    !!key &&
    event.key.toLowerCase() === key &&
    event.altKey === parts.includes('alt') &&
    event.ctrlKey === parts.includes('ctrl') &&
    event.metaKey === parts.includes('meta') &&
    event.shiftKey === parts.includes('shift')
  )
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (
    !event.defaultPrevented &&
    !event.isComposing &&
    props.modelValue &&
    !blocked.value &&
    active &&
    matchesShortcut(event)
  ) {
    event.preventDefault()
    focus()
  }
}

function onFocusin(event: FocusEvent) {
  if (event.relatedTarget instanceof HTMLElement && !root.value?.contains(event.relatedTarget)) {
    restoreTarget = event.relatedTarget
  }
  setPaused('focus', true)
}

function onFocusout() {
  void nextTick(() => {
    if (!containsFocus()) setPaused('focus', false)
  })
}

function onVisibilitychange() {
  setPaused('hidden', doc?.visibilityState === 'hidden')
}

function hidePopover(element: HTMLElement | null | undefined) {
  if (!element || typeof element.hidePopover !== 'function') return
  try {
    if (element.matches(':popover-open')) element.hidePopover()
  } catch {
    // 元素可能已被浏览器或所属顶层元素关闭。
  }
}

function present() {
  const element = root.value
  if (!doc || !element || !props.modelValue || blocked.value || !active) return
  if (typeof element.showPopover === 'function') {
    try {
      if (!element.matches(':popover-open')) element.showPopover()
    } catch {
      return
    }
  }
  if (enterFinished && !entered) {
    entered = true
    emit('opened')
    startTimer()
  }
}

function syncModal() {
  if (!doc || !anchor.value) return
  const modal = topDialog(doc)
  const owner = anchor.value.closest('dialog')
  blocked.value = modal ? !modal.contains(anchor.value) : !!owner && !owner.open
  setPaused('modal', blocked.value)
  if (blocked.value) hidePopover(root.value)
  else void nextTick(present)
}

function onDialogChange() {
  syncModal()
  // Dialog 在释放栈之后才调用原生 close()，下个微任务复查所属状态。
  queueMicrotask(syncModal)
}

function onEnter() {
  present()
}

function afterEnter() {
  enterFinished = true
  present()
}

function afterLeave(element: Element) {
  hidePopover(element as HTMLElement)
  if (props.modelValue) return
  emit('closed', { ...closeDetail })
  const focused = doc?.activeElement
  const modal = doc && topDialog(doc)
  if (
    restoreOnClose &&
    restoreTarget?.isConnected &&
    !restoreTarget.matches(':disabled') &&
    !restoreTarget.closest('[hidden], [inert]') &&
    (!modal || modal.contains(restoreTarget)) &&
    (!focused || focused === doc?.body || element.contains(focused))
  ) {
    restoreTarget.focus({ preventScroll: true })
  }
  restoreOnClose = false
  restoreTarget = null
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      pendingClose = undefined
      closeDetail = { reason: 'model' }
      entered = false
      enterFinished = false
      remaining = duration.value
      emit('open')
      void nextTick(syncModal)
    } else {
      restoreOnClose = containsFocus()
      closeDetail = pendingClose ?? { reason: 'model' }
      pendingClose = undefined
      stopTimer()
      entered = false
      enterFinished = false
      actionVersion++
      actionPending.value = false
      pauseReasons.delete('hover')
      pauseReasons.delete('focus')
      pauseReasons.delete('action')
      emit('close', { ...closeDetail })
    }
  },
  { flush: 'sync' },
)

watch(
  () => [props.message, props.action?.label, duration.value],
  () => {
    stopTimer()
    remaining = duration.value
    startTimer()
  },
)
watch([() => props.message, () => props.action?.label, () => props.action?.onClick], () => {
  if (!actionPending.value) return
  actionVersion++
  actionPending.value = false
  setPaused('action', false)
})
watch(
  () => props.pauseOnHover,
  (value) => {
    if (!value) setPaused('hover', false)
  },
)

onMounted(() => {
  doc = anchor.value?.ownerDocument
  if (!doc) return
  doc.addEventListener('keydown', onDocumentKeydown)
  doc.addEventListener('visibilitychange', onVisibilitychange)
  unobserveDialogs = observeDialogs(doc, onDialogChange)
  onVisibilitychange()
  syncModal()
  if (props.modelValue) {
    remaining = duration.value
    emit('open')
    if (initiallyHydrated) enterFinished = true
    void nextTick(present)
  }
})
onDeactivated(() => {
  active = false
  setPaused('inactive', true)
  hidePopover(root.value)
})
onActivated(() => {
  if (active) return
  active = true
  syncModal()
  setPaused('inactive', false)
  void nextTick(present)
})
onBeforeUnmount(() => {
  active = false
  actionVersion++
  stopTimer()
  hidePopover(root.value)
  doc?.removeEventListener('keydown', onDocumentKeydown)
  doc?.removeEventListener('visibilitychange', onVisibilitychange)
  unobserveDialogs?.()
})

defineExpose({ close, focus, pause, resume })
</script>

<template>
  <span ref="anchor" hidden aria-hidden="true" />
  <Transition
    name="mdv-snackbar"
    appear
    @enter="onEnter"
    @after-enter="afterEnter"
    @after-leave="afterLeave"
  >
    <div
      v-if="modelValue"
      ref="root"
      v-bind="attrs"
      popover="manual"
      tabindex="-1"
      class="mdv-snackbar-positioner"
      :class="`mdv-snackbar-positioner--${placement}`"
      :style="[colorStyle, attrs.style as StyleValue, positionStyle]"
      :data-blocked="blocked ? '' : undefined"
      :aria-hidden="blocked || undefined"
      :inert="blocked || undefined"
      @keydown="onKeydown"
      @focusin="onFocusin"
      @focusout="onFocusout"
      @pointerenter="pauseOnHover && setPaused('hover', true)"
      @pointerleave="setPaused('hover', false)"
    >
      <div
        class="mdv-snackbar"
        :class="[`mdv-snackbar--${actionLayout}`, { 'mdv-snackbar--has-action': hasAction }]"
      >
        <div class="mdv-snackbar__content">
          <div class="mdv-snackbar__message" role="status" aria-live="polite" aria-atomic="true">
            <slot :close="close">{{ message }}</slot>
          </div>
          <div
            v-if="hasAction"
            class="mdv-snackbar__action"
            :aria-busy="actionPending || undefined"
          >
            <slot name="action" :close="close" :pending="actionPending">
              <button
                v-if="action"
                type="button"
                class="mdv-snackbar__action-button"
                :disabled="actionPending"
                @click="onAction"
              >
                {{ action.label }}
              </button>
            </slot>
          </div>
        </div>
        <button
          v-if="isClosable"
          type="button"
          class="mdv-snackbar__close"
          :aria-label="closeLabel"
          @click="requestClose('close-button')"
        >
          <MdvIcon :icon="closeIcon" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Transition>
</template>
