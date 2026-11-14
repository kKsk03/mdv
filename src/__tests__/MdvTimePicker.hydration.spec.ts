import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTimePicker from '../components/MdvTimePicker.vue'
import type { MdvTimeValue } from '../components/time-picker.types'
import { mockDialogPlatform } from './dialog-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
describe('Time Picker hydration', () => {
  it('保留输入节点、稳定 ID、挂载前编辑及外部焦点，Enter 后才提交', async () => {
    const update = vi.fn<(value: MdvTimeValue) => void>()
    const Example = defineComponent({
      setup() {
        const time = ref<MdvTimeValue>('09:00')
        return () =>
          h('form', [
            h('button', { id: 'outside', type: 'button' }, '外部'),
            h(MdvTimePicker, {
              modelValue: time.value,
              'onUpdate:modelValue': (value: MdvTimeValue) => {
                update(value)
                time.value = value
              },
              name: 'time',
            }),
          ])
      },
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector<HTMLInputElement>('[data-time-entry]')!
    const id = input.id
    input.value = '14:25'
    const outside = host.querySelector<HTMLButtonElement>('#outside')!
    outside.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('[data-time-entry]')).toBe(input)
      expect(input.id).toBe(id)
      expect(input.value).toBe('14:25')
      expect(document.activeElement).toBe(outside)
      expect(update).not.toHaveBeenCalled()
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      )
      await flushPromises()
      expect(update).toHaveBeenCalledWith('14:25')
      expect(new FormData(host.querySelector('form')!).get('time')).toBe('14:25')
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      host.remove()
    }
  })
  it('挂载后才处理初始打开请求，卸载释放模态及窗口监听', async () => {
    const platform = mockDialogPlatform()
    platform.media('(prefers-reduced-motion: reduce)', true)
    const Example = defineComponent({
      render: () => h(MdvTimePicker, { modelValue: '09:00', open: true }),
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector('[data-time-entry]')!
    const dialog = host.querySelector<HTMLDialogElement>('dialog')!
    const app = createSSRApp(Example)
    try {
      expect(dialog.open).toBe(false)
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('[data-time-entry]')).toBe(input)
      expect(host.querySelector('dialog')).toBe(dialog)
      expect(dialog.open).toBe(true)
      expect(document.documentElement.style.overflow).toBe('hidden')
    } finally {
      app.unmount()
      host.remove()
    }
    try {
      expect(document.documentElement.style.overflow).toBe('')
      const calls = platform.showModal.mock.calls.length
      window.dispatchEvent(new Event('resize'))
      await flushPromises()
      expect(platform.showModal).toHaveBeenCalledTimes(calls)
    } finally {
      platform.restore()
    }
  })
})
