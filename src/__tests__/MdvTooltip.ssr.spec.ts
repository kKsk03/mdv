// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTooltip from '../components/MdvTooltip.vue'
import MdvRichTooltip from '../components/MdvRichTooltip.vue'
import type { MdvTooltipTriggerSlotProps } from '../components/tooltip.types'

describe('Tooltip SSR', () => {
  it('renders both variants deterministically as closed original-DOM panels without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('section', { 'data-mdv-theme': 'dark' }, [
          h(
            MdvTooltip,
            { text: '刷新内容', modelValue: true },
            {
              trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
                h('button', { ...triggerProps, 'aria-label': '刷新' }, '刷新'),
            },
          ),
          h(
            MdvRichTooltip,
            { title: '云端备份', text: '随时继续工作', persistent: true, modelValue: true },
            {
              trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
                h('button', triggerProps, '了解备份'),
              actions: () => [h('button', '启用'), h('button', '稍后')],
            },
          ),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html.match(/popover="manual"/g)).toHaveLength(2)
    expect(html.match(/display:none/g)).toHaveLength(2)
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2)
    expect(html).toContain('role="tooltip"')
    expect(html).toContain('role="dialog" aria-modal="false"')
    expect(html).toContain('云端备份')
    expect(html).toContain('启用')
    expect(html).not.toMatch(/teleport|NaN|Infinity/)
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
    expect(ids.length).toBeGreaterThanOrEqual(4)
    expect(new Set(ids).size).toBe(ids.length)
    const labelled = html.match(/aria-labelledby="([^"]+)"/)
    expect(html).toContain(`id="${labelled?.[1]}"`)
  })

  it('preserves rich explicit naming and description and prefers the body slot over text', async () => {
    const html = await renderToString(
      h(
        MdvRichTooltip,
        {
          text: '不应重复显示',
          'aria-label': '同步帮助',
          'aria-describedby': 'external-help',
          dir: 'rtl',
        },
        () => [h('p', '插槽说明'), h('a', { href: '/guide' }, '文档')],
      ),
    )
    expect(html).toContain('aria-label="同步帮助"')
    expect(html).toContain('aria-describedby="external-help"')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('插槽说明')
    expect(html).toContain('href="/guide"')
    expect(html).not.toContain('不应重复显示')
    expect(html).not.toContain('aria-labelledby=')
  })
})
