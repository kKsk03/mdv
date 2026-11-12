import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppBarScroll } from '../components/app-bar-scroll'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App Bar scroll motion', () => {
  it('settles with a bounded spring, interrupts on new input, and finishes at the exact boundary', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'matchMedia',
      vi.fn<Window['matchMedia']>(() => ({ matches: false }) as MediaQueryList),
    )
    const update = vi.fn<(collapse: number, hidden: number, color: number) => void>()
    const scroll = createAppBarScroll({
      view: () => window,
      behavior: () => 'enter-always',
      heights: () => ({ expanded: 120, compact: 64 }),
      update,
    })
    scroll.reset(0)
    scroll.scroll(45)
    await vi.advanceTimersByTimeAsync(180)
    const intermediate = update.mock.lastCall![0]
    expect(intermediate).toBeGreaterThan(45)
    expect(intermediate).toBeLessThan(56)
    scroll.scroll(5)
    const interrupted = update.mock.lastCall![0]
    expect(interrupted).toBeLessThan(intermediate)
    await vi.advanceTimersByTimeAsync(2500)
    expect(update).toHaveBeenLastCalledWith(0, 0, 0)
    expect(
      update.mock.calls.every(([collapse, hidden, color]) =>
        Number.isFinite(collapse + hidden + color),
      ),
    ).toBe(true)
    scroll.stop()
  })

  it('jumps on reduced motion and cancels queued work when stopped', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'matchMedia',
      vi.fn<Window['matchMedia']>(() => ({ matches: true }) as MediaQueryList),
    )
    const update = vi.fn<(collapse: number, hidden: number, color: number) => void>()
    const scroll = createAppBarScroll({
      view: () => window,
      behavior: () => 'enter-always',
      heights: () => ({ expanded: 120, compact: 64 }),
      update,
    })
    scroll.reset(0)
    scroll.scroll(50)
    await vi.advanceTimersByTimeAsync(151)
    expect(update).toHaveBeenLastCalledWith(56, 0, 1)
    scroll.scroll(100)
    await vi.advanceTimersByTimeAsync(151)
    expect(update).toHaveBeenLastCalledWith(56, 64, 1)
    scroll.scroll(90)
    scroll.stop()
    const calls = update.mock.calls.length
    await vi.advanceTimersByTimeAsync(1000)
    expect(update).toHaveBeenCalledTimes(calls)
  })

  it('maps collapse continuously through the reference color curve and reverses back to surface', () => {
    const update = vi.fn<(collapse: number, hidden: number, color: number) => void>()
    const scroll = createAppBarScroll({
      view: () => null,
      behavior: () => 'exit-until-collapsed',
      heights: () => ({ expanded: 152, compact: 64 }),
      update,
    })
    scroll.reset(0)
    expect(update).toHaveBeenLastCalledWith(0, 0, 0)
    scroll.scroll(1)
    const initial = update.mock.lastCall![2]
    expect(initial).toBeGreaterThan(0)
    expect(initial).toBeLessThan(0.01)
    scroll.scroll(44)
    expect(update.mock.lastCall![2]).toBeCloseTo(0.3248, 3)
    scroll.scroll(500)
    expect(update).toHaveBeenLastCalledWith(88, 0, 1)
    scroll.scroll(44)
    expect(update.mock.lastCall![2]).toBeCloseTo(0.3248, 3)
    scroll.scroll(-10)
    expect(update).toHaveBeenLastCalledWith(0, 0, 0)
  })

  it('keeps pinned and Small color changes tied to distance even while keyboard focus holds the row visible', () => {
    const update = vi.fn<(collapse: number, hidden: number, color: number) => void>()
    const scroll = createAppBarScroll({
      view: () => null,
      behavior: () => 'pinned',
      heights: () => ({ expanded: 120, compact: 64 }),
      update,
    })
    scroll.reset(0)
    scroll.focus(true)
    scroll.scroll(32)
    expect(update.mock.lastCall![0]).toBe(0)
    expect(update.mock.lastCall![1]).toBe(0)
    expect(update.mock.lastCall![2]).toBeCloseTo(0.3248, 3)
    scroll.scroll(64)
    expect(update).toHaveBeenLastCalledWith(0, 0, 1)
    scroll.scroll(Number.NaN)
    expect(update).toHaveBeenLastCalledWith(0, 0, 0)
  })
})
