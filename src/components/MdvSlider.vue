<script setup lang="ts">
import {
  computed,
  mergeProps,
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
import type { ObjectDirective, StyleValue, VNode } from 'vue'
import { resolveButtonColor } from './button-color'
import { createSliderScale } from './slider-value'
import type {
  MdvSliderColor,
  MdvSliderModelValue,
  MdvSliderOrientation,
  MdvSliderSize,
  MdvSliderThumb,
  MdvSliderVariant,
} from './slider.types'

defineOptions({ name: 'MdvSlider', inheritAttrs: false })
const slots = defineSlots<{
  default?(): VNode[]
  leading?(): VNode[]
  trailing?(): VNode[]
  'inset-icon'?(props: { value: number }): VNode[]
}>()
const model = defineModel<MdvSliderModelValue>()
const props = withDefaults(
  defineProps<{
    variant?: MdvSliderVariant
    min?: number
    max?: number
    step?: number
    centerValue?: number
    stops?: boolean
    size?: MdvSliderSize
    orientation?: MdvSliderOrientation
    valueIndicator?: boolean
    formatValue?: (value: number) => string
    label?: string
    supportingText?: string
    disabled?: boolean
    color?: MdvSliderColor
    startAriaLabel?: string
    endAriaLabel?: string
  }>(),
  {
    variant: 'standard',
    min: 0,
    max: 100,
    step: 1,
    centerValue: 0,
    stops: false,
    size: 'xs',
    orientation: 'horizontal',
    valueIndicator: false,
    label: '',
    supportingText: '',
    disabled: false,
    color: 'primary',
  },
)

const attrs = useAttrs()
const generatedId = `mdv-slider-${useId()}`
const labelId = `${generatedId}-label`
const descriptionId = `${generatedId}-description`
const surface = useTemplateRef<HTMLElement>('surface')
const rail = useTemplateRef<HTMLElement>('rail')
const inputs = new Map<number, HTMLInputElement>()
const scale = computed(() => createSliderScale(props.min, props.max, props.step))
const range = computed(() => props.variant === 'range')
const vertical = computed(() => props.orientation === 'vertical')
const center = computed(() =>
  Math.max(
    scale.value.min,
    Math.min(scale.value.max, Number.isFinite(props.centerValue) ? props.centerValue : 0),
  ),
)
const hasLabel = computed(() => !!(props.label || slots.default))
const values = computed(() => normalize(model.value))
const focused = ref<number | null>(null)
const keyboardFocus = ref<number | null>(null)
const dragging = ref<number | null>(null)
const pointerRatio = ref<number | null>(null)
const pointerIndicator = ref(false)
const axisLength = ref(240)
const spaceHeld = ref(false)
const valueShift = ref(0)
const initialModel = copyValue(normalize(model.value))
const preHydration = new Map<number, number>()
let pending: MdvSliderModelValue | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined
let indicatorTimer: ReturnType<typeof setTimeout> | undefined
let observer: ResizeObserver | undefined
let indicatorElement: HTMLElement | undefined
let resetForm: HTMLFormElement | null = null
let disposed = false
let focusingFromPointer = false
let gesture:
  | {
      id: number
      index: number | null
      startRatio: number
      startPosition: number
      offset: number
      initial: MdvSliderModelValue
    }
  | undefined

function normalize(value: MdvSliderModelValue | undefined): MdvSliderModelValue {
  const s = scale.value
  if (range.value) {
    const pair = Array.isArray(value) ? value : [s.min, s.max]
    const first = s.snap(pair[0] ?? s.min)
    const second = s.snap(pair[1] ?? s.max)
    return [Math.min(first, second), Math.max(first, second)]
  }
  return s.snap(
    typeof value === 'number' ? value : props.variant === 'centered' ? center.value : s.min,
  )
}

function copyValue(value: MdvSliderModelValue): MdvSliderModelValue {
  return Array.isArray(value) ? [value[0], value[1]] : value
}

function equal(a: MdvSliderModelValue, b: MdvSliderModelValue) {
  return Array.isArray(a) && Array.isArray(b) ? a[0] === b[0] && a[1] === b[1] : a === b
}

const points = computed(() => (Array.isArray(values.value) ? values.value : [values.value]))
const ratios = computed(() =>
  points.value.map((value, index) => {
    if (dragging.value !== index || pointerRatio.value === null || props.stops)
      return scale.value.ratio(value)
    const low = range.value && index === 1 ? scale.value.ratio(points.value[0]!) : 0
    const high = range.value && index === 0 ? scale.value.ratio(points.value[1]!) : 1
    return Math.max(low, Math.min(high, pointerRatio.value))
  }),
)
const colors = computed(() => {
  const color = resolveButtonColor(props.color)
  return color
    ? {
        '--mdv-slider-color': color['--mdv-button-color'],
        '--mdv-slider-on-color': color['--mdv-button-on-color'],
      }
    : undefined
})
const iconSize = computed(() => (props.size === 'xl' ? 32 : 24))
const canInset = computed(
  () =>
    props.variant === 'standard' && ['m', 'l', 'xl'].includes(props.size) && !!slots['inset-icon'],
)
const inset = computed(() => {
  if (!canInset.value) return null
  const half = iconSize.value / 2
  const handle = (ratios.value[0] ?? 0) * axisLength.value
  const base = 12 + half
  return base + half <= axisLength.value
    ? { active: handle > base, occluded: Math.abs(handle - base) < half + 8, position: base }
    : null
})

function isDisabled(index = 0) {
  return props.disabled || !!inputs.get(index)?.matches(':disabled')
}

function controlId(index: number) {
  const id = typeof attrs.id === 'string' && attrs.id ? attrs.id : generatedId
  return index === 0 ? id : `${id}-end`
}

function joinIds(...ids: unknown[]) {
  return (
    [
      ...new Set(
        ids.flatMap((id) => (typeof id === 'string' ? id.split(/\s+/).filter(Boolean) : [])),
      ),
    ].join(' ') || undefined
  )
}

function rootAttrs() {
  return {
    class: attrs.class,
    style: [colors.value, attrs.style as StyleValue],
    dir: typeof attrs.dir === 'string' ? attrs.dir : undefined,
    lang: typeof attrs.lang === 'string' ? attrs.lang : undefined,
  }
}

function controlAttrs(index: number) {
  const result = { ...attrs }
  for (const key of [
    'class',
    'style',
    'dir',
    'lang',
    'type',
    'role',
    'value',
    'defaultValue',
    'defaultvalue',
    'required',
    'readonly',
    'aria-valuenow',
    'aria-valuemin',
    'aria-valuemax',
  ])
    delete result[key]
  const explicitName = index === 0 ? props.startAriaLabel : props.endAriaLabel
  result.id = controlId(index)
  result['aria-orientation'] = props.orientation
  result['aria-valuetext'] = props.formatValue
    ? format(points.value[index]!)
    : attrs['aria-valuetext']
  result['aria-describedby'] = joinIds(
    attrs['aria-describedby'],
    props.supportingText ? descriptionId : undefined,
  )
  if (range.value) {
    result['aria-label'] =
      explicitName || (typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : undefined)
    result['aria-labelledby'] = !result['aria-label']
      ? joinIds(attrs['aria-labelledby'], hasLabel.value ? labelId : undefined)
      : undefined
  } else {
    result['aria-labelledby'] =
      attrs['aria-labelledby'] || (!attrs['aria-label'] && hasLabel.value ? labelId : undefined)
  }
  return mergeProps(
    {
      onInput: (event: Event) => handleNative(event, index),
      onChange: (event: Event) => handleNative(event, index),
      onFocus: () => {
        focused.value = index
        keyboardFocus.value = focusingFromPointer ? null : index
      },
      onBlur: () => {
        focused.value = null
        keyboardFocus.value = null
        spaceHeld.value = false
      },
    },
    result,
    {
      onKeydown: (event: KeyboardEvent) => handleKeydown(event, index),
      onKeyup: (event: KeyboardEvent) => {
        if (event.code === 'Space' || event.key === ' ') spaceHeld.value = false
      },
    },
  )
}

function bounds(index: number) {
  return {
    min: range.value && index === 1 ? points.value[0]! : scale.value.min,
    max: range.value && index === 0 ? points.value[1]! : scale.value.max,
  }
}

function format(value: number) {
  return props.formatValue?.(value) ?? String(value)
}

function syncControls() {
  for (const [index, input] of inputs) input.value = String(points.value[index] ?? scale.value.min)
}

function scheduleSync() {
  if (syncTimer !== undefined) return
  // 一次原生激活的 input/change 共用暂存值；整个任务结束后恢复父级受控值。
  syncTimer = setTimeout(() => {
    syncTimer = undefined
    void nextTick(() => {
      pending = undefined
      if (!disposed) syncControls()
    })
  }, 0)
}

function handleNative(event: Event, index: number) {
  if (isDisabled(index)) {
    syncControls()
    return
  }
  const current = normalize(pending ?? values.value)
  const pair = Array.isArray(current) ? current : [current]
  let value = scale.value.snap((event.target as HTMLInputElement).valueAsNumber)
  if (range.value) value = index === 0 ? Math.min(value, pair[1]!) : Math.max(value, pair[0]!)
  const next: MdvSliderModelValue = range.value
    ? index === 0
      ? [value, pair[1]!]
      : [pair[0]!, value]
    : value
  ;(event.target as HTMLInputElement).value = String(value)
  if (!equal(next, current)) {
    pending = next
    model.value = copyValue(next)
  }
  scheduleSync()
}

function dispatchValue(index: number, value: number, commit = false) {
  const input = inputs.get(index)
  if (!input || isDisabled(index)) return
  const b = bounds(index)
  const next = Math.max(b.min, Math.min(b.max, scale.value.snap(value)))
  const current = normalize(pending ?? values.value)
  const old = Array.isArray(current) ? current[index] : current
  if (next === old) return
  input.value = String(next)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  if (commit) input.dispatchEvent(new Event('change', { bubbles: true }))
}

function rtl() {
  const element = surface.value
  if (!element) return false
  const direction = getComputedStyle(element).direction
  return direction ? direction === 'rtl' : element.closest('[dir]')?.getAttribute('dir') === 'rtl'
}

function eventRatio(event: PointerEvent) {
  const rect = rail.value?.getBoundingClientRect()
  if (!rect) return 0
  const length = vertical.value ? rect.height : rect.width
  if (!length) return 0
  axisLength.value = length
  const ratio = vertical.value
    ? (rect.bottom - event.clientY) / length
    : (event.clientX - rect.left) / length
  // 保留轨道外坐标；扣除抓取偏移后再限界，才能从手柄任意位置拖到两端。
  return !vertical.value && rtl() ? 1 - ratio : ratio
}

function revealPointerIndicator() {
  clearTimeout(indicatorTimer)
  indicatorTimer = undefined
  pointerIndicator.value = true
}

function focusFromPointer(index: number) {
  // 保留原生焦点以支持后续方向键，但鼠标松开后不保留键盘焦点外观。
  keyboardFocus.value = null
  focusingFromPointer = true
  inputs.get(index)?.focus({ preventScroll: true })
  focusingFromPointer = false
}

function handlePointerDown(event: PointerEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.isPrimary === false ||
    isDisabled() ||
    gesture
  )
    return
  event.preventDefault()
  const position = eventRatio(event)
  const ratio = Math.max(0, Math.min(1, position))
  const current = points.value
  const overlapping =
    range.value &&
    current[0] === current[1] &&
    Math.abs(ratio - ratios.value[0]!) * axisLength.value < 24
  const targetThumb =
    event.target instanceof Element ? event.target.closest<HTMLElement>('.mdv-slider__thumb') : null
  const targetIndex = targetThumb ? Number(targetThumb.dataset.index) : undefined
  const index =
    targetIndex ??
    (range.value && Math.abs(ratio - ratios.value[1]!) < Math.abs(ratio - ratios.value[0]!) ? 1 : 0)
  gesture = {
    id: event.pointerId,
    index: overlapping ? null : index,
    startRatio: ratio,
    startPosition: vertical.value ? event.clientY : event.clientX,
    offset: !overlapping && targetThumb ? position - ratios.value[index]! : 0,
    initial: copyValue(values.value),
  }
  dragging.value = index
  focusFromPointer(index)
  if (props.stops && props.valueIndicator)
    indicatorTimer = setTimeout(() => {
      indicatorTimer = undefined
      if (gesture && !isDisabled()) pointerIndicator.value = true
    }, 200)
  if (!overlapping) movePointer(event)
  surface.value?.setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', movePointer)
  window.addEventListener('pointerup', finishPointer)
  window.addEventListener('pointercancel', cancelPointer)
}

