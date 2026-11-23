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
import type { StyleValue } from 'vue'
import clockIcon from '@iconify-icons/material-symbols/schedule'
import keyboardIcon from '@iconify-icons/material-symbols/keyboard'
import closeIcon from '@iconify-icons/material-symbols/close'
import checkIcon from '@iconify-icons/material-symbols/check'
import MdvIcon from './MdvIcon.vue'
import MdvButton from './MdvButton.vue'
import MdvTextField from './MdvTextField.vue'
import { silentValidationMessage } from './form-validity'
import { useDialog } from './use-dialog'
import type { DialogEmits } from './use-dialog'
import type { MdvDialogCloseDetail } from './dialog.types'
import { animateTimePicker } from './time-picker-motion'
import {
  minuteTime,
  nearestTime,
  timeAtPoint,
  timeAvailability,
  timeInputFormat,
  timeIssue,
  timeMinutes,
} from './time-picker-time'
import type {
  MdvTimePickerCloseDetail,
  MdvTimePickerCloseReason,
  MdvTimePickerExpose,
  MdvTimePickerProps,
  MdvTimePickerSlots,
  MdvTimePickerTriggerProps,
  MdvTimeValue,
} from './time-picker.types'

defineOptions({ name: 'MdvTimePicker', inheritAttrs: false })
const slots = defineSlots<MdvTimePickerSlots>()
const props = withDefaults(defineProps<Omit<MdvTimePickerProps, 'modelValue' | 'open'>>(), {
  initialView: 'auto',
  orientation: 'auto',
  hourCycle: 'auto',
  locale: 'zh-CN',
  minuteStep: 1,
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
})
const value = defineModel<MdvTimeValue>({ default: null })
const opened = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  confirm: [value: MdvTimeValue]
  cancel: [detail: MdvTimePickerCloseDetail]
  open: []
  opened: []
  close: [detail: MdvTimePickerCloseDetail]
  closed: [detail: MdvTimePickerCloseDetail]
}>()
const attrs = useAttrs()
const id = `mdv-time-picker-${useId()}`
const entry = useTemplateRef<HTMLElement>('entry')
const dial = useTemplateRef<HTMLElement>('dial')
const hourInput = useTemplateRef<HTMLInputElement>('hourInput')
const minuteInput = useTemplateRef<HTMLInputElement>('minuteInput')
const ready = ref(false)
const fieldsetDisabled = ref(false)
const locked = computed(() => props.disabled || props.readonly || fieldsetDisabled.value)
const labels = computed(() => props.labels ?? {})
const format = computed(() => timeInputFormat(props.locale, props.hourCycle))
const availability = computed(() => timeAvailability(props))
const initialValue = value.value
const entryText = ref(format.value.format(value.value))
const reported = ref(false)
const customValidity = ref('')
const hoursText = ref('00')
const minutesText = ref('00')
const period = ref(0)
const part = ref<'hour' | 'minute'>('hour')
const lastTime = ref(0)
const preferredView = ref<'dial' | 'input'>('input')
const width = ref(0)
const height = ref(0)
const overflowDial = ref(false)
const composing = new Set<EventTarget>()
let finePointer: MediaQueryList | undefined
let cleanupEnvironment: (() => void) | undefined
let observer: MutationObserver | undefined
let sizeObserver: ResizeObserver | undefined
let observedSheet: HTMLElement | null = null
let resetForm: HTMLFormElement | null = null
let disposed = false
let busy = false
let returnTarget: HTMLElement | null = null
let pointer:
  | {
      id: number
      hour: string
      minute: string
      period: number
      part: 'hour' | 'minute'
      changed: boolean
    }
  | undefined
let closeDetail: MdvTimePickerCloseDetail = { reason: 'model' }

