// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvBottomSheet from '../components/MdvBottomSheet.vue'
import MdvBottomSheetScaffold from '../components/MdvBottomSheetScaffold.vue'

describe('Bottom Sheet SSR', () => {
  it('renders deterministic modal and standard semantics without reading browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(MdvBottomSheet, { modelValue: true, title: '分享', description: '选择分享方式' }),
          h(
            MdvBottomSheetScaffold,
            { title: '地点', dir: 'rtl', style: 'height: 500px' },
            {
              default: () => h('button', '背景'),
              sheet: () => h('input', { value: '草稿' }),
            },
          ),
        ]),
    })
    const html = await renderToString(createSSRApp(Example))
    expect(html).toBe(await renderToString(createSSRApp(Example)))
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('role="region"')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/)
    expect(html).not.toMatch(/NaN|Infinity|teleport/)
    const names = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1])
    expect(names).toHaveLength(2)
    expect(new Set(names).size).toBe(2)
    for (const name of names) expect(html).toContain(`id="${name}"`)
  })

  it('omits destroyed modal content and keeps a hidden standard panel inert', async () => {
    const modal = await renderToString(
      h(
        MdvBottomSheet,
        { destroyOnClose: true, 'aria-label': '延后分享' },
        { default: () => h('input') },
      ),
    )
    const standard = await renderToString(
      h(MdvBottomSheetScaffold, { modelValue: 'hidden' }, { sheet: () => h('input') }),
    )
    expect(modal).toContain('aria-label="延后分享"')
    expect(modal).not.toContain('<input')
    expect(modal).not.toContain('mdv-bottom-sheet__panel')
    expect(standard).toContain('role="region"')
    expect(standard).toContain('aria-hidden="true"')
    expect(standard).toMatch(/<section[^>]*\sinert(?:=|\s|>)/)
    expect(standard).toContain('<input')
  })
})
