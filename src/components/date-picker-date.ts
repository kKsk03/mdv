import type { MdvDatePickerLabels, MdvDateRangeValue, MdvDateValue } from './date-picker.types'

export const datePickerLabels: MdvDatePickerLabels = {
  title: '选择日期',
  rangeTitle: '选择日期范围',
  chooseDate: '请选择日期',
  chooseRange: '请选择开始和结束日期',
  open: '打开日期选择器',
  calendar: '切换到日历选择',
  input: '输入日期',
  cancel: '取消',
  confirm: '确定',
  save: '保存',
  clear: '清除日期',
  previousMonth: '上个月',
  nextMonth: '下个月',
  previousYear: '上一年',
  nextYear: '下一年',
  month: '选择月份',
  year: '选择年份',
  previousYears: '更早年份',
  nextYears: '更晚年份',
  earlierMonths: '更早月份',
  laterMonths: '更晚月份',
  today: '今天',
  selected: '已选择',
  rangeStart: '开始日期',
  rangeEnd: '结束日期',
  inRange: '在所选范围内',
  unavailable: '不可选择',
  startLabel: '开始日期',
  endLabel: '结束日期',
  dateLabel: '日期',
  formatHint: '日期格式',
  keyboardHint:
    '方向键按日或周移动，Home / End 到本周首末，PageUp / PageDown 按月移动，配合 Shift 按年移动。空格选择，单日模式 Enter 选择并确认。Shift+M / Shift+Y 聚焦月份或年份。',
  invalidDate: '请输入有效的公历日期和四位年份',
  required: '请选择日期',
  incompleteRange: '请填写完整的开始和结束日期',
  reversedRange: '结束日期不能早于开始日期',
  outOfBounds: '日期超出允许范围',
  disabledDate: '此日期不可选择',
  blockedRange: '所选范围包含不可选择的日期',
  invalidBounds: '日期上下限无效',
}

export interface DateParts {
  year: number
  month: number
  day: number
}
export interface DateConstraints {
  min?: string
  max?: string
  disabledDate?: (date: string) => boolean
}
export type DateIssue =
  | 'invalidDate'
  | 'required'
  | 'incompleteRange'
  | 'reversedRange'
  | 'outOfBounds'
  | 'disabledDate'
  | 'blockedRange'
  | 'invalidBounds'

export function daysInMonth(year: number, month: number) {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}
export function isoDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
export function dateParts(value: string): DateParts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  return year >= 1 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
    ? { year, month, day }
    : null
}

// 只用数值构造 UTC 日期做公历运算；不解析日期字符串，也不把模型转换成本地时间戳。
export function calendarDate(value: string) {
  const parts = dateParts(value)!
  const result = new Date(0)
  result.setUTCHours(0, 0, 0, 0)
  result.setUTCFullYear(parts.year, parts.month - 1, parts.day)
  return result
}
export function addDays(value: string, amount: number) {
  const result = calendarDate(value)
  result.setUTCDate(result.getUTCDate() + amount)
  if (result.getUTCFullYear() < 1) return '0001-01-01'
  if (result.getUTCFullYear() > 9999) return '9999-12-31'
  return isoDate(result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate())
}
export function shiftMonth(value: string, amount: number) {
  const parts = dateParts(value)!
  const total = Math.max(12, Math.min(9999 * 12 + 11, parts.year * 12 + parts.month - 1 + amount))
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  return isoDate(year, month, Math.min(parts.day, daysInMonth(year, month)))
}
export function monthStart(value: string) {
  return `${value.slice(0, 7)}-01`
}
export function localToday() {
  const date = new Date()
  return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}