function input() {
  return entry.value?.querySelector<HTMLInputElement>('[data-time-entry]') ?? null
}
const entryValue = computed(() =>
  entryText.value.trim() ? format.value.parse(entryText.value) : null,
)
const entryIssue = computed(() =>
  entryText.value.trim() && entryValue.value === null
    ? 'invalidTime'
    : timeIssue(entryValue.value, props.required, props),
)
const entryInvalid = computed(() => !!(customValidity.value || props.error || entryIssue.value))
const entryMessage = computed<string>(
  () =>
    customValidity.value ||
    (props.error ? props.errorText || '' : '') ||
    (entryIssue.value ? labels.value[entryIssue.value] || '' : ''),
)
function panelTime(inputFormat = format.value) {
  const h = inputFormat.normalize(hoursText.value)
  const m = inputFormat.normalize(minutesText.value)
  if (!h && !m) return { value: null, invalid: false }
  if (!/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(m)) return { value: null, invalid: true }
  let hour = Number(h)
  const minute = Number(m)
  if (minute > 59 || hour > (inputFormat.hour12 ? 12 : 23) || (inputFormat.hour12 && hour === 0))
    return { value: null, invalid: true }
  if (inputFormat.hour12) hour = (hour % 12) + period.value * 12
  return { value: minuteTime(hour * 60 + minute), invalid: false }
}
const draft = computed(() => panelTime())
const unavailableIssue = computed(
  () => availability.value.issue ?? (availability.value.minutes.length ? null : 'noAvailableTime'),
)
const panelIssue = computed(() =>
  draft.value.invalid ? 'invalidTime' : timeIssue(draft.value.value, props.required, props),
)
const panelInvalid = computed(
  () => !!(unavailableIssue.value || customValidity.value || props.error || panelIssue.value),
)
const panelMessage = computed<string>(() => {
  if (unavailableIssue.value) return labels.value[unavailableIssue.value] || ''
  return (
    customValidity.value ||
    (props.error ? props.errorText || '' : '') ||
    (panelIssue.value ? labels.value[panelIssue.value] || '' : '')
  )
})
const actualOrientation = computed<'vertical' | 'horizontal' | null>(() => {
  const vertical = width.value >= (format.value.hour12 ? 360 : 336) && height.value >= 576
  const horizontal = width.value >= 600 && height.value >= 432
  if (props.orientation === 'vertical') return vertical ? 'vertical' : null
  if (props.orientation === 'horizontal') return horizontal ? 'horizontal' : null
  if (width.value > height.value && horizontal) return 'horizontal'
  return vertical ? 'vertical' : horizontal ? 'horizontal' : null
})
const view = computed(() =>
  preferredView.value === 'dial' && actualOrientation.value && !overflowDial.value
    ? 'dial'
    : 'input',
)
const selectedHour = computed(() => Math.floor(lastTime.value / 60))
const selectedMinute = computed(() => lastTime.value % 60)
const ticks = computed(() =>
  Array.from({ length: part.value === 'hour' && !format.value.hour12 ? 24 : 12 }, (_, index) => {
    const hour = format.value.hour12 ? index + period.value * 12 : index
    const value = part.value === 'minute' ? index * 5 : hour
    const inner = part.value === 'hour' && !format.value.hour12 && index >= 12
    const angle = ((index % 12) * Math.PI) / 6
    const radius = inner ? 68 : 104
    const disabled =
      part.value === 'hour'
        ? !availability.value.hours.has(hour)
        : !availability.value.allowed.has(selectedHour.value * 60 + value)
    return {
      value,
      inner,
      disabled,
      text:
        part.value === 'minute'
          ? format.value.number(value)
          : format.value.hour12
            ? format.value.number(index || 12, false)
            : index === 0
              ? format.value.number(0)
              : format.value.number(index, false),
      x: 128 + Math.sin(angle) * radius,
      y: 128 - Math.cos(angle) * radius,
    }
  }),
)
const hand = computed(() => {
  const hour = selectedHour.value
  const angle = (part.value === 'hour' ? (hour % 12) / 12 : selectedMinute.value / 60) * Math.PI * 2
  const radius = part.value === 'hour' && !format.value.hour12 && hour >= 12 ? 68 : 104
  return { x: 128 + Math.sin(angle) * radius, y: 128 - Math.cos(angle) * radius }
})
function setPanel(minute: number) {
  lastTime.value = minute
  const hour = Math.floor(minute / 60)
  hoursText.value = format.value.number(format.value.hour12 ? hour % 12 || 12 : hour)
  minutesText.value = format.value.number(minute % 60)
  period.value = hour >= 12 ? 1 : 0
}
function prepare() {
  const fromEntry = entryValue.value
  const model = timeMinutes(value.value)
  const now = new Date()
  const minute = fromEntry !== null ? timeMinutes(fromEntry) : model
  setPanel(
    minute ?? nearestTime(availability.value.minutes, now.getHours() * 60 + now.getMinutes()) ?? 0,
  )
  part.value = 'hour'
  overflowDial.value = false
  preferredView.value =
    props.initialView === 'auto' ? (finePointer?.matches ? 'input' : 'dial') : props.initialView
  composing.clear()
}
function detailFromDialog(detail: MdvDialogCloseDetail): MdvTimePickerCloseDetail {
  const actions: MdvTimePickerCloseReason[] = ['confirm', 'cancel', 'programmatic']
  return {
    reason: locked.value
      ? 'disabled'
      : detail.reason === 'escape' || detail.reason === 'scrim'
        ? detail.reason
        : actions.includes(detail.returnValue as MdvTimePickerCloseReason)
          ? (detail.returnValue as MdvTimePickerCloseReason)
          : 'model',
  }
}
function dialogEvents(event: keyof DialogEmits, ...args: unknown[]) {
  if (event === 'update:modelValue') opened.value = Boolean(args[0])
  else if (event === 'close') {
    closeDetail = detailFromDialog(args[0] as MdvDialogCloseDetail)
    cancelPointer()
    composing.clear()
    if (closeDetail.reason !== 'confirm') emit('cancel', { ...closeDetail })
    emit('close', { ...closeDetail })
  } else if (event === 'closed') emit('closed', { ...closeDetail })
  else if (event === 'open') emit('open')
  else if (event === 'opened') emit('opened')
}
const layer = useDialog(
  {
    get modelValue() {
      return ready.value && opened.value && !locked.value
    },
    closeOnEsc: true,
    closeOnScrim: true,
    destroyOnClose: true,
  },
  dialogEvents,
  {
    name: 'MdvTimePicker',
    role: 'dialog',
    hasTitle: () => !!(labels.value.title || slots.title),
    hasContentSlot: () => true,
    animate: animateTimePicker,
    prepare,
    preserveExternalFocus: true,
    returnFocus: () => returnTarget ?? input(),
  },
)
const shown = computed(() => layer.phase.value !== 'closed')
function refreshValidity() {
  const control = input()
  if (!control) return
  const nativeRequiredMissing = control.required && !control.value
  control.setCustomValidity(
    entryMessage.value ||
      (entryInvalid.value && !nativeRequiredMissing ? silentValidationMessage : ''),
  )
}
function onEntryInvalid(event: Event) {
  reported.value = true
  const control = event.target as HTMLInputElement | null
  if (control?.validationMessage === silentValidationMessage) event.preventDefault()
}
function syncEntry() {
  entryText.value = format.value.format(value.value)
}
async function open(event?: Event) {
  if (!ready.value || locked.value || input()?.matches(':disabled') || event?.defaultPrevented)
    return false
  if (event?.currentTarget instanceof HTMLElement) returnTarget = event.currentTarget
  else returnTarget = input()
  opened.value = true
  await nextTick()
  return opened.value && !locked.value
}
function close() {
  return layer.close('programmatic')
}
function focus(options?: FocusOptions) {
  input()?.focus(options)
}
async function commitEntry() {
  if (!ready.value || locked.value || opened.value || composing.size || busy) return
  reported.value = true
  if (entryInvalid.value) {
    refreshValidity()
    return
  }
  busy = true
  try {
    value.value = entryValue.value
    await nextTick()
    if (!disposed) {
      syncEntry()
      refreshValidity()
    }
  } finally {
    busy = false
  }
}
async function confirm() {
  if (locked.value || !opened.value || panelInvalid.value || composing.size || busy) return
  busy = true
  try {
    const next = draft.value.value
    value.value = next
    await nextTick()
    if (disposed || !opened.value || locked.value || value.value !== next) return
    syncEntry()
    emit('confirm', next)
    await layer.close('confirm')
  } finally {
    busy = false
  }
}
async function clear() {
  if (locked.value || composing.size) return
  value.value = null
  await nextTick()
  if (!disposed) {
    syncEntry()
    reported.value = true
    focus()
  }
}
function entryBlur() {
  queueMicrotask(() => {
    if (!disposed) void commitEntry()
  })
}
function enter(event: KeyboardEvent, panel = false) {
  if (
    event.key !== 'Enter' ||
    event.defaultPrevented ||
    event.isComposing ||
    event.keyCode === 229 ||
    composing.size
  )
    return
  event.preventDefault()
  event.stopPropagation()
  if (panel) void confirm()
  else void commitEntry()
}
function editPart(event: Event, nextPart: 'hour' | 'minute') {
  const text = (event.target as HTMLInputElement).value
  if (nextPart === 'hour') hoursText.value = text
  else minutesText.value = text
}
function focusPart(nextPart: 'hour' | 'minute') {
  if (pointer && pointer.part !== nextPart) cancelPointer()
  part.value = nextPart
  const element = nextPart === 'hour' ? hourInput.value : minuteInput.value
  element?.select()
}
function chooseHour(hour: number) {
  const minutes = availability.value.minutes.filter((minute) => Math.floor(minute / 60) === hour)
  const chosen = nearestTime(minutes, hour * 60 + selectedMinute.value)
  if (chosen === null) return false
  setPanel(chosen)
  return true
}
function chooseMinute(minute: number) {
  const next = selectedHour.value * 60 + minute
  if (!availability.value.allowed.has(next)) return false
  setPanel(next)
  return true
}
function choosePeriod(next: number) {
  if (locked.value || composing.size) return
  const hour = (selectedHour.value % 12) + next * 12
  const candidates = availability.value.minutes.filter(
    (minute) => Math.floor(minute / 720) === next,
  )
  const chosen = nearestTime(candidates, hour * 60 + selectedMinute.value)
  if (chosen !== null) setPanel(chosen)
}
function periodDisabled(next: number) {
  return !availability.value.minutes.some((minute) => Math.floor(minute / 720) === next)
}
function applyPoint(event: PointerEvent) {
  const rect = dial.value?.getBoundingClientRect()
  if (!rect?.width || !rect.height) return false
  let next = timeAtPoint(
    ((event.clientX - rect.left) * 256) / rect.width,
    ((event.clientY - rect.top) * 256) / rect.height,
    part.value,
    format.value.hour12,
    availability.value.issue ? 1 : props.minuteStep,
  )
  if (part.value === 'hour' && format.value.hour12) next += period.value * 12
  return part.value === 'hour' ? chooseHour(next) : chooseMinute(next)
}
function pointerdown(event: PointerEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.isPrimary === false ||
    locked.value ||
    !availability.value.minutes.length ||
    composing.size ||
    pointer
  )
    return
  event.preventDefault()
  dial.value?.focus({ preventScroll: true })
  pointer = {
    id: event.pointerId,
    hour: hoursText.value,
    minute: minutesText.value,
    period: period.value,
    part: part.value,
    changed: false,
  }
  dial.value?.setPointerCapture?.(event.pointerId)
  pointer.changed = applyPoint(event)
}
function pointermove(event: PointerEvent) {
  if (!pointer || pointer.id !== event.pointerId || locked.value) return
  event.preventDefault()
  pointer.changed = applyPoint(event) || pointer.changed
}
function pointerup(event: PointerEvent) {
  if (!pointer || pointer.id !== event.pointerId) return
  const advance = pointer.part === 'hour' && pointer.changed
  const pointerId = pointer.id
  pointer = undefined
  if (dial.value?.hasPointerCapture?.(pointerId)) dial.value.releasePointerCapture(pointerId)
  if (advance) part.value = 'minute'
}
function cancelPointer(event?: PointerEvent) {
  if (event && pointer && event.pointerId !== pointer.id) return
  const previous = pointer
  pointer = undefined
  if (!previous) return
  hoursText.value = previous.hour
  minutesText.value = previous.minute
  period.value = previous.period
  if (dial.value?.hasPointerCapture?.(previous.id)) dial.value.releasePointerCapture(previous.id)
}
function dialKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || composing.size || locked.value) return
  if (['Enter', ' '].includes(event.key)) {
    event.preventDefault()
    if (part.value === 'hour') part.value = 'minute'
    return
  }
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
    return
  event.preventDefault()
  const options =
    part.value === 'hour'
      ? [...availability.value.hours].filter(
          (hour) => !format.value.hour12 || Math.floor(hour / 12) === period.value,
        )
      : availability.value.minutes
          .filter((minute) => Math.floor(minute / 60) === selectedHour.value)
          .map((minute) => minute % 60)
  if (!options.length) return
  const current = part.value === 'hour' ? selectedHour.value : selectedMinute.value
  const direction = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1
  let index = options.indexOf(current)
  if (event.key === 'Home') index = 0
  else if (event.key === 'End') index = options.length - 1
  else if (index === -1) {
    const next = options.findIndex((option) => option > current)
    index =
      direction > 0
        ? next === -1
          ? 0
          : next
        : next === -1
          ? options.length - 1
          : (next - 1 + options.length) % options.length
  } else index = (index + direction + options.length) % options.length
  const next = options[index]!
  if (part.value === 'hour') chooseHour(next)
  else chooseMinute(next)
}
async function toggleView() {
  if (locked.value || composing.size) return
  cancelPointer()
  if (view.value === 'input' && !actualOrientation.value) return
  overflowDial.value = false
  preferredView.value = view.value === 'dial' ? 'input' : 'dial'
  await nextTick()
  if (view.value === 'dial') dial.value?.focus({ preventScroll: true })
  else (part.value === 'hour' ? hourInput.value : minuteInput.value)?.focus({ preventScroll: true })
}
function inputAttrs() {
  const result: Record<string, unknown> = { ...attrs }
  for (const key of [
    'class',
    'style',
    'value',
    'defaultValue',
    'name',
    'type',
    'min',
    'max',
    'step',
  ])
    delete result[key]
  result.id = typeof attrs.id === 'string' ? attrs.id : `${id}-input`
  result['data-time-entry'] = ''
  return result
}
const triggerProps = computed<MdvTimePickerTriggerProps>(() => ({
  type: 'button',
  disabled: locked.value,
  'aria-haspopup': 'dialog',
  'aria-expanded': shown.value,
  'aria-controls': `${id}-panel`,
  'aria-label': labels.value.open,
  onClick: (event) => {
    void open(event)
  },
}))
function reset(event: Event) {
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented) return
    composing.clear()
    customValidity.value = ''
    reported.value = false
    value.value = initialValue
    void close()
    void nextTick(() => {
      if (!disposed) {
        syncEntry()
        refreshValidity()
      }
    })
  })
}
function syncForm() {
  const next = input()?.form ?? null
  if (next === resetForm) return
  resetForm?.removeEventListener('reset', reset)
  resetForm = next
  resetForm?.addEventListener('reset', reset)
}
function syncFieldset() {
  fieldsetDisabled.value = !!input()?.matches(':disabled')
}
function attachEnvironment() {
  cleanupEnvironment?.()
  const win = entry.value?.ownerDocument.defaultView
  if (!win) return
  finePointer = win.matchMedia?.('(pointer: fine)')
  const viewport = win.visualViewport
  function resize() {
    width.value = viewport?.width ?? win!.innerWidth
    height.value = viewport?.height ?? win!.innerHeight
    overflowDial.value = false
  }
  resize()
  if (!sizeObserver && typeof win.ResizeObserver === 'function')
    sizeObserver = new win.ResizeObserver(measureDial)
  win.addEventListener('resize', resize)
  viewport?.addEventListener('resize', resize)
  if (typeof win.MutationObserver === 'function') {
    observer = new win.MutationObserver(syncFieldset)
    let ancestor = entry.value?.parentElement
    while (ancestor) {
      if (ancestor.tagName === 'FIELDSET')
        observer.observe(ancestor, { attributes: true, attributeFilter: ['disabled'] })
      ancestor = ancestor.parentElement
    }
  }
  syncFieldset()
  cleanupEnvironment = () => {
    win.removeEventListener('resize', resize)
    viewport?.removeEventListener('resize', resize)
    observer?.disconnect()
  }
}
watch(
  [ready, opened, locked],
  ([mounted, wanted, blocked]) => {
    // 在原生 showModal 自动聚焦前选好形态，触控拨盘不会先唤起软键盘。
    if (mounted && wanted && !blocked && layer.phase.value === 'closed') prepare()
  },
  { flush: 'sync' },
)
watch([value, format], ([nextValue, nextFormat], [previousValue, previousFormat]) => {
  if (nextValue !== previousValue) {
    cancelPointer()
    syncEntry()
    const minute = timeMinutes(nextValue)
    if (shown.value && minute !== null) setPanel(minute)
    else if (shown.value && nextValue === null) {
      hoursText.value = ''
      minutesText.value = ''
    }
    return
  }
  if (nextFormat === previousFormat) return
  const previous = previousFormat
  const previousDraft = panelTime(previous)
  const preserved = previousDraft.value ? timeMinutes(previousDraft.value) : null
  const edited = entryText.value !== previous.format(value.value)
  if (!edited) syncEntry()
  if (preserved !== null) setPanel(preserved)
  overflowDial.value = false
})
watch(draft, (next) => {
  const minute = timeMinutes(next.value)
  if (minute !== null) lastTime.value = minute
})
watch([entryMessage, entryInvalid, entryText, () => props.required], refreshValidity, {
  flush: 'post',
})
watch(
  entryIssue,
  (issue) => {
    if (value.value !== null && issue) reported.value = true
  },
  { immediate: true },
)
watch(locked, (blocked) => {
  if (blocked && opened.value) opened.value = false
})
watch(
  view,
  () => {
    const focused = dial.value === entry.value?.ownerDocument.activeElement
    cancelPointer()
    if (focused)
      void nextTick(() => {
        ;(part.value === 'hour' ? hourInput.value : minuteInput.value)?.focus({
          preventScroll: true,
        })
      })
  },
  { flush: 'pre' },
)
onMounted(() => {
  attachEnvironment()
  syncForm()
  refreshValidity()
  ready.value = true
})
function measureDial() {
  const sheet =
    layer.elements.container.value?.querySelector<HTMLElement>('.mdv-time-picker__sheet') ?? null
  if (sheet !== observedSheet) {
    sizeObserver?.disconnect()
    observedSheet = sheet
    if (sheet) {
      sizeObserver?.observe(sheet)
      if (layer.elements.content.value) sizeObserver?.observe(layer.elements.content.value)
    }
  }
  if (
    view.value === 'dial' &&
    sheet?.clientHeight &&
    (sheet.scrollHeight > sheet.clientHeight + 1 || sheet.scrollWidth > sheet.clientWidth + 1)
  )
    overflowDial.value = true
}
watch(
  () => props.orientation,
  () => {
    overflowDial.value = false
  },
)
onUpdated(() => {
  syncForm()
  syncFieldset()
  refreshValidity()
  measureDial()
})
onActivated(() => {
  if (ready.value) attachEnvironment()
})
onDeactivated(() => {
  cleanupEnvironment?.()
  sizeObserver?.disconnect()
  observedSheet = null
  cancelPointer()
})
onBeforeUnmount(() => {
  disposed = true
  cleanupEnvironment?.()
  sizeObserver?.disconnect()
  resetForm?.removeEventListener('reset', reset)
  cancelPointer()
})
defineExpose<MdvTimePickerExpose>({
  open,
  close,
  focus,
  checkValidity: () => {
    refreshValidity()
    return input()?.checkValidity() ?? true
  },
  reportValidity: () => {
    reported.value = true
    refreshValidity()
    return input()?.reportValidity() ?? true
  },
  setCustomValidity: (message) => {
    customValidity.value = message
    refreshValidity()
  },
})
</script>

