import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MdvTextField from '../components/MdvTextField.vue'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
})

describe('MdvTextField', () => {
  it('associates its label and descriptions with the native control and splits outer attributes', () => {
    const wrapper = mount(MdvTextField, {
      props: { label: '姓名', supportingText: '公开显示', required: true },
      attrs: {
        id: 'profile-name',
        name: 'name',
        form: 'profile',
        autocomplete: 'name',
        inputmode: 'text',
        'aria-describedby': 'external',
        'aria-label': '公开姓名',
        class: 'custom-field',
        style: { width: '320px' },
        maxlength: 20,
      },
    })
    const input = wrapper.get('input')
    expect(wrapper.classes()).toContain('mdv-text-field--outlined')
    expect(wrapper.classes()).toContain('custom-field')
    expect((wrapper.element as HTMLElement).style.width).toBe('320px')
    expect(wrapper.attributes('id')).toBeUndefined()
    expect(input.attributes()).toMatchObject({
      id: 'profile-name',
      name: 'name',
      form: 'profile',
      autocomplete: 'name',
      inputmode: 'text',
      'aria-label': '公开姓名',
      required: '',
      maxlength: '20',
    })
    expect(input.classes()).not.toContain('custom-field')
    expect(wrapper.get('label').attributes('for')).toBe('profile-name')
    const description = wrapper.get('.mdv-text-field__supporting-text')
    const counter = wrapper.get('.mdv-text-field__counter')
    expect(input.attributes('aria-describedby')?.split(' ')).toEqual([
      'external',
      description.attributes('id'),
      counter.attributes('id'),
    ])
    expect(counter.text()).toBe('0 / 20')
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('generates distinct ids for multiple fields', () => {
    const wrapper = mount(
      defineComponent({
        render: () => h('div', [h(MdvTextField, { label: 'A' }), h(MdvTextField, { label: 'B' })]),
      }),
    )
    const ids = wrapper.findAll('input').map((input) => input.attributes('id'))
    expect(ids[0]).toBeTruthy()
    expect(ids[1]).not.toBe(ids[0])
  })

  it.each(['outlined', 'filled'] as const)(
    'focuses a %s field from empty space inside a focusable ancestor',
    async (variant) => {
      const host = document.createElement('main')
      host.tabIndex = -1
      document.body.append(host)
      const wrapper = mount(MdvTextField, {
        attachTo: host,
        props: { variant, label: '备注' },
        slots: { leading: () => h('span', '图标') },
      })
      await wrapper.get('.mdv-text-field__container').trigger('click')
      expect(document.activeElement).toBe(wrapper.get('input').element)
      expect(wrapper.classes()).toContain('mdv-text-field--focused')

      wrapper.get('input').element.blur()
      await wrapper.get('.mdv-text-field__leading span').trigger('click')
      expect(document.activeElement).toBe(wrapper.get('input').element)

      await wrapper.setProps({ multiline: true })
      await wrapper.get('.mdv-text-field__content').trigger('click')
      expect(document.activeElement).toBe(wrapper.get('textarea').element)
      expect(wrapper.classes()).toContain('mdv-text-field--focused')
    },
  )

  it('preserves slot focus and cancelled clicks when handling container clicks', async () => {
    const wrapper = mount(MdvTextField, {
      attachTo: document.body,
      slots: {
        leading: () =>
          h('span', { onClick: (event: MouseEvent) => event.preventDefault() }, '已处理'),
        trailing: () => [
          h('button', { type: 'button' }, [h('span', '操作')]),
          h(
            'a',
            { href: '#details', onClick: (event: MouseEvent) => event.preventDefault() },
            '详情',
          ),
          h('span', { tabindex: 0 }, '自定义控件'),
          h('select', [h('option', '选项')]),
        ],
      },
    })
    for (const selector of ['button', 'a', '[tabindex]', 'select']) {
      const interactive = wrapper.get<HTMLElement>(selector)
      interactive.element.focus()
      await interactive.trigger('click')
      expect(document.activeElement).toBe(interactive.element)
    }
    const button = wrapper.get('button')
    button.element.focus()
    await button.get('span').trigger('click')
    expect(document.activeElement).toBe(button.element)
    button.element.blur()
    await wrapper.get('.mdv-text-field__leading span').trigger('click')
    expect(document.activeElement).not.toBe(wrapper.get('input').element)
  })

  it('focuses readonly fields and respects disabled controls and fieldsets', async () => {
    const fieldset = document.createElement('fieldset')
    document.body.append(fieldset)
    const wrapper = mount(MdvTextField, {
      attachTo: fieldset,
      props: { readonly: true },
    })
    const input = wrapper.get('input')
    await wrapper.get('.mdv-text-field__container').trigger('click')
    expect(document.activeElement).toBe(input.element)
    input.element.blur()

    await wrapper.setProps({ disabled: true })
    await wrapper.get('.mdv-text-field__container').trigger('click')
    expect(document.activeElement).not.toBe(input.element)

    await wrapper.setProps({ disabled: false })
    fieldset.disabled = true
    await wrapper.get('.mdv-text-field__container').trigger('click')
    expect(document.activeElement).not.toBe(input.element)
  })

  it('keeps type=number values as strings unless .number is supplied, including empty values', async () => {
    const wrapper = mount(MdvTextField, { props: { type: 'number' } })
    await wrapper.get('input').setValue('42')
    expect(wrapper.emitted('update:modelValue')).toEqual([['42']])
    await wrapper.setProps({ modelModifiers: { number: true } })
    await wrapper.get('input').setValue('12.5')
    await wrapper.get('input').setValue('')
    expect(wrapper.emitted('update:modelValue')).toEqual([['42'], [12.5], ['']])
  })

  it('handles .trim and .lazy without rewriting the draft during editing or duplicating emissions', async () => {
    const wrapper = mount(MdvTextField, { props: { modelModifiers: { trim: true, lazy: true } } })
    const input = wrapper.get('input')
    input.element.value = '  名称  '
    await input.trigger('input')
    expect(input.element.value).toBe('  名称  ')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await input.trigger('change')
    expect(input.element.value).toBe('名称')
    expect(wrapper.emitted('update:modelValue')).toEqual([['名称']])
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('waits for composition to finish and ignores the extra input event after compositionend', async () => {
    const wrapper = mount(MdvTextField)
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = 'ni'
    await input.trigger('input', { isComposing: true })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    input.element.value = '你好'
    await input.trigger('compositionend')
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toEqual([['你好']])
  })

  it('does not commit composed text in lazy mode until change', async () => {
    const wrapper = mount(MdvTextField, { props: { modelModifiers: { lazy: true } } })
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '中文'
    await input.trigger('input')
    await input.trigger('compositionend')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([['中文']])
  })

  it('synchronizes browser autofill notifications with the bound value', async () => {
    const wrapper = mount(MdvTextField, { props: { label: '姓名' } })
    const input = wrapper.get('input')
    input.element.value = '自动填充姓名'
    await input.trigger('animationstart', { animationName: 'mdv-text-field-autofill' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['自动填充姓名']])
    expect(wrapper.classes()).toContain('mdv-text-field--floating')
    await input.trigger('animationstart', { animationName: 'mdv-text-field-autofill-cancel' })
    await input.setValue('')
    expect(wrapper.classes()).not.toContain('mdv-text-field--floating')
  })

  it('keeps a controlled .number draft stable and accepts programmatic changes', async () => {
    const model = ref<string | number>('')
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvTextField, {
            modelValue: model.value,
            modelModifiers: { number: true },
            'onUpdate:modelValue': (value: string | number) => (model.value = value),
          }),
      }),
    )
    const input = wrapper.get('input')
    input.element.value = '01.'
    await input.trigger('input')
    expect(model.value).toBe(1)
    expect(input.element.value).toBe('01.')
    model.value = '程序赋值'
    await nextTick()
    expect(input.element.value).toBe('程序赋值')
    model.value = ''
    await nextTick()
    expect(wrapper.getComponent(MdvTextField).classes()).not.toContain('mdv-text-field--floating')
  })

  it('forwards native event objects and preserves focus state across user listeners', async () => {
    const onInput = vi.fn<(event: Event) => void>()
    const onFocus = vi.fn<(event: FocusEvent) => void>()
    const onBlur = vi.fn<(event: FocusEvent) => void>()
    const wrapper = mount(MdvTextField, {
      attachTo: document.body,
      attrs: { onInput, onFocus, onBlur },
    })
    const input = wrapper.get('input')
    const event = new Event('input', { bubbles: true })
    input.element.value = 'abc'
    input.element.dispatchEvent(event)
    await nextTick()
    expect(onInput).toHaveBeenCalledExactlyOnceWith(event)
    input.element.focus()
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-text-field--focused')
    expect(onFocus).toHaveBeenCalledOnce()
    input.element.blur()
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-text-field--focused')
    expect(onBlur).toHaveBeenCalledOnce()
  })

  it('switches to textarea and keeps prefixes and suffixes outside its value', async () => {
    const wrapper = mount(MdvTextField, {
      props: {
        modelValue: '第一行\n第二行',
        multiline: true,
        rows: 4,
        prefixText: '￥',
        suffixText: '元',
      },
      attrs: { name: 'notes', maxlength: 100 },
    })
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.get('textarea').element.value).toBe('第一行\n第二行')
    expect(wrapper.get('textarea').attributes('rows')).toBe('4')
    expect(wrapper.get('textarea').attributes('name')).toBe('notes')
    expect(wrapper.findAll('.mdv-text-field__affix').map((item) => item.text())).toEqual([
      '￥',
      '元',
    ])
    await wrapper.setProps({ multiline: false })
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.get('input').attributes('type')).toBe('text')
  })

  it('updates counters when maxlength or showCount changes and counts native UTF-16 units', async () => {
    const maximum = ref(10)
    const showCount = ref<boolean | undefined>()
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvTextField, {
            modelValue: '中🙂',
            maxlength: maximum.value,
            showCount: showCount.value,
          }),
      }),
    )
    expect(wrapper.get('.mdv-text-field__counter').text()).toBe('3 / 10')
    maximum.value = 5
    await nextTick()
    expect(wrapper.get('.mdv-text-field__counter').text()).toBe('3 / 5')
    showCount.value = false
    await nextTick()
    expect(wrapper.find('.mdv-text-field__counter').exists()).toBe(false)
    showCount.value = true
    maximum.value = -1
    await nextTick()
    expect(wrapper.get('.mdv-text-field__counter').text()).toBe('3')
  })

  it('omits clear and password action names when callers do not supply them', () => {
    const wrapper = mount(MdvTextField, {
      props: { modelValue: 'secret', type: 'password', clearable: true, passwordToggle: true },
    })
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.findAll('button').map((button) => button.attributes('aria-label'))).toEqual([
      undefined,
      undefined,
    ])
    wrapper.unmount()
  })

  it('clears once, sends a native input event, and retains input focus even in lazy mode', async () => {
    const onInput = vi.fn<(event: Event) => void>()
    const wrapper = mount(MdvTextField, {
      attachTo: document.body,
      props: {
        modelValue: '搜索',
        clearable: true,
        clearLabel: '清除输入',
        modelModifiers: { lazy: true },
      },
      attrs: { onInput },
    })
    await wrapper.get('button[aria-label="清除输入"]').trigger('click')
    expect(wrapper.get('input').element.value).toBe('')
    expect(document.activeElement).toBe(wrapper.get('input').element)
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(onInput).toHaveBeenCalledOnce()
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('respects readonly, disabled, and disabled fieldsets for built-in actions', async () => {
    const wrapper = mount(MdvTextField, {
      props: { modelValue: 'fixed', clearable: true, readonly: true },
    })
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ readonly: false, disabled: true })
    expect(wrapper.get('input').element.disabled).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)

    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    document.body.append(fieldset)
    const inherited = mount(MdvTextField, {
      attachTo: fieldset,
      props: { modelValue: 'fixed', clearable: true },
    })
    await inherited.get('button').trigger('click')
    expect(inherited.get('input').element.value).toBe('fixed')
    expect(inherited.emitted('update:modelValue')).toBeUndefined()
  })

  it('toggles password visibility with selection intact and without form submission', async () => {
    const wrapper = mount(MdvTextField, {
      attachTo: document.body,
      props: { type: 'password', modelValue: 'secret-value', passwordToggle: true },
    })
    const input = wrapper.get('input').element
    input.focus()
    input.setSelectionRange(2, 6, 'backward')
    const toggle = wrapper.get('button')
    expect(toggle.attributes('type')).toBe('button')
    await toggle.trigger('click')
    expect(input.type).toBe('text')
    expect([input.selectionStart, input.selectionEnd, input.selectionDirection]).toEqual([
      2,
      6,
      'backward',
    ])
    expect(document.activeElement).toBe(input)
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(input.value).toBe('secret-value')
    await toggle.trigger('click')
    expect(input.type).toBe('password')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ multiline: true })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('lets trailing content replace both built-in actions', () => {
    const wrapper = mount(MdvTextField, {
      props: { modelValue: 'secret', type: 'password', clearable: true, passwordToggle: true },
      slots: {
        trailing: () => h('button', { type: 'button', 'aria-label': '自定义动作' }, '操作'),
      },
    })
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.get('button').attributes('aria-label')).toBe('自定义动作')
  })

  it('reports native constraints only after validation and restores supporting text after correction', async () => {
    const wrapper = mount(MdvTextField, {
      props: { label: '邮箱', type: 'email', required: true, supportingText: '用于通知' },
    })
    expect(wrapper.classes()).not.toContain('mdv-text-field--error')
    expect(wrapper.vm.checkValidity()).toBe(false)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-text-field--error')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('input').attributes('aria-errormessage')).toBe(
      wrapper.get('.mdv-text-field__supporting-text').attributes('id'),
    )
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).not.toBe('用于通知')
    await wrapper.get('input').setValue('user@example.com')
    expect(wrapper.classes()).not.toContain('mdv-text-field--error')
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('用于通知')
    expect(wrapper.vm.reportValidity()).toBe(true)
  })

  it('reports empty form submissions and keeps errors after blur', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const onSubmit = vi.fn<(event: SubmitEvent) => void>()
    form.addEventListener('submit', onSubmit)
    const wrapper = mount(MdvTextField, {
      attachTo: form,
      props: { required: true, label: '姓名', supportingText: '请输入姓名' },
      attrs: { name: 'name' },
    })
    const input = wrapper.get('input')
    expect(wrapper.classes()).not.toContain('mdv-text-field--error')
    input.element.focus()
    form.requestSubmit()
    await nextTick()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(wrapper.classes()).toContain('mdv-text-field--error')
    expect(wrapper.classes()).toContain('mdv-text-field--focused')
    expect(input.attributes('aria-invalid')).toBe('true')

    input.element.blur()
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-text-field--focused')
    expect(wrapper.classes()).toContain('mdv-text-field--error')
    await input.setValue('张三')
    expect(wrapper.classes()).not.toContain('mdv-text-field--error')
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('请输入姓名')
  })

  it('keeps business errors separate from native validity and exposes custom validation', async () => {
    const wrapper = mount(MdvTextField, {
      props: {
        modelValue: 'name',
        error: true,
        errorText: '名称已被使用',
        supportingText: '公开名称',
      },
    })
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('名称已被使用')
    expect(wrapper.vm.checkValidity()).toBe(true)
    await wrapper.setProps({ error: false })
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('公开名称')
    wrapper.vm.setCustomValidity('服务端校验失败')
    expect(wrapper.vm.reportValidity()).toBe(false)
    await nextTick()
    expect(wrapper.get('input').element.validationMessage).toBe('服务端校验失败')
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('名称已被使用')
    await wrapper.setProps({ errorText: '' })
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('服务端校验失败')
    wrapper.vm.setCustomValidity('')
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-text-field--error')
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('公开名称')
    expect(wrapper.vm.checkValidity()).toBe(true)
  })

  it('exposes native focus, selection and blur methods', () => {
    const wrapper = mount(MdvTextField, {
      attachTo: document.body,
      props: { modelValue: 'select me' },
    })
    const input = wrapper.get('input').element
    wrapper.vm.focus({ preventScroll: true })
    expect(document.activeElement).toBe(input)
    wrapper.vm.select()
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 9])
    wrapper.vm.blur()
    expect(document.activeElement).not.toBe(input)
  })

  it('associates external forms, submits only the raw value, and synchronizes native reset with v-model', async () => {
    const form = document.createElement('form')
    form.id = 'external-form'
    document.body.append(form)
    const wrapper = mount(MdvTextField, {
      attachTo: document.body,
      props: { modelValue: 'initial', prefixText: '￥', suffixText: '元' },
      attrs: { name: 'amount', form: form.id },
    })
    await wrapper.get('input').setValue('changed')
    expect(new FormData(form).get('amount')).toBe('changed')
    form.reset()
    await Promise.resolve()
    await nextTick()
    expect(wrapper.get('input').element.value).toBe('initial')
    expect(wrapper.emitted('update:modelValue')).toEqual([['changed'], ['initial']])
    expect(new FormData(form).get('amount')).toBe('initial')
  })

  it('respects cancelled resets and removes reset listeners when form association changes or it unmounts', async () => {
    const first = document.createElement('form')
    const second = document.createElement('form')
    first.id = 'first'
    second.id = 'second'
    document.body.append(first, second)
    const formId = ref(first.id)
    const onUpdate = vi.fn<(value: string | number) => void>()
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvTextField, {
            modelValue: 'initial',
            form: formId.value,
            'onUpdate:modelValue': onUpdate,
          }),
      }),
      { attachTo: document.body },
    )
    await wrapper.get('input').setValue('changed')
    first.addEventListener('reset', (event) => event.preventDefault(), { once: true })
    first.reset()
    await Promise.resolve()
    expect(wrapper.get('input').element.value).toBe('changed')
    formId.value = second.id
    await nextTick()
    first.reset()
    await Promise.resolve()
    expect(wrapper.get('input').element.value).toBe('changed')
    second.reset()
    await Promise.resolve()
    await nextTick()
    expect(wrapper.get('input').element.value).toBe('initial')
    const emissions = onUpdate.mock.calls.length
    second.reset()
    wrapper.unmount()
    await Promise.resolve()
    expect(onUpdate).toHaveBeenCalledTimes(emissions)
  })

  it('hides previously reported native errors after reset and keeps native constraints active', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const wrapper = mount(MdvTextField, {
      attachTo: form,
      props: { required: true, label: '必填', supportingText: '填写后提交' },
    })
    expect(wrapper.vm.checkValidity()).toBe(false)
    await nextTick()
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    form.reset()
    await Promise.resolve()
    await nextTick()
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('填写后提交')
    expect(wrapper.vm.checkValidity()).toBe(false)
  })
})
