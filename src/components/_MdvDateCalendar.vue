<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import chevronLeft from '@iconify-icons/material-symbols/chevron-left'
import chevronRight from '@iconify-icons/material-symbols/chevron-right'
import arrowDropDown from '@iconify-icons/material-symbols/arrow-drop-down'
import checkIcon from '@iconify-icons/material-symbols/check'
import MdvIcon from './MdvIcon.vue'
import {
  addDays,
  calendarDate,
  dateFormatter,
  dateParts,
  dayIssue,
  daysInMonth,
  isoDate,
  localToday,
  localeWeekStart,
  monthStart,
  shiftMonth,
} from './date-picker-date'
import type { DateCalendarViewState, MdvDatePickerLabels } from './date-picker.types'

const props = defineProps<{
  start: string | null
  end: string | null
  range: boolean
  docked: boolean
  locale: string
  firstDayOfWeek?: number
  min?: string
  max?: string
  disabledDate?: (date: string) => boolean
  navigationDate?: string
  viewState?: DateCalendarViewState
  labels: MdvDatePickerLabels
}>()
const emit = defineEmits<{
  select: [date: string]
  navigate: [date: string]
  state: [state: DateCalendarViewState]
  confirm: []
}>()
const id = `mdv-calendar-${useId()}`
const root = useTemplateRef<HTMLElement>('root')
const viewport = useTemplateRef<HTMLElement>('viewport')
// 组件只在客户端打开面板后挂载，今天不会参与 SSR 的确定输出。
const today = localToday()
function initialDate() {
  const start =
    props.navigationDate && dateParts(props.navigationDate)
      ? props.navigationDate
      : props.start && dateParts(props.start)
        ? props.start
        : today
  return props.min && dateParts(props.min) && start < props.min
    ? props.min
    : props.max && dateParts(props.max) && start > props.max
      ? props.max
      : start
}
const focused = ref(initialDate())
const month = ref(monthStart(focused.value))
const mode = ref<'days' | 'months' | 'years'>(
  !props.docked && props.viewState?.mode === 'months' ? 'years' : (props.viewState?.mode ?? 'days'),
)
const yearPage = ref(props.viewState?.yearPage ?? Math.max(1, dateParts(month.value)!.year - 11))
const firstMonth = ref(props.viewState?.firstMonth ?? month.value)
const monthCount = ref(props.viewState?.monthCount ?? 3)
const savedState: DateCalendarViewState = props.viewState ?? {
  mode: mode.value,
  yearPage: yearPage.value,
  firstMonth: firstMonth.value,
  monthCount: monthCount.value,
  scrollTop: 0,
}
function saveView() {
  Object.assign(savedState, {
    mode: mode.value,
    yearPage: yearPage.value,
    firstMonth: firstMonth.value,
    monthCount: monthCount.value,
    scrollTop: viewport.value?.scrollTop ?? savedState.scrollTop,
  })
  emit('state', { ...savedState })
}
watch([mode, yearPage, firstMonth, monthCount], saveView, { flush: 'sync' })
const weekStart = computed(() => props.firstDayOfWeek ?? localeWeekStart(props.locale))
const fullFormat = computed(() => dateFormatter(props.locale, { dateStyle: 'full' }))
const monthFormat = computed(() => dateFormatter(props.locale, { month: 'long' }))
const shortMonthFormat = computed(() => dateFormatter(props.locale, { month: 'short' }))
const headingFormat = computed(() =>
  dateFormatter(props.locale, { year: 'numeric', month: 'long' }),
)
const weekdayFormat = computed(() => dateFormatter(props.locale, { weekday: 'narrow' }))
const weekdayLabelFormat = computed(() => dateFormatter(props.locale, { weekday: 'long' }))
const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = calendarDate(addDays('2026-11-01', (weekStart.value + index) % 7))
    return { text: weekdayFormat.value.format(date), label: weekdayLabelFormat.value.format(date) }
  }),
)
const currentYear = computed(() => dateParts(month.value)!.year)
const years = computed(() =>
  Array.from(
    { length: Math.min(24, 10000 - yearPage.value) },
    (_, index) => yearPage.value + index,
  ),
)
const monthNames = computed(() =>
  Array.from({ length: 12 }, (_, index) =>
    monthFormat.value.format(calendarDate(isoDate(currentYear.value, index + 1, 1))),
  ),
)
const months = computed(() => {
  if (!props.range) return [month.value]
  const result = [firstMonth.value]
  for (let index = 1; index < monthCount.value; index++) {
    const next = shiftMonth(result[result.length - 1]!, 1)
    if (next === result[result.length - 1]) break
    result.push(next)
  }
  return result
})
const firstAllowedMonth = computed(() =>
  props.min && dateParts(props.min) ? monthStart(props.min) : '0001-01-01',
)
const lastAllowedMonth = computed(() =>
  props.max && dateParts(props.max) ? monthStart(props.max) : '9999-12-01',
)
function weeks(value: string) {
  const parts = dateParts(value)!
  const leading = (calendarDate(value).getUTCDay() - weekStart.value + 7) % 7
  const count = daysInMonth(parts.year, parts.month)
  return Array.from({ length: Math.ceil((leading + count) / 7) }, (_, row) =>
    Array.from({ length: 7 }, (_, column) => {
      const day = row * 7 + column - leading + 1
      if (day >= 1 && day <= count) return isoDate(parts.year, parts.month, day)
      if (!props.docked) return null
      const adjacent = addDays(value, day - 1)
      // addDays 在 0001 / 9999 年边界钳位，不重复渲染被钳位的日期。
      return day < 1
        ? adjacent < value
          ? adjacent
          : null
        : adjacent > isoDate(parts.year, parts.month, count)
          ? adjacent
          : null
    }),
  )
}
function unavailable(date: string) {
  return !!dayIssue(date, props)
}
function inRange(date: string) {
  return !!(props.range && props.start && props.end && date >= props.start && date <= props.end)
}
function selected(date: string) {
  return date === props.start || (props.range && date === props.end)
}
function dateLabel(date: string) {
  return [
    fullFormat.value.format(calendarDate(date)),
    date === today ? props.labels.today : '',
    date === props.start ? (props.range ? props.labels.rangeStart : props.labels.selected) : '',
    props.range && date === props.end ? props.labels.rangeEnd : '',
    inRange(date) && !selected(date) ? props.labels.inRange : '',
    unavailable(date) ? props.labels.unavailable : '',
  ]
    .filter(Boolean)
    .join('，')
}
function reveal(element: HTMLElement | null | undefined, center = false) {
  if (!element) return
  const scroller =
    mode.value !== 'days'
      ? root.value?.querySelector<HTMLElement>('.mdv-date-calendar__chooser')
      : props.range
        ? viewport.value
        : root.value?.closest<HTMLElement>('.mdv-date-picker__surface')
  if (!scroller) return
  const target = element.getBoundingClientRect()
  const box = scroller.getBoundingClientRect()
  const top =
    box.top +
    (props.range
      ? (scroller.querySelector<HTMLElement>('.mdv-date-calendar__weekdays')?.offsetHeight ?? 0)
      : 0)
  if (center) scroller.scrollTop += (target.top + target.bottom - box.top - box.bottom) / 2
  else if (target.top < top) scroller.scrollTop += target.top - top
  else if (target.bottom > box.bottom) scroller.scrollTop += target.bottom - box.bottom
}
async function focusDate(date: string) {
  focused.value = date
  month.value = monthStart(date)
  if (
    props.range &&
    (month.value < firstMonth.value || month.value > months.value[months.value.length - 1]!)
  ) {
    firstMonth.value = month.value
    monthCount.value = 3
  }
  mode.value = 'days'
  await nextTick()
  const button = root.value?.querySelector<HTMLElement>(`[data-date="${date}"]`)
  button?.focus({ preventScroll: true })
  // 只滚动日期面板自己的视口，避免原生 scrollIntoView 连带移动锚点所在页面。
  reveal(button)
}
function choose(date: string) {
  if (unavailable(date)) return
  const adjacent = monthStart(date) !== month.value
  focused.value = date
  month.value = monthStart(date)
  emit('select', date)
  if (adjacent && !props.range) void focusDate(date)
}
function focusDay(date: string, event: FocusEvent) {
  focused.value = date
  reveal(event.currentTarget as HTMLElement)
}
function navigate(amount: number) {
  void focusDate(shiftMonth(focused.value, amount))
}
function keydown(event: KeyboardEvent, date: string) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey)
    return
  const rtl =
    root.value?.ownerDocument.defaultView?.getComputedStyle(root.value).direction === 'rtl'
  const offset = (calendarDate(date).getUTCDay() - weekStart.value + 7) % 7
  let target: string | undefined
  switch (event.key) {
    case 'ArrowLeft':
      target = addDays(date, rtl ? 1 : -1)
      break
    case 'ArrowRight':
      target = addDays(date, rtl ? -1 : 1)
      break
    case 'ArrowUp':
      target = addDays(date, -7)
      break
    case 'ArrowDown':
      target = addDays(date, 7)
      break
    case 'Home':
      target = addDays(date, -offset)
      break
    case 'End':
      target = addDays(date, 6 - offset)
      break
    case 'PageUp':
      target = shiftMonth(date, event.shiftKey ? -12 : -1)
      break
    case 'PageDown':
      target = shiftMonth(date, event.shiftKey ? 12 : 1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      event.stopPropagation()
      if (!unavailable(date)) {
        choose(date)
        if (event.key === 'Enter' && !props.range) emit('confirm')
      }
      return
    default:
      return
  }
  event.preventDefault()
  event.stopPropagation()
  void focusDate(target)
}
function shortcut(event: KeyboardEvent) {
  if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return
  const target = (event.target as HTMLElement).tagName
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target)) return
  const key = event.key.toLowerCase()
  if (key === 'm' || key === 'y') {
    event.preventDefault()
    root.value
      ?.querySelector<HTMLElement>(
        `[data-date-focus="${key === 'm' && props.docked ? 'month' : 'year'}"]`,
      )
      ?.focus()
  }
}
async function showMode(value: 'months' | 'years') {
  mode.value = mode.value === value ? 'days' : value
  yearPage.value = Math.max(1, Math.min(9976, currentYear.value - 11))
  await nextTick()
  const choice = root.value?.querySelector<HTMLElement>('[data-choice="true"]')
  choice?.focus({ preventScroll: true })
  reveal(choice, true)
}
function chooseMonth(number: number) {
  const parts = dateParts(focused.value)!
  void focusDate(
    isoDate(currentYear.value, number, Math.min(parts.day, daysInMonth(currentYear.value, number))),
  )
}
async function chooseYear(year: number) {
  const parts = dateParts(focused.value)!
  await focusDate(isoDate(year, parts.month, Math.min(parts.day, daysInMonth(year, parts.month))))
}
function chooserKeydown(event: KeyboardEvent) {
  if (
    !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'].includes(
      event.key,
    )
  )
    return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    const previous = mode.value
    mode.value = 'days'
    void nextTick(() =>
      root.value
        ?.querySelector<HTMLElement>(
          `[data-date-focus="${previous === 'years' ? 'year' : 'month'}"]`,
        )
        ?.focus(),
    )
    return
  }
  const buttons = [
    ...(root.value?.querySelectorAll<HTMLButtonElement>('.mdv-date-calendar__choice') ?? []),
  ]
  const index = buttons.indexOf(event.target as HTMLButtonElement)
  if (index < 0) return
  const rtl =
    root.value?.ownerDocument.defaultView?.getComputedStyle(root.value).direction === 'rtl'
  const step =
    event.key === 'ArrowLeft'
      ? rtl
        ? 1
        : -1
      : event.key === 'ArrowRight'
        ? rtl
          ? -1
          : 1
        : event.key === 'ArrowUp'
          ? props.docked
            ? -1
            : -3
          : props.docked
            ? 1
            : 3
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : Math.max(0, Math.min(buttons.length - 1, index + step))
  event.preventDefault()
  buttons[next]?.focus({ preventScroll: true })
  reveal(buttons[next])
}
let extending = false
async function extend(earlier: boolean, automatic = false) {
  if (extending) return
  const first = months.value[0]!
  const last = months.value[months.value.length - 1]!
  if (earlier ? first <= firstAllowedMonth.value : last >= lastAllowedMonth.value) return
  // 自动滚动最多保留 18 个月；翻页入口在上限后仍可继续浏览。
  if (automatic && monthCount.value >= 18) return
  extending = true
  const element = viewport.value
  const previousHeight = element?.scrollHeight ?? 0
  const previousTop = element?.scrollTop ?? 0
  if (monthCount.value < 18) {
    if (earlier) firstMonth.value = shiftMonth(firstMonth.value, -3)
    monthCount.value = Math.min(18, monthCount.value + 3)
  } else {
    firstMonth.value = shiftMonth(firstMonth.value, earlier ? -3 : 3)
    // 手动换窗时恢复日历的唯一 Tab 停点。
    focused.value = earlier ? firstMonth.value : shiftMonth(firstMonth.value, 15)
  }
  await nextTick()
  if (element)
    element.scrollTop = earlier
      ? Math.max(0, previousTop + element.scrollHeight - previousHeight)
      : previousTop
  extending = false
}
function scroll() {
  const element = viewport.value
  if (element) saveView()
  if (!element || element.clientHeight === 0 || extending) return
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 120)
    void extend(false, true)
}
let touch: { x: number; y: number } | undefined
function touchStart(event: TouchEvent) {
  const point = event.touches[0]
  touch = event.touches.length === 1 && point ? { x: point.clientX, y: point.clientY } : undefined
}
function touchEnd(event: TouchEvent) {
  const point = event.changedTouches[0]
  if (!props.range && point && touch && mode.value === 'days') {
    const dx = point.clientX - touch.x
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(point.clientY - touch.y) * 1.5) {
      const rtl =
        root.value?.ownerDocument.defaultView?.getComputedStyle(root.value).direction === 'rtl'
      navigate(dx > 0 ? (rtl ? 1 : -1) : rtl ? -1 : 1)
    }
  }
  touch = undefined
}
watch(
  () => props.start,
  (date) => {
    if (date && dateParts(date) && !root.value?.contains(root.value.ownerDocument.activeElement)) {
      focused.value = date
      month.value = monthStart(date)
      if (
        props.range &&
        (month.value < firstMonth.value || month.value > months.value[months.value.length - 1]!)
      )
        firstMonth.value = month.value
    }
  },
)
onMounted(() => {
  if (viewport.value) viewport.value.scrollTop = savedState.scrollTop
  saveView()
})
watch(focused, (date) => emit('navigate', date))
defineExpose({ focus: () => focusDate(focused.value) })
</script>

