<script setup lang="ts">
import type { MdvDividerOrientation, MdvDividerVariant } from './divider.types'

defineOptions({ name: 'MdvDivider', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    orientation?: MdvDividerOrientation
    variant?: MdvDividerVariant
    /** 默认只作视觉分隔；设为 false 后向辅助技术提供 separator 语义。 */
    decorative?: boolean
  }>(),
  {
    orientation: 'horizontal',
    variant: 'full-width',
    decorative: true,
  },
)
</script>

<template>
  <div
    v-bind="$attrs"
    class="mdv-divider"
    :class="[`mdv-divider--${props.orientation}`, `mdv-divider--${props.variant}`]"
    :role="props.decorative ? undefined : 'separator'"
    :aria-hidden="props.decorative ? 'true' : undefined"
    :aria-orientation="props.decorative ? undefined : props.orientation"
  />
</template>
