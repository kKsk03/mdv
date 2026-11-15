import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MdvCheckbox from '../components/MdvCheckbox.vue'
import MdvDatePicker from '../components/MdvDatePicker.vue'
import MdvRadio from '../components/MdvRadio.vue'
import MdvRadioGroup from '../components/MdvRadioGroup.vue'
import MdvSlider from '../components/MdvSlider.vue'
import MdvSwitch from '../components/MdvSwitch.vue'
import MdvTextField from '../components/MdvTextField.vue'
import MdvTimePicker from '../components/MdvTimePicker.vue'
import type { MdvCheckboxModelValue } from '../components/checkbox.types'
import type { MdvDateValue } from '../components/date-picker.types'
import type { MdvRadioModelValue } from '../components/radio.types'
import type { MdvSliderModelValue } from '../components/slider.types'
import type { MdvTextFieldValue } from '../components/text-field.types'
import type { MdvTimeValue } from '../components/time-picker.types'
import { mockMenuPlatform } from './menu-test-platform'

const mounted: { unmount: () => void }[] = []
let platform: ReturnType<typeof mockMenuPlatform>

beforeEach(() => {
  platform = mockMenuPlatform()
})

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
})

async function settle() {
  await nextTick()
  await flushPromises()
  await nextTick()
}

function example() {
  const title = ref<MdvTextFieldValue>('周末旅行')
  const channels = ref<MdvCheckboxModelValue>(['email', 'sms'])
  const transport = ref<MdvRadioModelValue>('train')
  const guests = ref<MdvSliderModelValue>(2)
  const reminder = ref(true)
  const date = ref<MdvDateValue>('2026-11-21')
  const time = ref<MdvTimeValue>('09:30')
  const disabled = ref(false)
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h('form', [
          h('fieldset', { disabled: disabled.value }, [
            h(MdvTextField, {
              modelValue: title.value,
              'onUpdate:modelValue': (value: MdvTextFieldValue) => {
                title.value = value
              },
              label: '计划名称',
              name: 'title',
            }),
            ...['email', 'sms'].map((value) =>
              h(MdvCheckbox, {
                modelValue: channels.value,
                'onUpdate:modelValue': (next: MdvCheckboxModelValue) => {
                  channels.value = next
                },
                label: value,
                name: 'channel',
                value,
              }),
            ),
            h(
              MdvRadioGroup,
              {
                modelValue: transport.value,
                'onUpdate:modelValue': (value: MdvRadioModelValue) => {
                  transport.value = value
                },
                name: 'transport',
                label: '交通方式',
              },
              () => [
                h(MdvRadio, { value: 'train', label: '火车' }),
                h(MdvRadio, { value: 'bus', label: '巴士' }),
              ],
            ),
            h(MdvSlider, {
              modelValue: guests.value,
              'onUpdate:modelValue': (value: MdvSliderModelValue | undefined) => {
                if (value === undefined)
                  throw new Error('MdvSlider must emit a defined model value')
                guests.value = value
              },
              name: 'guests',
              label: '人数',
              min: 1,
              max: 6,
            }),
            h(MdvSwitch, {
              modelValue: reminder.value,
              'onUpdate:modelValue': (value: boolean) => {
                reminder.value = value
              },
              label: '提醒',
              name: 'reminder',
              value: 'yes',
            }),
            h(MdvDatePicker, {
              modelValue: date.value,
              'onUpdate:modelValue': (value: MdvDateValue) => {
                date.value = value
              },
              name: 'date',
              label: '日期',
              layout: 'modal',
            }),
            h(MdvTimePicker, {
              modelValue: time.value,
              'onUpdate:modelValue': (value: MdvTimeValue) => {
                time.value = value
              },
              name: 'time',
              label: '时间',
            }),
          ]),
        ]),
    }),
    { attachTo: document.body },
  )
  mounted.push(wrapper)
  const form = wrapper.get<HTMLFormElement>('form').element
  return { wrapper, form, title, channels, transport, guests, reminder, date, time, disabled }
}

describe('原生表单跨组件组合', () => {
  it('保留同名多值和 ISO 字段；取消重置不改值，原生重置恢复各组件初始模型', async () => {
    const state = example()
    await settle()
    const initial = [...new FormData(state.form)]
    expect(new FormData(state.form).getAll('channel')).toEqual(['email', 'sms'])
    expect(new FormData(state.form).get('date')).toBe('2026-11-21')
    expect(new FormData(state.form).get('time')).toBe('09:30')
    expect(initial).toHaveLength(8)

    await state.wrapper.get('input[name="title"]').setValue('另一趟旅程')
    await state.wrapper.get('input[name="channel"][value="sms"]').setValue(false)
    await state.wrapper.get('input[type="radio"][value="bus"]').setValue(true)
    await state.wrapper.get('input[type="range"]').setValue('4')
    await state.wrapper.get('input[name="reminder"]').setValue(false)
    state.date.value = '2026-12-12'
    state.time.value = '14:20'
    await settle()
    const edited = [...new FormData(state.form)]
    expect(new FormData(state.form).get('title')).toBe('另一趟旅程')
    expect(new FormData(state.form).getAll('channel')).toEqual(['email'])
    expect(new FormData(state.form).get('transport')).toBe('bus')
    expect(new FormData(state.form).get('guests')).toBe('4')
    expect(new FormData(state.form).has('reminder')).toBe(false)

    state.form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
    state.form.reset()
    await settle()
    expect([...new FormData(state.form)]).toEqual(edited)

    state.form.reset()
    await settle()
    expect([...new FormData(state.form)]).toEqual(initial)
    expect(state.title.value).toBe('周末旅行')
    expect(state.channels.value).toEqual(['email', 'sms'])
    expect(state.transport.value).toBe('train')
    expect(state.guests.value).toBe(2)
    expect(state.reminder.value).toBe(true)
    expect(state.date.value).toBe('2026-11-21')
    expect(state.time.value).toBe('09:30')
  })

  it('原生 fieldset 禁用时不提交字段，恢复后保留业务值', async () => {
    const state = example()
    await settle()
    const initial = [...new FormData(state.form)]
    state.disabled.value = true
    await settle()
    expect([...new FormData(state.form)]).toEqual([])
    state.disabled.value = false
    await settle()
    expect([...new FormData(state.form)]).toEqual(initial)
  })
})
