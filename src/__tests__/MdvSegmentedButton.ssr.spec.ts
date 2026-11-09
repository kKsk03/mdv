// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSegmentedButton from '../components/MdvSegmentedButton.vue'
import MdvSegmentedButtonItem from '../components/MdvSegmentedButtonItem.vue'

describe('MdvSegmentedButton SSR', () => {
  it('renders stable IDs, native fields, offline checks and the first enabled tab stop', async () => {
    const Example = defineComponent({
      render: () =>
        h(
          MdvSegmentedButton,
          {
            modelValue: 'c',
            name: 'view',
            form: 'settings',
            'aria-label': '视图',
          },
          {
            default: () => [
              h(MdvSegmentedButtonItem, { value: 'a', label: '不可用', disabled: true }),
              h(MdvSegmentedButtonItem, { value: 'b', label: '第一可用' }),
              h(MdvSegmentedButtonItem, { value: 'c', label: '已选中' }),
            ],
          },
        ),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('role="radiogroup"')
    expect(html).toContain('name="view"')
    expect(html).toContain('form="settings"')
    expect(html).toContain('<svg ')
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    const inputs = html.match(/<input\b[^>]*>/g)!
    expect(inputs).toHaveLength(3)
    expect(inputs[0]).toContain('disabled')
    expect(inputs[1]).toContain('tabindex="0"')
    expect(inputs[2]).toContain('aria-checked="true"')
    expect(inputs[2]).toContain('tabindex="-1"')
  })

  it('renders multiple selection with checkbox semantics and no generated form names', async () => {
    const html = await renderToString(
      h(
        MdvSegmentedButton,
        { selection: 'multiple', modelValue: [1, '1'], showSelectedIcon: false },
        {
          default: () => [
            h(MdvSegmentedButtonItem, { value: 1, label: '数字一' }),
            h(MdvSegmentedButtonItem, { value: '1', label: '字符串一' }),
          ],
        },
      ),
    )
    expect(html).toContain('role="group"')
    expect(html.match(/type="checkbox"/g)).toHaveLength(2)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(2)
    expect(html).not.toContain('name=')
    expect(html).not.toContain('<svg ')
  })
})
