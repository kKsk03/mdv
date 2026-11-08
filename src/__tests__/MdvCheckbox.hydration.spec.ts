import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCheckbox from '../components/MdvCheckbox.vue'
import type { MdvCheckboxModelValue } from '../components/checkbox.types'

afterEach(() => vi.restoreAllMocks())

async function settle() {
  await Promise.resolve()
  await nextTick()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

describe('MdvCheckbox hydration', () => {
  it('reuses native controls and ids and restores controlled array and mixed states on reset', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Example = defineComponent({
      setup() {
        const value = ref<MdvCheckboxModelValue>(false)
        const mixed = ref(true)
        const choices = ref<MdvCheckboxModelValue>(['a'])
        return () =>
          h('form', [
            h(MdvCheckbox, {
              label: '全选',
              modelValue: value.value,
              indeterminate: mixed.value,
              name: 'all',
              'onUpdate:modelValue': (next: MdvCheckboxModelValue) => {
                value.value = next
              },
              'onUpdate:indeterminate': (next: boolean) => {
                mixed.value = next
              },
            }),
            ...['a', 'b'].map((item) =>
              h(MdvCheckbox, {
                label: item,
                modelValue: choices.value,
                value: item,
                name: 'choice',
                'onUpdate:modelValue': (next: MdvCheckboxModelValue) => {
                  choices.value = next
                },
              }),
            ),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const inputs = [...container.querySelectorAll('input')]
    const ids = inputs.map((input) => input.id)
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      inputs.forEach((input, index) => {
        expect(container.querySelectorAll('input')[index]).toBe(input)
      })
      expect(inputs.map((input) => input.id)).toEqual(ids)
      expect(new Set(ids).size).toBe(3)
      expect(inputs[0]!.indeterminate).toBe(true)
      inputs[0]!.click()
      inputs[2]!.click()
      await settle()
      expect(inputs.map((input) => input.checked)).toEqual([true, true, true])
      expect(inputs[0]!.indeterminate).toBe(false)
      expect(new FormData(container.querySelector('form')!).getAll('choice')).toEqual(['a', 'b'])
      container.querySelector('form')!.reset()
      await settle()
      expect(inputs.map((input) => input.checked)).toEqual([false, true, false])
      expect(inputs[0]!.indeterminate).toBe(true)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('adopts a selection made before hydration and still resets to the server baseline', async () => {
    const updates = vi.fn<(value: MdvCheckboxModelValue) => void>()
    const Example = defineComponent({
      setup() {
        const value = ref<MdvCheckboxModelValue>(false)
        return () =>
          h('form', [
            h(MdvCheckbox, {
              label: '已阅读',
              modelValue: value.value,
              name: 'accepted',
              value: 'yes',
              'onUpdate:modelValue': (next: MdvCheckboxModelValue) => {
                value.value = next
                updates(next)
              },
            }),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector('input')!
    input.click()
    expect(input.checked).toBe(true)
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect(container.querySelector('input')).toBe(input)
      expect(input.checked).toBe(true)
      expect(updates).toHaveBeenCalledExactlyOnceWith(true)
      expect(new FormData(container.querySelector('form')!).get('accepted')).toBe('yes')
      container.querySelector('form')!.reset()
      await settle()
      expect(input.checked).toBe(false)
      expect(updates.mock.calls.map(([value]) => value)).toEqual([true, false])
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
