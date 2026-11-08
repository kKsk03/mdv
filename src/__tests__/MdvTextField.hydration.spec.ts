import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTextField from '../components/MdvTextField.vue'

afterEach(() => vi.restoreAllMocks())

describe('MdvTextField hydration', () => {
  it('reuses server controls and ids, then preserves controlled input, textarea and reset behavior', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Example = defineComponent({
      setup() {
        const name = ref('初始姓名')
        const notes = ref('第一行\n第二行')
        return () =>
          h('form', [
            h(MdvTextField, {
              label: '姓名',
              modelValue: name.value,
              name: 'name',
              clearable: true,
              'onUpdate:modelValue': (value: string | number) => (name.value = String(value)),
            }),
            h(MdvTextField, {
              label: '备注',
              multiline: true,
              modelValue: notes.value,
              name: 'notes',
              'onUpdate:modelValue': (value: string | number) => (notes.value = String(value)),
            }),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector('input')!
    const textarea = container.querySelector('textarea')!
    const ids = [input.id, textarea.id]
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect(container.querySelector('input')).toBe(input)
      expect(container.querySelector('textarea')).toBe(textarea)
      expect([input.id, textarea.id]).toEqual(ids)
      expect(input.value).toBe('初始姓名')
      expect(textarea.value).toBe('第一行\n第二行')
      input.value = '修改姓名'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.value = '新备注'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      expect(new FormData(container.querySelector('form')!).get('name')).toBe('修改姓名')
      container.querySelector('form')!.reset()
      await Promise.resolve()
      await nextTick()
      expect(input.value).toBe('初始姓名')
      expect(textarea.value).toBe('第一行\n第二行')
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('adopts values entered before hydration instead of overwriting them with server defaults', async () => {
    const updates = vi.fn<(value: string | number) => void>()
    const Example = defineComponent({
      render: () =>
        h(MdvTextField, { label: '姓名', modelValue: '', 'onUpdate:modelValue': updates }),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector('input')!
    input.value = '自动填充'
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect(input.value).toBe('自动填充')
      expect(updates).toHaveBeenCalledExactlyOnceWith('自动填充')
      expect(
        container.querySelector('.mdv-text-field')?.classList.contains('mdv-text-field--floating'),
      ).toBe(true)
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
