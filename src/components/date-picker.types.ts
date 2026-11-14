import type { VNode } from 'vue'

/** 公历纯日期，格式 YYYY-MM-DD，支持 0001 至 9999 年。 */
export type MdvDateValue = string | null
export interface MdvDateRange {
  start: string
  end: string
}
export type MdvDateRangeValue = MdvDateRange | null
export type MdvDatePickerLayout = 'auto' | 'docked' | 'modal' | 'fullscreen'
export type MdvDateRangePickerLayout = Exclude<MdvDatePickerLayout, 'docked'>
export type MdvDatePickerView = 'calendar' | 'input'
export type MdvDatePickerCloseReason =
  | 'confirm'
  | 'cancel'
  | 'escape'
  | 'scrim'
  | 'outside'
  | 'blur'
  | 'model'
  | 'programmatic'
  | 'disabled'
export interface MdvDatePickerCloseDetail {
  reason: MdvDatePickerCloseReason
}

/** locale 只控制日期格式；操作与辅助文字可通过此对象覆盖。 */
export interface MdvDatePickerLabels {
  title: string
  rangeTitle: string
  chooseDate: string
  chooseRange: string
  open: string
  calendar: string
  input: string
  cancel: string
  confirm: string
  save: string
  clear: string
  previousMonth: string
  nextMonth: string
  previousYear: string
  nextYear: string
  month: string
  year: string
  previousYears: string
  nextYears: string
  earlierMonths: string
  laterMonths: string
  today: string
  selected: string
  rangeStart: string
  rangeEnd: string
  inRange: string
  unavailable: string
  startLabel: string
  endLabel: string
  dateLabel: string
  formatHint: string
  keyboardHint: string
  invalidDate: string
  required: string
  incompleteRange: string
  reversedRange: string
  outOfBounds: string
  disabledDate: string
  blockedRange: string
  invalidBounds: string
}

export interface MdvDatePickerCommonProps {
  open?: boolean
  initialView?: MdvDatePickerView
  locale?: string
  /** 0 为周日，6 为周六；省略时使用 locale 的周首日。 */
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  min?: string
  max?: string
  disabledDate?: (date: string) => boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  supportingText?: string
  error?: boolean
  errorText?: string
  labels?: Partial<MdvDatePickerLabels>
}
export interface MdvDatePickerProps extends MdvDatePickerCommonProps {
  modelValue?: MdvDateValue
  layout?: MdvDatePickerLayout
  label?: string
  name?: string
}
export interface MdvDateRangePickerProps extends MdvDatePickerCommonProps {
  modelValue?: MdvDateRangeValue
  layout?: MdvDateRangePickerLayout
  startLabel?: string
  endLabel?: string
  startName?: string
  endName?: string
}
export interface MdvDatePickerTriggerProps {
  type: 'button'
  disabled: boolean
  'aria-haspopup': 'dialog'
  'aria-expanded': boolean
  'aria-controls': string
  'aria-label': string
  onClick: (event: MouseEvent) => void
}
export interface MdvDatePickerTriggerSlotProps {
  open: (event?: Event) => Promise<boolean>
  close: () => Promise<boolean>
  triggerProps: MdvDatePickerTriggerProps
}
export interface MdvDatePickerSlots {
  trigger?(props: MdvDatePickerTriggerSlotProps): VNode[]
  title?(): VNode[]
}
export interface MdvDatePickerExpose {
  open: (event?: Event) => Promise<boolean>
  close: () => Promise<boolean>
  focus: (options?: FocusOptions) => void
  checkValidity: () => boolean
  reportValidity: () => boolean
  setCustomValidity: (message: string) => void
}

/** 内部日历浏览状态，用于跨浮层布局保留月份、年份页和滚动位置。 */
export interface DateCalendarViewState {
  mode: 'days' | 'months' | 'years'
  yearPage: number
  firstMonth: string
  monthCount: number
  scrollTop: number
}
