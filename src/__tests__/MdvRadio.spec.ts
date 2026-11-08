import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import MdvRadio from '../components/MdvRadio.vue'
import MdvRadioGroup from '../components/MdvRadioGroup.vue'
import type { MdvRadioModelValue, MdvRadioValue } from '../components/radio.types'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

async function settle() {
  await Promise.resolve()
  await nextTick()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function groupExample(
  value: Ref<MdvRadioModelValue>,
  options: Array<{ value: MdvRadioValue; label: string; disabled?: boolean }>,
  groupProps: Record<string, unknown> = {},
) {
  return defineComponent({
    render: () =>
      h(
        MdvRadioGroup,
        {
          ...groupProps,
          modelValue: value.value,
          'onUpdate:modelValue': (next: MdvRadioModelValue) => {
            value.value = next
          },
        },
        {
          default: () =>
            options.map((option) =>
              h(MdvRadio, {
                key: String(option.value),
                value: option.value,
                label: option.label,
                disabled: option.disabled,
              }),
            ),
        },
      ),
  })
}

describe('MdvRadio', () => {
  it('associates its label and descriptions with the native input', () => {
    const wrapper = mount(MdvRadio, {
      attachTo: document.body,
      props: { value: 'yes', label: '接受条款', supportingText: '请确认', required: true },
      attrs: {
        id: 'terms-radio',
        name: 'terms',
        form: 'profile',
        'aria-label': '接受服务条款',
        'data-purpose': 'consent',
        dir: 'rtl',
      },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    expect(input.attributes()).toMatchObject({
      type: 'radio',
      id: 'terms-radio',
      name: 'terms',
      form: 'profile',
      value: 'yes',
      required: '',
      'aria-label': '接受服务条款',
      'data-purpose': 'consent',
      dir: 'rtl',
    })
    expect(wrapper.get('label').attributes('for')).toBe('terms-radio')
    expect(input.attributes('aria-describedby')).toBe(
      wrapper.get('.mdv-radio__supporting span').attributes('id'),
    )
  })

  it('generates stable distinct ids and supports a label slot', () => {
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('div', [
            h(MdvRadio, { value: 'a', label: '替换' }, () => h('strong', '自定义标签')),
            h(MdvRadio, { value: 'b', 'aria-label': '第二项' }),
          ]),
      }),
    )
    const inputs = wrapper.findAll('input')
    expect(inputs[0]!.attributes('id')).toBeTruthy()
    expect(inputs[1]!.attributes('id')).not.toBe(inputs[0]!.attributes('id'))
    expect(wrapper.text()).toBe('自定义标签')
    expect(inputs[1]!.attributes('aria-label')).toBe('第二项')
  })

  it('commits one original native activation and preserves the value type', async () => {
    const onInput = vi.fn<(event: Event) => void>()
    const onChange = vi.fn<(event: Event) => void>()
    const wrapper = mount(MdvRadio, {
      attachTo: document.body,
      props: { value: 1 },
      attrs: { onInput, onChange },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.click()
    await settle()
    expect(input.checked).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[1]])
    expect(onInput).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onInput.mock.calls[0]![0].target).toBe(input)
    expect(onChange.mock.calls[0]![0].target).toBe(input)
  })

  it('does not change the model when click activation is cancelled', async () => {
    const wrapper = mount(MdvRadio, {
      attachTo: document.body,
      props: { value: 'a' },
      attrs: { onClick: (event: MouseEvent) => event.preventDefault() },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.click()
    await settle()
    expect(input.checked).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps strict values and restores a rejected controlled update', async () => {
    const updates = vi.fn<(value: MdvRadioModelValue) => void>()
    const wrapper = mount(MdvRadio, {
      attachTo: document.body,
      props: { modelValue: '1', value: 1, 'onUpdate:modelValue': updates },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    expect(input.checked).toBe(false)
    input.click()
    await settle()
    expect(updates).toHaveBeenCalledExactlyOnceWith(1)
    expect(input.checked).toBe(false)
    expect(input.getAttribute('aria-checked')).toBe('false')
  })

  it('keeps a group mutually exclusive and preserves number/string values', async () => {
    const selected = ref<MdvRadioModelValue>('1')
    const wrapper = mount(
      groupExample(selected, [
        { value: '1', label: '字符串' },
        { value: 1, label: '数字' },
      ]),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    expect(inputs.map((input) => input.element.checked)).toEqual([true, false])
    inputs[1]!.element.click()
    await settle()
    expect(selected.value).toBe(1)
    expect(inputs.map((input) => input.element.checked)).toEqual([false, true])
  })

  it('moves focus and selection with arrows while skipping disabled radios', async () => {
    const selected = ref<MdvRadioModelValue>(null)
    const wrapper = mount(
      groupExample(selected, [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ]),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[0]!.element.focus()
    await inputs[0]!.trigger('keydown', { key: 'ArrowDown' })
    await settle()
    expect(selected.value).toBe('c')
    expect(document.activeElement).toBe(inputs[2]!.element)
    expect(inputs.map((input) => input.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    await inputs[2]!.trigger('keydown', { key: 'Home' })
    await settle()
    expect(selected.value).toBe('a')
    expect(document.activeElement).toBe(inputs[0]!.element)
  })

  it('uses the selected radio as the tab stop and exposes group descriptions', () => {
    const selected = ref<MdvRadioModelValue>('b')
    const wrapper = mount(
      groupExample(
        selected,
        [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        { label: '选择一项', supportingText: '只能选择一个' },
      ),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    expect(inputs.map((input) => input.attributes('tabindex'))).toEqual(['-1', '0'])
    expect(wrapper.get('legend').text()).toBe('选择一项')
    const description = wrapper.get('.mdv-radio-group__supporting span')
    expect(wrapper.get('fieldset').attributes('aria-describedby')).toBe(
      description.attributes('id'),
    )
    expect(inputs[0]!.attributes('aria-describedby')).toBe(description.attributes('id'))
  })

  it('validates a required group and restores its supporting text after selection', async () => {
    const selected = ref<MdvRadioModelValue>(null)
    const wrapper = mount(
      groupExample(
        selected,
        [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        { required: true, supportingText: '请选择', errorText: '必须选择一项' },
      ),
      { attachTo: document.body },
    )
    const group = wrapper.getComponent(MdvRadioGroup)
    expect(group.vm.reportValidity()).toBe(false)
    await nextTick()
    expect(group.classes()).toContain('mdv-radio-group--error')
    expect(group.get('.mdv-radio-group__supporting').text()).toBe('必须选择一项')
    wrapper.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(group.vm.reportValidity()).toBe(true)
    expect(group.classes()).not.toContain('mdv-radio-group--error')
    expect(group.get('.mdv-radio-group__supporting').text()).toBe('请选择')
  })

  it('respects disabled fieldsets and restores the initial value on reset', async () => {
    const selected = ref<MdvRadioModelValue>('b')
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('form', [
            h(
              MdvRadioGroup,
              {
                modelValue: selected.value,
                name: 'choice',
                'onUpdate:modelValue': (next: MdvRadioModelValue) => {
                  selected.value = next
                },
              },
              {
                default: () => [
                  h(MdvRadio, { value: 'a', label: 'A' }),
                  h(MdvRadio, { value: 'b', label: 'B' }),
                ],
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[0]!.element.click()
    await settle()
    expect(selected.value).toBe('a')
    wrapper.get('form').element.reset()
    await settle()
    expect(selected.value).toBe('b')
    expect(inputs.map((input) => input.element.checked)).toEqual([false, true])
    const fieldset = wrapper.get('fieldset').element
    fieldset.disabled = true
    inputs[0]!.element.click()
    await settle()
    expect(selected.value).toBe('b')
    expect(inputs[0]!.element.matches(':disabled')).toBe(true)
  })

  it('resolves preset and seed colors without changing global variables', async () => {
    const wrapper = mount(MdvRadio, {
      attachTo: document.body,
      props: { value: 'a', color: 'success' },
    })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--mdv-radio-color')).toBe(
      'var(--mdv-sys-color-success)',
    )
    await wrapper.setProps({ color: '#06c' })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--mdv-radio-color')).toMatch(
      /^light-dark\(/,
    )
    expect(document.documentElement.style.getPropertyValue('--mdv-sys-color-primary')).toBe('')
  })

  it('exposes native focus and validity methods', () => {
    const wrapper = mount(MdvRadio, {
      attachTo: document.body,
      props: { value: 'a', required: true },
    })
    wrapper.vm.focus({ preventScroll: true })
    expect(document.activeElement).toBe(wrapper.get('input').element)
    expect(wrapper.vm.checkValidity()).toBe(false)
    wrapper.vm.setCustomValidity('自定义错误')
    expect(wrapper.vm.reportValidity()).toBe(false)
    wrapper.vm.setCustomValidity('')
    wrapper.vm.blur()
    expect(document.activeElement).not.toBe(wrapper.get('input').element)
  })
})
