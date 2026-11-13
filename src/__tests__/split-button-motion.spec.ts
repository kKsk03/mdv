import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSplitButtonMotion } from '../components/split-button-motion'
import type { MdvButtonSize } from '../components/button.types'
import { toolbarFrames, toolbarReducedMotion } from './toolbar-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
function setup(size: MdvButtonSize = 's') {
  const root = document.createElement('div')
  const action = document.createElement('button')
  const menu = document.createElement('button')
  root.append(action, menu)
  document.body.append(root)
  const state = { expanded: false, action: false, menu: false }
  const motion = createSplitButtonMotion({
    element: () => root,
    action: () => action,
    menu: () => menu,
    size: () => size,
    expanded: () => state.expanded,
    actionActive: () => state.action,
    menuActive: () => state.menu,
  })
  motion.update(true)
  const value = (name: string) =>
    Number.parseFloat(root.style.getPropertyValue(`--mdv-split-${name}`))
  return { state, motion, value, root, action, menu }
}

describe('Split Button motion', () => {
  it.each([
    { size: 'xs', inner: 4, active: 8, shift: -1, full: 16 },
    { size: 's', inner: 4, active: 12, shift: -1, full: 20 },
    { size: 'm', inner: 4, active: 12, shift: -2, full: 28 },
    { size: 'l', inner: 8, active: 20, shift: -3, full: 48 },
    { size: 'xl', inner: 12, active: 20, shift: -6, full: 68 },
  ] as const)(
    'keeps independent corners and optical alignment for $size',
    ({ size, inner, active, shift, full }) => {
      toolbarReducedMotion()
      const { state, motion, value } = setup(size)
      expect([value('action-radius'), value('menu-radius'), value('offset')]).toEqual([
        inner,
        inner,
        shift,
      ])
      expect([value('action-outer-radius'), value('menu-outer-radius')]).toEqual([full, full])
      state.action = true
      motion.update()
      expect([value('action-radius'), value('menu-radius')]).toEqual([active, inner])
      state.expanded = true
      motion.update()
      expect([
        value('action-radius'),
        value('menu-radius'),
        value('angle'),
        value('offset'),
      ]).toEqual([active, full, 180, 0])
      state.action = false
      state.expanded = false
      state.menu = true
      motion.update()
      expect([value('action-radius'), value('menu-radius'), value('offset')]).toEqual([
        inner,
        active,
        shift,
      ])
      motion.reset()
    },
  )

  it('preserves intermediate values on a quick reversal and releases pending frames', () => {
    const frames = toolbarFrames()
    const { state, motion, value, root } = setup()
    state.expanded = true
    motion.update()
    frames.step(2)
    const angle = value('angle')
    expect(angle).toBeGreaterThan(0)
    expect(angle).toBeLessThan(180)
    state.expanded = false
    motion.update()
    expect(value('angle')).toBe(angle)
    frames.step(120)
    expect(value('angle')).toBe(0)
    expect(value('menu-radius')).toBe(4)
    expect(frames.callbacks.size).toBe(0)
    state.expanded = true
    motion.update()
    expect(frames.callbacks.size).toBe(1)
    motion.reset()
    expect(frames.callbacks.size).toBe(0)
    expect(Number.isNaN(value('angle'))).toBe(true)
    expect(root.style.getPropertyValue('--mdv-split-action-outer-radius')).toBe('')
    expect(root.style.getPropertyValue('--mdv-split-menu-outer-radius')).toBe('')
  })

  it('uses actual enlarged surfaces and local corner overrides without an animation in reduced motion', () => {
    toolbarReducedMotion()
    const frames = toolbarFrames()
    const { state, motion, value, root, action, menu } = setup()
    root.style.setProperty('--mdv-split-active', '18px')
    vi.spyOn(action, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 120, 64))
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 48, 64))
    state.action = true
    state.expanded = true
    motion.update()
    expect(value('action-radius')).toBe(18)
    expect(value('action-outer-radius')).toBe(32)
    expect(value('menu-outer-radius')).toBe(24)
    expect(value('menu-radius')).toBe(24)
    expect(value('angle')).toBe(180)
    expect(frames.callbacks.size).toBe(0)
  })
})
