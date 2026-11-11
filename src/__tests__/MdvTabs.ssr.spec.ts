// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTabs from '../components/MdvTabs.vue'
import MdvTab from '../components/MdvTab.vue'
import MdvTabPanel from '../components/MdvTabPanel.vue'

describe('MdvTabs SSR', () => {
  it('renders deterministic selection, names and panel relationships without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(
            MdvTabs,
            { modelValue: 'b', tabNavigation: 'active', 'aria-label': '服务端分类' },
            {
              default: () => [
                h(MdvTab, { value: 'a', label: '概览' }),
                h(MdvTab, { value: 'b', label: '详情' }),
              ],
              panels: () => [
                h(MdvTabPanel, { value: 'a' }, () => '概览正文'),
                h(MdvTabPanel, { value: 'b' }, () => '详情正文'),
              ],
            },
          ),
          h(
            MdvTabs,
            { variant: 'secondary' },
            {
              default: () => [
                h(MdvTab, { value: 'disabled', disabled: true, label: '不可用' }),
                h(MdvTab, { value: 1, label: '第一项' }),
              ],
              panels: () => [
                h(MdvTabPanel, { value: 'disabled' }),
                h(MdvTabPanel, { value: 1 }, () => '默认正文'),
              ],
            },
          ),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('aria-label="服务端分类"')
    expect(html.match(/aria-selected="true"/g)).toHaveLength(2)
    expect(html.match(/role="tabpanel"/g)).toHaveLength(4)
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]!)
    expect(new Set(ids).size).toBe(ids.length)
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]!)
    expect(controls.every((id) => ids.includes(id))).toBe(true)
    expect(html).not.toMatch(/NaN|Infinity|translateX/)
  })

  it('retains panel shells for lazy content, including number and string values', async () => {
    const html = await renderToString(
      createSSRApp(
        defineComponent({
          setup: () => () =>
            h(
              MdvTabs,
              { modelValue: 1, swipeable: true },
              {
                default: () => [
                  h(MdvTab, { value: 1, label: '数字一' }),
                  h(MdvTab, { value: '1', label: '文字一' }),
                ],
                panels: () => [
                  h(MdvTabPanel, { value: 1, lazy: true }, () => '当前内容'),
                  h(MdvTabPanel, { value: '1', lazy: true }, () => '尚未挂载'),
                ],
              },
            ),
        }),
      ),
    )
    expect(html).toContain('当前内容')
    expect(html).not.toContain('尚未挂载')
    expect(html.match(/role="tabpanel"/g)).toHaveLength(2)
    expect(html).toContain('panel-n-1')
    expect(html).toContain('panel-s-1')
    expect(html).not.toContain('inert="false"')
  })
})
