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
  shallowRef,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { StyleValue } from 'vue'
import calendarIcon from '@iconify-icons/material-symbols/calendar-month'
import editIcon from '@iconify-icons/material-symbols/edit'
import closeIcon from '@iconify-icons/material-symbols/close'
import MdvIcon from './MdvIcon.vue'
import MdvButton from './MdvButton.vue'
import MdvTextField from './MdvTextField.vue'
import DateCalendar from './_MdvDateCalendar.vue'
import {
  calendarDate,
  dateFormatter,
  dateParts,
  datePickerLabels,
  inputDateFormat,
  parseInputDate,
  selectionIssue,
  selectionParts,
} from './date-picker-date'
import type { DateIssue } from './date-picker-date'
import { useDatePickerLayer } from './use-date-picker-layer'
import type { DateLayerLayout } from './use-date-picker-layer'
import type {
  MdvDatePickerCommonProps,
  MdvDatePickerLayout,
  MdvDatePickerSlots,
  MdvDatePickerCloseDetail,
  MdvDatePickerExpose,
  MdvDatePickerTriggerProps,
  MdvDateRangeValue,
  MdvDateValue,
  DateCalendarViewState,
} from './date-picker.types'

defineOptions({ inheritAttrs: false })
defineSlots<MdvDatePickerSlots>()
interface InternalProps extends MdvDatePickerCommonProps {
  modelValue?: MdvDateValue | MdvDateRangeValue
  range?: boolean
  layout?: MdvDatePickerLayout
  label?: string
  name?: string
  startLabel?: string
  endLabel?: string
  startName?: string
  endName?: string
}
const props = withDefaults(defineProps<InternalProps>(), {
  modelValue: null,
  open: false,
  range: false,
  layout: 'auto',
  locale: 'zh-CN',
  initialView: 'calendar',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: MdvDateValue | MdvDateRangeValue]
  'update:open': [value: boolean]
  confirm: [value: MdvDateValue | MdvDateRangeValue]
  cancel: [detail: MdvDatePickerCloseDetail]
  open: []
  opened: []
  close: [detail: MdvDatePickerCloseDetail]
  closed: [detail: MdvDatePickerCloseDetail]
}>()
const attrs = useAttrs()
const id = `mdv-date-picker-${useId()}`
const entry = useTemplateRef<HTMLElement>('entry')
const layerRoot = useTemplateRef<HTMLElement>('layerRoot')
const surface = useTemplateRef<HTMLElement>('surface')
const calendar = useTemplateRef<InstanceType<typeof DateCalendar>>('calendar')
const labels = computed(() => ({ ...datePickerLabels, ...props.labels }))
const format = computed(() => inputDateFormat(props.locale))
const initialValue =
  typeof props.modelValue === 'object' && props.modelValue
    ? { ...props.modelValue }
    : props.modelValue
const entryStart = ref('')
const entryEnd = ref('')
const panelStart = ref('')
const panelEnd = ref('')
const draftStart = ref<string | null>(null)
const draftEnd = ref<string | null>(null)
const navigationDate = ref<string | undefined>()
const calendarState = shallowRef<DateCalendarViewState>()
const view = ref(props.initialView)
const compact = ref(false)
const entryReported = ref(false)
const panelReported = ref(false)
const inputUnresolved = ref(false)
const fieldsetDisabled = ref(false)
const customValidity = ref('')
const composing = new Set<EventTarget>()
let resetForm: HTMLFormElement | null = null
let disposed = false
let fieldsetObserver: MutationObserver | undefined
let fieldsets: HTMLFieldSetElement[] = []

