import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNodeChild } from 'vue'
import MdvModalNavigationDrawer from '../components/MdvModalNavigationDrawer.vue'
import MdvNavigationDrawerItem from '../components/MdvNavigationDrawerItem.vue'
import MdvNavigationDrawerGroup from '../components/MdvNavigationDrawerGroup.vue'
import MdvDialog from '../components/MdvDialog.vue'
import { topDialog } from '../components/dialog-modal'
import type {
  MdvModalNavigationDrawerProps,
  MdvNavigationDrawerSlotProps,
} from '../components/navigation-drawer.types'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
const hosts = new Set<{ unmount(): void }>()
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(async () => {
  hosts.forEach((host) => host.unmount())
  hosts.clear()
  await flushPromises()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})
function example(
  props: MdvModalNavigationDrawerProps & { dir?: string } = {},
  slots: Record<string, (scope: MdvNavigationDrawerSlotProps) => VNodeChild> = {},
) {
  const visible = ref(props.modelValue ?? false)
  const accept = ref(true)
  const config = ref(props)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h('main', [
          h(
            'button',
            {
              id: 'trigger',
              onClick: () => {
                visible.value = true
              },
            },
            '打开',
          ),
          h(
            MdvModalNavigationDrawer,
            {
              ...config.value,
              modelValue: visible.value,
              'onUpdate:modelValue': (value: boolean) => {
                if (accept.value) visible.value = value
              },
            },
            {
              default: () => [
                h(MdvNavigationDrawerItem, { label: '首页', active: true }),
                h(MdvNavigationDrawerItem, { label: '探索' }),
              ],
              ...slots,
            },
          ),
        ]),
    }),
    { attachTo: document.body },
  )
  hosts.add(host)
  return { host, drawer: host.getComponent(MdvModalNavigationDrawer), visible, accept, config }
}
async function open(host: ReturnType<typeof example>['host']) {
  const trigger = host.get<HTMLButtonElement>('#trigger')
  trigger.element.focus()
  await trigger.trigger('click')
  await flushPromises()
}
function pointer(target: EventTarget, type: string, x: number, time: number, y = 40, id = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  })
  Object.defineProperties(event, {
    pointerId: { value: id },
    isPrimary: { value: true },
    timeStamp: { value: time },
  })
  target.dispatchEvent(event)
  return event
}
function bounds(element: Element) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 360,
    bottom: 800,
    width: 360,
    height: 800,
    toJSON() {},
  })
}

