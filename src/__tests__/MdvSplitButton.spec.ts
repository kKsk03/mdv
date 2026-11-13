import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref, shallowRef } from 'vue'
import type { VNodeRef } from 'vue'
import MdvSplitButton from '../components/MdvSplitButton.vue'
import MdvMenu from '../components/MdvMenu.vue'
import MdvMenuItem from '../components/MdvMenuItem.vue'
import type { MdvButtonType } from '../components/button.types'
import type {
  MdvSplitButtonActionAttrs,
  MdvSplitButtonMenuAttrs,
} from '../components/split-button.types'
import type { MdvMenuTriggerSlotProps } from '../components/menu.types'
import { mockMenuPlatform } from './menu-test-platform'

let platform: ReturnType<typeof mockMenuPlatform>
const wrappers: VueWrapper[] = []
beforeEach(() => {
  platform = mockMenuPlatform()
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
function example(props: Record<string, unknown> = {}) {
  const wrapper = mount(MdvSplitButton, {
    attachTo: document.body,
    props: { menuButtonLabel: '更多保存选项', ...props },
    slots: { default: '保存' },
  })
  wrappers.push(wrapper)
  return wrapper
}
function pointer(target: EventTarget, type: string) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: 'mouse' },
    button: { value: 0 },
    isPrimary: { value: true },
    clientX: { value: 12 },
    clientY: { value: 12 },
  })
  target.dispatchEvent(event)
}

