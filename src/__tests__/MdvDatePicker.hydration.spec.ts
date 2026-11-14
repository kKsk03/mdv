import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvDatePicker from '../components/MdvDatePicker.vue'
import type { MdvDateValue } from '../components/date-picker.types'
import { mockMenuPlatform } from './menu-test-platform'

let platform: ReturnType<typeof mockMenuPlatform>
beforeEach(() => {
  platform = mockMenuPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
describe('Date Picker hydration', () => {
  it('保留输入节点、稳定 ID、预 hydration 编辑和外部焦点，显式确认后才提交', async () => {
    const update = vi.fn<(value: MdvDateValue) => void>()
    const Example = defineComponent({
      setup() {
        const date = ref<MdvDateValue>('2026-11-14')
        return () =>
          h('main', [
            h('button', { id: 'outside' }, '外部'),
            h('form', [
              h(MdvDatePicker, {
                modelValue: date.value,
                name: 'date',
                'onUpdate:modelValue': (value: MdvDateValue) => {
                  date.value = value
                  update(value)
                },
              }),
            ]),
          ])
      },
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector<HTMLInputElement>('[data-date-entry]')!
    const id = input.id
    const outside = host.querySelector<HTMLButtonElement>('#outside')!
    input.value = '2026/11/20'
    outside.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('[data-date-entry]')).toBe(input)
      expect(input.id).toBe(id)
      expect(input.value).toBe('2026/11/20')
      expect(document.activeElement).toBe(outside)
      expect(update).not.toHaveBeenCalled()
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
      await flushPromises()
      expect(update).toHaveBeenCalledWith('2026-11-20')
      expect(new FormData(host.querySelector('form')!).get('date')).toBe('2026-11-20')
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      host.remove()
    }
  })
  it('挂载后才处理初始打开；卸载释放模态与监听，后续媒体变化不再重开', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(MdvDatePicker, {
          open: true,
          layout: 'modal',
          modelValue: '2026-11-14',
        }),
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector('[data-date-entry]')!
    const dialog = host.querySelector<HTMLDialogElement>('dialog')!
    const app = createSSRApp(Example)
    try {
      expect(dialog.open).toBe(false)
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('[data-date-entry]')).toBe(input)
      expect(host.querySelector('dialog')).toBe(dialog)
      expect(dialog.open).toBe(true)
      expect(document.activeElement?.getAttribute('data-date')).toBe('2026-11-14')
      expect(document.documentElement.style.overflow).toBe('hidden')
    } finally {
      app.unmount()
      host.remove()
    }
    expect(document.documentElement.style.overflow).toBe('')
    const opens = platform.showModal.mock.calls.length
    platform.media('(max-width: 599px)', true)
    await flushPromises()
    expect(platform.showModal).toHaveBeenCalledTimes(opens)
  })
})
