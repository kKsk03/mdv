import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvTooltip from '../components/MdvTooltip.vue'
import MdvRichTooltip from '../components/MdvRichTooltip.vue'
import type { MdvTooltipTriggerSlotProps } from '../components/tooltip.types'
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

describe('Tooltip hydration', () => {
  it('retains markup, ids and pre-existing focus, then activates its existing trigger', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvTooltip,
          { text: '刷新说明' },
          {
            trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
              h(
                'button',
                { ...triggerProps, 'aria-label': '刷新', 'aria-describedby': 'existing-help' },
                '刷新',
              ),
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const trigger = container.querySelector<HTMLButtonElement>('button')!
    const panel = container.querySelector<HTMLElement>('[role="tooltip"]')!
    const id = panel.id
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    trigger.focus()
    try {
      app.mount(container)
      await nextTick()
      expect(container.querySelector('[role="tooltip"]')).toBe(panel)
      expect(panel.id).toBe(id)
      expect(document.activeElement).toBe(trigger)
      expect(platform.opened.size).toBe(0)
      expect(trigger.getAttribute('aria-describedby')?.split(' ')).toEqual(['existing-help', id])
      trigger.blur()
      trigger.focus()
      await flushPromises()
      expect(platform.opened.has(panel)).toBe(true)
      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      trigger.dispatchEvent(escape)
      await flushPromises()
      expect(platform.opened.size).toBe(0)
      expect(document.activeElement).toBe(trigger)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
    expect(trigger.getAttribute('aria-describedby')).toBe('existing-help')
  })

  it('opens an initially true Rich model after hydration without grabbing focus', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvRichTooltip,
          {
            title: '新功能',
            text: '说明内容',
            persistent: true,
            modelValue: true,
          },
          {
            trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
              h('button', triggerProps, '了解更多'),
            actions: () => h('button', '知道了'),
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const panel = container.querySelector<HTMLElement>('[data-mdv-tooltip-panel]')!
    const trigger = container.querySelector<HTMLButtonElement>('button')!
    const app = createSSRApp(Example)
    try {
      expect(panel.style.display).toBe('none')
      app.mount(container)
      await flushPromises()
      expect(container.querySelector('[data-mdv-tooltip-panel]')).toBe(panel)
      expect(platform.opened.has(panel)).toBe(true)
      expect(document.activeElement).toBe(document.body)
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(document.documentElement.style.overflow).toBe('')
    } finally {
      app.unmount()
      container.remove()
    }
    expect(platform.opened.size).toBe(0)
  })
})
