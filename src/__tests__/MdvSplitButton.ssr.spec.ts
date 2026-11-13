// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSplitButton from '../components/MdvSplitButton.vue'

describe('MdvSplitButton SSR', () => {
  it('renders deterministic independent native controls without browser globals', async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              MdvSplitButton,
              {
                menuButtonLabel: '更多保存选项',
                actionAttrs: { name: 'intent', value: 'save' },
                menuButtonAttrs: { 'aria-controls': 'options', 'aria-haspopup': 'menu' },
              },
              () => '保存',
            ),
        }),
      )
    const html = await render()
    expect(html).toBe(await render())
    expect(html.match(/<button\b/g)).toHaveLength(2)
    expect(html).toContain('role="group"')
    expect(html).toContain('name="intent" value="save"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-label="更多保存选项"')
    expect(html).not.toMatch(/NaN|Infinity|tabindex|mdv-button__ripple/)
  })

  it('serializes expanded RTL, an accessible icon action and only the main loading state', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MdvSplitButton,
            {
              dir: 'rtl',
              expanded: true,
              iconOnly: true,
              loading: true,
              size: 'xl',
              actionAttrs: { 'aria-label': '保存' },
              menuButtonLabel: '更多保存选项',
              menuDisabled: true,
            },
            () => h('svg'),
          ),
      }),
    )
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('mdv-split-button--expanded')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-label="保存"')
    expect(html.match(/aria-busy="true"/g)).toHaveLength(1)
    expect(html.match(/ disabled/g)).toHaveLength(1)
    expect(html).toContain('--mdv-split-menu-width:136px')
  })
})
