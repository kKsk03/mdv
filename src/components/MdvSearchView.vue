<script setup lang="ts">
import {
  computed,
  mergeProps,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { ComponentPublicInstance, InputHTMLAttributes, VNode } from 'vue'
import backIcon from '@iconify-icons/material-symbols/arrow-back'
import MdvSearchBar from './MdvSearchBar.vue'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { createSearchAnimator } from './search-motion'
import { observeSearchPosition } from './search-position'
import { useSearchKeyboardFocus } from './search-focus'
import { useDialog } from './use-dialog'
import { dialogTabStops } from './dialog-modal'
import type { MdvDialogCloseDetail } from './dialog.types'
import type {
  MdvSearchCloseDetail,
  MdvSearchCloseReason,
  MdvSearchSlotProps,
  MdvSearchTriggerProps,
  MdvSearchTriggerSlotProps,
  MdvSearchViewProps,
} from './search.types'

defineOptions({ name: 'MdvSearchView', inheritAttrs: false })
const query = defineModel<string>({ default: '' })
const expanded = defineModel<boolean>('open', { default: false })
const props = withDefaults(defineProps<Omit<MdvSearchViewProps, 'modelValue' | 'open'>>(), {
  variant: 'contained',
  layout: 'auto',
  disabled: false,
  readonly: false,
  clearable: true,
  loading: false,
  closeOnEsc: true,
  closeOnScrim: true,
  destroyOnClose: false,
  statusText: '',
})
const slots = defineSlots<{
  trigger?(state: MdvSearchTriggerSlotProps): VNode[]
  leading?(state: MdvSearchSlotProps): VNode[]
  trailing?(state: MdvSearchSlotProps): VNode[]
  default?(state: MdvSearchSlotProps): VNode[]
}>()
const emit = defineEmits<{
  search: [query: string, originalEvent?: Event]
  clear: []
  open: []
  opened: []
  close: [detail: MdvSearchCloseDetail]
  closed: [detail: MdvSearchCloseDetail]
}>()
const attrs = useAttrs()
const element = useTemplateRef<HTMLDivElement>('element')
useSearchKeyboardFocus(element)
const entry = useTemplateRef<InstanceType<typeof MdvSearchBar>>('entry')
const field = useTemplateRef<InstanceType<typeof MdvSearchBar>>('field')
const trigger = shallowRef<HTMLElement | null>(null)
const compact = ref(false)
const actualLayout = computed(() =>
  props.layout === 'auto' ? (compact.value ? 'fullscreen' : 'docked') : props.layout,
)
let position: ReturnType<typeof observeSearchPosition> | undefined
let responsive: MediaQueryList | undefined
let pendingReason: MdvSearchCloseReason | undefined
let closeRequest: Promise<boolean> | undefined
let acceptedDetail: MdvSearchCloseDetail = { reason: 'model' }
let suppressEntryFocus = false
let clearingEntry = false
let mounted = false
let openRequest = 0
let opener: HTMLElement | undefined
let pendingNavigation: 'first' | 'last' | undefined
let selection:
  | { start: number | null; end: number | null; direction: 'forward' | 'backward' | 'none' | null }
  | undefined

function anchor() {
  return trigger.value ?? entry.value?.element ?? null
}
function detail(original: MdvDialogCloseDetail): MdvSearchCloseDetail {
  return {
    reason:
      original.reason === 'action'
        ? (pendingReason ?? 'programmatic')
        : original.reason === 'escape'
          ? 'escape'
          : original.reason === 'scrim'
            ? 'scrim'
            : 'model',
  }
}
function dialogEmit(
  event: 'update:modelValue' | 'open' | 'opened' | 'close' | 'closed',
  payload?: boolean | MdvDialogCloseDetail,
) {
  if (event === 'update:modelValue') expanded.value = payload === true
  else if (event === 'open') {
    emit('open')
    const target = pendingNavigation
    pendingNavigation = undefined
    if (target)
      void nextTick(() => {
        if (!expanded.value) return
        const candidates = results()
        focusResult(target === 'first' ? candidates[0] : candidates[candidates.length - 1])
      })
  } else if (event === 'opened') emit('opened')
  else if (event === 'close') {
    suppressEntryFocus = true
    acceptedDetail = detail(payload as MdvDialogCloseDetail)
    emit('close', acceptedDetail)
  } else {
    position?.stop()
    position = undefined
    emit('closed', acceptedDetail)
    void nextTick(() => {
      suppressEntryFocus = false
    })
  }
}
const modal = useDialog(
  {
    get modelValue() {
      return expanded.value
    },
    get closeOnEsc() {
      return props.closeOnEsc
    },
    get closeOnScrim() {
      return props.closeOnScrim
    },
    get destroyOnClose() {
      return props.destroyOnClose
    },
    beforeClose: (original) => props.beforeClose?.(Object.freeze(detail(original))),
  },
  dialogEmit,
  {
    name: 'MdvSearchView',
    role: 'dialog',
    hasTitle: () => false,
    hasContentSlot: () => true,
    animate: createSearchAnimator(anchor),
    prepare: asyncPrepare,
    returnFocus: () => opener,
  },
)
const { phase, rendered, listeners, id } = modal
const state = computed<MdvSearchSlotProps>(() => ({
  query: query.value,
  expanded: expanded.value,
  close: closeView,
  search,
}))
const triggerProps = computed<MdvSearchTriggerProps>(() => ({
  ref: (value: Element | ComponentPublicInstance | null) => {
    const candidate = value && '$el' in value ? (value.$el as HTMLElement) : value
    trigger.value = candidate?.nodeType === 1 ? (candidate as HTMLElement) : null
  },
  'aria-haspopup': 'dialog',
  'aria-controls': id,
  'aria-expanded': expanded.value,
  disabled: props.disabled || undefined,
  onClick: (event) => {
    if (event.defaultPrevented || event.button !== 0) return
    ;(event.currentTarget as HTMLElement).focus({ preventScroll: true })
    void openView()
  },
}))

function inputProps(inView: boolean): InputHTMLAttributes {
  const result = { ...props.inputAttrs }
  // 保留 DOM 和草稿，但任意时刻只让当前可编辑输入参与表单。
  if (inView ? !expanded.value : expanded.value) {
    delete result.name
    delete result.required
    // 空 form 显式解除关联；保留的非活动输入不重复处理同一表单的 reset。
    result.form = ''
  }
  return mergeProps(result, {
    id:
      result.id && (inView ? expanded.value : !expanded.value)
        ? result.id
        : `${id}-${inView ? 'input' : 'entry'}`,
    autofocus: inView && expanded.value ? true : undefined,
    'aria-controls': inView ? `${id}-results` : id,
    'aria-expanded': expanded.value ? 'true' : 'false',
    'aria-haspopup': inView ? undefined : 'dialog',
    onKeydown: (event: KeyboardEvent) => inputKeydown(event, inView),
  })
}
function barProps(inView: boolean) {
  return {
    modelValue: query.value,
    placeholder: props.placeholder,
    label: props.label,
    disabled: props.disabled || (inView ? !expanded.value : expanded.value),
    readonly: props.readonly,
    clearable: props.clearable,
    clearLabel: props.clearLabel,
    loading: props.loading,
  }
}
async function openView() {
  if (props.disabled) return false
  if (expanded.value) return true
  opener = (slots.trigger ? trigger.value : entry.value?.inputElement) ?? undefined
  const input = entry.value?.inputElement
  if (input)
    selection = {
      start: input.selectionStart,
      end: input.selectionEnd,
      direction: input.selectionDirection,
    }
  const ticket = ++openRequest
  expanded.value = true
  await nextTick()
  return ticket === openRequest && expanded.value
}
function entryFocus(event: FocusEvent) {
  if (event.defaultPrevented || suppressEntryFocus || clearingEntry || phase.value !== 'closed')
    return
  void openView()
}
function clearEntry() {
  clearingEntry = true
  emit('clear')
  void nextTick(() => {
    clearingEntry = false
  })
}
function entryClick(event: MouseEvent) {
  if (!event.defaultPrevented && !props.disabled) void openView()
}
async function asyncPrepare() {
  position?.stop()
  const panel = modal.elements.container.value
  const dialog = modal.elements.dialog.value
  if (panel && dialog) {
    position = observeSearchPosition({
      anchor,
      panel,
      dialog,
      layout: () => actualLayout.value,
      variant: () => props.variant,
    })
    await position.refresh()
  }
  if (!mounted) return
  if (selection && field.value?.inputElement) {
    const input = field.value.inputElement
    input.setSelectionRange(selection.start, selection.end, selection.direction ?? undefined)
  }
  selection = undefined
}
function requestClose(reason: MdvSearchCloseReason) {
  if (closeRequest) return closeRequest
  pendingReason = reason
  closeRequest = modal.requestClose('action').finally(() => {
    pendingReason = undefined
    closeRequest = undefined
  })
  return closeRequest
}
function closeView() {
  return requestClose('programmatic')
}
function search(event?: Event) {
  if (props.disabled) return
  emit('search', query.value, event)
  void nextTick(() => {
    if (expanded.value) modal.elements.content.value?.focus({ preventScroll: true })
    else entry.value?.blur()
  })
}
function results() {
  const root = modal.elements.content.value
  const dialog = modal.elements.dialog.value
  if (!root || !dialog) return []
  const available = new Set(dialogTabStops(dialog))
  return [
    ...root.querySelectorAll<HTMLElement>('.mdv-list-item__primary, [data-mdv-search-result]'),
  ].filter((item) => available.has(item) && !item.closest('[aria-disabled="true"]'))
}
function focusResult(item?: HTMLElement) {
  if (!item) return
  item.focus({ preventScroll: true })
  const viewport = modal.elements.content.value
  if (!viewport) return
  const box = item.getBoundingClientRect()
  const bounds = viewport.getBoundingClientRect()
  if (box.top < bounds.top) viewport.scrollTop -= bounds.top - box.top
  else if (box.bottom > bounds.bottom) viewport.scrollTop += box.bottom - bounds.bottom
}
function inputKeydown(event: KeyboardEvent, inView: boolean) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.isComposing ||
    event.keyCode === 229 ||
    !['ArrowDown', 'ArrowUp'].includes(event.key)
  )
    return
  event.preventDefault()
  if (!inView && phase.value === 'closed') {
    pendingNavigation = event.key === 'ArrowDown' ? 'first' : 'last'
    void openView().then((accepted) => {
      if (!accepted) pendingNavigation = undefined
    })
    return
  }
  void (async () => {
    await nextTick()
    const candidates = results()
    focusResult(event.key === 'ArrowDown' ? candidates[0] : candidates[candidates.length - 1])
  })()
}
function resultKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  const candidates = results()
  const index = candidates.indexOf(event.target as HTMLElement)
  if (index < 0) return
  let next: HTMLElement | undefined
  if (event.key === 'Home') next = candidates[0]
  else if (event.key === 'End') next = candidates[candidates.length - 1]
  else if (event.key === 'ArrowDown') next = candidates[Math.min(index + 1, candidates.length - 1)]
  else if (event.key === 'ArrowUp') {
    if (index === 0) {
      event.preventDefault()
      field.value?.focus({ preventScroll: true })
      return
    }
    next = candidates[index - 1]
  } else return
  event.preventDefault()
  focusResult(next)
}
function viewportChange() {
  compact.value = responsive?.matches ?? false
  void nextTick(() => position?.refresh())
}
function start() {
  if (mounted) return
  mounted = true
  responsive = element.value?.ownerDocument.defaultView?.matchMedia?.('(max-width: 599px)')
  responsive?.addEventListener('change', viewportChange)
  viewportChange()
}
function stop() {
  mounted = false
  openRequest++
  pendingNavigation = undefined
  position?.stop()
  position = undefined
  responsive?.removeEventListener('change', viewportChange)
  responsive = undefined
}
watch([actualLayout, () => props.variant], () => void nextTick(() => position?.refresh()))
onMounted(start)
onActivated(start)
onDeactivated(stop)
onBeforeUnmount(stop)
onUpdated(() => {
  if (phase.value === 'open') void position?.refresh()
})
defineExpose({
  element,
  inputElement: computed(() =>
    expanded.value ? field.value?.inputElement : entry.value?.inputElement,
  ),
  open: openView,
  close: closeView,
  focus: (options?: FocusOptions) => {
    if (expanded.value) field.value?.focus(options)
    else if (entry.value) entry.value.focus(options)
    else trigger.value?.focus(options)
  },
  blur: () => {
    if (expanded.value) field.value?.blur()
    else if (entry.value) entry.value.blur()
    else trigger.value?.blur()
  },
})
</script>

