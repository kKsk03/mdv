// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvFab from '../components/MdvFab.vue'
import MdvExtendedFab from '../components/MdvExtendedFab.vue'
import MdvToolbar from '../components/MdvToolbar.vue'

describe('FAB SSR', () => {
  it('renders icon and label actions deterministically without browser globals', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h('main', [
            h(
              MdvFab,
              { size: 'small', color: 'surface', 'aria-label': '添加' },
              { default: () => h('svg') },
            ),
            h(
              MdvExtendedFab,
              { expanded: false, dir: 'rtl' },
              { leading: () => h('svg'), default: () => '新建笔记' },
            ),
          ]),
      }),
    )
    expect(html).toContain('mdv-fab--small')
    expect(html).toContain('mdv-fab--surface')
    expect(html).toContain('aria-label="添加"')
    expect(html).toContain('mdv-extended-fab--collapsed')
    expect(html).toContain('新建笔记')
    expect(html).toContain('dir="rtl"')
    expect(html).not.toMatch(
      /NaN|Infinity|autofocus|aria-expanded|aria-hidden="true"[^>]*mdv-extended-fab__label/,
    )
  })
  it('renders paired FAB context and stable disclosure targets for an initially collapsed toolbar', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MdvToolbar,
            { variant: 'floating', expanded: false },
            {
              default: () => h('button', '撤销'),
              fab: () => h(MdvFab, { 'aria-label': '新建' }, { default: () => h('svg') }),
            },
          ),
      }),
    )
    expect(html).toContain('mdv-toolbar--with-fab')
    expect(html).toContain('mdv-fab--toolbar')
    expect(html).toContain('mdv-fab--secondary-container')
    expect(html).toMatch(/id="mdv-toolbar-[^"]+-body"[^>]*inert[^>]*aria-hidden="true"/)
    expect(html).toMatch(/aria-controls="mdv-toolbar-[^"]+-body"/)
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toMatch(/NaN|Infinity|autofocus/)
  })
})
