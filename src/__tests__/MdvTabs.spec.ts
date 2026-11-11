import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import MdvTabs from '../components/MdvTabs.vue'
import MdvTab from '../components/MdvTab.vue'
import MdvTabPanel from '../components/MdvTabPanel.vue'
import MdvBadge from '../components/MdvBadge.vue'
import type { MdvTabValue, MdvTabsProps } from '../components/tabs.types'

const wrappers: Array<{ unmount: () => void }> = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function settle() {
  await nextTick()
  await nextTick()
  await nextTick()
}

function example(props: MdvTabsProps = {}) {
  const wrapper = mount(MdvTabs, {
    props,
    attrs: { 'aria-label': '内容分类' },
    attachTo: document.body,
    slots: {
      default: () => [
        h(MdvTab, { value: 'a', label: '概览' }),
        h(MdvTab, { value: 'b', label: '详细信息' }),
        h(MdvTab, { value: 'c', label: '不可用', disabled: true }),
      ],
      panels: () => [
        h(MdvTabPanel, { value: 'a' }, () => h('p', '概览内容')),
        h(MdvTabPanel, { value: 'b' }, () => h('input', { 'aria-label': '备注' })),
        h(MdvTabPanel, { value: 'c' }, () => '暂不可用'),
      ],
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('MdvTabs', () => {
  it('shows the bottom divider by default and allows disabling it', async () => {
    const wrapper = example()
    expect(wrapper.classes()).not.toContain('mdv-tabs--no-divider')
    await wrapper.setProps({ showDivider: false })
    expect(wrapper.classes()).toContain('mdv-tabs--no-divider')
    await wrapper.setProps({ showDivider: true })
    expect(wrapper.classes()).not.toContain('mdv-tabs--no-divider')
  })

  it('selects the first enabled item without an initial emission and associates sibling panels', async () => {
    const wrapper = example()
    await settle()
    const tabs = wrapper.findAll('[role="tab"]')
    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(tabs.map((tab) => tab.attributes('aria-selected'))).toEqual(['true', 'false', 'false'])
    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('内容分类')
    expect(wrapper.get('[role="tablist"]').find('[role="tabpanel"]').exists()).toBe(false)
    expect(tabs[0]!.attributes('aria-controls')).toBe(panels[0]!.attributes('id'))
    expect(panels[0]!.attributes('aria-labelledby')).toBe(tabs[0]!.attributes('id'))
    expect(panels[0]!.attributes('hidden')).toBeUndefined()
    expect(panels[1]!.attributes('inert')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('commits one original click and does not deselect a selected tab or submit its form', async () => {
    const submit = vi.fn<(event: SubmitEvent) => void>()
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('form', { onSubmit: submit }, [
            h(MdvTabs, null, {
              default: () => [
                h(MdvTab, { value: 'a', label: '一' }),
                h(MdvTab, { value: 'b', label: '二' }),
              ],
              panels: () => [h(MdvTabPanel, { value: 'a' }), h(MdvTabPanel, { value: 'b' })],
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    wrappers.push(wrapper)
    const group = wrapper.getComponent(MdvTabs)
    const second = wrapper.findAll<HTMLButtonElement>('[role="tab"]')[1]!
    second.element.click()
    await settle()
    second.element.click()
    await settle()
    expect(group.emitted('update:modelValue')).toEqual([['b']])
    expect(group.emitted('change')).toEqual([['b']])
    expect(second.attributes('aria-selected')).toBe('true')
    expect(second.attributes('type')).toBe('button')
    expect(submit).not.toHaveBeenCalled()
  })

  it('keeps a rejected controlled value and emits change only after an accepted user request', async () => {
    const wrapper = example({ modelValue: 'a' })
    wrapper.findAll<HTMLButtonElement>('[role="tab"]')[1]!.element.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.findAll('[role="tab"]')[0]!.attributes('aria-selected')).toBe('true')
    await wrapper.setProps({
      'onUpdate:modelValue': (value: MdvTabValue) => {
        void wrapper.setProps({ modelValue: value })
      },
    })
    wrapper.findAll<HTMLButtonElement>('[role="tab"]')[1]!.element.click()
    await settle()
    expect(wrapper.emitted('change')).toEqual([['b']])
    await wrapper.setProps({ modelValue: 'a' })
    expect(wrapper.emitted('change')).toEqual([['b']])
  })

  it('preserves native event objects and respects cancelled activation and navigation', async () => {
    const cancel = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const cancelKey = vi.fn<(event: KeyboardEvent) => void>((event) => event.preventDefault())
    const wrapper = mount(MdvTabs, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(MdvTab, { value: 'a', label: '一', onKeydown: cancelKey }),
          h(MdvTab, { value: 'b', label: '二', onClick: cancel }),
        ],
        panels: () => [h(MdvTabPanel, { value: 'a' }), h(MdvTabPanel, { value: 'b' })],
      },
    })
    wrappers.push(wrapper)
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    tabs[1]!.element.click()
    tabs[0]!.element.focus()
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
    await settle()
    expect(cancel).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(cancelKey).toHaveBeenCalledExactlyOnceWith(expect.any(KeyboardEvent))
    expect(document.activeElement).toBe(tabs[0]!.element)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps number and string values distinct and leaves an invalid controlled value untouched', async () => {
    const wrapper = mount(MdvTabs, {
      props: { modelValue: 1 },
      slots: {
        default: () => [
          h(MdvTab, { value: 1, label: '数字' }),
          h(MdvTab, { value: '1', label: '文字' }),
        ],
        panels: () => [h(MdvTabPanel, { value: 1 }), h(MdvTabPanel, { value: '1' })],
      },
    })
    wrappers.push(wrapper)
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    expect(tabs.map((tab) => tab.attributes('aria-selected'))).toEqual(['true', 'false'])
    expect(tabs[0]!.attributes('id')).not.toBe(tabs[1]!.attributes('id'))
    tabs[1]!.element.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([['1']])
    await wrapper.setProps({ modelValue: 'missing' })
    await settle()
    expect(wrapper.findAll('[aria-selected="true"]')).toHaveLength(0)
    expect(
      wrapper
        .findAll('[role="tabpanel"]')
        .every((panel) => panel.attributes('hidden') !== undefined),
    ).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['1']])
  })

  it('recognizes an explicitly supplied empty model after internal selection without rewriting it', async () => {
    const external = ref(false)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvTabs, external.value ? { modelValue: undefined } : null, {
            default: () => [
              h(MdvTab, { value: 'a', label: '一' }),
              h(MdvTab, { value: 'b', label: '二' }),
            ],
            panels: () => [h(MdvTabPanel, { value: 'a' }), h(MdvTabPanel, { value: 'b' })],
          }),
      }),
    )
    wrappers.push(wrapper)
    const group = wrapper.getComponent(MdvTabs)
    wrapper.findAll<HTMLButtonElement>('[role="tab"]')[1]!.element.click()
    await settle()
    external.value = true
    await settle()
    expect(wrapper.findAll('[aria-selected="true"]')).toHaveLength(0)
    expect(group.emitted('update:modelValue')).toEqual([['b']])
    external.value = false
    await settle()
    expect(wrapper.findAll('[role="tab"]')[1]!.attributes('aria-selected')).toBe('true')
    expect(group.emitted('change')).toEqual([['b']])
  })

  it('supports manual arrow, Home and End navigation while every enabled tab remains a Tab stop', async () => {
    const wrapper = example()
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    expect(tabs.map((tab) => tab.attributes('tabindex'))).toEqual(['0', '0', '-1'])
    tabs[0]!.element.focus()
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[1]!.element)
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    await tabs[1]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[0]!.element)
    await tabs[0]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(tabs[1]!.element)
    await tabs[1]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(tabs[0]!.element)
    const vertical = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
    tabs[0]!.element.dispatchEvent(vertical)
    expect(vertical.defaultPrevented).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('supports one Tab entry and automatic activation without emitting a second request on click', async () => {
    const wrapper = example({ tabNavigation: 'active', activation: 'automatic' })
    await settle()
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    expect(tabs.map((tab) => tab.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    tabs[0]!.element.focus()
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
    tabs[1]!.element.click()
    await settle()
    expect(tabs[1]!.attributes('aria-selected')).toBe('true')
    expect(tabs.map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(wrapper.emitted('change')).toEqual([['b']])
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    tabs[1]!.element.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
  })

  it('moves roving focus independently in manual mode and mirrors horizontal arrows for RTL', async () => {
    const wrapper = example({ tabNavigation: 'active' })
    wrapper.element.setAttribute('dir', 'rtl')
    await settle()
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    tabs[0]!.element.focus()
    await tabs[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(tabs[1]!.element)
    expect(tabs[1]!.attributes('tabindex')).toBe('0')
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('skips hidden, inert and disabled fieldset items without changing a controlled selection', async () => {
    const disabled = ref(false)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('fieldset', { disabled: disabled.value }, [
            h(
              MdvTabs,
              { modelValue: 'a' },
              {
                default: () => [
                  h(MdvTab, { value: 'a', label: '一' }),
                  h(MdvTab, { value: 'hidden', label: '隐藏', hidden: true }),
                  h(MdvTab, { value: 'inert', label: '不可访问', inert: true }),
                  h(MdvTab, { value: 'b', label: '二' }),
                ],
                panels: () => [h(MdvTabPanel, { value: 'a' }), h(MdvTabPanel, { value: 'b' })],
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    wrappers.push(wrapper)
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    tabs[0]!.element.focus()
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[3]!.element)
    disabled.value = true
    await settle()
    tabs[3]!.element.click()
    expect(wrapper.getComponent(MdvTabs).emitted('update:modelValue')).toBeUndefined()
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
  })

  it('preserves panel nodes and drafts, and recovers focus only when the focused panel is hidden', async () => {
    const wrapper = example({ modelValue: 'b' })
    const field = wrapper.get<HTMLInputElement>('input')
    field.element.value = '未保存的草稿'
    field.element.focus()
    await wrapper.setProps({ modelValue: 'a' })
    await settle()
    expect(document.activeElement).toBe(wrapper.findAll('[role="tab"]')[0]!.element)
    expect(field.element.closest('[role="tabpanel"]')!.hasAttribute('inert')).toBe(true)
    await wrapper.setProps({ modelValue: 'b' })
    await settle()
    expect(wrapper.get('input').element).toBe(field.element)
    expect(field.element.value).toBe('未保存的草稿')
    expect(field.element.closest('[role="tabpanel"]')!.hasAttribute('inert')).toBe(false)
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    await wrapper.setProps({ modelValue: 'a' })
    await settle()
    expect(document.activeElement).toBe(outside)
  })

  it('does not turn programmatic focus recovery into an automatic selection request', async () => {
    const wrapper = example({ modelValue: 'b', activation: 'automatic' })
    wrapper.get<HTMLInputElement>('input').element.focus()
    await wrapper.setProps({ modelValue: 'missing' })
    await settle()
    expect(document.activeElement).toBe(wrapper.findAll('[role="tab"]')[0]!.element)
    expect(wrapper.findAll('[aria-selected="true"]')).toHaveLength(0)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it.each([
    { lazy: true, destroyOnHide: false, initial: false, retained: true },
    { lazy: false, destroyOnHide: true, initial: false, retained: false },
  ])(
    'handles lazy=$lazy and destroyOnHide=$destroyOnHide while keeping panel IDs',
    async ({ lazy, destroyOnHide, initial, retained }) => {
      const wrapper = mount(MdvTabs, {
        props: { modelValue: 'a' },
        slots: {
          default: () => [
            h(MdvTab, { value: 'a', label: '一' }),
            h(MdvTab, { value: 'b', label: '二' }),
          ],
          panels: () => [
            h(MdvTabPanel, { value: 'a' }),
            h(MdvTabPanel, { value: 'b', lazy, destroyOnHide }, () => h('input')),
          ],
        },
      })
      wrappers.push(wrapper)
      const panel = wrapper.findAll('[role="tabpanel"]')[1]!
      const id = panel.attributes('id')
      expect(panel.find('input').exists()).toBe(initial)
      await wrapper.setProps({ modelValue: 'b' })
      const input = wrapper.get<HTMLInputElement>('input').element
      input.value = '草稿'
      await wrapper.setProps({ modelValue: 'a' })
      expect(panel.find('input').exists()).toBe(retained)
      await wrapper.setProps({ modelValue: 'b' })
      expect(wrapper.get('input').element === input).toBe(retained)
      expect(panel.attributes('id')).toBe(id)
    },
  )

  it('uses actual DOM order after reordering and selects an adjacent item when an uncontrolled tab is removed', async () => {
    const values = ref(['a', 'b', 'c'])
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvTabs, null, {
            default: () =>
              values.value.map((value) => h(MdvTab, { key: value, value, label: value })),
            panels: () => values.value.map((value) => h(MdvTabPanel, { key: value, value })),
          }),
      }),
      { attachTo: document.body },
    )
    wrappers.push(wrapper)
    values.value = ['c', 'b', 'a']
    await settle()
    let tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    tabs[0]!.element.focus()
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[1]!.element)
    tabs[1]!.element.click()
    await settle()
    values.value = ['c', 'a']
    await settle()
    tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    expect(tabs[1]!.attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs[1]!.element)
    expect(wrapper.getComponent(MdvTabs).emitted('change')).toEqual([['b']])
  })

  it('keeps nested tab selections and keyboard navigation inside their nearest group', async () => {
    const wrapper = mount(MdvTabs, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(MdvTab, { value: 'a', label: '外一' }),
          h(MdvTab, { value: 'b', label: '外二' }),
        ],
        panels: () => [
          h(MdvTabPanel, { value: 'a' }, () =>
            h(MdvTabs, null, {
              default: () => [
                h(MdvTab, { value: 'a', label: '内一' }),
                h(MdvTab, { value: 'b', label: '内二' }),
              ],
              panels: () => [h(MdvTabPanel, { value: 'a' }), h(MdvTabPanel, { value: 'b' })],
            }),
          ),
          h(MdvTabPanel, { value: 'b' }),
        ],
      },
    })
    wrappers.push(wrapper)
    const groups = wrapper.findAllComponents(MdvTabs)
    const inner = groups.find((group) => group.vm !== wrapper.vm)!
    const buttons = inner.findAll<HTMLButtonElement>('[role="tab"]')
    buttons[0]!.element.focus()
    await buttons[0]!.trigger('keydown', { key: 'ArrowRight' })
    buttons[1]!.element.click()
    await settle()
    expect(buttons[1]!.attributes('aria-selected')).toBe('true')
    expect(wrapper.findAll('[role="tab"]')[0]!.attributes('aria-selected')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders icon and badge slots once, accepts custom tab IDs and exposes native focus methods', async () => {
    const wrapper = mount(MdvTabs, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(
            MdvTab,
            { value: 'a', id: 'custom-tab', label: '通知' },
            {
              icon: ({ active }: { active: boolean }) =>
                h('svg', { 'data-active-icon': String(active) }),
              badge: () => h(MdvBadge, { variant: 'large', content: 3 }),
            },
          ),
          h(MdvTab, { value: 'b', label: '其他' }),
        ],
        panels: () => [h(MdvTabPanel, { value: 'a' }), h(MdvTabPanel, { value: 'b' })],
      },
    })
    wrappers.push(wrapper)
    const tab = wrapper.getComponent(MdvTab)
    expect(wrapper.findAll('svg')).toHaveLength(1)
    expect(wrapper.findAll('.mdv-badge__indicator')).toHaveLength(1)
    expect(wrapper.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe('custom-tab')
    expect(tab.classes()).toContain('mdv-tab--stacked')
    wrapper.vm.focus('b')
    expect(document.activeElement).toBe(wrapper.findAll('[role="tab"]')[1]!.element)
    tab.vm.focus()
    expect(document.activeElement).toBe(tab.element)
    tab.vm.blur()
    expect(document.activeElement).not.toBe(tab.element)
    await wrapper.setProps({ variant: 'secondary' })
    expect(tab.classes()).not.toContain('mdv-tab--stacked')
  })

  it('disconnects availability and resize observation while deactivated and reconnects on activation', async () => {
    const instances: Array<{
      observe: ReturnType<typeof vi.fn<(element: Element) => void>>
      disconnect: ReturnType<typeof vi.fn<() => void>>
    }> = []
    class Resize {
      observe = vi.fn<(element: Element) => void>()
      unobserve = vi.fn<(element: Element) => void>()
      disconnect = vi.fn<() => void>()
      constructor() {
        instances.push(this)
      }
    }
    vi.stubGlobal('ResizeObserver', Resize)
    const visible = ref(true)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () =>
              visible.value
                ? h(
                    MdvTabs,
                    { key: 'tabs' },
                    {
                      default: () => h(MdvTab, { value: 'a', label: '一' }),
                      panels: () => h(MdvTabPanel, { value: 'a' }),
                    },
                  )
                : h('p', '其他页面'),
          }),
      }),
    )
    wrappers.push(wrapper)
    await settle()
    expect(instances[0]!.observe).toHaveBeenCalled()
    visible.value = false
    await settle()
    expect(instances[0]!.disconnect).toHaveBeenCalledTimes(1)
    visible.value = true
    await settle()
    expect(instances).toHaveLength(2)
    expect(instances[1]!.observe).toHaveBeenCalled()
  })
})
