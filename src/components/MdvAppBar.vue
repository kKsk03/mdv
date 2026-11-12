<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  provide,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'
import type { CSSProperties, VNode, WatchStopHandle } from 'vue'
import { createAppBarScroll } from './app-bar-scroll'
import { appBarScaffoldKey } from './app-bar-scaffold'
import { appBarSearchKey } from './app-bar-search'
import type { MdvAppBarProps, MdvAppBarSlotProps } from './app-bar.types'

defineOptions({ name: 'MdvAppBar' })
const props = withDefaults(defineProps<MdvAppBarProps>(), {
  variant: 'small',
  appearance: 'default',
  titleAlignment: 'start',
  headingLevel: 1,
  scrollBehavior: 'none',
  scrolled: undefined,
  transparentOnScroll: false,
})
const slots = defineSlots<{
  leading?(state: MdvAppBarSlotProps): VNode[]
  title?(state: MdvAppBarSlotProps): VNode[]
  subtitle?(state: MdvAppBarSlotProps): VNode[]
  actions?(state: MdvAppBarSlotProps): VNode[]
  image?(state: MdvAppBarSlotProps): VNode[]
}>()

const element = useTemplateRef<HTMLElement>('element')
const scaffold = inject(appBarScaffoldKey, null)
const search = inject(appBarSearchKey, null)
// 只作用于当前组合栏；搜索结果中的其它 AppBar 保持原有行为。
provide(appBarSearchKey, null)
const content = useTemplateRef<HTMLElement>('content')
const titleElement = useTemplateRef<HTMLElement>('titleElement')
const leading = useTemplateRef<HTMLElement>('leading')
const actions = useTemplateRef<HTMLElement>('actions')
const image = useTemplateRef<HTMLElement>('image')
const measured = shallowRef<{
  expanded: number
  compact: number
  compactY: number
  start: number
  end: number
  imageHeight: number
  titleHeight: number
  compactTitleHeight: number
} | null>(null)
const autoScrolled = ref(false)
const collapsed = ref(false)
const scrolledLook = computed(() => props.scrolled ?? autoScrolled.value)
const slotState = computed<MdvAppBarSlotProps>(() => ({
  scrolled: scrolledLook.value,
  collapsed: collapsed.value,
}))
const flexible = computed(() => props.variant !== 'small')
const hasTitle = () => !!(slots.title || props.title || props.collapsedTitle)
const hasSubtitle = () => !!(slots.subtitle || props.subtitle)
const defaultHeight = () => {
  if (!flexible.value) return 64
  if (props.variant === 'large') return hasSubtitle() ? 152 : 120
  return hasSubtitle() ? 136 : 112
}
const heights = () => measured.value ?? { expanded: defaultHeight(), compact: 64 }
const styles = computed<CSSProperties>(() => {
  const m = measured.value
  const appearance: CSSProperties = {
    '--mdv-app-bar-color-progress':
      props.scrolled === undefined
        ? 'var(--mdv-app-bar-auto-color-progress)'
        : props.scrolled
          ? '1'
          : '0',
  }
  if (!m) return appearance
  return {
    ...appearance,
    '--mdv-app-bar-expanded-height': `${m.expanded}px`,
    '--mdv-app-bar-row-height': `${m.compact}px`,
    '--mdv-app-bar-compact-y': `${m.compactY}px`,
    '--mdv-app-bar-start': `${m.start}px`,
    '--mdv-app-bar-end': `${m.end}px`,
    '--mdv-app-bar-image-height': `${m.imageHeight}px`,
    '--mdv-app-bar-title-height': `${m.titleHeight}px`,
    '--mdv-app-bar-compact-title-height': `${m.compactTitleHeight}px`,
  }
})

let active = false
let target: Window | HTMLElement | null = null
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let measureFrame: number | undefined
let view: Window | null = null
let media: MediaQueryList | undefined
let stopTargetWatch: WatchStopHandle | undefined
const observed = new Set<HTMLElement>()
let pointerFocus = false

const motion = createAppBarScroll({
  view: () => view,
  behavior: () => props.scrollBehavior,
  heights,
  update(collapse, hidden, colorProgress) {
    const h = heights()
    const range = h.expanded - h.compact
    const progress = flexible.value && range > 0 ? Math.min(1, collapse / range) : 1
    const root = element.value
    root?.style.setProperty('--mdv-app-bar-progress', String(progress))
    root?.style.setProperty('--mdv-app-bar-collapse', `${collapse}px`)
    root?.style.setProperty('--mdv-app-bar-hide', `${hidden}px`)
    root?.style.setProperty('--mdv-app-bar-auto-color-progress', String(colorProgress))
    if (active && root) scaffold?.update(root, h.expanded, collapse, hidden)
    collapsed.value = flexible.value && progress >= 0.999
  },
})

