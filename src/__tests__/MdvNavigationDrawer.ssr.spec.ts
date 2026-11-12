// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvNavigationDrawer from '../components/MdvNavigationDrawer.vue'
import MdvModalNavigationDrawer from '../components/MdvModalNavigationDrawer.vue'
import MdvNavigationDrawerItem from '../components/MdvNavigationDrawerItem.vue'
import MdvNavigationDrawerGroup from '../components/MdvNavigationDrawerGroup.vue'

describe('Navigation Drawer SSR', () => {
  it('renders stable navigation, nested lists and disclosure relationships without browser globals', async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              MdvNavigationDrawer,
              { title: '邮箱', dir: 'rtl', width: '280px' },
              {
                default: () => [
                  h(MdvNavigationDrawerItem, {
                    label: '收件箱',
                    href: '/inbox',
                    active: true,
                    badge: '999+',
                  }),
                  h(
                    MdvNavigationDrawerGroup,
                    { label: '文件夹', collapsible: true, expanded: false },
                    { default: () => h(MdvNavigationDrawerItem, { label: '归档' }) },
                  ),
                ],
              },
            ),
        }),
      )
    const html = await render()
    expect(await render()).toBe(html)
    expect(html).toContain('<nav')
    expect(html.match(/<ul/g)).toHaveLength(2)
    expect(html).toContain('href="/inbox"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/aria-controls="mdv-drawer-group-[^"]+"/)
    expect(html).toContain('inert')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('dir="rtl"')
    expect(html).not.toMatch(/NaN|Infinity|role="(?:menu|tree|tablist)"/)
  })

  it('retains closed standard nodes and can omit them when destruction is requested', async () => {
    const render = (destroyOnClose: boolean) =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              MdvNavigationDrawer,
              { modelValue: false, destroyOnClose },
              { default: () => h(MdvNavigationDrawerItem, { label: '首页' }) },
            ),
        }),
      )
    const retained = await render(false)
    const destroyed = await render(true)
    expect(retained).toContain('data-state="closed"')
    expect(retained).toContain('hidden')
    expect(retained).toContain('data-mdv-drawer-control')
    expect(destroyed).not.toContain('data-mdv-drawer-control')
  })

  it('keeps the modal closed on the server even when requested open and retains its stable label', async () => {
    const render = (destroyOnClose: boolean, modelValue: boolean) =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              MdvModalNavigationDrawer,
              { title: '邮箱', destroyOnClose, modelValue },
              { default: () => h(MdvNavigationDrawerItem, { label: '收件箱' }) },
            ),
        }),
      )
    const requested = await render(false, true)
    const destroyed = await render(true, false)
    expect(requested).toContain('aria-modal="true"')
    expect(requested).toMatch(/aria-labelledby="mdv-dialog-[^"]+-title"/)
    expect(requested).toContain('data-state="closed"')
    expect(requested).toContain('data-mdv-drawer-control')
    expect(requested).not.toMatch(/<dialog[^>]*\sopen(?:\s|=|>)/)
    expect(destroyed).not.toContain('data-mdv-drawer-control')
  })
})
