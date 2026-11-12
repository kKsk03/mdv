<script setup lang="ts">
import { computed, inject, mergeProps, useAttrs, useTemplateRef } from 'vue'
import type { VNode } from 'vue'
import { useButtonRipple } from './button-ripple'
import { navigationDrawerDepthKey, navigationDrawerKey } from './navigation-drawer-context'
import type {
  MdvNavigationDrawerItemProps,
  MdvNavigationDrawerItemSlotProps,
} from './navigation-drawer.types'

defineOptions({ name: 'MdvNavigationDrawerItem', inheritAttrs: false })
const props = withDefaults(defineProps<MdvNavigationDrawerItemProps>(), {
  active: false,
  disabled: false,
})
const slots = defineSlots<{
  icon?(props: MdvNavigationDrawerItemSlotProps): VNode[]
  badge?(props: MdvNavigationDrawerItemSlotProps): VNode[]
}>()
const attrs = useAttrs()
const drawer = inject(navigationDrawerKey, undefined)
const parentDepth = inject(navigationDrawerDepthKey, undefined)
const depth = computed(() => parentDepth?.value ?? 0)
const control = useTemplateRef<HTMLButtonElement | HTMLAnchorElement>('control')
const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => props.disabled,
  isLink: () => props.href !== undefined,
})
function guard(event: MouseEvent) {
  if (!props.disabled) return
  event.preventDefault()
  event.stopImmediatePropagation()
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
  if (
    props.href !== undefined &&
    ((target && target !== '_self') || control.value?.hasAttribute('download'))
  )
    return
  queueMicrotask(() => {
    if (!event.defaultPrevented && !props.disabled) drawer?.select(event)
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
    href: !props.disabled ? props.href : undefined,
    type: props.href === undefined ? 'button' : undefined,
    disabled: props.href === undefined && props.disabled ? true : undefined,
    'aria-disabled': props.href !== undefined && props.disabled ? true : undefined,
    tabindex: props.href !== undefined && props.disabled ? -1 : undefined,
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
  <li class="mdv-navigation-drawer-item" :style="{ '--mdv-drawer-depth': depth }">
    <component
      :is="href !== undefined ? 'a' : 'button'"
      ref="control"
      v-bind="controlAttrs()"
      class="mdv-navigation-drawer__row"
      data-mdv-drawer-control
      :class="{
        'mdv-navigation-drawer__row--active': active,
        'mdv-navigation-drawer__row--disabled': disabled,
      }"
    >
      <span class="mdv-navigation-drawer__state" aria-hidden="true" />
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-navigation-drawer__ripple"
        :class="{ 'mdv-navigation-drawer__ripple--released': ripple.released }"
        :style="{
          left: `${ripple.x}px`,
          top: `${ripple.y}px`,
          width: `${ripple.size}px`,
          height: `${ripple.size}px`,
        }"
        aria-hidden="true"
        @animationend="finishRipple"
      />
      <span v-if="slots.icon" class="mdv-navigation-drawer__icon" aria-hidden="true"
        ><slot name="icon" :active="active"
      /></span>
      <span class="mdv-navigation-drawer__label">{{ label }}</span>
      <span v-if="slots.badge || badge !== undefined" class="mdv-navigation-drawer__badge"
        ><slot name="badge" :active="active">{{ badge }}</slot></span
      >
    </component>
  </li>
</template>
