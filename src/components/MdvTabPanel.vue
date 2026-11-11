<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, useAttrs, useId, useTemplateRef, watch } from 'vue'
import type { VNode } from 'vue'
import { mdvTabsKey } from './tabs-context'
import type { MdvTabPanelProps, MdvTabSlotProps } from './tabs.types'

defineOptions({ name: 'MdvTabPanel', inheritAttrs: false })
const props = withDefaults(defineProps<MdvTabPanelProps>(), { lazy: false, destroyOnHide: false })
defineSlots<{ default?(props: MdvTabSlotProps): VNode[] }>()
const context = inject(mdvTabsKey, undefined)
const attrs = useAttrs()
const panel = useTemplateRef<HTMLDivElement>('panel')
const fallbackId = `mdv-tab-panel-${useId()}`
const active = computed(() => !!context?.hasTab(props.value) && context.isSelected(props.value))
const visited = ref(active.value)
const renderContent = computed(() =>
  props.destroyOnHide ? active.value : active.value || !props.lazy || visited.value,
)
const unregister = context?.registerPanel({ value: () => props.value, element: () => panel.value })

watch(
  active,
  (value) => {
    if (value) visited.value = true
    else if (panel.value) context?.restoreFocus(panel.value)
  },
  { flush: 'sync' },
)

function panelAttrs() {
  const result = { ...attrs }
  // id 与 role 等关联属性由同一组生成，懒挂载也始终保留语义外壳。
  for (const key of ['id', 'role', 'hidden', 'inert', 'aria-labelledby']) delete result[key]
  return result
}

onBeforeUnmount(() => {
  if (panel.value) context?.restoreFocus(panel.value)
  unregister?.()
})
</script>

<template>
  <div
    v-bind="panelAttrs()"
    :id="context?.panelId(props.value) ?? fallbackId"
    ref="panel"
    role="tabpanel"
    class="mdv-tab-panel"
    :aria-labelledby="context?.labelId(props.value)"
    :hidden="!active"
    :inert="!active ? true : undefined"
    :tabindex="(attrs.tabindex as number | string | undefined) ?? 0"
  >
    <slot v-if="renderContent" :active="active" />
  </div>
</template>
