import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MdvSearchBar from '../components/MdvSearchBar.vue'

enableAutoUnmount(afterEach)
afterEach(() => document.body.replaceChildren())

describe('MdvSearchBar', () => {
  it('keeps pointer focus and text editing separate from keyboard navigation', async () => {
    const wrapper = mount(MdvSearchBar, { attachTo: document.body })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    input.focus()
    await nextTick()
    expect(document.activeElement).toBe(input)
    expect(wrapper.classes()).not.toContain('mdv-search-bar--keyboard-focus')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-search-bar--keyboard-focus')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-search-bar--keyboard-focus')
    input.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-search-bar--keyboard-focus')
    expect(document.activeElement).toBe(input)
  })

  it('supports an unbound query and keeps native input attributes and events on the input', async () => {
    const inputEvent = vi.fn<(event: Event) => void>()
    const wrapper = mount(MdvSearchBar, {
      props: { placeholder: '搜索' },
      attrs: {
        name: 'q',
        maxlength: 30,
        form: 'external-form',
        class: 'custom-search',
        onInput: inputEvent,
      },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    expect(wrapper.classes()).toContain('custom-search')
    expect(input.attributes('name')).toBe('q')
    expect(input.attributes('maxlength')).toBe('30')
    expect(input.attributes('form')).toBe('external-form')
    expect(input.attributes('aria-label')).toBe('搜索')
    await input.setValue('旅行')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('search')?.[0]?.[0]).toBe('旅行')
    expect(inputEvent).toHaveBeenCalledOnce()
  })

  it('commits composition once and does not submit composition Enter or key repeats', async () => {
    const wrapper = mount(MdvSearchBar)
    const input = wrapper.get<HTMLInputElement>('input')
    await input.trigger('compositionstart')
    await input.setValue('中文')
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('search')).toBeUndefined()
    input.element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    input.element.dispatchEvent(new InputEvent('input', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['中文']])
    await input.trigger('keydown', { key: 'Enter', repeat: true })
    expect(wrapper.emitted('search')).toBeUndefined()
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('search')).toHaveLength(1)
  })

  it('honors a cancelled keyboard event and a caller-controlled rejected update', async () => {
    const update = vi.fn<(value: string) => void>()
    const wrapper = mount(MdvSearchBar, {
      props: { modelValue: '保留', 'onUpdate:modelValue': update },
      attrs: { onKeydown: (event: KeyboardEvent) => event.preventDefault() },
    })
    await wrapper.get('input').setValue('拒绝的值')
    expect(update).toHaveBeenCalledWith('拒绝的值')
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('保留')
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('search')).toBeUndefined()
  })

  it('clears without disabling a busy input and returns focus to the input', async () => {
    const value = ref('草稿')
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(MdvSearchBar, {
            modelValue: value.value,
            'onUpdate:modelValue': (next: string) => {
              value.value = next
            },
            loading: true,
            clearLabel: '清除草稿',
          }),
      }),
      { attachTo: document.body },
    )
    await host.get('button[aria-label="清除草稿"]').trigger('click')
    expect(value.value).toBe('')
    expect(host.get<HTMLInputElement>('input').element.disabled).toBe(false)
    expect(document.activeElement).toBe(host.get('input').element)
    expect(host.get('input').attributes('aria-busy')).toBe('true')
  })

  it('keeps readonly content and does not offer a clear action', () => {
    const wrapper = mount(MdvSearchBar, { props: { modelValue: '只读', readonly: true } })
    expect(wrapper.get<HTMLInputElement>('input').element.readOnly).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('只读')
  })

  it('resets an externally associated form to its initial query and respects a cancelled reset', async () => {
    const query = ref('初始查询')
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h('form', { id: 'search-form' }),
            h(MdvSearchBar, {
              modelValue: query.value,
              'onUpdate:modelValue': (value: string) => {
                query.value = value
              },
              form: 'search-form',
              name: 'q',
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    const form = host.get<HTMLFormElement>('form').element
    await host.get('input').setValue('新查询')
    const cancel = (event: Event) => event.preventDefault()
    form.addEventListener('reset', cancel)
    form.reset()
    await flushPromises()
    expect(query.value).toBe('新查询')
    expect(host.get<HTMLInputElement>('input').element.value).toBe('新查询')
    form.removeEventListener('reset', cancel)
    form.reset()
    await flushPromises()
    expect(query.value).toBe('初始查询')
    expect(host.get<HTMLInputElement>('input').element.value).toBe('初始查询')
    expect(new FormData(form).get('q')).toBe('初始查询')
  })
})
