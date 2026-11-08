// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCheckbox from '../components/MdvCheckbox.vue'

describe('MdvCheckbox SSR', () => {
  it('renders deterministic labels, mixed state and local seed colors without browser globals', async () => {
    const Example = defineComponent({
      render: () =>
        h('div', [
          h(MdvCheckbox, {
            modelValue: true,
            label: '选中',
            color: '#006c4c',
            name: 'enabled',
            value: 'yes',
          }),
          h(MdvCheckbox, {
            modelValue: false,
            indeterminate: true,
            label: '部分选中',
            supportingText: '选择全部',
          }),
          h(MdvCheckbox, {
            modelValue: [1],
            value: 1,
            name: 'choice',
            disabled: true,
            'aria-label': '禁用选项',
          }),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('aria-checked="mixed"')
    expect(html).toContain('mdv-checkbox--selected')
    expect(html).toContain('light-dark(')
    expect(html).toContain('name="enabled"')
    expect(html).toContain('value="yes"')
    expect(html).toContain('选择全部')
  })
})
