import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvChip from '../components/MdvChip.vue'
import MdvChipSet from '../components/MdvChipSet.vue'
import type { MdvChipSetModelValue } from '../components/chip.types'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('MdvChip hydration', () => {
  it('keeps native nodes, stable ids and selection, then establishes one roving tab stop', async () => {
    const Example = defineComponent({
      setup() {
        const model = ref<MdvChipSetModelValue>('b')
        return () =>
          h(
            MdvChipSet,
            {
              label: '筛选',
              selection: 'single',
              modelValue: model.value,
              'onUpdate:modelValue': (value: MdvChipSetModelValue) => {
                model.value = value
              },
            },
            {
              default: () => [
                h(MdvChip, { variant: 'filter', label: 'A', value: 'a' }),
                h(MdvChip, { variant: 'filter', label: 'B', value: 'b' }),
                h(MdvChip, { variant: 'input', label: '内容' }),
              ],
            },
          )
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const buttons = [...container.querySelectorAll('button')]
    const ids = buttons.map((button) => button.id)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      await nextTick()
      expect([...container.querySelectorAll('button')]).toEqual(buttons)
      expect(buttons.map((button) => button.id)).toEqual(ids)
      expect(buttons.map((button) => button.tabIndex)).toEqual([-1, 0, -1, -1])
      expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
        null,
        null,
      ])
      buttons[0]!.click()
      await nextTick()
      expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true')
      expect(buttons[1]!.getAttribute('aria-pressed')).toBe('false')
      expect(warning).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('preserves a focus placed before hydration instead of moving it to a selected chip', async () => {
    const Example = defineComponent({
      render: () =>
        h(
          MdvChipSet,
          { label: '筛选', selection: 'single', modelValue: 'b' },
          {
            default: () => [
              h(MdvChip, { variant: 'filter', label: 'A', value: 'a' }),
              h(MdvChip, { variant: 'filter', label: 'B', value: 'b' }),
            ],
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const primary = container.querySelector('button')!
    primary.focus()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect(document.activeElement).toBe(primary)
      expect(primary.tabIndex).toBe(0)
      expect(container.querySelectorAll('button')[1]!.tabIndex).toBe(-1)
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
