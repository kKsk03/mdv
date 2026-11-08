import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import MdvSwitch from '../components/MdvSwitch.vue'
import MdvIcon from '../components/MdvIcon.vue'

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

describe('MdvSwitch', () => {
  it('associates its label and description with the native switch and splits outer attrs', () => {
    const wrapper = mount(MdvSwitch, {
      attachTo: document.body,
      props: { label: '接收通知', supportingText: '接收重要提醒', required: true },
      attrs: {
        id: 'notifications-switch',
        name: 'notifications',
        form: 'profile-form',
        'aria-label': '接收通知开关',
        'data-purpose': 'notifications',
        dir: 'rtl',
        lang: 'zh-CN',
        class: 'custom-switch',
        style: { marginTop: '4px' },
      },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    const description = wrapper.get('.mdv-switch__supporting span')

    expect(input.attributes()).toMatchObject({
      type: 'checkbox',
      role: 'switch',
      id: 'notifications-switch',
      name: 'notifications',
      form: 'profile-form',
      required: '',
      value: 'on',
      'aria-checked': 'false',
      'aria-label': '接收通知开关',
      'data-purpose': 'notifications',
    })
    expect(input.attributes('dir')).toBeUndefined()
    expect(input.attributes('lang')).toBeUndefined()
    expect(wrapper.attributes()).toMatchObject({ dir: 'rtl', lang: 'zh-CN' })
    expect(wrapper.classes()).toContain('custom-switch')
    expect((wrapper.element as HTMLElement).style.marginTop).toBe('4px')
    expect(wrapper.get('label').attributes('for')).toBe('notifications-switch')
    expect(input.attributes('aria-describedby')).toBe(description.attributes('id'))
  })

  it('starts unchecked and commits one native activation with boolean model values', async () => {
    const onInput = vi.fn<(event: Event) => void>()
    const onChange = vi.fn<(event: Event) => void>()
    const enabled = ref(false)
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(MdvSwitch, {
              modelValue: enabled.value,
              label: '启用',
              onInput,
              onChange,
              'onUpdate:modelValue': (value: boolean) => (enabled.value = value),
            })
        },
      }),
      { attachTo: document.body },
    )
    const switchWrapper = wrapper.findComponent(MdvSwitch)
    const input = wrapper.get<HTMLInputElement>('input').element

    expect(input.checked).toBe(false)
    expect(input.getAttribute('aria-checked')).toBe('false')
    input.click()
    await settle()

    expect(enabled.value).toBe(true)
    expect(input.checked).toBe(true)
    expect(input.getAttribute('aria-checked')).toBe('true')
    expect(switchWrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(onInput).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onInput.mock.calls[0]![0].target).toBe(input)
    expect(onChange.mock.calls[0]![0].target).toBe(input)
  })

  it('uses native keyboard semantics without adding an Enter activation', async () => {
    const enabled = ref(false)
    const wrapper = mount(MdvSwitch, {
      attachTo: document.body,
      props: {
        modelValue: enabled.value,
        'onUpdate:modelValue': (value: boolean) => (enabled.value = value),
      },
      attrs: { 'aria-label': '启用' },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    input.element.focus()
    await input.trigger('keydown', { key: 'Enter' })
    await settle()

    expect(enabled.value).toBe(false)
    expect(input.element.checked).toBe(false)
  })

  it('does not commit when a consumer cancels the native click', async () => {
    const updates = vi.fn<(value: boolean) => void>()
    const wrapper = mount(MdvSwitch, {
      attachTo: document.body,
      props: { label: '启用', 'onUpdate:modelValue': updates },
      attrs: { onClick: (event: MouseEvent) => event.preventDefault() },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.click()
    await settle()

    expect(input.checked).toBe(false)
    expect(updates).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('restores a rejected controlled update after native activation', async () => {
    const updates = vi.fn<(value: boolean) => void>()
    const wrapper = mount(MdvSwitch, {
      attachTo: document.body,
      props: { modelValue: false, label: '启用', 'onUpdate:modelValue': updates },
    })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.click()
    await settle()

    expect(updates).toHaveBeenCalledExactlyOnceWith(true)
    expect(input.checked).toBe(false)
    expect(input.getAttribute('aria-checked')).toBe('false')
  })

  it('shows the built-in check only while selected when no icon slots are provided', async () => {
    const wrapper = mount(MdvSwitch, { props: { label: '默认图标' } })

    expect(wrapper.find('.mdv-switch__icon').exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.findAll('.mdv-switch__icon svg')).toHaveLength(1)
    expect(wrapper.getComponent(MdvIcon).props('size')).toBe('16')
    expect(wrapper.getComponent(MdvIcon).attributes('aria-hidden')).toBe('true')
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.mdv-switch__icon').exists()).toBe(false)
  })

  it('supports label positions and selected and unselected icon slots', async () => {
    const enabled = ref(false)
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              MdvSwitch,
              {
                modelValue: enabled.value,
                label: '图标开关',
                labelPosition: 'start',
                'onUpdate:modelValue': (value: boolean) => (enabled.value = value),
              },
              {
                'selected-icon': () => h('span', { class: 'selected-icon' }, 'S'),
                'unselected-icon': () => h('span', { class: 'unselected-icon' }, 'U'),
              },
            )
        },
      }),
      { attachTo: document.body },
    )
    expect(wrapper.classes()).toContain('mdv-switch--label-start')
    expect(wrapper.find('.unselected-icon').exists()).toBe(true)
    expect(wrapper.find('.selected-icon').exists()).toBe(false)

    wrapper.get('input').element.click()
    await settle()
    expect(wrapper.find('.selected-icon').exists()).toBe(true)
    expect(wrapper.find('.unselected-icon').exists()).toBe(false)
    expect(wrapper.findComponent(MdvIcon).exists()).toBe(false)
  })

  it('leaves the handle plain when only the opposite state has an icon', async () => {
    const wrapper = mount(MdvSwitch, {
      props: { label: '仅开启时显示图标' },
      slots: { 'selected-icon': () => h('span', { class: 'selected-icon' }, 'S') },
    })

    expect(wrapper.find('.mdv-switch__icon').exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('.mdv-switch__icon .selected-icon').text()).toBe('S')
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.mdv-switch__icon').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('lets an explicit empty selected-icon slot suppress the default check', async () => {
    const wrapper = mount(MdvSwitch, {
      props: { modelValue: true, label: '纯圆点' },
      slots: { 'selected-icon': () => [] },
    })

    expect(wrapper.get('input').attributes('aria-checked')).toBe('true')
    expect(wrapper.find('svg').exists()).toBe(false)
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.mdv-switch__icon').exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('keeps the default selected check when only the unselected icon is customized', async () => {
    const wrapper = mount(MdvSwitch, {
      props: { label: '自定义关闭图标' },
      slots: { 'unselected-icon': () => h('span', { class: 'unselected-icon' }, 'U') },
    })

    expect(wrapper.get('.unselected-icon').text()).toBe('U')
    expect(wrapper.findComponent(MdvIcon).exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.unselected-icon').exists()).toBe(false)
    expect(wrapper.findAll('.mdv-switch__icon svg')).toHaveLength(1)
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.get('.unselected-icon').text()).toBe('U')
    expect(wrapper.findComponent(MdvIcon).exists()).toBe(false)
  })

  it('respects disabled props, disabled fieldsets and preserves the model', async () => {
    const enabled = ref(false)
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h('fieldset', { disabled: true }, [
              h(MdvSwitch, {
                modelValue: enabled.value,
                label: '禁用',
                'onUpdate:modelValue': (value: boolean) => (enabled.value = value),
              }),
            ])
        },
      }),
      { attachTo: document.body },
    )
    const input = wrapper.get<HTMLInputElement>('input').element
    expect(input.matches(':disabled')).toBe(true)
    input.click()
    await settle()
    expect(enabled.value).toBe(false)
  })

  it('keeps business errors separate from native validity and exposes validation methods', async () => {
    const wrapper = mount(MdvSwitch, {
      attachTo: document.body,
      props: {
        label: '服务开关',
        supportingText: '正常说明',
        error: true,
        errorText: '业务错误',
      },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    expect(wrapper.get('.mdv-switch__supporting').text()).toBe('业务错误')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.vm.checkValidity()).toBe(true)

    wrapper.vm.setCustomValidity('服务端校验失败')
    expect(wrapper.vm.reportValidity()).toBe(false)
    await nextTick()
    expect(wrapper.get('.mdv-switch__supporting').text()).toBe('业务错误')
    wrapper.vm.setCustomValidity('')
    await nextTick()
    expect(wrapper.vm.checkValidity()).toBe(true)
  })

  it('reports required errors only after validation and restores supporting text', async () => {
    const wrapper = mount(MdvSwitch, {
      attachTo: document.body,
      props: { label: '必选开关', required: true, supportingText: '请选择', errorText: '必须开启' },
    })
    expect(wrapper.get('.mdv-switch__supporting').text()).toBe('请选择')
    expect(wrapper.vm.reportValidity()).toBe(false)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-switch--error')
    expect(wrapper.get('.mdv-switch__supporting').text()).toBe('必须开启')

    wrapper.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(wrapper.vm.reportValidity()).toBe(true)
    expect(wrapper.classes()).not.toContain('mdv-switch--error')
    expect(wrapper.get('.mdv-switch__supporting').text()).toBe('请选择')
  })

  it('supports form data, external forms and native reset', async () => {
    const enabled = ref(true)
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h('div', [
              h('form', { id: 'settings-form' }),
              h(MdvSwitch, {
                modelValue: enabled.value,
                label: '自动同步',
                name: 'sync',
                value: 'enabled',
                form: 'settings-form',
                'onUpdate:modelValue': (value: boolean) => (enabled.value = value),
              }),
            ])
        },
      }),
      { attachTo: document.body },
    )
    const input = wrapper.get<HTMLInputElement>('input').element
    const form = document.querySelector<HTMLFormElement>('#settings-form')!
    expect(new FormData(form).get('sync')).toBe('enabled')
    input.click()
    await settle()
    expect(new FormData(form).get('sync')).toBeNull()
    form.reset()
    await settle()
    expect(enabled.value).toBe(true)
    expect(input.checked).toBe(true)
  })

  it('resolves preset and seed colors locally and warns for unsupported values', async () => {
    const wrapper = mount(MdvSwitch, {
      attachTo: document.body,
      props: { label: '主题开关', color: 'success' },
    })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--mdv-switch-color')).toBe(
      'var(--mdv-sys-color-success)',
    )
    await wrapper.setProps({ color: '#06c' })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--mdv-switch-color')).toMatch(
      /^light-dark\(/,
    )
    expect(document.documentElement.style.getPropertyValue('--mdv-sys-color-primary')).toBe('')

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const invalid = mount(MdvSwitch, { props: { label: '错误色值', color: 'purple' as never } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unsupported color'))
    invalid.unmount()
  })

  it('exposes native focus and blur methods', () => {
    const wrapper = mount(MdvSwitch, { attachTo: document.body, props: { label: '聚焦' } })
    const input = wrapper.get('input').element
    wrapper.vm.focus({ preventScroll: true })
    expect(document.activeElement).toBe(input)
    wrapper.vm.blur()
    expect(document.activeElement).not.toBe(input)
  })
})
