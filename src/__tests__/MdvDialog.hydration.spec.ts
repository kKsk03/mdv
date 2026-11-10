import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvDialog from '../components/MdvDialog.vue'
import MdvFullscreenDialog from '../components/MdvFullscreenDialog.vue'
import type { MdvDialogSlotProps } from '../components/dialog.types'
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
})

describe('MdvDialog hydration', () => {
  it('preserves closed markup and existing focus, then opens, submits and restores its trigger', async () => {
    const Example = defineComponent({
      setup() {
        const visible = ref(false)
        return () =>
          h('main', [
            h(
              'button',
              {
                id: 'open-dialog',
                onClick: () => {
                  visible.value = true
                },
              },
              '打开',
            ),
            h(
              MdvDialog,
              {
                modelValue: visible.value,
                title: '选择操作',
                'onUpdate:modelValue': (value: boolean) => {
                  visible.value = value
                },
              },
              {
                default: () => h('input', { autofocus: true }),
                actions: ({ close }: MdvDialogSlotProps) =>
                  h('button', { id: 'finish-dialog', onClick: () => close('done') }, '完成'),
              },
            ),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const trigger = container.querySelector<HTMLButtonElement>('#open-dialog')!
    const dialog = container.querySelector<HTMLDialogElement>('dialog')!
    const input = container.querySelector<HTMLInputElement>('input')!
    const name = dialog.getAttribute('aria-labelledby')
    trigger.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect(document.activeElement).toBe(trigger)
      expect(container.querySelector('dialog')).toBe(dialog)
      expect(dialog.getAttribute('aria-labelledby')).toBe(name)
      trigger.click()
      await flushPromises()
      expect(dialog.open).toBe(true)
      expect(container.querySelector('input')).toBe(input)
      expect(document.activeElement).toBe(input)
      container.querySelector<HTMLButtonElement>('#finish-dialog')!.click()
      await flushPromises()
      expect(dialog.open).toBe(false)
      expect(dialog.returnValue).toBe('done')
      expect(document.activeElement).toBe(trigger)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('hydrates an initially open modal with its original nodes and cleans the lock on unmount', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvFullscreenDialog,
          {
            modelValue: true,
            title: '编辑',
            destroyOnClose: true,
          },
          {
            default: () => h('input', { value: '服务端草稿', autofocus: true }),
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const dialog = container.querySelector<HTMLDialogElement>('dialog')!
    const input = container.querySelector<HTMLInputElement>('input')!
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(dialog.open).toBe(true)
      expect(container.querySelector('input')).toBe(input)
      expect(input.value).toBe('服务端草稿')
      expect(document.activeElement).toBe(input)
      expect(platform.showModal).toHaveBeenCalledTimes(1)
      expect(dialog.classList.contains('mdv-fullscreen-dialog')).toBe(true)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
    expect(document.documentElement.style.overflow).toBe('')
  })
})
