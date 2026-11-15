// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvLoadingIndicator from '../components/MdvLoadingIndicator.vue'

describe('Loading Indicator SSR', () => {
  it.each([false, true])('contained=%s 不访问浏览器环境并输出确定的非空图形', async (contained) => {
    const render = () =>
      renderToString(
        h(MdvLoadingIndicator, {
          contained,
          label: '正在加载文章',
          id: 'article-loading',
          size: 96,
        }),
      )
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('role="progressbar"')
    expect(html).toContain('aria-label="正在加载文章"')
    expect(html).toContain('id="article-loading"')
    expect(html).toContain('width="76"')
    expect(html).toMatch(/d="M[^"]+Z"/)
    expect(html).not.toMatch(/NaN|Infinity|aria-valuenow|tabindex/)
  })

  it('服务端即正确处理装饰语义及无效尺寸', async () => {
    const html = await renderToString(
      h(MdvLoadingIndicator, {
        decorative: true,
        size: Infinity,
        role: 'status',
        'aria-label': '重复的名称',
        'aria-valuenow': 42,
      }),
    )
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('width="38"')
    expect(html).not.toMatch(/role=|aria-label=|aria-valuenow=|Infinity/)
  })
})
