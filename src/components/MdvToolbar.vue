<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode, WatchStopHandle } from 'vue'
import moreIcon from '@iconify-icons/material-symbols/more-horiz'
import lessIcon from '@iconify-icons/material-symbols/chevron-left'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { navigateToolbar, toolbarControls } from './toolbar-focus'
import { createToolbarMotion } from './toolbar-motion'
import { dismissTooltipsWithin } from './tooltip-layer'
import type { MdvToolbarProps, MdvToolbarSlotProps } from './toolbar.types'

defineOptions({ name: 'MdvToolbar', inheritAttrs: false })
const props = withDefaults(defineProps<MdvToolbarProps>(), {
  variant: 'docked',
  color: 'standard',
  orientation: 'horizontal',
  align: 'center',
  elevated: undefined,
  position: 'static',
  placement: 'bottom',
  expanded: undefined,
  scrollBehavior: 'none',
  scrollThreshold: 40,
  expandLabel: '展开工具栏',
  collapseLabel: '收起工具栏',
})
const emit = defineEmits<{ 'update:expanded': [value: boolean] }>()
const slots = defineSlots<{
  leading?(state: MdvToolbarSlotProps): VNode[]
  default?(state: MdvToolbarSlotProps): VNode[]
  trailing?(state: MdvToolbarSlotProps): VNode[]
  toggle?(state: MdvToolbarSlotProps): VNode[]
}>()
const attrs = useAttrs()
const id = `mdv-toolbar-${useId()}`
const element = useTemplateRef<HTMLElement>('element')
const leading = useTemplateRef<HTMLElement>('leading')
const trailing = useTemplateRef<HTMLElement>('trailing')
const leadingItems = useTemplateRef<HTMLElement>('leadingItems')
const trailingItems = useTemplateRef<HTMLElement>('trailingItems')
const primary = useTemplateRef<HTMLElement>('primary')
const toggleElement = useTemplateRef<HTMLElement>('toggleElement')
const internalExpanded = ref(true)
const hidden = ref(false)
const floating = computed(() => props.variant === 'floating')
const vertical = computed(() => floating.value && props.orientation === 'vertical')
const expanded = computed(() => !floating.value || (props.expanded ?? internalExpanded.value))
function canCollapse() {
  return floating.value && !!(slots.leading || slots.trailing)
}
function scrollBehavior() {
  if (props.scrollBehavior === 'collapse' && !canCollapse()) return 'none'
  return props.scrollBehavior
}
const placement = computed(() => (floating.value ? props.placement : 'bottom'))
function slotState(): MdvToolbarSlotProps {
  return {
    expanded: expanded.value,
    expand,
    collapse,
    toggle,
    toggleProps: {
      'aria-expanded': expanded.value,
      'aria-controls': [
        slots.leading ? `${id}-leading` : '',
        slots.trailing ? `${id}-trailing` : '',
      ]
        .filter(Boolean)
        .join(' '),
      'aria-label': expanded.value ? props.collapseLabel : props.expandLabel,
      onClick: () => {
        void toggle()
      },
    },
  }
}
function rootAttrs() {
  return { 'aria-label': attrs['aria-labelledby'] ? undefined : '工具栏', tabindex: -1, ...attrs }
}
function onKeydown(event: KeyboardEvent) {
  if (element.value) navigateToolbar(event, element.value, vertical.value)
}
function onFocus() {
  reveal()
  motion.finish()
}

let active = false
let target: Window | HTMLElement | null = null
let view: Window | null = null
let lastY = 0
let distance = 0
let direction = 0
let pointerDown = false
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let selectorObserver: MutationObserver | undefined
let stopTargetWatch: WatchStopHandle | undefined
let measureFrame: number | undefined
let media: MediaQueryList | undefined
const observed = new Set<Element>()
const motion = createToolbarMotion({
  element: () => element.value,
  leading: () => leadingItems.value,
  trailing: () => trailingItems.value,
  vertical: () => vertical.value,
  expanded: () => expanded.value,
})

