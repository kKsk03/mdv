<script setup lang="ts">
import type { VNode } from 'vue'
import MdvMenuPanel from './_MdvMenuPanel.vue'
import { useMenu } from './use-menu'
import type { MenuEmits } from './use-menu'
import type { MdvMenuProps, MdvMenuSlotProps, MdvMenuTriggerSlotProps } from './menu.types'

defineOptions({ name: 'MdvMenu', inheritAttrs: false })
const props = withDefaults(defineProps<MdvMenuProps>(), { modelValue: undefined })
const emit = defineEmits<MenuEmits>()
defineSlots<{
  trigger?(props: MdvMenuTriggerSlotProps): VNode[]
  default?(props: MdvMenuSlotProps): VNode[]
}>()
const menu = useMenu(props, emit)
defineExpose({ open: menu.show, close: menu.close, toggle: menu.toggle, focus: menu.focus })
</script>

<template>
  <slot
    name="trigger"
    :open="menu.isOpen.value"
    :close="menu.close"
    :trigger-props="menu.triggerProps()"
  />
  <MdvMenuPanel
    :id="menu.id"
    v-bind="$attrs"
    :open="menu.isOpen.value"
    :anchor="menu.tree.anchor.value"
    :trigger="menu.tree.trigger.value"
    :labelledby="menu.id + '-trigger'"
    v-on="menu.panelEvents"
    @request-close="menu.close"
  >
    <slot :open="menu.isOpen.value" :close="menu.close" />
  </MdvMenuPanel>
</template>