describe('MdvModalNavigationDrawer', () => {
  it('opens in the modal stack, traps Tab, labels the dialog and restores the trigger on selection', async () => {
    const { host, drawer } = example({ title: '邮箱' })
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    await open(host)
    const dialog = drawer.get<HTMLDialogElement>('dialog')
    const buttons = dialog.findAll('nav button')
    expect(dialog.attributes('aria-labelledby')).toBe(drawer.get('header').attributes('id'))
    expect(topDialog(document)).toBe(dialog.element)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(buttons[0]!.element)
    await buttons[0]!.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(buttons[1]!.element)
    await buttons[1]!.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(buttons[0]!.element)
    await buttons[1]!.trigger('click')
    await flushPromises()
    expect(dialog.element.open).toBe(false)
    expect(drawer.emitted('close')).toEqual([[{ reason: 'select' }]])
    expect(drawer.emitted('closed')).toEqual([[{ reason: 'select' }]])
    expect(drawer.emitted('open')).toHaveLength(1)
    expect(drawer.emitted('opened')).toHaveLength(1)
    expect(document.activeElement).toBe(host.get('#trigger').element)
    expect(document.documentElement.style.overflow).toBe('')
    expect(topDialog(document)).toBeNull()
  })

  it('handles Escape and complete outside presses while respecting all close switches', async () => {
    const { host, drawer, config } = example({
      closeOnEsc: false,
      closeOnScrim: false,
      closeOnSelect: false,
    })
    await open(host)
    const dialog = drawer.get<HTMLDialogElement>('dialog')
    await dialog.get('nav button').trigger('click')
    await dialog.trigger('keydown', { key: 'Escape' })
    const scrim = drawer.get('.mdv-navigation-drawer__scrim').element
    pointer(scrim, 'pointerdown', 700, 0)
    pointer(scrim, 'pointerup', 700, 30)
    await flushPromises()
    expect(dialog.element.open).toBe(true)
    expect(drawer.emitted('update:modelValue')).toBeUndefined()
    config.value.closeOnEsc = true
    await nextTick()
    await dialog.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(drawer.emitted('closed')).toEqual([[{ reason: 'escape' }]])
    await open(host)
    config.value.closeOnScrim = true
    await nextTick()
    pointer(drawer.get('nav').element, 'pointerdown', 300, 100)
    pointer(scrim, 'pointerup', 700, 110)
    await flushPromises()
    expect(dialog.element.open).toBe(true)
    pointer(scrim, 'pointerdown', 700, 200)
    pointer(scrim, 'pointerup', 700, 240)
    await flushPromises()
    expect(drawer.emitted('closed')?.[1]).toEqual([{ reason: 'scrim' }])
  })

  it('preserves native cancellation, modified links, downloads and disclosure controls', async () => {
    const cancel = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const { host, drawer } = example(
      {},
      {
        default: () => [
          h(MdvNavigationDrawerItem, { label: '取消', onClick: cancel }),
          h(MdvNavigationDrawerItem, { label: '新窗口', href: '#new', target: '_blank' }),
          h(MdvNavigationDrawerItem, { label: '下载', href: '#download', download: 'file.txt' }),
          h(MdvNavigationDrawerItem, { label: '普通链接', href: '#page' }),
          h(MdvNavigationDrawerItem, { label: '禁用', disabled: true }),
          h(
            MdvNavigationDrawerGroup,
            { label: '分组', collapsible: true },
            { default: () => h(MdvNavigationDrawerItem, { label: '子目的地' }) },
          ),
        ],
      },
    )
    await open(host)
    const rows = drawer.findAll('[data-mdv-drawer-control]')
    await rows[0]!.trigger('click')
    await rows[1]!.trigger('click')
    await rows[2]!.trigger('click')
    await rows[3]!.trigger('click', { ctrlKey: true })
    await rows[3]!.trigger('click', { shiftKey: true })
    await rows[4]!.trigger('click')
    await rows[5]!.trigger('click')
    await flushPromises()
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(drawer.emitted('update:modelValue')).toBeUndefined()
    expect(cancel).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(rows[5]!.attributes('aria-expanded')).toBe('false')
    await rows[3]!.trigger('click')
    await flushPromises()
    expect(drawer.emitted('closed')).toEqual([[{ reason: 'select' }]])
  })

  it('respects cancellation on the bubbling chain before requesting a close', async () => {
    const { host, drawer } = example(
      {},
      {
        default: () =>
          h('li', { onClick: (event: MouseEvent) => event.preventDefault() }, [
            h('ul', [h(MdvNavigationDrawerItem, { label: '冒泡取消' })]),
          ]),
      },
    )
    await open(host)
    await drawer.get('nav button').trigger('click')
    await flushPromises()
    expect(drawer.emitted('update:modelValue')).toBeUndefined()
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(true)
  })

  it('coalesces asynchronous guards, respects parent rejection and invalidates stale close requests', async () => {
    let resolve!: (value: boolean) => void
    const beforeClose = vi.fn<NonNullable<MdvModalNavigationDrawerProps['beforeClose']>>(
      () =>
        new Promise<boolean>((yes) => {
          resolve = yes
        }),
    )
    const { host, drawer, visible, accept } = example({ beforeClose })
    await open(host)
    const first = drawer.vm.close()
    const second = drawer.vm.close()
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(beforeClose.mock.calls[0]?.[0]).toEqual({ reason: 'action' })
    expect(Object.isFrozen(beforeClose.mock.calls[0]?.[0])).toBe(true)
    resolve(false)
    expect(await first).toBe(false)
    expect(await second).toBe(false)
    accept.value = false
    const rejected = drawer.vm.close()
    resolve(true)
    expect(await rejected).toBe(false)
    expect(visible.value).toBe(true)
    expect(topDialog(document)).toBe(drawer.get('dialog').element)
    const stale = drawer.vm.close()
    visible.value = false
    await flushPromises()
    await open(host)
    resolve(true)
    expect(await stale).toBe(false)
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(true)
  })

  it('keeps nested dialog focus and keyboard ownership, and restores each trigger in order', async () => {
    const nested = ref(false)
    const { host, drawer } = example(
      {},
      {
        footer: () => [
          h(
            'button',
            {
              id: 'nested-trigger',
              onClick: () => {
                nested.value = true
              },
            },
            '确认',
          ),
          h(
            MdvDialog,
            {
              modelValue: nested.value,
              title: '确认',
              'onUpdate:modelValue': (value: boolean) => {
                nested.value = value
              },
            },
            { default: () => h('button', { id: 'nested-action' }, '完成') },
          ),
        ],
      },
    )
    await open(host)
    const trigger = drawer.get<HTMLButtonElement>('#nested-trigger')
    trigger.element.focus()
    await trigger.trigger('click')
    await flushPromises()
    const action = drawer.get<HTMLButtonElement>('#nested-action')
    expect(document.activeElement).toBe(action.element)
    await action.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(action.element)
    expect(await drawer.vm.close()).toBe(false)
    await action.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(document.activeElement).toBe(trigger.element)
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    await trigger.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(document.activeElement).toBe(host.get('#trigger').element)
  })

  it('follows a closing swipe and scrim, releases on window pointerup and suppresses its trailing click', async () => {
    const { host, drawer, accept } = example()
    await open(host)
    const panel = drawer.get<HTMLElement>('.mdv-modal-navigation-drawer__panel')
    bounds(panel.element)
    const row = drawer.get('nav button')
    accept.value = false
    pointer(row.element, 'pointerdown', 300, 0)
    pointer(window, 'pointermove', 60, 1000)
    await nextTick()
    expect(panel.classes()).toContain('mdv-modal-navigation-drawer__panel--dragging')
    expect(panel.element.style.transform).toContain('-66.666')
    expect(
      Number(drawer.get<HTMLElement>('.mdv-navigation-drawer__scrim').element.style.opacity),
    ).toBeCloseTo(1 / 3)
    pointer(window, 'pointerup', 60, 1300)
    await flushPromises()
    expect(panel.classes()).not.toContain('mdv-modal-navigation-drawer__panel--dragging')
    expect(panel.element.style.transform).toBe('translateX(0%)')
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(drawer.emitted('closed')).toBeUndefined()
    const trailing = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })
    row.element.dispatchEvent(trailing)
    await flushPromises()
    expect(trailing.defaultPrevented).toBe(true)
    expect(drawer.emitted('update:modelValue')).toHaveLength(1)
    accept.value = true
    row.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }),
    )
    await flushPromises()
    expect(drawer.emitted('closed')).toEqual([[{ reason: 'select' }]])
    await open(host)
    pointer(row.element, 'pointerdown', 300, 2000)
    pointer(window, 'pointermove', 40, 3000)
    pointer(window, 'pointerup', 40, 3300)
    await flushPromises()
    expect(drawer.emitted('closed')?.[1]).toEqual([{ reason: 'swipe' }])
  })

  it('accepts a short closing fling without requiring half the drawer width', async () => {
    const { host, drawer } = example()
    await open(host)
    const panel = drawer.get('.mdv-modal-navigation-drawer__panel').element
    bounds(panel)
    pointer(panel, 'pointerdown', 300, 0)
    pointer(window, 'pointermove', 240, 80)
    pointer(window, 'pointerup', 240, 90)
    await flushPromises()
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    expect(drawer.emitted('closed')).toEqual([[{ reason: 'swipe' }]])
  })

  it('keeps vertical scrolling and controls native, and springs back from short or cancelled gestures', async () => {
    const { host, drawer } = example({}, { footer: () => h('input', { 'aria-label': '搜索' }) })
    await open(host)
    const panel = drawer.get<HTMLElement>('.mdv-modal-navigation-drawer__panel')
    bounds(panel.element)
    pointer(drawer.get('input').element, 'pointerdown', 300, 0)
    expect(pointer(window, 'pointermove', 20, 500).defaultPrevented).toBe(false)
    pointer(window, 'pointerup', 20, 700)
    pointer(panel.element, 'pointerdown', 300, 1000)
    expect(pointer(window, 'pointermove', 280, 1400, 180).defaultPrevented).toBe(false)
    pointer(window, 'pointerup', 280, 1500, 180)
    pointer(panel.element, 'pointerdown', 300, 2000)
    pointer(window, 'pointermove', 260, 2500)
    pointer(window, 'pointerup', 260, 2800)
    await flushPromises()
    expect(panel.element.style.transform).toBe('translateX(0%)')
    pointer(panel.element, 'pointerdown', 300, 3000)
    pointer(window, 'pointermove', 30, 3500)
    pointer(window, 'pointercancel', 30, 3600)
    await flushPromises()
    expect(panel.element.style.transform).toBe('translateX(0%)')
    pointer(drawer.get('input').element, 'pointerdown', 100, 4000)
    const inputClick = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })
    drawer.get('input').element.dispatchEvent(inputClick)
    expect(inputClick.defaultPrevented).toBe(false)
    expect(drawer.emitted('update:modelValue')).toBeUndefined()
    expect(drawer.get<HTMLDialogElement>('dialog').element.open).toBe(true)
  })

  it('mirrors swipe direction in RTL and disables gesture handling when requested', async () => {
    const { host, drawer, config } = example({ dir: 'rtl' })
    await open(host)
    const dialog = drawer.get<HTMLDialogElement>('dialog')
    dialog.element.style.direction = 'rtl'
    const panel = drawer.get('.mdv-modal-navigation-drawer__panel')
    bounds(panel.element)
    config.value.closeOnSwipe = false
    await nextTick()
    pointer(panel.element, 'pointerdown', 40, 0)
    expect(pointer(window, 'pointermove', 300, 500).defaultPrevented).toBe(false)
    pointer(window, 'pointerup', 300, 800)
    expect(dialog.element.open).toBe(true)
    config.value.closeOnSwipe = true
    await nextTick()
    pointer(panel.element, 'pointerdown', 40, 1000)
    pointer(window, 'pointermove', 300, 1500)
    pointer(window, 'pointerup', 300, 1800)
    await flushPromises()
    expect(dialog.element.open).toBe(false)
    expect(drawer.emitted('closed')).toEqual([[{ reason: 'swipe' }]])
  })

  it('retains closed content by default, destroys it on request, and cleans active listeners on unmount', async () => {
    const beforeClose = vi.fn<() => boolean>(() => true)
    const { host, drawer, visible, config } = example({ beforeClose })
    await open(host)
    const button = drawer.get('nav button').element
    visible.value = false
    await flushPromises()
    expect(drawer.get('nav button').element).toBe(button)
    config.value.destroyOnClose = true
    await flushPromises()
    expect(drawer.find('nav').exists()).toBe(false)
    await open(host)
    const panel = drawer.get('.mdv-modal-navigation-drawer__panel').element
    bounds(panel)
    pointer(panel, 'pointerdown', 300, 0)
    pointer(window, 'pointermove', 60, 500)
    host.unmount()
    hosts.delete(host)
    pointer(window, 'pointerup', 30, 800)
    await flushPromises()
    expect(beforeClose).not.toHaveBeenCalled()
    expect(topDialog(document)).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('releases and reacquires modal ownership through KeepAlive', async () => {
    const shown = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () =>
              shown.value
                ? h(
                    MdvModalNavigationDrawer,
                    { key: 'drawer', modelValue: true },
                    { default: () => h(MdvNavigationDrawerItem, { label: '首页' }) },
                  )
                : h('div'),
          }),
      }),
      { attachTo: document.body },
    )
    hosts.add(host)
    await flushPromises()
    expect(topDialog(document)).toBe(host.get('dialog').element)
    shown.value = false
    await flushPromises()
    expect(topDialog(document)).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
    shown.value = true
    await flushPromises()
    expect(topDialog(document)).toBe(host.get('dialog').element)
    expect(document.activeElement).toBe(host.get('nav button').element)
  })
})
