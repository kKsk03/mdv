import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvRadio from '../components/MdvRadio.vue'
import MdvRadioGroup from '../components/MdvRadioGroup.vue'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('MdvRadio SSR', () => {
  it('renders stable labels, group semantics and selected state without browser globals', async () => {
    const Example = defineComponent({
      setup() {
        const selected = ref<string | number | null>('pro')
        return () =>
          h(
            MdvRadioGroup,
            {
              modelValue: selected.value,
              name: 'plan',
              label: '套餐',
            },
            {
              default: () => [
                h(MdvRadio, { value: 'basic', label: '基础版' }),
                h(MdvRadio, { value: 'pro', label: '专业版' }),
              ],
            },
          )
      },
    })
    const html = await renderToString(createSSRApp(Example))
    const container = document.createElement('div')
    container.innerHTML = html
    const inputs = [...container.querySelectorAll('input')]
    expect(container.querySelector('fieldset')?.getAttribute('role')).toBe('radiogroup')
    expect(container.querySelector('legend')?.textContent).toBe('套餐')
    expect(inputs).toHaveLength(2)
    expect(inputs.map((input) => input.checked)).toEqual([false, true])
    expect(inputs.map((input) => input.name)).toEqual(['plan', 'plan'])
    expect(new Set(inputs.map((input) => input.id)).size).toBe(2)
  })
})
