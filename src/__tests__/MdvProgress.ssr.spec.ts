// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCircularProgress from '../components/MdvCircularProgress.vue'
import MdvLinearProgress from '../components/MdvLinearProgress.vue'

describe.each([
  { name: 'linear', component: MdvLinearProgress },
  { name: 'circular', component: MdvCircularProgress },
])('$name progress SSR', ({ component }) => {
  it.each([
    { variant: 'flat' as const, indeterminate: false, expectedValue: '25' },
    { variant: 'flat' as const, indeterminate: true, expectedValue: undefined },
    { variant: 'wavy' as const, indeterminate: false, expectedValue: '25' },
    { variant: 'wavy' as const, indeterminate: true, expectedValue: undefined },
  ])(
    'renders $variant / indeterminate=$indeterminate without browser globals and with stable markup',
    async ({ variant, indeterminate, expectedValue }) => {
      const render = () =>
        renderToString(
          h(component, {
            value: 25,
            max: 50,
            variant,
            indeterminate,
            label: '正在上传',
            dir: 'rtl',
            id: 'transfer',
          }),
        )
      const html = await render()
      expect(typeof window).toBe('undefined')
      expect(typeof document).toBe('undefined')
      expect(html).toBe(await render())
      expect(html).toContain('role="progressbar"')
      expect(html).toContain('aria-label="正在上传"')
      expect(html).toContain('aria-valuemax="50"')
      expect(html).toContain('dir="rtl"')
      expect(html).toContain('id="transfer"')
      expect(html).toContain(`mdv-progress--${variant}`)
      expect(html).toContain('aria-hidden="true"')
      expect(html).not.toMatch(/NaN|Infinity|tabindex/)
      expect(html.match(/\saria-valuenow="([^"]*)"/)?.[1]).toBe(expectedValue)
    },
  )

  it('normalizes invalid values and retains completion without relying on mounted hooks', async () => {
    const invalid = await renderToString(h(component, { value: NaN, max: -1, thickness: Infinity }))
    expect(invalid).toContain('aria-valuenow="0"')
    expect(invalid).toContain('aria-valuemax="100"')
    expect(invalid).toContain('stroke-width="4"')
    expect(invalid).not.toMatch(/NaN|Infinity/)
    const complete = await renderToString(h(component, { value: 100 }))
    expect(complete).toContain('aria-valuenow="100"')
    expect(complete).toContain('mdv-progress__track')
    expect(complete).not.toContain('hidden="hidden"')
  })
})
