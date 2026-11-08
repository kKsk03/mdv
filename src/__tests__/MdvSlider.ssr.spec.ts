// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSlider from '../components/MdvSlider.vue'

describe('MdvSlider SSR', () => {
  it('renders deterministic native ranges, local seed colors and accessible names without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('div', [
          h(MdvSlider, {
            label: '价格',
            variant: 'range',
            modelValue: [20, 80],
            name: 'price',
            supportingText: '选择区间',
            color: '#006c4c',
          }),
          h(MdvSlider, {
            label: '曝光',
            variant: 'centered',
            min: -100,
            modelValue: -20,
            orientation: 'vertical',
          }),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
    expect(html).toBe(await render())
    expect(html.match(/type="range"/g)).toHaveLength(3)
    expect(html).toContain('aria-orientation="vertical"')
    expect(html).toContain('name="price"')
    expect(html).toContain('value="20"')
    expect(html).toContain('value="80"')
    expect(html).toContain('选择区间')
    expect(html).toContain('light-dark(')
    expect(html).not.toContain('NaN')
  })
})
