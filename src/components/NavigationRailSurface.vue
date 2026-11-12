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
  provide,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { navigationRailKey } from './navigation-rail-context'
import { createNavigationRailMotion } from './navigation-rail-motion'
import type { MdvNavigationRailProps, MdvNavigationRailSlotProps } from './navigation-rail.types'

defineOptions({ name: 'NavigationRailSurface', inheritAttrs: false })
const props = withDefaults(
  defineProps<
    MdvNavigationRailProps & {
      controls: MdvNavigationRailSlotProps['menuAttrs']
      externalMotion?: boolean
      visible?: boolean
    }
  >(),
  {
    expanded: false,
    alignment: 'top',
    transparent: false,
    showDivider: false,
    externalMotion: false,
    visible: true,
  },
)
const emit = defineEmits<{ toggle: []; select: [event: MouseEvent] }>()
const slots = defineSlots<{
  default?(props: MdvNavigationRailSlotProps): VNode[]
  menu?(props: MdvNavigationRailSlotProps): VNode[]
  fab?(props: MdvNavigationRailSlotProps): VNode[]
}>()
const attrs = useAttrs()
const root = useTemplateRef<HTMLElement>('root')
const probe = useTemplateRef<HTMLElement>('probe')
const extent = ref(220)
const slotProps = computed<MdvNavigationRailSlotProps>(() => ({
  expanded: props.expanded,
  toggle: () => emit('toggle'),
  menuAttrs: props.controls,
}))
provide(navigationRailKey, {
  expanded: computed(() => props.expanded),
  select: (event) => emit('select', event),
})
const motion = createNavigationRailMotion({
  element: () => root.value,
  initiallyExpanded: props.expanded,
})
let mounted = false
let active = true
let resize: ResizeObserver | undefined
let mutation: MutationObserver | undefined
let media: MediaQueryList | undefined
let focusBeforeUpdate: HTMLElement | null = null
let measured = false
const observed = new Set<Element>()

function rootAttrs() {
  const result = { ...attrs }
  delete result.role
  if (result.tabindex === undefined) result.tabindex = -1
  return result
}
function ownedItems() {
  const nav = root.value
  const dialog = nav?.closest('dialog')
  return nav
    ? [...nav.querySelectorAll<HTMLElement>('[data-mdv-rail-item]')].filter(
        (item) => item.closest('[data-mdv-rail]') === nav && item.closest('dialog') === dialog,
      )
    : []
}
function available(item: HTMLElement) {
  if (item.matches(':disabled, [aria-disabled="true"]') || item.closest('[hidden], [inert]'))
    return false
  const view = item.ownerDocument.defaultView
  for (let node: HTMLElement | null = item; node; node = node.parentElement) {
    const style = view?.getComputedStyle(node)
    if (style?.display === 'none' || style?.visibility === 'hidden') return false
    if (node === root.value) break
  }
  return true
}
function focus(options?: FocusOptions) {
  const items = ownedItems().filter(available)
  const item = items.find((item) => item.getAttribute('aria-current') === 'page') ?? items[0]
  ;(item ?? root.value)?.focus(options ?? { preventScroll: true })
}
function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing)
    return
  if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  const source = event.target as HTMLElement
  const item = source.closest<HTMLElement>('[data-mdv-rail-item]')
  if (!item || item !== source || item.closest('[data-mdv-rail]') !== root.value) return
  const items = ownedItems().filter(available)
  const index = items.indexOf(item)
  if (index < 0 || !items.length) return
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
  event.preventDefault()
  items[next]?.focus({ preventScroll: true })
  const destination = items[next]
  const viewport = destination?.closest<HTMLElement>('.mdv-navigation-rail__scroll')
  if (destination && viewport?.clientHeight) {
    const target = destination.getBoundingClientRect()
    const frame = viewport.getBoundingClientRect()
    if (target.top < frame.top) viewport.scrollTop += target.top - frame.top
    else if (target.bottom > frame.bottom) viewport.scrollTop += target.bottom - frame.bottom
  }
}

