<script setup lang="ts" generic="T extends object = MdvCarouselItem">
/* Gesture/scroll architecture adapted from MCarousel.vue, Copyright (c) 2026 Fadel, MIT.
 * Source: https://github.com/SrWither/m3ui-vue/blob/main/src/components/MCarousel.vue
 * MDV changes: stable-key requests, native focus/navigation, reduced motion and lifecycle.
 * Full notice: ../../THIRD_PARTY_NOTICES.md.
 */
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
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { ComponentPublicInstance } from 'vue'
import MdvButton from './MdvButton.vue'
import CarouselMedia from './_MdvCarouselMedia.vue'
import { clampCarousel, createCarouselLayout, nearestCarouselIndex } from './carousel-layout'
import { createCarouselMotion } from './carousel-motion'
import type {
  MdvCarouselChangeReason,
  MdvCarouselChangeDetail,
  MdvCarouselControlsSlotProps,
  MdvCarouselExpose,
  MdvCarouselItem,
  MdvCarouselKey,
  MdvCarouselNavigateOptions,
  MdvCarouselProps,
  MdvCarouselSlots,
} from './carousel.types'

defineOptions({ name: 'MdvCarousel' })
const props = withDefaults(defineProps<MdvCarouselProps<T>>(), {
  userScrollEnabled: true,
  showControls: undefined,
})
const slots = defineSlots<MdvCarouselSlots<T>>()
const emit = defineEmits<{
  'update:modelValue': [key: MdvCarouselKey | null]
  change: [detail: MdvCarouselChangeDetail<T>]
  itemClick: [detail: { item: T; key: MdvCarouselKey; index: number; originalEvent: MouseEvent }]
}>()

const root = useTemplateRef<HTMLElement>('root')
const track = useTemplateRef<HTMLElement>('track')
const end = useTemplateRef<HTMLElement>('end')
const trackId = `mdv-carousel-${useId()}`
const endId = `${trackId}-end`
const variant = computed(() => props.variant ?? 'multi-browse')
const alignment = computed(() => props.alignment ?? (variant.value === 'hero' ? 'center' : 'start'))
const vertical = computed(() => variant.value === 'full-screen')
const uncontained = computed(() => variant.value === 'uncontained')
const labels = computed(() => props.labels ?? {})
const entries = computed(() => {
  const keys = new Set<MdvCarouselKey>()
  return props.items.map((item) => {
    const key =
      typeof props.itemKey === 'function'
        ? props.itemKey(item)
        : (item as Record<PropertyKey, unknown>)[props.itemKey ?? 'key']
    if (
      (typeof key !== 'string' && typeof key !== 'number') ||
      (typeof key === 'number' && !Number.isFinite(key)) ||
      keys.has(key)
    ) {
      throw new TypeError(
        'MdvCarousel: 每项必须具有唯一、有效的 string／number key；请设置 itemKey。',
      )
    }
    keys.add(key)
    return { item, key }
  })
})
const internalKey = ref<MdvCarouselKey | null>(entries.value[0]?.key ?? null)
const selectedKey = computed(() =>
  props.modelValue === undefined ? internalKey.value : props.modelValue,
)
const selectedIndex = computed(() =>
  entries.value.findIndex((entry) => entry.key === selectedKey.value),
)
const ready = ref(false)
const reducedMotion = ref(false)
const layout = shallowRef(
  createCarouselLayout({
    size: 0,
    crossSize: 0,
    count: 0,
    variant: 'multi-browse',
    alignment: 'start',
    gap: 8,
    reducedMotion: false,
  }),
)
const itemElements = new Map<MdvCarouselKey, HTMLElement>()
const labelWidths = new Map<MdvCarouselKey, number>()
const showControls = computed(() => props.showControls ?? !vertical.value)
const flingBehavior = computed(() => {
  if (vertical.value) return 'single-advance'
  const requested = props.flingBehavior
  if (requested && requested !== 'auto' && (requested !== 'no-snap' || uncontained.value))
    return requested
  return uncontained.value ? 'no-snap' : 'single-advance'
})
const heightStyle = computed(
  () =>
    ({
      ...(props.height === undefined
        ? {}
        : {
            '--mdv-carousel-height':
              typeof props.height === 'number' ? `${Math.max(0, props.height)}px` : props.height,
          }),
      '--mdv-carousel-gap': `${Number.isFinite(props.gap) ? Math.max(0, props.gap!) : vertical.value ? 16 : 8}px`,
      '--mdv-carousel-item-size':
        props.itemSize !== undefined && Number.isFinite(props.itemSize) && props.itemSize > 0
          ? `${props.itemSize}px`
          : variant.value === 'hero'
            ? '100%'
            : '186px',
    }) as Record<string, string>,
)
const controls = computed<MdvCarouselControlsSlotProps>(() => ({
  key: selectedKey.value,
  index: selectedIndex.value,
  count: entries.value.length,
  canPrevious: selectedIndex.value > 0,
  canNext: entries.value.length > 0 && selectedIndex.value < entries.value.length - 1,
  previous: () => navigateIndex(selectedIndex.value - 1, 'control'),
  next: () => navigateIndex(selectedIndex.value + 1, 'control'),
}))

