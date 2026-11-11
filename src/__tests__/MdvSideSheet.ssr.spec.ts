// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSideSheet from '../components/MdvSideSheet.vue'
import MdvSideSheetScaffold from '../components/MdvSideSheetScaffold.vue'

describe('Side Sheet SSR', () => {
  it('renders stable dialog names, retained content and logical layout without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(MdvSideSheet, {
            modelValue: true,
            title: '编辑',
            description: '文件设置',
            dir: 'rtl',
            detached: true,
          }),
          h(
            MdvSideSheetScaffold,
            { modelValue: true, title: '详情', placement: 'start' },
            { default: () => h('button', '主内容'), sheet: () => h('input', { value: '草稿' }) },
          ),
        ]),
    })
    const html = await renderToString(createSSRApp(Example))
    expect(html).toBe(await renderToString(createSSRApp(Example)))
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toContain('data-placement="start"')
    expect(html).toContain('dir="rtl"')
    expect(html.match(/role="dialog"/g)).toHaveLength(2)
    expect(html.match(/aria-modal="true"/g)).toHaveLength(1)
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/)
    expect(html).not.toMatch(/NaN|Infinity|teleport/)
    const names = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1])
    expect(new Set(names).size).toBe(2)
    for (const name of names) expect(html).toContain(`id="${name}"`)
  })

  it('omits destroyed panels and hides retained standard content from navigation', async () => {
    const modal = await renderToString(
      h(MdvSideSheet, { destroyOnClose: true }, { default: () => h('input') }),
    )
    const retained = await renderToString(
      h(MdvSideSheetScaffold, { 'aria-label': '保留草稿' }, { sheet: () => h('input') }),
    )
    const destroyed = await renderToString(
      h(MdvSideSheetScaffold, { destroyOnClose: true }, { sheet: () => h('input') }),
    )
    expect(modal).not.toContain('<input')
    expect(retained).toContain('aria-label="保留草稿"')
    expect(retained).toContain('inert')
    expect(retained).toContain('aria-hidden="true"')
    expect(retained).toContain('<input')
    expect(destroyed).not.toContain('<input')
  })
})
