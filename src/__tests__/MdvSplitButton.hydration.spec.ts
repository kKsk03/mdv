import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSplitButton from '../components/MdvSplitButton.vue'
import MdvMenu from '../components/MdvMenu.vue'
import MdvMenuItem from '../components/MdvMenuItem.vue'
import type { MdvMenuTriggerSlotProps } from '../components/menu.types'
import { mockMenuPlatform } from './menu-test-platform'

let platform: ReturnType<typeof mockMenuPlatform>
beforeEach(() => {
  platform = mockMenuPlatform()
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Split Button hydration', () => {
  it('retains native nodes, Menu ids, the user draft and external focus, then returns Escape to the tail', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('input', { id: 'draft' }),
          h(
            MdvMenu,
            {},
            {
              trigger: ({ triggerProps, open }: MdvMenuTriggerSlotProps) =>
                h(
                  MdvSplitButton,
                  {
                    expanded: open,
                    menuButtonAttrs: triggerProps,
                    menuButtonLabel: '更多保存选项',
                  },
                  () => h('strong', '保存'),
                ),
              default: () => h(MdvMenuItem, { label: '另存为' }),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector<HTMLInputElement>('#draft')!
    const action = container.querySelector<HTMLButtonElement>('.mdv-split-button__action')!
    const menu = container.querySelector<HTMLButtonElement>('.mdv-split-button__menu')!
    const panel = container.querySelector<HTMLElement>('[data-mdv-menu-panel]')!
    const item = container.querySelector<HTMLElement>('[data-mdv-menu-item]')!
    const id = panel.id
    input.value = '用户草稿'
    input.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(container.querySelector('input')).toBe(input)
      expect(input.value).toBe('用户草稿')
      expect(document.activeElement).toBe(input)
      expect(container.querySelector('.mdv-split-button__action')).toBe(action)
      expect(container.querySelector('.mdv-split-button__menu')).toBe(menu)
      expect(panel.id).toBe(id)
      expect(menu.getAttribute('aria-controls')).toBe(id)
      menu.focus()
      menu.click()
      await flushPromises()
      expect(platform.opened.has(panel)).toBe(true)
      expect(document.activeElement).toBe(item)
      expect(menu.getAttribute('aria-expanded')).toBe('true')
      item.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
      await flushPromises()
      expect(platform.opened.size).toBe(0)
      expect(document.activeElement).toBe(menu)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
