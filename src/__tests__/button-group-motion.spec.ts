import { afterEach, describe, expect, it, vi } from 'vitest'
import { createButtonGroupMotion } from '../components/button-group-motion'
import type { ButtonGroupMember } from '../components/button-group-context'
import type { MdvButtonGroupVariant } from '../components/button-group.types'
import { toolbarFrames, toolbarReducedMotion } from './toolbar-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
function radii(member: ButtonGroupMember) {
  const values = member.surface()!.style.borderRadius.split(/\s+/).map(Number.parseFloat)
  return [
    values[0],
    values[1] ?? values[0],
    values[2] ?? values[0],
    values[3] ?? values[1] ?? values[0],
  ]
}
function setup(variant: MdvButtonGroupVariant = 'standard') {
  const root = document.createElement('div')
  const row = document.createElement('div')
  row.style.columnGap = variant === 'standard' ? '8px' : '2px'
  root.append(row)
  document.body.append(root)
  const state = Array.from({ length: 3 }, () => ({ pressed: false, selected: false }))
  const members: ButtonGroupMember[] = state.map((entry) => {
    const element = document.createElement('button')
    const surface = document.createElement('span')
    const content = document.createElement('span')
    element.append(surface)
    surface.append(content)
    row.append(element)
    // jsdom 不展开 padding-inline；显式声明测量所需的逻辑长属性。
    surface.style.cssText = 'padding-inline-start:24px;padding-inline-end:24px;border:0'
    Object.defineProperty(content, 'scrollWidth', { configurable: true, value: 40 })
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 40, 24))
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(
      () =>
        new DOMRect(
          0,
          0,
          Number.parseFloat(element.style.getPropertyValue('--mdv-group-motion-width')) || 100,
          56,
        ),
    )
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 56))
    return {
      element: () => element,
      surface: () => surface,
      content: () => content,
      value: () => undefined,
      disabled: () => false,
      pressed: () => entry.pressed,
      selected: () => entry.selected,
      size: () => 'm',
      shape: () => 'round',
      release: () => {
        entry.pressed = false
      },
    }
  })
  const motion = createButtonGroupMotion({
    element: () => root,
    row: () => row,
    members: () => members,
    variant: () => variant,
  })
  motion.measure(true)
  const widths = () =>
    members.map(
      (member) =>
        Number.parseFloat(member.element()!.style.getPropertyValue('--mdv-group-motion-width')) ||
        100,
    )
  return { root, row, state, members, motion, widths }
}

describe('Button Group geometry', () => {
  it.each([
    { index: 0, expected: [115, 85, 100] },
    { index: 1, expected: [92.5, 115, 92.5] },
    { index: 2, expected: [100, 85, 115] },
  ])(
    'borrows 15% only from adjacent items at index $index and restores every natural width',
    ({ index, expected }) => {
      toolbarReducedMotion()
      const { motion, state, widths, members } = setup()
      state[index]!.pressed = true
      motion.play()
      expect(widths()).toEqual(expected)
      expect(widths().reduce((sum, width) => sum + width, 0)).toBe(300)
      state[index]!.pressed = false
      state[index]!.selected = true
      motion.play()
      expect(widths()).toEqual([100, 100, 100])
      expect(radii(members[index]!)).toEqual([16, 16, 16, 16])
      expect(members[index]!.element()!.style.getPropertyValue('--mdv-group-motion-width')).toBe('')
    },
  )

  it('limits compression by content and keeps total width stable during simultaneous presses', () => {
    toolbarReducedMotion()
    const { motion, members, state, widths } = setup()
    Object.defineProperty(members[1]!.content()!, 'scrollWidth', { value: 98 })
    motion.measure(true)
    state[0]!.pressed = true
    state[2]!.pressed = true
    motion.play()
    expect(widths()).toEqual([102, 98, 100])
    expect(widths().reduce((sum, width) => sum + width, 0)).toBe(300)
  })

  it('uses Connected end corners, selected full corners and RTL without changing widths', () => {
    toolbarReducedMotion()
    const { motion, state, members, root, widths } = setup('connected')
    expect(radii(members[0]!)).toEqual([28, 8, 8, 28])
    state[1]!.selected = true
    motion.play()
    expect(radii(members[1]!)).toEqual([28, 28, 28, 28])
    state[0]!.pressed = true
    motion.play()
    expect(radii(members[0]!)).toEqual([28, 4, 4, 28])
    root.style.direction = 'rtl'
    motion.measure(true)
    expect(radii(members[0]!)).toEqual([4, 28, 28, 4])
    expect(widths()).toEqual([100, 100, 100])
  })

  it('honors explicit minimum and maximum sizes while distributing the same available width', () => {
    toolbarReducedMotion()
    const { motion, state, members, widths } = setup()
    members[0]!.element()!.style.maxInlineSize = '105px'
    members[1]!.element()!.style.minInlineSize = '98px'
    motion.measure(true)
    state[0]!.pressed = true
    motion.play()
    expect(widths()).toEqual([102, 98, 100])
    expect(widths().reduce((sum, width) => sum + width, 0)).toBe(300)
  })

  it('retains position when reversing, adapts to new measurements and releases animation resources', () => {
    const frames = toolbarFrames()
    const { motion, state, widths, members } = setup()
    state[1]!.pressed = true
    motion.play()
    frames.step(3)
    const intermediate = widths()
    expect(intermediate[1]).toBeGreaterThan(100)
    expect(intermediate[1]).toBeLessThan(115)
    state[1]!.pressed = false
    motion.play()
    expect(widths()).toEqual(intermediate)
    motion.measure()
    expect(widths()).toEqual(intermediate)
    frames.step(180)
    expect(widths()).toEqual([100, 100, 100])
    expect(frames.callbacks.size).toBe(0)
    state[0]!.pressed = true
    motion.play()
    motion.reset()
    expect(frames.callbacks.size).toBe(0)
    expect(members[0]!.surface()!.style.borderRadius).toBe('')
  })
})