<template>
  <div
    ref="root"
    class="mdv-date-calendar"
    :class="{
      'mdv-date-calendar--docked': docked,
      'mdv-date-calendar--range': range,
      'mdv-date-calendar--choosing': mode !== 'days',
    }"
    @keydown="shortcut"
  >
    <div
      v-if="!range"
      class="mdv-date-calendar__navigation"
      :class="{ 'mdv-date-calendar__navigation--docked': docked }"
    >
      <div v-if="docked" class="mdv-date-calendar__month-navigation">
        <button
          v-show="mode === 'days'"
          type="button"
          class="mdv-date-picker__icon"
          :aria-label="labels.previousMonth"
          data-date-focus="previous-month"
          :disabled="month <= firstAllowedMonth"
          @click="navigate(-1)"
        >
          <MdvIcon :icon="chevronLeft" />
        </button>
        <button
          type="button"
          class="mdv-date-calendar__heading"
          data-date-focus="month"
          :aria-label="labels.month"
          :aria-expanded="mode === 'months'"
          :aria-controls="id + '-choices'"
          :disabled="mode === 'years'"
          @click="showMode('months')"
        >
          {{ shortMonthFormat.format(calendarDate(month)) }}
          <MdvIcon :icon="arrowDropDown" class="mdv-date-calendar__dropdown" />
        </button>
        <button
          v-show="mode === 'days'"
          type="button"
          class="mdv-date-picker__icon"
          :aria-label="labels.nextMonth"
          data-date-focus="next-month"
          :disabled="month >= lastAllowedMonth"
          @click="navigate(1)"
        >
          <MdvIcon :icon="chevronRight" />
        </button>
      </div>
      <div v-if="docked" class="mdv-date-calendar__year-navigation">
        <button
          v-show="mode === 'days'"
          type="button"
          class="mdv-date-picker__icon"
          :aria-label="labels.previousYear"
          data-date-focus="previous-year"
          :disabled="currentYear <= 1"
          @click="navigate(-12)"
        >
          <MdvIcon :icon="chevronLeft" />
        </button>
        <button
          type="button"
          class="mdv-date-calendar__heading"
          data-date-focus="year"
          :aria-label="labels.year"
          :aria-expanded="mode === 'years'"
          :aria-controls="id + '-choices'"
          :disabled="mode === 'months'"
          @click="showMode('years')"
        >
          {{ currentYear }}
          <MdvIcon :icon="arrowDropDown" class="mdv-date-calendar__dropdown" />
        </button>
        <button
          v-show="mode === 'days'"
          type="button"
          class="mdv-date-picker__icon"
          :aria-label="labels.nextYear"
          data-date-focus="next-year"
          :disabled="currentYear >= 9999"
          @click="navigate(12)"
        >
          <MdvIcon :icon="chevronRight" />
        </button>
      </div>
      <template v-else>
        <button
          type="button"
          class="mdv-date-calendar__heading mdv-date-calendar__heading--combined"
          data-date-focus="year"
          :aria-label="`${headingFormat.format(calendarDate(month))}，${labels.year}`"
          :aria-expanded="mode === 'years'"
          :aria-controls="id + '-choices'"
          @click="showMode('years')"
        >
          {{ headingFormat.format(calendarDate(month)) }}
          <MdvIcon :icon="arrowDropDown" class="mdv-date-calendar__dropdown" />
        </button>
        <div v-show="mode === 'days'" class="mdv-date-calendar__month-navigation">
          <button
            type="button"
            class="mdv-date-picker__icon mdv-date-calendar__previous"
            :aria-label="labels.previousMonth"
            data-date-focus="previous-month"
            :disabled="month <= firstAllowedMonth"
            @click="navigate(-1)"
          >
            <MdvIcon :icon="chevronLeft" />
          </button>
          <button
            type="button"
            class="mdv-date-picker__icon mdv-date-calendar__next"
            :aria-label="labels.nextMonth"
            data-date-focus="next-month"
            :disabled="month >= lastAllowedMonth"
            @click="navigate(1)"
          >
            <MdvIcon :icon="chevronRight" />
          </button>
        </div>
      </template>
    </div>
    <p class="mdv-date-picker__sr" aria-live="polite" aria-atomic="true">
      {{ headingFormat.format(calendarDate(month)) }}
    </p>
    <p :id="id + '-hint'" class="mdv-date-picker__sr">
      {{ labels.keyboardHint }}
    </p>
    <div v-if="mode !== 'days'" class="mdv-date-calendar__chooser" @keydown="chooserKeydown">
      <div v-if="mode === 'years'" class="mdv-date-calendar__year-pages">
        <button
          type="button"
          class="mdv-date-picker__icon"
          :aria-label="labels.previousYears"
          data-date-focus="earlier-years"
          :disabled="yearPage <= 1"
          @click="yearPage = Math.max(1, yearPage - 24)"
        >
          <MdvIcon :icon="chevronLeft" />
        </button>
        <span aria-live="polite">{{ yearPage }} – {{ years[years.length - 1] }}</span>
        <button
          type="button"
          class="mdv-date-picker__icon"
          :aria-label="labels.nextYears"
          data-date-focus="later-years"
          :disabled="yearPage + 24 > 9999"
          @click="yearPage = Math.min(9976, yearPage + 24)"
        >
          <MdvIcon :icon="chevronRight" />
        </button>
      </div>
      <div
        :id="id + '-choices'"
        class="mdv-date-calendar__choices"
        role="group"
        :aria-label="mode === 'years' ? labels.year : labels.month"
      >
        <template v-if="mode === 'years'">
          <button
            v-for="year in years"
            :key="year"
            type="button"
            class="mdv-date-calendar__choice"
            :aria-pressed="year === currentYear"
            :data-choice="year === currentYear"
            :data-date-focus="`year-${year}`"
            @focus="reveal($event.currentTarget as HTMLElement)"
            @click="chooseYear(year)"
          >
            <MdvIcon v-if="docked" :icon="checkIcon" class="mdv-date-calendar__check" />
            <span>{{ year }}</span>
          </button>
        </template>
        <template v-else>
          <button
            v-for="(name, index) in monthNames"
            :key="index"
            type="button"
            class="mdv-date-calendar__choice"
            :aria-pressed="index + 1 === dateParts(month)!.month"
            :data-choice="index + 1 === dateParts(month)!.month"
            :data-date-focus="`month-${index + 1}`"
            @focus="reveal($event.currentTarget as HTMLElement)"
            @click="chooseMonth(index + 1)"
          >
            <MdvIcon v-if="docked" :icon="checkIcon" class="mdv-date-calendar__check" />
            <span>{{ name }}</span>
          </button>
        </template>
      </div>
    </div>
    <div
      v-if="mode === 'days'"
      ref="viewport"
      class="mdv-date-calendar__viewport"
      :class="{ 'mdv-date-calendar__viewport--range': range }"
      @scroll.passive="scroll"
      @touchstart.passive="touchStart"
      @touchend.passive="touchEnd"
      @touchcancel="touch = undefined"
    >
      <div
        v-if="range"
        class="mdv-date-calendar__week mdv-date-calendar__weekdays"
        aria-hidden="true"
      >
        <span v-for="(day, index) in weekdays" :key="index" class="mdv-date-calendar__weekday">{{
          day.text
        }}</span>
      </div>
      <button
        v-if="range"
        type="button"
        class="mdv-date-calendar__load"
        :disabled="months[0]! <= firstAllowedMonth"
        data-date-focus="earlier-months"
        @click="extend(true)"
      >
        {{ labels.earlierMonths }}
      </button>
      <div v-for="visibleMonth in months" :key="visibleMonth" class="mdv-date-calendar__month">
        <h3 v-if="range" :id="id + '-' + visibleMonth" class="mdv-date-calendar__month-title">
          {{ headingFormat.format(calendarDate(visibleMonth)) }}
        </h3>
        <div
          role="grid"
          :aria-label="headingFormat.format(calendarDate(visibleMonth))"
          :aria-labelledby="range ? id + '-' + visibleMonth : undefined"
          :aria-multiselectable="range || undefined"
          :aria-describedby="id + '-hint'"
        >
          <div
            role="row"
            :class="
              range ? 'mdv-date-picker__sr' : 'mdv-date-calendar__week mdv-date-calendar__weekdays'
            "
          >
            <span
              v-for="(day, index) in weekdays"
              :key="index"
              role="columnheader"
              :aria-label="day.label"
              class="mdv-date-calendar__weekday"
              >{{ day.text }}</span
            >
          </div>
          <div
            v-for="(week, row) in weeks(visibleMonth)"
            :key="row"
            role="row"
            class="mdv-date-calendar__week"
          >
            <div
              v-for="(date, column) in week"
              :key="column"
              role="gridcell"
              :aria-selected="date ? selected(date) || inRange(date) : undefined"
              class="mdv-date-calendar__cell"
              :class="{
                'mdv-date-calendar__cell--range': date && inRange(date),
                'mdv-date-calendar__cell--start': date === start,
                'mdv-date-calendar__cell--end': date === end,
                'mdv-date-calendar__cell--same': date === start && date === end,
              }"
            >
              <button
                v-if="date"
                type="button"
                class="mdv-date-calendar__day"
                :data-date="date"
                :data-date-focus="date"
                :tabindex="focused === date ? 0 : -1"
                :aria-label="dateLabel(date)"
                :aria-current="date === today ? 'date' : undefined"
                :aria-disabled="unavailable(date) || undefined"
                :class="{
                  'mdv-date-calendar__day--selected': selected(date),
                  'mdv-date-calendar__day--today': date === today,
                  'mdv-date-calendar__day--adjacent': date.slice(0, 7) !== visibleMonth.slice(0, 7),
                }"
                @focus="focusDay(date, $event)"
                @click="choose(date)"
                @keydown="keydown($event, date)"
              >
                <span>{{ Number(date.slice(8)) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <button
        v-if="range"
        type="button"
        class="mdv-date-calendar__load"
        :disabled="months[months.length - 1]! >= lastAllowedMonth"
        data-date-focus="later-months"
        @click="extend(false)"
      >
        {{ labels.laterMonths }}
      </button>
    </div>
  </div>
</template>
