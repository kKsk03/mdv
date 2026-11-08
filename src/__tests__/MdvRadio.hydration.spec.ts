import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvRadio from '../components/MdvRadio.vue'
import MdvRadioGroup from '../components/MdvRadioGroup.vue'

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

describe('MdvRadio hydration', () => {
  it('keeps a selection made before hydration and restores it on reset', async () => {
    const updates = vi.fn<(value: string | number | null) => void>()
    const Example = defineComponent({
      setup() {
        const selected = ref<string | number | null>(null)
        return () =>
          h('form', [
            h(
              MdvRadioGroup,
              {
                modelValue: selected.value,
                name: 'choice',
                'onUpdate:modelValue': (next: string | number | null) => {
                  selected.value = next
                  updates(next)
                },
              },
              {
                default: () => [h(MdvRadio, { value: 'a', label: 'A' })],
              },
            ),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector('input') as HTMLInputElement
    input.click()
    expect(input.checked).toBe(true)
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect(container.querySelector('input')).toBe(input)
      expect(input.checked).toBe(true)
      expect(updates).toHaveBeenCalledExactlyOnceWith('a')
      container.querySelector('form')!.reset()
      await settle()
      expect(input.checked).toBe(false)
      expect(updates.mock.calls.map(([value]) => value)).toEqual(['a', null])
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
