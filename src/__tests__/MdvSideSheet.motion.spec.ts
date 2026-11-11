import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSideSheetMotion, sideSheetDirection } from '../components/side-sheet-motion'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.enableAnimations()
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Side Sheet motion', () => {
  it('slides the panel without fading content and animates its scrim separately', async () => {
    const panel = document.createElement('section')
    const scrim = document.createElement('div')
    const motion = createSideSheetMotion({
      panel: () => panel,
      scrim: () => scrim,
      direction: () => 1,
    })
    const opening = motion.play(true)
    const spatial = platform.animations[0]!
    const overlay = platform.animations[1]!
    expect(spatial.frames[0]?.transform).toBe('translateX(100%)')
    expect(spatial.frames[spatial.frames.length - 1]?.transform).toBe('translateX(0%)')
    expect(spatial.frames.every((frame) => !('opacity' in frame))).toBe(true)
    expect(overlay.element).toBe(scrim)
    expect(overlay.frames[0]?.opacity).toBe(0)
    expect(overlay.frames[overlay.frames.length - 1]?.opacity).toBe(1)
    opening.finish()
    await opening.finished
    expect(motion.current()).toEqual({ progress: 1, opacity: 1 })
    expect(panel.style.transform).toBe('translateX(0%)')
  })

  it('keeps standard allocation and panel motion on the same timeline without shrinking text', async () => {
    const panel = document.createElement('section')
    const track = document.createElement('div')
    const motion = createSideSheetMotion({
      panel: () => panel,
      track: () => track,
      direction: () => -1,
    })
    const opening = motion.play(true)
    const spatial = platform.animations[0]!
    const layout = platform.animations[1]!
    expect(spatial.frames[0]?.transform).toBe('translateX(-100%)')
    expect(layout.element).toBe(track)
    expect(layout.options.duration).toBe(spatial.options.duration)
    expect(layout.frames[layout.frames.length - 1]?.inlineSize).toBe(
      'calc(var(--mdv-side-sheet-extent) * 1)',
    )
    expect(spatial.frames.every((frame) => !('width' in frame) && !('scale' in frame))).toBe(true)
    opening.finish()
    await opening.finished
    const closing = motion.play(false)
    expect(platform.animations[2]!.options.duration).toBeLessThan(
      spatial.options.duration as number,
    )
    closing.finish()
    await closing.finished
    expect(motion.current().progress).toBe(0)
  })

  it('resolves interrupted movement and bypasses animation for reduced motion', async () => {
    const panel = document.createElement('section')
    const motion = createSideSheetMotion({ panel: () => panel, direction: () => 1 })
    const first = motion.play(true)
    motion.drag(0.4)
    await first.finished
    expect(motion.current().progress).toBe(0.4)
    expect(platform.animations[0]!.cancel).toHaveBeenCalledTimes(1)
    platform.media('(prefers-reduced-motion: reduce)', true)
    await motion.play(true).finished
    expect(platform.animations).toHaveLength(1)
    expect(motion.current().progress).toBe(1)
  })

  it.each([
    ['ltr', 'end', 1],
    ['ltr', 'start', -1],
    ['rtl', 'end', -1],
    ['rtl', 'start', 1],
  ] as const)('resolves %s %s to physical direction %s', (direction, placement, expected) => {
    const panel = document.createElement('section')
    panel.style.direction = direction
    expect(sideSheetDirection(panel, placement)).toBe(expected)
  })
})
