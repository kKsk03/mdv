<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  mergeProps,
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
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { mdvTabsKey } from './tabs-context'
import type { TabPanelRegistration, TabRegistration } from './tabs-context'
import { createTabsIndicator, measureTabsIndicator } from './tabs-indicator'
import { createTabsSwipe } from './tabs-swipe'
import type { MdvTabsProps, MdvTabValue } from './tabs.types'

defineOptions({ name: 'MdvTabs', inheritAttrs: false })
defineSlots<{ default?(): VNode[]; panels?(): VNode[] }>()
const props = withDefaults(defineProps<MdvTabsProps>(), {
  variant: 'primary',
  scrollable: false,
  showDivider: true,
  activation: 'manual',
  tabNavigation: 'all',
  swipeable: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: MdvTabValue]
  change: [value: MdvTabValue]
}>()
const instance = getCurrentInstance()!
const attrs = useAttrs()
const root = useTemplateRef<HTMLDivElement>('root')
const viewport = useTemplateRef<HTMLDivElement>('viewport')
const row = useTemplateRef<HTMLDivElement>('row')
const indicator = useTemplateRef<HTMLSpanElement>('indicator')
const groupId = `mdv-tabs-${useId()}`
const internalValue = ref<MdvTabValue>()
const tabStop = ref<MdvTabValue>()
const registryVersion = ref(0)
const hasExternalModel = ref(controlled())
const selected = computed(() => {
  const value = props.modelValue
  return hasExternalModel.value ? value : internalValue.value
})
const variant = computed(() => props.variant)
const iconPosition = computed(
  () => props.iconPosition ?? (props.variant === 'primary' ? 'top' : 'leading'),
)
let tabs: TabRegistration[] = []
let panels: TabPanelRegistration[] = []
let previousOrder: TabRegistration[] = []
let lastFocused: TabRegistration | undefined
let restoringFocus = false
let mounted = false
let running = true
let disposed = false
let queued = false
let animateQueued = false
let pendingSelection: { value: MdvTabValue; token: number } | undefined
let sequence = 0
let resizeObserver: ResizeObserver | undefined
let availabilityObserver: MutationObserver | undefined
let motionQuery: MediaQueryList | undefined
const observed = new Set<Element>()

function controlled() {
  const vnodeProps = instance.vnode.props ?? {}
  return (
    Object.prototype.hasOwnProperty.call(vnodeProps, 'modelValue') ||
    Object.prototype.hasOwnProperty.call(vnodeProps, 'model-value')
  )
}

function valueKey(value: MdvTabValue) {
  return `${typeof value === 'number' ? 'n' : 's'}-${encodeURIComponent(Object.is(value, -0) ? '-0' : String(value))}`
}
function tabId(value: MdvTabValue) {
  return `${groupId}-tab-${valueKey(value)}`
}
function panelId(value: MdvTabValue) {
  return `${groupId}-panel-${valueKey(value)}`
}
function labelId(value: MdvTabValue) {
  void registryVersion.value
  return tabs.find((tab) => Object.is(tab.value(), value))?.id() ?? tabId(value)
}
function hasTab(value: MdvTabValue) {
  void registryVersion.value
  return tabs.some((tab) => Object.is(tab.value(), value))
}
function isSelected(value: MdvTabValue) {
  return Object.is(selected.value, value)
}

function ordered() {
  return [...tabs].sort((a, b) => {
    const first = a.element()
    const second = b.element()
    if (!first || !second) return 0
    const position = first.compareDocumentPosition(second)
    return position & 1 ? 0 : position & 4 ? -1 : position & 2 ? 1 : 0
  })
}
function available() {
  return ordered().filter(
    (tab) => !tab.unavailable() && !tab.element()?.closest('[hidden], [inert]'),
  )
}
function selectedTab() {
  return ordered().find((tab) => isSelected(tab.value()))
}
function selectedPanel() {
  return panels.find((panel) => isSelected(panel.value()))?.element() ?? null
}

const motion = createTabsIndicator({ element: () => indicator.value, row: () => row.value })

function reveal(tab: TabRegistration) {
  const element = tab.element()
  const container = viewport.value
  if (!element || !container) return
  const bounds = element.getBoundingClientRect()
  const clip = container.getBoundingClientRect()
  if (clip.width <= 0) return
  const distance =
    bounds.left < clip.left
      ? bounds.left - clip.left
      : bounds.right > clip.right
        ? bounds.right - clip.right
        : 0
  if (distance) container.scrollLeft += distance
}

function syncObservers() {
  if (!resizeObserver) return
  const next = new Set<Element>()
  if (viewport.value) next.add(viewport.value)
  if (row.value) next.add(row.value)
  for (const tab of tabs) {
    const element = tab.element()
    const content = tab.content()
    if (element) next.add(element)
    if (content) next.add(content)
  }
  for (const element of observed) if (!next.has(element)) resizeObserver.unobserve(element)
  for (const element of next) if (!observed.has(element)) resizeObserver.observe(element)
  observed.clear()
  for (const element of next) observed.add(element)
}

