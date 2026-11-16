import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import MdvAutocomplete from '../components/MdvAutocomplete.vue'
import MdvSelect from '../components/MdvSelect.vue'
import type { MdvSelectOption } from '../components/select.types'
import { mockMenuPlatform } from './menu-test-platform'

enableAutoUnmount(afterEach)

const options: MdvSelectOption[] = [
  { value: 'disabled', label: '不可用', disabled: true },
  { value: 'first', label: '第一项' },
  { value: 2, label: '第二项', supportingText: '辅助说明' },
]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('MdvSelect', () => {
  it('exposes a select-only combobox, skips disabled options and commits the active item', async () => {
    const wrapper = mount(MdvSelect, { props: { label: '选择项目', options } })
    const input = wrapper.get<HTMLInputElement>('input')

    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('readonly')).toBeDefined()
    expect(input.attributes('aria-autocomplete')).toBe('none')

    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(wrapper.get('[role="listbox"]').attributes('id')).toBe(input.attributes('aria-controls'))
    expect(input.attributes('aria-activedescendant')).toContain('option-1')

    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['first'])
    expect(input.element.value).toBe('第一项')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('uses the hidden form value, validates required selection, and restores its initial value on reset', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const wrapper = mount(MdvSelect, {
      attachTo: form,
      props: {
        options,
        name: 'choice',
        required: true,
      },
    })
    const field = wrapper.get<HTMLInputElement>('input')
    const proxy = wrapper.get<HTMLSelectElement>('select').element
    expect(form.checkValidity()).toBe(false)
    expect(new FormData(form).get('choice')).toBeNull()

    await field.trigger('click')
    await flushPromises()
    await wrapper.get('[role="option"]:nth-child(2)').trigger('click')
    await nextTick()
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).get('choice')).toBe('first')

    form.reset()
    await Promise.resolve()
    await nextTick()
    const updates = wrapper.emitted('update:modelValue') ?? []
    expect(updates[updates.length - 1]).toEqual([null])
    expect(proxy.value).toBe('')
  })

  it('keeps open state controlled and reflects rejected open requests', async () => {
    const wrapper = mount(MdvSelect, { props: { open: false, options } })
    await wrapper.get('input').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('treats an empty option as missing for required validation', async () => {
    const wrapper = mount(MdvSelect, {
      props: {
        modelValue: '',
        options: [
          { value: '', label: '请选择' },
          { value: 0, label: '零' },
        ],
        required: true,
      },
    })
    const proxy = wrapper.get<HTMLSelectElement>('select').element

    expect(proxy.checkValidity()).toBe(false)
    await wrapper.setProps({ modelValue: 0 })
    expect(proxy.checkValidity()).toBe(true)
  })

  it('does not commit a stale active option after hovering a disabled option', async () => {
    const wrapper = mount(MdvSelect, { props: { options } })
    const input = wrapper.get('input')
    await input.trigger('click')
    const optionElements = wrapper.findAll('[role="option"]')
    await optionElements[0]!.trigger('pointermove')
    await input.trigger('keydown', { key: 'ArrowUp' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])
  })

  it.each(['expressive', 'baseline'] as const)(
    'keeps the combobox focused when pressing and selecting a %s option',
    async (menuVariant) => {
      const wrapper = mount(MdvSelect, { attachTo: document.body, props: { options, menuVariant } })
      const input = wrapper.get<HTMLInputElement>('input')
      await input.trigger('click')
      const option = wrapper.get('[role="option"]:nth-child(3)')
      let prevented = false
      option.element.addEventListener('mousedown', (event) => {
        prevented = event.defaultPrevented
      })

      await option.trigger('mousedown', { button: 0 })
      expect(prevented).toBe(true)
      expect(document.activeElement).toBe(input.element)
      expect(input.attributes('aria-expanded')).toBe('true')

      await option.trigger('click')
      await flushPromises()
      expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
      expect(input.element.value).toBe('第二项')
      expect(document.activeElement).toBe(input.element)
      expect(input.attributes('aria-expanded')).toBe('false')
    },
  )
})

describe('MdvAutocomplete', () => {
  it.each(['keyboard', 'pointer'] as const)(
    'keeps filtered options throughout the exit animation after %s selection',
    async (interaction) => {
      const platform = mockMenuPlatform()
      platform.enableAnimations()
      const cities: MdvSelectOption[] = [
        { value: 'beijing', label: '北京' },
        { value: 'shanghai', label: '上海' },
        { value: 'shenzhen', label: '深圳' },
      ]
      const wrapper = mount(MdvAutocomplete, {
        attachTo: document.body,
        props: { label: '城市', options: cities },
      })

      try {
        const input = wrapper.get<HTMLInputElement>('input')
        await input.trigger('click')
        await flushPromises()
        platform.animations[0]!.finish()
        await flushPromises()
        await input.setValue('上海')
        await flushPromises()
        expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
        const panel = wrapper.get<HTMLElement>('.mdv-select-control__panel').element

        if (interaction === 'keyboard') await input.trigger('keydown', { key: 'Enter' })
        else await wrapper.get('[role="option"]').trigger('click')
        await flushPromises()

        expect(wrapper.emitted('update:modelValue')).toEqual([['上海'], ['shanghai']])
        expect(input.element.value).toBe('上海')
        expect(input.attributes('aria-expanded')).toBe('false')
        expect(platform.opened.has(panel)).toBe(true)
        expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
        expect(wrapper.get('[role="option"]').text()).toContain('上海')

        expect(platform.animations).toHaveLength(2)
        platform.animations[1]!.finish()
        await flushPromises()
        expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

        await input.trigger('click')
        await flushPromises()
        expect(wrapper.findAll('[role="option"]')).toHaveLength(cities.length)
        expect(input.attributes('aria-activedescendant')).toContain('option-1')
        expect(wrapper.emitted('search')).toEqual([['上海']])
      } finally {
        wrapper.unmount()
        platform.restore()
        vi.unstubAllGlobals()
      }
    },
  )

  it('filters locally, emits free text and searches on input, then selects option values', async () => {
    const wrapper = mount(MdvAutocomplete, { props: { label: '城市', options } })
    const input = wrapper.get<HTMLInputElement>('input')
    expect(input.attributes('aria-autocomplete')).toBe('list')
    expect(input.attributes('readonly')).toBeUndefined()

    await input.setValue('第二')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['第二'])
    expect(wrapper.emitted('search')?.[0]).toEqual(['第二'])
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    expect(wrapper.get('[role="option"]').text()).toContain('第二项')

    await input.setValue('自定义内容')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['自定义内容'])
    expect(wrapper.find('[role="option"]').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toBe('没有匹配项')
  })

  it('leaves remote filtering to the caller and exposes loading status', async () => {
    const wrapper = mount(MdvAutocomplete, {
      props: {
        options,
        filterMode: 'external',
        loading: true,
      },
    })
    await wrapper.get('input').setValue('not present')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(options.length)
    expect(wrapper.get('[role="status"]').text()).toBe('正在加载…')
    expect(wrapper.get('[role="listbox"]').attributes('aria-busy')).toBe('true')

    await wrapper.setProps({ options: [{ value: 'result', label: '远端结果' }], loading: false })
    await nextTick()
    expect(wrapper.get('input').attributes('aria-activedescendant')).toContain('option-0')
    expect(wrapper.find('[role="option"][id$="option-0"]').exists()).toBe(true)
  })
})
