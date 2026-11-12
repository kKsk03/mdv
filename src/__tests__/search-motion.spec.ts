import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSearchAnimator } from '../components/search-motion'
import type { DialogMotionElements } from '../components/dialog-motion'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('search motion', () => {
  it('animates geometry without scaling text, reverses continuously and releases all styles and frames', async () => {
    const callbacks = new Map<number, FrameRequestCallback>()
    let nextId = 0
    let time = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.set(++nextId, callback)
      return nextId
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      callbacks.delete(id)
    })
    const container = document.createElement('div')
    Object.defineProperty(container, 'animate', { configurable: true, value: () => {} })
    const content = document.createElement('div')
    const scrim = document.createElement('div')
    const anchor = document.createElement('div')
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 40, 600, 56))
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(new DOMRect(88, 40, 624, 360))
    const elements: DialogMotionElements = {
      container,
      content,
      scrim,
      surface: null,
      header: null,
      actions: null,
      footer: null,
    }
    const animate = createSearchAnimator(() => anchor)
    function step() {
      time += 1000 / 60
      const pending = [...callbacks.values()]
      callbacks.clear()
      pending.forEach((callback) => callback(time))
    }
    const opening = animate(elements, true)
    for (let index = 0; index < 5; index++) step()
    const sampled = container.style.transform
    expect(Number(scrim.style.opacity)).toBeGreaterThan(0)
    expect(Number(scrim.style.opacity)).toBeLessThan(1)
    expect(sampled).not.toContain('scale')
    const closing = animate(elements, false, opening)
    expect(container.style.transform).toBe(sampled)
    for (let index = 0; index < 180 && callbacks.size; index++) step()
    await closing.finished
    expect(scrim.style.opacity).toBe('0')
    expect(callbacks.size).toBe(0)
    closing.cancel()
    expect(container.style.transform).toBe('')
    expect(container.style.getPropertyValue('--mdv-search-motion-width')).toBe('')
    expect(content.style.opacity).toBe('')
    expect(scrim.style.opacity).toBe('')
  })
})
