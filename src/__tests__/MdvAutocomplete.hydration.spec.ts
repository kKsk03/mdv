import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvAutocomplete from '../components/MdvAutocomplete.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('MdvAutocomplete hydration', () => {
  it('reuses the input and adopts edits made before hydration', async () => {
    const update = vi.fn<(value: string | number | null) => void>()
    const Example = defineComponent({
      render: () =>
        h(MdvAutocomplete, {
          label: '城市',
          modelValue: '',
          options: [],
          'onUpdate:modelValue': update,
        }),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector<HTMLInputElement>('input')!
    const originalId = input.id
    input.value = 'hydration draft'
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect(container.querySelector('input')).toBe(input)
      expect(input.id).toBe(originalId)
      expect(input.value).toBe('hydration draft')
      expect(update).toHaveBeenCalledExactlyOnceWith('hydration draft')
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
