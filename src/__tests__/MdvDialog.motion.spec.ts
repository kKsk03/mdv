import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MdvDialog from '../components/MdvDialog.vue'
import MdvFullscreenDialog from '../components/MdvFullscreenDialog.vue'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
let wrapper: ReturnType<typeof mount<typeof MdvDialog>> | undefined
let fullWrapper: ReturnType<typeof mount<typeof MdvFullscreenDialog>> | undefined
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.enableAnimations()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  fullWrapper?.unmount()
  fullWrapper = undefined
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Dialog motion lifecycle', () => {
  it('uses the official basic entry duration and completes only after all active animations finish', async () => {
    wrapper = mount(MdvDialog, {
      attachTo: document.body,
      props: { modelValue: true, title: '动画', description: '正文' },
    })
    await flushPromises()
    const surface = wrapper.get('.mdv-dialog__surface').element
    const growth = platform.animations.find(
      (animation) => animation.element === surface && animation.frames[0]?.height,
    )
    expect(growth?.frames).toEqual([{ height: '35%' }, { height: '100%' }])
    expect(growth?.options.duration).toBe(500)
    const content = platform.animations.find(
      (animation) => animation.element === wrapper!.get('.mdv-dialog__content').element,
    )
    expect(content?.options.duration).toBe(250)
    expect(wrapper.emitted('opened')).toBeUndefined()
    growth?.finish()
    await flushPromises()
    expect(wrapper.emitted('opened')).toBeUndefined()
    for (const animation of platform.animations) animation.finish()
    await flushPromises()
    expect(wrapper.emitted('opened')).toHaveLength(1)
    expect(wrapper.attributes('data-state')).toBe('open')
  })

  it('performs the shorter basic exit while keeping the native modal open until completion', async () => {
    wrapper = mount(MdvDialog, {
      attachTo: document.body,
      props: { modelValue: true, title: '退出动画' },
    })
    await flushPromises()
    for (const animation of platform.animations) animation.finish()
    await flushPromises()
    const previous = platform.animations.length
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    const exit = platform.animations.slice(previous)
    const movement = exit.find((animation) => animation.frames[0]?.transform)
    expect(movement?.options.duration).toBe(150)
    expect(wrapper.attributes('open')).toBe('')
    expect(wrapper.emitted('closed')).toBeUndefined()
    for (const animation of exit) animation.finish()
    await flushPromises()
    expect(wrapper.attributes('open')).toBeUndefined()
    expect(wrapper.emitted('closed')).toEqual([[{ reason: 'model', returnValue: '' }]])
  })

  it('uses the independent full-screen slide and retains modality until its exit finishes', async () => {
    fullWrapper = mount(MdvFullscreenDialog, {
      attachTo: document.body,
      props: { modelValue: true, title: '全屏动画' },
    })
    await flushPromises()
    const panel = fullWrapper.get('.mdv-fullscreen-dialog__container').element
    const entry = platform.animations.find((animation) => animation.element === panel)
    expect(entry?.frames).toEqual([
      { transform: 'translateY(100%)' },
      { transform: 'translateY(0)' },
    ])
    expect(entry?.options.duration).toBe(300)
    expect(platform.animations).toHaveLength(2)
    for (const animation of platform.animations) animation.finish()
    await flushPromises()
    expect(fullWrapper.emitted('opened')).toHaveLength(1)
    const count = platform.animations.length
    await fullWrapper.setProps({ modelValue: false })
    const exit = platform.animations.slice(count)
    expect(exit.find((animation) => animation.element === panel)?.options.duration).toBe(200)
    expect(fullWrapper.attributes('open')).toBe('')
    for (const animation of exit) animation.finish()
    await flushPromises()
    expect(fullWrapper.attributes('open')).toBeUndefined()
    expect(fullWrapper.emitted('closed')).toEqual([[{ reason: 'model', returnValue: '' }]])
  })
})
