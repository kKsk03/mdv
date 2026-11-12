<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, watch } from 'vue'
import type { StyleValue, VNode } from 'vue'
import NavigationDrawerSurface from './NavigationDrawerSurface.vue'
import { focusDialog, topDialog } from './dialog-modal'
import { createSideSheetMotion, sideSheetDirection } from './side-sheet-motion'
import { useDialog } from './use-dialog'
import { useSideSheetSwipe } from './use-side-sheet-swipe'
import type { MdvDialogCloseDetail } from './dialog.types'
import type {
  MdvModalNavigationDrawerProps,
  MdvNavigationDrawerCloseDetail,
  MdvNavigationDrawerCloseReason,
  MdvNavigationDrawerSlotProps,
} from './navigation-drawer.types'

defineOptions({ name: 'MdvModalNavigationDrawer', inheritAttrs: false })
const props = withDefaults(defineProps<MdvModalNavigationDrawerProps>(), {
  modelValue: false,
  title: '',
  width: '360px',
  destroyOnClose: false,
  closeOnEsc: true,
  closeOnScrim: true,
  closeOnSelect: true,
  closeOnSwipe: true,
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvNavigationDrawerCloseDetail]
  closed: [detail: MdvNavigationDrawerCloseDetail]
}>()
const slots = defineSlots<{
  default?(props: MdvNavigationDrawerSlotProps): VNode[]
  header?(props: MdvNavigationDrawerSlotProps): VNode[]
  footer?(props: MdvNavigationDrawerSlotProps): VNode[]
}>()
let origin: MdvNavigationDrawerCloseReason = 'action'
let exitVelocity = 0
let closing: Promise<boolean> | null = null
let version = 0
let closeDetail: MdvNavigationDrawerCloseDetail = { reason: 'model' }
let requestedDetail: MdvNavigationDrawerCloseDetail | undefined
function detail(value: MdvDialogCloseDetail): MdvNavigationDrawerCloseDetail {
  return {
    reason:
      value.reason === 'action'
        ? origin
        : value.reason === 'escape' || value.reason === 'scrim' || value.reason === 'model'
          ? value.reason
          : 'action',
  }
}
function forward(
  event: 'update:modelValue' | 'open' | 'opened' | 'close' | 'closed',
  value?: boolean | MdvDialogCloseDetail,
) {
  if (event === 'update:modelValue') emit('update:modelValue', value as boolean)
  else if (event === 'open') emit('open')
  else if (event === 'opened') emit('opened')
  else if (event === 'close') {
    const source = value as MdvDialogCloseDetail
    closeDetail =
      source.reason === 'model' ? { reason: 'model' } : (requestedDetail ?? detail(source))
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
      requestedDetail = detail(value)
      return props.beforeClose?.(Object.freeze({ ...requestedDetail }))
    },
  },
  forward,
  {
    name: 'MdvModalNavigationDrawer',
    role: 'dialog',
    hasTitle: () => !!(props.title || slots.header),
    hasContentSlot: () => true,
    preserveExternalFocus: true,
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
const { attrs, id, phase, rendered, rootStyle, listeners } = modal
const direction = () => sideSheetDirection(modal.elements.dialog.value, 'start')
const motion = createSideSheetMotion({
  panel: () => modal.elements.container.value,
  scrim: () => modal.elements.scrim.value,
  direction,
  dragScrim: true,
})
function requestClose(reason: MdvNavigationDrawerCloseReason = 'action') {
  if (closing) return closing
  const ticket = ++version
  origin = reason
  closing = modal.requestClose('action').finally(() => {
    if (ticket !== version) return
    closing = null
    origin = 'action'
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
  dismissFraction: 0.5,
  flingVelocity: 400,
  towardEdgeOnly: true,
  shouldStart(event) {
    const target = event.target as Element
    if (target.closest('dialog') !== modal.elements.dialog.value) return false
    const nav = target.closest('[data-mdv-drawer]')
    if (nav && nav.parentElement !== modal.elements.content.value) return false
    return !target.closest(
      'input, textarea, select, label, summary, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], [role="button"], [draggable="true"], button:not([data-mdv-drawer-control]), a:not([data-mdv-drawer-control])',
    )
  },
  close(velocity) {
    exitVelocity = velocity
    return requestClose('swipe')
  },
})
function invalidateClose() {
  version++
  closing = null
  origin = 'action'
  exitVelocity = 0
  requestedDetail = undefined
}
watch(
  () => props.modelValue,
  () => {
    invalidateClose()
    swipe.cancel(false)
  },
)
watch(
  () => [props.width, props.closeOnSwipe, attrs.dir],
  () => {
    swipe.cancel(false)
    if (phase.value === 'open') motion.jump(true)
  },
)
onDeactivated(invalidateClose)
onBeforeUnmount(invalidateClose)
function rootAttrs() {
  const result = modal.rootAttrs()
  result.role = 'dialog'
  result.id ??= id
  if (!result['aria-label'] && !result['aria-labelledby']) result['aria-label'] = '主导航'
  return result
}
const slotProps = computed<MdvNavigationDrawerSlotProps>(() => ({ close: () => requestClose() }))
function focus() {
  const element = modal.elements.dialog.value
  if (element?.open) focusDialog(element)
}
function select() {
  if (props.closeOnSelect) void requestClose('select')
}
defineExpose({ close: () => requestClose(), focus })
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="rootAttrs()"
    class="mdv-dialog mdv-modal-navigation-drawer"
    :style="[{ '--mdv-drawer-width': width }, rootStyle()]"
    :data-state="phase"
    tabindex="-1"
    closedby="none"
    aria-modal="true"
    v-on="listeners"
  >
    <div ref="scrim" class="mdv-navigation-drawer__scrim" aria-hidden="true" />
    <div
      v-if="rendered"
      ref="container"
      class="mdv-modal-navigation-drawer__panel"
      :class="[
        attrs.class,
        { 'mdv-modal-navigation-drawer__panel--dragging': swipe.dragging.value },
      ]"
      :style="[{ '--mdv-drawer-width': width }, attrs.style as StyleValue]"
      @pointerdown="swipe.down"
      @click.capture="swipe.click"
    >
      <div ref="content" class="mdv-modal-navigation-drawer__content">
        <NavigationDrawerSurface
          :title="title"
          :title-id="id + '-title'"
          :visible="modelValue"
          :close="slotProps.close"
          @select="select"
        >
          <template v-if="slots.header" #header><slot name="header" v-bind="slotProps" /></template>
          <template #default><slot v-bind="slotProps" /></template>
          <template v-if="slots.footer" #footer><slot name="footer" v-bind="slotProps" /></template>
        </NavigationDrawerSurface>
      </div>
    </div>
  </dialog>
</template>