function movePointer(event: PointerEvent) {
  if (!gesture || event.pointerId !== gesture.id) return
  if (isDisabled()) {
    stopPointer(false)
    return
  }
  const position = vertical.value ? event.clientY : event.clientX
  if (!pointerIndicator.value && Math.abs(position - gesture.startPosition) >= 4)
    revealPointerIndicator()
  const ratio = Math.max(0, Math.min(1, eventRatio(event) - gesture.offset))
  if (gesture.index === null) {
    if (Math.abs(ratio - gesture.startRatio) * axisLength.value < 2) return
    gesture.index = ratio < gesture.startRatio ? 0 : 1
    focusFromPointer(gesture.index)
  }
  dragging.value = gesture.index
  pointerRatio.value = ratio
  dispatchValue(gesture.index, scale.value.fromRatio(ratio))
}

function finishPointer(event: PointerEvent) {
  if (event.pointerId !== gesture?.id) return
  movePointer(event)
  stopPointer(true)
}

function cancelPointer(event: PointerEvent) {
  if (event.pointerId === gesture?.id) stopPointer(false)
}

function stopPointer(commit: boolean) {
  const previous = gesture
  gesture = undefined
  dragging.value = null
  pointerRatio.value = null
  pointerIndicator.value = false
  clearTimeout(indicatorTimer)
  indicatorTimer = undefined
  window.removeEventListener('pointermove', movePointer)
  window.removeEventListener('pointerup', finishPointer)
  window.removeEventListener('pointercancel', cancelPointer)
  if (previous && surface.value?.hasPointerCapture?.(previous.id))
    surface.value.releasePointerCapture(previous.id)
  if (
    commit &&
    previous?.index !== null &&
    previous?.index !== undefined &&
    !isDisabled(previous.index) &&
    !equal(previous.initial, normalize(pending ?? values.value))
  ) {
    inputs.get(previous.index)?.dispatchEvent(new Event('change', { bubbles: true }))
  }
  scheduleSync()
}

