import type { MdvTimePickerHourCycle, MdvTimePickerLabels } from './time-picker.types'

export const timePickerLabels: MdvTimePickerLabels = {
  title: '选择时间',
  time: '时间',
  hour: '小时',
  minute: '分钟',
  period: '时段',
  open: '打开时间选择器',
  dial: '切换到拨盘',
  input: '切换到数字输入',
  cancel: '取消',
  confirm: '确定',
  clear: '清除时间',
  formatHint: '输入格式',
  keyboardHint: '方向键选择时间，Home／End 到首末可选项，空格或 Enter 选择。',
  invalidTime: '请输入有效时间',
  required: '请选择时间',
  outOfBounds: '时间超出允许范围',
  disabledTime: '该时间不可用',
  invalidBounds: '最早／最晚时间无效或顺序错误',
  invalidStep: '分钟步长必须是 60 的正整数约数',
  stepMismatch: '分钟不符合设置的步长',
  noAvailableTime: '没有可用时间',
}
export type TimeIssue =
  | 'invalidTime'
  | 'required'
  | 'outOfBounds'
  | 'disabledTime'
  | 'invalidBounds'
  | 'invalidStep'
  | 'stepMismatch'
export interface TimeConstraints {
  min?: string
  max?: string
  minuteStep?: number
  disabledTime?: (time: string) => boolean
}

export function timeMinutes(value: unknown): number | null {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
}
export function minuteTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
export function timeBounds(constraints: TimeConstraints) {
  const min = constraints.min ? timeMinutes(constraints.min) : 0
  const max = constraints.max ? timeMinutes(constraints.max) : 1439
  const step = constraints.minuteStep ?? 1
  const issue: TimeIssue | null =
    min === null || max === null || min > max
      ? 'invalidBounds'
      : !Number.isInteger(step) || step < 1 || 60 % step !== 0
        ? 'invalidStep'
        : null
  return { min: min ?? 0, max: max ?? 1439, step, issue }
}
export function timeIssue(
  value: unknown,
  required: boolean,
  constraints: TimeConstraints,
): TimeIssue | null {
  const bounds = timeBounds(constraints)
  if (bounds.issue) return bounds.issue
  if (value === null || value === '') return required ? 'required' : null
  const minute = timeMinutes(value)
  if (minute === null) return 'invalidTime'
  if (minute < bounds.min || minute > bounds.max) return 'outOfBounds'
  if (minute % bounds.step !== 0) return 'stepMismatch'
  return constraints.disabledTime?.(minuteTime(minute)) ? 'disabledTime' : null
}

/** 一天最多 1440 项；每次约束变化只对合规分钟调用一次禁用谓词。 */
export function timeAvailability(constraints: TimeConstraints) {
  const bounds = timeBounds(constraints)
  const minutes: number[] = []
  const allowed = new Set<number>()
  const hours = new Set<number>()
  if (!bounds.issue) {
    for (
      let minute = Math.ceil(bounds.min / bounds.step) * bounds.step;
      minute <= bounds.max;
      minute += bounds.step
    ) {
      if (constraints.disabledTime?.(minuteTime(minute))) continue
      minutes.push(minute)
      allowed.add(minute)
      hours.add(Math.floor(minute / 60))
    }
  }
  return { minutes, allowed, hours, issue: bounds.issue }
}
export function nearestTime(minutes: readonly number[], target: number): number | null {
  let best: number | null = null
  for (const minute of minutes) {
    if (best === null || Math.abs(minute - target) < Math.abs(best - target)) best = minute
  }
  return best
}

