import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { Ref, VNode } from 'vue'
import MdvButtonGroup from '../components/MdvButtonGroup.vue'
import MdvButtonGroupItem from '../components/MdvButtonGroupItem.vue'
import type {
  MdvButtonGroupModelValue,
  MdvButtonGroupProps,
  MdvButtonGroupItemSlotProps,
} from '../components/button-group.types'
import { toolbarFrames, toolbarReducedMotion } from './toolbar-test-platform'

enableAutoUnmount(afterEach)
beforeEach(toolbarReducedMotion)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
const items = () =>
  ['a', 'b', 'c'].map((value) => h(MdvButtonGroupItem, { value }, { default: () => value }))
function example(
  model: Ref<MdvButtonGroupModelValue>,
  props: MdvButtonGroupProps = {},
  children: () => VNode[] = items,
) {
  return defineComponent({
    setup: () => () =>
      h(
        MdvButtonGroup,
        {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (value: MdvButtonGroupModelValue) => {
            model.value = value
          },
        },
        { default: children },
      ),
  })
}
function pointer(target: EventTarget, type: string, id = 1) {
  const event = new MouseEvent(type, { button: 0, bubbles: true, cancelable: true })
  Object.defineProperty(event, 'pointerId', { value: id })
  target.dispatchEvent(event)
}