function handleKeydown(event: KeyboardEvent, index: number) {
  if (event.defaultPrevented || isDisabled(index)) return
  if (event.key === ' ') {
    event.preventDefault()
    keyboardFocus.value = index
    spaceHeld.value = true
    return
  }
  const current = normalize(pending ?? values.value)
  const value = Array.isArray(current) ? current[index]! : current
  const count = spaceHeld.value || event.key === 'PageUp' || event.key === 'PageDown' ? 10 : 1
  const directions: Record<string, number> = {
    ArrowRight: !vertical.value && rtl() ? -1 : 1,
    ArrowLeft: !vertical.value && rtl() ? 1 : -1,
    ArrowUp: 1,
    ArrowDown: -1,
    PageUp: 1,
    PageDown: -1,
  }
  let next: number
  if (event.key === 'Home') next = bounds(index).min
  else if (event.key === 'End') next = bounds(index).max
  else if (directions[event.key]) next = scale.value.next(value, directions[event.key]!, count)
  else return
  event.preventDefault()
  if (focused.value === index) keyboardFocus.value = index
  dispatchValue(index, next, true)
}

const segments = computed(() => {
  const handles = ratios.value
  const gapAt = (position: number) =>
    Math.max(
      0,
      ...handles.flatMap((handle, index) =>
        handle === position
          ? [keyboardFocus.value === index || dragging.value === index ? 7 : 8]
          : [],
      ),
    )
  const low = range.value
    ? handles[0]!
    : props.variant === 'centered'
      ? Math.min(scale.value.ratio(center.value), handles[0]!)
      : 0
  const high = range.value
    ? handles[1]!
    : props.variant === 'centered'
      ? Math.max(scale.value.ratio(center.value), handles[0]!)
      : handles[0]!
  // 零宽轨道仍保留原有节点与配色，端点和重合手柄不会打断位置过渡。
  const pieces =
    range.value || props.variant === 'centered'
      ? [
          { start: 0, end: low, active: false },
          { start: low, end: high, active: true },
          { start: high, end: 1, active: false },
        ]
      : [
          { start: 0, end: high, active: true },
          { start: high, end: 1, active: false },
        ]
  return pieces.map(({ start, end, active }) => {
    const startGap = gapAt(start)
    const endGap = gapAt(end)
    // 手柄缺口优先于轨道外端，避免在最小／最大值处突然套上大圆角。
    return {
      start,
      active,
      style: {
        '--segment-start': `calc(${start * 100}% + ${startGap}px)`,
        '--segment-size': `max(0px, calc(${(end - start) * 100}% - ${startGap + endGap}px))`,
        '--segment-start-radius': startGap
          ? '2px'
          : start === 0
            ? 'var(--mdv-slider-radius)'
            : '0px',
        '--segment-end-radius': endGap ? '2px' : end === 1 ? 'var(--mdv-slider-radius)' : '0px',
      },
    }
  })
})

