import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MdvMenu from '../components/MdvMenu.vue'
import MdvContextMenu from '../components/MdvContextMenu.vue'
import MdvMenuItem from '../components/MdvMenuItem.vue'
import MdvMenuGroup from '../components/MdvMenuGroup.vue'
import MdvButton from '../components/MdvButton.vue'
import MdvDialog from '../components/MdvDialog.vue'
import type {
  MdvMenuModelValue,
  MdvMenuProps,
  MdvMenuSelectEvent,
  MdvMenuTriggerSlotProps,
} from '../components/menu.types'
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

function key(element: Element, value: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  element.dispatchEvent(event)
  return event
}

function pointer(element: EventTarget, type: string, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, {
    bubbles: !['pointerenter', 'pointerleave'].includes(type),
    cancelable: true,
    button: 0,
    ...init,
  })
  Object.defineProperty(event, 'pointerType', { value: 'mouse' })
  element.dispatchEvent(event)
  return event
}

function example(
  content: () => VNode[] = () => [
    h(MdvMenuItem, { label: '第一个' }),
    h(MdvMenuItem, { label: '第二个' }),
  ],
  props: MdvMenuProps & Record<string, unknown> = {},
  context = false,
) {
  const config = ref(props)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { id: 'before-menu' }, '之前'),
          h(context ? MdvContextMenu : MdvMenu, config.value, {
            trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
              h('button', { ...triggerProps, 'data-trigger': '' }, '操作'),
            default: content,
          }),
          h('button', { id: 'after-menu' }, '之后'),
        ]),
    }),
    { attachTo: document.body },
  )
  mounted.push(host)
  const trigger = host.get<HTMLButtonElement>('[data-trigger]')
  const panels = host.findAll<HTMLElement>('[data-mdv-menu-panel]')
  const panel = panels[0]!
  platform.geometry(trigger.element, { x: 120, y: 80, width: 100, height: 40 })
  for (const popup of panels) platform.geometry(popup.element, { width: 240, height: 160 })
  const component = context ? host.getComponent(MdvContextMenu) : host.getComponent(MdvMenu)
  const items = () => host.findAll<HTMLElement>('[data-mdv-menu-item]')
  async function open() {
    trigger.element.focus()
    trigger.element.click()
    await settle()
  }
  return { host, config, component, trigger, panel, panels, items, open }
}

