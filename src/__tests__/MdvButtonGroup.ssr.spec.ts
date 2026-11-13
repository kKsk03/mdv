// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvButtonGroup from '../components/MdvButtonGroup.vue'
import MdvButtonGroupItem from '../components/MdvButtonGroupItem.vue'

describe('Button Group SSR', () => {
  it('renders deterministic Connected selection, form fields and icon names without browser globals', async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              MdvButtonGroup,
              {
                variant: 'connected',
                size: 'xs',
                shape: 'square',
                modelValue: [0, 'two'],
                selection: 'multiple',
                name: 'choice',
                form: 'editor',
                dir: 'rtl',
                'aria-label': '工具',
              },
              {
                default: () => [
                  h(MdvButtonGroupItem, { value: 0 }, { default: () => '数字零' }),
                  h(
                    MdvButtonGroupItem,
                    { value: 'two', iconOnly: true, 'aria-label': '编辑', loading: true },
                    { default: () => h('svg') },
                  ),
                  h(
                    MdvButtonGroupItem,
                    { value: 'three', disabled: true },
                    { default: () => '禁用' },
                  ),
                ],
              },
            ),
        }),
      )
    const html = await render()
    expect(await render()).toBe(html)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2)
    expect(html).toContain('role="group"')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('aria-label="编辑"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('name="choice" value="0" form="editor"')
    expect(html).toContain('name="choice" value="two" form="editor"')
    expect(html).not.toMatch(
      /NaN|Infinity|tabindex|autofocus|data-mdv-group-first|--mdv-group-motion-width/,
    )
  })

  it('keeps ordinary links separate from toggles and renders selected slot content once', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MdvButtonGroup,
            {},
            {
              default: () => [
                h(
                  MdvButtonGroupItem,
                  { href: '/help', target: '_blank', rel: 'noopener' },
                  { default: () => '帮助' },
                ),
                h(
                  MdvButtonGroupItem,
                  { selected: true, iconOnly: true, 'aria-label': '麦克风' },
                  {
                    default: () => h('svg', { 'data-name': 'off' }),
                    selected: () => h('svg', { 'data-name': 'on' }),
                  },
                ),
              ],
            },
          ),
      }),
    )
    expect(html).toContain('href="/help"')
    expect(html).toContain('target="_blank"')
    expect(html.match(/aria-pressed=/g)).toHaveLength(1)
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('data-name="on"')
    expect(html).not.toContain('data-name="off"')
    expect(html).not.toContain('name="choice"')
  })
})
