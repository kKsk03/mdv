// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvDivider from '../components/MdvDivider.vue'

describe('MdvDivider SSR', () => {
  it('renders decorative markup deterministically without browser globals', async () => {
    const render = () => renderToString(h(MdvDivider))
    const html = await render()

    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('role=')
    expect(html).not.toContain('aria-orientation=')
    expect(html).not.toContain('tabindex=')
    expect(html).toBe(await render())
  })

  it('renders a named vertical separator with native layout overrides', async () => {
    const html = await renderToString(
      h(MdvDivider, {
        orientation: 'vertical',
        variant: 'middle-inset',
        decorative: false,
        id: 'section-divider',
        dir: 'rtl',
        'aria-labelledby': 'section-heading',
        style: { height: '48px', width: '2px' },
      }),
    )

    expect(html).toContain('role="separator"')
    expect(html).toContain('aria-orientation="vertical"')
    expect(html).toContain('aria-labelledby="section-heading"')
    expect(html).toContain('id="section-divider"')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('height:48px')
    expect(html).toContain('width:2px')
    expect(html).not.toContain('aria-hidden=')
    expect(html).not.toContain('tabindex=')
  })
})
