import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import MdvTimePicker from '../components/MdvTimePicker.vue'
import MdvDialog from '../components/MdvDialog.vue'
import type { MdvTimePickerExpose, MdvTimeValue } from '../components/time-picker.types'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
const wrappers: VueWrapper[] = []
function track<T extends VueWrapper>(wrapper: T) {
  wrappers.push(wrapper)
  return wrapper
}
function entry(wrapper: VueWrapper) {
  return wrapper.get<HTMLInputElement>('[data-time-entry]')
}
function field(wrapper: VueWrapper, part: 'hour' | 'minute') {
  return wrapper.get<HTMLInputElement>(`[data-time-part="${part}"]`)
}
async function open(wrapper: VueWrapper) {
  await wrapper.get('button[aria-haspopup="dialog"]').trigger('click')
  await flushPromises()
}
async function pointer(
  target: EventTarget,
  type: string,
  pointerId: number,
  init: MouseEventInit = {},
) {
  // 原生鼠标属性通过构造器初始化，避免 trigger 写入继承的只读属性。
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    isPrimary: { value: true },
    pointerType: { value: 'mouse' },
  })
  target.dispatchEvent(event)
  await flushPromises()
}
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
  vi.stubGlobal('innerWidth', 1100)
  vi.stubGlobal('innerHeight', 900)
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Time Picker 输入、草稿与受控请求', () => {
  it('外部输入不强制打开，面板取消丢弃草稿，确定才提交', async () => {
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: { modelValue: '09:30', initialView: 'input' },
      }),
    )
    entry(wrapper).element.focus()
    await flushPromises()
    expect(platform.showModal).not.toHaveBeenCalled()
    await open(wrapper)
    await field(wrapper, 'hour').setValue('14')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('[data-time-action="cancel"]').trigger('click')
    await flushPromises()
    expect(entry(wrapper).element.value).toBe('09:30')
    expect(wrapper.emitted('cancel')).toEqual([[{ reason: 'cancel' }]])
    await open(wrapper)
    await field(wrapper, 'hour').setValue('14')
    await wrapper.get('[data-time-action="confirm"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([['14:30']])
    expect(wrapper.emitted('confirm')).toEqual([['14:30']])
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(false)
  })
  it('父级拒绝打开、模型与关闭时不伪造已接受状态', async () => {
    const update = vi.fn<(value: MdvTimeValue) => void>()
    const openUpdate = vi.fn<(value: boolean) => void>()
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: {
          modelValue: '09:00',
          'onUpdate:modelValue': update,
          open: false,
          'onUpdate:open': openUpdate,
          initialView: 'input',
        },
      }),
    )
    await open(wrapper)
    expect(openUpdate).toHaveBeenCalledWith(true)
    expect(platform.showModal).not.toHaveBeenCalled()
    await entry(wrapper).setValue('10:00')
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(update).toHaveBeenCalledWith('10:00')
    expect(entry(wrapper).element.value).toBe('09:00')
    await wrapper.setProps({ open: true })
    await flushPromises()
    await field(wrapper, 'hour').setValue('11')
    await wrapper.get('[data-time-action="confirm"]').trigger('click')
    await flushPromises()
    expect(update).toHaveBeenLastCalledWith('11:00')
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    await wrapper.get('[data-time-action="cancel"]').trigger('click')
    await flushPromises()
    expect(openUpdate).toHaveBeenLastCalledWith(false)
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
  })
  it('无效／组合输入不提交，步长错误保留原文，有效失焦输入提交', async () => {
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: { modelValue: '09:00', minuteStep: 5 },
      }),
    )
    await entry(wrapper).setValue('09:03')
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(entry(wrapper).element.value).toBe('09:03')
    expect(entry(wrapper).element.validity.customError).toBe(true)
    await entry(wrapper).trigger('compositionstart')
    await entry(wrapper).setValue('10:15')
    await entry(wrapper).trigger('keydown', { key: 'Enter', isComposing: true })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await entry(wrapper).trigger('compositionend')
    await entry(wrapper).trigger('blur')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([['10:15']])
  })
  it('12 小时 AM／PM 与小时制切换保留相同时间', async () => {
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: { modelValue: '00:00', hourCycle: 'h12', locale: 'en-US', initialView: 'input' },
      }),
    )
    await open(wrapper)
    expect(field(wrapper, 'hour').element.value).toBe('12')
    await wrapper.get<HTMLInputElement>('input[type="radio"][value="1"]').setValue()
    await wrapper.get('[data-time-action="confirm"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('confirm')).toEqual([['12:00']])
    await open(wrapper)
    await wrapper.setProps({ hourCycle: 'h23' })
    expect(field(wrapper, 'hour').element.value).toBe('12')
    await wrapper.setProps({ modelValue: '01:00', hourCycle: 'h12' })
    await wrapper.setProps({ modelValue: '00:00' })
    await wrapper.setProps({ hourCycle: 'h23' })
    expect(field(wrapper, 'hour').element.value).toBe('00')
  })
})
describe('拨盘、空间回退与动态约束', () => {
  it('auto 按主指针选择模式，用户切换保留草稿，窄窗口使用相同输入节点', async () => {
    platform.media('(pointer: fine)', true)
    const wrapper = track(
      mount(MdvTimePicker, { attachTo: document.body, props: { modelValue: '09:30' } }),
    )
    await open(wrapper)
    expect(wrapper.find('[role="slider"]').exists()).toBe(false)
    await field(wrapper, 'hour').setValue('14')
    const input = field(wrapper, 'hour').element
    await wrapper.get('[data-time-action="view"]').trigger('click')
    expect(wrapper.find('[role="slider"]').exists()).toBe(true)
    vi.stubGlobal('innerHeight', 320)
    window.dispatchEvent(new Event('resize'))
    await flushPromises()
    expect(wrapper.find('[role="slider"]').exists()).toBe(false)
    expect(field(wrapper, 'hour').element).toBe(input)
    expect(input.value).toBe('14')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    vi.stubGlobal('innerHeight', 900)
    window.dispatchEvent(new Event('resize'))
    await flushPromises()
    expect(wrapper.find('[role="slider"]').exists()).toBe(true)
  })
  it('触控优先拨盘；方向键跳过禁用小时，分钟步进不立即提交模型', async () => {
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: {
          modelValue: '11:00',
          minuteStep: 15,
          disabledTime: (time) => time >= '12:00' && time < '13:00',
        },
      }),
    )
    await open(wrapper)
    const dial = wrapper.get('[role="slider"]')
    await dial.trigger('keydown', { key: 'ArrowRight' })
    expect(field(wrapper, 'hour').element.value).toBe('13')
    await dial.trigger('keydown', { key: 'Enter' })
    await dial.trigger('keydown', { key: 'ArrowRight' })
    expect(field(wrapper, 'minute').element.value).toBe('15')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
  it('24 小时双圈拖动选中内圈；取消拖动恢复原草稿', async () => {
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: { modelValue: '09:30', initialView: 'dial', hourCycle: 'h23' },
      }),
    )
    await open(wrapper)
    const dial = wrapper.get('[role="slider"]')
    vi.spyOn(dial.element, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 256,
      bottom: 256,
      width: 256,
      height: 256,
      toJSON: () => ({}),
    })
    await pointer(dial.element, 'pointerdown', 1, { clientX: 196, clientY: 128 })
    expect(field(wrapper, 'hour').element.value).toBe('15')
    await pointer(dial.element, 'pointercancel', 1)
    expect(field(wrapper, 'hour').element.value).toBe('09')
    await pointer(dial.element, 'pointerdown', 2, { clientX: 196, clientY: 128 })
    await pointer(dial.element, 'pointerup', 2)
    expect(dial.attributes('aria-label')).toBe('分钟')
    expect(field(wrapper, 'hour').element.value).toBe('15')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
  it('动态限制重新校验但不替换模型，无可用时间时仍可取消', async () => {
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: { modelValue: '09:00', initialView: 'input' },
      }),
    )
    await open(wrapper)
    await wrapper.setProps({ min: '10:00' })
    expect(wrapper.get<HTMLButtonElement>('[data-time-action="confirm"]').element.disabled).toBe(
      true,
    )
    expect(field(wrapper, 'hour').element.value).toBe('09')
    await wrapper.setProps({ disabledTime: () => true })
    expect(wrapper.get('[role="status"]').text()).toBe('没有可用时间')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('[data-time-action="cancel"]').trigger('click')
    await flushPromises()
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(false)
  })
})
describe('表单、焦点与模态组合', () => {
  it('只序列化 HH:mm，内部时段不污染表单；reset 恢复初始值', async () => {
    const time = ref<MdvTimeValue>('09:00')
    const Host = defineComponent({
      setup: () => () =>
        h(
          'form',
          { id: 'booking' },
          h(MdvTimePicker, {
            modelValue: time.value,
            'onUpdate:modelValue': (value: MdvTimeValue) => {
              time.value = value
            },
            name: 'time',
            hourCycle: 'h12',
            locale: 'en-US',
            initialView: 'input',
          }),
        ),
    })
    const wrapper = track(mount(Host, { attachTo: document.body }))
    await open(wrapper)
    expect([...new FormData(wrapper.get<HTMLFormElement>('form').element).entries()]).toEqual([
      ['time', '09:00'],
    ])
    await wrapper.get('[data-time-action="cancel"]').trigger('click')
    await flushPromises()
    await entry(wrapper).setValue('1:05 PM')
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(new FormData(wrapper.get<HTMLFormElement>('form').element).get('time')).toBe('13:05')
    wrapper.get<HTMLFormElement>('form').element.reset()
    await flushPromises()
    expect(time.value).toBe('09:00')
    expect(new FormData(wrapper.get<HTMLFormElement>('form').element).get('time')).toBe('09:00')
  })
  it('关联外部表单，required／自定义校验与 clearable 一致', async () => {
    const form = document.createElement('form')
    form.id = 'external'
    document.body.append(form)
    const wrapper = track(
      mount(MdvTimePicker, {
        attachTo: document.body,
        props: { modelValue: '09:00', required: true, clearable: true, name: 'time' },
        attrs: { form: 'external' },
      }),
    )
    const api = wrapper.vm as unknown as MdvTimePickerExpose
    expect(new FormData(form).get('time')).toBe('09:00')
    api.setCustomValidity('业务错误')
    expect(api.checkValidity()).toBe(false)
    api.setCustomValidity('')
    await wrapper.get('[aria-label="清除时间"]').trigger('click')
    await flushPromises()
    expect(api.checkValidity()).toBe(false)
    expect(new FormData(form).get('time')).toBe('')
  })
  it('disabled／readonly／禁用 fieldset 均阻止打开；Escape 恢复入口', async () => {
    const wrapper = track(
      mount(MdvTimePicker, { attachTo: document.body, props: { disabled: true } }),
    )
    await open(wrapper)
    expect(platform.showModal).not.toHaveBeenCalled()
    await wrapper.setProps({ disabled: false, readonly: true })
    await open(wrapper)
    expect(platform.showModal).not.toHaveBeenCalled()
    await wrapper.setProps({ readonly: false })
    const trigger = wrapper.get<HTMLButtonElement>('button[aria-haspopup="dialog"]')
    trigger.element.focus()
    await open(wrapper)
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(document.activeElement).toBe(trigger.element)
    expect(document.documentElement.style.overflow).toBe('')
    expect(wrapper.emitted('cancel')).toEqual([[{ reason: 'escape' }]])
    const host = track(
      mount(
        defineComponent({ render: () => h('fieldset', { disabled: true }, h(MdvTimePicker)) }),
        { attachTo: document.body },
      ),
    )
    await open(host)
    expect(platform.showModal).toHaveBeenCalledTimes(1)
  })
  it('嵌套 Dialog 关闭时间选择器后，外层保持打开和滚动锁', async () => {
    const host = track(
      mount(
        defineComponent({
          render: () =>
            h(
              MdvDialog,
              { modelValue: true, title: '预约' },
              { default: () => h(MdvTimePicker, { modelValue: '09:00' }) },
            ),
        }),
        { attachTo: document.body },
      ),
    )
    await flushPromises()
    await open(host)
    const picker = host.getComponent(MdvTimePicker)
    await picker.get('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(host.findAll<HTMLDialogElement>('dialog').map((dialog) => dialog.element.open)).toEqual([
      true,
      false,
    ])
    expect(document.documentElement.style.overflow).toBe('hidden')
  })
})
