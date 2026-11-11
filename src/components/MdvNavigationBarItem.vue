<script setup lang="ts">
import { computed, mergeProps, useAttrs } from 'vue'
import type { VNode } from 'vue'
import type {
  MdvNavigationBarItemProps,
  MdvNavigationBarItemSlotProps,
} from './navigation-bar.types'

defineOptions({ name: 'MdvNavigationBarItem', inheritAttrs: false })

const props = withDefaults(defineProps<MdvNavigationBarItemProps>(), {
  active: false,
  disabled: false,
})
const slots = defineSlots<{
  icon?(props: MdvNavigationBarItemSlotProps): VNode[]
  badge?(props: MdvNavigationBarItemSlotProps): VNode[]
}>()
const attrs = useAttrs()
const isLink = computed(() => props.href !== undefined)
const isDisabled = computed(() => props.disabled)

function controlAttrs() {
  const result = { ...attrs }
  for (const key of [
    'href',
    'type',
    'disabled',
    'role',
    'tabindex',
    'aria-current',
    'aria-disabled',
  ])
    delete result[key]

  return mergeProps(
    result,
    isLink.value
      ? {
          href: isDisabled.value ? undefined : props.href,
          'aria-disabled': isDisabled.value ? 'true' : undefined,
          tabindex: isDisabled.value ? -1 : undefined,
          'aria-current': props.active ? 'page' : undefined,
        }
      : {
          type: 'button',
          disabled: isDisabled.value,
          'aria-current': props.active ? 'page' : undefined,
        },
  )
}
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    v-bind="controlAttrs()"
    class="mdv-navigation-bar-item"
    :class="{
      'mdv-navigation-bar-item--active': props.active,
      'mdv-navigation-bar-item--disabled': isDisabled,
      'mdv-navigation-bar-item--link': isLink,
    }"
  >
    <span class="mdv-navigation-bar-item__visual">
      <span class="mdv-navigation-bar-item__icon-container">
        <span class="mdv-navigation-bar-item__icon" aria-hidden="true">
          <slot name="icon" :active="props.active" />
        </span>
        <span v-if="slots.badge" class="mdv-navigation-bar-item__badge">
          <slot name="badge" :active="props.active" />
        </span>
      </span>
      <span class="mdv-navigation-bar-item__label">{{ props.label }}</span>
    </span>
  </component>
</template>