function sync(animate: boolean) {
  if (!mounted || !running || disposed || !root.value) return
  const candidates = available()
  const current = selectedTab()
  if (!controlled() && candidates.length && (!current || !candidates.includes(current))) {
    const index = Math.max(
      0,
      previousOrder.findIndex((tab) => isSelected(tab.value())),
    )
    const next =
      candidates.find((tab) => ordered().indexOf(tab) >= index) ?? candidates[candidates.length - 1]
    internalValue.value = next?.value()
  }
  previousOrder = ordered()
  const document = root.value.ownerDocument
  const focused = candidates.find((tab) => tab.element() === document.activeElement)
  const preferred = focused ?? candidates.find((tab) => isSelected(tab.value())) ?? candidates[0]
  if (props.tabNavigation === 'active') tabStop.value = preferred?.value()
  if (lastFocused && !candidates.includes(lastFocused)) {
    const element = lastFocused.element()
    if (document.activeElement === element || document.activeElement === document.body) {
      lastFocused = preferred
      restoreTabFocus(preferred)
    }
  }
  const target = selectedTab()
  const button = target?.element()
  const content = target?.content()
  motion.moveTo(
    row.value && button && content && !button.closest('[hidden], [inert]')
      ? measureTabsIndicator(row.value, button, content, props.variant === 'primary')
      : null,
    animate,
  )
  syncObservers()
}

function schedule(animate = false) {
  if (!mounted || disposed || !running) return
  animateQueued ||= animate
  if (queued) return
  queued = true
  void nextTick(() => {
    queued = false
    const play = animateQueued
    animateQueued = false
    sync(play)
  })
}

function registerTab(tab: TabRegistration) {
  if (import.meta.env.DEV && tabs.some((entry) => Object.is(entry.value(), tab.value()))) {
    console.warn('[MDV] MdvTabs: each tab must have a unique value.')
  }
  tabs.push(tab)
  registryVersion.value++
  // 在子项 setup 时选取首项，SSR 首屏无需读取 DOM 或发送模型更新。
  if (!controlled() && internalValue.value === undefined && !tab.unavailable())
    internalValue.value = tab.value()
  schedule()
  return () => {
    const element = tab.element()
    const document = element?.ownerDocument
    const restore = !!element && document?.activeElement === element
    const index = ordered().indexOf(tab)
    tabs = tabs.filter((entry) => entry !== tab)
    registryVersion.value++
    schedule()
    if (restore)
      void nextTick(() => {
        if (!running || disposed || !document || document.activeElement !== document.body) return
        const candidates = available()
        const next =
          candidates.find((entry) => isSelected(entry.value())) ??
          candidates[Math.min(index, candidates.length - 1)]
        restoreTabFocus(next)
      })
  }
}

function registerPanel(panel: TabPanelRegistration) {
  panels.push(panel)
  return () => {
    panels = panels.filter((entry) => entry !== panel)
  }
}

async function select(value: MdvTabValue) {
  if (!running || disposed || isSelected(value) || Object.is(pendingSelection?.value, value))
    return false
  const tab = available().find((entry) => Object.is(entry.value(), value))
  if (!tab) return false
  const token = ++sequence
  pendingSelection = { value, token }
  if (!controlled()) internalValue.value = value
  emit('update:modelValue', value)
  await nextTick()
  if (disposed || !running || pendingSelection?.token !== token) return false
  pendingSelection = undefined
  if (!isSelected(value)) return false
  emit('change', value)
  reveal(tab)
  return true
}

function tabIndex(value: MdvTabValue) {
  if (props.tabNavigation === 'all') return 0
  return Object.is(tabStop.value ?? selected.value, value) ? 0 : -1
}

function focused(value: MdvTabValue) {
  const tab = available().find((entry) => Object.is(entry.value(), value))
  if (!tab) return
  lastFocused = tab
  tabStop.value = value
  reveal(tab)
  if (props.activation === 'automatic' && !restoringFocus) void select(value)
}

function restoreTabFocus(tab: TabRegistration | undefined) {
  restoringFocus = true
  try {
    tab?.element()?.focus({ preventScroll: true })
    if (tab) reveal(tab)
  } finally {
    restoringFocus = false
  }
}

function focus(value?: MdvTabValue) {
  const candidates = available()
  const target =
    value === undefined
      ? (candidates.find((tab) => isSelected(tab.value())) ?? candidates[0])
      : candidates.find((tab) => Object.is(tab.value(), value))
  target?.element()?.focus({ preventScroll: true })
  if (target) reveal(target)
}

