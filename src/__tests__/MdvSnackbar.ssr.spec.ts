// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSnackbar from '../components/MdvSnackbar.vue'
import MdvSnackbarProvider from '../components/MdvSnackbarProvider.vue'
import { useSnackbar } from '../components/use-snackbar'

describe('MdvSnackbar SSR', () => {
  it.each([
    { color: 'success', surface: 'var(--mdv-sys-color-success)' },
    { color: '#06C', surface: 'light-dark(' },
  ] as const)(
    'renders $color locally and deterministically without browser globals',
    async ({ color, surface }) => {
      const render = () =>
        renderToString(createSSRApp({ render: () => h(MdvSnackbar, { modelValue: true, color }) }))
      const html = await render()
      expect(html).toBe(await render())
      expect(html).toContain(`--mdv-snackbar-surface:${surface}`)
      expect(html).toContain('--mdv-snackbar-foreground:')
      expect(html).toContain('--mdv-snackbar-action:')
      expect(html).not.toMatch(/\scolor=/)
      expect(typeof window).toBe('undefined')
      expect(typeof document).toBe('undefined')
    },
  )

  it('renders an initially open message deterministically without browser globals', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(MdvSnackbar, {
          modelValue: true,
          message: '更改已保存',
          closeLabel: '关闭通知',
          action: { label: '撤销' },
          dir: 'rtl',
        }),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('popover="manual"')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('更改已保存')
    expect(html).toContain('撤销')
    expect(html).toContain('aria-label="关闭通知"')
    expect(html).not.toMatch(/teleport|NaN|Infinity/)
  })

  it('keeps provider queues scoped to each render', async () => {
    const Consumer = defineComponent({
      setup() {
        const snackbar = useSnackbar()
        const id = snackbar.show({ message: '服务端消息', duration: 0 })
        return () => h('span', id)
      },
    })
    const Example = defineComponent({
      setup: () => () => h(MdvSnackbarProvider, null, { default: () => h(Consumer) }),
    })
    const render = () => renderToString(createSSRApp(Example))
    const first = await render()
    const second = await render()
    expect(first).toBe(second)
    expect(first).toContain('mdv-snackbar-1')
  })
})
