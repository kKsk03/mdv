import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSegmentedButton from '../components/MdvSegmentedButton.vue'
import MdvSegmentedButtonItem from '../components/MdvSegmentedButtonItem.vue'
import type { MdvSegmentedButtonModelValue } from '../components/segmented-button.types'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

async function settle() {
  await Promise.resolve()
  await nextTick()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

describe('MdvSegmentedButton hydration', () => {
  it('keeps the server nodes, IDs and pre-existing focus without hydration warnings', async () => {
    const Example = defineComponent({
      render: () =>
        h(
          MdvSegmentedButton,
          { modelValue: 'b', 'aria-label': '视图' },
          {
            default: () => [
              h(MdvSegmentedButtonItem, { value: 'a', label: '列表' }),
              h(MdvSegmentedButtonItem, { value: 'b', label: '网格' }),
            ],
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const inputs = [...container.querySelectorAll('input')]
    const ids = inputs.map((input) => input.id)
    expect(inputs.map((input) => input.tabIndex)).toEqual([0, -1])
    inputs[1]!.focus()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect([...container.querySelectorAll('input')]).toEqual(inputs)
      expect(inputs.map((input) => input.id)).toEqual(ids)
      expect(inputs.map((input) => input.checked)).toEqual([false, true])
      expect(inputs.map((input) => input.tabIndex)).toEqual([-1, 0])
      expect(document.activeElement).toBe(inputs[1])
      expect(warning).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('adopts a native selection made before hydration and restores the original model on reset', async () => {
    const updates = vi.fn<(value: MdvSegmentedButtonModelValue) => void>()
    const Example = defineComponent({
      setup() {
        const model = ref<MdvSegmentedButtonModelValue>(null)
        return () =>
          h('form', [
            h(
              MdvSegmentedButton,
              {
                modelValue: model.value,
                name: 'view',
                'onUpdate:modelValue': (next: MdvSegmentedButtonModelValue) => {
                  model.value = next
                  updates(next)
                },
              },
              {
                default: () => [
                  h(MdvSegmentedButtonItem, { value: 'a', label: '列表' }),
                  h(MdvSegmentedButtonItem, { value: 'b', label: '网格' }),
                ],
              },
            ),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelectorAll('input')[1]!
    input.click()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect(container.querySelectorAll('input')[1]).toBe(input)
      expect(input.checked).toBe(true)
      expect(input.getAttribute('aria-checked')).toBe('true')
      expect(updates).toHaveBeenCalledExactlyOnceWith('b')
      expect([...new FormData(container.querySelector('form')!)]).toEqual([['view', 'b']])
      container.querySelector('form')!.reset()
      await settle()
      expect(input.checked).toBe(false)
      expect(updates.mock.calls.map(([value]) => value)).toEqual(['b', null])
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('adopts multiple pre-hydration checkbox changes without mutating the initial selection', async () => {
    const Example = defineComponent({
      setup() {
        const model = ref<MdvSegmentedButtonModelValue>(['a'])
        return () =>
          h('form', [
            h(
              MdvSegmentedButton,
              {
                selection: 'multiple',
                modelValue: model.value,
                'onUpdate:modelValue': (next: MdvSegmentedButtonModelValue) => {
                  model.value = next
                },
              },
              {
                default: () => [
                  h(MdvSegmentedButtonItem, { value: 'a', label: '甲' }),
                  h(MdvSegmentedButtonItem, { value: 'b', label: '乙' }),
                ],
              },
            ),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const inputs = [...container.querySelectorAll('input')]
    inputs[0]!.click()
    inputs[1]!.click()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect(inputs.map((input) => input.checked)).toEqual([false, true])
      expect(inputs.map((input) => input.getAttribute('aria-checked'))).toEqual(['false', 'true'])
      container.querySelector('form')!.reset()
      await settle()
      expect(inputs.map((input) => input.checked)).toEqual([true, false])
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
