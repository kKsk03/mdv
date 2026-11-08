// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvIconButton from '../components/MdvIconButton.vue'

describe('MdvIconButton SSR', () => {
  it('renders an ordinary named button without browser globals or a pressed state', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    const html = await renderToString(
      h(MdvIconButton, { 'aria-label': '收藏' }, { default: () => h('svg') }),
    )

    expect(html).toContain('<button ')
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-label="收藏"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('aria-pressed=')
    expect(html).not.toContain('href=')
  })

  it.each(['success', '#06C'] as const)(
    'renders deterministic color=%s and a controlled selected icon without DOM access',
    async (color) => {
      const render = () =>
        renderToString(
          h(
            MdvIconButton,
            { color, selected: true, 'aria-label': '收藏' },
            {
              default: () => h('svg', { 'data-icon': 'outline' }),
              selected: () => h('svg', { 'data-icon': 'filled' }),
            },
          ),
        )
      const html = await render()

      expect(html).toBe(await render())
      expect(html).toContain('--mdv-icon-button-color:')
      expect(html).toContain('aria-pressed="true"')
      expect(html).toContain('data-icon="filled"')
      expect(html).not.toContain('data-icon="outline"')
      expect(html).not.toMatch(/\scolor=/)
      expect(typeof window).toBe('undefined')
      expect(typeof document).toBe('undefined')
    },
  )

  it('preserves loading link navigation and its externally supplied name', async () => {
    const html = await renderToString(
      h(MdvIconButton, { href: '/report', loading: true, 'aria-labelledby': 'report-label' }),
    )

    expect(html).toContain('<a ')
    expect(html).toContain('href="/report"')
    expect(html).toContain('aria-labelledby="report-label"')
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain('aria-pressed=')
    expect(html).not.toContain('disabled=')
  })

  it('renders disabled links without href and disabled toggles with their controlled value', async () => {
    const link = await renderToString(
      h(MdvIconButton, { href: '/report', disabled: true, 'aria-label': '下载报告' }),
    )
    const toggle = await renderToString(
      h(MdvIconButton, { selected: false, disabled: true, 'aria-label': '收藏' }),
    )

    expect(link).toContain('role="link"')
    expect(link).toContain('aria-disabled="true"')
    expect(link).toContain('tabindex="-1"')
    expect(link).not.toContain('href=')
    expect(toggle).toContain('<button ')
    expect(toggle).toContain(' disabled')
    expect(toggle).toContain('aria-pressed="false"')
  })
})
