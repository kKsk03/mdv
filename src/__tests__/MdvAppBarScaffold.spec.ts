import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import MdvAppBar from '../components/MdvAppBar.vue'
import MdvAppBarScaffold from '../components/MdvAppBarScaffold.vue'
import MdvNavigationDrawer from '../components/MdvNavigationDrawer.vue'
import type { MdvAppBarProps } from '../components/app-bar.types'
import { appBarScroll, mockAppBarPlatform } from './app-bar-test-platform'

enableAutoUnmount(afterEach)
let platform: ReturnType<typeof mockAppBarPlatform>
beforeEach(() => {
  platform = mockAppBarPlatform()
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

const appbarProps: MdvAppBarProps = {
  variant: 'large',
  title: '我的收藏',
  subtitle: '旅途中的美好风景',
  scrollBehavior: 'exit-until-collapsed',
}
const value = (root: Element, name: string) =>
  (root as HTMLElement).style.getPropertyValue(`--mdv-app-bar-scaffold-${name}`)

describe('MdvAppBarScaffold', () => {
  it('extends the actual app bar background behind an adjacent drawer and follows themes, height, and cleanup', async () => {
    const shown = ref(true)
    const theme = ref('light')
    const style = document.createElement('style')
    style.textContent =
      '.light .mdv-app-bar__surface { background-color: rgb(250, 240, 255); } .dark .mdv-app-bar__surface { background-color: rgba(30, 25, 40, .5); }'
    document.head.append(style)
    try {
      const host = mount(
        defineComponent({
          setup: () => () =>
            h('div', { class: theme.value }, [
              h(MdvNavigationDrawer),
              shown.value
                ? h(MdvAppBarScaffold, null, {
                    appbar: () => h(MdvAppBar, appbarProps),
                    default: () => h('p', '正文'),
                  })
                : null,
            ]),
        }),
        { attachTo: document.body },
      )
      await flushPromises()
      const drawer = host.get<HTMLElement>('.mdv-navigation-drawer').element
      const panel = host.get('.mdv-navigation-drawer__surface').element
      const scaffold = host.getComponent(MdvAppBarScaffold)
      const background = () => drawer.style.getPropertyValue('--mdv-drawer-app-bar-background')
      expect(background()).toBe('rgb(250, 240, 255)')
      expect(drawer.style.getPropertyValue('--mdv-drawer-app-bar-height')).toBe('152px')
      theme.value = 'dark'
      await flushPromises()
      expect(background()).toBe('rgba(30, 25, 40, 0.5)')
      appBarScroll(scaffold.vm.contentElement!, 200)
      expect(drawer.style.getPropertyValue('--mdv-drawer-app-bar-height')).toBe('64px')
      expect(host.get('.mdv-navigation-drawer__surface').element).toBe(panel)
      shown.value = false
      await flushPromises()
      expect(background()).toBe('')
      expect(drawer.style.getPropertyValue('--mdv-drawer-app-bar-height')).toBe('')
    } finally {
      style.remove()
    }
  })

  it('does not associate a separated drawer with the app bar and clears the background while deactivated', async () => {
    const shown = ref(true)
    const separated = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h(MdvNavigationDrawer),
            separated.value ? h('div', '其它内容') : null,
            h(KeepAlive, null, {
              default: () =>
                shown.value
                  ? h(MdvAppBarScaffold, null, {
                      appbar: () => h(MdvAppBar, appbarProps),
                      default: () => h('p', '正文'),
                    })
                  : null,
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    await flushPromises()
    const drawer = host.get<HTMLElement>('.mdv-navigation-drawer').element
    const height = () => drawer.style.getPropertyValue('--mdv-drawer-app-bar-height')
    expect(height()).toBe('')
    separated.value = false
    await flushPromises()
    expect(height()).toBe('152px')
    shown.value = false
    await flushPromises()
    expect(height()).toBe('')
    shown.value = true
    await flushPromises()
    expect(height()).toBe('152px')
  })

  it('separates the header from the scroll region and exposes native content attributes and elements', async () => {
    const onScroll = vi.fn<(event: Event) => void>()
    const wrapper = mount(MdvAppBarScaffold, {
      attachTo: document.body,
      attrs: { id: 'page', dir: 'rtl', style: { height: '480px' } },
      props: { contentAttrs: { id: 'content', 'aria-label': '收藏正文', tabindex: -1, onScroll } },
      slots: {
        appbar: () => h(MdvAppBar, appbarProps),
        default: () => h('main', '页面正文'),
      },
    })
    await nextTick()
    const root = wrapper.element
    const body = wrapper.get<HTMLElement>('#content')
    const bar = wrapper.getComponent(MdvAppBar)
    expect(wrapper.attributes('dir')).toBe('rtl')
    expect(wrapper.attributes('id')).toBe('page')
    expect(body.attributes('role')).toBe('region')
    expect(body.attributes('aria-label')).toBe('收藏正文')
    expect(body.attributes('tabindex')).toBe('-1')
    expect(body.find('header').exists()).toBe(false)
    expect(body.get('main').text()).toBe('页面正文')
    expect(bar.element.parentElement?.nextElementSibling).toBe(body.element)
    expect(wrapper.vm.element).toBe(root)
    expect(wrapper.vm.contentElement).toBe(body.element)
    appBarScroll(body.element, 44)
    expect(onScroll).toHaveBeenCalledOnce()
    expect(value(root, 'height')).toBe('108px')
  })

  it('follows only its content target, coordinates collapse and return to top, and remeasures dynamic content', async () => {
    const wrapper = mount(MdvAppBarScaffold, {
      slots: { appbar: () => h(MdvAppBar, appbarProps), default: () => h('p', '正文') },
    })
    await nextTick()
    const body = wrapper.vm.contentElement!
    const root = wrapper.element
    const bar = wrapper.getComponent(MdvAppBar)
    expect(value(root, 'height')).toBe('152px')
    appBarScroll(window, 200)
    expect(value(root, 'height')).toBe('152px')
    appBarScroll(body, 44)
    expect(value(root, 'height')).toBe('108px')
    expect(value(root, 'offset')).toBe('44px')
    appBarScroll(body, 200)
    expect(value(root, 'height')).toBe('64px')
    expect(value(root, 'offset')).toBe('88px')
    appBarScroll(body, 0)
    expect(value(root, 'height')).toBe('152px')
    expect(value(root, 'offset')).toBe('0px')
    platform.content(140, 80)
    bar.vm.refresh()
    await nextTick()
    expect(value(root, 'height')).toBe('248px')
    appBarScroll(body, 200)
    expect(value(root, 'height')).toBe('96px')
    expect(value(root, 'offset')).toBe('152px')
  })

  it('honors explicit scroll targets, including a missing target without falling back', async () => {
    const external = document.createElement('div')
    document.body.append(external)
    const requested = ref<HTMLElement | null>(external)
    const wrapper = mount(MdvAppBarScaffold, {
      slots: {
        appbar: () => h(MdvAppBar, { ...appbarProps, scrollTarget: () => requested.value }),
      },
    })
    await nextTick()
    appBarScroll(wrapper.vm.contentElement!, 88)
    expect(value(wrapper.element, 'height')).toBe('152px')
    appBarScroll(external, 44)
    expect(value(wrapper.element, 'height')).toBe('108px')
    requested.value = null
    await nextTick()
    appBarScroll(external, 100)
    appBarScroll(window, 100)
    appBarScroll(wrapper.vm.contentElement!, 100)
    expect(value(wrapper.element, 'height')).toBe('152px')
  })

  it('isolates nested scaffolds and does not inject its target into independent app bars in the body', async () => {
    const wrapper = mount(MdvAppBarScaffold, {
      slots: {
        appbar: () => h(MdvAppBar, appbarProps),
        default: () => [
          h(MdvAppBar, { ...appbarProps, id: 'independent' }),
          h(
            MdvAppBarScaffold,
            { id: 'nested' },
            {
              appbar: () => h(MdvAppBar, appbarProps),
              default: () => h('p', '嵌套正文'),
            },
          ),
        ],
      },
    })
    await nextTick()
    const nested = wrapper.findAllComponents(MdvAppBarScaffold)[0]!
    const independent = wrapper.get<HTMLElement>('#independent')
    appBarScroll(wrapper.vm.contentElement!, 88)
    expect(value(wrapper.element, 'height')).toBe('64px')
    expect(value(nested.element, 'height')).toBe('152px')
    expect(independent.element.style.getPropertyValue('--mdv-app-bar-collapse')).toBe('0px')
    appBarScroll(nested.vm.contentElement!, 44)
    expect(value(nested.element, 'height')).toBe('108px')
    appBarScroll(window, 60)
    expect(independent.element.style.getPropertyValue('--mdv-app-bar-collapse')).toBe('60px')
    expect(value(wrapper.element, 'height')).toBe('64px')
    expect(value(nested.element, 'height')).toBe('108px')
    expect(independent.classes()).not.toContain('mdv-app-bar--scaffold')
  })

  it('reveals hidden actions for keyboard focus and releases and reconnects its layout across KeepAlive', async () => {
    const shown = ref(true)
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { id: 'outside' }, '外部按钮'),
          h(KeepAlive, null, {
            default: () =>
              shown.value
                ? h(MdvAppBarScaffold, null, {
                    appbar: () =>
                      h(
                        MdvAppBar,
                        { ...appbarProps, scrollBehavior: 'enter-always' },
                        {
                          actions: () => h('button', { id: 'action' }, '收藏'),
                        },
                      ),
                    default: () => h('p', '页面正文'),
                  })
                : null,
          }),
        ]),
    })
    const host = mount(Example, { attachTo: document.body })
    await flushPromises()
    const scaffold = host.getComponent(MdvAppBarScaffold)
    const root = scaffold.element
    const body = scaffold.vm.contentElement!
    appBarScroll(body, 200)
    expect(value(root, 'height')).toBe('0px')
    host.get<HTMLButtonElement>('#action').element.focus()
    expect(value(root, 'height')).toBe('152px')
    appBarScroll(body, 400)
    expect(value(root, 'height')).toBe('152px')
    host.get<HTMLButtonElement>('#outside').element.focus()
    await nextTick()
    appBarScroll(body, 600)
    expect(value(root, 'height')).toBe('0px')
    shown.value = false
    await flushPromises()
    appBarScroll(body, 0)
    expect(value(root, 'height')).toBe('')
    shown.value = true
    await flushPromises()
    expect(host.getComponent(MdvAppBarScaffold).element).toBe(root)
    expect(value(root, 'height')).toBe('152px')
    appBarScroll(body, 200)
    expect(value(root, 'height')).toBe('0px')
  })

  it('releases header space when the app bar is removed, while retaining the content nodes', async () => {
    const visible = ref(true)
    const wrapper = mount(MdvAppBarScaffold, {
      slots: {
        appbar: () => (visible.value ? h(MdvAppBar, appbarProps) : null),
        default: () => h('input', { 'aria-label': '草稿' }),
      },
    })
    await nextTick()
    const input = wrapper.get<HTMLInputElement>('input').element
    input.value = '编辑中的草稿'
    appBarScroll(wrapper.vm.contentElement!, 200)
    visible.value = false
    await nextTick()
    expect(value(wrapper.element, 'height')).toBe('')
    expect(value(wrapper.element, 'offset')).toBe('')
    expect(wrapper.get('input').element).toBe(input)
    expect(input.value).toBe('编辑中的草稿')
  })
})
