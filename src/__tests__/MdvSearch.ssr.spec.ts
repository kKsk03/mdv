// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { MdvSearchAppBar, MdvSearchBar, MdvSearchView } from '../index'
import type { MdvSearchVariant } from '../index'

describe('Search SSR', () => {
  it.each<MdvSearchVariant>(['contained', 'divided'])(
    'renders %s deterministically without browser globals',
    async (variant) => {
      const render = () =>
        renderToString(
          h(
            MdvSearchView,
            { modelValue: '草稿', variant, layout: 'auto', dir: 'rtl', statusText: '3 条结果' },
            { default: () => h('p', '建议') },
          ),
        )
      const html = await render()
      expect(typeof window).toBe('undefined')
      expect(html).toBe(await render())
      expect(html).toContain('dir="rtl"')
      expect(html).toContain('value="草稿"')
      expect(html).toContain(`mdv-search-dialog--${variant}`)
      expect(html).toContain('aria-haspopup="dialog"')
      expect(html).toContain('aria-live="polite"')
      expect(html).not.toMatch(/NaN|Infinity|<dialog[^>]*\sopen(?:=|\s|>)/)
    },
  )
  it('renders the app bar without a heading around the interactive input', async () => {
    const html = await renderToString(
      h(MdvSearchAppBar, { placeholder: '搜索邮件' }, { leading: () => h('button', '菜单') }),
    )
    expect(html).toContain('<header')
    expect(html).toContain('mdv-app-bar--search')
    expect(html).not.toMatch(/<h[1-6][\s>]/)
    expect(html).toContain('搜索邮件')
  })
  it('renders a named standalone search input as a successful form control', async () => {
    const html = await renderToString(
      h(MdvSearchBar, { name: 'q', modelValue: '中文', required: true }),
    )
    expect(html).toContain('name="q"')
    expect(html).toContain('type="search"')
    expect(html).toContain('value="中文"')
    expect(html).toContain('required')
  })
})