async function requestExpanded(value: boolean) {
  if (!canCollapse()) return value === expanded.value
  if (value === expanded.value) return true
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

function protectFocus() {
  const root = element.value
  const focused = root?.ownerDocument.activeElement
  if (
    !root ||
    !focused ||
    (!leading.value?.contains(focused) && !trailing.value?.contains(focused))
  )
    return
  const candidates = toolbarControls(root)
  const destination =
    candidates.find((node) => primary.value?.contains(node)) ??
    candidates.find((node) => toggleElement.value?.contains(node)) ??
    root
  destination.focus({ preventScroll: true })
}
watch(
  expanded,
  (value) => {
    if (!value) {
      protectFocus()
      if (leading.value) dismissTooltipsWithin(leading.value)
      if (trailing.value) dismissTooltipsWithin(trailing.value)
    }
  },
  { flush: 'pre' },
)
watch(
  [expanded, vertical, floating],
  () => {
    if (!active) return
    if (floating.value) motion.play(expanded.value)
    else motion.jump(true)
  },
  { flush: 'post' },
)

function resolveTarget(): Window | HTMLElement | null {
  const root = element.value
  if (!root || !view) return null
  let requested = props.scrollTarget
  if (requested === undefined) return view
  if (typeof requested === 'function') requested = requested() ?? undefined
  if (typeof requested === 'string') {
    try {
      return root.ownerDocument.querySelector<HTMLElement>(requested)
    } catch {
      return null
    }
  }
  return requested ?? null
}
function scrollPosition() {
  const value = target ? ('scrollY' in target ? target.scrollY : target.scrollTop) : 0
  return Number.isFinite(value) ? Math.max(0, value) : 0
}
function resetDistance() {
  distance = direction = 0
}
function reveal() {
  hidden.value = false
  resetDistance()
}
function interacting() {
  const root = element.value
  return (
    pointerDown ||
    (!!root &&
      (root.contains(root.ownerDocument.activeElement) ||
        !!root.querySelector(
          '[data-mdv-menu-trigger-open], [aria-haspopup][aria-expanded="true"], dialog[open]',
        )))
  )
}
function onScroll() {
  const y = scrollPosition()
  const delta = y - lastY
  lastY = y
  if (!delta || scrollBehavior() === 'none') return
  if (y === 0) {
    reveal()
    if (scrollBehavior() === 'collapse') void expand()
    return
  }
  if (interacting()) {
    resetDistance()
    return
  }
  const nextDirection = delta > 0 ? 1 : -1
  if (nextDirection !== direction) {
    distance = 0
    direction = nextDirection
  }
  distance += Math.abs(delta)
  const threshold = Number.isFinite(props.scrollThreshold) ? Math.max(0, props.scrollThreshold) : 40
  if (distance < threshold) return
  distance = 0
  if (scrollBehavior() === 'hide') hidden.value = direction > 0
  else void requestExpanded(direction < 0)
}
function attachTarget() {
  const next = scrollBehavior() === 'none' ? null : resolveTarget()
  if (next === target) return
  target?.removeEventListener('scroll', onScroll)
  target = next
  target?.addEventListener('scroll', onScroll, { passive: true })
  lastY = scrollPosition()
  reveal()
}
function observeItems() {
  const nodes = [element.value, primary.value, leadingItems.value, trailingItems.value].filter(
    (node): node is HTMLElement => node !== null,
  )
  for (const node of observed)
    if (!nodes.includes(node as HTMLElement)) {
      resizeObserver?.unobserve(node)
      observed.delete(node)
    }
  for (const node of nodes)
    if (!observed.has(node)) {
      resizeObserver?.observe(node)
      observed.add(node)
    }
}
function fitDocked() {
  const root = element.value
  if (!root || !view) return
  root.style.removeProperty('--mdv-toolbar-fit-gap')
  if (floating.value) return
  const rows = [leadingItems.value, primary.value, trailingItems.value].filter(
    (node): node is HTMLElement => node !== null,
  )
  const gap = Number.parseFloat(rows[0] ? view.getComputedStyle(rows[0]).columnGap : '') || 0
  const items = rows
    .flatMap((row) => [...row.children])
    .filter((node) => {
      const style = view!.getComputedStyle(node)
      return style.display !== 'none' && style.position !== 'absolute' && style.position !== 'fixed'
    })
  if (items.length < 2) return
  const style = view.getComputedStyle(root)
  const available =
    root.clientWidth -
    (Number.parseFloat(style.paddingLeft) || 0) -
    (Number.parseFloat(style.paddingRight) || 0)
  const used = items.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0)
  if (available <= 0) return
  const fitted = Math.max(Math.min(4, gap), Math.min(gap, (available - used) / (items.length - 1)))
  root.style.setProperty('--mdv-toolbar-fit-gap', `${fitted}px`)
}
function refresh() {
  if (!active) return
  attachTarget()
  observeItems()
  fitDocked()
  motion.measure()
}
function scheduleMeasure() {
  if (!active || measureFrame !== undefined) return
  if (view?.requestAnimationFrame)
    measureFrame = view.requestAnimationFrame(() => {
      measureFrame = undefined
      refresh()
    })
  else refresh()
}
function onKeyboard(event: KeyboardEvent) {
  if (event.key === 'Tab') reveal()
}
function onPointerEnd() {
  pointerDown = false
}
function onReducedMotion() {
  if (media?.matches) motion.finish()
}
function connect() {
  if (active || !element.value) return
  active = true
  const doc = element.value.ownerDocument
  view = doc.defaultView
  motion.jump(expanded.value)
  hidden.value = false
  if (typeof ResizeObserver !== 'undefined') resizeObserver = new ResizeObserver(scheduleMeasure)
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(scheduleMeasure)
    mutationObserver.observe(element.value, { childList: true, characterData: true, subtree: true })
  }
  stopTargetWatch = watch(
    () => [props.variant, props.scrollBehavior, props.scrollTarget, resolveTarget()],
    () => {
      selectorObserver?.disconnect()
      selectorObserver = undefined
      if (typeof props.scrollTarget === 'string' && typeof MutationObserver !== 'undefined') {
        selectorObserver = new MutationObserver(scheduleMeasure)
        selectorObserver.observe(doc.documentElement, { childList: true, subtree: true })
      }
      lastY = scrollPosition()
      reveal()
      attachTarget()
    },
    { immediate: true, flush: 'post' },
  )
  doc.addEventListener('keydown', onKeyboard, true)
  doc.addEventListener('pointerup', onPointerEnd, true)
  doc.addEventListener('pointercancel', onPointerEnd, true)
  view?.addEventListener('resize', scheduleMeasure)
  view?.addEventListener('blur', onPointerEnd)
  element.value.addEventListener('load', scheduleMeasure, true)
  media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', onReducedMotion)
  refresh()
}
function disconnect() {
  if (!active) return
  active = false
  const doc = element.value?.ownerDocument
  doc?.removeEventListener('keydown', onKeyboard, true)
  doc?.removeEventListener('pointerup', onPointerEnd, true)
  doc?.removeEventListener('pointercancel', onPointerEnd, true)
  target?.removeEventListener('scroll', onScroll)
  target = null
  view?.removeEventListener('resize', scheduleMeasure)
  view?.removeEventListener('blur', onPointerEnd)
  element.value?.removeEventListener('load', scheduleMeasure, true)
  media?.removeEventListener('change', onReducedMotion)
  media = undefined
  stopTargetWatch?.()
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  selectorObserver?.disconnect()
  observed.clear()
  if (measureFrame !== undefined) view?.cancelAnimationFrame(measureFrame)
  measureFrame = undefined
  pointerDown = false
  motion.jump(expanded.value)
}
onMounted(connect)
onActivated(connect)
onDeactivated(disconnect)
onBeforeUnmount(disconnect)
onUpdated(scheduleMeasure)

