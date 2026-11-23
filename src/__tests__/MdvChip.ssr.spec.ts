// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvChip from '../components/MdvChip.vue'
import MdvChipSet from '../components/MdvChipSet.vue'

describe('MdvChip SSR', () => {
  it('renders deterministic selection, names, local colors and offline icons without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvChipSet,
          { label: '内容类型', selection: 'multiple', modelValue: ['image'] },
          {
            default: () => [
              h(MdvChip, { variant: 'filter', label: '文章', value: 'article' }),
              h(MdvChip, { variant: 'filter', label: '图片', value: 'image', color: '#006c4c' }),
              h(MdvChip, { variant: 'input', label: '林同学', removeLabel: '删除林同学' }),
              h(MdvChip, {
                variant: 'suggestion',
                label: '查看指南',
                href: '/guide',
                target: '_blank',
              }),
            ],
          },
        ),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('role="toolbar"')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-label="删除林同学"')
    expect(html).toContain('light-dark(')
    expect(html).toContain('href="/guide"')
    expect(html).toContain('<svg ')
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
  })

  it('renders one focus target for remove-only content and no action-based selected state', async () => {
    const html = await renderToString(
      h(MdvChip, {
        variant: 'input',
        label: '标签',
        removeOnly: true,
        removeLabel: '移除标签',
      }),
    )
    expect(html.match(/<button\b/g)).toHaveLength(1)
    expect(html).toContain('aria-label="移除标签"')
    expect(html).not.toContain('aria-pressed=')
  })
})
