import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, onMounted, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvAppBar from '../components/MdvAppBar.vue'
import { appBarScroll, mockAppBarPlatform } from './app-bar-test-platform'

beforeEach(() => {
  mockAppBarPlatform()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('MdvAppBar hydration', () => {
  it('retains one title, slot nodes, edited content and external focus before and after scrolling', async () => {
    const title = ref('服务端标题')
    const mounted = vi.fn<() => void>()
    const Draft = defineComponent({
      setup() {
        onMounted(mounted)
        return () => h('input', { value: '服务端草稿', 'aria-label': '草稿' })
      },
    })
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { id: 'outside' }, '外部按钮'),
          h('div', { id: 'scroll-region' }, [
            h(
              MdvAppBar,
              {
                variant: 'large',
                title: title.value,
                headingLevel: 2,
                scrollBehavior: 'exit-until-collapsed',
                scrollTarget: '#scroll-region',
              },
              { actions: () => h(Draft) },
            ),
            h('p', '页面正文'),
          ]),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const heading = container.querySelector('h2')!
    const input = container.querySelector('input')!
    const outside = container.querySelector<HTMLButtonElement>('#outside')!
    const region = container.querySelector<HTMLElement>('#scroll-region')!
    outside.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(container.querySelector('h2')).toBe(heading)
      expect(container.querySelector('input')).toBe(input)
      expect(document.activeElement).toBe(outside)
      input.value = '用户保留的草稿'
      appBarScroll(region, 200)
      await flushPromises()
      title.value = '更新后的标题'
      await flushPromises()
      expect(container.querySelectorAll('h2')).toHaveLength(1)
      expect(container.querySelector('h2')).toBe(heading)
      expect(heading.textContent).toBe('更新后的标题')
      expect(input.value).toBe('用户保留的草稿')
      expect(mounted).toHaveBeenCalledOnce()
      expect(document.activeElement).toBe(outside)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
