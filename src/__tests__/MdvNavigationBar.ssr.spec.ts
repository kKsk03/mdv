// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { MdvNavigationBar, MdvNavigationBarItem } from '../index'

describe('MdvNavigationBar SSR', () => {
  it('renders stable link semantics and caller-owned current state without browser globals', async () => {
    const render = () =>
      renderToString(
        h(
          MdvNavigationBar,
          { orientation: 'auto', 'aria-label': '主要目的地', dir: 'rtl' },
          {
            default: () => [
              h(
                MdvNavigationBarItem,
                { label: '首页', href: '/home', active: true },
                { icon: () => h('svg', { 'data-icon': 'home' }) },
              ),
              h(
                MdvNavigationBarItem,
                { label: '探索', href: '/explore' },
                { icon: () => h('svg', { 'data-icon': 'explore' }) },
              ),
            ],
          },
        ),
      )
    const html = await render()

    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toContain('<nav')
    expect(html).toContain('aria-label="主要目的地"')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('href="/home"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('首页')
    expect(html).toBe(await render())
  })
})
