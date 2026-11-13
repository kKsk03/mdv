// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvToolbar from '../components/MdvToolbar.vue'

describe('MdvToolbar SSR', () => {
  it('renders Docked without reading browser globals or taking keyboard focus', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MdvToolbar,
            { 'aria-label': '编辑' },
            { default: () => h('button', { type: 'button' }, '保存') },
          ),
      }),
    )
    expect(html).toContain('role="toolbar"')
    expect(html).toContain('aria-label="编辑"')
    expect(html).toContain('mdv-toolbar--docked')
    expect(html).not.toContain('mdv-toolbar--elevated')
    expect(html).not.toMatch(/NaN|Infinity|autofocus/)
  })

  it('renders retained collapsed groups with stable disclosure relations', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MdvToolbar,
            { variant: 'floating', orientation: 'vertical', color: 'vibrant', expanded: false },
            {
              leading: () => h('button', '撤销'),
              default: () => h('button', '保存'),
              trailing: () => h('button', '重做'),
            },
          ),
      }),
    )
    expect(html).toContain('aria-orientation="vertical"')
    expect(html).toContain('mdv-toolbar--elevated')
    expect(html).toContain('mdv-toolbar--vibrant')
    expect(html).toContain('aria-expanded="false"')
    const groups = html.match(/<div[^>]*class="mdv-toolbar__region[^>]*>/g) ?? []
    expect(groups).toHaveLength(2)
    expect(groups.map((tag) => tag.includes(' inert'))).toEqual([true, true])
    expect(groups.map((tag) => tag.includes('aria-hidden="true"'))).toEqual([true, true])
    expect(html).toMatch(/aria-controls="mdv-toolbar-[^"]+-leading mdv-toolbar-[^"]+-trailing"/)
    expect(html).toContain('撤销')
    expect(html).toContain('重做')
  })
})