let view: (Window & typeof globalThis) | null = null
let motion: ReturnType<typeof createCarouselMotion> | undefined
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let media: MediaQueryList | undefined
let active = false
let rtl = false
let scroll = 0
let committedScroll = 0
let geometrySignature = ''
let frame: number | undefined
let wheelTimer: ReturnType<Window['setTimeout']> | undefined
let clickTimer: ReturnType<Window['setTimeout']> | undefined
let suppressClick = false
let wheelStart = 0
let requestId = 0
let pending: { key: MdvCarouselKey | null } | undefined
let movingFocus = false
let lastFocused: HTMLElement | undefined
let removedFocus: { element: HTMLElement; index: number } | undefined

function setItemElement(key: MdvCarouselKey, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) itemElements.set(key, element)
  else {
    itemElements.delete(key)
    labelWidths.delete(key)
  }
}
function metadata(item: T) {
  return item as Partial<MdvCarouselItem>
}
function indexOf(key: MdvCarouselKey) {
  return entries.value.findIndex((entry) => entry.key === key)
}
function validIndex(index: number) {
  return index >= 0 && index < entries.value.length
}
function clamped(value: number) {
  return clampCarousel(value, 0, layout.value.maxScroll)
}
function snap(index: number) {
  return layout.value.snaps[index] ?? 0
}
function round(value: number) {
  return `${Math.round(value * 1000) / 1000}px`
}
function fullyVisible(index: number) {
  const p = layout.value.placement(index, scroll)
  return (
    p.maskSize >= p.size - 0.5 &&
    p.offset + p.maskStart >= -0.5 &&
    p.offset + p.maskStart + p.maskSize <= layout.value.size + 0.5
  )
}
function syncGeometryClasses() {
  const classes = root.value?.classList
  if (!classes) return
  for (const [name, enabled] of [
    ['mdv-carousel--ready', ready.value],
    ['mdv-carousel--reduced', reducedMotion.value],
  ] as const) {
    if (classes.contains(name) !== enabled) classes.toggle(name, enabled)
  }
}
function measureLabelWidths() {
  for (const entry of entries.value) {
    const label = itemElements
      .get(entry.key)
      ?.querySelector<HTMLElement>('.mdv-carousel-media__label')
    if (label) labelWidths.set(entry.key, label.offsetWidth)
    else labelWidths.delete(entry.key)
  }
}
function paint() {
  syncGeometryClasses()
  if (!active || !ready.value || !track.value) return
  const focalIndex = nearestCarouselIndex(layout.value, scroll, Math.max(0, selectedIndex.value))
  entries.value.forEach((entry, index) => {
    const element = itemElements.get(entry.key)
    if (!element) return
    const p = layout.value.placement(index, scroll)
    const start = p.offset + p.maskStart
    const visible = p.maskSize > 0 && start < layout.value.size && start + p.maskSize > 0
    const focused = element.contains(element.ownerDocument.activeElement)
    const physicalOffset = !vertical.value && rtl ? layout.value.size - p.offset - p.size : p.offset
    element.style.width = vertical.value ? '100%' : round(p.size)
    element.style.height = vertical.value ? round(p.size) : '100%'
    element.style.transform = vertical.value
      ? `translate3d(0, ${round(physicalOffset)}, 0)`
      : `translate3d(${round(physicalOffset)}, 0, 0)`
    const maskEnd = Math.max(0, p.size - p.maskStart - p.maskSize)
    const maskLeft = rtl ? maskEnd : p.maskStart
    const maskRight = rtl ? p.maskStart : maskEnd
    element.style.clipPath = vertical.value
      ? `inset(${round(p.maskStart)} 0 ${round(maskEnd)} 0 round var(--mdv-carousel-radius))`
      : `inset(0 ${round(maskRight)} 0 ${round(maskLeft)} round var(--mdv-carousel-radius))`
    element.style.zIndex = String(entries.value.length - Math.abs(index - focalIndex))
    element.style.setProperty('--mdv-carousel-mask-start', round(p.maskStart))
    element.style.setProperty('--mdv-carousel-mask-size', round(p.maskSize))
    const labelWidth = labelWidths.get(entry.key) ?? 0
    element.style.setProperty(
      '--mdv-carousel-label-opacity',
      String(
        labelWidth > 0
          ? clampCarousel((labelWidth - layout.value.maxItemSize + p.maskSize) / labelWidth, 0, 1)
          : 1,
      ),
    )
    element.style.visibility = visible || focused ? '' : 'hidden'
    element.inert = !visible && !focused
    if (visible || focused) element.removeAttribute('aria-hidden')
    else element.setAttribute('aria-hidden', 'true')
  })
}
function schedulePaint() {
  if (!active || frame !== undefined) return
  if (!view?.requestAnimationFrame) {
    paint()
    return
  }
  frame = view.requestAnimationFrame(() => {
    frame = undefined
    paint()
  })
}
function writeScroll(value: number) {
  scroll = clamped(value)
  paint()
}
function cancelWheel() {
  if (wheelTimer !== undefined) view?.clearTimeout(wheelTimer)
  wheelTimer = undefined
}
function cancelNavigation() {
  requestId++
  pending = undefined
  motion?.stop()
  cancelWheel()
}
function measure() {
  if (!active || !track.value || !view) return
  // 几何更新不重绘内容插槽，避免覆写控件的 DOM 草稿；hydration 初始化由控件自身负责。
  syncGeometryClasses()
  const bounds = track.value.getBoundingClientRect()
  const width = track.value.clientWidth || bounds.width
  const height = track.value.clientHeight || bounds.height
  const size = vertical.value ? height : width
  const crossSize = vertical.value ? width : height
  rtl = view.getComputedStyle(track.value).direction === 'rtl'
  measureLabelWidths()
  const ratios = entries.value.map((entry) => metadata(entry.item).aspectRatio)
  const signature = JSON.stringify([
    size,
    crossSize,
    variant.value,
    alignment.value,
    props.itemSize,
    props.gap,
    reducedMotion.value,
    entries.value.length,
    ratios,
    rtl,
  ])
  if (signature === geometrySignature) {
    paint()
    return
  }
  geometrySignature = signature
  cancelNavigation()
  endPress()
  layout.value = createCarouselLayout({
    size,
    crossSize,
    count: entries.value.length,
    variant: variant.value,
    alignment: alignment.value,
    itemSize: props.itemSize,
    gap: props.gap ?? (vertical.value ? 16 : 8),
    reducedMotion: reducedMotion.value,
    ratios,
  })
  ready.value = size > 0 && crossSize > 0
  scroll = snap(Math.max(0, selectedIndex.value))
  committedScroll = scroll
  paint()
}
function focusItem(index: number, options?: FocusOptions) {
  const entry = entries.value[index]
  const element = entry && itemElements.get(entry.key)
  if (!element) return
  const target =
    Array.from(element.querySelectorAll<HTMLElement>(focusable)).find(
      (candidate) =>
        candidate.tabIndex >= 0 &&
        !candidate.closest('[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"]') &&
        candidate.getAttribute('type') !== 'hidden',
    ) ?? element
  movingFocus = true
  target.focus({ preventScroll: true, ...options })
  lastFocused = target
  movingFocus = false
}
function moveTo(offset: number, animate: boolean, done: () => void = () => {}) {
  if (!animate || reducedMotion.value || !motion) {
    motion?.stop()
    writeScroll(offset)
    done()
  } else motion.springTo(offset, done)
}
function protectFocus(index: number) {
  const focused = root.value?.ownerDocument.activeElement
  if (!focused || !track.value?.contains(focused)) return
  const current = entries.value.findIndex((entry) => itemElements.get(entry.key)?.contains(focused))
  if (current >= 0 && !fullyVisible(current)) focusItem(index)
}
async function accept(
  index: number,
  reason: MdvCarouselChangeReason,
  offset: number,
  options: MdvCarouselNavigateOptions = {},
  alreadyMoved = false,
) {
  if (!active || !validIndex(index)) return false
  const entry = entries.value[index]!
  const id = ++requestId
  const previousKey = selectedKey.value
  const previousFocus = lastFocused
  pending = { key: entry.key }
  if (previousKey !== entry.key) {
    emit('update:modelValue', entry.key)
    if (props.modelValue === undefined) internalKey.value = entry.key
  }
  await nextTick()
  if (!active || requestId !== id) return false
  pending = undefined
  const accepted = selectedKey.value === entry.key && indexOf(entry.key) >= 0
  if (!accepted) {
    moveTo(committedScroll, !options.focus)
    if (options.focus) {
      writeScroll(committedScroll)
      if (previousFocus?.isConnected && track.value?.contains(previousFocus)) {
        movingFocus = true
        previousFocus.focus({ preventScroll: true })
        movingFocus = false
      } else focusItem(Math.max(0, selectedIndex.value))
    }
    return false
  }
  const actualIndex = indexOf(entry.key)
  committedScroll = clamped(offset)
  if (!alreadyMoved || options.focus)
    moveTo(offset, options.focus ? false : options.animate !== false, () =>
      protectFocus(actualIndex),
    )
  else protectFocus(actualIndex)
  if (options.focus) focusItem(actualIndex)
  if (previousKey !== entry.key)
    emit('change', { key: entry.key, index: actualIndex, item: entry.item, reason })
  return true
}
function navigateIndex(
  index: number,
  reason: MdvCarouselChangeReason,
  options: MdvCarouselNavigateOptions = {},
) {
  if (!validIndex(index)) return Promise.resolve(false)
  motion?.stop()
  endPress()
  cancelWheel()
  return accept(index, reason, snap(index), options)
}
function scrollTo(key: MdvCarouselKey, options?: MdvCarouselNavigateOptions) {
  return navigateIndex(indexOf(key), 'programmatic', options)
}
function next(options?: MdvCarouselNavigateOptions) {
  return navigateIndex(selectedIndex.value + 1, 'programmatic', options)
}
function prev(options?: MdvCarouselNavigateOptions) {
  return navigateIndex(selectedIndex.value - 1, 'programmatic', options)
}
function settle(reason: 'drag' | 'wheel', startIndex: number, velocity = 0) {
  const currentMotion = motion
  const preferred = Math.max(0, selectedIndex.value)
  if (flingBehavior.value === 'no-snap') {
    const done = () => {
      void accept(nearestCarouselIndex(layout.value, scroll, preferred), reason, scroll, {}, true)
    }
    if (reducedMotion.value || !currentMotion) done()
    else currentMotion.coast(velocity, done)
    return
  }
  let index = nearestCarouselIndex(layout.value, scroll, preferred)
  if (flingBehavior.value === 'multi-browse')
    index = nearestCarouselIndex(layout.value, clamped(scroll + velocity / 4), index)
  else if (Math.abs(velocity) >= 400) {
    // 一次快甩至多推进一项；低速长拖动仍按实际距离停靠。
    index = Math.round(clampCarousel(startIndex + Math.sign(velocity), 0, entries.value.length - 1))
  }
  const target = snap(index)
  const done = () => {
    void accept(index, reason, target, {}, true)
  }
  if (reducedMotion.value || !currentMotion) {
    writeScroll(target)
    done()
  } else currentMotion.springTo(target, done, velocity)
}

