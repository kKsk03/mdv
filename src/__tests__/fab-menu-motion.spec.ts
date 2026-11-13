import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFabMenuMotion } from '../components/fab-menu-motion'
import { toolbarFrames } from './toolbar-test-platform'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe('FAB Menu motion', () => {
  it('reveals from the nearest item and reverses without jumping or leaving frames behind', () => {
    const frames = toolbarFrames()
    const element = document.createElement('div')
    const items = Array.from({ length: 3 }, () => document.createElement('button'))
    const settled = vi.fn<(open: boolean) => void>()
    let opened = true
    const motion = createFabMenuMotion({
      element: () => element,
      items: () => items,
      opened: () => opened,
      settled,
    })
    motion.update()
    frames.step(3)
    const value = element.style.getPropertyValue('--mdv-fab-menu-progress')
    expect(Number(items[2]!.style.getPropertyValue('--mdv-fab-menu-reveal'))).toBeGreaterThan(
      Number(items[0]!.style.getPropertyValue('--mdv-fab-menu-reveal')),
    )
    opened = false
    motion.update()
    expect(element.style.getPropertyValue('--mdv-fab-menu-progress')).toBe(value)
    frames.step(120)
    expect(settled).toHaveBeenLastCalledWith(false)
    expect(frames.callbacks.size).toBe(0)
    motion.reset()
    expect(element.style.length).toBe(0)
    expect(items.map((item) => item.style.length)).toEqual([0, 0, 0])
  })
  it('finishes reduced motion and removes retained item reveal attributes on reset', () => {
    const frames = toolbarFrames()
    vi.stubGlobal(
      'matchMedia',
      vi.fn<() => { matches: boolean }>(() => ({ matches: true })),
    )
    const element = document.createElement('div')
    const item = document.createElement('button')
    const settled = vi.fn<(open: boolean) => void>()
    const motion = createFabMenuMotion({
      element: () => element,
      items: () => [item],
      opened: () => true,
      settled,
    })
    motion.update()
    expect(settled).toHaveBeenCalledWith(true)
    expect(item.hasAttribute('data-mdv-fab-menu-revealed')).toBe(true)
    expect(frames.callbacks.size).toBe(0)
    motion.reset()
    expect(item.hasAttribute('data-mdv-fab-menu-revealed')).toBe(false)
  })
})