const dots = computed(() => {
  const s = scale.value
  const candidates = [s.min, s.max]
  if (props.stops && s.span) {
    const count = Math.floor(s.span / s.step)
    const limit = Math.min(100, Math.max(1, Math.floor(axisLength.value / 12)))
    const stride = Math.max(1, Math.ceil(count / limit))
    for (let index = stride; index <= count; index += stride) {
      if (!Number.isFinite(index)) break
      const value = s.snap(s.min + index * s.step)
      if (value < s.max) candidates.push(value)
    }
  }
  return [...new Set(candidates)].flatMap((value) => {
    const ratio = s.ratio(value)
    const offset = ratio === 0 ? 8 : ratio === 1 ? -8 : 0
    const position = ratio * axisLength.value + offset
    if (ratios.value.some((handle) => Math.abs(handle * axisLength.value - position) < 12))
      return []
    if (inset.value && Math.abs(position - inset.value.position) < iconSize.value / 2 + 4) return []
    const active = range.value
      ? ratio > ratios.value[0]! && ratio < ratios.value[1]!
      : props.variant === 'centered'
        ? ratio > Math.min(ratios.value[0]!, s.ratio(center.value)) &&
          ratio < Math.max(ratios.value[0]!, s.ratio(center.value))
        : ratio < ratios.value[0]!
    if (!props.stops && active) return []
    return [{ value, active, position: `calc(${ratio * 100}% + ${offset}px)` }]
  })
})

