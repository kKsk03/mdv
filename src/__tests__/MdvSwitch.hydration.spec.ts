import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvSwitch from '../components/MdvSwitch.vue'

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

describe('MdvSwitch hydration', () => {
  it('reuses the server control and keeps a pre-hydration click before resetting', async () => {
    const updates = vi.fn<(value: boolean) => void>()
    const Example = defineComponent({
      setup() {
        const enabled = ref(false)
        return () =>
          h('form', [
            h(MdvSwitch, {
              modelValue: enabled.value,
              label: '已启用',
              name: 'enabled',
              value: 'yes',
              'onUpdate:modelValue': (value: boolean) => {
                enabled.value = value
                updates(value)
              },
            }),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector('input') as HTMLInputElement
    const id = input.id
    input.click()
    expect(input.checked).toBe(true)

    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await settle()
      expect(container.querySelector('input')).toBe(input)
      expect(input.id).toBe(id)
      expect(input.checked).toBe(true)
      expect(updates).toHaveBeenCalledExactlyOnceWith(true)
      expect(new FormData(container.querySelector('form')!).get('enabled')).toBe('yes')
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
