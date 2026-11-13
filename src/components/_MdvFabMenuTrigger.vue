<script setup lang="ts">
import {
  getCurrentInstance,
  mergeProps,
  onBeforeUnmount,
  onDeactivated,
  shallowRef,
  watch,
} from 'vue'
import type { ComponentPublicInstance, VNode } from 'vue'
import { useButtonRipple } from './button-ripple'
import FabRipple from './_MdvFabRipple.vue'
import type { MdvFabMenuTriggerAttrs, MdvFabMenuProps } from './fab-menu.types'
import type { MdvMenuTriggerProps } from './menu.types'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  settings: MdvFabMenuProps
  open: boolean
  binding?: MdvMenuTriggerProps
  controlId: string
  panelId: string
}>()
defineSlots<{ default?(): VNode[] }>()
const emit = defineEmits<{ element: [value: HTMLButtonElement | null]; toggle: [] }>()
const instance = getCurrentInstance()!
const element = shallowRef<HTMLButtonElement | null>(null)
let forwarded: MdvFabMenuTriggerAttrs['ref']
let bound: MdvMenuTriggerProps['ref'] | undefined
function assign(reference: MdvFabMenuTriggerAttrs['ref'], value: HTMLButtonElement | null) {
  if (typeof reference === 'function') reference(value, instance.refs)
  else if (reference && typeof reference !== 'string') reference.value = value
}
function forward() {
  if (forwarded !== props.settings.triggerAttrs?.ref) assign(forwarded, null)
  if (bound !== props.binding?.ref) assign(bound, null)
  forwarded = props.settings.triggerAttrs?.ref
  bound = props.binding?.ref
  assign(forwarded, element.value)
  assign(bound, element.value)
}
function setElement(value: Element | ComponentPublicInstance | null) {
  element.value = value as HTMLButtonElement | null
  forward()
  emit('element', element.value)
}
watch([() => props.settings.triggerAttrs?.ref, () => props.binding?.ref], forward, {
  flush: 'post',
})
function explicitlyDisabled() {
  return (
    props.settings.triggerAttrs?.disabled === true ||
    props.settings.triggerAttrs?.['aria-disabled'] === true ||
    props.settings.triggerAttrs?.['aria-disabled'] === 'true'
  )
}
function blocked() {
  return explicitlyDisabled() || element.value?.matches(':disabled') === true
}
const feedback = useButtonRipple({
  disabled: blocked,
  isLink: () => false,
  surface: () => element.value?.firstElementChild as HTMLElement | null,
})
function attributes() {
  const source = { ...props.settings.triggerAttrs }
  const binding: Partial<MdvMenuTriggerProps> = { ...props.binding }
  delete source.ref
  delete binding.ref
  if (explicitlyDisabled()) {
    for (const key of Object.keys(source)) {
      if (
        /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i.test(key)
      )
        delete source[key as keyof typeof source]
    }
  }
  return mergeProps(source, {
    ...binding,
    id: props.controlId,
    type: 'button',
    'aria-label':
      props.open && props.settings.variant !== 'baseline'
        ? props.settings.closeLabel
        : props.settings.label,
    'aria-labelledby': undefined,
    'aria-controls': props.panelId,
    'aria-expanded': props.open,
    'aria-haspopup': props.settings.variant === 'baseline' ? 'menu' : undefined,
    onClick(event: MouseEvent) {
      if (event.defaultPrevented || blocked() || event.button !== 0) return
      if (binding.onClick) binding.onClick(event)
      else emit('toggle')
    },
    onKeydown(event: KeyboardEvent) {
      if (event.defaultPrevented || blocked()) return
      binding.onKeydown?.(event)
      feedback.showRipple(event)
    },
  })
}
function blockDisabled(event: Event) {
  if (!blocked()) return
  if (event.type.startsWith('key') && !['Enter', ' '].includes((event as KeyboardEvent).key)) return
  event.preventDefault()
  event.stopImmediatePropagation()
}
function clear() {
  feedback.ripple.value = null
}
onDeactivated(clear)
onBeforeUnmount(() => {
  clear()
  assign(forwarded, null)
  assign(bound, null)
})
</script>

<template>
  <button
    :ref="setElement"
    v-bind="attributes()"
    class="mdv-fab mdv-fab-menu__trigger"
    :class="[
      `mdv-fab--${settings.size}`,
      `mdv-fab--${settings.color}`,
      { 'mdv-fab--elevated': settings.elevated },
    ]"
    @click.capture="blockDisabled"
    @keydown.capture="blockDisabled"
    @keyup.capture="blockDisabled"
    @pointerdown="feedback.showRipple"
    @pointerup="feedback.releaseRipple"
    @pointerleave="feedback.releaseRipple"
    @pointercancel="feedback.releaseRipple"
    @keyup="feedback.releaseRipple"
    @blur="feedback.releaseRipple"
  >
    <span class="mdv-fab__surface">
      <FabRipple :ripple="feedback.ripple.value" @animationend="feedback.finishRipple" />
      <span class="mdv-fab__icon mdv-fab-menu__original-icon" aria-hidden="true" inert
        ><slot
      /></span>
      <span
        v-if="settings.variant !== 'baseline'"
        class="mdv-fab-menu__close-icon"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4Z"
          />
        </svg>
      </span>
    </span>
  </button>
</template>
