import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvNavigationRail from '../components/MdvNavigationRail.vue'
import MdvModalNavigationRail from '../components/MdvModalNavigationRail.vue'
import MdvNavigationRailItem from '../components/MdvNavigationRailItem.vue'
import type { MdvNavigationRailSlotProps } from '../components/navigation-rail.types'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

describe('Navigation Rail hydration', () => {
  it('keeps standard item nodes, ids and existing page focus during hydration and expansion', async () => {
    const expanded = ref(false)
    const Draft = defineComponent({
      setup: () => () => h('input', { id: 'draft', value: '服务端草稿' }),
    })
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(Draft),
          h(
            MdvNavigationRail,
            {
              expanded: expanded.value,
              'onUpdate:expanded': (value: boolean) => {
                expanded.value = value
              },
            },
            {
              menu: ({ menuAttrs }: MdvNavigationRailSlotProps) => h('button', menuAttrs, '切换'),
              default: () =>
                h(
                  MdvNavigationRailItem,
                  { label: '首页', active: true },
                  {
                    badge: () =>
                      h('span', { 'data-badge': '', role: 'img', 'aria-label': '3 条通知' }, '3'),
                  },
                ),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector<HTMLInputElement>('input')!
    const item = container.querySelector('[data-mdv-rail-item]')!
    const badge = container.querySelector('[data-badge]')!
    const control = container.querySelector<HTMLButtonElement>('button[aria-controls]')!
    const controls = control.getAttribute('aria-controls')
    input.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(input)
      input.value = '保留编辑'
      expanded.value = true
      await flushPromises()
      expect(container.querySelector('[data-mdv-rail-item]')).toBe(item)
      expect(container.querySelector('[data-badge]')).toBe(badge)
      expect(control.getAttribute('aria-controls')).toBe(controls)
      expect(document.activeElement).toBe(input)
      expect(input.value).toBe('保留编辑')
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })

  it('hydrates a retained modal without replacing nodes, then focuses autofocus and restores its trigger', async () => {
    const expanded = ref(false)
    const draft = ref('表单草稿')
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(
            'button',
            {
              id: 'trigger',
              onClick: () => {
                expanded.value = true
              },
            },
            '打开',
          ),
          h(
            MdvModalNavigationRail,
            {
              expanded: expanded.value,
              hideOnCollapse: true,
              'onUpdate:expanded': (value: boolean) => {
                expanded.value = value
              },
            },
            {
              fab: () =>
                h('input', {
                  value: draft.value,
                  autofocus: true,
                  onInput: (event: Event) => {
                    draft.value = (event.target as HTMLInputElement).value
                  },
                }),
              default: () => h(MdvNavigationRailItem, { label: '首页' }),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const dialog = container.querySelector<HTMLDialogElement>('dialog')!
    const input = container.querySelector<HTMLInputElement>('input')!
    const trigger = container.querySelector<HTMLButtonElement>('#trigger')!
    const id = dialog.id
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    trigger.focus()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(trigger)
      input.value = '保留草稿'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await flushPromises()
      trigger.click()
      await flushPromises()
      expect(container.querySelector('dialog')).toBe(dialog)
      expect(container.querySelector('input')).toBe(input)
      expect(input.value).toBe('保留草稿')
      expect(dialog.id).toBe(id)
      expect(document.activeElement).toBe(input)
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
      await flushPromises()
      expect(dialog.open).toBe(false)
      expect(document.activeElement).toBe(trigger)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
    expect(document.documentElement.style.overflow).toBe('')
  })
})
