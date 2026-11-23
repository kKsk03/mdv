// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCarousel from '../components/MdvCarousel.vue'

describe('Carousel SSR', () => {
  it('不访问浏览器测量，稳定输出条目、名称和 key 定位', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MdvCarousel, {
            items: [
              { key: 'first', label: '第一张', src: 'one.svg' },
              { key: 'second', label: '第二张', href: '/second' },
            ],
            modelValue: 'second',
            'aria-label': '相册',
            labels: {
              item: (index: number, count: number) => `第 ${index + 1} 项，共 ${count} 项`,
            },
          }),
      }),
    )
    expect(html).toContain('data-current-key="second"')
    expect(html).toContain('aria-label="相册"')
    expect(html).toContain('href="/second"')
    expect(html).toContain('aria-label="第 2 项，共 2 项"')
    expect(html).not.toContain('translate3d')
    expect(html).not.toContain('mdv-carousel--ready')
    expect(html).not.toMatch(/<section[^>]*tabindex/)
  })
})
