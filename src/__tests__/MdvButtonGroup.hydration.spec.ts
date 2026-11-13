import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvButtonGroup from '../components/MdvButtonGroup.vue'
import MdvButtonGroupItem from '../components/MdvButtonGroupItem.vue'
import type { MdvButtonGroupModelValue } from '../components/button-group.types'
import { toolbarReducedMotion } from './toolbar-test-platform'

beforeEach(toolbarReducedMotion)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Button Group hydration', () => {
  it('preserves server nodes, external draft and focus while accepting native selections', async () => {
    const model = ref<MdvButtonGroupModelValue>('a')
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('input', { id: 'draft' }),
          h(
            MdvButtonGroup,
            {
              variant: 'connected',
              modelValue: model.value,
              name: 'mode',
              'aria-label': '模式',
              'onUpdate:modelValue': (value: MdvButtonGroupModelValue) => {
                model.value = value
              },
            },
            {
              default: () =>
                ['a', 'b', 'c'].map((value) =>
                  h(
                    MdvButtonGroupItem,
                    { key: value, value, id: value },
                    { default: () => h('strong', value) },
                  ),
                ),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const draft = container.querySelector<HTMLInputElement>('#draft')!
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button')]
    const label = buttons[1]!.querySelector('strong')!
    draft.value = '用户草稿'
    draft.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(draft)
      expect(container.querySelector('#draft')).toBe(draft)
      expect(draft.value).toBe('用户草稿')
      expect([...container.querySelectorAll('button')]).toEqual(buttons)
      buttons[1]!.focus()
      buttons[1]!.click()
      await flushPromises()
      expect(model.value).toBe('b')
      expect(document.activeElement).toBe(buttons[1])
      expect(buttons[1]!.querySelector('strong')).toBe(label)
      expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
        'false',
      ])
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })

  it('retains an initially focused independent toggle while changing shape and icon', async () => {
    const selected = ref(false)
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvButtonGroup,
          { shape: 'square' },
          {
            default: () =>
              h(
                MdvButtonGroupItem,
                {
                  id: 'mic',
                  iconOnly: true,
                  selected: selected.value,
                  'aria-label': '麦克风',
                  'onUpdate:selected': (value: boolean) => {
                    selected.value = value
                  },
                },
                {
                  default: () => h('svg', { 'data-state': 'off' }),
                  selected: () => h('svg', { 'data-state': 'on' }),
                },
              ),
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const button = container.querySelector<HTMLButtonElement>('button')!
    button.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(button)
      button.click()
      await flushPromises()
      expect(container.querySelector('button')).toBe(button)
      expect(button.getAttribute('aria-pressed')).toBe('true')
      expect(button.querySelector('svg')?.getAttribute('data-state')).toBe('on')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
