import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvFabMenu from '../components/MdvFabMenu.vue'
import MdvFabMenuItem from '../components/MdvFabMenuItem.vue'
import { mockMenuPlatform } from './menu-test-platform'

const nativeMutationObserver = window.MutationObserver
let platform: ReturnType<typeof mockMenuPlatform>
beforeEach(() => {
  platform = mockMenuPlatform()
  vi.stubGlobal('MutationObserver', nativeMutationObserver)
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
describe('FAB Menu hydration', () => {
  it.each(['expressive', 'baseline'] as const)(
    'retains %s nodes, input drafts and focus, then opens and closes',
    async (variant) => {
      const Example = defineComponent({
        setup: () => () =>
          h('main', [
            h('input', { id: 'draft' }),
            h(MdvFabMenu, { label: '新建', variant }, () => [
              h(MdvFabMenuItem, { label: '文档' }),
              h(MdvFabMenuItem, { label: '图片' }),
            ]),
          ]),
      })
      const container = document.createElement('div')
      container.innerHTML = await renderToString(createSSRApp(Example))
      document.body.append(container)
      const input = container.querySelector<HTMLInputElement>('input')!
      const trigger = container.querySelector<HTMLButtonElement>('.mdv-fab-menu__trigger')!
      const controls = trigger.getAttribute('aria-controls')
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
        expect(container.querySelector('.mdv-fab-menu__trigger')).toBe(trigger)
        expect(trigger.getAttribute('aria-controls')).toBe(controls)
        trigger.focus()
        trigger.click()
        await flushPromises()
        expect(platform.opened.size).toBe(1)
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        document.activeElement!.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        )
        await flushPromises()
        expect(document.activeElement).toBe(trigger)
        expect(platform.opened.size).toBe(0)
        expect(warn).not.toHaveBeenCalled()
        expect(error).not.toHaveBeenCalled()
      } finally {
        app.unmount()
      }
    },
  )
})