interface Press {
  id: number
  x: number
  y: number
  base: number
  startScroll: number
  startIndex: number
  slop: number
  dragging: boolean
  samples: { time: number; position: number }[]
  userSelect: string
  priority: string
}
let press: Press | undefined
function onPointerDown(event: PointerEvent) {
  if (
    !active ||
    !ready.value ||
    props.userScrollEnabled === false ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.isPrimary === false ||
    press
  )
    return
  const target = event.target as Element
  if (
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], video, audio, [data-mdv-carousel-no-drag]',
    )
  )
    return
  cancelNavigation()
  suppressClick = false
  press = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    base: 0,
    startScroll: scroll,
    startIndex: Math.max(0, selectedIndex.value),
    slop: event.pointerType === 'touch' ? 8 : 4,
    dragging: false,
    samples: [],
    userSelect: track.value?.style.getPropertyValue('user-select') ?? '',
    priority: track.value?.style.getPropertyPriority('user-select') ?? '',
  }
  view?.addEventListener('pointermove', onPointerMove, { passive: false })
  view?.addEventListener('pointerup', onPointerUp)
  view?.addEventListener('pointercancel', onPointerCancel)
  view?.addEventListener('blur', cancelPress)
}
function onPointerMove(event: PointerEvent) {
  const current = press
  if (!current || event.pointerId !== current.id || !view) return
  const main = vertical.value ? event.clientY - current.y : event.clientX - current.x
  const cross = vertical.value ? event.clientX - current.x : event.clientY - current.y
  if (!current.dragging) {
    if (Math.abs(cross) > current.slop && Math.abs(cross) > Math.abs(main)) {
      endPress()
      return
    }
    if (Math.abs(main) <= current.slop) return
    current.dragging = true
    current.base = main
    track.value?.style.setProperty('user-select', 'none')
    track.value?.setAttribute('data-dragging', '')
    try {
      track.value?.setPointerCapture(event.pointerId)
    } catch {
      /* 非捕获平台仍通过窗口监听完成清理。 */
    }
    current.samples.push({ time: view.performance.now(), position: scroll })
  }
  event.preventDefault()
  const sign = !vertical.value && rtl ? 1 : -1
  scroll = clamped(current.startScroll + sign * (main - current.base))
  const time = view.performance.now()
  current.samples.push({ time, position: scroll })
  while (current.samples.length > 2 && time - current.samples[0]!.time > 100)
    current.samples.shift()
  schedulePaint()
}
function endPress() {
  const current = press
  press = undefined
  view?.removeEventListener('pointermove', onPointerMove)
  view?.removeEventListener('pointerup', onPointerUp)
  view?.removeEventListener('pointercancel', onPointerCancel)
  view?.removeEventListener('blur', cancelPress)
  track.value?.removeAttribute('data-dragging')
  if (!current) return
  if (current.dragging) {
    if (current.userSelect)
      track.value?.style.setProperty('user-select', current.userSelect, current.priority)
    else track.value?.style.removeProperty('user-select')
  }
  try {
    if (track.value?.hasPointerCapture(current.id)) track.value.releasePointerCapture(current.id)
  } catch {
    /* 捕获可能已由浏览器释放。 */
  }
}
function cancelPress() {
  if (!press) return
  const offset = press.startScroll
  endPress()
  motion?.stop()
  writeScroll(offset)
}
function onPointerCancel(event: PointerEvent) {
  if (press?.id === event.pointerId) cancelPress()
}
function onLostCapture(event: PointerEvent) {
  if (press?.id === event.pointerId) cancelPress()
}
function onPointerUp(event: PointerEvent) {
  const current = press
  if (!current || event.pointerId !== current.id) return
  endPress()
  if (!current.dragging) {
    settle('drag', current.startIndex)
    return
  }
  suppressClick = true
  if (clickTimer !== undefined) view?.clearTimeout(clickTimer)
  clickTimer = view?.setTimeout(() => {
    suppressClick = false
    clickTimer = undefined
  }, 300)
  const first = current.samples[0]
  const last = current.samples[current.samples.length - 1]
  const velocity =
    first && last && last.time - first.time >= 1 && (view?.performance.now() ?? 0) - last.time < 80
      ? ((last.position - first.position) / (last.time - first.time)) * 1000
      : 0
  settle('drag', current.startIndex, velocity)
}
function onClickCapture(event: MouseEvent) {
  if (suppressClick && event.detail !== 0) {
    event.preventDefault()
    event.stopPropagation()
    suppressClick = false
  }
}
function onDragStart(event: DragEvent) {
  if (
    (event.target as Element).closest(
      'input, textarea, select, [contenteditable], video, audio, [data-mdv-carousel-no-drag]',
    )
  )
    return
  event.preventDefault()
}
function onItemClick(key: MdvCarouselKey, event: MouseEvent) {
  const index = indexOf(key)
  const entry = entries.value[index]
  if (!entry || event.defaultPrevented || metadata(entry.item).disabled) return
  if (slots.item) {
    if (
      !(event.target as Element).closest(
        'button, a, input, select, textarea, [contenteditable], [role="button"], [role="slider"]',
      ) &&
      !fullyVisible(index)
    )
      void navigateIndex(index, 'item')
    return
  }
  emit('itemClick', { item: entry.item, key, index, originalEvent: event })
  if (!event.defaultPrevented && (key !== selectedKey.value || !fullyVisible(index)))
    void navigateIndex(index, 'item')
}
function onWheel(event: WheelEvent) {
  if (
    !active ||
    !ready.value ||
    props.userScrollEnabled === false ||
    event.defaultPrevented ||
    event.ctrlKey ||
    press
  )
    return
  const target = event.target as Element
  if (
    target.closest(
      'input, textarea, select, [contenteditable], [role="slider"], video, audio, [data-mdv-carousel-no-drag]',
    )
  )
    return
  let delta = vertical.value
    ? event.deltaY
    : Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.shiftKey
        ? event.deltaY
        : 0
  if (!vertical.value && rtl) delta = -delta
  if (event.deltaMode === 1) delta *= 16
  if (event.deltaMode === 2) delta *= layout.value.size
  if (!delta || clamped(scroll + delta) === scroll) return
  event.preventDefault()
  if (wheelTimer === undefined) {
    cancelNavigation()
    wheelStart = Math.max(0, selectedIndex.value)
  }
  motion?.stop()
  scroll = clamped(scroll + delta)
  schedulePaint()
  cancelWheel()
  wheelTimer = view?.setTimeout(() => {
    wheelTimer = undefined
    settle('wheel', wheelStart)
  }, 120)
}
const focusable =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  const element = event.target as HTMLElement
  if (
    event.key !== 'Tab' &&
    element.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="menu"], [role="listbox"], [data-mdv-carousel-no-drag]',
    )
  )
    return
  const index = entries.value.findIndex((entry) => itemElements.get(entry.key)?.contains(element))
  if (index < 0) return
  if (event.key === 'Tab') {
    const item = itemElements.get(entries.value[index]!.key)!
    const targets = Array.from(item.querySelectorAll<HTMLElement>(focusable)).filter(
      (target) =>
        target.tabIndex >= 0 &&
        target.getAttribute('type') !== 'hidden' &&
        !target.closest('[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"]'),
    )
    const edge = event.shiftKey ? targets[0] : targets[targets.length - 1]
    if (targets.length && element !== edge) return
    const nextIndex = index + (event.shiftKey ? -1 : 1)
    if (!validIndex(nextIndex)) return
    event.preventDefault()
    void navigateIndex(nextIndex, 'keyboard', { focus: true })
    return
  }
  const forward = vertical.value ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
  const backward = vertical.value ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
  const nextIndex =
    event.key === forward
      ? index + 1
      : event.key === backward
        ? index - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? entries.value.length - 1
            : -1
  if (nextIndex < 0) return
  event.preventDefault()
  if (validIndex(nextIndex)) void navigateIndex(nextIndex, 'keyboard', { focus: true })
}
function onItemFocus(key: MdvCarouselKey, event: FocusEvent) {
  if (movingFocus || press || !ready.value) return
  const index = indexOf(key)
  if (fullyVisible(index)) {
    lastFocused = event.target as HTMLElement
    return
  }
  const target = event.target as HTMLElement
  void navigateIndex(index, 'keyboard', { focus: true }).then((accepted) => {
    if (accepted && target.isConnected && itemElements.get(key)?.contains(target)) {
      movingFocus = true
      target.focus({ preventScroll: true })
      lastFocused = target
      movingFocus = false
    }
  })
}
function skip(event: MouseEvent) {
  event.preventDefault()
  end.value?.focus({ preventScroll: true })
}

