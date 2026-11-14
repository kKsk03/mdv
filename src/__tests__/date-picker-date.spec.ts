import { describe, expect, it, vi } from 'vitest'
import {
  addDays,
  calendarDate,
  dateParts,
  inputDateFormat,
  parseInputDate,
  selectionIssue,
  shiftMonth,
} from '../components/date-picker-date'

describe('Date Picker 的纯日期边界', () => {
  it('严格校验公历闰年及年份边界，不使用 Date 的宽松纠错', () => {
    expect(dateParts('2000-02-29')).toEqual({ year: 2000, month: 2, day: 29 })
    for (const value of ['1900-02-29', '2026-04-31', '0000-01-01', '10000-01-01', '2026-1-01'])
      expect(dateParts(value)).toBeNull()
    expect(calendarDate('0001-01-01').getUTCFullYear()).toBe(1)
    expect(addDays('2000-02-28', 1)).toBe('2000-02-29')
    expect(addDays('1900-02-28', 1)).toBe('1900-03-01')
    expect(addDays('0001-01-01', -1)).toBe('0001-01-01')
    expect(addDays('9999-12-31', 1)).toBe('9999-12-31')
  })
  it('月末和跨年移动保留有效的日期，不溢出到下个月', () => {
    expect(shiftMonth('2024-01-31', 1)).toBe('2024-02-29')
    expect(shiftMonth('2024-02-29', 12)).toBe('2025-02-28')
    expect(shiftMonth('2026-01-31', -1)).toBe('2025-12-31')
    expect(shiftMonth('9999-12-31', 1)).toBe('9999-12-31')
  })
  it('按地区顺序解析文本，接受明确 ISO，拒绝两位年份和含糊输入', () => {
    expect(parseInputDate('3/4/2026', 'en-US')).toBe('2026-03-04')
    expect(parseInputDate('3 / 4 / 2026', 'en-GB')).toBe('2026-04-03')
    expect(parseInputDate('2026-3-4', 'en-GB')).toBe('2026-03-04')
    expect(parseInputDate('2026.3.4', 'zh-CN')).toBe('2026-03-04')
    expect(parseInputDate('03042026', 'en-GB')).toBe('2026-04-03')
    expect(parseInputDate('2026-02-30', 'en-US')).toBeNull()
    expect(parseInputDate('3/4/26', 'en-US')).toBeNull()
    expect(parseInputDate('1142026', 'en-US')).toBeNull()
    expect(parseInputDate(inputDateFormat('ar-EG').format('0001-03-04'), 'ar-EG')).toBe(
      '0001-03-04',
    )
  })
  it('范围包括两端，允许同日，拒绝倒序及跨越内部禁用日期', () => {
    const constraints = {
      min: '2026-11-14',
      max: '2026-11-18',
      disabledDate: (date: string) => date === '2026-11-16',
    }
    expect(selectionIssue('2026-11-14', '2026-11-14', true, true, constraints)).toBeNull()
    expect(selectionIssue('2026-11-14', '2026-11-18', true, true, constraints)).toBe('blockedRange')
    expect(selectionIssue('2026-11-18', '2026-11-14', true, true, constraints)).toBe(
      'reversedRange',
    )
    expect(selectionIssue('2026-11-14', null, true, false, constraints)).toBe('incompleteRange')
    expect(selectionIssue('2026-11-13', '2026-11-14', true, true, constraints)).toBe('outOfBounds')
    expect(
      selectionIssue('2026-11-14', '2026-11-14', true, false, {
        min: 'invalid',
      }),
    ).toBe('invalidBounds')
  })
  it('长区间不渲染或分配逐日数组；禁用谓词遇到首个障碍即停止', () => {
    const predicate = vi.fn<(date: string) => boolean>((date) => date === '0001-01-02')
    expect(
      selectionIssue('0001-01-01', '9999-12-31', true, false, {
        disabledDate: predicate,
      }),
    ).toBe('blockedRange')
    expect(predicate.mock.calls.length).toBeLessThanOrEqual(3)
    expect(selectionIssue('0001-01-01', '9999-12-31', true, false, {})).toBeNull()
  })
})
