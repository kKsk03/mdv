<script setup lang="ts">
import { onBeforeUnmount, onDeactivated } from 'vue'
import type { StyleValue, VNode } from 'vue'
import NavigationRailSurface from './NavigationRailSurface.vue'
import { focusDialog } from './dialog-modal'
import { createNavigationRailMotion } from './navigation-rail-motion'
import { useDialog } from './use-dialog'
import type { MdvDialogCloseDetail } from './dialog.types'
import type {
  MdvModalNavigationRailProps,
  MdvNavigationRailCloseDetail,
  MdvNavigationRailSlotProps,
} from './navigation-rail.types'

defineOptions({ name: 'MdvModalNavigationRail', inheritAttrs: false })
const props = withDefaults(defineProps<MdvModalNavigationRailProps>(), {
  expanded: false,
  alignment: 'top',
  transparent: false,
  showDivider: false,
  hideOnCollapse: false,
  closeOnEsc: true,
  closeOnScrim: true,
  closeOnSelect: true,
  destroyOnClose: false,
})
const emit = defineEmits<{
  'update:expanded': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvNavigationRailCloseDetail]
  closed: [detail: MdvNavigationRailCloseDetail]
}>()
const slots = defineSlots<{
  default?(props: MdvNavigationRailSlotProps): VNode[]
  menu?(props: MdvNavigationRailSlotProps): VNode[]
  fab?(props: MdvNavigationRailSlotProps): VNode[]
}>()
let origin: 'menu' | 'select' | undefined
let closing: Promise<boolean> | undefined
let closeDetail: MdvNavigationRailCloseDetail = { reason: 'model' }
function forward(
  event: 'update:modelValue' | 'open' | 'opened' | 'close' | 'closed',
  value?: boolean | MdvDialogCloseDetail,
) {
  if (event === 'update:modelValue') emit('update:expanded', value as boolean)
  else if (event === 'open') emit('open')
  else if (event === 'opened') emit('opened')
  else if (event === 'close') {
    const reason = (value as MdvDialogCloseDetail).reason
    closeDetail = {
      reason:
        reason === 'action'
          ? (origin ?? 'menu')
          : reason === 'escape' || reason === 'scrim'
            ? reason
            : 'model',
    }
    emit('close', { ...closeDetail })
  } else emit('closed', { ...closeDetail })
}
const modal = useDialog(
  {
    get modelValue() {
      return props.expanded
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
  },
  forward,
  {
    name: 'MdvModalNavigationRail',
    role: 'dialog',
    hasTitle: () => false,
    hasContentSlot: () => true,
    prepare: () =>
      motion.jump(
        !!modal.elements.dialog.value?.ownerDocument.defaultView?.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches,
      ),
    animate: (_elements, entering) => motion.play(entering),
  },
)
const { attrs, phase, rendered, rootStyle, listeners } = modal
const motion = createNavigationRailMotion({
  element: () => modal.elements.container.value,
  scrim: () => modal.elements.scrim.value,
  modal: true,
})
function requestClose(reason: 'menu' | 'select' = 'menu') {
  if (closing) return closing
  origin = reason
  const task = modal.requestClose('action')
  closing = task
  void task.finally(() => {
    if (closing === task) {
      closing = undefined
      origin = undefined
    }
  })
  return task
}
function toggle() {
  if (props.expanded) void requestClose('menu')
  else emit('update:expanded', true)
}
function select() {
  if (props.closeOnSelect) void requestClose('select')
}
function dialogId() {
  return String(attrs.id ?? `${modal.id}-rail`)
}
function controls(): MdvNavigationRailSlotProps['menuAttrs'] {
  return { 'aria-controls': dialogId(), 'aria-expanded': props.expanded, onClick: toggle }
}
function rootAttrs() {
  const result = modal.rootAttrs()
  if (!result['aria-label'] && !result['aria-labelledby']) result['aria-label'] = '主导航'
  return { ...result, id: dialogId() }
}
function surfaceProps() {
  return {
    alignment: props.alignment,
    expandedWidth: props.expandedWidth,
    transparent: props.transparent,
    showDivider: props.showDivider,
    controls: controls(),
  }
}
function navigationAttrs() {
  return {
    'aria-label': attrs['aria-label'] ?? (attrs['aria-labelledby'] ? undefined : '主导航'),
    'aria-labelledby': attrs['aria-labelledby'],
  }
}
function direction() {
  const value = attrs.dir
  return value === 'ltr' || value === 'rtl' || value === 'auto' ? value : undefined
}
function suspend() {
  closing = undefined
  origin = undefined
  motion.cancel()
}
onDeactivated(suspend)
onBeforeUnmount(suspend)
defineExpose({
  close: () => requestClose(),
  focus: () => {
    if (modal.elements.dialog.value?.open) focusDialog(modal.elements.dialog.value)
  },
})
</script>

<template>
  <div
    class="mdv-modal-navigation-rail-host"
    :class="[attrs.class, { 'mdv-modal-navigation-rail-host--hidden': hideOnCollapse }]"
    :style="attrs.style as StyleValue"
    :dir="direction()"
    :data-mdv-theme="attrs['data-mdv-theme']"
  >
    <NavigationRailSurface
      v-if="!hideOnCollapse"
      v-bind="{ ...surfaceProps(), ...navigationAttrs() }"
      :expanded="false"
      :aria-hidden="phase !== 'closed' ? 'true' : undefined"
      @toggle="toggle"
    >
      <template #default="scope"><slot v-bind="scope" /></template>
      <template v-if="slots.menu" #menu="scope"><slot name="menu" v-bind="scope" /></template>
      <template v-if="slots.fab" #fab="scope"><slot name="fab" v-bind="scope" /></template>
    </NavigationRailSurface>
    <dialog
      ref="dialog"
      v-bind="rootAttrs()"
      :style="rootStyle()"
      class="mdv-dialog mdv-modal-navigation-rail"
      :data-state="phase"
      :data-hidden-on-collapse="hideOnCollapse"
      tabindex="-1"
      closedby="none"
      aria-modal="true"
      v-on="listeners"
    >
      <div ref="scrim" class="mdv-modal-navigation-rail__scrim" aria-hidden="true" />
      <div
        v-if="rendered"
        ref="container"
        class="mdv-modal-navigation-rail__panel"
        :class="{ 'mdv-modal-navigation-rail__panel--transparent': transparent }"
      >
        <div ref="content" class="mdv-modal-navigation-rail__content">
          <NavigationRailSurface
            v-bind="{ ...surfaceProps(), ...navigationAttrs() }"
            expanded
            external-motion
            :visible="phase !== 'closed'"
            @toggle="toggle"
            @select="select"
          >
            <template #default="scope"><slot v-bind="scope" /></template>
            <template v-if="slots.menu" #menu="scope"><slot name="menu" v-bind="scope" /></template>
            <template v-if="slots.fab" #fab="scope"><slot name="fab" v-bind="scope" /></template>
          </NavigationRailSurface>
        </div>
      </div>
    </dialog>
  </div>
</template>
