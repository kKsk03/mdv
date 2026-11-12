import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvAppBar from '../components/MdvAppBar.vue'
import MdvAppBarScaffold from '../components/MdvAppBarScaffold.vue'
import { appBarScroll, mockAppBarPlatform } from './app-bar-test-platform'

beforeEach(() => {
  mockAppBarPlatform()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('MdvAppBarScaffold hydration', () => {
  it('retains the header and body nodes and external focus, then preserves an edited draft through collapse and title changes', async () => {
    const title = ref('服务端标题')
    const Draft = defineComponent({
      setup: () => () => h('input', { value: '服务端草稿', 'aria-label': '草稿' }),
    })
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { id: 'outside' }, '外部按钮'),
          h(
            MdvAppBarScaffold,
            { contentAttrs: { id: 'body', 'aria-label': '收藏正文' } },
            {
              appbar: () =>
                h(
                  MdvAppBar,
                  {
                    variant: 'large',
                    title: title.value,
                    scrollBehavior: 'exit-until-collapsed',
                  },
                  { actions: () => h('button', '收藏') },
                ),
              default: () => h(Draft),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const header = container.querySelector('header')!
    const body = container.querySelector<HTMLElement>('#body')!
    const input = container.querySelector('input')!
    const outside = container.querySelector<HTMLButtonElement>('#outside')!
    outside.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(container.querySelector('header')).toBe(header)
      expect(container.querySelector('#body')).toBe(body)
      expect(container.querySelector('input')).toBe(input)
      expect(document.activeElement).toBe(outside)
      input.value = '编辑中的草稿'
      appBarScroll(body, 200)
      title.value = '更新后的标题'
      await flushPromises()
      expect(container.querySelector('header')).toBe(header)
      expect(header.querySelector('h1')?.textContent).toBe('更新后的标题')
      expect(container.querySelector('input')).toBe(input)
      expect(input.value).toBe('编辑中的草稿')
      expect(body.contains(header)).toBe(false)
      expect(document.activeElement).toBe(outside)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