describe('MdvSplitButton', () => {
  it('routes group and native attributes to two independent controls without an extra Tab stop', async () => {
    const wrapper = example({
      actionAttrs: { id: 'save', name: 'intent', value: 'save', 'aria-describedby': 'help' },
      menuButtonAttrs: { id: 'more', 'aria-haspopup': 'menu', 'aria-controls': 'options' },
    })
    await wrapper.setProps({ expanded: true })
    const action = wrapper.get<HTMLButtonElement>('.mdv-split-button__action')
    const menu = wrapper.get<HTMLButtonElement>('.mdv-split-button__menu')
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(action.attributes()).toMatchObject({
      id: 'save',
      name: 'intent',
      value: 'save',
      'aria-describedby': 'help',
      type: 'button',
    })
    expect(menu.attributes()).toMatchObject({
      id: 'more',
      'aria-haspopup': 'menu',
      'aria-controls': 'options',
      'aria-label': '更多保存选项',
      'aria-expanded': 'true',
      type: 'button',
    })
    expect([action.attributes('tabindex'), menu.attributes('tabindex')]).toEqual([
      undefined,
      undefined,
    ])
    action.element.focus()
    expect(document.activeElement).toBe(action.element)
    menu.element.focus()
    expect(document.activeElement).toBe(menu.element)
  })

  it('isolates action and menu clicks and lets the caller cancel a forwarded menu activation', async () => {
    const actionClick = vi.fn<(event: MouseEvent) => void>()
    const menuClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = example({
      actionAttrs: { onClick: actionClick },
      menuButtonAttrs: { onClick: menuClick },
    })
    await wrapper.get('.mdv-split-button__action').trigger('click')
    expect(actionClick).toHaveBeenCalledTimes(1)
    expect(menuClick).not.toHaveBeenCalled()
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ 'onMenu-click': (event: MouseEvent) => event.preventDefault() })
    await wrapper.get('.mdv-split-button__menu').trigger('click')
    expect(wrapper.emitted('menu-click')).toHaveLength(1)
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(menuClick).not.toHaveBeenCalled()
    expect(wrapper.get('.mdv-split-button__menu').attributes('aria-expanded')).toBe('false')
  })

  it('forwards, replaces and clears the real tail button ref', async () => {
    const first = shallowRef<HTMLElement | null>(null)
    const second = vi.fn<Extract<VNodeRef, (...args: never[]) => unknown>>()
    const menuButtonAttrs = shallowRef<MdvSplitButtonMenuAttrs>({ ref: first })
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvSplitButton,
            { menuButtonLabel: '更多保存选项', menuButtonAttrs: menuButtonAttrs.value },
            () => '保存',
          ),
      }),
      { attachTo: document.body },
    )
    wrappers.push(host)
    const wrapper = host.getComponent(MdvSplitButton)
    const button = wrapper.get('.mdv-split-button__menu').element
    expect(first.value).toBe(button)
    expect(wrapper.vm.menuButtonElement).toBe(button)
    menuButtonAttrs.value = { ref: second }
    await nextTick()
    expect(first.value).toBeNull()
    expect(second).toHaveBeenLastCalledWith(button, expect.any(Object))
    wrapper.vm.focusMenu()
    expect(document.activeElement).toBe(button)
    wrapper.vm.focus()
    expect(document.activeElement).toBe(wrapper.vm.actionElement)
    wrapper.vm.blur()
    expect(document.activeElement).toBe(document.body)
    host.unmount()
    wrappers.pop()
    expect(second).toHaveBeenLastCalledWith(null, expect.any(Object))
  })

  it('supports independent disabling, a disabled native link and inherited fieldset disabling', async () => {
    const listener = vi.fn<(event: MouseEvent) => void>()
    const wrapper = example({ actionDisabled: true, menuButtonAttrs: { onClick: listener } })
    await wrapper.get('.mdv-split-button__action').trigger('click')
    await wrapper.get('.mdv-split-button__menu').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(listener).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ actionDisabled: false, menuDisabled: true, href: '/document' })
    expect(wrapper.get('a').attributes('href')).toBe('/document')
    await wrapper.setProps({ actionDisabled: true })
    expect(wrapper.get('a').attributes()).toMatchObject({
      role: 'link',
      tabindex: '-1',
      'aria-disabled': 'true',
    })
    expect(wrapper.get('a').attributes('href')).toBeUndefined()
    await wrapper.get('a').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.setProps({ href: undefined, actionDisabled: false, menuDisabled: false })
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    document.body.append(fieldset)
    fieldset.append(wrapper.element)
    await wrapper.get('.mdv-split-button__menu').trigger('click')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('changes only visible loading content, keeps native activation and preserves the original label node', async () => {
    const wrapper = example()
    const label = wrapper.get<HTMLElement>('.mdv-button__label')
    await wrapper.setProps({ loading: true, loadingText: '正在保存所有更改…' })
    expect(label.isVisible()).toBe(false)
    expect(label.element.style.display).toBe('none')
    expect(wrapper.get('.mdv-button__loading-label').text()).toBe('正在保存所有更改…')
    expect(wrapper.get<HTMLButtonElement>('.mdv-split-button__action').element.disabled).toBe(false)
    expect(wrapper.get('.mdv-split-button__action').attributes('aria-busy')).toBe('true')
    await wrapper.get('.mdv-split-button__action').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ loadingText: undefined })
    expect(wrapper.find('.mdv-button__loading-label').exists()).toBe(false)
    expect(label.isVisible()).toBe(true)
    await wrapper.setProps({ loading: false })
    expect(wrapper.get('.mdv-button__label').element).toBe(label.element)
    expect(wrapper.find('.mdv-button__spinner').exists()).toBe(false)
  })

  it('submits and resets through the action only, with a native link when requested', async () => {
    const submit = vi.fn<(event: SubmitEvent) => void>((event) => event.preventDefault())
    const actionType = ref<MdvButtonType>('submit')
    const href = ref<string>()
    const actionAttrs = shallowRef<MdvSplitButtonActionAttrs>({ name: 'intent', value: 'save' })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('form', { onSubmit: submit }, [
            h('input', { name: 'draft', value: '初始内容' }),
            h(
              MdvSplitButton,
              {
                type: actionType.value,
                href: href.value,
                menuButtonLabel: '其他提交选项',
                actionAttrs: actionAttrs.value,
              },
              () => '保存',
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    wrappers.push(wrapper)
    wrapper.get<HTMLButtonElement>('.mdv-split-button__menu').element.click()
    expect(submit).not.toHaveBeenCalled()
    wrapper.get<HTMLButtonElement>('.mdv-split-button__action').element.click()
    expect(submit).toHaveBeenCalledTimes(1)
    expect(submit.mock.calls[0]![0].submitter).toBe(
      wrapper.get('.mdv-split-button__action').element,
    )
    actionType.value = 'reset'
    await nextTick()
    const input = wrapper.get('input').element
    input.value = '修改内容'
    wrapper.get<HTMLButtonElement>('.mdv-split-button__action').element.click()
    expect(input.value).toBe('初始内容')
    href.value = '/guide'
    actionAttrs.value = { target: '_blank', rel: 'noopener' }
    await nextTick()
    expect(wrapper.get('a').attributes()).toMatchObject({
      href: '/guide',
      target: '_blank',
      rel: 'noopener',
    })
  })

  it('keeps pointer feedback independent and releases it outside the component', async () => {
    const wrapper = example()
    const action = wrapper.get('.mdv-split-button__action')
    const menu = wrapper.get('.mdv-split-button__menu')
    pointer(action.element, 'pointerdown')
    await nextTick()
    expect(action.find('.mdv-button__ripple').exists()).toBe(true)
    expect(menu.find('.mdv-button__ripple').exists()).toBe(false)
    expect(action.classes()).toContain('mdv-split-button__control--pressed')
    pointer(window, 'pointerup')
    await nextTick()
    expect(action.classes()).not.toContain('mdv-split-button__control--pressed')
    expect(action.get('.mdv-button__ripple').classes()).toContain('mdv-button__ripple--released')
    pointer(menu.element, 'pointerdown')
    await nextTick()
    window.dispatchEvent(new Event('blur'))
    await nextTick()
    expect(menu.classes()).not.toContain('mdv-split-button__control--pressed')
    expect(menu.find('.mdv-button__ripple').exists()).toBe(false)
  })

  it('reflects accepted Menu state, forwards keyboard opening and restores focus to the tail', async () => {
    const accepted = ref(false)
    const allow = ref(false)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvMenu,
            {
              modelValue: accepted.value,
              'onUpdate:modelValue': (value: boolean) => {
                if (allow.value) accepted.value = value
              },
            },
            {
              trigger: ({ triggerProps, open }: MdvMenuTriggerSlotProps) =>
                h(
                  MdvSplitButton,
                  {
                    expanded: open,
                    menuButtonAttrs: triggerProps,
                    menuButtonLabel: '更多保存选项',
                  },
                  () => '保存',
                ),
              default: () => [
                h(MdvMenuItem, { label: '另存为' }),
                h(MdvMenuItem, { label: '保存副本' }),
              ],
            },
          ),
      }),
      { attachTo: document.body },
    )
    wrappers.push(wrapper)
    const action = wrapper.get('.mdv-split-button__action')
    const menu = wrapper.get('.mdv-split-button__menu')
    await action.trigger('click')
    expect(platform.opened.size).toBe(0)
    await menu.trigger('click')
    await flushPromises()
    expect(menu.attributes('aria-expanded')).toBe('false')
    expect(platform.opened.size).toBe(0)
    allow.value = true
    await menu.trigger('keydown', { key: 'ArrowUp' })
    await flushPromises()
    expect(menu.attributes('aria-expanded')).toBe('true')
    expect(platform.opened.size).toBe(1)
    const items = wrapper.findAll('[data-mdv-menu-item]')
    expect(document.activeElement).toBe(items[1]!.element)
    await items[1]!.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(menu.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(menu.element)
  })

  it('clears held interaction during KeepAlive deactivation without taking focus on activation', async () => {
    const shown = ref(true)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h('input'),
            h(
              KeepAlive,
              {},
              {
                default: () =>
                  shown.value
                    ? h(MdvSplitButton, { menuButtonLabel: '更多保存选项' }, () => '保存')
                    : null,
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    wrappers.push(wrapper)
    const input = wrapper.get('input').element
    input.focus()
    pointer(wrapper.get('.mdv-split-button__menu').element, 'pointerdown')
    await nextTick()
    shown.value = false
    await nextTick()
    pointer(window, 'pointerup')
    shown.value = true
    await nextTick()
    expect(document.activeElement).toBe(input)
    expect(wrapper.find('.mdv-button__ripple').exists()).toBe(false)
    expect(wrapper.get('.mdv-split-button__menu').classes()).not.toContain(
      'mdv-split-button__control--pressed',
    )
  })
})
