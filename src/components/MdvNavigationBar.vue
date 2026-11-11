<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { VNode } from 'vue'
import type { MdvNavigationBarProps } from './navigation-bar.types'

defineOptions({ name: 'MdvNavigationBar', inheritAttrs: false })

const props = withDefaults(defineProps<MdvNavigationBarProps>(), { orientation: 'auto' })
defineSlots<{ default?(): VNode[] }>()

const attrs = useAttrs()
const rootClass = computed(() => `mdv-navigation-bar--${props.orientation}`)

function rootAttrs() {
  const result = { ...attrs }
  delete result.role
  return result
}
</script>

<template>
  <div class="mdv-navigation-bar-anchor">
    <nav v-bind="rootAttrs()" class="mdv-navigation-bar" :class="rootClass">
      <div class="mdv-navigation-bar__items">
        <slot />
      </div>
    </nav>
  </div>
</template>
