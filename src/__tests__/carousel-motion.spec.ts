import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCarouselMotion } from '../components/carousel-motion'
import { mockCarouselPlatform } from './carousel-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Carousel 连续动效', () => {
  it('吸附到目标，连续反向不跳回起点，完成只回调一次', () => {
    const platform = mockCarouselPlatform()
    let position = 0
    const done = vi.fn<() => void>()
    const superseded = vi.fn<() => void>()
    const motion = createCarouselMotion({
      view: window,
      read: () => position,
      write: (value) => {
        position = value
      },
      max: () => 1000,
    })
    motion.springTo(600, superseded)
    platform.frames(5)
    expect(position).toBeGreaterThan(0)
    expect(position).toBeLessThan(600)
    const before = position
    motion.springTo(100, done)
    expect(position).toBe(before)
    platform.frames()
    expect(position).toBe(100)
    expect(done).toHaveBeenCalledOnce()
    expect(superseded).not.toHaveBeenCalled()
    expect(platform.pendingFrames()).toBe(0)
  })
  it('惯性到达端点停止，取消后没有遗留回调或帧', () => {
    const platform = mockCarouselPlatform()
    let position = 50
    const done = vi.fn<() => void>()
    const cancelled = vi.fn<() => void>()
    const motion = createCarouselMotion({
      view: window,
      read: () => position,
      write: (value) => {
        position = value
      },
      max: () => 100,
    })
    motion.coast(1000, done)
    platform.frames()
    expect(position).toBe(100)
    expect(done).toHaveBeenCalledOnce()
    motion.springTo(0, cancelled)
    platform.frames(2)
    motion.stop()
    const stopped = position
    platform.frames()
    expect(position).toBe(stopped)
    expect(cancelled).not.toHaveBeenCalled()
    expect(platform.pendingFrames()).toBe(0)
  })
})
