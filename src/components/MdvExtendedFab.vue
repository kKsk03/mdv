<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { useFab } from './fab'
import { createFabMotion } from './fab-motion'
import { useFabScroll } from './fab-scroll'
import FabRipple from './_MdvFabRipple.vue'
import type { MdvExtendedFabProps } from './fab.types'

defineOptions({ name: 'MdvExtendedFab', inheritAttrs: false })
const props = withDefaults(defineProps<MdvExtendedFabProps>(), {
  size: 'small',
  elevated: true,
  type: 'button',
  position: 'static',
  placement: 'bottom-end',
  offset: 16,
  expanded: undefined,
  scrollBehavior: 'none',
  scrollThreshold: 40,
})
const emit = defineEmits<{ 'update:expanded': [expanded: boolean] }>()
const slots = defineSlots<{ default?(): VNode[]; leading?(): VNode[] }>()
const {
  attrs,
  element,
  surface,
  color,
  isLink,
  offsetStyle,
  focus,
  blur,
  ripple,
  showRipple,
  releaseRipple,
  finishRipple,
} = useFab(props, false)
const label = useTemplateRef<HTMLSpanElement>('label')
const icon = useTemplateRef<HTMLSpanElement>('icon')
const hasIcon = ref(!!slots.leading)
const internalExpanded = ref(true)
const expanded = computed(() => !hasIcon.value || (props.expanded ?? internalExpanded.value))
onBeforeUpdate(() => {
  hasIcon.value = !!slots.leading
})

async function requestExpanded(value: boolean) {
  if (!hasIcon.value) return value
  if (expanded.value === value) return true
  if (props.expanded === undefined) internalExpanded.value = value
  emit('update:expanded', value)
  await nextTick()
  return expanded.value === value
}
function expand() {
  return requestExpanded(true)
}
function collapse() {
  return requestExpanded(false)
}
function toggle() {
  return requestExpanded(!expanded.value)
}
const motion = createFabMotion({
  element: () => element.value,
  surface: () => surface.value,
  label: () => label.value,
  icon: () => icon.value,
  expanded: () => expanded.value,
})
const scroll = useFabScroll({
  props,
  element: () => element.value,
  canCollapse: () => hasIcon.value,
  request: requestExpanded,
})
let active = false
let frame: number | undefined
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let media: MediaQueryList | undefined
const observed = new Set<Element>()
function refresh() {
  if (!active) return
  const nodes = [surface.value, label.value, icon.value].filter(
    (node): node is HTMLSpanElement => node !== null,
  )
  for (const node of observed)
    if (!nodes.includes(node as HTMLSpanElement)) {
      resizeObserver?.unobserve(node)
      observed.delete(node)
    }
  for (const node of nodes)
    if (!observed.has(node)) {
      resizeObserver?.observe(node)
      observed.add(node)
    }
  motion.measure()
  scroll.refresh()
}
function scheduleRefresh() {
  const view = element.value?.ownerDocument.defaultView
  if (!active || frame !== undefined) return
  if (!view?.requestAnimationFrame) {
    refresh()
    return
  }
  frame = view.requestAnimationFrame(() => {
    frame = undefined
    refresh()
  })
}
function onReducedMotion() {
  if (media?.matches) motion.finish()
}
function connect() {
  if (active || !element.value) return
  active = true
  const view = element.value.ownerDocument.defaultView
  motion.jump(expanded.value)
  if (typeof ResizeObserver !== 'undefined') resizeObserver = new ResizeObserver(scheduleRefresh)
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(scheduleRefresh)
    mutationObserver.observe(element.value, { childList: true, characterData: true, subtree: true })
  }
  media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', onReducedMotion)
  view?.addEventListener('resize', scheduleRefresh)
  element.value.addEventListener('load', scheduleRefresh, true)
  element.value.ownerDocument.fonts?.addEventListener('loadingdone', scheduleRefresh)
  refresh()
}
function disconnect() {
  active = false
  const view = element.value?.ownerDocument.defaultView
  if (frame !== undefined) view?.cancelAnimationFrame(frame)
  frame = undefined
  motion.cancel()
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  observed.clear()
  media?.removeEventListener('change', onReducedMotion)
  view?.removeEventListener('resize', scheduleRefresh)
  element.value?.removeEventListener('load', scheduleRefresh, true)
  element.value?.ownerDocument.fonts?.removeEventListener('loadingdone', scheduleRefresh)
}
watch(
  [expanded, () => props.size],
  () => {
    if (active) motion.play(expanded.value)
  },
  { flush: 'post' },
)
onMounted(connect)
onActivated(connect)
onDeactivated(disconnect)
onBeforeUnmount(disconnect)
onUpdated(scheduleRefresh)
defineExpose({ element, focus, blur, expand, collapse, toggle, refresh })
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    ref="element"
    :style="offsetStyle"
    v-bind="attrs"
    :href="isLink ? props.href : undefined"
    :type="isLink ? undefined : props.type"
    class="mdv-fab mdv-extended-fab"
    :class="[
      `mdv-extended-fab--${props.size}`,
      `mdv-fab--${color}`,
      `mdv-fab--${props.position}`,
      `mdv-fab--${props.placement}`,
      { 'mdv-fab--elevated': props.elevated, 'mdv-extended-fab--collapsed': !expanded },
    ]"
    @pointerdown="showRipple"
    @pointerup="releaseRipple"
    @pointerleave="releaseRipple"
    @pointercancel="releaseRipple"
    @keydown="showRipple"
    @keyup="releaseRipple"
    @blur="releaseRipple"
  >
    <span ref="surface" class="mdv-fab__surface">
      <FabRipple :ripple="ripple" @animationend="finishRipple" />
      <span v-if="slots.leading" ref="icon" class="mdv-fab__icon" aria-hidden="true" inert>
        <slot name="leading" />
      </span>
      <span ref="label" class="mdv-extended-fab__label"><slot /></span>
    </span>
  </component>
</template>