describe('MdvButtonGroup', () => {
  it('leaves actions native, container unfocusable, and selection opt-in for Standard', async () => {
    const click = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const outside = document.createElement('input')
    document.body.append(outside)
    outside.focus()
    const wrapper = mount(MdvButtonGroup, {
      attrs: { tabindex: 0, role: 'radiogroup', 'aria-label': '操作' },
      slots: {
        default: () => [
          h(
            MdvButtonGroupItem,
            { onClick: click, name: 'action', value: 'save', form: 'editor' },
            { default: () => '保存' },
          ),
        ],
      },
      attachTo: document.body,
    })
    expect(document.activeElement).toBe(outside)
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    const button = wrapper.get('button')
    expect(button.attributes()).toMatchObject({
      type: 'button',
      name: 'action',
      value: 'save',
      form: 'editor',
    })
    expect(button.attributes('aria-pressed')).toBeUndefined()
    expect(button.attributes('tabindex')).toBeUndefined()
    await button.trigger('click')
    expect(click).toHaveBeenCalledOnce()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.vm.focus()
    expect(document.activeElement).toBe(button.element)
    wrapper.vm.blur()
    expect(document.activeElement).toBe(document.body)
  })

  it('keeps strict numeric/string values, emits once and obeys controlled rejection', async () => {
    const value = ref<MdvButtonGroupModelValue>(0)
    const wrapper = mount(
      example(value, { variant: 'connected' }, () => [
        h(MdvButtonGroupItem, { value: 0 }, { default: () => '数字' }),
        h(MdvButtonGroupItem, { value: '0' }, { default: () => '文字' }),
      ]),
    )
    await wrapper.get('button:nth-child(2)').trigger('click')
    expect(value.value).toBe('0')
    expect(wrapper.findAll('button').map((button) => button.attributes('aria-pressed'))).toEqual([
      'false',
      'true',
    ])
    const rejected = mount(MdvButtonGroup, {
      props: { variant: 'connected', modelValue: 'a' },
      slots: { default: items },
    })
    await rejected.get('button:nth-child(2)').trigger('click')
    expect(rejected.emitted('update:modelValue')).toEqual([['b']])
    expect(rejected.findAll('button').map((button) => button.attributes('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ])
    await rejected.setProps({ modelValue: 'b' })
    expect(rejected.get('button:nth-child(2)').attributes('aria-pressed')).toBe('true')
  })

  it('defaults Connected to single without inventing a selection and enforces the last accepted choice', async () => {
    const wrapper = mount(MdvButtonGroup, {
      props: { variant: 'connected', selectionRequired: true },
      slots: { default: items },
    })
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(0)
    expect(wrapper.find('[required]').exists()).toBe(false)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['a']])
    await wrapper.get('button:nth-child(2)').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['a'], ['b']])
    expect(wrapper.get('button:nth-child(2)').attributes('aria-pressed')).toBe('true')
  })

  it('applies multiple changes in one task and never mutates a caller array', async () => {
    const initial = ['a']
    const model = ref<MdvButtonGroupModelValue>(initial)
    const wrapper = mount(example(model, { selection: 'multiple', selectionRequired: true }))
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    buttons[1]!.element.click()
    buttons[2]!.element.click()
    await nextTick()
    expect(model.value).toEqual(['a', 'b', 'c'])
    expect(initial).toEqual(['a'])
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')
    await buttons[2]!.trigger('click')
    expect(model.value).toEqual(['c'])
  })

  it('keeps independent toggles controlled and renders the selected slot only once', async () => {
    const selected = ref(false)
    const wrapper = mount(MdvButtonGroup, {
      slots: {
        default: () => [
          h(
            MdvButtonGroupItem,
            {
              selected: selected.value,
              'onUpdate:selected': (value: boolean) => {
                selected.value = value
              },
            },
            {
              default: (state: MdvButtonGroupItemSlotProps) => `声音 ${state.selected}`,
              leading: () => h('svg', { 'data-icon': 'off' }),
              selected: () => h('svg', { 'data-icon': 'on' }),
            },
          ),
          h(MdvButtonGroupItem, {}, { default: () => '结束' }),
        ],
      },
    })
    await wrapper.get('button').trigger('click')
    expect(selected.value).toBe(true)
    expect(wrapper.get('button').text()).toBe('声音 true')
    expect(wrapper.findAll('svg')).toHaveLength(1)
    expect(wrapper.get('svg').attributes('data-icon')).toBe('on')
    expect(wrapper.get('button:nth-child(2)').attributes('aria-pressed')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('moves focus without selecting, skips unavailable members and leaves Tab untouched', async () => {
    const model = ref<MdvButtonGroupModelValue>('a')
    const wrapper = mount(
      example(
        model,
        { variant: 'connected', dir: 'rtl', style: { direction: 'rtl' } } as MdvButtonGroupProps,
        () => [
          h(MdvButtonGroupItem, { value: 'a' }, { default: () => '甲' }),
          h(MdvButtonGroupItem, { value: 'b', disabled: true }, { default: () => '乙' }),
          h(MdvButtonGroupItem, { value: 'hidden', hidden: true }, { default: () => '隐藏' }),
          h(MdvButtonGroupItem, { value: 'c' }, { default: () => '丙' }),
          h(MdvButtonGroupItem, { value: 'd' }, { default: () => '丁' }),
        ],
      ),
      { attachTo: document.body },
    )
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    buttons[0]!.element.focus()
    const left = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
    buttons[0]!.element.dispatchEvent(left)
    expect(left.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(buttons[3]!.element)
    expect(model.value).toBe('a')
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    buttons[3]!.element.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
    expect(buttons.map((button) => button.attributes('tabindex'))).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
    await buttons[3]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(buttons[0]!.element)
    await buttons[0]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(buttons[4]!.element)
  })

  it('honors preventDefault and disabled fieldsets including the first legend exemption', async () => {
    const model = ref<MdvButtonGroupModelValue>(null)
    const click = vi.fn<(event: MouseEvent) => void>()
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('fieldset', { disabled: true }, [
            h('legend', [h(example(model, { selection: 'single' }))]),
            h(
              MdvButtonGroup,
              { selection: 'single' },
              {
                default: () =>
                  h(
                    MdvButtonGroupItem,
                    { value: 'blocked', onClick: click },
                    { default: () => '不可用' },
                  ),
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    await host.get('legend button').trigger('click')
    expect(model.value).toBe('a')
    const blocked = host.get('.mdv-button-group:nth-child(2) button')
    blocked.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(click).not.toHaveBeenCalled()
    const wrapper = mount(MdvButtonGroup, {
      props: { selection: 'single' },
      slots: {
        default: () =>
          h(
            MdvButtonGroupItem,
            { value: 'a', onClick: (event: MouseEvent) => event.preventDefault() },
            { default: () => '取消激活' },
          ),
      },
    })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('retains link attributes and lets loading content take its natural space without disabling', async () => {
    const click = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const loadingText = ref<string | undefined>('正在保存')
    const disabled = ref(false)
    const wrapper = mount(MdvButtonGroup, {
      slots: {
        default: () => [
          h(
            MdvButtonGroupItem,
            {
              href: '/edit',
              target: '_blank',
              rel: 'noopener',
              onClick: click,
              loading: true,
              loadingText: loadingText.value,
              disabled: disabled.value,
            },
            { default: () => h('strong', '编辑') },
          ),
        ],
      },
    })
    const link = wrapper.get('a')
    expect(link.attributes()).toMatchObject({
      href: '/edit',
      target: '_blank',
      rel: 'noopener',
      'aria-busy': 'true',
    })
    expect(link.attributes('type')).toBeUndefined()
    expect(link.get('strong').element.parentElement?.style.display).toBe('none')
    expect(link.get('.mdv-button__loading-label').text()).toBe('正在保存')
    await link.trigger('click')
    expect(click).toHaveBeenCalledOnce()
    loadingText.value = undefined
    await nextTick()
    expect(link.find('.mdv-button__loading-label').exists()).toBe(false)
    expect(link.get('strong').element.parentElement?.style.display).toBe('')
    disabled.value = true
    await nextTick()
    expect(link.attributes('href')).toBeUndefined()
    expect(link.attributes('role')).toBe('link')
    await link.trigger('click')
    expect(click).toHaveBeenCalledOnce()
  })

  it('releases only the matching pointer on window and handles keyboard/blur cancellation', async () => {
    const wrapper = mount(MdvButtonGroup, { slots: { default: items }, attachTo: document.body })
    const button = wrapper.get('button')
    pointer(button.element, 'pointerdown', 5)
    await nextTick()
    expect(button.classes()).toContain('mdv-button-group-item--pressed')
    pointer(window, 'pointerup', 6)
    await nextTick()
    expect(button.classes()).toContain('mdv-button-group-item--pressed')
    pointer(window, 'pointercancel', 5)
    await nextTick()
    expect(button.classes()).not.toContain('mdv-button-group-item--pressed')
    await button.trigger('keydown', { key: ' ' })
    expect(button.classes()).toContain('mdv-button-group-item--pressed')
    window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))
    await nextTick()
    expect(button.classes()).not.toContain('mdv-button-group-item--pressed')
    pointer(button.element, 'pointerdown')
    window.dispatchEvent(new Event('blur'))
    await nextTick()
    expect(button.classes()).not.toContain('mdv-button-group-item--pressed')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('submits accepted choices, respects form reset and keeps a rejected reset unchanged', async () => {
    const model = ref<MdvButtonGroupModelValue>(['a'])
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h('form', { id: 'choices' }),
            h(example(model, { selection: 'multiple', name: 'choice', form: 'choices' })),
          ]),
      }),
      { attachTo: document.body },
    )
    const form = host.get<HTMLFormElement>('form').element
    await host.get('button:nth-child(2)').trigger('click')
    expect(new FormData(form).getAll('choice')).toEqual(['a', 'b'])
    form.reset()
    await flushPromises()
    expect(model.value).toEqual(['a'])
    expect(new FormData(form).getAll('choice')).toEqual(['a'])
    const rejected = mount(MdvButtonGroup, {
      props: { variant: 'connected', modelValue: 'a', name: 'single', form: 'choices' },
      slots: { default: items },
      attachTo: document.body,
    })
    await rejected.setProps({ modelValue: 'b' })
    form.reset()
    await flushPromises()
    expect(rejected.emitted('update:modelValue')).toEqual([['a']])
    expect(new FormData(form).get('single')).toBe('b')
    await rejected.setProps({ disabled: true })
    expect(new FormData(form).has('single')).toBe(false)
  })

  it('preserves nodes through reorder and moves focus to a surviving neighbor on removal', async () => {
    const frames = toolbarFrames()
    const order = ref(['a', 'b', 'c'])
    const model = ref<MdvButtonGroupModelValue>('b')
    const wrapper = mount(
      example(model, { variant: 'connected' }, () =>
        order.value.map((value) =>
          h(MdvButtonGroupItem, { key: value, value, id: value }, { default: () => value }),
        ),
      ),
      { attachTo: document.body },
    )
    const middle = wrapper.get<HTMLButtonElement>('#b').element
    middle.focus()
    order.value = ['c', 'b', 'a']
    await flushPromises()
    frames.step()
    expect(wrapper.get('#b').element).toBe(middle)
    expect(document.activeElement).toBe(middle)
    expect(wrapper.get('#c').attributes('data-mdv-group-first')).toBe('')
    expect(wrapper.get('#a').attributes('data-mdv-group-last')).toBe('')
    order.value = ['c', 'a']
    await flushPromises()
    frames.step()
    expect(document.activeElement).toBe(wrapper.get('#a').element)
    expect(model.value).toBe('b')
  })

  it('clears pressed state and frames across KeepAlive without remounting content', async () => {
    const frames = toolbarFrames()
    const shown = ref(true)
    const model = ref<MdvButtonGroupModelValue>(null)
    const Example = example(model)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, {}, { default: () => (shown.value ? h(Example) : h('div')) }),
      }),
      { attachTo: document.body },
    )
    const node = host.get('button').element
    pointer(node, 'pointerdown')
    await nextTick()
    shown.value = false
    await flushPromises()
    expect(frames.callbacks.size).toBe(0)
    shown.value = true
    await flushPromises()
    frames.step()
    expect(host.get('button').element).toBe(node)
    expect(host.get('button').classes()).not.toContain('mdv-button-group-item--pressed')
    host.unmount()
    expect(frames.callbacks.size).toBe(0)
  })
})
