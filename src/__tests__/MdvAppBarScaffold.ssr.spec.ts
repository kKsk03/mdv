// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { MdvAppBar, MdvAppBarScaffold } from '../index'
import type { MdvAppBarVariant } from '../index'

describe('MdvAppBarScaffold SSR', () => {
  it.each<MdvAppBarVariant>(['small', 'medium', 'large'])(
    'renders a deterministic %s header outside its content region without browser globals',
    async (variant) => {
      const render = () =>
        renderToString(
          h(
            MdvAppBarScaffold,
            {
              dir: 'rtl',
              contentAttrs: { 'aria-label': '收藏正文', id: 'body' },
            },
            {
              appbar: () =>
                h(MdvAppBar, { variant, title: '收藏', scrollBehavior: 'exit-until-collapsed' }),
              default: () => h('main', '页面正文'),
            },
          ),
        )
      const html = await render()
      expect(html).toBe(await render())
      expect(html).toContain('mdv-app-bar--scaffold')
      expect(html).toContain(`mdv-app-bar--${variant}`)
      expect(html).toContain('aria-label="收藏正文"')
      expect(html).toContain('dir="rtl"')
      expect(html).toContain('tabindex="0"')
      expect(html).toContain('<main>页面正文</main>')
      expect(html.indexOf('</header>')).toBeLessThan(html.indexOf('id="body"'))
      expect(html).not.toMatch(/NaN|Infinity|--mdv-app-bar-scaffold-height/)
    },
  )
})
