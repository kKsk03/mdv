import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MdvNavigationRail from '../components/MdvNavigationRail.vue'
import MdvNavigationRailItem from '../components/MdvNavigationRailItem.vue'
import type {
  MdvNavigationRailItemSlotProps,
  MdvNavigationRailSlotProps,
} from '../components/navigation-rail.types'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

function item(label: string, props: Record<string, unknown> = {}) {
  return h(
    MdvNavigationRailItem,
    { label, ...props },
    {
      icon: ({ active, expanded }: MdvNavigationRailItemSlotProps) =>
        h('span', { 'data-icon': `${active}/${expanded}` }, '图标'),
    },
  )
}

describe('MdvNavigationRail', () => {
  it('renders a nav with native links and buttons, caller-owned active state and scoped slots', () => {
    const rail = mount(MdvNavigationRail, {
      props: { expanded: true, transparent: true, showDivider: true, alignment: 'center' },
      attrs: { 'aria-label': '主导航', dir: 'rtl', role: 'tablist', class: 'custom-rail' },
      slots: {
        default: () => [item('首页', { active: true }), item('探索', { href: '/explore' })],
      },
    })
    expect(rail.get('nav').attributes('role')).toBeUndefined()
    expect(rail.get('nav').attributes('aria-label')).toBe('主导航')
    expect(rail.get('nav').attributes('dir')).toBe('rtl')
    expect(rail.get('nav').classes()).toEqual(
      expect.arrayContaining([
        'custom-rail',
        'mdv-navigation-rail--transparent',
        'mdv-navigation-rail--divider',
      ]),
    )
    expect(rail.get('nav').attributes('data-alignment')).toBe('center')
    expect(rail.get('button').attributes('type')).toBe('button')
    expect(rail.get('button').attributes('aria-current')).toBe('page')
    expect(rail.get('[data-icon]').attributes('data-icon')).toBe('true/true')
    expect(rail.get('a').attributes('href')).toBe('/explore')
    expect(rail.get('a').attributes('aria-current')).toBeUndefined()
    expect(rail.find('.mdv-navigation-rail__header').exists()).toBe(false)
    rail.unmount()
  })

  it('keeps one badge node and forwards original native events without updating active', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const rail = mount(MdvNavigationRail, {
      slots: {
        default: () =>
          h(
            MdvNavigationRailItem,
            { label: '探索', onClick: click },
            {
              badge: ({ expanded }: MdvNavigationRailItemSlotProps) =>
                h(
                  'span',
                  { role: 'img', 'aria-label': '3 条通知', 'data-expanded': String(expanded) },
                  '3',
                ),
            },
          ),
      },
    })
    const badge = rail.get('[role="img"]').element
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    rail.get('button').element.dispatchEvent(event)
    await flushPromises()
    expect(click).toHaveBeenCalledExactlyOnceWith(event)
    expect(rail.get('button').attributes('aria-current')).toBeUndefined()
    await rail.setProps({ expanded: true })
    expect(rail.get('[role="img"]').element).toBe(badge)
    expect(rail.get('[role="img"]').attributes('data-expanded')).toBe('true')
    expect(rail.findAll('[role="img"]')).toHaveLength(1)
    rail.unmount()
  })

  it('binds menu controls to a custom nav id and accepts or rejects expansion without moving focus', async () => {
    const rail = mount(MdvNavigationRail, {
      attachTo: document.body,
      attrs: { id: 'library-navigation' },
      slots: {
        menu: ({ menuAttrs }: MdvNavigationRailSlotProps) =>
          h('button', { ...menuAttrs, 'aria-label': '展开导航' }, '菜单'),
        default: () => item('首页'),
      },
    })
    const menu = rail.get<HTMLButtonElement>('button[aria-controls]')
    menu.element.focus()
    await menu.trigger('click')
    expect(menu.attributes('aria-controls')).toBe('library-navigation')
    expect(menu.attributes('aria-expanded')).toBe('false')
    expect(rail.emitted('update:expanded')).toEqual([[true]])
    expect(rail.get('nav').attributes('data-expanded')).toBe('false')
    await rail.setProps({ expanded: true })
    expect(menu.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(menu.element)
    expect(document.documentElement.style.overflow).not.toBe('hidden')
    rail.unmount()
  })

  it('moves only focus with arrows and Home/End, skips unavailable items and preserves native Tab order', async () => {
    const selected = vi.fn<() => void>()
    const rail = mount(MdvNavigationRail, {
      attachTo: document.body,
      slots: {
        default: () => [
          item('首页', { active: true, onClick: selected }),
          item('禁用按钮', { disabled: true }),
          item('隐藏项', { hidden: true }),
          item('禁用链接', { disabled: true, href: '/disabled' }),
          item('CSS 隐藏', { style: 'display:none' }),
          item('探索', { href: '/explore' }),
          item('资料'),
        ],
      },
    })
    const items = rail.findAll<HTMLElement>('[data-mdv-rail-item]')
    items[0]!.element.focus()
    await items[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[5]!.element)
    await items[5]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(items[6]!.element)
    await items[6]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(items[0]!.element)
    expect([items[0], items[5], items[6]].map((entry) => entry!.attributes('tabindex'))).toEqual([
      undefined,
      undefined,
      undefined,
    ])
    expect(items[0]!.attributes('aria-current')).toBe('page')
    expect(items[5]!.attributes('aria-current')).toBeUndefined()
    expect(items[3]!.attributes('href')).toBeUndefined()
    expect(items[3]!.attributes('tabindex')).toBe('-1')
    expect(selected).not.toHaveBeenCalled()
    rail.unmount()
  })

  it('does not consume cancelled arrow keys or arrows belonging to a nested rail', async () => {
    const rail = mount(MdvNavigationRail, {
      attachTo: document.body,
      slots: {
        default: () => [
          item('外一'),
          h(
            MdvNavigationRail,
            { 'aria-label': '内部' },
            { default: () => [item('内一'), item('内二')] },
          ),
          item('外二'),
        ],
      },
    })
    const items = rail.findAll<HTMLElement>('[data-mdv-rail-item]')
    items[1]!.element.focus()
    await items[1]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[2]!.element)
    const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    event.preventDefault()
    items[2]!.element.dispatchEvent(event)
    expect(document.activeElement).toBe(items[2]!.element)
    rail.unmount()
  })

  it('restores focus only when collapsing removes the focused secondary destination', async () => {
    const expanded = ref(true)
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvNavigationRail,
          { expanded: expanded.value },
          {
            default: ({ expanded: open }: MdvNavigationRailSlotProps) => [
              item('首页', { active: true }),
              open ? item('次要目的地') : null,
            ],
          },
        ),
    })
    const rail = mount(Example, { attachTo: document.body })
    rail.findAll<HTMLButtonElement>('[data-mdv-rail-item]')[1]!.element.focus()
    expanded.value = false
    await nextTick()
    expect(document.activeElement).toBe(rail.get('[aria-current="page"]').element)
    expanded.value = true
    await nextTick()
    expect(document.activeElement).toBe(rail.get('[aria-current="page"]').element)
    rail.unmount()
  })

  it('respects disabled links and buttons, and exposes native focus and blur', async () => {
    const clicked = vi.fn<(event: MouseEvent) => void>()
    const rail = mount(MdvNavigationRail, {
      attachTo: document.body,
      slots: {
        default: () => [
          item('禁用', { disabled: true, href: '/disabled', onClick: clicked }),
          item('首页', { active: true }),
        ],
      },
    })
    await rail.get('a').trigger('click')
    expect(clicked).not.toHaveBeenCalled()
    rail.vm.focus()
    const active = rail.getComponent(MdvNavigationRailItem)
    const last = rail.findAllComponents(MdvNavigationRailItem)[1]!
    expect(document.activeElement).toBe(last.element)
    last.vm.blur()
    expect(document.activeElement).toBe(document.body)
    last.vm.focus({ preventScroll: true })
    expect(document.activeElement).toBe(last.element)
    expect(active.props('disabled')).toBe(true)
    rail.unmount()
  })
})