function measure() {
  const rect = rail.value?.getBoundingClientRect()
  const length = rect ? (vertical.value ? rect.height : rect.width) : 0
  if (length > 0) axisLength.value = length
  measureIndicator()
}

function measureIndicator() {
  if (vertical.value || !indicatorElement || !rail.value) return
  const index = Number(indicatorElement.parentElement?.dataset.index ?? 0)
  const rect = rail.value.getBoundingClientRect()
  const width = indicatorElement.getBoundingClientRect().width
  const viewport = document.documentElement.clientWidth || window.innerWidth
  if (!rect.width || !width || !viewport) return
  const reversed = rtl()
  const desired = reversed
    ? rect.right - ratios.value[index]! * rect.width
    : rect.left + ratios.value[index]! * rect.width
  const actual = Math.max(width / 2 + 8, Math.min(viewport - width / 2 - 8, desired))
  valueShift.value = (actual - desired) * (reversed ? -1 : 1)
}

function resetFromForm(event: Event) {
  const form = event.currentTarget
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented || inputs.get(0)?.form !== form) return
    stopPointer(false)
    pending = undefined
    model.value = copyValue(normalize(initialModel))
    void nextTick(syncControls)
  })
}

function syncForm() {
  const nextForm = inputs.get(0)?.form ?? null
  if (nextForm === resetForm) return
  resetForm?.removeEventListener('reset', resetFromForm)
  resetForm = nextForm
  resetForm?.addEventListener('reset', resetFromForm)
}

