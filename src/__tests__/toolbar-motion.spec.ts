import { afterEach, describe, expect, it, vi } from 'vitest'
import { createToolbarMotion } from '../components/toolbar-motion'
import { toolbarFrames, toolbarReducedMotion } from './toolbar-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function setup() {
  const root = document.createElement('div')
  const leading = document.createElement('div')
  const trailing = document.createElement('div')
  const motion = createToolbarMotion({
    element: () => root,
    leading: () => leading,
    trailing: () => trailing,
    vertical: () => false,
    expanded: () => true,
  })
  const progress = () => Number(root.style.getPropertyValue('--mdv-toolbar-expansion'))
  motion.jump(true)
  return { root, motion, progress }
}

describe('Toolbar motion', () => {
  it('reverses from its current geometry and clears fixed measurement after settling', () => {
    const frames = toolbarFrames()
    const { root, motion, progress } = setup()
    motion.play(false)
    frames.step(3)
    const intermediate = progress()
    expect(intermediate).toBeGreaterThan(0)
    expect(intermediate).toBeLessThan(1)
    motion.play(true)
    expect(progress()).toBe(intermediate)
    frames.step(180)
    expect(progress()).toBe(1)
    expect(root.hasAttribute('data-mdv-toolbar-animating')).toBe(false)
    expect(frames.callbacks.size).toBe(0)
  })
  it('stops on reduced motion and releases every scheduled frame on teardown', () => {
    const frames = toolbarFrames()
    const { motion, progress } = setup()
    motion.play(false)
    frames.step()
    motion.cancel()
    expect(frames.callbacks.size).toBe(0)
    toolbarReducedMotion()
    motion.play(false)
    expect(progress()).toBe(0)
    expect(frames.callbacks.size).toBe(0)
  })
})
