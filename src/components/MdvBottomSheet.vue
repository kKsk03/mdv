<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import type { StyleValue, VNode } from 'vue'
import unfoldIcon from '@iconify-icons/material-symbols/unfold-more'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { focusDialog } from './dialog-modal'
import { useDialog } from './use-dialog'
import { useBottomSheet } from './use-bottom-sheet'
import type { MdvDialogCloseDetail } from './dialog.types'
import type {
  MdvBottomSheetChangeDetail,
  MdvBottomSheetCloseDetail,
  MdvBottomSheetCloseReason,
  MdvBottomSheetProps,
  MdvBottomSheetSlotProps,
} from './bottom-sheet.types'

defineOptions({ name: 'MdvBottomSheet', inheritAttrs: false })
const props = withDefaults(defineProps<MdvBottomSheetProps>(), {
  modelValue: false,
  expanded: false,
  partial: true,
  title: '',
  description: '',
  showHandle: true,
  draggable: true,
  expandLabel: '展开面板',
  collapseLabel: '收起面板',
  closeLabel: '关闭面板',
  closeOnEsc: true,
  closeOnScrim: true,
  closeOnSwipe: true,
  destroyOnClose: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:expanded': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvBottomSheetCloseDetail]
  closed: [detail: MdvBottomSheetCloseDetail]
  change: [detail: MdvBottomSheetChangeDetail]
}>()
const slots = defineSlots<{
  default?(props: MdvBottomSheetSlotProps): VNode[]
  header?(props: MdvBottomSheetSlotProps): VNode[]
  actions?(props: MdvBottomSheetSlotProps): VNode[]
}>()
const instance = getCurrentInstance()!
const localExpanded = ref(props.expanded)
watch(
  () => props.modelValue,
  (value) => {
    if (value) localExpanded.value = props.expanded
  },
  { flush: 'sync' },
)
const bounds = useTemplateRef<HTMLElement>('bounds')
let origin: 'handle' | 'swipe' | null = null
let closing: Promise<boolean> | null = null
let closingVersion = 0
let closeDetail: MdvBottomSheetCloseDetail = { reason: 'model', returnValue: '' }

function expandControlled() {
  return Object.prototype.hasOwnProperty.call(instance.vnode.props ?? {}, 'expanded')
}
function requestedExpanded() {
  return expandControlled() ? props.expanded : localExpanded.value
}
function detail(value: MdvDialogCloseDetail): MdvBottomSheetCloseDetail {
  return { ...value, reason: value.reason === 'action' && origin ? origin : value.reason }
}
function forward(
  event: 'update:modelValue' | 'open' | 'opened' | 'close' | 'closed',
  value?: boolean | MdvDialogCloseDetail,
) {
  if (event === 'update:modelValue') emit('update:modelValue', value as boolean)
  else if (event === 'open') emit('open')
  else if (event === 'opened') emit('opened')
  else if (event === 'close') {
    closeDetail = detail(value as MdvDialogCloseDetail)
    emit('close', { ...closeDetail })
  } else emit('closed', { ...closeDetail })
}

const modal = useDialog(
  {
    get modelValue() {
      return props.modelValue
    },
    get title() {
      return props.title
    },
    get description() {
      return props.description
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
    beforeClose(value) {
      return props.beforeClose?.(Object.freeze(detail(value)))
    },
  },
  forward,
  {
    name: 'MdvBottomSheet',
    role: 'dialog',
    hasTitle: () => !!(props.title || slots.header),
    hasContentSlot: () => !!slots.default,
    prepare: () => sheet.prepareModal(),
    animate: (_elements, entering, previous) => sheet.animateModal(entering, previous),
  },
)
const { attrs, id, phase, rendered, rootAttrs, rootStyle, listeners } = modal

function requestClose(reason: MdvBottomSheetCloseReason = 'action', returnValue = '') {
  if (closing) return closing
  const ticket = ++closingVersion
  origin = reason === 'handle' || reason === 'swipe' ? reason : null
  closing = modal
    .requestClose(origin ? 'action' : (reason as MdvDialogCloseDetail['reason']), returnValue)
    .finally(() => {
      if (ticket !== closingVersion) return
      closing = null
      origin = null
    })
  return closing
}
function invalidateClose() {
  closingVersion++
  closing = null
  origin = null
}
onDeactivated(invalidateClose)
onBeforeUnmount(invalidateClose)

const sheet = useBottomSheet({
  modal: true,
  root: () => modal.elements.dialog.value,
  bounds: () => bounds.value,
  panel: () => modal.elements.container.value,
  content: () => modal.elements.content.value,
  scrim: () => modal.elements.scrim.value,
  phase: () => phase.value,
  state: () =>
    !props.modelValue
      ? 'hidden'
      : requestedExpanded() || props.partial === false
        ? 'expanded'
        : 'partial',
  draggable: () => props.draggable,
  canHide: () => props.closeOnSwipe,
  partialHeight(height) {
    if (props.partial === false) return 0
    const ratio =
      typeof props.partial === 'number' && Number.isFinite(props.partial) ? props.partial : 0.5
    return height * Math.max(0, Math.min(1, ratio))
  },
  async request(value, reason) {
    if (value === 'hidden')
      return requestClose(reason === 'swipe' || reason === 'handle' ? reason : 'action')
    if (!props.modelValue || (value === 'partial' && !sheet.hasPartial.value)) return false
    const next = value === 'expanded'
    if (!expandControlled()) localExpanded.value = next
    emit('update:expanded', next)
    await nextTick()
    return requestedExpanded() === next
  },
  change: (value) => emit('change', value),
})
const {
  state: currentState,
  expanded: isExpanded,
  fullHeight: isFullHeight,
  canChange,
  dragging: isDragging,
} = sheet
const handleLabel = computed(() => (!isExpanded.value ? props.expandLabel : props.closeLabel))
const alternativeLabel = computed(() =>
  isExpanded.value ? props.collapseLabel : props.expandLabel,
)
function toggleAlternative() {
  return isExpanded.value ? sheet.collapse() : sheet.expand()
}
const slotProps = computed<MdvBottomSheetSlotProps>(() => ({
  state: currentState.value,
  expanded: isExpanded.value,
  close: (returnValue = '') => requestClose('action', returnValue),
  expand: sheet.expand,
  collapse: sheet.collapse,
}))
watch(
  () => props.expanded,
  (value) => {
    localExpanded.value = value
    sheet.schedule()
  },
)
watch(() => props.modelValue, invalidateClose)
watch(() => [props.partial, props.maxHeight, props.showHandle, props.closeOnSwipe], sheet.schedule)
function focus() {
  const element = modal.elements.dialog.value
  if (element?.open) focusDialog(element)
}
defineExpose({
  close: (returnValue = '') => requestClose('action', returnValue),
  expand: sheet.expand,
  collapse: sheet.collapse,
  focus,
})
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="rootAttrs()"
    :style="rootStyle()"
    class="mdv-dialog mdv-bottom-sheet"
    :data-state="phase"
    tabindex="-1"
    closedby="none"
    aria-modal="true"
    v-on="listeners"
  >
    <div ref="scrim" class="mdv-bottom-sheet__scrim" aria-hidden="true" />
    <div ref="bounds" class="mdv-bottom-sheet__bounds" :style="{ height: maxHeight }">
      <section
        v-if="rendered"
        ref="container"
        class="mdv-bottom-sheet__panel"
        :class="[
          attrs.class,
          {
            'mdv-bottom-sheet__panel--full': isFullHeight,
            'mdv-bottom-sheet__panel--dragging': isDragging,
          },
        ]"
        :style="attrs.style as StyleValue"
        :data-sheet-state="currentState"
        @pointerdown="sheet.listeners.pointerdown"
        @touchstart.passive="sheet.listeners.touchstart"
        @touchmove="sheet.listeners.touchmove"
        @touchend="sheet.listeners.touchend"
        @touchcancel="sheet.listeners.touchcancel"
        @click.capture="sheet.listeners.clickCapture"
      >
        <div v-if="showHandle" class="mdv-bottom-sheet__handle-bar">
          <button
            type="button"
            data-mdv-sheet-handle
            class="mdv-bottom-sheet__handle"
            :class="{ 'mdv-bottom-sheet__handle--static': !sheet.canDrag.value }"
            :aria-label="handleLabel"
            :aria-expanded="isExpanded"
            :disabled="!canChange"
            @click="sheet.toggle"
          >
            <span class="mdv-bottom-sheet__handle-mark" />
          </button>
        </div>
        <div
          ref="content"
          class="mdv-bottom-sheet__content"
          :class="{ 'mdv-bottom-sheet__content--concealed': sheet.contentHidden.value }"
          :inert="sheet.contentHidden.value ? true : undefined"
          :aria-hidden="sheet.contentHidden.value ? true : undefined"
          :tabindex="sheet.scrollable.value ? 0 : undefined"
          @scroll.passive="sheet.contentScroll"
        >
          <header
            v-if="title || slots.header || (!showHandle && sheet.hasPartial.value)"
            ref="header"
            class="mdv-bottom-sheet__header"
          >
            <div v-if="slots.header" :id="id + '-title'" class="mdv-bottom-sheet__heading">
              <slot name="header" v-bind="slotProps" />
            </div>
            <h2 v-else-if="title" :id="id + '-title'" class="mdv-bottom-sheet__title">
              {{ title }}
            </h2>
            <MdvIconButton
              v-if="!showHandle && sheet.hasPartial.value"
              variant="standard"
              :aria-label="alternativeLabel"
              @click="toggleAlternative"
              ><MdvIcon :icon="unfoldIcon"
            /></MdvIconButton>
          </header>
          <div class="mdv-bottom-sheet__body">
            <slot v-bind="slotProps"
              ><p
                v-if="description"
                :id="id + '-description'"
                class="mdv-bottom-sheet__description"
              >
                {{ description }}
              </p></slot
            >
          </div>
          <div v-if="slots.actions" ref="actions" class="mdv-bottom-sheet__actions">
            <slot name="actions" v-bind="slotProps" />
          </div>
        </div>
      </section>
    </div>
  </dialog>
</template>
