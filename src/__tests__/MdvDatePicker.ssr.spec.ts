// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvDatePicker from '../components/MdvDatePicker.vue'
import MdvDateRangePicker from '../components/MdvDateRangePicker.vue'

describe('Date Picker SSR', () => {
  it('初始 open 请求输出确定关闭态，原生日期字段仍使用纯日期', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MdvDatePicker, {
            modelValue: '0001-03-04',
            open: true,
            layout: 'auto',
            locale: 'en-GB',
            name: 'birthday',
          }),
      }),
    )
    expect(html).toContain('value="04/03/0001"')
    expect(html).toContain('name="birthday"')
    expect(html).toContain('value="0001-03-04"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('data-active="true"')
    expect(html).not.toContain('role="grid"')
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/)
  })
  it('范围字段各自有名称与模型字段，不产生逐日或全部年份的 SSR 输出', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MdvDateRangePicker, {
            modelValue: { start: '2026-11-14', end: '2026-12-20' },
            startLabel: '入住',
            endLabel: '离店',
            startName: 'start',
            endName: 'end',
            min: '0001-01-01',
            max: '9999-12-31',
          }),
      }),
    )
    expect(html).toContain('入住')
    expect(html).toContain('离店')
    expect(html).toContain('name="start"')
    expect(html).toContain('name="end"')
    expect(html).not.toContain('role="grid"')
    expect(html.length).toBeLessThan(15000)
  })
})