function formatted(value: string | null) {
  return value ? format.value.format(value) : ''
}
function syncEntry() {
  const [start, end] = selectionParts(props.modelValue)
  entryStart.value = formatted(start)
  entryEnd.value = formatted(end)
}
syncEntry()
function parsed(startText: string, endText: string) {
  const start = startText.trim() ? parseInputDate(startText, props.locale) : null
  const end = props.range && endText.trim() ? parseInputDate(endText, props.locale) : null
  const invalid = (startText.trim() && !start) || (props.range && endText.trim() && !end)
  const issue: DateIssue | null = invalid
    ? 'invalidDate'
    : selectionIssue(start, end, props.range, props.required, props)
  return { start, end, issue }
}
const entrySelection = computed(() => parsed(entryStart.value, entryEnd.value))
const candidate = computed(() =>
  view.value === 'input' || inputUnresolved.value
    ? parsed(panelStart.value, panelEnd.value)
    : {
        start: draftStart.value,
        end: draftEnd.value,
        issue: selectionIssue(draftStart.value, draftEnd.value, props.range, props.required, props),
      },
)
const entryMessage = computed(
  () =>
    customValidity.value ||
    (props.error ? props.errorText || labels.value.invalidDate : '') ||
    (entrySelection.value.issue ? labels.value[entrySelection.value.issue] : ''),
)
const panelMessage = computed(() =>
  candidate.value.issue ? labels.value[candidate.value.issue] : '',
)
const hint = computed(() => `${labels.value.formatHint}：${format.value.hint}`)
const title = computed(() => (props.range ? labels.value.rangeTitle : labels.value.title))
const headline = computed(() => {
  if (view.value === 'input') return labels.value.input
  const start = candidate.value.start
  const end = candidate.value.end
  if (!start) return props.range ? labels.value.chooseRange : labels.value.chooseDate
  const formatter = dateFormatter(props.locale, {
    month: 'short',
    day: 'numeric',
    ...(!props.range ? { weekday: 'short' } : {}),
    ...(end && start.slice(0, 4) !== end.slice(0, 4) ? { year: 'numeric' } : {}),
  })
  const first = formatter.format(calendarDate(start))
  return props.range
    ? `${first} – ${end ? formatter.format(calendarDate(end)) : labels.value.endLabel}`
    : first
})
const showTopbar = computed(
  () => layer.layout.value === 'fullscreen' || (props.range && view.value === 'calendar'),
)
const effectiveLayout = computed<DateLayerLayout>(() =>
  props.layout === 'auto'
    ? compact.value
      ? 'fullscreen'
      : props.range
        ? 'modal'
        : 'docked'
    : props.layout === 'docked' && props.range
      ? 'modal'
      : props.layout,
)
function prepare() {
  const parsedEntry = entrySelection.value
  const [modelStart, modelEnd] = selectionParts(props.modelValue)
  draftStart.value = parsedEntry.issue
    ? modelStart && dateParts(modelStart)
      ? modelStart
      : null
    : parsedEntry.start
  draftEnd.value = parsedEntry.issue
    ? modelEnd && dateParts(modelEnd)
      ? modelEnd
      : null
    : parsedEntry.end
  panelStart.value = entryStart.value
  panelEnd.value = entryEnd.value
  navigationDate.value = draftStart.value ?? undefined
  calendarState.value = undefined
  view.value = effectiveLayout.value === 'docked' ? 'calendar' : props.initialView
  panelReported.value = false
  inputUnresolved.value = false
}
function focusPanel() {
  if (view.value === 'calendar' || layer.layout.value === 'docked') void calendar.value?.focus()
  else layerRoot.value?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
}
const layer = useDatePickerLayer({
  open: () => props.open,
  disabled: () => props.disabled || props.readonly || fieldsetDisabled.value,
  layout: () => effectiveLayout.value,
  compact,
  root: layerRoot,
  surface,
  anchor: entry,
  emit,
  prepare,
  focus: focusPanel,
})
function nativeInputs() {
  return [...(entry.value?.querySelectorAll<HTMLInputElement>('[data-date-entry]') ?? [])]
}
function unavailable() {
  return (
    props.disabled || props.readonly || nativeInputs().some((input) => input.matches(':disabled'))
  )
}
async function open(event?: Event) {
  return unavailable() ? false : layer.open(event)
}
function close() {
  return layer.close('programmatic')
}
function valueFor(start: string | null, end: string | null): MdvDateValue | MdvDateRangeValue {
  return props.range ? (start && end ? { start, end } : null) : start
}
function sameValue(a: MdvDateValue | MdvDateRangeValue, b: MdvDateValue | MdvDateRangeValue) {
  const [as, ae] = selectionParts(a)
  const [bs, be] = selectionParts(b)
  return as === bs && ae === be
}
async function commitEntry() {
  if (unavailable() || props.open || composing.size) return
  entryReported.value = true
  if (entrySelection.value.issue) {
    refreshValidity()
    return
  }
  const next = valueFor(entrySelection.value.start, entrySelection.value.end)
  if (!sameValue(props.modelValue, next)) emit('update:modelValue', next)
  await nextTick()
  if (disposed) return
  syncEntry()
  refreshValidity()
}
async function confirm() {
  if (unavailable() || composing.size || !props.open) return
  panelReported.value = true
  if (candidate.value.issue) return
  const next = valueFor(candidate.value.start, candidate.value.end)
  if (!sameValue(props.modelValue, next)) emit('update:modelValue', next)
  await nextTick()
  if (disposed || !sameValue(props.modelValue, next)) return
  syncEntry()
  emit('confirm', next)
  await layer.close('confirm')
}
function select(date: string) {
  if (unavailable()) return
  inputUnresolved.value = false
  if (props.range) {
    if (!draftStart.value || draftEnd.value || date < draftStart.value) {
      draftStart.value = date
      draftEnd.value = null
    } else draftEnd.value = date
  } else draftStart.value = date
  panelStart.value = formatted(draftStart.value)
  panelEnd.value = formatted(draftEnd.value)
  panelReported.value = true
}
async function toggleView() {
  if (composing.size) return
  if (view.value === 'input') {
    const next = parsed(panelStart.value, panelEnd.value)
    panelReported.value = true
    inputUnresolved.value = !!next.issue
    draftStart.value = next.start
    draftEnd.value = next.end
    navigationDate.value = next.start ?? navigationDate.value
    calendarState.value = undefined
    view.value = 'calendar'
  } else {
    if (!inputUnresolved.value) {
      panelStart.value = formatted(draftStart.value)
      panelEnd.value = formatted(draftEnd.value)
    }
    view.value = 'input'
  }
  await nextTick()
  focusPanel()
}
async function clear() {
  if (unavailable()) return
  emit('update:modelValue', null)
  await nextTick()
  if (disposed) return
  syncEntry()
  entryReported.value = true
  focus()
}
function focus(options?: FocusOptions) {
  nativeInputs()[0]?.focus(options)
}
function refreshValidity() {
  for (const input of nativeInputs()) input.setCustomValidity(entryMessage.value)
}
function checkValidity() {
  refreshValidity()
  return nativeInputs().every((input) => input.checkValidity())
}
function reportValidity() {
  entryReported.value = true
  refreshValidity()
  for (const input of nativeInputs()) if (!input.reportValidity()) return false
  return true
}
function onBlur() {
  queueMicrotask(() => {
    if (disposed) return
    const target = entry.value?.ownerDocument.activeElement
    if (
      props.range &&
      target instanceof Element &&
      target.matches('[data-date-entry]') &&
      entry.value?.contains(target) &&
      entrySelection.value.issue === 'incompleteRange'
    )
      return
    void commitEntry()
  })
}
function onKeydown(event: KeyboardEvent, panel = false) {
  if (
    event.key !== 'Enter' ||
    event.isComposing ||
    event.keyCode === 229 ||
    composing.size ||
    event.defaultPrevented
  )
    return
  event.preventDefault()
  event.stopPropagation()
  if (panel) void confirm()
  else void commitEntry()
}
function inputAttrs(index: number) {
  const result: Record<string, unknown> = { ...attrs }
  for (const key of ['class', 'style', 'value', 'defaultValue', 'name', 'type', 'min', 'max'])
    delete result[key]
  result.id = `${typeof attrs.id === 'string' ? attrs.id : id + '-input'}${index ? '-end' : ''}`
  if (index) {
    // 两个字段各由自己的 label 命名；调用方提供的原生 attrs 默认路由到开始字段。
    for (const key of Object.keys(result))
      if (
        key.startsWith('on') ||
        ['aria-label', 'aria-labelledby', 'autofocus', 'tabindex', 'placeholder'].includes(key)
      )
        delete result[key]
  }
  result['data-date-entry'] = index ? 'end' : 'start'
  return result
}
const triggerProps = computed<MdvDatePickerTriggerProps>(() => ({
  type: 'button',
  disabled: props.disabled || props.readonly,
  'aria-haspopup': 'dialog',
  'aria-expanded': layer.shown.value,
  'aria-controls': id + '-panel',
  'aria-label': labels.value.open,
  onClick: (event) => {
    if (!event.defaultPrevented) void open(event)
  },
}))
function reset(event: Event) {
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented) return
    emit('update:modelValue', initialValue)
    entryReported.value = false
    customValidity.value = ''
    void layer.close('programmatic')
    void nextTick(() => {
      if (!disposed) {
        syncEntry()
        refreshValidity()
      }
    })
  })
}
function syncForm() {
  const next = nativeInputs()[0]?.form ?? null
  if (next === resetForm) return
  resetForm?.removeEventListener('reset', reset)
  resetForm = next
  resetForm?.addEventListener('reset', reset)
}
function syncFieldsets() {
  const input = nativeInputs()[0]
  fieldsetDisabled.value = !!input?.matches(':disabled')
  const next: HTMLFieldSetElement[] = []
  let ancestor = entry.value?.parentElement
  while (ancestor) {
    if (ancestor instanceof HTMLFieldSetElement) next.push(ancestor)
    ancestor = ancestor.parentElement
  }
  if (
    next.length === fieldsets.length &&
    next.every((fieldset, index) => fieldsets[index] === fieldset)
  )
    return
  fieldsets = next
  fieldsetObserver?.disconnect()
  for (const fieldset of fieldsets)
    fieldsetObserver?.observe(fieldset, {
      attributes: true,
      attributeFilter: ['disabled'],
    })
}
watch(
  [() => props.modelValue, () => props.locale],
  () => {
    syncEntry()
    if (layer.shown.value) {
      const [start, end] = selectionParts(props.modelValue)
      draftStart.value = start && dateParts(start) ? start : null
      draftEnd.value = end && dateParts(end) ? end : null
      panelStart.value = entryStart.value
      panelEnd.value = entryEnd.value
      inputUnresolved.value = false
    }
  },
  { deep: true },
)
watch([() => props.min, () => props.max, () => props.disabledDate, () => props.required], () => {
  if (props.modelValue) entryReported.value = true
  if (layer.shown.value) panelReported.value = true
})
watch([entryMessage, entryStart, entryEnd], refreshValidity, { flush: 'post' })
watch(
  () => {
    const [start, end] = selectionParts(props.modelValue)
    return selectionIssue(start, end, props.range, false, props)
  },
  (issue) => {
    if (issue) entryReported.value = true
  },
  { immediate: true },
)
watch(layer.shown, (shown) => {
  if (!shown) composing.clear()
})
watch(
  () => candidate.value.issue,
  (issue) => {
    if (layer.shown.value && issue) panelReported.value = true
  },
)
watch([panelStart, panelEnd], () => {
  if (view.value !== 'input') return
  const next = parsed(panelStart.value, panelEnd.value)
  draftStart.value = next.start
  draftEnd.value = next.end
})
onMounted(() => {
  const Observer = entry.value?.ownerDocument.defaultView?.MutationObserver
  if (typeof Observer === 'function') fieldsetObserver = new Observer(syncFieldsets)
  syncForm()
  syncFieldsets()
  refreshValidity()
})
onUpdated(() => {
  syncForm()
  syncFieldsets()
  refreshValidity()
})
onActivated(() => {
  fieldsets = []
  syncFieldsets()
})
onDeactivated(() => {
  fieldsetObserver?.disconnect()
  fieldsets = []
})
onBeforeUnmount(() => {
  disposed = true
  fieldsetObserver?.disconnect()
  resetForm?.removeEventListener('reset', reset)
})
defineExpose<MdvDatePickerExpose>({
  open,
  close,
  focus,
  checkValidity,
  reportValidity,
  setCustomValidity: (message) => {
    customValidity.value = message
    refreshValidity()
  },
})
</script>

