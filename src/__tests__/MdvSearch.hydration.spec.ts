import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSearchView from '../components/MdvSearchView.vue'
import MdvSearchBar from '../components/MdvSearchBar.vue'
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

describe('Search hydration', () => {
  it('retains ids, the entry input and pre-hydration edits without stealing external focus', async () => {
    const Example = defineComponent({
      setup() {
        const query = ref('服务端')
        return () =>
          h('main', [
            h('button', { id: 'outside' }, '外部'),
            h(
              MdvSearchView,
              {
                modelValue: query.value,
                'onUpdate:modelValue': (value: string) => {
                  query.value = value
                },
                layout: 'fullscreen',
              },
              { default: () => h('button', { 'data-mdv-search-result': '' }, '结果') },
            ),
          ])
      },
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const entry = host.querySelector<HTMLInputElement>('.mdv-search-view__entry input')!
    const dialog = host.querySelector<HTMLDialogElement>('dialog')!
    const id = entry.id
    const outside = host.querySelector<HTMLButtonElement>('#outside')!
    outside.focus()
    entry.value = '用户草稿'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('.mdv-search-view__entry input')).toBe(entry)
      expect(entry.id).toBe(id)
      expect(entry.value).toBe('用户草稿')
      expect(document.activeElement).toBe(outside)
      expect(dialog.open).toBe(false)
      entry.focus()
      await flushPromises()
      expect(host.querySelector('dialog')).toBe(dialog)
      expect(host.querySelector<HTMLInputElement>('dialog input')!.value).toBe('用户草稿')
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
      await flushPromises()
      expect(document.activeElement).toBe(entry)
      expect(dialog.open).toBe(false)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      host.remove()
    }
  })

  it('hydrates initially open results with the original nodes and releases the modal on unmount', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvSearchView,
          { open: true, modelValue: '旅行', layout: 'fullscreen' },
          { default: () => h('p', { id: 'result' }, '服务端结果') },
        ),
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector<HTMLInputElement>('dialog input')!
    const result = host.querySelector('#result')!
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('dialog input')).toBe(input)
      expect(host.querySelector('#result')).toBe(result)
      expect(document.activeElement).toBe(input)
      expect(host.querySelector<HTMLDialogElement>('dialog')!.open).toBe(true)
      expect(document.documentElement.style.overflow).toBe('hidden')
    } finally {
      app.unmount()
      host.remove()
    }
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('preserves a standalone uncontrolled input typed before hydration', async () => {
    const Example = defineComponent({ setup: () => () => h(MdvSearchBar, { name: 'q' }) })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector('input')!
    input.value = '预输入'
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await nextTick()
      expect(input.value).toBe('预输入')
      expect(host.querySelector('input')).toBe(input)
    } finally {
      app.unmount()
      host.remove()
    }
  })
})
