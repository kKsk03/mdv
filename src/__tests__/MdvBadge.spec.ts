import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { MdvBadge } from '../index'

describe('MdvBadge', () => {
  it('renders a small decorative indicator around its default slot', () => {
    const wrapper = mount(MdvBadge, {
      slots: { default: h('button', { type: 'button' }, '通知') },
    })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('mdv-badge')
    expect(wrapper.get('button').text()).toBe('通知')
    expect(wrapper.get('.mdv-badge__indicator').classes()).toContain('mdv-badge__indicator--small')
    expect(wrapper.get('.mdv-badge__indicator').attributes()).toMatchObject({
      'aria-hidden': 'true',
    })
    expect(wrapper.get('.mdv-badge__indicator').attributes('role')).toBeUndefined()
  })

  it('renders large numeric and text content, including zero', async () => {
    const wrapper = mount(MdvBadge, { props: { variant: 'large', content: 0 } })
    const indicator = wrapper.get('.mdv-badge__indicator')

    expect(indicator.text()).toBe('0')
    expect(indicator.get('.mdv-badge__label').text()).toBe('0')
    expect(indicator.classes()).toContain('mdv-badge__indicator--large')

    await wrapper.setProps({ content: '99+' })
    expect(wrapper.get('.mdv-badge__indicator').text()).toBe('99+')
    expect(wrapper.get('.mdv-badge__label').text()).toBe('99+')
  })

  it('omits an empty large indicator while keeping the wrapped content', () => {
    const wrapper = mount(MdvBadge, {
      props: { variant: 'large' },
      slots: { default: '<span>消息</span>' },
    })

    expect(wrapper.find('.mdv-badge__indicator').exists()).toBe(false)
    expect(wrapper.get('span span').text()).toBe('消息')
  })

  it('can hide the indicator without changing the root or slot', async () => {
    const wrapper = mount(MdvBadge, {
      props: { variant: 'large', content: 3, visible: false },
      slots: { default: '<span>收件箱</span>' },
    })
    const root = wrapper.element

    expect(wrapper.find('.mdv-badge__indicator').exists()).toBe(false)
    expect(wrapper.get('span span').text()).toBe('收件箱')

    await wrapper.setProps({ visible: true })
    expect(wrapper.element).toBe(root)
    expect(wrapper.get('.mdv-badge__indicator').text()).toBe('3')
  })

  it('places the label on the indicator and forwards other attributes to the root', () => {
    const wrapper = mount(MdvBadge, {
      props: { variant: 'large', content: '新' },
      attrs: {
        id: 'inbox-badge',
        class: 'custom-badge',
        style: 'margin: 4px',
        dir: 'rtl',
        lang: 'zh-CN',
        'data-location': 'toolbar',
        'aria-label': '3 条新消息',
      },
    })
    const indicator = wrapper.get('.mdv-badge__indicator')

    expect(wrapper.attributes()).toMatchObject({
      id: 'inbox-badge',
      dir: 'rtl',
      lang: 'zh-CN',
      'data-location': 'toolbar',
    })
    expect(wrapper.classes()).toContain('custom-badge')
    expect(wrapper.attributes('style')).toContain('margin: 4px')
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(indicator.attributes()).toMatchObject({
      role: 'img',
      'aria-label': '3 条新消息',
    })
    expect(indicator.attributes('aria-hidden')).toBeUndefined()
  })

  it('updates variant, content and visibility on the same root element', async () => {
    const wrapper = mount(MdvBadge, {
      props: { content: 1 },
    })
    const root = wrapper.element

    await wrapper.setProps({ variant: 'large', content: '2' })
    expect(wrapper.element).toBe(root)
    expect(wrapper.get('.mdv-badge__indicator').text()).toBe('2')

    await wrapper.setProps({ visible: false })
    expect(wrapper.find('.mdv-badge__indicator').exists()).toBe(false)
    await nextTick()
    expect(wrapper.element).toBe(root)
  })
})