<template>
  <div
    ref="entry"
    class="mdv-date-picker"
    :class="[attrs.class, { 'mdv-date-picker--range': range }]"
    :style="attrs.style as StyleValue"
    :dir="attrs.dir as string"
    :lang="attrs.lang as string"
    @compositionstart="composing.add($event.target!)"
    @compositionend="composing.delete($event.target!)"
  >
    <div class="mdv-date-picker__fields">
      <MdvTextField
        v-bind="inputAttrs(0)"
        v-model="entryStart"
        :label="range ? startLabel || labels.startLabel : label || labels.dateLabel"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :placeholder="(attrs.placeholder as string) || format.hint"
        :supporting-text="entryReported && entryMessage ? '' : supportingText || hint"
        :error="!!(error || (entryReported && entryMessage))"
        :error-text="entryReported ? entryMessage : errorText"
        @blur="onBlur"
        @keydown="onKeydown($event)"
        @invalid="entryReported = true"
      >
        <template v-if="!range" #trailing>
          <button
            v-if="clearable && entryStart && !disabled && !readonly"
            type="button"
            class="mdv-date-picker__icon"
            :aria-label="labels.clear"
            @click="clear"
          >
            <MdvIcon :icon="closeIcon" />
          </button>
          <slot name="trigger" :open="open" :close="close" :trigger-props="triggerProps"
            ><button v-bind="triggerProps" class="mdv-date-picker__icon">
              <MdvIcon :icon="calendarIcon" /></button
          ></slot>
        </template>
      </MdvTextField>
      <MdvTextField
        v-if="range"
        v-bind="inputAttrs(1)"
        v-model="entryEnd"
        :label="endLabel || labels.endLabel"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :placeholder="format.hint"
        :supporting-text="entryReported && entryMessage ? '' : supportingText || hint"
        :error="!!(error || (entryReported && entryMessage))"
        :error-text="entryReported ? entryMessage : errorText"
        @blur="onBlur"
        @keydown="onKeydown($event)"
        @invalid="entryReported = true"
      >
        <template #trailing>
          <button
            v-if="clearable && (entryStart || entryEnd) && !disabled && !readonly"
            type="button"
            class="mdv-date-picker__icon"
            :aria-label="labels.clear"
            @click="clear"
          >
            <MdvIcon :icon="closeIcon" />
          </button>
          <slot name="trigger" :open="open" :close="close" :trigger-props="triggerProps"
            ><button v-bind="triggerProps" class="mdv-date-picker__icon">
              <MdvIcon :icon="calendarIcon" /></button
          ></slot>
        </template>
      </MdvTextField>
    </div>
    <input
      v-if="range ? startName : name"
      type="hidden"
      :name="range ? startName : name"
      :form="attrs.form as string"
      :value="selectionParts(modelValue)[0] || ''"
      :disabled="disabled"
    />
    <input
      v-if="range && endName"
      type="hidden"
      :name="endName"
      :form="attrs.form as string"
      :value="selectionParts(modelValue)[1] || ''"
      :disabled="disabled"
    />
    <component
      :is="layer.layout.value === 'docked' ? 'div' : 'dialog'"
      :id="id + '-panel'"
      ref="layerRoot"
      class="mdv-date-picker__layer"
      :class="[
        `mdv-date-picker__layer--${layer.layout.value}`,
        {
          'mdv-date-picker__layer--range': range,
          'mdv-date-picker__layer--input': view === 'input',
        },
      ]"
      :data-state="layer.phase.value"
      :data-active="layer.shown.value || undefined"
      :data-ready="layer.ready.value || undefined"
      :popover="layer.layout.value === 'docked' ? 'manual' : undefined"
      role="dialog"
      :aria-modal="layer.layout.value !== 'docked' ? 'true' : undefined"
      :aria-labelledby="id + '-title'"
      :aria-describedby="id + '-status'"
      tabindex="-1"
      closedby="none"
      v-on="layer.listeners"
    >
      <template v-if="layer.shown.value">
        <div
          v-if="layer.layout.value !== 'docked'"
          class="mdv-date-picker__scrim"
          aria-hidden="true"
        />
        <div class="mdv-date-picker__container">
          <div
            v-if="layer.layout.value === 'modal'"
            class="mdv-date-picker__background"
            aria-hidden="true"
          />
          <div ref="surface" class="mdv-date-picker__surface">
            <header
              class="mdv-date-picker__header"
              :class="{ 'mdv-date-picker__sr': layer.layout.value === 'docked' }"
            >
              <div v-if="showTopbar" class="mdv-date-picker__topbar">
                <button
                  type="button"
                  class="mdv-date-picker__icon"
                  :aria-label="labels.cancel"
                  data-date-focus="cancel"
                  @click="layer.close('cancel')"
                >
                  <MdvIcon :icon="closeIcon" />
                </button>
                <MdvButton
                  variant="text"
                  data-date-focus="confirm"
                  :disabled="!!candidate.issue || disabled || readonly"
                  @click="confirm"
                  >{{ labels.save }}</MdvButton
                >
              </div>
              <div class="mdv-date-picker__header-content">
                <h2 :id="id + '-title'" class="mdv-date-picker__title">
                  <slot name="title">{{ title }}</slot>
                </h2>
                <div v-if="layer.layout.value !== 'docked'" class="mdv-date-picker__headline-row">
                  <p class="mdv-date-picker__headline" aria-live="polite" aria-atomic="true">
                    {{ headline }}
                  </p>
                  <button
                    type="button"
                    class="mdv-date-picker__icon"
                    data-date-focus="view"
                    :aria-label="view === 'calendar' ? labels.input : labels.calendar"
                    @click="toggleView"
                  >
                    <MdvIcon :icon="view === 'calendar' ? editIcon : calendarIcon" />
                  </button>
                </div>
              </div>
            </header>
            <DateCalendar
              v-if="view === 'calendar' || layer.layout.value === 'docked'"
              ref="calendar"
              :start="draftStart"
              :end="draftEnd"
              :navigation-date="navigationDate"
              :view-state="calendarState"
              :range="range"
              :docked="layer.layout.value === 'docked'"
              :locale="locale"
              :first-day-of-week="firstDayOfWeek"
              :min="min"
              :max="max"
              :disabled-date="disabledDate"
              :labels="labels"
              @select="select"
              @navigate="navigationDate = $event"
              @state="calendarState = $event"
              @confirm="confirm"
            />
            <div
              v-else
              class="mdv-date-picker__input-view"
              :class="{ 'mdv-date-picker__input-view--range': range }"
              @keydown="onKeydown($event, true)"
              @blur.capture="panelReported = true"
            >
              <MdvTextField
                :id="id + '-draft-start'"
                v-model="panelStart"
                data-date-focus="draft-start"
                :label="range ? startLabel || labels.startLabel : label || labels.dateLabel"
                :form="id + '-draft-form'"
                :required="required"
                :placeholder="format.hint"
                :supporting-text="hint"
                :error="panelReported && !!candidate.issue"
              />
              <MdvTextField
                v-if="range"
                :id="id + '-draft-end'"
                v-model="panelEnd"
                data-date-focus="draft-end"
                :label="endLabel || labels.endLabel"
                :form="id + '-draft-form'"
                :required="required"
                :placeholder="format.hint"
                :supporting-text="hint"
                :error="panelReported && !!candidate.issue"
              />
            </div>
            <p
              :id="id + '-status'"
              class="mdv-date-picker__status"
              :class="{
                'mdv-date-picker__sr': view === 'calendar',
                'mdv-date-picker__status--error': view === 'input' && panelReported && panelMessage,
              }"
              role="status"
              aria-live="polite"
            >
              {{ panelReported ? panelMessage : '' }}
            </p>
            <footer
              v-if="
                !showTopbar &&
                !(layer.layout.value === 'docked' && calendarState && calendarState.mode !== 'days')
              "
              class="mdv-date-picker__actions"
            >
              <MdvButton variant="text" data-date-focus="cancel" @click="layer.close('cancel')">{{
                labels.cancel
              }}</MdvButton>
              <MdvButton
                variant="text"
                data-date-focus="confirm"
                :disabled="!!candidate.issue || disabled || readonly"
                @click="confirm"
                >{{ labels.confirm }}</MdvButton
              >
            </footer>
          </div>
        </div>
      </template>
    </component>
  </div>
</template>
