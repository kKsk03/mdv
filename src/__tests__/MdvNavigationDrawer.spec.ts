import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNodeChild } from 'vue'
import MdvNavigationDrawer from '../components/MdvNavigationDrawer.vue'
import MdvNavigationDrawerItem from '../components/MdvNavigationDrawerItem.vue'
import MdvNavigationDrawerGroup from '../components/MdvNavigationDrawerGroup.vue'
import type { MdvNavigationDrawerProps } from '../components/navigation-drawer.types'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
const hosts = new Set<{ unmount(): void }>()
beforeEach(() => {
  platform = mockDialogPlatform()
})
afterEach(async () => {
  hosts.forEach((host) => host.unmount())
  hosts.clear()
  await flushPromises()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})
function example(
  props: MdvNavigationDrawerProps = {},
  children: () => VNodeChild = () => [
    h(MdvNavigationDrawerItem, { label: '收件箱', active: true }),
    h(MdvNavigationDrawerItem, { label: '收藏' }),
  ],
) {
  const visible = ref(props.modelValue ?? true)
  const config = ref(props)
  const accept = ref(true)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { id: 'trigger' }, '外部按钮'),
          h(
            MdvNavigationDrawer,
            {
              ...config.value,
              modelValue: visible.value,
              'onUpdate:modelValue': (value: boolean) => {
                if (accept.value) visible.value = value
              },
            },
            { default: children },
          ),
        ]),
    }),
    { attachTo: document.body },
  )
  hosts.add(host)
  return { host, drawer: host.getComponent(MdvNavigationDrawer), visible, accept, config }
}

function cachedExample(initiallyVisible = false) {
  const shown = ref(true)
  const visible = ref(initiallyVisible)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { id: 'external' }, '打开'),
          h('button', { id: 'next' }, '正文操作'),
          h(KeepAlive, null, {
            default: () =>
              shown.value
                ? h(
                    MdvNavigationDrawer,
                    { key: 'drawer', modelValue: visible.value },
                    { default: () => h(MdvNavigationDrawerItem, { label: '首页' }) },
                  )
                : h('div'),
          }),
        ]),
    }),
    { attachTo: document.body },
  )
  hosts.add(host)
  return { host, shown, visible, drawer: host.getComponent(MdvNavigationDrawer) }
}