watch(
  () => props.modelValue,
  (key, previous) => {
    if (key === undefined && previous !== undefined)
      internalKey.value =
        previous !== null && indexOf(previous) >= 0 ? previous : (entries.value[0]?.key ?? null)
  },
)
watch(selectedKey, (key) => {
  if (pending?.key === key || !active) return
  cancelNavigation()
  endPress()
  const index = selectedIndex.value
  committedScroll = snap(Math.max(0, index))
  moveTo(committedScroll, true, () => protectFocus(Math.max(0, index)))
})
watch(
  () => entries.value.map((entry) => entry.key),
  (keys, previous) => {
    if (keys.length === previous.length && keys.every((key, index) => key === previous[index]))
      return
    const oldIndex = previous.indexOf(selectedKey.value as MdvCarouselKey)
    cancelNavigation()
    endPress()
    measure()
    scroll = snap(Math.max(0, selectedIndex.value))
    committedScroll = scroll
    paint()
    if (
      selectedKey.value === null &&
      props.modelValue === undefined &&
      keys.length &&
      !previous.length
    ) {
      void navigateIndex(0, 'items', { animate: false })
      return
    }
    if (
      selectedKey.value === null ||
      keys.includes(selectedKey.value as MdvCarouselKey) ||
      oldIndex < 0
    )
      return
    const index = Math.min(oldIndex, keys.length - 1)
    if (index >= 0) void navigateIndex(index, 'items', { animate: false })
    else {
      const id = ++requestId
      pending = { key: null }
      emit('update:modelValue', null)
      if (props.modelValue === undefined) internalKey.value = null
      void nextTick().then(() => {
        if (!active || requestId !== id) return
        pending = undefined
        if (selectedKey.value === null)
          emit('change', { key: null, index: -1, item: undefined, reason: 'items' })
      })
    }
  },
  { flush: 'post' },
)
watch(
  () => [
    props.variant,
    alignment.value,
    props.itemSize,
    props.gap,
    props.height,
    entries.value.map((entry) => metadata(entry.item).aspectRatio).join(','),
    entries.value.map((entry) => metadata(entry.item).label ?? '').join('\u0000'),
    reducedMotion.value,
  ],
  measure,
  { flush: 'post' },
)
watch(
  () => props.userScrollEnabled,
  (enabled) => {
    if (enabled === false) {
      cancelPress()
      cancelNavigation()
      writeScroll(committedScroll)
    }
  },
)
function onMediaChange() {
  reducedMotion.value = !!media?.matches
}
function start() {
  if (active || !root.value || !track.value) return
  view = root.value.ownerDocument.defaultView
  if (!view) return
  active = true
  motion = createCarouselMotion({
    view,
    read: () => scroll,
    write: writeScroll,
    max: () => layout.value.maxScroll,
  })
  media = view.matchMedia?.('(prefers-reduced-motion: reduce)')
  onMediaChange()
  media?.addEventListener('change', onMediaChange)
  track.value.addEventListener('wheel', onWheel, { passive: false })
  view.addEventListener('resize', measure)
  if (view.ResizeObserver) {
    resizeObserver = new view.ResizeObserver(measure)
    resizeObserver.observe(track.value)
  }
  if (view.MutationObserver) {
    mutationObserver = new view.MutationObserver(measure)
    // 继承的 dir／主题类变更需要重新测量；不监听逐帧写入的项目样式。
    for (let element: HTMLElement | null = root.value; element; element = element.parentElement)
      mutationObserver.observe(element, {
        attributes: true,
        attributeFilter: ['dir', 'class', 'style'],
      })
  }
  geometrySignature = ''
  measure()
}
function stop() {
  active = false
  cancelNavigation()
  endPress()
  if (frame !== undefined) view?.cancelAnimationFrame(frame)
  if (clickTimer !== undefined) view?.clearTimeout(clickTimer)
  frame = undefined
  clickTimer = undefined
  suppressClick = false
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  media?.removeEventListener('change', onMediaChange)
  track.value?.removeEventListener('wheel', onWheel)
  view?.removeEventListener('resize', measure)
  motion = undefined
}
onBeforeUpdate(() => {
  const element = root.value?.ownerDocument.activeElement as HTMLElement | null
  removedFocus = undefined
  if (!element) return
  for (const node of itemElements.values()) {
    if (node.contains(element)) {
      removedFocus = { element, index: Number(node.dataset.carouselIndex) }
      break
    }
  }
})
onUpdated(() => {
  measureLabelWidths()
  paint()
  const ownerDocument = root.value?.ownerDocument
  if (
    removedFocus &&
    ownerDocument &&
    (!removedFocus.element.isConnected ||
      removedFocus.element.matches(':disabled, [aria-disabled="true"]')) &&
    ownerDocument.activeElement === ownerDocument.body
  ) {
    const index = Math.max(
      0,
      selectedIndex.value >= 0
        ? selectedIndex.value
        : Math.min(removedFocus.index, entries.value.length - 1),
    )
    writeScroll(snap(index))
    focusItem(index)
  }
  removedFocus = undefined
})
onMounted(start)
onActivated(start)
onDeactivated(stop)
onBeforeUnmount(stop)
defineExpose<MdvCarouselExpose>({
  scrollTo,
  next,
  prev,
  focus: (options) => {
    cancelNavigation()
    endPress()
    const index = Math.max(0, selectedIndex.value)
    writeScroll(snap(index))
    committedScroll = scroll
    focusItem(index, options)
  },
  get element() {
    return root.value
  },
})
</script>

