// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { MdvAppBar } from '../index'
import type { MdvAppBarVariant } from '../index'

describe('MdvAppBar SSR', () => {
  it.each<MdvAppBarVariant>(['small', 'medium', 'large'])(
    'renders %s deterministically without browser globals',
    async (variant) => {
      const render = () =>
        renderToString(
          h(
            MdvAppBar,
            {
              variant,
              appearance: 'bordered',
              title: '服务端标题',
              subtitle: '服务端副标题',
              headingLevel: 2,
              scrollBehavior: 'exit-until-collapsed',
              scrollTarget: '#content',
              dir: 'rtl',
            },
            {
              leading: () => h('button', { 'aria-label': '菜单' }, '菜单'),
              actions: () => h('button', { 'aria-label': '搜索' }, '搜索'),
            },
          ),
        )
      const html = await render()
      expect(typeof window).toBe('undefined')
      expect(typeof document).toBe('undefined')
      expect(html).toContain('<header')
      expect(html).toContain('dir="rtl"')
      expect(html).toContain('mdv-app-bar--bordered')
      expect(html).toContain('<h2')
      expect(html.match(/<h2/g)).toHaveLength(1)
      expect(html).toContain('服务端标题')
      expect(html).toContain('服务端副标题')
      expect(html).not.toMatch(/NaN|Infinity|tabindex|measure-/)
      expect(html).toBe(await render())
    },
  )
})
