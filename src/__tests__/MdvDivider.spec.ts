import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { MdvDivider } from '../index'

describe('MdvDivider', () => {
  it('defaults to a decorative element without a tab stop or separator role', () => {
    const wrapper = mount(MdvDivider)

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-orientation')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.element.children).toHaveLength(0)
  })

  it('updates separator semantics and direction on the same element, then restores decoration', async () => {
    const wrapper = mount(MdvDivider, {
      props: { decorative: false },
      attrs: {
        'aria-label': '内容与操作区',
        role: 'button',
        'aria-hidden': 'true',
        'aria-orientation': 'vertical',
      },
    })
    const element = wrapper.element

    expect(wrapper.attributes('role')).toBe('separator')
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBe('内容与操作区')
    expect(wrapper.attributes('tabindex')).toBeUndefined()

    await wrapper.setProps({ orientation: 'vertical' })
    expect(wrapper.element).toBe(element)
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')

    await wrapper.setProps({ decorative: true })
    expect(wrapper.element).toBe(element)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-orientation')).toBeUndefined()
  })

  it('forwards and updates native root attributes and CSS overrides without prop changes', async () => {
    const id = ref('divider-before')
    const direction = ref('rtl')
    const labelledby = ref<string | undefined>('divider-heading')
    const description = ref<string | undefined>('divider-help')
    const hidden = ref(false)
    const style = ref('height: 48px; background-color: red')
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvDivider, {
            decorative: false,
            orientation: 'vertical',
            id: id.value,
            class: 'custom-divider',
            style: style.value,
            dir: direction.value,
            lang: 'zh-CN',
            'aria-labelledby': labelledby.value,
            'aria-describedby': description.value,
            'data-location': id.value,
            hidden: hidden.value,
          }),
      }),
    )
    const divider = wrapper.get<HTMLDivElement>('div')
    const element = divider.element

    expect(divider.classes()).toContain('mdv-divider')
    expect(divider.classes()).toContain('custom-divider')
    expect(divider.attributes()).toMatchObject({
      id: 'divider-before',
      dir: 'rtl',
      lang: 'zh-CN',
      'aria-labelledby': 'divider-heading',
      'aria-describedby': 'divider-help',
      'data-location': 'divider-before',
    })
    expect(element.style.height).toBe('48px')
    expect(element.style.backgroundColor).toBe('red')
    expect(element.hidden).toBe(false)

    id.value = 'divider-after'
    direction.value = 'ltr'
    labelledby.value = undefined
    description.value = undefined
    hidden.value = true
    style.value = 'height: 64px; width: 2px'
    await nextTick()

    expect(divider.element).toBe(element)
    expect(divider.attributes()).toMatchObject({
      id: 'divider-after',
      dir: 'ltr',
      'data-location': 'divider-after',
    })
    expect(divider.attributes('aria-labelledby')).toBeUndefined()
    expect(divider.attributes('aria-describedby')).toBeUndefined()
    expect(element.style.height).toBe('64px')
    expect(element.style.width).toBe('2px')
    expect(element.style.backgroundColor).toBe('')
    expect(element.hidden).toBe(true)
  })
})
