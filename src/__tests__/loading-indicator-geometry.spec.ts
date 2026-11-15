import { describe, expect, it } from 'vitest'
import { loadingIndicatorFrame } from '../components/loading-indicator-geometry'

function coordinates(path: string) {
  return [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
}

function angularDifference(from: number, to: number) {
  return ((to - from + 540) % 360) - 180
}

describe('Loading Indicator geometry', () => {
  it('循环展示七种不同形状，最后一项连续变回首项', () => {
    const paths = Array.from({ length: 7 }, (_, index) => loadingIndicatorFrame(index * 650).path)
    expect(new Set(paths).size).toBe(7)
    expect(loadingIndicatorFrame(4550).path).toBe(paths[0])
  })

  it('形状、弹簧过冲及旋转均保留在 SVG 的圆形边界内', () => {
    for (let shape = 0; shape < 7; shape += 1) {
      for (const offset of [0, 150, 300, 475, 649.99]) {
        const frame = loadingIndicatorFrame(shape * 650 + offset)
        const values = coordinates(frame.path)
        const radii: number[] = []
        for (let index = 0; index < values.length; index += 2) {
          radii.push(Math.hypot(values[index]! - 50, values[index + 1]! - 50))
        }
        expect(frame.path.startsWith('M')).toBe(true)
        expect(frame.path.endsWith('Z')).toBe(true)
        expect(frame.path).not.toMatch(/NaN|Infinity/)
        expect(values.slice(-2)).toEqual(values.slice(0, 2))
        expect(Math.max(...radii)).toBeLessThan(49.01)
        expect(frame.rotation).toBeGreaterThanOrEqual(0)
        expect(frame.rotation).toBeLessThan(360)
      }
    }
  })

  it('每段末尾、首尾循环和连续旋转跨界均不跳帧', () => {
    for (const boundary of [650, 1300, 1950, 2600, 3250, 3900, 4550, 4666, 9100]) {
      const before = loadingIndicatorFrame(boundary - 0.001)
      const after = loadingIndicatorFrame(boundary + 0.001)
      const start = coordinates(before.path)
      const end = coordinates(after.path)
      const differences = start.map((value, index) => Math.abs(value - end[index]!))
      expect(Math.max(...differences)).toBeLessThan(0.02)
      expect(Math.abs(angularDifference(before.rotation, after.rotation))).toBeLessThan(0.01)
    }
  })

  it('非法时钟输出稳定、非空的首帧，不污染后续实例', () => {
    const initial = loadingIndicatorFrame(0)
    const later = loadingIndicatorFrame(1375)
    for (const time of [-1, NaN, Infinity, -Infinity]) {
      expect(loadingIndicatorFrame(time)).toEqual(initial)
    }
    expect(loadingIndicatorFrame(1375)).toEqual(later)
    expect(later.path).not.toBe(initial.path)
  })
})
