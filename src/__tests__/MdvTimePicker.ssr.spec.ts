// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTimePicker from '../components/MdvTimePicker.vue'

describe('Time Picker SSR', () => {
  it('初始打开请求保持确定关闭态，表单只输出纯时间', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MdvTimePicker, {
            modelValue: '13:05',
            name: 'time',
            open: true,
            hourCycle: 'h12',
            locale: 'en-US',
          }),
      }),
    )
    expect(html).toContain('name="time"')
    expect(html).toContain('value="13:05"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('data-time-part')
    expect(html).not.toContain('role="slider"')
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/)
  })
  it('时区不会改变午夜、正午或序列化值', async () => {
    for (const value of ['00:00', '12:00', '23:59']) {
      const html = await renderToString(
        createSSRApp({
          render: () =>
            h(MdvTimePicker, {
              modelValue: value,
              name: 'time',
              hourCycle: 'h23',
              locale: 'en-GB',
            }),
        }),
      )
      expect(html).toContain(`value="${value}"`)
      expect(html).not.toContain('1970')
    }
  })
})