const vNativeState: ObjectDirective<HTMLInputElement, number> = {
  created(element, binding) {
    // created 在 Vue 覆写原生 value 前执行，保留首屏可交互阶段的修改。
    const server = Number(element.getAttribute('value'))
    if (element.hasAttribute('value') && element.valueAsNumber !== server)
      preHydration.set(binding.value, element.valueAsNumber)
  },
  mounted(element, binding) {
    inputs.set(binding.value, element)
  },
  unmounted(element, binding) {
    if (inputs.get(binding.value) === element) inputs.delete(binding.value)
  },
}

const vIndicator: ObjectDirective<HTMLElement> = {
  mounted(element) {
    indicatorElement = element
    observer?.observe(element)
    measureIndicator()
  },
  updated: measureIndicator,
  unmounted(element) {
    observer?.unobserve(element)
    if (indicatorElement === element) indicatorElement = undefined
  },
}

watch(
  () => [props.variant, props.orientation, props.min, props.max, props.step],
  () => {
    if (gesture) stopPointer(false)
    void nextTick(() => {
      syncControls()
      measure()
    })
  },
)
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      stopPointer(false)
      focused.value = null
      keyboardFocus.value = null
      spaceHeld.value = false
    }
  },
)

if (import.meta.env.DEV) {
  watch(
    () => [
      props.min,
      props.max,
      props.step,
      props.centerValue,
      props.variant,
      props.size,
      props.color,
    ],
    () => {
      if (
        !Number.isFinite(props.min) ||
        !Number.isFinite(props.max) ||
        props.max < props.min ||
        !Number.isFinite(props.max - props.min) ||
        !Number.isFinite(props.step) ||
        props.step <= 0
      )
        console.warn(
          '[MDV] MdvSlider: provide finite min/max with max >= min and a positive finite step.',
        )
      if (
        props.variant === 'centered' &&
        (!Number.isFinite(props.centerValue) ||
          props.centerValue < props.min ||
          props.centerValue > props.max)
      )
        console.warn('[MDV] MdvSlider: centerValue must be within min/max.')
      if (slots['inset-icon'] && !canInset.value)
        console.warn('[MDV] MdvSlider: inset-icon requires standard variant and size m, l or xl.')
      if (!colors.value)
        console.warn(
          '[MDV] MdvSlider: unsupported color; use a theme color or a #RGB/#RRGGBB seed.',
        )
    },
    { immediate: true },
  )
}

onMounted(() => {
  if (preHydration.size) {
    const next = copyValue(values.value)
    for (const [index, value] of preHydration) {
      if (Array.isArray(next)) next[index] = value
      else model.value = scale.value.snap(value)
    }
    if (Array.isArray(next)) model.value = normalize(next)
    preHydration.clear()
  }
  for (const [index, input] of inputs)
    input.defaultValue = String(Array.isArray(initialModel) ? initialModel[index] : initialModel)
  syncControls()
  syncForm()
  measure()
  if (typeof ResizeObserver !== 'undefined' && rail.value) {
    observer = new ResizeObserver(measure)
    observer.observe(rail.value)
    if (indicatorElement) observer.observe(indicatorElement)
  }
})
onUpdated(() => {
  syncForm()
  if (pending === undefined) syncControls()
})
onActivated(() => {
  measure()
  syncForm()
})
onDeactivated(() => {
  stopPointer(false)
  focused.value = null
  keyboardFocus.value = null
  spaceHeld.value = false
})
onBeforeUnmount(() => {
  stopPointer(false)
  disposed = true
  clearTimeout(syncTimer)
  observer?.disconnect()
  resetForm?.removeEventListener('reset', resetFromForm)
})

