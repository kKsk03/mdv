import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFabMotion } from '../components/fab-motion'
import { toolbarFrames, toolbarReducedMotion } from './toolbar-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function setup() {
  const root = document.createElement('button')
  const surface = document.createElement('span')
  const label = document.createElement('span')
  const icon = document.createElement('span')
  surface.style.cssText = 'min-block-size:96px;padding-inline-end:28px;column-gap:16px'
  Object.defineProperty(label, 'scrollWidth', { value: 100 })
  vi.spyOn(icon, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 36, 36))
  root.append(surface)
  surface.append(icon, label)
  const motion = createFabMotion({
    element: () => root,
    surface: () => surface,
    label: () => label,
    icon: () => icon,
    expanded: () => true,
  })
  motion.jump(true)
  const width = () => Number.parseFloat(root.style.getPropertyValue('--mdv-fab-width'))
  const leading = () => Number.parseFloat(root.style.getPropertyValue('--mdv-fab-leading-space'))
  return { root, label, motion, width, leading }
}

describe('Extended FAB motion', () => {
  it('measures the label naturally and centers a 36px icon in a 96px collapsed action', () => {
    toolbarReducedMotion()
    const { root, motion, width, leading } = setup()
    expect(width()).toBe(208)
    expect(leading()).toBe(28)
    motion.play(false)
    expect(width()).toBe(96)
    expect(leading()).toBe(30)
    expect(root.style.getPropertyValue('--mdv-fab-label-opacity')).toBe('0')
    motion.play(true)
    expect(width()).toBe(208)
    expect(leading()).toBe(28)
  })
  it('reverses continuously and releases every frame when settled or cancelled', () => {
    const frames = toolbarFrames()
    const { root, motion, width } = setup()
    motion.play(false)
    frames.step(3)
    const intermediate = width()
    expect(intermediate).toBeGreaterThan(96)
    expect(intermediate).toBeLessThan(208)
    motion.play(true)
    expect(width()).toBe(intermediate)
    frames.step(180)
    expect(width()).toBe(208)
    expect(root.hasAttribute('data-mdv-fab-animating')).toBe(false)
    expect(frames.callbacks.size).toBe(0)
    motion.play(false)
    motion.cancel()
    expect(frames.callbacks.size).toBe(0)
  })
  it('refreshes changed label dimensions without losing its original style', () => {
    toolbarReducedMotion()
    const { label, motion, width } = setup()
    label.style.color = 'red'
    vi.spyOn(label, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 180, 32))
    motion.measure()
    expect(width()).toBe(288)
    expect(label.style.color).toBe('red')
    expect(label.style.position).toBe('')
  })
})
