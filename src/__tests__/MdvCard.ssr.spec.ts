// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCard from '../components/MdvCard.vue'

describe('MdvCard SSR', () => {
  it('renders deterministic names and valid content structure without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(
            MdvCard,
            { title: '普通容器', variant: 'filled' },
            { actions: () => h('button', { type: 'button' }, '收藏') },
          ),
          h(
            MdvCard,
            { title: '周末旅行', clickable: true, variant: 'elevated' },
            { default: () => h('section', [h('h3', '住宿'), h('p', '湖畔小屋')]) },
          ),
          h(MdvCard, { title: '查看指南', href: '/guide', target: '_blank' }),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('href="/guide"')
    expect(html).toContain('target="_blank"')
    const labels = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1])
    expect(labels).toHaveLength(2)
    expect(new Set(labels).size).toBe(2)
    for (const id of labels) expect(html).toContain(`id="${id}"`)
    expect(html).not.toMatch(/<button[^>]*>[^<]*<(?:div|section|h3)\b/)
    expect(html).toContain('<h3>住宿</h3>')
  })

  it('omits navigation for a disabled link while preserving its name and role', async () => {
    const html = await renderToString(
      h(MdvCard, { href: '/guide', disabled: true, title: '指南', dragged: true }),
    )
    expect(html).not.toContain('href=')
    expect(html).toContain('role="link"')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('tabindex="-1"')
    expect(html).not.toContain('draggable=')
    expect(html).not.toContain('mdv-card__ripple')
  })
})