<template>
  <div
    ref="entry"
    class="mdv-time-picker"
    :class="attrs.class"
    :style="attrs.style as StyleValue"
    :dir="attrs.dir as string"
    :lang="attrs.lang as string"
    @compositionstart="composing.add($event.target!)"
    @compositionend="composing.delete($event.target!)"
  >
    <MdvTextField
      v-bind="inputAttrs()"
      v-model="entryText"
      :label="label ?? labels.time"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :placeholder="placeholder"
      :supporting-text="
        reported && entryInvalid
          ? undefined
          : (supportingText ??
            (labels.formatHint ? `${labels.formatHint}: ${format.hint}` : undefined))
      "
      :error="!!(error || (reported && entryInvalid))"
      :error-text="reported ? entryMessage : errorText"
      @blur="entryBlur"
      @keydown="enter($event)"
      @invalid="onEntryInvalid"
    >
      <template #trailing>
        <button
          v-if="clearable && entryText && !locked"
          type="button"
          class="mdv-time-picker__icon"
          :aria-label="labels.clear"
          @click="clear"
        >
          <MdvIcon :icon="closeIcon" />
        </button>
        <slot name="trigger" :open="open" :close="close" :trigger-props="triggerProps"
          ><button v-bind="triggerProps" class="mdv-time-picker__icon">
            <MdvIcon :icon="clockIcon" /></button
        ></slot>
      </template>
    </MdvTextField>
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :form="attrs.form as string"
      :value="value || ''"
      :disabled="disabled"
    />
    <dialog
      :id="id + '-panel'"
      ref="dialog"
      class="mdv-dialog mdv-time-picker__layer"
      :class="{
        'mdv-time-picker__layer--input': view === 'input',
        'mdv-time-picker__layer--horizontal': view === 'dial' && actualOrientation === 'horizontal',
        'mdv-time-picker__layer--h24': !format.hour12,
      }"
      :data-state="layer.phase.value"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labels.title || slots.title ? id + '-title' : undefined"
      :aria-describedby="panelMessage ? id + '-status' : undefined"
      tabindex="-1"
      closedby="none"
      v-on="layer.listeners"
    >
      <div ref="scrim" class="mdv-dialog__scrim" aria-hidden="true" />
      <div v-if="layer.rendered.value" ref="container" class="mdv-time-picker__container">
        <div ref="surface" class="mdv-time-picker__background" aria-hidden="true" />
        <div class="mdv-time-picker__sheet">
          <header v-if="labels.title || slots.title" ref="header" class="mdv-time-picker__header">
            <h2 :id="id + '-title'">
              <slot name="title">{{ labels.title }}</slot>
            </h2>
          </header>
          <div ref="content" class="mdv-time-picker__content">
            <div class="mdv-time-picker__selection">
              <div class="mdv-time-picker__numbers" dir="ltr">
                <label
                  class="mdv-time-picker__field"
                  :class="{ 'mdv-time-picker__field--selected': part === 'hour' }"
                >
                  <input
                    ref="hourInput"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="2"
                    data-time-part="hour"
                    :value="hoursText"
                    :aria-label="labels.hour"
                    :aria-invalid="panelInvalid"
                    :aria-describedby="panelMessage ? id + '-status' : undefined"
                    :disabled="locked"
                    @input="editPart($event, 'hour')"
                    @focus="focusPart('hour')"
                    @keydown="enter($event, true)"
                  />
                  <span>{{ labels.hour }}</span>
                </label>
                <span class="mdv-time-picker__separator" aria-hidden="true">:</span>
                <label
                  class="mdv-time-picker__field"
                  :class="{ 'mdv-time-picker__field--selected': part === 'minute' }"
                >
                  <input
                    ref="minuteInput"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="2"
                    data-time-part="minute"
                    :value="minutesText"
                    :aria-label="labels.minute"
                    :aria-invalid="panelInvalid"
                    :aria-describedby="panelMessage ? id + '-status' : undefined"
                    :disabled="locked"
                    @input="editPart($event, 'minute')"
                    @focus="focusPart('minute')"
                    @keydown="enter($event, true)"
                  />
                  <span>{{ labels.minute }}</span>
                </label>
              </div>
              <fieldset
                v-if="format.hour12"
                class="mdv-time-picker__period"
                role="radiogroup"
                :aria-label="labels.period"
                :disabled="locked"
              >
                <legend class="mdv-time-picker__sr">{{ labels.period }}</legend>
                <label
                  v-for="(text, index) in format.periods"
                  :key="index"
                  :class="{ 'mdv-time-picker__period--selected': period === index }"
                >
                  <input
                    type="radio"
                    :name="id + '-period'"
                    :form="id + '-internal-form'"
                    :value="index"
                    :checked="period === index"
                    :disabled="periodDisabled(index)"
                    @change="choosePeriod(index)"
                  /><span>{{ text }}</span>
                </label>
              </fieldset>
            </div>
            <div
              v-if="view === 'dial'"
              ref="dial"
              class="mdv-time-picker__dial"
              role="slider"
              autofocus
              tabindex="0"
              :aria-label="part === 'hour' ? labels.hour : labels.minute"
              :aria-valuemin="part === 'hour' && format.hour12 ? 1 : 0"
              :aria-valuemax="part === 'hour' ? (format.hour12 ? 12 : 23) : 59"
              :aria-valuenow="
                part === 'hour'
                  ? format.hour12
                    ? selectedHour % 12 || 12
                    : selectedHour
                  : selectedMinute
              "
              :aria-valuetext="format.format(minuteTime(lastTime))"
              :aria-disabled="locked || !availability.minutes.length"
              :aria-describedby="labels.keyboardHint ? id + '-keyboard' : undefined"
              @pointerdown="pointerdown"
              @pointermove="pointermove"
              @pointerup="pointerup"
              @pointercancel="cancelPointer"
              @lostpointercapture="cancelPointer"
              @keydown="dialKeydown"
            >
              <svg viewBox="0 0 256 256" aria-hidden="true">
                <line x1="128" y1="128" :x2="hand.x" :y2="hand.y" />
                <circle :cx="hand.x" :cy="hand.y" r="24" />
                <circle cx="128" cy="128" r="4" />
                <circle
                  v-if="part === 'minute' && selectedMinute % 5 !== 0"
                  :cx="hand.x"
                  :cy="hand.y"
                  r="2"
                  class="mdv-time-picker__minute-dot"
                />
              </svg>
              <span
                v-for="tick in ticks"
                :key="tick.value"
                :data-time-tick="tick.value"
                :class="{
                  'mdv-time-picker__tick--selected':
                    tick.value === (part === 'hour' ? selectedHour : selectedMinute),
                  'mdv-time-picker__tick--disabled': tick.disabled,
                  'mdv-time-picker__tick--inner': tick.inner,
                }"
                class="mdv-time-picker__tick"
                :style="{ left: tick.x + 'px', top: tick.y + 'px' }"
                aria-hidden="true"
                >{{ tick.text }}</span
              >
            </div>
          </div>
          <p v-if="labels.keyboardHint" :id="id + '-keyboard'" class="mdv-time-picker__sr">
            {{ labels.keyboardHint }}
          </p>
          <p :id="id + '-status'" class="mdv-time-picker__status" role="status" aria-live="polite">
            {{ panelMessage }}
          </p>
          <div ref="actions" class="mdv-time-picker__actions">
            <button
              type="button"
              class="mdv-time-picker__icon"
              data-time-action="view"
              :aria-label="view === 'dial' ? labels.input : labels.dial"
              :disabled="locked || (view === 'input' && !actualOrientation)"
              @click="toggleView"
            >
              <MdvIcon :icon="view === 'dial' ? keyboardIcon : clockIcon" />
            </button>
            <div class="mdv-time-picker__buttons">
              <MdvButton variant="text" data-time-action="cancel" @click="layer.close('cancel')">
                <template v-if="labels.cancel">{{ labels.cancel }}</template>
                <MdvIcon v-else :icon="closeIcon" />
              </MdvButton>
              <MdvButton
                variant="text"
                data-time-action="confirm"
                :disabled="locked || panelInvalid"
                @click="confirm"
              >
                <template v-if="labels.confirm">{{ labels.confirm }}</template>
                <MdvIcon v-else :icon="checkIcon" />
              </MdvButton>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  </div>
</template>
