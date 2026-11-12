import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSideSheetMotion } from '../components/side-sheet-motion'
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

describe('Navigation Drawer motion', () => {
  it('keeps layout allocation and panel translation in sync without animating text width', async () => {
    const panel = document.createElement('nav')
    const track = document.createElement('div')
    const motion = createSideSheetMotion({
      panel: () => panel,
      track: () => track,
      direction: () => -1,
      extentProperty: '--mdv-drawer-extent',
    })
    const opening = motion.play(true)
    const spatial = platform.animations[0]!
    const layout = platform.animations[1]!
    expect(spatial.frames[0]?.transform).toBe('translateX(-100%)')
    expect(layout.element).toBe(track)
    expect(layout.options.duration).toBe(spatial.options.duration)
    expect(layout.frames[layout.frames.length - 1]?.inlineSize).toBe(
      'calc(var(--mdv-drawer-extent) * 1)',
    )
    expect(
      spatial.frames.every(
        (frame) => !('width' in frame) && !('scale' in frame) && !('opacity' in frame),
      ),
    ).toBe(true)
    opening.finish()
    await opening.finished
    const closing = motion.play(false)
    expect(platform.animations[2]!.options.duration).toBeLessThan(
      spatial.options.duration as number,
    )
    closing.finish()
    await closing.finished
    expect(motion.current()).toEqual({ progress: 0, opacity: 0 })
  })

  it('follows a dragged scrim, preserves intermediate progress on interruption and returns to the accepted position', async () => {
    const panel = document.createElement('nav')
    const scrim = document.createElement('div')
    const motion = createSideSheetMotion({
      panel: () => panel,
      scrim: () => scrim,
      direction: () => 1,
      dragScrim: true,
      initiallyOpen: true,
    })
    motion.drag(0.4)
    expect(panel.style.transform).toBe('translateX(60%)')
    expect(scrim.style.opacity).toBe('0.4')
    const first = motion.play(true)
    const animation = vi.mocked(panel.animate).mock.results[0]!.value
    animation.currentTime = 50
    const intermediate = motion.current().progress
    expect(intermediate).toBeGreaterThan(0.4)
    expect(intermediate).toBeLessThan(1)
    const second = motion.play(false)
    expect(platform.animations[2]!.frames[0]?.transform).toBe(
      `translateX(${(1 - intermediate) * 100}%)`,
    )
    await first.finished
    second.finish()
    await second.finished
    expect(scrim.style.opacity).toBe('0')
    platform.media('(prefers-reduced-motion: reduce)', true)
    const count = platform.animations.length
    await motion.play(true).finished
    expect(platform.animations).toHaveLength(count)
    expect(panel.style.transform).toBe('translateX(0%)')
    expect(scrim.style.opacity).toBe('1')
  })
})