defineExpose({
  focus(options?: FocusOptions, thumb: MdvSliderThumb = 'start') {
    inputs.get(thumb === 'end' && range.value ? 1 : 0)?.focus(options)
  },
  blur() {
    for (const input of inputs.values()) input.blur()
  },
})
</script>

<template>
  <div
    v-bind="rootAttrs()"
    class="mdv-slider"
    :class="[
      `mdv-slider--${props.size}`,
      { 'mdv-slider--vertical': vertical, 'mdv-slider--disabled': props.disabled },
    ]"
  >
    <label v-if="hasLabel" :id="labelId" :for="controlId(0)" class="mdv-slider__label"
      ><slot>{{ props.label }}</slot></label
    >
    <div class="mdv-slider__row">
      <div v-if="$slots.leading" class="mdv-slider__leading"><slot name="leading" /></div>
      <div
        ref="surface"
        class="mdv-slider__surface"
        :class="{ 'mdv-slider__surface--continuous-drag': dragging !== null && !props.stops }"
        @pointerdown="handlePointerDown"
        @lostpointercapture="cancelPointer"
      >
        <div ref="rail" class="mdv-slider__rail">
          <span
            v-for="(segment, segmentIndex) in segments"
            :key="segmentIndex"
            class="mdv-slider__segment"
            :class="{ 'mdv-slider__segment--active': segment.active }"
            :style="segment.style"
            aria-hidden="true"
          />
          <span
            v-for="dot in dots"
            :key="dot.value"
            class="mdv-slider__dot"
            :class="{ 'mdv-slider__dot--active': dot.active }"
            :style="{ '--point': dot.position }"
            aria-hidden="true"
          />
          <span
            v-if="inset"
            class="mdv-slider__inset"
            :class="{
              'mdv-slider__inset--active': inset.active,
              'mdv-slider__inset--occluded': inset.occluded,
            }"
            :style="{ '--point': `${inset.position}px`, '--mdv-slider-icon-size': `${iconSize}px` }"
            aria-hidden="true"
            ><slot name="inset-icon" :value="points[0]!"
          /></span>
          <div
            v-for="(value, index) in points"
            :key="index"
            :data-index="index"
            class="mdv-slider__thumb"
            :class="{
              'mdv-slider__thumb--pressed': dragging === index,
              'mdv-slider__thumb--keyboard-focused': keyboardFocus === index,
            }"
            :style="{ '--point': `${ratios[index]! * 100}%` }"
          >
            <input
              v-native-state="index"
              v-bind="controlAttrs(index)"
              class="mdv-slider__input"
              type="range"
              :min="bounds(index).min"
              :max="bounds(index).max"
              step="any"
              :value="value"
              :disabled="props.disabled"
            />
            <span class="mdv-slider__handle" aria-hidden="true" />
            <span
              v-if="
                props.valueIndicator &&
                !isDisabled(index) &&
                (dragging !== null
                  ? dragging === index && (!props.stops || pointerIndicator)
                  : keyboardFocus === index)
              "
              v-indicator
              class="mdv-slider__value"
              :style="{ '--value-shift': `${valueShift}px` }"
              aria-hidden="true"
              >{{ format(value) }}</span
            >
          </div>
        </div>
      </div>
      <div v-if="$slots.trailing" class="mdv-slider__trailing"><slot name="trailing" /></div>
    </div>
    <p v-if="props.supportingText" :id="descriptionId" class="mdv-slider__supporting">
      {{ props.supportingText }}
    </p>
  </div>
</template>
