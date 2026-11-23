// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvNavigationRail from '../components/MdvNavigationRail.vue'
import MdvModalNavigationRail from '../components/MdvModalNavigationRail.vue'
import MdvNavigationRailItem from '../components/MdvNavigationRailItem.vue'
import type { MdvNavigationRailSlotProps } from '../components/navigation-rail.types'

describe('Navigation Rail SSR', () => {
  it('renders native navigation and stable scoped controls without browser globals', async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              MdvNavigationRail,
              { expanded: true, id: 'rail', dir: 'rtl' },
              {
                menu: ({ menuAttrs }: MdvNavigationRailSlotProps) => h('button', menuAttrs, '菜单'),
                default: () =>
                  h(MdvNavigationRailItem, { label: '阅读清单', href: '/saved', active: true }),
              },
            ),
        }),
      )
    const html = await render()
    expect(await render()).toBe(html)
    expect(html).toContain('<nav')
    expect(html).toContain('aria-controls="rail"')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('href="/saved"')
    expect(html).toContain('dir="rtl"')
    expect(html).not.toMatch(/NaN|Infinity|role="(?:tablist|menu)"/)
  })

  it('keeps a modal closed on the server and distinguishes retained and destroyed content', async () => {
    const retained = await renderToString(
      createSSRApp({
        render: () =>
          h(MdvModalNavigationRail, null, {
            default: () => h(MdvNavigationRailItem, { label: '首页' }),
          }),
      }),
    )
    const destroyed = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MdvModalNavigationRail,
            { hideOnCollapse: true, destroyOnClose: true },
            {
              default: () => h(MdvNavigationRailItem, { label: '首页' }),
            },
          ),
      }),
    )
    expect(retained).toContain('aria-modal="true"')
    expect(retained).not.toContain('aria-label="主导航"')
    expect(retained).toContain('data-state="closed"')
    expect(retained).not.toMatch(/<dialog[^>]*\sopen(?:\s|=|>)/)
    expect(retained.match(/data-mdv-rail-item/g)).toHaveLength(2)
    expect(destroyed).not.toContain('data-mdv-rail-item')
  })
})