function observe(element: Element | null) {
  if (!element || observed.has(element)) return
  observed.add(element)
  resize?.observe(element)
}
function measure() {
  const nav = root.value
  if (!mounted || !active || !props.visible || !nav) return
  const view = nav.ownerDocument.defaultView
  const boundary = props.externalMotion ? nav.closest('dialog') : nav.parentElement
  const availableWidth = boundary?.clientWidth || view?.innerWidth || 360
  const items = ownedItems()
  const measurements = items.map((item) => {
    const label = item.querySelector<HTMLElement>('[data-rail-label-measure]')
    const badge = item.querySelector<HTMLElement>('[data-rail-badge]')
    const natural = label?.getBoundingClientRect().width || 0
    const badgeWidth = badge?.getBoundingClientRect().width || 0
    observe(label)
    observe(badge)
    return { item, natural, badgeWidth, badgeExtra: badgeWidth ? badgeWidth + 8 : 0 }
  })
  const naturalWidth = Math.max(
    220,
    ...measurements.map(({ natural, badgeExtra }) => 104 + natural + badgeExtra),
  )
  const requested = props.expandedWidth
    ? probe.value?.getBoundingClientRect().width || 220
    : naturalWidth
  // 收起可能同时移除长标签的次要项；沿用上一展开宽度，避免退场第一帧跳窄。
  const preferred = !props.expanded && measured ? extent.value : requested
  extent.value = Math.min(availableWidth, 360, Math.max(220, preferred))
  measured = true
  for (const { item, natural, badgeWidth, badgeExtra } of measurements) {
    const width = Math.max(0, Math.min(natural, extent.value - 104 - badgeExtra))
    item.style.setProperty('--mdv-rail-label-size', `${width}px`)
    item.style.setProperty('--mdv-rail-badge-size', `${badgeWidth}px`)
    item.style.setProperty('--mdv-rail-badge-space', `${badgeExtra}px`)
    const expandedLabel = item.querySelector<HTMLElement>('[data-rail-expanded-label]')
    const collapsedLabel = item.querySelector<HTMLElement>('[data-rail-collapsed-label]')
    item.style.setProperty('--mdv-rail-label-height', `${expandedLabel?.offsetHeight || 20}px`)
    item.style.setProperty('--mdv-rail-collapsed-height', `${collapsedLabel?.offsetHeight || 16}px`)
    observe(collapsedLabel)
  }
  for (const element of observed) {
    if (!element.isConnected) {
      resize?.unobserve(element)
      observed.delete(element)
    }
  }
}
function scheduleMeasure() {
  void nextTick(measure)
}
function start() {
  active = true
  const nav = root.value
  const view = nav?.ownerDocument.defaultView
  if (!view || !nav) return
  if (typeof view.ResizeObserver === 'function') resize = new view.ResizeObserver(scheduleMeasure)
  observe(props.externalMotion ? nav.closest('dialog') : nav.parentElement)
  observe(probe.value)
  if (typeof view.MutationObserver === 'function') {
    mutation = new view.MutationObserver(scheduleMeasure)
    mutation.observe(nav, { childList: true, characterData: true, subtree: true })
  }
  media = view.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', reduceMotion)
  nav.ownerDocument.fonts?.addEventListener('loadingdone', scheduleMeasure)
  void nav.ownerDocument.fonts?.ready.then(scheduleMeasure)
  measure()
  if (!props.externalMotion) motion.jump(props.expanded)
}
function reduceMotion() {
  if (media?.matches) motion.finish()
}
function stop() {
  active = false
  motion.cancel()
  resize?.disconnect()
  resize = undefined
  observed.clear()
  mutation?.disconnect()
  mutation = undefined
  media?.removeEventListener('change', reduceMotion)
  root.value?.ownerDocument.fonts?.removeEventListener('loadingdone', scheduleMeasure)
}
watch(
  () => props.expanded,
  (value) => {
    if (mounted && active && !props.externalMotion) void motion.play(value)
    scheduleMeasure()
  },
)
onBeforeUpdate(() => {
  const focused = root.value?.ownerDocument.activeElement
  focusBeforeUpdate = ownedItems().find((item) => item === focused) ?? null
})
onUpdated(() => {
  const previous = focusBeforeUpdate
  focusBeforeUpdate = null
  measure()
  if (
    !active ||
    !props.visible ||
    !previous ||
    (root.value?.contains(previous) && available(previous))
  )
    return
  const doc = previous.ownerDocument
  const focused = doc.activeElement
  // 项目失效才恢复失去的焦点，不覆盖弹窗或应用已经安排的焦点。
  if (!focused || focused === previous || focused === doc.body || focused === doc.documentElement)
    focus()
})
onMounted(() => {
  mounted = true
  start()
})
onActivated(() => {
  if (!active) start()
})
onDeactivated(stop)
onBeforeUnmount(() => {
  mounted = false
  stop()
})
defineExpose({ focus })
</script>

<template>
  <nav
    ref="root"
    v-bind="rootAttrs()"
    class="mdv-navigation-rail"
    data-mdv-rail
    :class="{
      'mdv-navigation-rail--transparent': transparent,
      'mdv-navigation-rail--divider': showDivider,
      'mdv-navigation-rail--external': externalMotion,
    }"
    :data-expanded="expanded"
    :data-alignment="alignment"
    :style="{ '--mdv-rail-expanded-size': `${extent}px` }"
    @keydown="keydown"
  >
    <span
      ref="probe"
      class="mdv-navigation-rail__probe"
      :style="{ width: expandedWidth || '0px' }"
      aria-hidden="true"
    />
    <div v-if="slots.menu || slots.fab" class="mdv-navigation-rail__header">
      <div v-if="slots.menu" class="mdv-navigation-rail__menu">
        <slot name="menu" v-bind="slotProps" />
      </div>
      <div v-if="slots.fab" class="mdv-navigation-rail__fab">
        <slot name="fab" v-bind="slotProps" />
      </div>
    </div>
    <div class="mdv-navigation-rail__scroll">
      <div class="mdv-navigation-rail__items"><slot v-bind="slotProps" /></div>
    </div>
  </nav>
</template>
