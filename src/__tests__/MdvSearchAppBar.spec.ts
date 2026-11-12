import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MdvSearchAppBar from '../components/MdvSearchAppBar.vue'
import MdvAppBar from '../components/MdvAppBar.vue'
import MdvAppBarScaffold from '../components/MdvAppBarScaffold.vue'
import { appBarScroll, mockAppBarPlatform } from './app-bar-test-platform'
import { mockDialogPlatform } from './dialog-test-platform'

const hosts = new Set<{ unmount(): void }>()
let barPlatform: ReturnType<typeof mockAppBarPlatform>
let dialogPlatform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  dialogPlatform = mockDialogPlatform()
  barPlatform = mockAppBarPlatform()
  barPlatform.content(56, 56)
  barPlatform.sides(48, 48)
})
afterEach(async () => {
  for (const host of hosts) host.unmount()
  hosts.clear()
  await flushPromises()
  barPlatform.restore()
  dialogPlatform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('MdvSearchAppBar', () => {
  it('shares AppBar measurement and the Scaffold scroll target without adding a heading around the input', async () => {
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(MdvAppBarScaffold, null, {
            appbar: () =>
              h(
                MdvSearchAppBar,
                { scrollBehavior: 'enter-always' },
                {
                  leading: () => h('button', '导航'),
                  actions: () => h('button', '账号'),
                  default: () => h('p', '结果'),
                },
              ),
            default: () => h('p', '正文'),
          }),
      }),
      { attachTo: document.body },
    )
    hosts.add(host)
    await flushPromises()
    const appbar = host.get<HTMLElement>('.mdv-app-bar').element
    const scaffold = host.getComponent(MdvAppBarScaffold)
    expect(appbar.style.getPropertyValue('--mdv-app-bar-row-height')).toBe('64px')
    expect(appbar.style.getPropertyValue('--mdv-app-bar-start')).toBe('60px')
    expect(host.find('h1').exists()).toBe(false)
    const input = host.get<HTMLInputElement>('.mdv-search-view__entry input').element
    expect(appbar.contains(input)).toBe(true)
    appBarScroll(scaffold.vm.contentElement!, 32)
    expect(
      Number(appbar.style.getPropertyValue('--mdv-app-bar-auto-color-progress')),
    ).toBeGreaterThan(0)
    appBarScroll(scaffold.vm.contentElement!, 120)
    expect(appbar.style.getPropertyValue('--mdv-app-bar-hide')).toBe('64px')
    appBarScroll(scaffold.vm.contentElement!, 0)
    expect(appbar.style.getPropertyValue('--mdv-app-bar-hide')).toBe('0px')
  })

  it('forwards query and lifecycle events and isolates nested result app bars', async () => {
    const wrapper = mount(MdvSearchAppBar, {
      props: { layout: 'fullscreen' },
      slots: { default: () => h(MdvAppBar, { title: '结果工具' }) },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    await wrapper.vm.open()
    await flushPromises()
    await wrapper.get('dialog input').setValue('旅行')
    await wrapper.get('dialog input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['旅行']])
    expect(wrapper.emitted('search')?.[0]?.[0]).toBe('旅行')
    expect(wrapper.get('dialog h1').text()).toBe('结果工具')
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.emitted('closed')).toEqual([[{ reason: 'escape' }]])
  })
})
