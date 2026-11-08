// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSwitch from '../components/MdvSwitch.vue'

describe('MdvSwitch SSR', () => {
  it('renders deterministic switch semantics, labels and local seed colors without browser globals', async () => {
    const Example = defineComponent({
      setup() {
        const enabled = ref(true)
        return () =>
          h('div', [
            h(MdvSwitch, {
              modelValue: enabled.value,
              label: '接收通知',
              supportingText: '接收重要提醒',
              color: '#006c4c',
              name: 'notifications',
              value: 'yes',
            }),
            h(MdvSwitch, { modelValue: false, label: '禁用', disabled: true }),
          ])
      },
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('role="switch"')
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('class="mdv-switch__icon"')
    expect(html).toContain('<svg')
    expect(html).toContain('light-dark(')
    expect(html).toContain('name="notifications"')
    expect(html).toContain('value="yes"')
    expect(html).toContain('接收重要提醒')
  })
})