function formatter(locale: string, options: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
  } catch {
    return new Intl.DateTimeFormat('zh-CN', { ...options, timeZone: 'UTC' })
  }
}
export function timeInputFormat(locale: string, cycle: MdvTimePickerHourCycle = 'auto') {
  const hour12 =
    cycle === 'auto'
      ? !!formatter(locale, { hour: 'numeric' }).resolvedOptions().hour12
      : cycle === 'h12'
  const format = formatter(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: hour12 ? 'h12' : 'h23',
  })
  let numbers: Intl.NumberFormat
  try {
    numbers = new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: 2 })
  } catch {
    numbers = new Intl.NumberFormat('zh-CN', { useGrouping: false, minimumIntegerDigits: 2 })
  }
  const digits = new Map<string, string>()
  const zero = numbers.format(0).slice(-1)
  for (let digit = 0; digit < 10; digit++) {
    digits.set(numbers.format(digit).slice(-1), String(digit))
    digits.set(String.fromCharCode(0xff10 + digit), String(digit))
  }
  function normalize(text: string) {
    return [...text]
      .map((character) => digits.get(character) ?? character)
      .join('')
      .replace(/[\u200e\u200f\u061c\u2066-\u2069]/g, '')
      .replace(/：/g, ':')
      .trim()
  }
  function date(minute: number) {
    return new Date(Date.UTC(2000, 0, 1, Math.floor(minute / 60), minute % 60))
  }
  const periods = [0, 720].map(
    (minute) =>
      format.formatToParts(date(minute)).find((part) => part.type === 'dayPeriod')?.value ??
      (minute ? 'PM' : 'AM'),
  )
  const sampleParts = format.formatToParts(date(13 * 60 + 5))
  const hourIndex = sampleParts.findIndex((item) => item.type === 'hour')
  const separator = normalize(
    sampleParts[hourIndex + 1]?.type === 'literal' ? sampleParts[hourIndex + 1]!.value : ':',
  )
  function parse(text: string): string | null {
    let normalized = normalize(text).toLocaleLowerCase()
    if (separator && separator !== ':') normalized = normalized.replace(separator, ':')
    let period: number | null = null
    if (hour12) {
      for (const [index, names] of [
        [periods[0]!, 'AM', 'am'],
        [periods[1]!, 'PM', 'pm'],
      ].entries()) {
        for (const name of names) {
          const token = normalize(name).toLocaleLowerCase()
          if (normalized.startsWith(token)) {
            period = index
            normalized = normalized.slice(token.length).trim()
            break
          }
          if (normalized.endsWith(token)) {
            period = index
            normalized = normalized.slice(0, -token.length).trim()
            break
          }
        }
        if (period !== null) break
      }
      if (period === null) return null
    }
    const match = /^(\d{1,2}):(\d{1,2})$/.exec(normalized)
    if (!match) return null
    let hour = Number(match[1])
    const minute = Number(match[2])
    if (minute > 59 || hour > (hour12 ? 12 : 23) || (hour12 && hour === 0)) return null
    if (hour12) hour = (hour % 12) + period! * 12
    return minuteTime(hour * 60 + minute)
  }
  return {
    hour12,
    periods: periods as [string, string],
    normalize,
    number: (value: number, padded = true) => {
      const text = numbers.format(value)
      return !padded && value < 10 ? text.slice(zero.length) : text
    },
    format: (value: string | null) => {
      if (value === null) return ''
      const minute = timeMinutes(value)
      return minute === null ? value : format.format(date(minute))
    },
    parse,
    hint: hour12 ? format.format(date(13 * 60 + 5)) : 'HH:mm',
  }
}

/** 坐标已经换算到 256px 拨盘；24 小时外圈 00–11、内圈 12–23。 */
export function timeAtPoint(
  x: number,
  y: number,
  part: 'hour' | 'minute',
  hour12: boolean,
  step = 1,
) {
  const dx = x - 128
  const dy = y - 128
  const turns = (Math.atan2(dx, -dy) / (Math.PI * 2) + 1) % 1
  if (part === 'minute') return (Math.round((turns * 60) / step) * step) % 60
  const hour = Math.round(turns * 12) % 12
  return hour + (!hour12 && Math.hypot(dx, dy) < 86 ? 12 : 0)
}
