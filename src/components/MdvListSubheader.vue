<script setup lang="ts">
import type { VNode } from 'vue'

defineOptions({ name: 'MdvListSubheader', inheritAttrs: false })
defineSlots<{ default?(): VNode[] }>()

const props = withDefaults(
  defineProps<{
    inset?: boolean
  }>(),
  { inset: false },
)
</script>

<template>
  <li
    v-bind="$attrs"
    class="mdv-list-subheader"
    :class="{ 'mdv-list-subheader--inset': props.inset }"
    role="presentation"
  >
    <slot />
  </li>
</template>
