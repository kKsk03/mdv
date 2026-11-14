import { describe, expect, it, vi } from 'vitest'
import {
  minuteTime,
  nearestTime,
  timeAtPoint,
  timeAvailability,
  timeInputFormat,
  timeIssue,
  timeMinutes,
} from '../components/time-picker-time'

describe('纯时间与本地化输入', () => {
  it('严格区分分钟模型、日期、秒和 24 点，不依赖时区解析', () => {
    expect(timeMinutes('00:00')).toBe(0)
    expect(timeMinutes('23:59')).toBe(1439)
    expect(minuteTime(785)).toBe('13:05')
    for (const value of ['24:00', '12:60', '1:05', '12:05:00', '2026-11-14', null, new Date()])
      expect(timeMinutes(value)).toBeNull()
  })
  it('正确转换午夜和正午，12 小时文本必须带时段', () => {
    const format = timeInputFormat('en-US', 'h12')
    expect(format.parse('12:00 AM')).toBe('00:00')
    expect(format.parse('12:00 PM')).toBe('12:00')
    expect(format.parse('1:5 pm')).toBe('13:05')
    expect(format.parse('1:05')).toBeNull()
    expect(format.parse('0:00 AM')).toBeNull()
    expect(format.parse('13:00 PM')).toBeNull()
    expect(timeInputFormat('en-US', 'h23').parse('24:00')).toBeNull()
  })
  it('格式化值可以按同一 locale 解析，支持本地数字、分隔符与全角输入', () => {
    for (const locale of ['zh-CN', 'en-US', 'en-GB', 'ar-EG', 'fi-FI']) {
      for (const cycle of ['h12', 'h23'] as const) {
        const format = timeInputFormat(locale, cycle)
        for (const value of ['00:00', '12:00', '13:05', '23:59'])
          expect(format.parse(format.format(value))).toBe(value)
      }
    }
    expect(timeInputFormat('zh-CN', 'h23').parse('１３：０５')).toBe('13:05')
    expect(timeInputFormat('en-US').hour12).toBe(true)
    expect(timeInputFormat('en-GB').hour12).toBe(false)
  })
})
describe('时间约束与拨盘几何', () => {
  it('上下界包含端点，拒绝倒序与非法步长，不自动吸附文本', () => {
    expect(timeIssue('09:00', false, { min: '09:00', max: '10:00', minuteStep: 5 })).toBeNull()
    expect(timeIssue('10:00', false, { min: '09:00', max: '10:00' })).toBeNull()
    expect(timeIssue('08:59', false, { min: '09:00' })).toBe('outOfBounds')
    expect(timeIssue('09:03', false, { minuteStep: 5 })).toBe('stepMismatch')
    expect(timeIssue('09:00', false, { min: '22:00', max: '02:00' })).toBe('invalidBounds')
    for (const minuteStep of [0, -1, 7, 1.5, Infinity, NaN])
      expect(timeAvailability({ minuteStep }).issue).toBe('invalidStep')
    expect(timeIssue(null, true, {})).toBe('required')
    expect(timeIssue(null, false, {})).toBeNull()
  })
  it('只枚举合规分钟一次，禁用小时由其全部分钟推导，跨午夜由谓词表达', () => {
    const disabledTime = vi.fn<(time: string) => boolean>(
      (time) => time >= '12:00' && time < '13:00',
    )
    const available = timeAvailability({ min: '11:00', max: '13:00', minuteStep: 15, disabledTime })
    expect(available.minutes.map(minuteTime)).toEqual(['11:00', '11:15', '11:30', '11:45', '13:00'])
    expect([...available.hours]).toEqual([11, 13])
    expect(disabledTime).toHaveBeenCalledTimes(9)
    expect(nearestTime(available.minutes, 12 * 60)).toBe(11 * 60 + 45)
    expect(timeAvailability({ disabledTime: () => true }).minutes).toEqual([])
    const night = timeAvailability({ disabledTime: (time) => time > '02:00' && time < '22:00' })
    expect(night.allowed.has(0)).toBe(true)
    expect(night.allowed.has(12 * 60)).toBe(false)
    expect(night.allowed.has(22 * 60)).toBe(true)
  })
  it('24 小时双圈与分钟 0 点跨越均使用同一坐标规则', () => {
    expect(timeAtPoint(128, 24, 'hour', false)).toBe(0)
    expect(timeAtPoint(128, 60, 'hour', false)).toBe(12)
    expect(timeAtPoint(232, 128, 'hour', false)).toBe(3)
    expect(timeAtPoint(196, 128, 'hour', false)).toBe(15)
    expect(timeAtPoint(128, 232, 'minute', false)).toBe(30)
    expect(timeAtPoint(127, 24, 'minute', false, 5)).toBe(0)
  })
})