if (import.meta.env.DEV)
  watch(
    () => [props.variant, props.orientation, props.placement, props.scrollBehavior],
    () => {
      if (
        !floating.value &&
        (props.orientation === 'vertical' ||
          props.placement !== 'bottom' ||
          props.scrollBehavior === 'collapse')
      )
        console.warn(
          '[MDV] MdvToolbar: Docked uses horizontal/bottom and supports none/hide scrolling; vertical, side placement and collapse are Floating options.',
        )
    },
    { immediate: true },
  )

defineExpose({ element, expand, collapse, toggle, refresh })
</script>

<template>
  <div
    ref="element"
    v-bind="rootAttrs()"
    class="mdv-toolbar"
    :class="[
      `mdv-toolbar--${props.variant}`,
      `mdv-toolbar--${props.color}`,
      `mdv-toolbar--${vertical ? 'vertical' : 'horizontal'}`,
      `mdv-toolbar--align-${props.align}`,
      `mdv-toolbar--${props.position}`,
      `mdv-toolbar--placement-${placement}`,
      {
        'mdv-toolbar--expanded': expanded,
        'mdv-toolbar--collapsed': !expanded,
        'mdv-toolbar--elevated': props.elevated ?? floating,
        'mdv-toolbar--hidden': hidden,
      },
    ]"
    data-mdv-toolbar
    role="toolbar"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
    @keydown="onKeydown"
    @focusin="onFocus"
    @pointerdown="pointerDown = true"
  >
    <div
      v-if="slots.leading"
      :id="`${id}-leading`"
      ref="leading"
      class="mdv-toolbar__region mdv-toolbar__region--leading"
      :inert="!expanded || undefined"
      :aria-hidden="!expanded || undefined"
    >
      <div ref="leadingItems" class="mdv-toolbar__items">
        <slot name="leading" v-bind="slotState()" />
      </div>
    </div>
    <div ref="primary" class="mdv-toolbar__items mdv-toolbar__primary">
      <slot v-bind="slotState()" />
    </div>
    <div
      v-if="slots.trailing"
      :id="`${id}-trailing`"
      ref="trailing"
      class="mdv-toolbar__region mdv-toolbar__region--trailing"
      :inert="!expanded || undefined"
      :aria-hidden="!expanded || undefined"
    >
      <div ref="trailingItems" class="mdv-toolbar__items">
        <slot name="trailing" v-bind="slotState()" />
      </div>
    </div>
    <div v-if="canCollapse()" ref="toggleElement" class="mdv-toolbar__toggle">
      <slot name="toggle" v-bind="slotState()">
        <MdvIconButton variant="standard" v-bind="slotState().toggleProps">
          <MdvIcon :icon="expanded ? lessIcon : moreIcon" class="mdv-toolbar__toggle-icon" />
        </MdvIconButton>
      </slot>
    </div>
  </div>
</template>