function resolveTarget(): Window | HTMLElement | null {
  const root = element.value
  if (!root || !view) return null
  let requested = props.scrollTarget
  if (requested === undefined) return scaffold ? scaffold.scrollTarget() : view
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

function scrollTop() {
  if (!target) return 0
  return 'scrollY' in target ? target.scrollY : target.scrollTop
}

function onScroll() {
  const y = Math.max(0, scrollTop())
  autoScrolled.value = y > 0
  motion.scroll(y)
}

function attachTarget() {
  const next = resolveTarget()
  if (next === target) return
  target?.removeEventListener('scroll', onScroll)
  target = next
  target?.addEventListener('scroll', onScroll, { passive: true })
  const y = Math.max(0, scrollTop())
  autoScrolled.value = y > 0
  motion.reset(y)
}

function observeLayout() {
  if (!resizeObserver) return
  const nodes = [element.value, content.value, leading.value, actions.value].filter(
    (node): node is HTMLElement => node !== null,
  )
  for (const node of observed) {
    if (!nodes.includes(node)) {
      resizeObserver.unobserve(node)
      observed.delete(node)
    }
  }
  for (const node of nodes) {
    if (observed.has(node)) continue
    resizeObserver.observe(node)
    observed.add(node)
  }
}

function measure() {
  measureFrame = undefined
  const root = element.value
  if (!active || !root) return
  attachTarget()
  // 同步测量唯一的真实标题，读取后立即恢复；不复制插槽或交互节点。
  let compactContent = 0
  let compactTitleHeight = 0
  let expandedContent = 0
  let titleHeight = 0
  let imageHeight = 0
  try {
    root.classList.add('mdv-app-bar--measure-small')
    compactContent = content.value?.getBoundingClientRect().height ?? 0
    compactTitleHeight = titleElement.value?.getBoundingClientRect().height ?? 0
    root.classList.remove('mdv-app-bar--measure-small')
    root.classList.add('mdv-app-bar--measure-expanded')
    expandedContent = content.value?.getBoundingClientRect().height ?? 0
    titleHeight = titleElement.value?.getBoundingClientRect().height ?? 0
    imageHeight = image.value?.getBoundingClientRect().height ?? 0
  } finally {
    root.classList.remove('mdv-app-bar--measure-small', 'mdv-app-bar--measure-expanded')
  }
  const leadingBox = leading.value?.getBoundingClientRect()
  const actionsBox = actions.value?.getBoundingClientRect()
  observeLayout()
  const compact = Math.max(
    64,
    compactContent + (search ? 8 : 16),
    (leadingBox?.height ?? 0) + 16,
    (actionsBox?.height ?? 0) + 16,
  )
  let start = Math.max(16, (leadingBox?.width ?? 0) + (slots.leading ? 16 : 0))
  let end = Math.max(16, (actionsBox?.width ?? 0) + (slots.actions ? 16 : 0))
  if (search) {
    start = 4 + (slots.leading ? (leadingBox?.width ?? 48) + 8 : 0)
    end = 4 + (slots.actions ? (actionsBox?.width ?? 48) + 8 : 0)
  }
  if (props.titleAlignment === 'center') start = end = Math.max(start, end)
  const next = {
    expanded: flexible.value ? Math.max(defaultHeight(), compact + expandedContent + 12) : compact,
    compact,
    compactY: Math.max(search ? 4 : 8, (compact - compactContent) / 2),
    start,
    end,
    imageHeight,
    titleHeight,
    compactTitleHeight,
  }
  const previous = measured.value
  if (
    !previous ||
    (Object.keys(next) as (keyof typeof next)[]).some(
      (key) => Math.abs(next[key] - previous[key]) > 0.1,
    )
  ) {
    measured.value = next
    motion.resize()
  }
}

function scheduleMeasure() {
  if (!active || measureFrame !== undefined) return
  if (!view?.requestAnimationFrame) {
    measure()
    return
  }
  measureFrame = view.requestAnimationFrame(measure)
}

function refresh() {
  if (!active) return
  if (measureFrame !== undefined) view?.cancelAnimationFrame(measureFrame)
  measureFrame = undefined
  measure()
}

function focusIn() {
  motion.focus(!pointerFocus)
}

function focusOut(event: FocusEvent) {
  const next = event.relatedTarget
  if (next instanceof Node && element.value?.contains(next)) return
  pointerFocus = false
  void nextTick(() => {
    if (!active) return
    motion.focus(false)
  })
}

function pointerDown() {
  pointerFocus = true
  motion.focus(false)
}

function keydown() {
  pointerFocus = false
  motion.focus(true)
}

function start() {
  if (active || !element.value) return
  active = true
  view = element.value.ownerDocument.defaultView
  attachTarget()
  measure()
  motion.focus(false)
  // 布局测量只观察宽度／内容变化；滚动写入的 style 不触发 MutationObserver。
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleMeasure)
    observeLayout()
  }
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(scheduleMeasure)
    mutationObserver.observe(element.value, { childList: true, characterData: true, subtree: true })
  }
  view?.addEventListener('resize', scheduleMeasure, { passive: true })
  element.value.ownerDocument.fonts?.addEventListener('loadingdone', scheduleMeasure)
  media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', motion.settle)
  stopTargetWatch = watch(
    () => [props.scrollBehavior, resolveTarget()],
    () => {
      attachTarget()
      motion.reset(scrollTop())
      refresh()
    },
    { flush: 'post' },
  )
}

