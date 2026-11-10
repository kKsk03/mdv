import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MdvTooltip from '../components/MdvTooltip.vue'
import MdvRichTooltip from '../components/MdvRichTooltip.vue'
import MdvButton from '../components/MdvButton.vue'
import MdvDialog from '../components/MdvDialog.vue'
import MdvMenu from '../components/MdvMenu.vue'
import MdvMenuItem from '../components/MdvMenuItem.vue'
import type { MdvMenuTriggerSlotProps } from '../components/menu.types'
import type { MdvRichTooltipProps, MdvTooltipTriggerSlotProps } from '../components/tooltip.types'
import { mockMenuPlatform } from './menu-test-platform'

let platform: ReturnType<typeof mockMenuPlatform>
const mounted: { unmount: () => void }[] = []
beforeEach(() => {
  platform = mockMenuPlatform()
})
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

async function settle() {
  await nextTick()
  await flushPromises()
  await nextTick()
}

function timers() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
}

function pointer(
  target: EventTarget,
  type: string,
  pointerType = 'mouse',
  init: MouseEventInit & { pointerId?: number; isPrimary?: boolean } = {},
) {
  const event = new MouseEvent(type, {
    bubbles: !['pointerenter', 'pointerleave'].includes(type),
    cancelable: true,
    button: 0,
    ...init,
  })
  Object.defineProperties(event, {
    pointerType: { value: pointerType },
    pointerId: { value: init.pointerId ?? 1 },
    isPrimary: { value: init.isPrimary ?? true },
  })
  target.dispatchEvent(event)
  return event
}

function key(target: Element, value: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}

function example(
  props: MdvRichTooltipProps & Record<string, unknown> = {},
  rich = false,
  content?: () => VNode[],
) {
  const config = ref<MdvRichTooltipProps & Record<string, unknown>>({ text: '帮助内容', ...props })
  const host = mount(
    defineComponent({
      setup: () => () =>
        h('main', { 'data-mdv-theme': 'dark', dir: 'ltr' }, [
          h('p', { id: 'existing-description' }, '已有说明'),
          h('button', { 'data-before': '' }, '之前'),
          h(rich ? MdvRichTooltip : MdvTooltip, config.value, {
            trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
              h(
                'button',
                { ...triggerProps, 'data-trigger': '', 'aria-describedby': 'existing-description' },
                '帮助',
              ),
            ...(content ? { default: content } : {}),
            ...(rich
              ? {
                  actions: ({ close }: { close: () => void }) =>
                    h('button', { 'data-action': '', onClick: close }, '知道了'),
                }
              : {}),
          }),
          h('button', { 'data-after': '' }, '之后'),
        ]),
    }),
    { attachTo: document.body },
  )
  mounted.push(host)
  const trigger = host.get<HTMLButtonElement>('[data-trigger]')
  const panel = host.get<HTMLElement>('[data-mdv-tooltip-panel]')
  platform.geometry(trigger.element, { x: 120, y: 100, width: 100, height: 40 })
  platform.geometry(panel.element, { width: rich ? 240 : 120, height: rich ? 140 : 24 })
  const component = rich ? host.getComponent(MdvRichTooltip) : host.getComponent(MdvTooltip)
  async function open() {
    component.vm.open()
    await settle()
  }
  return { host, config, trigger, panel, component, open }
}