describe('MdvNavigationDrawer', () => {
  it('starts visible, labels a native navigation list and never steals page focus or locks scrolling', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const { drawer } = example({ title: '邮箱' })
    await flushPromises()
    const nav = drawer.get('nav')
    expect(nav.attributes('aria-labelledby')).toBe(drawer.get('header').attributes('id'))
    expect(nav.get('ul').element.tagName).toBe('UL')
    expect(nav.findAll('li')).toHaveLength(2)
    expect(nav.get('button').attributes('aria-current')).toBe('page')
    expect(document.activeElement).toBe(trigger)
    expect(document.documentElement.style.overflow).toBe('')
    expect(drawer.emitted('open')).toHaveLength(1)
    expect(drawer.emitted('opened')).toHaveLength(1)
  })

  it('collapses its layout, retains navigation nodes, emits accepted reasons and can destroy closed content', async () => {
    const { drawer, host, visible, config } = example({}, () =>
      h(MdvNavigationDrawerItem, { label: '首页' }),
    )
    await flushPromises()
    const item = drawer.get('button').element
    host.get<HTMLButtonElement>('#trigger').element.focus()
    visible.value = false
    await flushPromises()
    expect(drawer.get('.mdv-navigation-drawer').attributes('hidden')).toBeDefined()
    expect(drawer.get('nav').attributes('inert')).toBeDefined()
    expect(drawer.get<HTMLElement>('.mdv-navigation-drawer').element.style.inlineSize).toContain(
      '* 0',
    )
    expect(drawer.emitted('closed')).toEqual([[{ reason: 'model' }]])
    visible.value = true
    await flushPromises()
    expect(drawer.get('button').element).toBe(item)
    expect(drawer.get('nav').attributes('inert')).toBeUndefined()
    expect(document.activeElement).toBe(host.get('#trigger').element)
    config.value.destroyOnClose = true
    await nextTick()
    expect(await drawer.vm.close()).toBe(true)
    await flushPromises()
    expect(drawer.find('nav').exists()).toBe(false)
    expect(drawer.emitted('close')?.[1]).toEqual([{ reason: 'action' }])
  })

  it('coalesces asynchronous close requests, keeps frozen details and respects rejection and stale results', async () => {
    let resolve!: (allowed: boolean) => void
    const beforeClose = vi.fn<NonNullable<MdvNavigationDrawerProps['beforeClose']>>(
      () =>
        new Promise<boolean>((yes) => {
          resolve = yes
        }),
    )
    const { drawer, visible, accept } = example({ beforeClose })
    await flushPromises()
    const first = drawer.vm.close()
    const second = drawer.vm.close()
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(Object.isFrozen(beforeClose.mock.calls[0]?.[0])).toBe(true)
    resolve(false)
    expect(await first).toBe(false)
    expect(await second).toBe(false)
    expect(visible.value).toBe(true)
    accept.value = false
    const rejected = drawer.vm.close()
    resolve(true)
    expect(await rejected).toBe(false)
    expect(drawer.emitted('closed')).toBeUndefined()
    const stale = drawer.vm.close()
    visible.value = false
    await flushPromises()
    visible.value = true
    await flushPromises()
    resolve(true)
    expect(await stale).toBe(false)
    expect(visible.value).toBe(true)
  })

  it('uses native button and link semantics and leaves active selection caller-controlled', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const { drawer } = example({}, () => [
      h(
        MdvNavigationDrawerItem,
        { label: '首页', active: true, badge: 0 },
        {
          icon: ({ active }: { active: boolean }) =>
            h('span', { 'data-active': String(active) }, 'icon'),
        },
      ),
      h(MdvNavigationDrawerItem, {
        label: '探索',
        href: '/explore',
        onClick: click,
        target: '_blank',
      }),
      h(MdvNavigationDrawerItem, {
        label: '不可用',
        href: '/disabled',
        disabled: true,
        onClick: click,
      }),
    ])
    await flushPromises()
    expect(drawer.get('button').attributes('type')).toBe('button')
    expect(drawer.get('[data-active]').attributes('data-active')).toBe('true')
    expect(drawer.get('.mdv-navigation-drawer__badge').text()).toBe('0')
    const links = drawer.findAll('a')
    await links[0]!.trigger('click')
    expect(click).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(links[0]!.attributes('aria-current')).toBeUndefined()
    expect(links[1]!.attributes('href')).toBeUndefined()
    expect(links[1]!.attributes('aria-disabled')).toBe('true')
    expect(links[1]!.attributes('tabindex')).toBe('-1')
    await links[1]!.trigger('click')
    expect(click).toHaveBeenCalledTimes(1)
    expect(drawer.emitted('update:modelValue')).toBeUndefined()
  })

  it('moves keyboard focus among visible enabled controls without changing selection or tab order', async () => {
    const { drawer } = example({}, () => [
      h(MdvNavigationDrawerItem, { label: '首页', active: true }),
      h(MdvNavigationDrawerItem, { label: '禁用', disabled: true }),
      h(
        MdvNavigationDrawerGroup,
        { label: '分组', collapsible: true, expanded: false },
        { default: () => h(MdvNavigationDrawerItem, { label: '隐藏' }) },
      ),
      h(MdvNavigationDrawerItem, { label: '最后', href: '#last' }),
    ])
    await flushPromises()
    const rows = drawer.findAll<HTMLElement>('[data-mdv-drawer-control]')
    rows[0]!.element.focus()
    await rows[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(rows[2]!.element)
    await rows[2]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(rows[4]!.element)
    await rows[4]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(rows[0]!.element)
    await rows[0]!.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(rows[4]!.element)
    expect(rows.map((row) => row.attributes('tabindex'))).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
    expect(rows[0]!.attributes('aria-current')).toBe('page')
    expect(rows[4]!.attributes('aria-current')).toBeUndefined()
    const arrows = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    })
    rows[4]!.element.dispatchEvent(arrows)
    expect(arrows.defaultPrevented).toBe(false)
  })

  it('expands uncontrolled groups, preserves nested lists and restores focus only from hidden descendants', async () => {
    const innerExpanded = ref<boolean | undefined>(undefined)
    const { drawer, host } = example({}, () =>
      h(
        MdvNavigationDrawerGroup,
        { label: '文件夹', collapsible: true, divider: true },
        {
          default: () =>
            h(
              MdvNavigationDrawerGroup,
              { label: '开发', collapsible: true, expanded: innerExpanded.value },
              { default: () => h(MdvNavigationDrawerItem, { label: '组件' }) },
            ),
        },
      ),
    )
    await flushPromises()
    const groups = drawer.findAllComponents(MdvNavigationDrawerGroup)
    const first = groups[0]!.get<HTMLButtonElement>('button')
    const inner = groups[1]!.get<HTMLButtonElement>('button')
    expect(first.attributes('aria-expanded')).toBe('true')
    expect(drawer.findAll('ul')).toHaveLength(3)
    expect(groups[0]!.classes()).toContain('mdv-navigation-drawer-group--divider')
    expect(inner.element.closest('li')?.style.getPropertyValue('--mdv-drawer-depth')).toBe('1')
    drawer.getComponent(MdvNavigationDrawerItem).vm.focus()
    innerExpanded.value = false
    await nextTick()
    expect(document.activeElement).toBe(inner.element)
    expect(
      groups[1]!.get('.mdv-navigation-drawer-group__collapse').attributes('inert'),
    ).toBeDefined()
    host.get<HTMLButtonElement>('#trigger').element.focus()
    await first.trigger('click')
    await flushPromises()
    expect(first.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(host.get('#trigger').element)
    await first.trigger('click')
    await flushPromises()
    expect(first.attributes('aria-expanded')).toBe('true')
  })

  it('respects controlled group rejection and cancelled disclosure activation', async () => {
    const expanded = ref(false)
    const cancelled = ref(false)
    const request = vi.fn<(value: boolean) => void>()
    const { drawer } = example({}, () =>
      h(
        MdvNavigationDrawerGroup,
        {
          label: '受控组',
          collapsible: true,
          expanded: expanded.value,
          'onUpdate:expanded': request,
          onClick: (event: MouseEvent) => {
            if (cancelled.value) event.preventDefault()
          },
        },
        { default: () => h(MdvNavigationDrawerItem, { label: '子项' }) },
      ),
    )
    await flushPromises()
    const button = drawer.get('button')
    await button.trigger('click')
    await flushPromises()
    expect(request).toHaveBeenCalledExactlyOnceWith(true)
    expect(button.attributes('aria-expanded')).toBe('false')
    cancelled.value = true
    await button.trigger('click')
    await flushPromises()
    expect(request).toHaveBeenCalledTimes(1)
    expanded.value = true
    await flushPromises()
    expect(button.attributes('aria-expanded')).toBe('true')
  })

  it('recovers focus from removed destinations and exposes focus and blur', async () => {
    const present = ref(true)
    const { drawer } = example({}, () => [
      h(MdvNavigationDrawerItem, { label: '首页', active: true }),
      present.value ? h(MdvNavigationDrawerItem, { label: '临时' }) : null,
    ])
    await flushPromises()
    const items = drawer.findAllComponents(MdvNavigationDrawerItem)
    items[1]!.vm.focus()
    present.value = false
    await flushPromises()
    expect(document.activeElement).toBe(items[0]!.get('button').element)
    items[0]!.vm.blur()
    expect(document.activeElement).toBe(document.body)
    drawer.vm.focus()
    expect(document.activeElement).toBe(items[0]!.get('button').element)
  })

  it('returns Standard focus to its external trigger and resets cleanly across KeepAlive', async () => {
    const { host, drawer, shown, visible } = cachedExample(true)
    await flushPromises()
    host.get<HTMLButtonElement>('#external').element.focus()
    visible.value = false
    await flushPromises()
    visible.value = true
    await flushPromises()
    drawer.vm.focus()
    expect(document.activeElement).toBe(drawer.get('button').element)
    shown.value = false
    await flushPromises()
    expect(document.activeElement).toBe(host.get('#external').element)
    shown.value = true
    await flushPromises()
    expect(host.getComponent(MdvNavigationDrawer).attributes('data-state')).toBe('open')
    expect(document.activeElement).toBe(host.get('#external').element)
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('preserves newer page focus when a cached Standard drawer is deactivated', async () => {
    const { host, drawer, shown, visible } = cachedExample()
    await flushPromises()
    host.get<HTMLButtonElement>('#external').element.focus()
    visible.value = true
    await flushPromises()
    drawer.vm.focus()
    const next = host.get<HTMLButtonElement>('#next')
    next.element.focus()
    shown.value = false
    await flushPromises()
    expect(document.activeElement).toBe(next.element)
  })

  it('respects an explicit blur before a cached Standard drawer is deactivated', async () => {
    const { host, drawer, shown, visible } = cachedExample()
    await flushPromises()
    host.get<HTMLButtonElement>('#external').element.focus()
    visible.value = true
    await flushPromises()
    drawer.vm.focus()
    drawer.getComponent(MdvNavigationDrawerItem).vm.blur()
    expect(document.activeElement).toBe(document.body)
    shown.value = false
    await flushPromises()
    expect(document.activeElement).toBe(document.body)
  })
})