export function dateLocale(locale: string) {
  try {
    return Intl.getCanonicalLocales(locale)[0] || 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}
export function dateFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    ...options,
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })
}
export function inputDateFormat(locale: string) {
  const formatter = dateFormatter(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(calendarDate('2006-11-22'))
  const order = parts
    .filter((part) => ['year', 'month', 'day'].includes(part.type))
    .map((part) => part.type)
  return {
    order,
    hint: parts
      .map((part) => ({ year: 'YYYY', month: 'MM', day: 'DD' })[part.type as 'year'] ?? part.value)
      .join(''),
    format(value: string) {
      if (!dateParts(value)) return value
      return formatter
        .formatToParts(calendarDate(value))
        .map((part) => (part.type === 'year' ? part.value.padStart(4, '0') : part.value))
        .join('')
    },
  }
}
export function parseInputDate(text: string, locale: string): string | null {
  const value = text.trim().replace(/[\u200e\u200f\u061c]/g, '')
  if (dateParts(value)) return value
  // 形似 ISO 的输入必须按 ISO 校验，不能回退后把无效日期解释成另一种顺序。
  let pieces: string[]
  let order = inputDateFormat(locale).order
  if (/^\d{4}[-/. ]\d{1,2}[-/. ]\d{1,2}$/.test(value)) {
    pieces = value.split(/[-/. ]/)
    order = ['year', 'month', 'day']
  } else if (/^\d{8}$/.test(value)) {
    let cursor = 0
    pieces = order.map((part) => {
      const length = part === 'year' ? 4 : 2
      const piece = value.slice(cursor, cursor + length)
      cursor += length
      return piece
    })
  } else {
    if (!/^\d{1,4}(?:[/.\-\s年]+)\d{1,4}(?:[/.\-\s月]+)\d{1,4}日?$/.test(value)) return null
    pieces = value.replace(/日$/, '').split(/[/.\-\s年月]+/)
  }
  const fields = Object.fromEntries(order.map((part, index) => [part, pieces[index]]))
  if (
    fields.year?.length !== 4 ||
    !fields.month ||
    !fields.day ||
    fields.month.length > 2 ||
    fields.day.length > 2
  )
    return null
  const result = isoDate(Number(fields.year), Number(fields.month), Number(fields.day))
  return dateParts(result) ? result : null
}
export function localeWeekStart(locale: string): number {
  // weekInfo/getWeekInfo 分别对应现有浏览器中的两版 Intl.Locale API。
  const info = new Intl.Locale(dateLocale(locale)) as Intl.Locale & {
    weekInfo?: { firstDay: number }
    getWeekInfo?: () => { firstDay: number }
  }
  return (info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay ?? 1) % 7
}
export function boundsIssue(constraints: DateConstraints): DateIssue | null {
  const { min, max } = constraints
  return (min !== undefined && !dateParts(min)) ||
    (max !== undefined && !dateParts(max)) ||
    (min && max && min > max)
    ? 'invalidBounds'
    : null
}
export function dayIssue(value: string, constraints: DateConstraints): DateIssue | null {
  if (!dateParts(value)) return 'invalidDate'
  if (boundsIssue(constraints)) return 'invalidBounds'
  if ((constraints.min && value < constraints.min) || (constraints.max && value > constraints.max))
    return 'outOfBounds'
  return constraints.disabledDate?.(value) ? 'disabledDate' : null
}
export function selectionIssue(
  start: string | null,
  end: string | null,
  range: boolean,
  required: boolean,
  constraints: DateConstraints,
): DateIssue | null {
  const bounds = boundsIssue(constraints)
  if (bounds) return bounds
  if (!start && !end) return required ? 'required' : null
  if (range && (!start || !end)) return 'incompleteRange'
  if (!start) return 'required'
  const issue = dayIssue(start, constraints) || (end ? dayIssue(end, constraints) : null)
  if (issue) return issue
  if (!range || !end) return null
  if (end < start) return 'reversedRange'
  if (constraints.disabledDate) {
    // 无禁用谓词时为 O(1)；有谓词时逐日短路，不能只检查两个端点。
    for (let date = start; date < end;) {
      date = addDays(date, 1)
      if (constraints.disabledDate(date)) return 'blockedRange'
    }
  }
  return null
}
export function selectionParts(
  value: MdvDateValue | MdvDateRangeValue,
): [string | null, string | null] {
  return typeof value === 'string' ? [value, null] : [value?.start ?? null, value?.end ?? null]
}
