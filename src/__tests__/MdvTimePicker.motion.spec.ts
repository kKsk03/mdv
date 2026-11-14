import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import MdvTimePicker from '../components/MdvTimePicker.vue'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
let wrapper: VueWrapper | undefined
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.enableAnimations()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
describe('Time Picker 普通 Modal 动效', () => {
  it('背景、遮罩、文字与完整内容裁切全部结束后才 opened／closed', async () => {
    wrapper = mount(MdvTimePicker, {
      attachTo: document.body,
      props: { modelValue: '09:00', initialView: 'input' },
    })
    await wrapper.get('button[aria-haspopup="dialog"]').trigger('click')
    await flushPromises()
    const enter = [...platform.animations]
    const clip = enter.find((animation) => animation.frames.some((frame) => 'clipPath' in frame))!
    expect(clip.options.duration).toBe(500)
    expect(clip.frames[0]?.clipPath).toContain('65%')
    expect(enter.some((animation) => animation.frames[0]?.height === '35%')).toBe(true)
    for (const animation of enter) if (animation !== clip) animation.finish()
    await flushPromises()
    expect(wrapper.emitted('opened')).toBeUndefined()
    clip.finish()
    await flushPromises()
    expect(wrapper.emitted('opened')).toHaveLength(1)
    await wrapper.get('[data-time-action="cancel"]').trigger('click')
    await flushPromises()
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    for (const animation of platform.animations.slice(enter.length)) animation.finish()
    await flushPromises()
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    expect(wrapper.emitted('closed')).toEqual([[{ reason: 'cancel' }]])
    expect(document.documentElement.style.overflow).toBe('')
  })
  it('关闭中重开不结束原生模态，reduced-motion 完成当前全部动画', async () => {
    wrapper = mount(MdvTimePicker, {
      attachTo: document.body,
      props: { modelValue: '09:00', initialView: 'input', open: true },
    })
    await flushPromises()
    for (const animation of platform.animations) animation.finish()
    await flushPromises()
    await wrapper.get<HTMLInputElement>('[data-time-part="hour"]').setValue('15')
    await wrapper.setProps({ open: false })
    await flushPromises()
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(platform.showModal).toHaveBeenCalledTimes(1)
    expect(wrapper.get<HTMLInputElement>('[data-time-part="hour"]').element.value).toBe('15')
    platform.media('(prefers-reduced-motion: reduce)', true)
    await flushPromises()
    expect(wrapper.get('dialog').attributes('data-state')).toBe('open')
    expect(wrapper.emitted('closed')).toBeUndefined()
  })
})