function stop() {
  if (!active) return
  active = false
  if (element.value) scaffold?.remove(element.value)
  pointerFocus = false
  stopTargetWatch?.()
  stopTargetWatch = undefined
  target?.removeEventListener('scroll', onScroll)
  target = null
  resizeObserver?.disconnect()
  observed.clear()
  mutationObserver?.disconnect()
  resizeObserver = mutationObserver = undefined
  view?.removeEventListener('resize', scheduleMeasure)
  element.value?.ownerDocument.fonts?.removeEventListener('loadingdone', scheduleMeasure)
  media?.removeEventListener('change', motion.settle)
  media = undefined
  if (measureFrame !== undefined) view?.cancelAnimationFrame(measureFrame)
  measureFrame = undefined
  motion.stop()
  motion.focus(false)
  view = null
}

onMounted(start)
onActivated(start)
onDeactivated(stop)
onBeforeUnmount(stop)
onUpdated(scheduleMeasure)

defineExpose({ element, refresh })
</script>

<template>
  <header
    ref="element"
    class="mdv-app-bar"
    :class="[
      `mdv-app-bar--${props.variant}`,
      `mdv-app-bar--${props.appearance}`,
      {
        'mdv-app-bar--subtitle': hasSubtitle(),
        'mdv-app-bar--center': props.titleAlignment === 'center',
        'mdv-app-bar--sticky': props.scrollBehavior !== 'none',
        'mdv-app-bar--scaffold': !!scaffold,
        'mdv-app-bar--scrolled': scrolledLook,
        'mdv-app-bar--collapsed': collapsed,
        'mdv-app-bar--short-title': props.collapsedTitle !== undefined && !slots.title,
        'mdv-app-bar--transparent': props.transparentOnScroll,
        'mdv-app-bar--search': !!search,
      },
    ]"
    :style="styles"
    @focusin="focusIn"
    @focusout="focusOut"
    @pointerdown.capture="pointerDown"
    @keydown.capture="keydown"
    @load.capture="scheduleMeasure"
  >
    <div class="mdv-app-bar__surface">
      <div class="mdv-app-bar__row">
        <div v-if="slots.leading" ref="leading" class="mdv-app-bar__leading">
          <slot name="leading" v-bind="slotState" />
        </div>
        <div v-if="slots.actions" ref="actions" class="mdv-app-bar__actions">
          <slot name="actions" v-bind="slotState" />
        </div>
      </div>
      <div ref="content" class="mdv-app-bar__content">
        <component :is="search.content" v-if="search" />
        <div v-if="slots.image && flexible" ref="image" class="mdv-app-bar__image">
          <slot name="image" v-bind="slotState" />
        </div>
        <component
          :is="`h${props.headingLevel}`"
          v-if="!search && hasTitle()"
          ref="titleElement"
          class="mdv-app-bar__title"
          :aria-label="
            props.collapsedTitle !== undefined && !slots.title
              ? props.title || props.collapsedTitle
              : undefined
          "
        >
          <slot name="title" v-bind="slotState">
            <span class="mdv-app-bar__full-title">{{ props.title ?? props.collapsedTitle }}</span>
            <span
              v-if="props.collapsedTitle !== undefined"
              class="mdv-app-bar__compact-title"
              aria-hidden="true"
              >{{ props.collapsedTitle }}</span
            >
          </slot>
        </component>
        <div v-if="hasSubtitle()" class="mdv-app-bar__subtitle">
          <slot name="subtitle" v-bind="slotState">{{ props.subtitle }}</slot>
        </div>
      </div>
    </div>
  </header>
</template>