describe('MdvMenu', () => {
  it('positions the ripple within the inset state surface', async () => {
    const { open, items } = example()
    await open()
    const control = items()[0]!
    const stateSurface = control.get<HTMLElement>('.mdv-menu-item__surface')
    const surfaceBounds = vi
      .spyOn(stateSurface.element, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(102, 102, 196, 44))
    try {
      pointer(control.element, 'pointerdown', { clientX: 114, clientY: 108 })
      await settle()
      const wave = control.get<HTMLElement>('.mdv-menu-item__ripple-wave')
      expect(wave.element.style.left).toBe('12px')
      expect(wave.element.style.top).toBe('6px')
      expect(surfaceBounds).toHaveBeenCalled()
    } finally {
      surfaceBounds.mockRestore()
    }
  })

  it('manages an omitted model internally, names its panel, positions it and preserves document scrolling', async () => {
    const { trigger, panel, component, open, items } = example()
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(panel.attributes('popover')).toBe('manual')
    expect(panel.attributes('aria-labelledby')).toBe(trigger.attributes('id'))
    expect(panel.element.style.display).toBe('none')
    expect(getComputedStyle(panel.element).display).toBe('none')
    await open()
    expect(platform.opened.has(panel.element)).toBe(true)
    expect(getComputedStyle(panel.element).display).not.toBe('none')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(trigger.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(document.activeElement).toBe(items()[0]!.element)
    expect(Number.parseFloat(panel.element.style.top)).toBeGreaterThanOrEqual(124)
    expect(panel.element.style.left).not.toBe('')
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(component.emitted('open')).toHaveLength(1)
    expect(component.emitted('opened')).toHaveLength(1)
    items()[0]!.element.click()
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(getComputedStyle(panel.element).display).toBe('none')
    expect(document.activeElement).toBe(trigger.element)
    expect(component.emitted('update:modelValue')).toEqual([[true], [false]])
    expect(component.emitted('closed')).toEqual([[{ reason: 'select' }]])
  })

  it('forwards trigger refs through MdvButton and opens with the last item on ArrowUp', async () => {
    const host = mount(MdvMenu, {
      attachTo: document.body,
      slots: {
        trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
          h(MdvButton, triggerProps, () => '更多'),
        default: () => [h(MdvMenuItem, { label: 'Alpha' }), h(MdvMenuItem, { label: 'Beta' })],
      },
    })
    mounted.push(host)
    const trigger = host.get('button')
    const event = key(trigger.element, 'ArrowUp')
    await settle()
    expect(event.defaultPrevented).toBe(true)
    expect(platform.opened.size).toBe(1)
    expect(document.activeElement).toBe(host.findAll('[data-mdv-menu-item]')[1]!.element)
    expect(host.get('[data-mdv-menu-panel]').attributes('data-mdv-input')).toBe('keyboard')
  })

  it('keeps controlled open and close requests pending until accepted by the parent', async () => {
    const { trigger, panel, config, component } = example(undefined, { modelValue: false })
    trigger.element.click()
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(component.emitted('update:modelValue')).toEqual([[true]])
    config.value = { modelValue: true }
    await settle()
    key(panel.element, 'Escape')
    await settle()
    expect(platform.opened.has(panel.element)).toBe(true)
    expect(component.emitted('close')).toBeUndefined()
    config.value = { modelValue: false }
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(component.emitted('close')).toEqual([[{ reason: 'model' }]])
  })

  it('preserves explicit ARIA and native attributes and normalizes baseline appearance', async () => {
    const { panel, config } = example(undefined, {
      modelValue: true,
      variant: 'baseline',
      layout: 'grouped',
      colorScheme: 'vibrant',
      'aria-label': '文件操作',
      dir: 'rtl',
      class: 'custom-menu',
      style: { '--mdv-menu-max-height': '260px' },
    })
    await settle()
    expect(panel.attributes('aria-label')).toBe('文件操作')
    expect(panel.attributes('aria-labelledby')).toBeUndefined()
    expect(panel.attributes('dir')).toBe('rtl')
    expect(panel.classes()).toEqual(
      expect.arrayContaining(['mdv-menu--baseline', 'mdv-menu--standard', 'custom-menu']),
    )
    expect(panel.classes()).not.toContain('mdv-menu--grouped')
    config.value = { modelValue: true, 'aria-labelledby': 'external-name' }
    await settle()
    expect(panel.attributes('aria-labelledby')).toBe('external-name')
  })

  it('includes disabled items in keyboard navigation but blocks all activation', async () => {
    const select = vi.fn<(event: MdvMenuSelectEvent) => void>()
    const click = vi.fn<(event: MouseEvent) => void>()
    const { items, open, panel } = example(() => [
      h(MdvMenuItem, { label: 'Alpha' }),
      h(MdvMenuItem, { label: 'Beta', disabled: true, onSelect: select, onClick: click }),
      h(MdvMenuItem, { label: 'Gamma' }),
    ])
    await open()
    key(items()[0]!.element, 'ArrowDown')
    expect(document.activeElement).toBe(items()[1]!.element)
    expect(items()[1]!.attributes('disabled')).toBeUndefined()
    expect(key(items()[1]!.element, 'Enter').defaultPrevented).toBe(true)
    items()[1]!.element.click()
    await settle()
    expect(select).not.toHaveBeenCalled()
    expect(click).not.toHaveBeenCalled()
    expect(platform.opened.has(panel.element)).toBe(true)
    key(items()[1]!.element, 'End')
    expect(document.activeElement).toBe(items()[2]!.element)
    key(items()[2]!.element, 'ArrowDown')
    expect(document.activeElement).toBe(items()[0]!.element)
    key(items()[0]!.element, 'Home')
    expect(document.activeElement).toBe(items()[0]!.element)
  })

  it('supports repeated-letter navigation and ignores composition and shortcuts', async () => {
    const { open, items } = example(() =>
      ['Alpha', 'Beta', 'Bravo', 'Charlie'].map((label) => h(MdvMenuItem, { label })),
    )
    await open()
    key(items()[0]!.element, 'b')
    expect(document.activeElement).toBe(items()[1]!.element)
    key(items()[1]!.element, 'b')
    expect(document.activeElement).toBe(items()[2]!.element)
    key(items()[2]!.element, 'Escape', { isComposing: true })
    key(items()[2]!.element, 'a', { ctrlKey: true })
    expect(document.activeElement).toBe(items()[2]!.element)
    expect(platform.opened.size).toBe(1)
  })

  it.each([false, true])(
    'exits on Tab with backward=%s instead of trapping focus in the menu',
    async (backward) => {
      const { host, open, items, component } = example()
      await open()
      const event = key(items()[0]!.element, 'Tab', { shiftKey: backward })
      await settle()
      expect(event.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(
        host.get(backward ? '#before-menu' : '#after-menu').element,
      )
      expect(component.emitted('closed')).toEqual([[{ reason: 'tab' }]])
      expect(platform.opened.size).toBe(0)
    },
  )

  it('allows native Tab at the document boundary', async () => {
    const { host, open, items, trigger } = example()
    host.get('#after-menu').element.remove()
    await open()
    const event = key(items()[0]!.element, 'Tab')
    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('does not restore focus after an outside pointer or a business focus change', async () => {
    const { host, open, component } = example()
    await open()
    const outside = host.get<HTMLButtonElement>('#after-menu')
    pointer(outside.element, 'pointerdown')
    outside.element.focus()
    await settle()
    expect(document.activeElement).toBe(outside.element)
    expect(component.emitted('closed')).toEqual([[{ reason: 'outside' }]])
    await open()
    outside.element.focus()
    await settle()
    expect(document.activeElement).toBe(outside.element)
    expect(component.emitted('closed')?.[1]).toEqual([{ reason: 'focus-out' }])
  })

  it('cancels selection and link navigation synchronously without closing', async () => {
    const select = vi.fn<(event: MdvMenuSelectEvent) => void>((event) => event.preventDefault())
    const { open, items, component, host } = example(() => [
      h(MdvMenuItem, {
        label: '链接',
        href: '#destination',
        target: '_blank',
        rel: 'noopener',
        onSelect: select,
      }),
    ])
    await open()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    items()[0]!.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(select).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        detail: { value: undefined, selected: false, originalEvent: event },
      }),
    )
    expect(items()[0]!.element.tagName).toBe('A')
    expect(items()[0]!.attributes('target')).toBe('_blank')
    expect(host.getComponent(MdvMenuItem).emitted('select')).toHaveLength(1)
    expect(component.emitted('close')).toBeUndefined()
    expect(platform.opened.size).toBe(1)
  })

  it('preserves a business focus target after an action closes the menu', async () => {
    const { host, open, items } = example(() => [
      h(MdvMenuItem, {
        id: 'custom-action',
        label: '转移焦点',
        onSelect: () => document.querySelector<HTMLButtonElement>('#after-menu')?.focus(),
      }),
    ])
    await open()
    items()[0]!.element.click()
    await settle()
    expect(items()[0]!.attributes('id')).toBe('custom-action')
    expect(document.activeElement).toBe(host.get('#after-menu').element)
    expect(platform.opened.size).toBe(0)
  })

  it('uses strict single values and accepts a keepOpen override', async () => {
    const value = ref<MdvMenuModelValue>(1)
    const { host, items, open } = example(() => [
      h(
        MdvMenuGroup,
        {
          modelValue: value.value,
          selectionMode: 'single',
          label: '数值',
          'onUpdate:modelValue': (next: MdvMenuModelValue) => {
            value.value = next
          },
        },
        () => [
          h(MdvMenuItem, { label: '数字', value: 1, keepOpen: true }),
          h(MdvMenuItem, { label: '字符串', value: '1', keepOpen: true }),
        ],
      ),
    ])
    await open()
    expect(items().map((item) => item.attributes('aria-checked'))).toEqual(['true', 'false'])
    expect(items().map((item) => item.attributes('role'))).toEqual([
      'menuitemradio',
      'menuitemradio',
    ])
    items()[1]!.element.click()
    await settle()
    expect(value.value).toBe('1')
    expect(items().map((item) => item.attributes('aria-checked'))).toEqual(['false', 'true'])
    const group = host.getComponent(MdvMenuGroup)
    expect(group.attributes('aria-labelledby')).toBe(
      group.get('.mdv-menu-group__label').attributes('id'),
    )
    expect(platform.opened.size).toBe(1)
  })

  it('manages independent uncontrolled multiple groups and closes single selection by default', async () => {
    const { open, items, host } = example(() => [
      h(MdvMenuGroup, { selectionMode: 'multiple' }, () => [
        h(MdvMenuItem, { label: 'A', value: 'a' }),
        h(MdvMenuItem, { label: 'B', value: 'b' }),
      ]),
      h(MdvMenuGroup, { selectionMode: 'single' }, () => [
        h(MdvMenuItem, { label: 'C', value: 'c' }),
      ]),
    ])
    await open()
    items()[0]!.element.click()
    items()[1]!.element.click()
    await settle()
    expect(items().map((item) => item.attributes('aria-checked'))).toEqual([
      'true',
      'true',
      'false',
    ])
    expect(platform.opened.size).toBe(1)
    items()[0]!.element.click()
    await settle()
    expect(host.findAllComponents(MdvMenuGroup)[0]!.emitted('change')).toEqual([
      [['a']],
      [['a', 'b']],
      [['b']],
    ])
    items()[2]!.element.click()
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('leaves rejected group changes unselected and does not update cancelled selections', async () => {
    const cancel = vi.fn<(event: MdvMenuSelectEvent) => void>((event) => event.preventDefault())
    const { open, items, host } = example(() => [
      h(MdvMenuGroup, { modelValue: ['a'], selectionMode: 'multiple' }, () => [
        h(MdvMenuItem, { value: 'a', label: 'A' }),
        h(MdvMenuItem, { value: 'b', label: 'B', onSelect: cancel }),
      ]),
    ])
    await open()
    items()[0]!.element.click()
    items()[1]!.element.click()
    await settle()
    expect(items().map((item) => item.attributes('aria-checked'))).toEqual(['true', 'false'])
    expect(host.getComponent(MdvMenuGroup).emitted('update:modelValue')).toEqual([[[]]])
    expect(platform.opened.size).toBe(1)
  })

  it('associates supporting content and lets custom slots reflect selected state', async () => {
    const { open, host, items } = example(() => [
      h(MdvMenuGroup, { selectionMode: 'single', modelValue: 'a' }, () => [
        h(
          MdvMenuItem,
          { value: 'a', supportingText: '辅助内容', 'aria-describedby': 'external' },
          {
            default: ({ selected }: { selected: boolean }) => [
              h('span', selected ? '已选' : '未选'),
            ],
            leading: () => [h('span', { 'data-leading': '' }, '图')],
            trailing: () => [h('span', { 'data-trailing': '' }, '尾')],
          },
        ),
      ]),
    ])
    await open()
    expect(items()[0]!.attributes('aria-describedby')).toBe(
      'external ' + host.get('.mdv-menu-item__supporting').attributes('id'),
    )
    expect(host.get('.mdv-menu-item__label').text()).toBe('已选')
    expect(host.find('[data-leading]').exists()).toBe(false)
    expect(host.get('[data-trailing]').text()).toBe('尾')
    expect(items()[0]!.find('svg').exists()).toBe(true)
  })

  it('opens three levels, keeps selection groups local and closes one level per Escape', async () => {
    const { open, panels, items, trigger } = example(() => [
      h(MdvMenuGroup, { selectionMode: 'multiple', modelValue: ['leaf'] }, () => [
        h(
          MdvMenuItem,
          { label: 'First', value: 'leaf' },
          {
            children: () => [
              h(
                MdvMenuItem,
                { label: 'Second' },
                { children: () => [h(MdvMenuItem, { label: 'Leaf', value: 'leaf' })] },
              ),
            ],
          },
        ),
      ]),
    ])
    await open()
    key(items()[0]!.element, 'ArrowRight')
    await settle()
    expect(platform.opened.size).toBe(2)
    expect(document.activeElement).toBe(items()[1]!.element)
    key(items()[1]!.element, 'ArrowRight')
    await settle()
    expect(platform.opened.size).toBe(3)
    expect(items()[2]!.attributes('role')).toBe('menuitem')
    key(items()[2]!.element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(2)
    expect(document.activeElement).toBe(items()[1]!.element)
    key(items()[1]!.element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(1)
    expect(document.activeElement).toBe(items()[0]!.element)
    key(panels[0]!.element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('reverses submenu keyboard direction in RTL', async () => {
    const { open, panels, items } = example(
      () => [
        h(MdvMenuItem, { label: '父项' }, { children: () => [h(MdvMenuItem, { label: '子项' })] }),
      ],
      { dir: 'rtl', style: { direction: 'rtl' } },
    )
    // jsdom 不做 CSS direction 继承；为子面板补齐浏览器实际的计算方向。
    panels[1]!.element.style.direction = 'rtl'
    await open()
    key(items()[0]!.element, 'ArrowLeft')
    await settle()
    expect(platform.opened.size).toBe(2)
    key(items()[1]!.element, 'ArrowRight')
    await settle()
    expect(platform.opened.size).toBe(1)
    expect(document.activeElement).toBe(items()[0]!.element)
  })

  it('provides a keyboard-reachable back action for push submenus', async () => {
    const { open, host, items, panel } = example(
      () => [
        h(MdvMenuItem, { label: '格式' }, { children: () => [h(MdvMenuItem, { label: '字体' })] }),
      ],
      { submenuMode: 'push' },
    )
    await open()
    items()[0]!.element.click()
    await settle()
    const back = host.get<HTMLButtonElement>('.mdv-menu__back')
    expect(panel.classes()).toContain('mdv-menu--obscured')
    expect(back.attributes('role')).toBe('menuitem')
    expect(document.activeElement).toBe(back.element)
    key(back.element, 'ArrowDown')
    expect(document.activeElement).toBe(items()[1]!.element)
    back.element.click()
    await settle()
    expect(panel.classes()).not.toContain('mdv-menu--obscured')
    expect(document.activeElement).toBe(items()[0]!.element)
    expect(platform.opened.size).toBe(1)
  })

  it('delays mouse opening and protects movement toward the submenu', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const { open, host, panels } = example(() => [
      h(MdvMenuItem, { label: '父项' }, { children: () => [h(MdvMenuItem, { label: '子项' })] }),
    ])
    await open()
    const parent = host.findAll('.mdv-menu-item')[0]!
    const child = panels[1]!
    platform.geometry(child.element, { x: 300, y: 80, width: 240, height: 160 })
    platform.geometry(parent.get<HTMLElement>('[data-mdv-menu-item]').element, {
      x: 120,
      y: 80,
      width: 176,
      height: 48,
    })
    pointer(parent.element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(129)
    expect(platform.opened.size).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(platform.opened.size).toBe(2)
    pointer(parent.element, 'pointerleave', { clientX: 296, clientY: 104 })
    await vi.advanceTimersByTimeAsync(200)
    pointer(document, 'pointermove', { clientX: 298, clientY: 110 })
    await vi.advanceTimersByTimeAsync(200)
    expect(platform.opened.size).toBe(2)
    pointer(child.element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(800)
    expect(platform.opened.size).toBe(2)
  })

  it('switches overflowing grouped menus to scrolling and restores gaps when space returns', async () => {
    const { panel, open } = example(
      () => [h(MdvMenuGroup, { label: '分组' }, () => h(MdvMenuItem, { label: '内容' }))],
      { layout: 'grouped' },
    )
    const viewport = panel.get<HTMLElement>('.mdv-menu__viewport')
    platform.geometry(viewport.element, { width: 240, height: 100 })
    platform.scrollHeight(viewport.element, 360)
    await open()
    expect(panel.classes()).toContain('mdv-menu--scrolling')
    expect(panel.classes()).not.toContain('mdv-menu--grouped')
    platform.scrollHeight(viewport.element, 100)
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(panel.classes()).toContain('mdv-menu--grouped')
    expect(panel.classes()).not.toContain('mdv-menu--scrolling')
  })

  it('repositions and flips a virtual context anchor near viewport edges', async () => {
    const { trigger, panel } = example(undefined, {}, true)
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 1018,
      clientY: 760,
      button: 2,
    })
    trigger.element.dispatchEvent(event)
    await settle()
    expect(event.defaultPrevented).toBe(true)
    expect(platform.opened.size).toBe(1)
    expect(Number.parseFloat(panel.element.style.left)).toBeLessThanOrEqual(776)
    expect(Number.parseFloat(panel.element.style.top)).toBeLessThan(760)
    expect(Number.parseFloat(panel.element.style.left)).toBeGreaterThanOrEqual(8)
  })

  it.each(['ContextMenu', 'F10'])('opens a keyboard context menu with %s', async (name) => {
    const { trigger, items } = example(undefined, {}, true)
    const event = key(trigger.element, name, { shiftKey: name === 'F10' })
    await settle()
    expect(event.defaultPrevented).toBe(true)
    expect(platform.opened.size).toBe(1)
    expect(document.activeElement).toBe(items()[0]!.element)
  })

  it('retains local DOM ancestry and makes Escape and Tab cooperate with Dialog', async () => {
    const visible = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('section', { 'data-mdv-theme': 'dark' }, [
            h(
              MdvDialog,
              {
                modelValue: visible.value,
                title: '编辑',
                'onUpdate:modelValue': (value: boolean) => {
                  visible.value = value
                },
              },
              {
                default: () => [
                  h(
                    MdvMenu,
                    {},
                    {
                      trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
                        h('button', { ...triggerProps, 'data-trigger': '' }, '操作'),
                      default: () => [h(MdvMenuItem, { label: '内容' })],
                    },
                  ),
                  h('button', { id: 'dialog-next' }, '下一步'),
                ],
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    await settle()
    const trigger = host.get<HTMLButtonElement>('[data-trigger]')
    trigger.element.click()
    await settle()
    const item = host.get('[data-mdv-menu-item]')
    expect(item.element.closest('dialog')).toBe(host.get('dialog').element)
    expect(item.element.closest('[data-mdv-theme]')?.getAttribute('data-mdv-theme')).toBe('dark')
    key(item.element, 'Escape')
    await settle()
    expect(visible.value).toBe(true)
    expect(platform.opened.size).toBe(0)
    trigger.element.click()
    await settle()
    key(item.element, 'Tab')
    await settle()
    expect(document.activeElement).toBe(host.get('#dialog-next').element)
    key(trigger.element, 'Escape')
    await settle()
    expect(visible.value).toBe(false)
  })

  it.each([false, true])(
    'hands focus to a new modal and returns to the trigger with keepOpen=%s',
    async (keepOpen) => {
      const visible = ref(false)
      const host = mount(
        defineComponent({
          setup: () => () =>
            h('main', [
              h(
                MdvMenu,
                {},
                {
                  trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
                    h('button', { ...triggerProps, 'data-trigger': '' }, '操作'),
                  default: () => [
                    h(MdvMenuItem, {
                      label: '打开弹窗',
                      keepOpen,
                      onSelect: () => {
                        visible.value = true
                      },
                    }),
                  ],
                },
              ),
              h(
                MdvDialog,
                {
                  modelValue: visible.value,
                  title: '确认',
                  'onUpdate:modelValue': (value: boolean) => {
                    visible.value = value
                  },
                },
                { default: () => h('button', { id: 'modal-action' }, '确认') },
              ),
            ]),
        }),
        { attachTo: document.body },
      )
      mounted.push(host)
      host.get<HTMLButtonElement>('[data-trigger]').element.click()
      await settle()
      host.get<HTMLElement>('[data-mdv-menu-item]').element.click()
      await settle()
      expect(platform.opened.size).toBe(0)
      expect(document.activeElement).toBe(host.get('#modal-action').element)
      expect(visible.value).toBe(true)
      visible.value = false
      await settle()
      expect(document.activeElement).toBe(host.get('[data-trigger]').element)
    },
  )

  it('cleans open popovers and timers on KeepAlive deactivation and unmount', async () => {
    const active = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, {}, () =>
            active.value
              ? h(
                  MdvMenu,
                  { modelValue: true },
                  {
                    trigger: ({ triggerProps }: MdvMenuTriggerSlotProps) =>
                      h('button', triggerProps, '操作'),
                    default: () => [h(MdvMenuItem, { label: '内容' })],
                  },
                )
              : null,
          ),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    await settle()
    expect(platform.opened.size).toBe(1)
    active.value = false
    await settle()
    expect(platform.opened.size).toBe(0)
    active.value = true
    await settle()
    expect(platform.opened.size).toBe(1)
    host.unmount()
    mounted.pop()
    expect(platform.opened.size).toBe(0)
    const event = key(document.body, 'Escape')
    expect(event.defaultPrevented).toBe(false)
  })

  it('reverses an in-flight animation and cancels it when reduced motion changes', async () => {
    platform.enableAnimations()
    const { trigger, panel, component } = example()
    trigger.element.click()
    await settle()
    expect(panel.attributes('data-phase')).toBe('opening')
    trigger.element.click()
    await settle()
    expect(panel.attributes('data-phase')).toBe('closing')
    trigger.element.click()
    await settle()
    expect(platform.opened.size).toBe(1)
    expect(panel.attributes('data-phase')).toBe('opening')
    platform.media('(prefers-reduced-motion: reduce)', true)
    await settle()
    expect(panel.attributes('data-phase')).toBe('open')
    expect(component.emitted('opened')).toHaveLength(1)
    key(panel.element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(0)
    expect(component.emitted('closed')).toHaveLength(1)
  })
})
