// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTextField from '../components/MdvTextField.vue'

describe('MdvTextField SSR', () => {
  it('renders deterministic ids, values and local action icons without browser globals', async () => {
    const Example = defineComponent({
      render: () =>
        h('div', [
          h(MdvTextField, {
            label: '密码',
            type: 'password',
            modelValue: 'secret',
            passwordToggle: true,
            clearable: true,
          }),
          h(MdvTextField, {
            label: '备注',
            multiline: true,
            modelValue: '第一行\n第二行',
            supportingText: '可选',
          }),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('value="secret"')
    expect(html).toContain('第一行\n第二行</textarea>')
    expect(html).toContain('type="password"')
    expect(html).toContain('aria-label="显示密码"')
    expect(html).toContain('aria-label="清除输入"')
    expect(html).toContain('<svg ')
  })
})