<template>
  <div
    ref="element"
    v-bind="attrs"
    class="mdv-search-view"
    :class="{ 'mdv-search-view--custom-trigger': !!slots.trigger }"
  >
    <slot name="trigger" v-bind="{ ...state, triggerProps }">
      <MdvSearchBar
        ref="entry"
        v-bind="{ ...inputProps(false), ...barProps(false) }"
        class="mdv-search-view__entry"
        :class="{ 'mdv-search-view__entry--hidden': expanded }"
        @update:model-value="query = $event"
        @focus="entryFocus"
        @click="entryClick"
        @search="(_query, event) => search(event)"
        @clear="clearEntry"
      >
        <template v-if="slots.leading" #leading><slot name="leading" v-bind="state" /></template>
        <template v-if="slots.trailing" #trailing><slot name="trailing" v-bind="state" /></template>
      </MdvSearchBar>
    </slot>
    <dialog
      :id="id"
      ref="dialog"
      class="mdv-search-dialog"
      :class="[`mdv-search-dialog--${variant}`, `mdv-search-dialog--${actualLayout}`]"
      :data-state="phase"
      :aria-label="label ?? placeholder"
      aria-modal="true"
      tabindex="-1"
      closedby="none"
      v-on="listeners"
    >
      <div ref="scrim" class="mdv-search-dialog__scrim" aria-hidden="true" />
      <div v-if="rendered" ref="container" class="mdv-search-dialog__container">
        <div ref="header" class="mdv-search-dialog__header">
          <MdvSearchBar
            ref="field"
            v-bind="{ ...inputProps(true), ...barProps(true) }"
            class="mdv-search-dialog__field"
            @update:model-value="query = $event"
            @search="(_query, event) => search(event)"
            @clear="emit('clear')"
          >
            <template
              v-if="actualLayout === 'fullscreen' || variant === 'divided' || slots.trigger"
              #leading
            >
              <MdvIconButton
                variant="standard"
                :aria-label="backLabel"
                @click="requestClose('back')"
              >
                <MdvIcon class="mdv-search-dialog__back" :icon="backIcon" />
              </MdvIconButton>
            </template>
            <template v-if="slots.trailing" #trailing
              ><slot name="trailing" v-bind="state"
            /></template>
          </MdvSearchBar>
        </div>
        <div
          :id="id + '-results'"
          ref="content"
          class="mdv-search-dialog__results"
          role="region"
          :aria-label="resultsLabel"
          :aria-busy="loading ? 'true' : undefined"
          tabindex="0"
          @keydown="resultKeydown"
        >
          <slot v-bind="state" />
        </div>
        <span
          class="mdv-search-dialog__status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          >{{ statusText }}</span
        >
      </div>
    </dialog>
  </div>
</template>