describe('MdvTooltip', () => {
  it('merges description ids without replacing the trigger name, position or local theme', async () => {
    const { trigger, panel, component, host, open } = example()
    await settle()
    expect(trigger.attributes('aria-describedby')?.split(' ')).toEqual([
      'existing-description',
      panel.attributes('id'),
    ])
    expect(trigger.text()).toBe('帮助')
    expect(panel.attributes('role')).toBe('tooltip')
    expect(panel.element.style.display).toBe('none')
    expect(host.get('main').element.contains(panel.element)).toBe(true)
    expect(panel.element.closest('[data-mdv-theme]')?.getAttribute('data-mdv-theme')).toBe('dark')
    await open()
    expect(platform.opened.has(panel.element)).toBe(true)
    expect(panel.attributes('data-placement')).toBe('top')
    expect(Number.parseFloat(panel.element.style.top)).toBeLessThan(100)
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(component.emitted('open')).toHaveLength(1)
    expect(component.emitted('opened')).toHaveLength(1)
    expect(document.activeElement).toBe(document.body)
  })

  it('cancels a pending hover and waits 600ms before a later activation', async () => {
    timers()
    const { trigger, panel } = example()
    pointer(trigger.element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(400)
    pointer(trigger.element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(800)
    expect(platform.opened.size).toBe(0)
    pointer(trigger.element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(599)
    expect(platform.opened.size).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
  })

  it('respects a custom close delay while crossing and reading the panel', async () => {
    timers()
    const { trigger, panel, component, open } = example({ closeDelay: 1500 })
    await open()
    pointer(trigger.element, 'pointerenter')
    pointer(trigger.element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(900)
    pointer(panel.element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(2000)
    expect(platform.opened.has(panel.element)).toBe(true)
    pointer(panel.element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(1499)
    expect(platform.opened.has(panel.element)).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(component.emitted('closed')).toEqual([[{ reason: 'leave' }]])
  })

  it('opens immediately for keyboard focus and closes when focus leaves', async () => {
    const { host, trigger, panel } = example()
    trigger.element.focus()
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    expect(document.activeElement).toBe(trigger.element)
    host.get<HTMLButtonElement>('[data-after]').element.focus()
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(document.activeElement).toBe(host.get('[data-after]').element)
  })

  it('does not reopen from pointer focus and allows a later keyboard visit', async () => {
    const { host, trigger, panel } = example()
    pointer(trigger.element, 'pointerdown')
    trigger.element.focus()
    await settle()
    expect(platform.opened.size).toBe(0)
    host.get<HTMLButtonElement>('[data-after]').element.focus()
    trigger.element.focus()
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
  })

  it('respects refused controlled open and close requests until the parent accepts them', async () => {
    const { config, component, panel, open } = example({ modelValue: false })
    await open()
    expect(component.emitted('update:modelValue')).toEqual([[true]])
    expect(platform.opened.size).toBe(0)
    config.value.modelValue = true
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    component.vm.close()
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    expect(component.emitted('update:modelValue')).toEqual([[true], [false]])
    config.value.modelValue = false
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('replaces an older controlled tooltip immediately even when its close request is refused', async () => {
    const first = example({ modelValue: true })
    const second = example()
    await settle()
    expect(platform.opened.has(first.panel.element)).toBe(true)
    await second.open()
    expect(platform.opened.size).toBe(1)
    expect(platform.opened.has(second.panel.element)).toBe(true)
    expect(first.panel.element.style.display).toBe('none')
    expect(first.component.emitted('closed')).toEqual([[{ reason: 'replaced' }]])
    expect(first.component.emitted('update:modelValue')).toEqual([[false]])
  })

  it('forwards refs and native actions through MdvButton without consuming short clicks', async () => {
    const action = vi.fn<() => void>()
    const host = mount(MdvTooltip, {
      props: { text: '说明' },
      attachTo: document.body,
      slots: {
        trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
          h(MdvButton, { ...triggerProps, onClick: [triggerProps.onClick, action] }, () => '操作'),
      },
    })
    mounted.push(host)
    host.get('button').element.click()
    await settle()
    expect(action).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    host.vm.open()
    await settle()
    expect(platform.opened.size).toBe(1)
    expect(host.get('button').attributes('aria-describedby')).toBe(
      host.get('[role="tooltip"]').attributes('id'),
    )
  })

  it('disables only the tooltip, removes its description and hides empty content', async () => {
    const { config, trigger, panel, open } = example()
    await open()
    config.value.disabled = true
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(trigger.element.disabled).toBe(false)
    expect(trigger.attributes('aria-describedby')).toBe('existing-description')
    config.value.text = ''
    config.value.disabled = false
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(panel.text()).toBe('')
    expect(trigger.attributes('aria-describedby')).toBe('existing-description')
    config.value.text = '新的说明'
    await settle()
    expect(trigger.attributes('aria-describedby')).toContain(panel.attributes('id'))
  })

  it('keeps caller description updates and removes only its own association on unmount', async () => {
    const { host, trigger, config } = example()
    await settle()
    trigger.element.setAttribute('aria-describedby', 'new-description')
    config.value.text = '更新说明'
    await settle()
    expect(trigger.attributes('aria-describedby')).toContain('new-description')
    const element = trigger.element
    host.unmount()
    mounted.pop()
    expect(element.getAttribute('aria-describedby')).toBe('new-description')
  })

  it('recognizes a 500ms touch hold, consumes its generated click and expires after release', async () => {
    timers()
    const { trigger, panel } = example()
    const action = vi.fn<() => void>()
    trigger.element.addEventListener('click', action)
    pointer(trigger.element, 'pointerdown', 'touch', { clientX: 10, clientY: 10 })
    await vi.advanceTimersByTimeAsync(499)
    expect(platform.opened.size).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    const context = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    trigger.element.dispatchEvent(context)
    expect(context.defaultPrevented).toBe(true)
    pointer(document, 'pointerup', 'touch')
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })
    trigger.element.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    expect(action).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1500)
    await settle()
    expect(platform.opened.size).toBe(0)
    trigger.element.click()
    expect(action).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
  })

  it.each(['pointermove', 'pointercancel'] as const)(
    'cancels a touch hold on %s without suppressing ordinary activation',
    async (type) => {
      timers()
      const { trigger } = example()
      const action = vi.fn<() => void>()
      trigger.element.addEventListener('click', action)
      pointer(trigger.element, 'pointerdown', 'touch', { clientX: 10, clientY: 10 })
      await vi.advanceTimersByTimeAsync(300)
      pointer(document, type, 'touch', { clientX: 30, clientY: 10 })
      await vi.advanceTimersByTimeAsync(700)
      expect(platform.opened.size).toBe(0)
      trigger.element.click()
      expect(action).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    },
  )

  it('leaves an ordinary touch tap and its click intact', async () => {
    timers()
    const { trigger } = example()
    const action = vi.fn<() => void>()
    trigger.element.addEventListener('click', action)
    pointer(trigger.element, 'pointerdown', 'touch')
    await vi.advanceTimersByTimeAsync(100)
    pointer(document, 'pointerup', 'touch')
    trigger.element.click()
    await vi.advanceTimersByTimeAsync(600)
    expect(platform.opened.size).toBe(0)
    expect(action).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
  })

  it('flips at viewport edges and stops following resize after closing', async () => {
    const { trigger, panel, component, open } = example()
    platform.geometry(trigger.element, { x: 960, y: 1, width: 60, height: 40 })
    await open()
    expect(panel.attributes('data-placement')).toBe('bottom')
    expect(Number.parseFloat(panel.element.style.left)).toBeLessThanOrEqual(896)
    component.vm.close()
    await settle()
    const left = panel.element.style.left
    platform.geometry(trigger.element, { x: 10, y: 10, width: 80, height: 40 })
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(panel.element.style.left).toBe(left)
  })

  it('reverses pending motion and finishes when reduced motion is enabled', async () => {
    platform.enableAnimations()
    const { component, panel, open } = example()
    await open()
    expect(panel.attributes('data-phase')).toBe('opening')
    component.vm.close()
    await settle()
    expect(panel.attributes('data-phase')).toBe('closing')
    await open()
    expect(platform.opened.size).toBe(1)
    platform.media('(prefers-reduced-motion: reduce)', true)
    await settle()
    expect(panel.attributes('data-phase')).toBe('open')
    expect(component.emitted('opened')).toHaveLength(1)
    component.vm.close()
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(component.emitted('closed')).toHaveLength(1)
  })

  it('releases the popover, pending touch and document listeners when deactivated', async () => {
    timers()
    const active = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, {}, () =>
            active.value
              ? h(
                  MdvTooltip,
                  { text: '缓存提示' },
                  {
                    trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
                      h('button', triggerProps, '提示'),
                  },
                )
              : null,
          ),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    host.get('button').element.focus()
    await settle()
    expect(platform.opened.size).toBe(1)
    pointer(host.get('button').element, 'pointerdown', 'touch')
    active.value = false
    await settle()
    await vi.advanceTimersByTimeAsync(1000)
    expect(platform.opened.size).toBe(0)
    expect(key(document.body, 'Escape').defaultPrevented).toBe(false)
  })
})

describe('MdvRichTooltip', () => {
  it('names a non-modal dialog, preserves focus, and permits Tab through the content', async () => {
    const { trigger, panel, host, open } = example({ title: '帮助标题' }, true, () => [
      h('a', { href: '#details' }, '详情'),
    ])
    host.get<HTMLButtonElement>('[data-before]').element.focus()
    await open()
    expect(panel.attributes('role')).toBe('dialog')
    expect(panel.attributes('aria-modal')).toBe('false')
    expect(panel.attributes('aria-labelledby')).toBe(
      panel.get('.mdv-rich-tooltip__title').attributes('id'),
    )
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(trigger.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(document.activeElement).toBe(host.get('[data-before]').element)
    trigger.element.focus()
    const tab = key(trigger.element, 'Tab')
    expect(tab.defaultPrevented).toBe(false)
    panel.get<HTMLAnchorElement>('a').element.focus()
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    panel.get<HTMLButtonElement>('[data-action]').element.focus()
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    host.get<HTMLButtonElement>('[data-after]').element.focus()
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(document.activeElement).toBe(host.get('[data-after]').element)
  })

  it('ignores hover and focus in persistent mode, toggles on click and closes outside', async () => {
    timers()
    const { trigger, panel, host, component } = example({ persistent: true }, true)
    pointer(trigger.element, 'pointerenter')
    trigger.element.focus()
    await vi.advanceTimersByTimeAsync(2000)
    expect(platform.opened.size).toBe(0)
    trigger.element.click()
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    pointer(trigger.element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(3000)
    expect(platform.opened.has(panel.element)).toBe(true)
    pointer(host.get('[data-after]').element, 'pointerdown')
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(component.emitted('closed')).toEqual([[{ reason: 'outside' }]])
    trigger.element.click()
    await settle()
    trigger.element.click()
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('restores the trigger from an action on Escape and supports the slot close method', async () => {
    const { trigger, panel, host, component, open } = example({ title: '说明' }, true)
    await open()
    panel.get<HTMLButtonElement>('[data-action]').element.focus()
    expect(key(panel.get('[data-action]').element, 'Escape').defaultPrevented).toBe(true)
    await settle()
    expect(document.activeElement).toBe(trigger.element)
    expect(platform.opened.size).toBe(0)
    expect(component.emitted('closed')).toEqual([[{ reason: 'escape' }]])
    await open()
    host.get<HTMLButtonElement>('[data-action]').element.click()
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('dismisses a hint before the parent menu, including forwarded menu-item attributes', async () => {
    const host = mount(MdvMenu, {
      attachTo: document.body,
      slots: {
        trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
          h('button', { ...triggerProps, 'data-menu-trigger': '' }, '菜单'),
        default: () => [
          h(
            MdvTooltip,
            { text: '项目说明' },
            {
              trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
                h(MdvMenuItem, { ...triggerProps, label: '项目' }),
            },
          ),
        ],
      },
    })
    mounted.push(host)
    host.get<HTMLButtonElement>('[data-menu-trigger]').element.click()
    await settle()
    const item = host.get<HTMLElement>('[data-mdv-menu-item]')
    const tip = host.get<HTMLElement>('[data-mdv-tooltip-panel]')
    expect(platform.opened.size).toBe(2)
    expect(item.attributes('aria-describedby')).toContain(tip.attributes('id'))
    key(item.element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(1)
    expect(host.get('[data-mdv-menu-panel]').attributes('data-phase')).toBe('open')
    key(item.element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('dismisses a hint before Dialog and closes hints outside a newly opened modal', async () => {
    const outside = example()
    await outside.open()
    const shown = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvDialog,
            {
              modelValue: shown.value,
              title: '窗口',
              role: 'dialog',
              'onUpdate:modelValue': (value: boolean) => {
                shown.value = value
              },
            },
            () =>
              h(
                MdvRichTooltip,
                { title: '说明', text: '正文' },
                {
                  trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
                    h('button', triggerProps, '帮助'),
                  actions: () => h('button', { 'data-rich-action': '' }, '操作'),
                },
              ),
          ),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    await settle()
    expect(outside.panel.element.style.display).toBe('none')
    const tip = host.getComponent(MdvRichTooltip)
    tip.vm.open()
    await settle()
    host.get<HTMLButtonElement>('[data-rich-action]').element.focus()
    key(host.get('[data-rich-action]').element, 'Escape')
    await settle()
    expect(shown.value).toBe(true)
    expect(host.get('dialog').element.open).toBe(true)
    key(host.get('button').element, 'Escape')
    await settle()
    expect(shown.value).toBe(false)
  })

  it('lets a menu opened inside Rich handle arrows and Escape before the containing hint', async () => {
    const host = mount(MdvRichTooltip, {
      props: { title: '更多帮助', persistent: true },
      attachTo: document.body,
      slots: {
        trigger: ({ triggerProps }: MdvTooltipTriggerSlotProps) =>
          h('button', { ...triggerProps, 'data-rich-trigger': '' }, '帮助'),
        default: () =>
          h(
            MdvMenu,
            {},
            {
              trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
                h('button', { ...triggerProps, 'data-inner-menu': '' }, '相关操作'),
              default: () => [
                h(MdvMenuItem, { label: '第一项' }),
                h(MdvMenuItem, { label: '第二项' }),
              ],
            },
          ),
      },
    })
    mounted.push(host)
    host.get<HTMLButtonElement>('[data-rich-trigger]').element.click()
    await settle()
    host.get<HTMLButtonElement>('[data-inner-menu]').element.click()
    await settle()
    const items = host.findAll<HTMLElement>('[data-mdv-menu-item]')
    expect(platform.opened.size).toBe(2)
    key(items[0]!.element, 'ArrowDown')
    expect(document.activeElement).toBe(items[1]!.element)
    key(items[1]!.element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(1)
    expect(host.get('[data-mdv-tooltip-panel]').attributes('data-phase')).toBe('open')
    key(host.get('[data-inner-menu]').element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(0)
  })
})
