<script setup lang="ts">
import {
  computed,
  inject,
  mergeProps,
  provide,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { useButtonRipple } from './button-ripple'
import { navigationDrawerDepthKey } from './navigation-drawer-context'
import type {
  MdvNavigationDrawerGroupProps,
  MdvNavigationDrawerGroupSlotProps,
} from './navigation-drawer.types'

defineOptions({ name: 'MdvNavigationDrawerGroup', inheritAttrs: false })
const props = withDefaults(defineProps<MdvNavigationDrawerGroupProps>(), {
  collapsible: false,
  expanded: undefined,
  disabled: false,
  divider: false,
})
const emit = defineEmits<{ 'update:expanded': [value: boolean] }>()
const slots = defineSlots<{
  icon?(props: MdvNavigationDrawerGroupSlotProps): VNode[]
  label?(props: MdvNavigationDrawerGroupSlotProps): VNode[]
  default?(props: MdvNavigationDrawerGroupSlotProps): VNode[]
}>()
const attrs = useAttrs()
const id = `mdv-drawer-group-${useId()}`
const local = ref(true)
const isExpanded = computed(() => !props.collapsible || (props.expanded ?? local.value))
const parentDepth = inject(navigationDrawerDepthKey, undefined)
const depth = computed(() => parentDepth?.value ?? 0)
provide(
  navigationDrawerDepthKey,
  computed(() => depth.value + (props.collapsible ? 1 : 0)),
)
const control = useTemplateRef<HTMLButtonElement>('control')
const content = useTemplateRef<HTMLElement>('content')
const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => props.disabled,
  isLink: () => false,
})
function guard(event: MouseEvent) {
  if (!props.disabled) return
  event.preventDefault()
  event.stopImmediatePropagation()
}
function toggle(event: MouseEvent) {
  queueMicrotask(() => {
    if (event.defaultPrevented || props.disabled) return
    const next = !isExpanded.value
    if (props.expanded === undefined) local.value = next
    emit('update:expanded', next)
  })
}
function groupAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !props.collapsible || !key.startsWith('on')),
  )
}
function controlAttrs() {
  const events = Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('on')))
  return mergeProps({ onClick: guard }, events, {
    onClick: toggle,
    onPointerdown: showRipple,
    onKeydown: showRipple,
    onPointerup: releaseRipple,
    onPointerleave: releaseRipple,
    onPointercancel: releaseRipple,
    onKeyup: releaseRipple,
    onBlur: releaseRipple,
  })
}
watch(
  isExpanded,
  (value) => {
    if (value) return
    const body = content.value
    const focused = body?.ownerDocument.activeElement
    if (focused && body?.contains(focused) && focused.closest('dialog') === body.closest('dialog'))
      control.value?.focus({ preventScroll: true })
  },
  { flush: 'pre' },
)
</script>

<template>
  <li
    v-bind="groupAttrs()"
    class="mdv-navigation-drawer-group"
    :class="{ 'mdv-navigation-drawer-group--divider': divider }"
    :style="{ '--mdv-drawer-depth': depth }"
  >
    <button
      v-if="collapsible"
      ref="control"
      v-bind="controlAttrs()"
      type="button"
      class="mdv-navigation-drawer__row mdv-navigation-drawer-group__toggle"
      :class="{ 'mdv-navigation-drawer__row--disabled': disabled }"
      :disabled="disabled"
      :aria-expanded="isExpanded"
      :aria-controls="id"
      :aria-labelledby="id + '-label'"
      data-mdv-drawer-control
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
        ><slot name="icon" :expanded="isExpanded"
      /></span>
      <span :id="id + '-label'" class="mdv-navigation-drawer__label"
        ><slot name="label" :expanded="isExpanded">{{ label }}</slot></span
      >
      <svg
        class="mdv-navigation-drawer-group__chevron"
        :class="{ 'mdv-navigation-drawer-group__chevron--expanded': isExpanded }"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m7 10 5 5 5-5z" fill="currentColor" />
      </svg>
    </button>
    <div v-else :id="id + '-label'" class="mdv-navigation-drawer-group__heading">
      <span v-if="slots.icon" class="mdv-navigation-drawer__icon" aria-hidden="true"
        ><slot name="icon" :expanded="isExpanded" /></span
      ><span
        ><slot name="label" :expanded="isExpanded">{{ label }}</slot></span
      >
    </div>
    <div
      :id="id"
      ref="content"
      class="mdv-navigation-drawer-group__collapse"
      :data-expanded="isExpanded"
      :inert="!isExpanded ? true : undefined"
      :aria-hidden="!isExpanded ? true : undefined"
    >
      <div class="mdv-navigation-drawer-group__clip">
        <ul class="mdv-navigation-drawer__list" :aria-labelledby="id + '-label'">
          <slot :expanded="isExpanded" />
        </ul>
      </div>
    </div>
  </li>
</template>
