// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvFabMenu from '../components/MdvFabMenu.vue'
import MdvFabMenuItem from '../components/MdvFabMenuItem.vue'

describe('FAB Menu SSR', () => {
  it('renders both modes deterministically with stable ids and retained closed nodes without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(MdvFabMenu, { modelValue: true, label: '新建内容', size: 'medium' }, () => [
            h(MdvFabMenuItem, { label: '文档' }),
            h(MdvFabMenuItem, { label: '图片' }),
          ]),
          h(MdvFabMenu, { label: '其他操作', variant: 'baseline' }, () =>
            h(MdvFabMenuItem, { label: '链接', href: '/new' }),
          ),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('hidden')
    expect(html).toContain('role="group"')
    expect(html).toContain('role="menu"')
    expect(html).toContain('mdv-fab-menu--medium')
    const ids = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1])
    expect(new Set(ids).size).toBe(2)
    for (const id of ids) expect(html).toContain(`id="${id}"`)
    expect(html).not.toMatch(/teleport|NaN|Infinity/)
  })
  it('keeps native link attributes and disabled semantics without introducing menu roles in Expressive', async () => {
    const html = await renderToString(
      h(MdvFabMenu, { label: '操作', color: 'tertiary', elevated: false }, () => [
        h(MdvFabMenuItem, { label: '官方', href: '/official', target: '_blank' }),
        h(MdvFabMenuItem, { label: '禁用', href: '/disabled', disabled: true }),
      ]),
    )
    expect(html).toContain('href="/official"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('aria-disabled="true"')
    expect(html).not.toContain('href="/disabled"')
    expect(html).not.toContain('role="menuitem"')
    expect(html).not.toContain('mdv-fab-menu--elevated')
  })
})
