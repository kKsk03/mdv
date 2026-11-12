<script setup lang="ts">
import { computed, inject, mergeProps, useAttrs, useTemplateRef } from 'vue'
import type { VNode } from 'vue'
import { useButtonRipple } from './button-ripple'
import { navigationRailKey } from './navigation-rail-context'
import type {
  MdvNavigationRailItemProps,
  MdvNavigationRailItemSlotProps,
} from './navigation-rail.types'

defineOptions({ name: 'MdvNavigationRailItem', inheritAttrs: false })
const props = withDefaults(defineProps<MdvNavigationRailItemProps>(), {
  active: false,
  disabled: false,
})
const slots = defineSlots<{
  icon?(props: MdvNavigationRailItemSlotProps): VNode[]
  badge?(props: MdvNavigationRailItemSlotProps): VNode[]
}>()
const attrs = useAttrs()
const rail = inject(navigationRailKey, undefined)
const expanded = computed(() => rail?.expanded.value ?? false)
const isLink = computed(() => props.href !== undefined)
const control = useTemplateRef<HTMLButtonElement | HTMLAnchorElement>('control')
const pill = useTemplateRef<HTMLElement>('pill')
const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => props.disabled,
  isLink: () => isLink.value,
  surface: () => pill.value,
})
function guard(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
}
function select(event: MouseEvent) {
  if (
    props.disabled ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey
  )
    return
  const target = control.value?.getAttribute('target')
  if (isLink.value && ((target && target !== '_self') || control.value?.hasAttribute('download')))
    return
  // 在整条原生冒泡链完成后尊重调用方的 preventDefault。
  queueMicrotask(() => {
    if (!event.defaultPrevented && !props.disabled) rail?.select(event)
  })
}
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
  return mergeProps({ onClick: guard }, result, {
    href: isLink.value && !props.disabled ? props.href : undefined,
    type: isLink.value ? undefined : 'button',
    disabled: !isLink.value && props.disabled ? true : undefined,
    'aria-disabled': isLink.value && props.disabled ? 'true' : undefined,
    tabindex: isLink.value && props.disabled ? -1 : undefined,
    'aria-current': props.active ? 'page' : undefined,
    onClick: select,
    onPointerdown: showRipple,
    onKeydown: showRipple,
    onPointerup: releaseRipple,
    onPointerleave: releaseRipple,
    onPointercancel: releaseRipple,
    onKeyup: releaseRipple,
    onBlur: releaseRipple,
  })
}
defineExpose({
  focus: (options?: FocusOptions) => control.value?.focus(options),
  blur: () => control.value?.blur(),
})
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    ref="control"
    v-bind="controlAttrs()"
    class="mdv-navigation-rail-item"
    data-mdv-rail-item
    :class="{
      'mdv-navigation-rail-item--active': active,
      'mdv-navigation-rail-item--disabled': disabled,
    }"
  >
    <span class="mdv-navigation-rail-item__name">{{ label }}</span>
    <span class="mdv-navigation-rail-item__measure" data-rail-label-measure aria-hidden="true">{{
      label
    }}</span>
    <span ref="pill" class="mdv-navigation-rail-item__pill">
      <span class="mdv-navigation-rail-item__surface" aria-hidden="true">
        <span class="mdv-navigation-rail-item__state" />
        <span
          v-if="ripple"
          :key="ripple.key"
          class="mdv-navigation-rail-item__ripple"
          :class="{ 'mdv-navigation-rail-item__ripple--released': ripple.released }"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }"
          @animationend="finishRipple"
        />
      </span>
      <span class="mdv-navigation-rail-item__icon" aria-hidden="true"
        ><slot name="icon" :active="active" :expanded="expanded"
      /></span>
      <span class="mdv-navigation-rail-item__expanded" aria-hidden="true">
        <span class="mdv-navigation-rail-item__label" data-rail-expanded-label>{{ label }}</span>
      </span>
      <span v-if="slots.badge" class="mdv-navigation-rail-item__badge" data-rail-badge>
        <slot name="badge" :active="active" :expanded="expanded" />
      </span>
    </span>
    <span class="mdv-navigation-rail-item__collapsed" aria-hidden="true">
      <span data-rail-collapsed-label>{{ label }}</span>
    </span>
  </component>
</template>
