// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import favorite from '@iconify-icons/material-symbols/favorite'
import favoriteOutline from '@iconify-icons/material-symbols/favorite-outline'
import MdvIcon from '../components/MdvIcon.vue'

afterEach(() => vi.unstubAllGlobals())

describe('MdvIcon SSR', () => {
  it.each([
    { name: 'filled', icon: favorite },
    { name: 'outline', icon: favoriteOutline },
  ])(
    'renders $name Symbols synchronously and deterministically without browser globals',
    async ({ icon }) => {
      const fetchIcon = vi.fn<typeof fetch>()
      vi.stubGlobal('fetch', fetchIcon)
      const render = () => renderToString(h(MdvIcon, { icon }))
      const html = await render()

      expect(typeof window).toBe('undefined')
      expect(typeof document).toBe('undefined')
      expect(html).toContain('<svg ')
      expect(html).toContain(icon.body)
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('focusable="false"')
      expect(html).toBe(await render())
      expect(fetchIcon).not.toHaveBeenCalled()
    },
  )

  it('renders accessible names and CSS overrides on the server', async () => {
    const html = await renderToString(
      h(MdvIcon, {
        icon: favorite,
        size: 32,
        color: 'var(--mdv-sys-color-primary)',
        'aria-labelledby': 'favorite-label',
        style: 'width: 40px',
      }),
    )

    expect(html).toContain('role="img"')
    expect(html).toContain('aria-labelledby="favorite-label"')
    expect(html).not.toContain('aria-hidden=')
    expect(html).toContain('width:40px')
    expect(html).toContain('height:32px')
    expect(html).toContain('color:var(--mdv-sys-color-primary)')
  })
})
