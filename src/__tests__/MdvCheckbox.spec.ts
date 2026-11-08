import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MdvCheckbox from '../components/MdvCheckbox.vue'
import type { MdvCheckboxModelValue } from '../components/checkbox.types'

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

describe('MdvCheckbox', () => {
  it('associates labels and descriptions and puts native attributes on the input', () => {
    const wrapper = mount(MdvCheckbox, {
      props: { label: '服务条款', supportingText: '请阅读', required: true },
      attrs: {
        id: 'terms',
        name: 'terms',
        form: 'profile',
        tabindex: 2,
        'aria-describedby': 'external external',
        'aria-label': '同意服务条款',
        'data-purpose': 'consent',
        class: 'custom-checkbox',
        style: { width: '280px' },
        dir: 'rtl',
        lang: 'zh',
      },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    expect(wrapper.classes()).toContain('custom-checkbox')
    expect((wrapper.element as HTMLElement).style.width).toBe('280px')
    expect(wrapper.attributes('id')).toBeUndefined()
    expect(wrapper.attributes('dir')).toBe('rtl')
    expect(input.attributes()).toMatchObject({
      type: 'checkbox',
      id: 'terms',
      name: 'terms',
      form: 'profile',
      tabindex: '2',
      required: '',
      'aria-label': '同意服务条款',
      'data-purpose': 'consent',
      dir: 'rtl',
      lang: 'zh',
    })
    expect(wrapper.get('label').attributes('for')).toBe('terms')
    expect(input.element.checked).toBe(false)
    expect(input.element.value).toBe('on')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(input.attributes('aria-describedby')?.split(' ')).toEqual([
      'external',
      wrapper.get('.mdv-checkbox__supporting span').attributes('id'),
    ])
  })

  it('generates distinct ids, supports native accessible names and lets the slot replace label', () => {
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('div', [
            h(MdvCheckbox, { label: '被替换' }, () => h('strong', '插槽标签')),
            h(MdvCheckbox, { 'aria-label': '选择当前行' }),
          ]),
      }),
    )
    const inputs = wrapper.findAll('input')
    expect(inputs[0]!.attributes('id')).toBeTruthy()
    expect(inputs[1]!.attributes('id')).not.toBe(inputs[0]!.attributes('id'))
    expect(wrapper.text()).toBe('插槽标签')
    expect(inputs[1]!.attributes('aria-label')).toBe('选择当前行')
    expect(wrapper.findAll('.mdv-checkbox__label')).toHaveLength(1)
  })

  it('toggles from native activation and forwards one original input and change event', async () => {
    const onInput = vi.fn<(event: Event) => void>()
    const onChange = vi.fn<(event: Event) => void>()
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvCheckbox, {
      attachTo: document.body,
      attrs: { onInput, onChange, onClick },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.click()
    await settle()
    expect(input.checked).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(onInput).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(onInput.mock.calls[0]![0].target).toBe(input)
    expect(onChange.mock.calls[0]![0].target).toBe(input)
    input.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([[true], [false]])
  })

  it('updates from a change-only integration without a duplicate model emission', async () => {
    const wrapper = mount(MdvCheckbox)
    await wrapper.get('input').setValue(true)
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('lets label text and the control area activate once while links keep their own action', async () => {
    const onLink = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const wrapper = mount(MdvCheckbox, {
      attachTo: document.body,
      slots: {
        default: () => [h('span', '同意'), h('a', { href: '#terms', onClick: onLink }, '条款')],
      },
    })
    wrapper.get<HTMLElement>('.mdv-checkbox__label span').element.click()
    await settle()
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    wrapper.get<HTMLAnchorElement>('a').element.click()
    await settle()
    expect(onLink).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    wrapper.get<HTMLElement>('.mdv-checkbox__control').element.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([[true], [false]])
  })

  it('accepts programmatic values and item values without synthesizing native events', async () => {
    const onChange = vi.fn<(event: Event) => void>()
    const wrapper = mount(MdvCheckbox, {
      props: { modelValue: ['a'], value: 'a' },
      attrs: { onChange },
    })
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
    await wrapper.setProps({ value: 'b' })
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(false)
    await wrapper.setProps({ modelValue: ['b'], indeterminate: true })
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
    expect(wrapper.get<HTMLInputElement>('input').element.indeterminate).toBe(true)
    expect(wrapper.get('input').attributes('aria-checked')).toBe('mixed')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('preserves the parent value when a controlled update is rejected, including another activation', async () => {
    const updates = vi.fn<(value: MdvCheckboxModelValue) => void>()
    const wrapper = mount(MdvCheckbox, {
      attachTo: document.body,
      props: { modelValue: true, 'onUpdate:modelValue': updates },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.click()
    await settle()
    expect(updates).toHaveBeenCalledExactlyOnceWith(false)
    expect(input.checked).toBe(true)
    expect(input.getAttribute('aria-checked')).toBe('true')
    input.click()
    await settle()
    expect(updates).toHaveBeenCalledTimes(2)
    expect(input.checked).toBe(true)
  })

  it('creates new arrays, preserves other members and distinguishes numbers from strings', async () => {
    const original = ['1']
    const wrapper = mount(MdvCheckbox, {
      attachTo: document.body,
      props: { modelValue: original, value: 1 },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    expect(input.checked).toBe(false)
    input.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([[['1', 1]]])
    expect(original).toEqual(['1'])
    expect(wrapper.emitted('update:modelValue')![0]![0]).not.toBe(original)
    input.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([[['1', 1]], [['1']]])
    expect(original).toEqual(['1'])
  })

  it('shares an array model between independent native controls', async () => {
    const selections = ref<MdvCheckboxModelValue>(['email'])
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            'div',
            ['email', 'sms'].map((value) =>
              h(MdvCheckbox, {
                value,
                label: value,
                modelValue: selections.value,
                'onUpdate:modelValue': (next: MdvCheckboxModelValue) => {
                  selections.value = next
                },
              }),
            ),
          ),
      }),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.click()
    await settle()
    expect(selections.value).toEqual(['email', 'sms'])
    expect(inputs.map((input) => input.element.checked)).toEqual([true, true])
    inputs[0]!.element.click()
    await settle()
    expect(selections.value).toEqual(['sms'])
    expect(inputs.map((input) => input.element.checked)).toEqual([false, true])
  })

  it.each([false, true])(
    'activates a mixed control with checked=%s as checked and clears mixed',
    async (initial) => {
      const wrapper = mount(MdvCheckbox, {
        attachTo: document.body,
        props: { modelValue: initial, indeterminate: true },
      })
      const input = wrapper.get<HTMLInputElement>('input').element
      expect(input.indeterminate).toBe(true)
      expect(input.getAttribute('aria-checked')).toBe('mixed')
      input.click()
      await settle()
      expect(input.checked).toBe(true)
      expect(input.indeterminate).toBe(false)
      expect(wrapper.emitted('update:indeterminate')).toEqual([[false]])
      expect(input.getAttribute('aria-checked')).toBe('true')
      input.click()
      await settle()
      expect(input.checked).toBe(false)
      expect(input.indeterminate).toBe(false)
      expect(wrapper.emitted('update:indeterminate')).toEqual([[false]])
    },
  )

  it('keeps array membership unique when clearing a mixed item that is already present', async () => {
    const wrapper = mount(MdvCheckbox, {
      attachTo: document.body,
      props: { modelValue: ['a'], value: 'a', indeterminate: true },
    })
    wrapper.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('update:indeterminate')).toEqual([[false]])
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
  })

  it('does not repeat a rejected mixed update when Vue flushes between input and change', async () => {
    const updates = vi.fn<(value: boolean) => void>()
    const wrapper = mount(MdvCheckbox, {
      props: {
        modelValue: true,
        indeterminate: true,
        'onUpdate:indeterminate': updates,
      },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    input.element.indeterminate = false
    await input.trigger('input')
    await nextTick()
    await input.trigger('change')
    expect(updates).toHaveBeenCalledExactlyOnceWith(false)
    await settle()
    expect(input.element.indeterminate).toBe(true)
    expect(input.element.checked).toBe(true)
  })

  it.each([false, true])(
    'honors cancellation of a mixed click with checked=%s',
    async (initial) => {
      const wrapper = mount(MdvCheckbox, {
        attachTo: document.body,
        props: { modelValue: initial, indeterminate: true },
        attrs: { onClick: (event: MouseEvent) => event.preventDefault() },
      })
      const input = wrapper.get<HTMLInputElement>('input').element
      input.click()
      await settle()
      expect(input.checked).toBe(initial)
      expect(input.indeterminate).toBe(true)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('update:indeterminate')).toBeUndefined()
    },
  )

  it('respects disabled and inherited fieldset disabling while preserving the first legend exception', async () => {
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    const legend = document.createElement('legend')
    fieldset.append(legend)
    document.body.append(fieldset)
    const disabled = mount(MdvCheckbox, {
      props: { disabled: true },
      attrs: { id: 'disabled-checkbox' },
      attachTo: document.body,
    })
    const inherited = mount(MdvCheckbox, {
      props: { required: true },
      attrs: { id: 'inherited-checkbox' },
      attachTo: fieldset,
    })
    const excepted = mount(MdvCheckbox, {
      attrs: { id: 'legend-checkbox' },
      attachTo: legend,
    })
    for (const wrapper of [disabled, inherited, excepted]) {
      expect(wrapper.get<HTMLLabelElement>('label').element.control).toBe(
        wrapper.get<HTMLInputElement>('input').element,
      )
    }
    for (const wrapper of [disabled, inherited]) {
      const input = wrapper.get<HTMLInputElement>('input').element
      input.click()
      wrapper.get<HTMLLabelElement>('label').element.click()
      await settle()
      expect(input.matches(':disabled')).toBe(true)
      expect(input.willValidate).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    }
    expect(excepted.emitted('update:modelValue')).toBeUndefined()
    excepted.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(excepted.emitted('update:modelValue')).toEqual([[true]])
    fieldset.disabled = false
    inherited.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(inherited.emitted('update:modelValue')).toEqual([[true]])
  })

  it('submits only successful controls using native values and repeated names', () => {
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('form', [
            h(MdvCheckbox, { modelValue: ['email', 1], name: 'channel', value: 'email' }),
            h(MdvCheckbox, { modelValue: ['email', 1], name: 'channel', value: 1 }),
            h(MdvCheckbox, { modelValue: false, indeterminate: true, name: 'mixed' }),
            h(MdvCheckbox, { modelValue: false, name: 'unchecked' }),
            h(MdvCheckbox, { modelValue: true, disabled: true, name: 'disabled' }),
            h(MdvCheckbox, { modelValue: true, name: 'default' }),
          ]),
      }),
      { attachTo: document.body },
    )
    const data = new FormData(wrapper.get<HTMLFormElement>('form').element)
    expect([...data.entries()]).toEqual([
      ['channel', 'email'],
      ['channel', '1'],
      ['default', 'on'],
    ])
  })

  it('reports required only after native validation and restores supporting text after correction', async () => {
    const wrapper = mount(MdvCheckbox, {
      attachTo: document.body,
      props: { required: true, label: '服务条款', supportingText: '请阅读', errorText: '请同意' },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    expect(input.validity.valueMissing).toBe(true)
    expect(wrapper.classes()).not.toContain('mdv-checkbox--error')
    expect(wrapper.vm.checkValidity()).toBe(false)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-checkbox--error')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(wrapper.get('.mdv-checkbox__supporting').text()).toBe('请同意')
    expect(input.getAttribute('aria-errormessage')).toBe(
      wrapper.get('.mdv-checkbox__supporting span').attributes('id'),
    )
    input.click()
    await settle()
    expect(wrapper.vm.reportValidity()).toBe(true)
    expect(wrapper.classes()).not.toContain('mdv-checkbox--error')
    expect(wrapper.get('.mdv-checkbox__supporting').text()).toBe('请阅读')
  })

  it('keeps business errors separate from native validity and exposes custom validity', async () => {
    const wrapper = mount(MdvCheckbox, {
      props: { error: true, errorText: '业务错误', supportingText: '说明', color: 'success' },
      attrs: { 'aria-describedby': 'external', 'aria-errormessage': 'external-error' },
    })
    expect(wrapper.vm.checkValidity()).toBe(true)
    expect(wrapper.get('.mdv-checkbox__supporting').text()).toBe('业务错误')
    expect(wrapper.get('input').attributes('aria-errormessage')).toContain('external-error ')
    await wrapper.setProps({ error: false })
    expect(wrapper.get('.mdv-checkbox__supporting').text()).toBe('说明')
    wrapper.vm.setCustomValidity('服务端校验失败')
    expect(wrapper.classes()).not.toContain('mdv-checkbox--error')
    await wrapper.setProps({ errorText: '' })
    expect(wrapper.vm.reportValidity()).toBe(false)
    await nextTick()
    expect(wrapper.get('.mdv-checkbox__supporting').text()).toBe('服务端校验失败')
    wrapper.vm.setCustomValidity('')
    await nextTick()
    expect(wrapper.get('.mdv-checkbox__supporting').text()).toBe('说明')
    expect(wrapper.get('input').attributes('aria-describedby')).toContain('external ')
  })

  it('marks an empty required option after a native form submit without hover', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const onInvalid = vi.fn<(event: Event) => void>((event) => event.preventDefault())
    const wrapper = mount(MdvCheckbox, {
      attachTo: form,
      props: { required: true },
      attrs: { onInvalid },
    })
    form.requestSubmit()
    await nextTick()
    expect(onInvalid).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(wrapper.classes()).toContain('mdv-checkbox--error')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('does not turn same-name required controls into an at-least-one group constraint', () => {
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('form', [
            h(MdvCheckbox, { modelValue: true, name: 'choice', value: 'a', required: true }),
            h(MdvCheckbox, { modelValue: false, name: 'choice', value: 'b', required: true }),
          ]),
      }),
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    expect(inputs[0]!.element.validity.valid).toBe(true)
    expect(inputs[1]!.element.validity.valueMissing).toBe(true)
  })

  it('exposes native focus and blur while forwarding their original events', async () => {
    const onFocus = vi.fn<(event: FocusEvent) => void>()
    const onBlur = vi.fn<(event: FocusEvent) => void>()
    const wrapper = mount(MdvCheckbox, { attachTo: document.body, attrs: { onFocus, onBlur } })
    wrapper.vm.focus({ preventScroll: true })
    await nextTick()
    const input = wrapper.get<HTMLInputElement>('input').element
    expect(document.activeElement).toBe(input)
    expect(onFocus).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent))
    wrapper.vm.blur()
    expect(document.activeElement).not.toBe(input)
    expect(onBlur).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent))
  })

  it('restores array and mixed snapshots on reset while preserving native custom constraints', async () => {
    const selections = ref<MdvCheckboxModelValue>(['a'])
    const mixed = ref(true)
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('form', [
            h(MdvCheckbox, {
              modelValue: selections.value,
              value: 'b',
              indeterminate: mixed.value,
              name: 'choice',
              'onUpdate:modelValue': (next: MdvCheckboxModelValue) => {
                selections.value = next
              },
              'onUpdate:indeterminate': (next: boolean) => {
                mixed.value = next
              },
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    const checkbox = wrapper.getComponent(MdvCheckbox)
    const input = wrapper.get<HTMLInputElement>('input').element
    input.click()
    await settle()
    expect(selections.value).toEqual(['a', 'b'])
    expect(mixed.value).toBe(false)
    checkbox.vm.setCustomValidity('仍有约束')
    expect(checkbox.vm.reportValidity()).toBe(false)
    await nextTick()
    wrapper.get<HTMLFormElement>('form').element.reset()
    await settle()
    expect(selections.value).toEqual(['a'])
    expect(mixed.value).toBe(true)
    expect(input.checked).toBe(false)
    expect(input.indeterminate).toBe(true)
    expect(checkbox.classes()).not.toContain('mdv-checkbox--error')
    expect(input.validity.customError).toBe(true)
    expect(checkbox.vm.checkValidity()).toBe(false)
    await nextTick()
    expect(checkbox.classes()).toContain('mdv-checkbox--error')
  })

  it('follows external form association and honors cancelled resets and unmount cleanup', async () => {
    const first = document.createElement('form')
    first.id = 'first'
    const second = document.createElement('form')
    second.id = 'second'
    document.body.append(first, second)
    const associated = ref('first')
    const value = ref<MdvCheckboxModelValue>(true)
    const updates = vi.fn<(next: MdvCheckboxModelValue) => void>((next) => {
      value.value = next
    })
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(MdvCheckbox, {
            form: associated.value,
            name: 'external',
            value: 'yes',
            modelValue: value.value,
            'onUpdate:modelValue': updates,
          }),
      }),
      { attachTo: document.body },
    )
    const input = wrapper.get<HTMLInputElement>('input').element
    expect(new FormData(first).get('external')).toBe('yes')
    input.click()
    await settle()
    first.addEventListener('reset', (event) => event.preventDefault(), { once: true })
    first.reset()
    await settle()
    expect(input.checked).toBe(false)
    associated.value = 'second'
    await nextTick()
    first.reset()
    await settle()
    expect(value.value).toBe(false)
    second.reset()
    await settle()
    expect(value.value).toBe(true)
    expect(input.checked).toBe(true)
    expect(new FormData(second).get('external')).toBe('yes')
    const count = updates.mock.calls.length
    wrapper.unmount()
    second.reset()
    await settle()
    expect(updates).toHaveBeenCalledTimes(count)
  })

  it('resolves preset and seed colors locally and falls back for unsupported colors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(MdvCheckbox, { props: { color: 'success' } })
    const style = (wrapper.element as HTMLElement).style
    expect(style.getPropertyValue('--mdv-checkbox-color')).toBe('var(--mdv-sys-color-success)')
    await wrapper.setProps({ color: '#06C' })
    expect(style.getPropertyValue('--mdv-checkbox-color')).toMatch(/^light-dark\(/)
    expect(document.documentElement.style.getPropertyValue('--mdv-sys-color-primary')).toBe('')
    await wrapper.setProps({ color: '#invalid' })
    expect(style.getPropertyValue('--mdv-checkbox-color')).toBe('')
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('unsupported color'))
  })

  it('starts keyboard feedback only for Space and keeps it separate from model activation', async () => {
    const wrapper = mount(MdvCheckbox)
    const input = wrapper.get('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('.mdv-checkbox__ripple').exists()).toBe(false)
    await input.trigger('keydown', { key: ' ' })
    expect(wrapper.find('.mdv-checkbox__ripple').exists()).toBe(true)
    await input.trigger('keyup', { key: ' ' })
    expect(wrapper.get('.mdv-checkbox__ripple').classes()).toContain(
      'mdv-checkbox__ripple--released',
    )
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
