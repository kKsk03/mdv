<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { MdvBadgeContent, MdvBadgeVariant } from './badge.types'

defineOptions({ name: 'MdvBadge', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    variant?: MdvBadgeVariant
    content?: MdvBadgeContent
    visible?: boolean
  }>(),
  {
    variant: 'small',
    visible: true,
  },
)

const attrs = useAttrs()

const ariaLabel = computed(() => {
  const value = attrs['aria-label']
  return typeof value === 'string' && value.trim() ? value : undefined
})

const rootAttrs = computed(() => {
  const next = { ...attrs }
  delete next['aria-label']
  return next
})

const hasLargeContent = computed(
  () => props.content !== undefined && props.content !== null && props.content !== '',
)

const showIndicator = computed(
  () => props.visible && (props.variant === 'small' || hasLargeContent.value),
)
</script>

<template>
  <span v-bind="rootAttrs" class="mdv-badge">
    <slot />
    <span
      v-if="showIndicator"
      class="mdv-badge__indicator"
      :class="`mdv-badge__indicator--${props.variant}`"
      :role="ariaLabel ? 'img' : undefined"
      :aria-label="ariaLabel"
      :aria-hidden="ariaLabel ? undefined : 'true'"
    >
      <span v-if="props.variant === 'large'" class="mdv-badge__label">
        {{ props.content }}
      </span>
    </span>
  </span>
</template>
