<script setup lang="ts">
import { useAttrs, useId, useTemplateRef } from 'vue'
import type { VNode } from 'vue'
import NavigationRailSurface from './NavigationRailSurface.vue'
import type { MdvNavigationRailProps, MdvNavigationRailSlotProps } from './navigation-rail.types'

defineOptions({ name: 'MdvNavigationRail', inheritAttrs: false })
const props = withDefaults(defineProps<MdvNavigationRailProps>(), {
  expanded: false,
  alignment: 'top',
  transparent: false,
  showDivider: false,
})
const emit = defineEmits<{ 'update:expanded': [value: boolean] }>()
const slots = defineSlots<{
  default?(props: MdvNavigationRailSlotProps): VNode[]
  menu?(props: MdvNavigationRailSlotProps): VNode[]
  fab?(props: MdvNavigationRailSlotProps): VNode[]
}>()
const id = `mdv-navigation-rail-${useId()}`
const attrs = useAttrs()
const rail = useTemplateRef<InstanceType<typeof NavigationRailSurface>>('rail')
function toggle() {
  emit('update:expanded', !props.expanded)
}
function controls(): MdvNavigationRailSlotProps['menuAttrs'] {
  return {
    'aria-controls': String(attrs.id ?? id),
    'aria-expanded': props.expanded,
    onClick: toggle,
  }
}
defineExpose({ focus: (options?: FocusOptions) => rail.value?.focus(options) })
</script>

<template>
  <NavigationRailSurface
    ref="rail"
    :id="id"
    v-bind="{ ...props, ...$attrs }"
    :controls="controls()"
    @toggle="toggle"
  >
    <template #default="scope"><slot v-bind="scope" /></template>
    <template v-if="slots.menu" #menu="scope"><slot name="menu" v-bind="scope" /></template>
    <template v-if="slots.fab" #fab="scope"><slot name="fab" v-bind="scope" /></template>
  </NavigationRailSurface>
</template>
