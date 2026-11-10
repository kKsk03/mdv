import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvMenu from '../components/MdvMenu.vue'
import MdvMenuItem from '../components/MdvMenuItem.vue'
import type { MdvMenuTriggerSlotProps } from '../components/menu.types'
import { mockMenuPlatform } from './menu-test-platform'

let platform: ReturnType<typeof mockMenuPlatform>
beforeEach(() => {
  platform = mockMenuPlatform()
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('MdvMenu hydration', () => {
  it('preserves closed markup, stable ids and focus, then activates the existing controls', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvMenu,
          {},
          {
            trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
              h('button', triggerProps, '操作'),
            default: () => [h(MdvMenuItem, { label: '保存' })],
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const trigger = container.querySelector<HTMLButtonElement>('button')!
    const panel = container.querySelector<HTMLElement>('[data-mdv-menu-panel]')!
    const item = container.querySelector<HTMLButtonElement>('[data-mdv-menu-item]')!
    const id = panel.id
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    trigger.focus()
    try {
      app.mount(container)
      await nextTick()
      expect(platform.opened.size).toBe(0)
      expect(document.activeElement).toBe(trigger)
      expect(container.querySelector('[data-mdv-menu-panel]')).toBe(panel)
      expect(panel.id).toBe(id)
      trigger.click()
      await flushPromises()
      expect(platform.opened.has(panel)).toBe(true)
      expect(container.querySelector('[data-mdv-menu-item]')).toBe(item)
      expect(document.activeElement).toBe(item)
      item.click()
      await flushPromises()
      expect(platform.opened.size).toBe(0)
      expect(document.activeElement).toBe(trigger)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('opens an initially true model only after hydration and releases the top layer on unmount', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvMenu,
          { modelValue: true },
          {
            trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
              h('button', triggerProps, '操作'),
            default: () => [h(MdvMenuItem, { label: '内容' })],
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const panel = container.querySelector<HTMLElement>('[data-mdv-menu-panel]')!
    const app = createSSRApp(Example)
    try {
      expect(panel.style.display).toBe('none')
      expect(platform.opened.size).toBe(0)
      app.mount(container)
      await flushPromises()
      expect(container.querySelector('[data-mdv-menu-panel]')).toBe(panel)
      expect(platform.opened.has(panel)).toBe(true)
      expect(document.documentElement.style.overflow).toBe('')
    } finally {
      app.unmount()
      container.remove()
    }
    expect(platform.opened.size).toBe(0)
  })
})
