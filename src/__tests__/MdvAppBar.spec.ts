import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, onMounted, ref, shallowRef } from 'vue'
import MdvAppBar from '../components/MdvAppBar.vue'
import type { MdvAppBarSlotProps } from '../components/app-bar.types'
import { appBarScroll, mockAppBarPlatform } from './app-bar-test-platform'

enableAutoUnmount(afterEach)
let platform: ReturnType<typeof mockAppBarPlatform>
beforeEach(() => {
  platform = mockAppBarPlatform()
})
afterEach(() => {
  platform.restore()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

function region() {
  const node = document.createElement('div')
  document.body.append(node)
  return node
}
function value(root: Element, name: string) {
  return (root as HTMLElement).style.getPropertyValue(`--mdv-app-bar-${name}`)
}

describe('MdvAppBar', () => {
  it('renders one semantic heading, forwards native attributes and preserves external focus', async () => {
    const outside = document.createElement('input')
    document.body.append(outside)
    outside.focus()
    const clicked = vi.fn<(event: MouseEvent) => void>()
    const mounted = vi.fn<() => void>()
    const Title = defineComponent({
      setup() {
        onMounted(mounted)
        return () => h('span', { id: 'custom-title' }, '自定义标题')
      },
    })
    const wrapper = mount(MdvAppBar, {
      props: { headingLevel: 2, title: '备用标题' },
      attrs: { id: 'main-bar', class: 'custom-bar', dir: 'rtl', onClick: clicked },
      slots: {
        title: () => h(Title),
        leading: () => h('button', { 'aria-label': '返回' }, '返回'),
        actions: () => h('button', { 'aria-label': '更多' }, '更多'),
      },
      attachTo: document.body,
    })
    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.attributes('id')).toBe('main-bar')
    expect(wrapper.attributes('dir')).toBe('rtl')
    expect(wrapper.classes()).toContain('custom-bar')
    expect(wrapper.findAll('h2')).toHaveLength(1)
    expect(wrapper.get('h2').text()).toBe('自定义标题')
    expect(document.activeElement).toBe(outside)
    await wrapper.get('button').trigger('click')
    expect(clicked).toHaveBeenCalledOnce()
    await wrapper.setProps({ variant: 'large', subtitle: '副标题' })
    expect(wrapper.findAll('#custom-title')).toHaveLength(1)
    expect(mounted).toHaveBeenCalledOnce()
    expect(wrapper.get('.mdv-app-bar__subtitle').text()).toBe('副标题')
  })

  it('follows only the explicit scroll region, continuously collapses and retains its expanded layout space', async () => {
    const target = region()
    const wrapper = mount(MdvAppBar, {
      props: {
        variant: 'large',
        title: '完整标题',
        subtitle: '副标题',
        collapsedTitle: '短标题',
        scrollBehavior: 'exit-until-collapsed',
        scrollTarget: target,
      },
    })
    await nextTick()
    const root = wrapper.element
    const heading = wrapper.get('h1').element
    expect(value(root, 'expanded-height')).toBe('152px')
    appBarScroll(window, 100)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-app-bar--scrolled')
    appBarScroll(target, 44)
    await nextTick()
    expect(value(root, 'progress')).toBe('0.5')
    expect(value(root, 'collapse')).toBe('44px')
    expect(Number(value(root, 'auto-color-progress'))).toBeCloseTo(0.3248, 3)
    expect(value(root, 'expanded-height')).toBe('152px')
    appBarScroll(target, 500)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-app-bar--collapsed')
    expect(wrapper.classes()).toContain('mdv-app-bar--scrolled')
    expect(value(root, 'collapse')).toBe('88px')
    expect(value(root, 'auto-color-progress')).toBe('1')
    expect(value(root, 'hide')).toBe('0px')
    expect(wrapper.get('h1').element).toBe(heading)
    expect(wrapper.get('h1').attributes('aria-label')).toBe('完整标题')
    appBarScroll(target, 300)
    expect(value(root, 'collapse')).toBe('88px')
    appBarScroll(target, 0)
    await nextTick()
    expect(value(root, 'collapse')).toBe('0px')
    expect(value(root, 'auto-color-progress')).toBe('0')
    expect(wrapper.classes()).not.toContain('mdv-app-bar--collapsed')
  })

  it('hides on forward scroll, reappears on reverse scroll and snaps without leaving active motion after unmount', async () => {
    vi.useFakeTimers()
    const target = region()
    const wrapper = mount(MdvAppBar, {
      props: { title: '收件箱', scrollBehavior: 'enter-always', scrollTarget: target },
    })
    appBarScroll(target, 200)
    expect(value(wrapper.element, 'hide')).toBe('64px')
    appBarScroll(target, 180)
    expect(value(wrapper.element, 'hide')).toBe('44px')
    await vi.advanceTimersByTimeAsync(151)
    expect(value(wrapper.element, 'hide')).toBe('64px')
    appBarScroll(target, 130)
    expect(value(wrapper.element, 'hide')).toBe('14px')
    await vi.advanceTimersByTimeAsync(151)
    expect(value(wrapper.element, 'hide')).toBe('0px')
    const root = wrapper.element
    appBarScroll(target, 150)
    const hidden = value(root, 'hide')
    wrapper.unmount()
    appBarScroll(target, 400)
    await vi.advanceTimersByTimeAsync(500)
    expect(value(root, 'hide')).toBe(hidden)
    expect(platform.disconnect).toHaveBeenCalledOnce()
  })

  it('keeps keyboard focus visible through further scrolling without taking focus on mount', async () => {
    const target = region()
    const wrapper = mount(MdvAppBar, {
      props: { title: '收藏', scrollBehavior: 'enter-always', scrollTarget: target },
      slots: { actions: () => h('button', '更多') },
      attachTo: document.body,
    })
    appBarScroll(target, 200)
    expect(value(wrapper.element, 'hide')).toBe('64px')
    const button = wrapper.get('button').element
    button.focus()
    expect(document.activeElement).toBe(button)
    expect(value(wrapper.element, 'hide')).toBe('0px')
    appBarScroll(target, 300)
    expect(value(wrapper.element, 'hide')).toBe('0px')
    await wrapper.get('button').trigger('pointerdown')
    appBarScroll(target, 400)
    expect(value(wrapper.element, 'hide')).toBe('64px')
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })
    expect(value(wrapper.element, 'hide')).toBe('0px')
    button.blur()
    await nextTick()
    appBarScroll(target, 500)
    expect(value(wrapper.element, 'hide')).toBe('64px')
  })

  it('measures long content and enlarged text, centers against unequal actions and refreshes dynamic images', async () => {
    platform.content(100, 80, 32)
    platform.sides(48, 96)
    const wrapper = mount(MdvAppBar, {
      props: { variant: 'large', title: '长标题', titleAlignment: 'center' },
      slots: {
        leading: () => h('button', '返回'),
        actions: () => [h('button', '搜索'), h('button', '更多')],
        image: () => h('img', { alt: '品牌', src: 'brand.svg' }),
      },
    })
    await nextTick()
    expect(value(wrapper.element, 'row-height')).toBe('96px')
    expect(value(wrapper.element, 'expanded-height')).toBe('208px')
    expect(value(wrapper.element, 'start')).toBe('112px')
    expect(value(wrapper.element, 'end')).toBe('112px')
    platform.content(140, 80, 72)
    wrapper.vm.refresh()
    await nextTick()
    expect(value(wrapper.element, 'expanded-height')).toBe('248px')
    expect(value(wrapper.element, 'image-height')).toBe('72px')
    expect(wrapper.element.className).not.toMatch(/measure-/)
    expect(wrapper.vm.element).toBe(wrapper.element)
    platform.content(180, 80, 112)
    platform.resize()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    await nextTick()
    expect(value(wrapper.element, 'expanded-height')).toBe('288px')
  })

  it('switches reactive getter targets and behaviors and does not fall back to window for a missing selector', async () => {
    const first = region()
    const second = region()
    const current = shallowRef<HTMLElement | null>(first)
    const wrapper = mount(MdvAppBar, {
      props: {
        variant: 'medium',
        title: '标题',
        scrollBehavior: 'exit-until-collapsed',
        scrollTarget: () => current.value,
      },
    })
    appBarScroll(first, 100)
    expect(value(wrapper.element, 'collapse')).toBe('48px')
    current.value = second
    await nextTick()
    expect(value(wrapper.element, 'collapse')).toBe('0px')
    appBarScroll(first, 200)
    expect(value(wrapper.element, 'collapse')).toBe('0px')
    appBarScroll(second, 20)
    expect(value(wrapper.element, 'collapse')).toBe('20px')
    await wrapper.setProps({ scrollBehavior: 'pinned' })
    expect(value(wrapper.element, 'collapse')).toBe('0px')
    await wrapper.setProps({ scrollTarget: '#not-present' })
    appBarScroll(window, 300)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-app-bar--scrolled')
    expect(value(wrapper.element, 'auto-color-progress')).toBe('0')
    await wrapper.setProps({ scrollTarget: undefined })
    expect(wrapper.classes()).toContain('mdv-app-bar--scrolled')
    expect(value(wrapper.element, 'auto-color-progress')).toBe('1')
    await wrapper.setProps({ scrollBehavior: 'none' })
    expect(wrapper.classes()).not.toContain('mdv-app-bar--sticky')
  })

  it('allows explicit false and true appearance overrides and supplies typed slot state', async () => {
    const target = region()
    const wrapper = mount(MdvAppBar, {
      props: { title: '标题', scrolled: false, scrollTarget: target, transparentOnScroll: true },
      slots: {
        actions: (state: MdvAppBarSlotProps) =>
          h('button', { 'data-state': String(state.scrolled) }),
      },
    })
    appBarScroll(target, 40)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-app-bar--scrolled')
    expect(value(wrapper.element, 'color-progress')).toBe('0')
    expect(wrapper.get('button').attributes('data-state')).toBe('false')
    await wrapper.setProps({ scrolled: true })
    expect(wrapper.classes()).toContain('mdv-app-bar--scrolled')
    expect(value(wrapper.element, 'color-progress')).toBe('1')
    expect(wrapper.get('button').attributes('data-state')).toBe('true')
    appBarScroll(target, 0)
    await wrapper.setProps({ scrolled: undefined })
    expect(wrapper.classes()).not.toContain('mdv-app-bar--scrolled')
    expect(wrapper.classes()).toContain('mdv-app-bar--transparent')
    expect(value(wrapper.element, 'color-progress')).toBe('var(--mdv-app-bar-auto-color-progress)')
  })

  it('switches decoration independently of continuous color and retains custom trailing action nodes', async () => {
    const target = region()
    const wrapper = mount(MdvAppBar, {
      props: { title: '行程', scrollBehavior: 'pinned', scrollTarget: target },
      slots: { actions: () => h('button', { 'data-custom-action': '' }, '导出行程') },
    })
    await nextTick()
    const action = wrapper.get('[data-custom-action]').element
    const height = value(wrapper.element, 'expanded-height')
    expect(wrapper.classes()).toContain('mdv-app-bar--default')
    appBarScroll(target, 32)
    expect(Number(value(wrapper.element, 'auto-color-progress'))).toBeCloseTo(0.3248, 3)
    await wrapper.setProps({ appearance: 'elevated' })
    expect(wrapper.classes()).toContain('mdv-app-bar--elevated')
    expect(wrapper.classes()).not.toContain('mdv-app-bar--default')
    expect(Number(value(wrapper.element, 'auto-color-progress'))).toBeCloseTo(0.3248, 3)
    await wrapper.setProps({ appearance: 'bordered' })
    expect(wrapper.classes()).toContain('mdv-app-bar--bordered')
    expect(wrapper.classes()).not.toContain('mdv-app-bar--elevated')
    expect(wrapper.get('[data-custom-action]').element).toBe(action)
    expect(value(wrapper.element, 'expanded-height')).toBe(height)
    appBarScroll(target, 0)
    expect(value(wrapper.element, 'auto-color-progress')).toBe('0')
  })

  it('detaches during KeepAlive and resumes at the current target position without replacing the heading', async () => {
    const shown = ref(true)
    const target = region()
    const Bar = defineComponent({
      setup: () => () =>
        h(MdvAppBar, {
          variant: 'medium',
          title: '保留的标题',
          scrollTarget: target,
          scrollBehavior: 'exit-until-collapsed',
        }),
    })
    const host = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, () => (shown.value ? h(Bar) : h('div'))),
      }),
      { attachTo: document.body },
    )
    const heading = host.get('h1').element
    appBarScroll(target, 100)
    await nextTick()
    shown.value = false
    await flushPromises()
    const root = heading.closest('header')!
    appBarScroll(target, 0)
    expect(value(root, 'collapse')).toBe('48px')
    shown.value = true
    await flushPromises()
    expect(host.get('h1').element).toBe(heading)
    expect(value(root, 'collapse')).toBe('0px')
    expect(document.activeElement).not.toBe(heading)
  })
})
