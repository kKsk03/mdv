import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvBottomSheet from '../components/MdvBottomSheet.vue'
import MdvBottomSheetScaffold from '../components/MdvBottomSheetScaffold.vue'
import type { MdvBottomSheetState } from '../components/bottom-sheet.types'
import { mockBottomSheetPlatform } from './bottom-sheet-test-platform'

let platform: ReturnType<typeof mockBottomSheetPlatform>
beforeEach(() => {
  platform = mockBottomSheetPlatform()
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

describe('Bottom Sheet hydration', () => {
  it('preserves closed nodes and focus, then opens and restores its trigger', async () => {
    const visible = ref(false)
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(
            'button',
            {
              id: 'open-sheet',
              onClick: () => {
                visible.value = true
              },
            },
            '打开',
          ),
          h(
            MdvBottomSheet,
            {
              modelValue: visible.value,
              title: '编辑',
              'onUpdate:modelValue': (value: boolean) => {
                visible.value = value
              },
            },
            {
              default: () => h('input', { value: '服务端草稿', autofocus: true }),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const trigger = container.querySelector<HTMLButtonElement>('#open-sheet')!
    const dialog = container.querySelector<HTMLDialogElement>('dialog')!
    const input = container.querySelector<HTMLInputElement>('input')!
    const label = dialog.getAttribute('aria-labelledby')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    trigger.focus()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect(document.activeElement).toBe(trigger)
      trigger.click()
      await flushPromises()
      expect(dialog.open).toBe(true)
      expect(container.querySelector('dialog')).toBe(dialog)
      expect(container.querySelector('input')).toBe(input)
      expect(dialog.getAttribute('aria-labelledby')).toBe(label)
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
      container.remove()
    }
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('hydrates an initially open modal and a standard region without replacing server-rendered input nodes', async () => {
    const value = ref<MdvBottomSheetState>('partial')
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(
            MdvBottomSheet,
            { modelValue: true, title: '打开的面板' },
            { default: () => h('input', { id: 'modal-draft', value: '模态草稿' }) },
          ),
          h(
            MdvBottomSheetScaffold,
            {
              title: '地点',
              modelValue: value.value,
              'onUpdate:modelValue': (next: MdvBottomSheetState) => {
                value.value = next
              },
            },
            {
              sheet: () => h('input', { id: 'standard-draft', value: '页面草稿' }),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const modalInput = container.querySelector('#modal-draft')
    const standardInput = container.querySelector('#standard-draft')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      value.value = 'expanded'
      await flushPromises()
      expect(container.querySelector('#modal-draft')).toBe(modalInput)
      expect(container.querySelector('#standard-draft')).toBe(standardInput)
      expect(container.querySelector('dialog')?.open).toBe(true)
      expect(container.querySelector('[role="region"]')?.getAttribute('data-sheet-state')).toBe(
        'expanded',
      )
      expect(platform.showModal).toHaveBeenCalledTimes(1)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
    expect(document.documentElement.style.overflow).toBe('')
  })
})
