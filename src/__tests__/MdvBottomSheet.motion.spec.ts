import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBottomSheetMotion } from '../components/bottom-sheet-motion'
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
  document.body.replaceChildren()
})

describe('Bottom Sheet motion', () => {
  it('separates spatial movement and scrim opacity and settles at the exact anchor', async () => {
    const panel = document.createElement('section')
    const scrim = document.createElement('div')
    const motion = createBottomSheetMotion(
      () => panel,
      () => scrim,
    )
    motion.jump({ height: 400, offset: 400, opacity: 0 })
    const opening = motion.play({ height: 400, offset: 0, opacity: 1 })
    const spatial = platform.animations[0]!
    const overlay = platform.animations[1]!
    expect(spatial.element).toBe(panel)
    expect(spatial.frames[0]).toEqual({
      height: '400px',
      transform: 'translateY(400px)',
      offset: 0,
    })
    expect(spatial.frames[spatial.frames.length - 1]).toEqual({
      height: '400px',
      transform: 'translateY(0px)',
      offset: 1,
    })
    expect(spatial.frames.every((frame) => !('opacity' in frame))).toBe(true)
    expect(overlay.element).toBe(scrim)
    expect(overlay.frames[0]?.opacity).toBe(0)
    expect(overlay.frames[overlay.frames.length - 1]?.opacity).toBe(1)
    opening.finish()
    await opening.finished
    expect(motion.current()).toEqual({ height: 400, offset: 0, opacity: 1 })
    expect(panel.style.getPropertyValue('--mdv-bottom-sheet-height')).toBe('400px')
    expect(panel.style.transform).toBe('translateY(0px)')
  })

  it('cancels superseded animations without rejecting and bypasses motion when reduced', async () => {
    const panel = document.createElement('section')
    const motion = createBottomSheetMotion(
      () => panel,
      () => null,
    )
    motion.jump({ height: 160, offset: 0, opacity: 1 })
    const first = motion.play({ height: 700, offset: 0, opacity: 1 }, 300)
    const cancel = platform.animations[0]!.cancel
    motion.jump({ height: 200, offset: 0, opacity: 1 })
    await first.finished
    expect(cancel).toHaveBeenCalledTimes(1)
    platform.media('(prefers-reduced-motion: reduce)', true)
    const second = motion.play({ height: 400, offset: 0, opacity: 1 })
    await second.finished
    expect(platform.animations).toHaveLength(1)
    expect(motion.current().height).toBe(400)
  })
})
