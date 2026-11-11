import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSideSheet from '../components/MdvSideSheet.vue'
import MdvSideSheetScaffold from '../components/MdvSideSheetScaffold.vue'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  platform = mockDialogPlatform()
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

describe('Side Sheet hydration', () => {
  it('keeps modal nodes and ids, then focuses the retained input and restores the trigger', async () => {
    const visible = ref(false)
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(
            'button',
            {
              id: 'trigger',
              onClick: () => {
                visible.value = true
              },
            },
            '打开',
          ),
          h(
            MdvSideSheet,
            {
              modelValue: visible.value,
              title: '编辑',
              'onUpdate:modelValue': (value: boolean) => {
                visible.value = value
              },
            },
            { default: () => h('input', { autofocus: true, value: '草稿' }) },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const dialog = container.querySelector<HTMLDialogElement>('dialog')!
    const input = container.querySelector<HTMLInputElement>('input')!
    const trigger = container.querySelector<HTMLButtonElement>('#trigger')!
    const label = dialog.getAttribute('aria-labelledby')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    trigger.focus()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(trigger)
      trigger.click()
      await flushPromises()
      expect(container.querySelector('dialog')).toBe(dialog)
      expect(container.querySelector('input')).toBe(input)
      expect(dialog.getAttribute('aria-labelledby')).toBe(label)
      expect(dialog.open).toBe(true)
      expect(document.activeElement).toBe(input)
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
      await flushPromises()
      expect(dialog.open).toBe(false)
      expect(document.activeElement).toBe(trigger)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('hydrates an open standard panel without stealing focus or replacing its draft', async () => {
    const visible = ref(true)
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvSideSheetScaffold,
          {
            modelValue: visible.value,
            title: '详情',
            'onUpdate:modelValue': (value: boolean) => {
              visible.value = value
            },
          },
          {
            default: () => h('button', { id: 'background' }, '主页面'),
            sheet: () => h('input', { value: '保留内容' }),
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector('input')!
    const trigger = container.querySelector<HTMLButtonElement>('#background')!
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    trigger.focus()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(trigger)
      visible.value = false
      await flushPromises()
      visible.value = true
      await flushPromises()
      expect(container.querySelector('input')).toBe(input)
      expect(container.querySelector('[role="dialog"]')?.hasAttribute('inert')).toBe(false)
      expect(platform.showModal).not.toHaveBeenCalled()
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