function restoreFocus(panel: HTMLElement) {
  const document = panel.ownerDocument
  const before = document.activeElement
  if (!before || !panel.contains(before)) return
  void nextTick(() => {
    if (!running || disposed) return
    const current = document.activeElement
    if (current === document.body || (current && panel.contains(current))) {
      const candidates = available()
      restoreTabFocus(candidates.find((tab) => isSelected(tab.value())) ?? candidates[0])
    }
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || !root.value)
    return
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const candidates = available()
  const index = candidates.findIndex((tab) => tab.element() === event.target)
  if (index < 0) return
  const rtl =
    (root.value.ownerDocument.defaultView?.getComputedStyle(root.value).direction ||
      root.value.closest('[dir]')?.getAttribute('dir')) === 'rtl'
  const direction = (event.key === 'ArrowRight') !== rtl ? 1 : -1
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? candidates.length - 1
        : (index + direction + candidates.length) % candidates.length
  const target = candidates[next]
  if (!target) return
  event.preventDefault()
  target.element()?.focus({ preventScroll: true })
  reveal(target)
}

const swipe = createTabsSwipe({
  root: () => root.value,
  enabled: () => props.swipeable && running && !disposed,
  panel: selectedPanel,
  navigate(direction) {
    const candidates = available()
    const index = candidates.findIndex((tab) => isSelected(tab.value()))
    const target = index < 0 ? undefined : candidates[index + direction]
    if (target) void select(target.value())
  },
})

function ariaText(name: string) {
  const value = attrs[name]
  return typeof value === 'string' ? value : undefined
}

function rootAttrs() {
  const result = { ...attrs }
  for (const key of ['role', 'tabindex', 'aria-label', 'aria-labelledby', 'aria-describedby'])
    delete result[key]
  return mergeProps(result, { onKeydown: handleKeydown, onFocusout: () => schedule() })
}

provide(mdvTabsKey, {
  variant,
  iconPosition,
  isSelected,
  hasTab,
  tabId,
  labelId,
  panelId,
  tabIndex,
  registerTab,
  registerPanel,
  changed: () => schedule(),
  select,
  focused,
  restoreFocus,
})

watch(selected, () => {
  swipe.cancel()
  schedule(true)
  void nextTick(() => {
    const tab = selectedTab()
    if (running && tab) reveal(tab)
  })
})
watch(
  () => [props.variant, props.iconPosition, props.scrollable, props.tabNavigation],
  () => schedule(),
)
watch(
  () => props.swipeable,
  () => swipe.cancel(),
)

function motionPreferenceChanged() {
  motion.finish()
  schedule()
}
function layoutChanged() {
  schedule()
}
function connect() {
  const element = root.value
  const view = element?.ownerDocument.defaultView
  if (!element || !view) return
  const Resize = view.ResizeObserver
  if (Resize) resizeObserver = new Resize(layoutChanged)
  const Mutation = view.MutationObserver
  if (Mutation) {
    availabilityObserver = new Mutation(layoutChanged)
    availabilityObserver.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['disabled', 'hidden', 'inert', 'dir'],
    })
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      availabilityObserver.observe(parent, {
        attributes: true,
        attributeFilter: ['disabled', 'hidden', 'inert', 'dir'],
      })
    }
  }
  motionQuery = view.matchMedia?.('(prefers-reduced-motion: reduce)')
  motionQuery?.addEventListener?.('change', motionPreferenceChanged)
  view.addEventListener('resize', layoutChanged)
  element.ownerDocument.fonts?.addEventListener('loadingdone', layoutChanged)
  sync(false)
  const fonts = element.ownerDocument.fonts
  if (fonts)
    void fonts.ready.then(() => {
      if (running && !disposed) schedule()
    })
}
function disconnect() {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  availabilityObserver?.disconnect()
  availabilityObserver = undefined
  observed.clear()
  motionQuery?.removeEventListener?.('change', motionPreferenceChanged)
  motionQuery = undefined
  const element = root.value
  element?.ownerDocument.defaultView?.removeEventListener('resize', layoutChanged)
  element?.ownerDocument.fonts?.removeEventListener('loadingdone', layoutChanged)
  motion.reset()
  swipe.cancel()
}

onMounted(() => {
  mounted = true
  connect()
})
onBeforeUpdate(() => {
  hasExternalModel.value = controlled()
})
onUpdated(() => schedule())
onActivated(() => {
  if (!running) {
    running = true
    connect()
  }
})
onDeactivated(() => {
  running = false
  pendingSelection = undefined
  disconnect()
})
onBeforeUnmount(() => {
  disposed = true
  running = false
  pendingSelection = undefined
  disconnect()
})
defineExpose({ focus })
</script>

<template>
  <div
    v-bind="rootAttrs()"
    ref="root"
    class="mdv-tabs"
    :class="[
      `mdv-tabs--${props.variant}`,
      {
        'mdv-tabs--scrollable': props.scrollable,
        'mdv-tabs--no-divider': !props.showDivider,
      },
    ]"
  >
    <div ref="viewport" class="mdv-tabs__viewport">
      <div
        ref="row"
        role="tablist"
        class="mdv-tabs__items"
        aria-orientation="horizontal"
        :aria-label="ariaText('aria-label')"
        :aria-labelledby="ariaText('aria-labelledby')"
        :aria-describedby="ariaText('aria-describedby')"
      >
        <slot />
        <span ref="indicator" class="mdv-tabs__indicator" hidden aria-hidden="true" />
      </div>
    </div>
    <div class="mdv-tabs__panels" @touchstart="swipe.start"><slot name="panels" /></div>
  </div>
</template>
