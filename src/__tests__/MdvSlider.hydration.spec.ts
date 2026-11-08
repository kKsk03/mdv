import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSlider from '../components/MdvSlider.vue'
import type { MdvSliderModelValue } from '../components/slider.types'

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

describe('MdvSlider hydration', () => {
  it('reuses server inputs, preserves a pre-hydration range edit and resets to the server baseline', async () => {
    const updates = vi.fn<(value: MdvSliderModelValue) => void>()
    const onInput = vi.fn<(event: Event) => void>()
    const Example = defineComponent({
      setup() {
        const value = ref<MdvSliderModelValue>([20, 80])
        return () =>
          h('form', [
            h(MdvSlider, {
              modelValue: value.value,
              variant: 'range',
              label: '预算',
              name: 'budget',
              onInput,
              'onUpdate:modelValue': (next: MdvSliderModelValue | undefined) => {
                if (next === undefined) throw new Error('MdvSlider must emit a defined model value')
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
    const inputs = [...container.querySelectorAll('input')]
    const ids = inputs.map((input) => input.id)
    inputs[1]!.value = '65'
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect([...container.querySelectorAll('input')]).toEqual(inputs)
      expect(inputs.map((input) => input.id)).toEqual(ids)
      expect(inputs.map((input) => input.value)).toEqual(['20', '65'])
      expect(updates).toHaveBeenCalledExactlyOnceWith([20, 65])
      expect(onInput).not.toHaveBeenCalled()
      const form = container.querySelector('form')!
      expect(new FormData(form).getAll('budget')).toEqual(['20', '65'])
      form.reset()
      await settle()
      expect(inputs.map((input) => input.value)).toEqual(['20', '80'])
      expect(updates.mock.calls.map(([value]) => value)).toEqual([
        [20, 65],
        [20, 80],
      ])
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
