// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvButton from '../components/MdvButton.vue'

describe('MdvButton SSR', () => {
  it('renders a safe default button without browser globals', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')

    const html = await renderToString(h(MdvButton, null, { default: () => '保存' }))

    expect(html).toContain('<button ')
    expect(html).toContain('type="button"')
    expect(html).toContain('保存')
  })

  it('omits inactive loading content even when a loading label is supplied', async () => {
    const html = await renderToString(
      h(MdvButton, { loading: false, loadingText: '正在保存全部更改…' }, { default: () => '保存' }),
    )

    expect(html).toContain('保存')
    expect(html).not.toContain('正在保存全部更改…')
    expect(html).not.toContain('mdv-button__spinner')
    expect(html).not.toContain('aria-busy=')
  })

  it.each(['success', '#06C'] as const)(
    'renders deterministic local color=%s without DOM access or a native color attribute',
    async (color) => {
      const render = () => renderToString(h(MdvButton, { color }, { default: () => '保存' }))
      const html = await render()

      expect(html).toBe(await render())
      expect(html).toContain('--mdv-button-color:')
      expect(html).not.toMatch(/\scolor=/)
      expect(typeof window).toBe('undefined')
      expect(typeof document).toBe('undefined')
    },
  )

  it('renders loading links with their name and busy state', async () => {
    const html = await renderToString(
      h(
        MdvButton,
        { href: '/report', loading: true, loadingText: '正在下载报告…' },
        { default: () => '下载报告' },
      ),
    )

    expect(html).toContain('<a ')
    expect(html).toContain('href="/report"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('下载报告')
    expect(html).toContain('正在下载报告…')
    expect(html).not.toContain('disabled=')
    expect(html).not.toContain('loadingtext=')
  })

  it('keeps the original slotted label out of layout while using a custom loading label', async () => {
    const html = await renderToString(
      h(MdvButton, { loading: true, loadingText: '保存中…' }, { default: () => '保存' }),
    )

    expect(html).toContain('保存中…')
    expect(html).toMatch(/style="display:none;"[^>]*>[\s\S]*?保存/)
    expect(html).toContain('aria-busy="true"')
  })

  it('renders disabled links without an activatable href', async () => {
    const html = await renderToString(
      h(MdvButton, { href: '/report', disabled: true }, { default: () => '下载报告' }),
    )

    expect(html).toContain('<a ')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('role="link"')
    expect(html).toContain('tabindex="-1"')
    expect(html).not.toContain('href=')
  })
})
