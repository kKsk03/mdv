// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvMenu from '../components/MdvMenu.vue'
import MdvContextMenu from '../components/MdvContextMenu.vue'
import MdvMenuGroup from '../components/MdvMenuGroup.vue'
import MdvMenuItem from '../components/MdvMenuItem.vue'
import type { MdvMenuTriggerSlotProps } from '../components/menu.types'

describe('MdvMenu SSR', () => {
  it('renders a deterministic closed tree without browser globals or teleport', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('section', { 'data-mdv-theme': 'dark' }, [
          h(
            MdvMenu,
            { modelValue: true },
            {
              trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
                h('button', triggerProps, '格式'),
              default: () => [
                h(
                  MdvMenuItem,
                  { label: '字体' },
                  { children: () => [h(MdvMenuItem, { label: 'Roboto' })] },
                ),
              ],
            },
          ),
          h(
            MdvContextMenu,
            {},
            {
              trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
                h('div', { ...triggerProps, tabindex: 0 }, '右键区域'),
              default: () => [h(MdvMenuItem, { label: '复制' })],
            },
          ),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html.match(/popover="manual"/g)).toHaveLength(3)
    expect(html.match(/display:none/g)).toHaveLength(3)
    expect(html).not.toMatch(/teleport|NaN|Infinity/)
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1])
    expect(new Set(controls).size).toBe(3)
    for (const id of controls) expect(html).toContain(`id="${id}"`)
  })

  it('keeps typed selection semantics, explicit naming and disabled link behavior', async () => {
    const html = await renderToString(
      h(
        MdvMenu,
        { 'aria-label': '字号', variant: 'baseline', colorScheme: 'vibrant', layout: 'grouped' },
        {
          default: () => [
            h(MdvMenuGroup, { modelValue: 14, selectionMode: 'single', label: '选择字号' }, () => [
              h(MdvMenuItem, { label: '数字 14', value: 14 }),
              h(MdvMenuItem, { label: '字符串 14', value: '14' }),
              h(MdvMenuItem, { label: '禁用链接', href: '/disabled', disabled: true }),
            ]),
          ],
        },
      ),
    )
    expect(html).toContain('aria-label="字号"')
    expect(html).toContain('mdv-menu--baseline mdv-menu--standard')
    expect(html).not.toContain('mdv-menu--grouped')
    expect(html.match(/role="menuitemradio"/g)).toHaveLength(2)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1)
    expect(html.match(/aria-checked="false"/g)).toHaveLength(1)
    expect(html).toContain('aria-disabled="true"')
    expect(html).not.toContain('href="/disabled"')
  })
})
