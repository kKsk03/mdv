import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSnackbar from '../components/MdvSnackbar.vue'
import { mockMenuPlatform } from './menu-test-platform'

let platform: ReturnType<typeof mockMenuPlatform>

beforeEach(() => {
  platform = mockMenuPlatform()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queueMicrotask(() => callback(performance.now()))
    return 1
  })
})

afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('MdvSnackbar hydration', () => {
  it('activates an initially open server-rendered message and starts its timer', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const visible = ref(true)
    const opened = vi.fn<() => void>()
    const Example = defineComponent({
      setup: () => () =>
        h('div', { 'data-mdv-theme': 'dark' }, [
          h(MdvSnackbar, {
            modelValue: visible.value,
            message: '首屏通知',
            color: '#06C',
            onOpened: opened,
            'onUpdate:modelValue': (value: boolean) => {
              visible.value = value
            },
          }),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const panel = container.querySelector<HTMLElement>('.mdv-snackbar-positioner')!
    const surface = panel.style.getPropertyValue('--mdv-snackbar-surface')
    expect(surface).toContain('light-dark(')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      await flushPromises()
      expect(container.querySelector('.mdv-snackbar-positioner')).toBe(panel)
      expect(panel.style.getPropertyValue('--mdv-snackbar-surface')).toBe(surface)
      expect(panel.closest('[data-mdv-theme]')?.getAttribute('data-mdv-theme')).toBe('dark')
      expect(platform.opened.has(panel)).toBe(true)
      expect(opened).toHaveBeenCalledOnce()
      expect(document.activeElement).toBe(document.body)
      await vi.advanceTimersByTimeAsync(3999)
      expect(visible.value).toBe(true)
      await vi.advanceTimersByTimeAsync(1)
      await nextTick()
      expect(visible.value).toBe(false)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
    expect(platform.opened.size).toBe(0)
  })
})
