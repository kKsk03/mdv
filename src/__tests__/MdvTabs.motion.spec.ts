import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTabsIndicator, measureTabsIndicator } from '../components/tabs-indicator'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function indicatorPlatform() {
  let clock = 0
  let nextId = 0
  const frames = new Map<number, FrameRequestCallback>()
  const request = vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
    frames.set(++nextId, callback)
    return nextId
  })
  const cancel = vi.fn<(id: number) => void>((id) => {
    frames.delete(id)
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  vi.spyOn(window.performance, 'now').mockImplementation(() => clock)
  const row = document.createElement('div')
  const indicator = document.createElement('span')
  row.append(indicator)
  const motion = createTabsIndicator({ row: () => row, element: () => indicator })
  function advance(milliseconds: number) {
    clock += milliseconds
    const batch = [...frames.values()]
    frames.clear()
    for (const callback of batch) callback(clock)
  }
  return { row, indicator, motion, request, cancel, frames, advance }
}

describe('Tabs indicator', () => {
  it('measures primary content inset and its minimum, and secondary full tab width', () => {
    const row = document.createElement('div')
    const tab = document.createElement('button')
    const content = document.createElement('span')
    const rowRect = vi
      .spyOn(row, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(100, 0, 400, 48))
    const tabRect = vi
      .spyOn(tab, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(180, 0, 100, 48))
    const labelRect = vi
      .spyOn(content, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(205, 0, 50, 20))
    expect(measureTabsIndicator(row, tab, content, true)).toEqual({ left: 107, width: 46 })
    expect(measureTabsIndicator(row, tab, content, false)).toEqual({ left: 80, width: 100 })
    labelRect.mockReturnValue(new DOMRect(220, 0, 20, 20))
    expect(measureTabsIndicator(row, tab, content, true)).toEqual({ left: 118, width: 24 })
    // 固定布局窄于最小命中区总宽度时，末项仍可在轨道外侧原生滚动。
    rowRect.mockReturnValue(new DOMRect(100, 0, 120, 48))
    tabRect.mockReturnValue(new DOMRect(196, 0, 48, 48))
    labelRect.mockReturnValue(new DOMRect(206, 0, 28, 20))
    expect(measureTabsIndicator(row, tab, content, true)).toEqual({ left: 108, width: 24 })
  })

  it('keeps offset and width continuous when a running spring is redirected', () => {
    const platform = indicatorPlatform()
    platform.motion.moveTo({ left: 0, width: 40 }, false)
    platform.motion.moveTo({ left: 200, width: 80 }, true)
    platform.advance(16)
    expect(platform.indicator.style.transform).not.toBe('translateX(0px)')
    expect(Number.parseFloat(platform.indicator.style.width)).toBeGreaterThan(40)
    expect(Number.parseFloat(platform.indicator.style.width)).toBeLessThan(80)
    const before = platform.indicator.style.cssText
    platform.motion.moveTo({ left: 50, width: 30 }, true)
    expect(platform.indicator.style.cssText).toBe(before)
    platform.motion.moveTo({ left: 50, width: 30 }, false)
    expect(platform.indicator.style.cssText).toBe(before)
    for (let index = 0; index < 150; index++) platform.advance(16)
    expect(platform.indicator.style.transform).toBe('translateX(50px)')
    expect(platform.indicator.style.width).toBe('30px')
    expect(platform.frames.size).toBe(0)
    platform.motion.reset()
  })

  it('jumps on layout changes, honors reduced motion and clears pending frames and fallback state', () => {
    const platform = indicatorPlatform()
    platform.motion.moveTo({ left: 0, width: 40 }, false)
    platform.motion.moveTo({ left: 200, width: 80 }, true)
    platform.advance(16)
    platform.motion.moveTo({ left: 220, width: 90 }, false)
    expect(platform.indicator.style.transform).toBe('translateX(220px)')
    expect(platform.frames.size).toBe(0)
    vi.stubGlobal(
      'matchMedia',
      vi.fn<(query: string) => { matches: boolean }>(() => ({ matches: true })),
    )
    platform.motion.moveTo({ left: 40, width: 30 }, true)
    expect(platform.indicator.style.transform).toBe('translateX(40px)')
    expect(platform.row.hasAttribute('data-mdv-indicator-ready')).toBe(true)
    platform.motion.reset()
    expect(platform.indicator.hidden).toBe(true)
    expect(platform.row.hasAttribute('data-mdv-indicator-ready')).toBe(false)
    expect(platform.frames.size).toBe(0)
    expect(platform.cancel).toHaveBeenCalled()
  })
})
