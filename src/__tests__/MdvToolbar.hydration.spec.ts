import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvToolbar from '../components/MdvToolbar.vue'
import { toolbarReducedMotion } from './toolbar-test-platform'

beforeEach(toolbarReducedMotion)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('MdvToolbar hydration', () => {
  it('preserves external focus, disclosure ids, slotted nodes and an edited retained draft', async () => {
    const expanded = ref(false)
    const Draft = defineComponent({
      setup: () => () => h('input', { id: 'draft', value: '服务端草稿' }),
    })
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { id: 'outside' }, '正文'),
          h(
            MdvToolbar,
            {
              variant: 'floating',
              expanded: expanded.value,
              'onUpdate:expanded': (value: boolean) => {
                expanded.value = value
              },
            },
            {
              leading: () => h(Draft),
              default: () => h('button', { id: 'save' }, '保存'),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const outside = container.querySelector<HTMLButtonElement>('#outside')!
    const input = container.querySelector<HTMLInputElement>('#draft')!
    const disclosure = container.querySelector<HTMLButtonElement>('[aria-controls]')!
    const controls = disclosure.getAttribute('aria-controls')
    outside.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(outside)
      expect(container.querySelector('#draft')).toBe(input)
      expect(disclosure.getAttribute('aria-controls')).toBe(controls)
      expanded.value = true
      await flushPromises()
      input.value = '保留编辑'
      input.focus()
      expanded.value = false
      await flushPromises()
      expect(document.activeElement).toBe(container.querySelector('#save'))
      expect(container.querySelector('#draft')).toBe(input)
      expect(input.value).toBe('保留编辑')
      disclosure.click()
      await flushPromises()
      expect(disclosure.getAttribute('aria-expanded')).toBe('true')
      expect(disclosure.getAttribute('aria-controls')).toBe(controls)
      expect(input.value).toBe('保留编辑')
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
