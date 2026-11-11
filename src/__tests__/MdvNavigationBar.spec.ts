import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { MdvNavigationBar, MdvNavigationBarItem } from '../index'
import type { MdvNavigationBarItemSlotProps } from '../index'

function mountNavigationBar(attachTo?: Element) {
  return mount(MdvNavigationBar, {
    attachTo,
    attrs: { 'aria-label': '主要目的地' },
    slots: {
      default: () => [
        h(
          MdvNavigationBarItem,
          { label: '首页', active: true, href: '/home' },
          {
            icon: ({ active }: MdvNavigationBarItemSlotProps) =>
              h('span', { 'data-icon-active': String(active) }, 'home'),
          },
        ),
        h(
          MdvNavigationBarItem,
          { label: '探索', href: '/explore' },
          {
            icon: ({ active }: MdvNavigationBarItemSlotProps) =>
              h('span', { 'data-icon-active': String(active) }, 'explore'),
            badge: ({ active }: MdvNavigationBarItemSlotProps) =>
              h('span', { 'data-badge-active': String(active) }, '3'),
          },
        ),
        h(
          MdvNavigationBarItem,
          { label: '个人资料' },
          {
            icon: ({ active }: MdvNavigationBarItemSlotProps) =>
              h('span', { 'data-icon-active': String(active) }, 'person'),
          },
        ),
      ],
    },
  })
}

describe('MdvNavigationBar', () => {
  it('renders a named navigation landmark and exposes an orientation override', async () => {
    const wrapper = mountNavigationBar()
    const nav = wrapper.get('nav')

    expect(nav.attributes('aria-label')).toBe('主要目的地')
    expect(nav.attributes('role')).toBeUndefined()
    expect(nav.classes()).toContain('mdv-navigation-bar--auto')

    await wrapper.setProps({ orientation: 'horizontal' })
    expect(nav.classes()).toContain('mdv-navigation-bar--horizontal')
  })

  it('uses native links and marks only the caller-selected destination as current', () => {
    const wrapper = mountNavigationBar()
    const links = wrapper.findAll('a')

    expect(links).toHaveLength(2)
    expect(links.map((link) => link.attributes('href'))).toEqual(['/home', '/explore'])
    expect(links.map((link) => link.attributes('aria-current'))).toEqual(['page', undefined])
    expect(wrapper.find('button').attributes('type')).toBe('button')
    expect(wrapper.find('button').text()).toContain('个人资料')
    expect(wrapper.findAll('a, button').map((item) => item.text())).toEqual([
      'home首页',
      'explore3探索',
      'person个人资料',
    ])
  })

  it('keeps the active destination caller-controlled and leaves native tab order intact', async () => {
    const wrapper = mountNavigationBar(document.body)
    const links = wrapper.findAll<HTMLAnchorElement>('a')
    const arrows = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    wrapper.get('nav').element.addEventListener('click', (event) => event.preventDefault(), true)

    links[1]!.element.focus()
    links[1]!.element.dispatchEvent(arrows)

    expect(document.activeElement).toBe(links[1]!.element)
    expect(links.map((link) => link.attributes('tabindex'))).toEqual([undefined, undefined])
    expect(links[1]!.attributes('aria-current')).toBeUndefined()
    expect(arrows.defaultPrevented).toBe(false)

    await links[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(links[1]!.attributes('aria-current')).toBeUndefined()
    wrapper.unmount()
  })

  it('forwards control events and native attributes without replacing active state', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvNavigationBar, {
      attrs: { id: 'primary-navigation', dir: 'rtl', class: 'app-navigation' },
      slots: {
        default: () =>
          h(
            MdvNavigationBarItem,
            {
              label: '返回',
              active: true,
              onClick: click,
              'aria-label': '返回首页',
              'data-destination': 'home',
            },
            { icon: () => h('span', 'home') },
          ),
      },
    })
    const nav = wrapper.get('nav')
    const button = wrapper.get('button')
    await button.trigger('click')

    expect(nav.attributes()).toMatchObject({ id: 'primary-navigation', dir: 'rtl' })
    expect(nav.attributes('aria-label')).toBeUndefined()
    expect(nav.classes()).toContain('app-navigation')
    expect(button.attributes()).toMatchObject({
      'aria-label': '返回首页',
      'aria-current': 'page',
      'data-destination': 'home',
      type: 'button',
    })
    expect(click).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(button.attributes('aria-current')).toBe('page')
  })

  it('makes disabled buttons and links unavailable without inventing selection behavior', () => {
    const wrapper = mount(MdvNavigationBar, {
      slots: {
        default: () => [
          h(
            MdvNavigationBarItem,
            { label: '暂不可用', disabled: true },
            {
              icon: () => h('span', 'disabled'),
            },
          ),
          h(
            MdvNavigationBarItem,
            { label: '锁定链接', href: '/locked', disabled: true },
            {
              icon: () => h('span', 'locked'),
            },
          ),
        ],
      },
    })

    expect(wrapper.get('button').element.disabled).toBe(true)
    expect(wrapper.get('a').attributes()).toMatchObject({
      'aria-disabled': 'true',
      tabindex: '-1',
    })
    expect(wrapper.get('a').attributes('href')).toBeUndefined()
  })
})
