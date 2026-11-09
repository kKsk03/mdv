// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvBadge from '../components/MdvBadge.vue'

describe('MdvBadge SSR', () => {
  it('renders the default small badge deterministically without browser globals', async () => {
    const render = () =>
      renderToString(h(MdvBadge, { id: 'notifications' }, { default: () => h('button', '通知') }))
    const html = await render()

    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toContain('class="mdv-badge"')
    expect(html).toContain('mdv-badge__indicator--small')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('id="notifications"')
    expect(html).toBe(await render())
  })

  it('renders a labelled large badge and omits empty content', async () => {
    const labelled = await renderToString(
      h(MdvBadge, {
        variant: 'large',
        content: '99+',
        'aria-label': '99 条未读消息',
        dir: 'rtl',
      }),
    )
    const empty = await renderToString(h(MdvBadge, { variant: 'large' }))

    expect(labelled).toContain('mdv-badge__indicator--large')
    expect(labelled).toContain('role="img"')
    expect(labelled).toContain('aria-label="99 条未读消息"')
    expect(labelled).toContain('dir="rtl"')
    expect(labelled).toContain('99+')
    expect(empty).not.toContain('mdv-badge__indicator')
  })
})
