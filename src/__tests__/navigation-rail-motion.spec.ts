import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNavigationRailMotion } from '../components/navigation-rail-motion'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function clock() {
  let id = 0
  let time = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  const request = vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
    callbacks.set(++id, callback)
    return id
  })
  const cancel = vi.fn<(key: number) => void>((key) => {
    callbacks.delete(key)
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  return {
    callbacks,
    step(count = 1) {
      for (let n = 0; n < count; n++) {
        time += 1000 / 60
        const frame = [...callbacks.values()]
        callbacks.clear()
        frame.forEach((callback) => callback(time))
      }
    },
  }
}
function progress(element: HTMLElement) {
  return Number(element.style.getPropertyValue('--mdv-rail-progress'))
}

describe('Navigation Rail motion', () => {
  it('jumps directly to its destination under reduced motion without scheduling a frame', async () => {
    const frames = clock()
    vi.stubGlobal(
      'matchMedia',
      vi.fn<(query: string) => MediaQueryList>(() => ({ matches: true }) as MediaQueryList),
    )
    const panel = document.createElement('div')
    const motion = createNavigationRailMotion({ element: () => panel })
    await motion.play(true).finished
    expect(progress(panel)).toBe(1)
    expect(frames.callbacks.size).toBe(0)
  })
  it('animates width and scrim with a continuous progress and settles exactly at the target', async () => {
    const frames = clock()
    const panel = document.createElement('div')
    const scrim = document.createElement('div')
    const motion = createNavigationRailMotion({
      element: () => panel,
      scrim: () => scrim,
      modal: true,
    })
    motion.jump(false)
    const run = motion.play(true)
    frames.step()
    expect(progress(panel)).toBeGreaterThan(0)
    expect(progress(panel)).toBeLessThan(1)
    expect(Number(scrim.style.opacity)).toBeGreaterThan(0)
    frames.step(180)
    await run.finished
    expect(progress(panel)).toBe(1)
    expect(scrim.style.opacity).toBe('1')
    expect(frames.callbacks.size).toBe(0)
  })

  it('reverses from the current frame and resolves the interrupted task without resetting position', async () => {
    const frames = clock()
    const panel = document.createElement('div')
    const motion = createNavigationRailMotion({ element: () => panel })
    motion.jump(false)
    const opening = motion.play(true)
    frames.step(3)
    const current = progress(panel)
    const closing = motion.play(false)
    await opening.finished
    expect(progress(panel)).toBe(current)
    opening.finish()
    expect(progress(panel)).toBe(current)
    frames.step(180)
    await closing.finished
    expect(progress(panel)).toBe(0)
    expect(frames.callbacks.size).toBe(0)
  })

  it('cleans up a running frame without forcing a jump, and can explicitly finish later motion', async () => {
    const frames = clock()
    const panel = document.createElement('div')
    const motion = createNavigationRailMotion({ element: () => panel })
    const first = motion.play(true)
    frames.step(2)
    const current = progress(panel)
    motion.cancel()
    await first.finished
    frames.step(4)
    expect(progress(panel)).toBe(current)
    expect(frames.callbacks.size).toBe(0)
    const second = motion.play(false)
    motion.finish()
    await second.finished
    expect(progress(panel)).toBe(0)
  })

  it('positions a detached or server-side surface synchronously without browser globals', async () => {
    const motion = createNavigationRailMotion({ element: () => null, initiallyExpanded: true })
    await motion.play(false).finished
    expect(() => motion.jump(true)).not.toThrow()
    expect(() => motion.cancel()).not.toThrow()
  })
})
