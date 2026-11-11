<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import unfoldIcon from '@iconify-icons/material-symbols/unfold-more'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { useBottomSheet } from './use-bottom-sheet'
import type {
  MdvBottomSheetChangeDetail,
  MdvBottomSheetCloseDetail,
  MdvBottomSheetScaffoldProps,
  MdvBottomSheetSlotProps,
  MdvBottomSheetState,
} from './bottom-sheet.types'

defineOptions({ name: 'MdvBottomSheetScaffold', inheritAttrs: false })
const props = withDefaults(defineProps<MdvBottomSheetScaffoldProps>(), {
  modelValue: 'partial',
  peekHeight: 56,
  hideable: false,
  title: '',
  description: '',
  showHandle: true,
  draggable: true,
  expandLabel: '展开面板',
  collapseLabel: '收起面板',
  closeLabel: '关闭面板',
})
const emit = defineEmits<{
  'update:modelValue': [value: MdvBottomSheetState]
  open: []
  opened: []
  close: [detail: MdvBottomSheetCloseDetail]
  closed: [detail: MdvBottomSheetCloseDetail]
  change: [detail: MdvBottomSheetChangeDetail]
}>()
const slots = defineSlots<{
  default?(): VNode[]
  sheet?(props: MdvBottomSheetSlotProps): VNode[]
  header?(props: MdvBottomSheetSlotProps): VNode[]
  actions?(props: MdvBottomSheetSlotProps): VNode[]
}>()
const instance = getCurrentInstance()!
const attrs = useAttrs()
const id = `mdv-bottom-sheet-${useId()}`
const root = useTemplateRef<HTMLElement>('root')
const bounds = useTemplateRef<HTMLElement>('bounds')
const panel = useTemplateRef<HTMLElement>('panel')
const content = useTemplateRef<HTMLElement>('content')
const localState = ref<MdvBottomSheetState>(props.modelValue)
function desiredState() {
  return Object.prototype.hasOwnProperty.call(instance.vnode.props ?? {}, 'modelValue') ||
    Object.prototype.hasOwnProperty.call(instance.vnode.props ?? {}, 'model-value')
    ? props.modelValue
    : localState.value
}
const phase = ref(desiredState() === 'hidden' ? 'closed' : 'opening')
let closeDetail: MdvBottomSheetCloseDetail = { reason: 'model', returnValue: '' }
const sheet = useBottomSheet({
  modal: false,
  root: () => root.value,
  bounds: () => bounds.value,
  panel: () => panel.value,
  content: () => content.value,
  state: desiredState,
  draggable: () => props.draggable,
  canHide: () => props.hideable,
  partialHeight: () => (Number.isFinite(props.peekHeight) ? Math.max(0, props.peekHeight) : 56),
  async request(value) {
    if (
      !Object.prototype.hasOwnProperty.call(instance.vnode.props ?? {}, 'modelValue') &&
      !Object.prototype.hasOwnProperty.call(instance.vnode.props ?? {}, 'model-value')
    )
      localState.value = value
    emit('update:modelValue', value)
    await nextTick()
    return desiredState() === value
  },
  change(value) {
    if (value.previousState === 'hidden' && value.state !== 'hidden') {
      phase.value = 'opening'
      emit('open')
    }
    if (value.state === 'hidden' && value.previousState !== 'hidden') {
      phase.value = 'closing'
      closeDetail = { reason: value.reason === 'resize' ? 'model' : value.reason, returnValue: '' }
      emit('close', { ...closeDetail })
    }
    emit('change', value)
  },
  settled(value) {
    if (value === 'hidden' && phase.value === 'closing') {
      phase.value = 'closed'
      emit('closed', { ...closeDetail })
    } else if (value !== 'hidden' && phase.value === 'opening') {
      phase.value = 'open'
      emit('opened')
    }
  },
})
const {
  state: currentState,
  expanded: isExpanded,
  fullHeight: isFullHeight,
  canChange,
  dragging: isDragging,
} = sheet
const hidden = computed(() => phase.value === 'closed')
const handleLabel = computed(() =>
  !isExpanded.value ? props.expandLabel : props.hideable ? props.closeLabel : props.collapseLabel,
)
const alternativeLabel = computed(() =>
  isExpanded.value ? props.collapseLabel : props.expandLabel,
)
const reserved = computed(() =>
  currentState.value === 'hidden'
    ? 0
    : Math.min(sheet.visibleHeight.value, sheet.previewHeight.value),
)
const slotProps = computed<MdvBottomSheetSlotProps>(() => ({
  state: currentState.value,
  expanded: isExpanded.value,
  close: () => sheet.request('hidden', 'action'),
  expand: sheet.expand,
  collapse: sheet.collapse,
}))
function focus() {
  if (currentState.value === 'hidden') return
  const handle = panel.value?.querySelector<HTMLButtonElement>(
    'button[data-mdv-sheet-handle]:not(:disabled)',
  )
  ;(handle ?? panel.value)?.focus({ preventScroll: true })
}
function toggleAlternative() {
  return isExpanded.value ? sheet.collapse() : sheet.expand()
}
watch(() => [props.peekHeight, props.maxHeight, props.showHandle, props.hideable], sheet.schedule)
onMounted(() => {
  if (currentState.value !== 'hidden') emit('open')
})
defineExpose({
  close: () => sheet.request('hidden', 'action'),
  expand: sheet.expand,
  collapse: sheet.collapse,
  focus,
})
</script>

<template>
  <div ref="root" v-bind="attrs" class="mdv-bottom-sheet-scaffold" :data-state="phase">
    <div class="mdv-bottom-sheet-scaffold__main" :style="{ paddingBottom: reserved + 'px' }">
      <slot />
    </div>
    <div ref="bounds" class="mdv-bottom-sheet__bounds" :style="{ height: maxHeight }">
      <section
        ref="panel"
        role="region"
        class="mdv-bottom-sheet__panel"
        :hidden="hidden"
        :inert="currentState === 'hidden' ? true : undefined"
        :aria-hidden="currentState === 'hidden' ? true : undefined"
        :aria-label="!title && !slots.header ? '底部面板' : undefined"
        :aria-labelledby="title || slots.header ? id + '-title' : undefined"
        :aria-describedby="!slots.sheet && description ? id + '-description' : undefined"
        :class="{
          'mdv-bottom-sheet__panel--full': isFullHeight,
          'mdv-bottom-sheet__panel--dragging': isDragging,
        }"
        :data-sheet-state="currentState"
        tabindex="-1"
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
            <slot name="sheet" v-bind="slotProps"
              ><p
                v-if="description"
                :id="id + '-description'"
                class="mdv-bottom-sheet__description"
              >
                {{ description }}
              </p></slot
            >
          </div>
          <div v-if="slots.actions" class="mdv-bottom-sheet__actions">
            <slot name="actions" v-bind="slotProps" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
