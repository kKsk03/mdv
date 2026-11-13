<script setup lang="ts">
import { inject, mergeProps, onBeforeUnmount, onDeactivated, useAttrs, useTemplateRef } from 'vue'
import type { VNode } from 'vue'
import MdvMenuItem from './MdvMenuItem.vue'
import MdvIcon from './MdvIcon.vue'
import FabRipple from './_MdvFabRipple.vue'
import { fabMenuKey } from './fab-menu-context'
import { useButtonRipple } from './button-ripple'
import type { MdvFabMenuItemProps, MdvFabMenuSelectEvent } from './fab-menu.types'

defineOptions({ name: 'MdvFabMenuItem', inheritAttrs: false })
const props = withDefaults(defineProps<MdvFabMenuItemProps>(), {
  label: '',
  disabled: false,
  keepOpen: false,
})
const slots = defineSlots<{ leading?(): VNode[]; default?(): VNode[] }>()
const emit = defineEmits<{ select: [event: MdvFabMenuSelectEvent] }>()
const menu = inject(fabMenuKey)!
const attrs = useAttrs()
const control = useTemplateRef<HTMLElement>('control')
const baseline = useTemplateRef<InstanceType<typeof MdvMenuItem>>('baseline')
function isDisabled() {
  return (
    props.disabled ||
    attrs['aria-disabled'] === true ||
    attrs['aria-disabled'] === 'true' ||
    attrs.disabled === true ||
    attrs.disabled === ''
  )
}
const activationListener =
  /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i
function blockDisabled(event: Event) {
  if (!isDisabled() && !control.value?.matches(':disabled')) return
  if (event.type.startsWith('key') && !['Enter', ' '].includes((event as KeyboardEvent).key)) return
  event.preventDefault()
  event.stopImmediatePropagation()
}
const feedback = useButtonRipple({
  disabled: () => isDisabled() || control.value?.matches(':disabled') === true,
  isLink: () => props.href !== undefined,
  surface: () => control.value,
})
function click(event: MouseEvent) {
  if (isDisabled() || control.value?.matches(':disabled')) {
    event.preventDefault()
    return
  }
  if (event.defaultPrevented || event.button !== 0) return
  const selection: MdvFabMenuSelectEvent = new CustomEvent('select', {
    cancelable: true,
    detail: { value: props.value, selected: false, originalEvent: event },
  })
  emit('select', selection)
  if (selection.defaultPrevented) event.preventDefault()
  else if (!props.keepOpen) menu.close()
}
function attributes() {
  const source = { ...attrs }
  if (isDisabled()) {
    for (const key of Object.keys(source)) if (activationListener.test(key)) delete source[key]
  }
  return mergeProps(source, {
    href: props.href !== undefined && !isDisabled() ? props.href : undefined,
    role: props.href !== undefined && isDisabled() ? 'link' : attrs.role,
    type: props.href === undefined ? (attrs.type ?? 'button') : undefined,
    disabled: props.href === undefined && isDisabled() ? true : undefined,
    'aria-disabled': isDisabled() ? true : undefined,
    tabindex: props.href !== undefined && isDisabled() ? -1 : attrs.tabindex,
    onClick: click,
  })
}
function clear() {
  feedback.ripple.value = null
}
onDeactivated(clear)
onBeforeUnmount(clear)
defineExpose({
  focus: (options?: FocusOptions) =>
    menu.variant.value === 'baseline' ? baseline.value?.focus() : control.value?.focus(options),
})
</script>

<template>
  <MdvMenuItem
    v-if="menu.variant.value === 'baseline'"
    ref="baseline"
    v-bind="$attrs"
    :label="label"
    :icon="icon"
    :value="value"
    :href="href"
    :disabled="disabled"
    :keep-open="keepOpen"
    @select="emit('select', $event)"
  >
    <template v-if="slots.leading" #leading><slot name="leading" /></template>
    <template v-if="slots.default" #default><slot /></template>
  </MdvMenuItem>
  <component
    :is="href !== undefined ? 'a' : 'button'"
    v-else
    ref="control"
    v-bind="attributes()"
    class="mdv-fab-menu-item"
    :class="{ 'mdv-fab-menu-item--disabled': isDisabled() }"
    data-mdv-fab-menu-item
    @click.capture="blockDisabled"
    @auxclick.capture="blockDisabled"
    @keydown.capture="blockDisabled"
    @keyup.capture="blockDisabled"
    @pointerdown="feedback.showRipple"
    @pointerup="feedback.releaseRipple"
    @pointerleave="feedback.releaseRipple"
    @pointercancel="feedback.releaseRipple"
    @keydown="feedback.showRipple"
    @keyup="feedback.releaseRipple"
    @blur="feedback.releaseRipple"
  >
    <FabRipple :ripple="feedback.ripple.value" @animationend="feedback.finishRipple" />
    <span v-if="icon || slots.leading" class="mdv-fab-menu-item__icon" aria-hidden="true" inert
      ><slot name="leading"><MdvIcon v-if="icon" :icon="icon" /></slot
    ></span>
    <span class="mdv-fab-menu-item__label"
      ><slot>{{ label }}</slot></span
    >
  </component>
</template>
