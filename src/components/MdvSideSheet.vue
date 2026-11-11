<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, watch } from 'vue'
import type { StyleValue, VNode } from 'vue'
import closeIcon from '@iconify-icons/material-symbols/close'
import backIcon from '@iconify-icons/material-symbols/arrow-back'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { focusDialog, topDialog } from './dialog-modal'
import { createSideSheetMotion, sideSheetDirection } from './side-sheet-motion'
import { useDialog } from './use-dialog'
import { useSideSheetSwipe } from './use-side-sheet-swipe'
import type { MdvDialogCloseDetail } from './dialog.types'
import type {
  MdvSideSheetCloseDetail,
  MdvSideSheetCloseReason,
  MdvSideSheetProps,
  MdvSideSheetSlotProps,
} from './side-sheet.types'

defineOptions({ name: 'MdvSideSheet', inheritAttrs: false })
const props = withDefaults(defineProps<MdvSideSheetProps>(), {
  modelValue: false,
  title: '',
  description: '',
  width: '256px',
  placement: 'end',
  detached: false,
  showBack: false,
  backLabel: '返回',
  closeLabel: '关闭面板',
  dividers: false,
  closeOnEsc: true,
  closeOnScrim: true,
  closeOnSwipe: true,
  destroyOnClose: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvSideSheetCloseDetail]
  closed: [detail: MdvSideSheetCloseDetail]
  back: []
}>()
const slots = defineSlots<{
  default?(props: MdvSideSheetSlotProps): VNode[]
  header?(props: MdvSideSheetSlotProps): VNode[]
  actions?(props: MdvSideSheetSlotProps): VNode[]
}>()
let swipeOrigin = false
let exitVelocity = 0
let closing: Promise<boolean> | null = null
let closeVersion = 0
let closeDetail: MdvSideSheetCloseDetail = { reason: 'model', returnValue: '' }

function detail(value: MdvDialogCloseDetail): MdvSideSheetCloseDetail {
  return { ...value, reason: value.reason === 'action' && swipeOrigin ? 'swipe' : value.reason }
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
    name: 'MdvSideSheet',
    role: 'dialog',
    hasTitle: () => !!(props.title || slots.header),
    hasContentSlot: () => !!slots.default,
    prepare: () =>
      motion.jump(
        !!modal.elements.dialog.value?.ownerDocument.defaultView?.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches,
      ),
    animate: (_elements, entering) => {
      const result = motion.play(entering, entering ? 0 : exitVelocity)
      exitVelocity = 0
      return result
    },
  },
)
const { attrs, id, phase, rendered, scrollable, rootStyle, listeners } = modal
const direction = () => sideSheetDirection(modal.elements.dialog.value, props.placement)
const motion = createSideSheetMotion({
  panel: () => modal.elements.container.value,
  scrim: () => modal.elements.scrim.value,
  direction,
})

function requestClose(reason: MdvSideSheetCloseReason = 'action', returnValue = '') {
  if (closing) return closing
  const ticket = ++closeVersion
  swipeOrigin = reason === 'swipe'
  closing = modal
    .requestClose(swipeOrigin ? 'action' : (reason as MdvDialogCloseDetail['reason']), returnValue)
    .finally(() => {
      if (ticket !== closeVersion) return
      closing = null
      swipeOrigin = false
      exitVelocity = 0
    })
  return closing
}
const swipe = useSideSheetSwipe({
  panel: () => modal.elements.container.value,
  enabled: () => {
    const element = modal.elements.dialog.value
    return (
      props.modelValue &&
      props.closeOnSwipe &&
      !!element &&
      topDialog(element.ownerDocument) === element &&
      (phase.value === 'open' || phase.value === 'opening')
    )
  },
  motion,
  direction,
  close(velocity) {
    exitVelocity = velocity
    return requestClose('swipe')
  },
})
function invalidateClose() {
  closeVersion++
  closing = null
  swipeOrigin = false
  exitVelocity = 0
}
watch(
  () => props.modelValue,
  () => {
    invalidateClose()
    swipe.cancel(false)
  },
)
watch(
  () => [props.width, props.placement, props.detached, props.closeOnSwipe, attrs.dir],
  () => {
    swipe.cancel(false)
    if (phase.value === 'open') motion.jump(true)
  },
)
onDeactivated(invalidateClose)
onBeforeUnmount(invalidateClose)
function rootAttrs() {
  const result = modal.rootAttrs()
  if (!result['aria-label'] && !result['aria-labelledby']) result['aria-label'] = '侧边面板'
  return result
}
const slotProps = computed<MdvSideSheetSlotProps>(() => ({
  close: (returnValue = '') => requestClose('action', returnValue),
}))
function focus() {
  const element = modal.elements.dialog.value
  if (element?.open) focusDialog(element)
}
defineExpose({ close: (returnValue = '') => requestClose('action', returnValue), focus })
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="rootAttrs()"
    :style="[{ '--mdv-side-sheet-width': width }, rootStyle()]"
    class="mdv-dialog mdv-side-sheet"
    :class="{ 'mdv-side-sheet--detached': detached }"
    :data-placement="placement"
    :data-state="phase"
    tabindex="-1"
    closedby="none"
    aria-modal="true"
    v-on="listeners"
  >
    <div ref="scrim" class="mdv-side-sheet__scrim" aria-hidden="true" />
    <section
      v-if="rendered"
      ref="container"
      class="mdv-side-sheet__panel"
      :class="[
        attrs.class,
        {
          'mdv-side-sheet__panel--dividers': dividers,
          'mdv-side-sheet__panel--back': showBack,
          'mdv-side-sheet__panel--dragging': swipe.dragging.value,
        },
      ]"
      :style="[{ '--mdv-side-sheet-width': width }, attrs.style as StyleValue]"
    >
      <header ref="header" class="mdv-side-sheet__header">
        <MdvIconButton
          v-if="showBack"
          class="mdv-side-sheet__back"
          variant="standard"
          :aria-label="backLabel"
          @click="emit('back')"
        >
          <MdvIcon :icon="backIcon" />
        </MdvIconButton>
        <div v-if="slots.header" :id="id + '-title'" class="mdv-side-sheet__heading">
          <slot name="header" v-bind="slotProps" />
        </div>
        <h2 v-else-if="title" :id="id + '-title'" class="mdv-side-sheet__title">{{ title }}</h2>
        <span v-else class="mdv-side-sheet__heading" />
        <MdvIconButton
          class="mdv-side-sheet__close"
          variant="standard"
          :aria-label="closeLabel"
          @click="requestClose('close-button')"
        >
          <MdvIcon :icon="closeIcon" />
        </MdvIconButton>
      </header>
      <div ref="content" class="mdv-side-sheet__content" :tabindex="scrollable ? 0 : undefined">
        <div class="mdv-side-sheet__body">
          <slot v-bind="slotProps">
            <p v-if="description" :id="id + '-description'" class="mdv-side-sheet__description">
              {{ description }}
            </p>
          </slot>
        </div>
      </div>
      <div v-if="slots.actions" ref="actions" class="mdv-side-sheet__actions">
        <slot name="actions" v-bind="slotProps" />
      </div>
      <div
        v-if="closeOnSwipe"
        class="mdv-side-sheet__edge"
        aria-hidden="true"
        @pointerdown="swipe.down"
      />
    </section>
  </dialog>
</template>