<template>
  <section
    ref="root"
    class="mdv-carousel"
    :class="{
      'mdv-carousel--vertical': vertical,
      'mdv-carousel--uncontained': uncontained,
    }"
    :style="heightStyle"
    role="region"
    :aria-label="labels.carousel || undefined"
    :aria-roledescription="labels.carousel || undefined"
    :data-variant="variant"
    :data-current-key="selectedKey ?? undefined"
  >
    <a
      v-if="entries.length && labels.skip"
      class="mdv-carousel__skip"
      :href="`#${endId}`"
      @click="skip"
      >{{ labels.skip }}</a
    >
    <header v-if="slots.header" class="mdv-carousel__header">
      <slot name="header" v-bind="controls" />
    </header>
    <div class="mdv-carousel__viewport">
      <div
        :id="trackId"
        ref="track"
        class="mdv-carousel__track"
        @pointerdown="onPointerDown"
        @lostpointercapture="onLostCapture"
        @click.capture="onClickCapture"
        @dragstart="onDragStart"
        @keydown="onKeydown"
      >
        <div
          v-for="(entry, index) in entries"
          :key="entry.key"
          :ref="(element) => setItemElement(entry.key, element)"
          class="mdv-carousel__item"
          role="group"
          :aria-roledescription="labels.slide || undefined"
          :aria-label="labels.item?.(index, entries.length) || undefined"
          :aria-disabled="metadata(entry.item).disabled || undefined"
          tabindex="-1"
          :data-carousel-index="index"
          :data-active="entry.key === selectedKey || undefined"
          @focusin="onItemFocus(entry.key, $event)"
          @click="onItemClick(entry.key, $event)"
        >
          <slot name="item" :item="entry.item" :index="index" :active="entry.key === selectedKey"
            ><CarouselMedia
              :item="metadata(entry.item)"
              :fallback-label="labels.item?.(index, entries.length)"
          /></slot>
        </div>
      </div>
      <div v-if="!entries.length" class="mdv-carousel__empty">
        <slot name="empty" :text="labels.empty">{{ labels.empty }}</slot>
      </div>
    </div>
    <div v-if="showControls && entries.length" class="mdv-carousel__controls">
      <slot name="controls" v-bind="controls">
        <MdvButton
          v-if="labels.previous"
          variant="text"
          :disabled="!controls.canPrevious"
          :aria-controls="trackId"
          @click="controls.previous()"
          >{{ labels.previous }}</MdvButton
        >
        <span class="mdv-carousel__position" aria-live="polite" aria-atomic="true"
          >{{ selectedIndex < 0 ? '—' : selectedIndex + 1 }} / {{ entries.length }}</span
        >
        <MdvButton
          v-if="labels.next"
          variant="text"
          :disabled="!controls.canNext"
          :aria-controls="trackId"
          @click="controls.next()"
          >{{ labels.next }}</MdvButton
        >
      </slot>
    </div>
    <span :id="endId" ref="end" class="mdv-carousel__end" tabindex="-1" />
  </section>
</template>
