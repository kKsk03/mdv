import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTabs from '../components/MdvTabs.vue'
import MdvTab from '../components/MdvTab.vue'
import MdvTabPanel from '../components/MdvTabPanel.vue'
import type { MdvTabValue } from '../components/tabs.types'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})
async function settle() {
  await nextTick()
  await nextTick()
  await nextTick()
}

describe('MdvTabs hydration', () => {
  it('preserves tab and panel nodes, a native draft and focus before accepting the next selection', async () => {
    const value = ref<MdvTabValue>('b')
    const changed = vi.fn<(value: MdvTabValue) => void>()
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvTabs,
          {
            modelValue: value.value,
            'aria-label': '分类',
            tabNavigation: 'active',
            onChange: changed,
            'onUpdate:modelValue': (next: MdvTabValue) => {
              value.value = next
            },
          },
          {
            default: () => [
              h(MdvTab, { value: 'a', label: '概览' }),
              h(MdvTab, { value: 'b', label: '草稿' }),
            ],
            panels: () => [
              h(MdvTabPanel, { value: 'a' }, () => '概览'),
              h(MdvTabPanel, { value: 'b' }, () => h('input', { 'aria-label': '临时草稿' })),
            ],
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
    const panels = [...container.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
    const input = container.querySelector<HTMLInputElement>('input')!
    input.value = '水合之前的草稿'
    input.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect([...container.querySelectorAll('[role="tab"]')]).toEqual(tabs)
      expect([...container.querySelectorAll('[role="tabpanel"]')]).toEqual(panels)
      expect(document.activeElement).toBe(input)
      expect(input.value).toBe('水合之前的草稿')
      expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0])
      tabs[0]!.click()
      await settle()
      expect(value.value).toBe('a')
      expect(changed).toHaveBeenCalledExactlyOnceWith('a')
      expect(document.activeElement).toBe(tabs[0])
      tabs[1]!.click()
      await settle()
      expect(container.querySelector('input')).toBe(input)
      expect(input.value).toBe('水合之前的草稿')
      expect(panels[1]!.hasAttribute('inert')).toBe(false)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('hydrates the first available uncontrolled selection and lazy shells without initial model events', async () => {
    const update = vi.fn<(value: MdvTabValue) => void>()
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvTabs,
          { 'onUpdate:modelValue': update },
          {
            default: () => [
              h(MdvTab, { value: 'a', label: '第一项' }),
              h(MdvTab, { value: 'b', label: '第二项' }),
            ],
            panels: () => [
              h(MdvTabPanel, { value: 'a', lazy: true }, () => '第一面板'),
              h(MdvTabPanel, { value: 'b', lazy: true }, () => h('input')),
            ],
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const ids = [...container.querySelectorAll<HTMLElement>('[id]')].map((element) => element.id)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect(
        [...container.querySelectorAll<HTMLElement>('[id]')].map((element) => element.id),
      ).toEqual(ids)
      expect(container.querySelector('input')).toBeNull()
      expect(update).not.toHaveBeenCalled()
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1]!.click()
      await settle()
      expect(update).toHaveBeenCalledExactlyOnceWith('b')
      expect(container.querySelector('input')).not.toBeNull()
      expect(warning).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
