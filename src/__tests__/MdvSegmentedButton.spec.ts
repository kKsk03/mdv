import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onMounted, ref } from 'vue'
import type { Ref, VNode } from 'vue'
import MdvSegmentedButton from '../components/MdvSegmentedButton.vue'
import MdvSegmentedButtonItem from '../components/MdvSegmentedButtonItem.vue'
import type { MdvSegmentedButtonModelValue } from '../components/segmented-button.types'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

async function settle() {
  await Promise.resolve()
  await nextTick()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

const defaultItems = () => [
  h(MdvSegmentedButtonItem, { value: 'a', label: '甲' }),
  h(MdvSegmentedButtonItem, { value: 'b', label: '乙' }),
  h(MdvSegmentedButtonItem, { value: 'c', label: '丙' }),
]

function example(
  value: Ref<MdvSegmentedButtonModelValue>,
  groupProps: Record<string, unknown> = {},
  items: () => VNode[] = defaultItems,
) {
  return defineComponent({
    render: () =>
      h(
        MdvSegmentedButton,
        {
          ...groupProps,
          modelValue: value.value,
          'onUpdate:modelValue': (next: MdvSegmentedButtonModelValue) => {
            value.value = next
          },
        },
        { default: items },
      ),
  })
}

describe('MdvSegmentedButton', () => {
  it('associates native labels, splits attributes and renders a custom label only once', () => {
    const mounted = vi.fn<() => void>()
    const Label = defineComponent({
      setup() {
        onMounted(mounted)
        return () => h('strong', '自定义文字')
      },
    })
    const wrapper = mount(MdvSegmentedButton, {
      props: { modelValue: 'a' },
      attrs: { 'aria-label': '视图', 'aria-describedby': 'view-help' },
      slots: {
        default: () => [
          h(
            MdvSegmentedButtonItem,
            {
              value: 'a',
              label: '后备文字',
              id: 'view-a',
              class: 'outer',
              style: { marginTop: '2px' },
              'aria-label': '第一种视图',
              'data-purpose': 'view',
            },
            { default: () => h(Label) },
          ),
          h(MdvSegmentedButtonItem, { value: 'b', label: '第二种' }),
        ],
      },
    })
    expect(wrapper.attributes()).toMatchObject({
      role: 'radiogroup',
      'aria-label': '视图',
      'aria-describedby': 'view-help',
    })
    const input = wrapper.get<HTMLInputElement>('input')
    expect(input.attributes()).toMatchObject({
      id: 'view-a',
      type: 'radio',
      value: 'a',
      'aria-label': '第一种视图',
      'data-purpose': 'view',
      'aria-checked': 'true',
    })
    expect(input.classes()).not.toContain('outer')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('label').classes()).toContain('outer')
    expect(wrapper.findAll('strong')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('后备文字')
    expect(mounted).toHaveBeenCalledOnce()
    expect(new Set(wrapper.findAll('input').map((item) => item.attributes('id'))).size).toBe(2)
  })

  it('does not invent an initial selection or turn selectionRequired into native required', async () => {
    const wrapper = mount(MdvSegmentedButton, { slots: { default: defaultItems } })
    await settle()
    expect(wrapper.findAll<HTMLInputElement>('input').every((item) => !item.element.checked)).toBe(
      true,
    )
    expect(wrapper.findAll('input[required]')).toHaveLength(0)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('commits one native single selection with original events and strict values', async () => {
    const model = ref<MdvSegmentedButtonModelValue>(1)
    const onInput = vi.fn<(event: Event) => void>()
    const onChange = vi.fn<(event: Event) => void>()
    const wrapper = mount(
      example(model, {}, () => [
        h(MdvSegmentedButtonItem, { value: 1, label: '数字' }),
        h(MdvSegmentedButtonItem, { value: '1', label: '字符串', onInput, onChange }),
      ]),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.click()
    await settle()
    expect(model.value).toBe('1')
    expect(inputs.map((item) => item.element.checked)).toEqual([false, true])
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toEqual([['1']])
    expect(onInput).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onInput.mock.calls[0]![0].target).toBe(inputs[1]!.element)
  })

  it('retains a required single selection when its selected segment is activated', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const wrapper = mount(example(model), { attachTo: document.body })
    wrapper.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(model.value).toBe('a')
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toBeUndefined()
  })

  it.each(['single', 'multiple'] as const)(
    'preserves native %s activation across rendering checkpoints before input and change',
    async (selection) => {
      const model = ref<MdvSegmentedButtonModelValue>(selection === 'single' ? 'a' : ['a'])
      const fullWidth = ref(false)
      const wrapper = mount(
        example(model, {
          selection,
          name: 'choice',
          get fullWidth() {
            return fullWidth.value
          },
        }),
        { attachTo: document.body },
      )
      await settle()
      const inputs = wrapper.findAll<HTMLInputElement>('input')
      const input = inputs[1]!.element
      input.focus()
      // 模拟浏览器先预激活，再在 click/input/change 之间执行 Vue 微任务。
      // 普通 Event 不会触发 JSDOM 的同步 MouseEvent 默认激活，由用例按真实顺序分发。
      input.checked = true
      input.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }))
      fullWidth.value = true
      await nextTick()
      expect(input.checked).toBe(true)
      expect(model.value).toEqual(selection === 'single' ? 'a' : ['a'])

      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      expect(input.checked).toBe(true)
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await settle()

      const expected = selection === 'single' ? 'b' : ['a', 'b']
      expect(model.value).toEqual(expected)
      expect(inputs.map((item) => item.element.checked)).toEqual([
        selection === 'multiple',
        true,
        false,
      ])
      expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toEqual([
        [expected],
      ])
    },
  )

  it('requests a rejected controlled activation only once across input/change checkpoints', async () => {
    const update = vi.fn<(value: MdvSegmentedButtonModelValue) => void>()
    const wrapper = mount(MdvSegmentedButton, {
      attachTo: document.body,
      props: { modelValue: 'a', name: 'view', 'onUpdate:modelValue': update },
      slots: { default: defaultItems },
    })
    await settle()
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    const input = inputs[1]!.element
    input.checked = true
    input.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }))
    await nextTick()
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    expect(update).toHaveBeenCalledExactlyOnceWith('b')
    expect(inputs.map((item) => item.element.checked)).toEqual([true, false, false])
  })

  it('can clear a single selection and notifies its input and change listeners once', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const onInput = vi.fn<(event: Event) => void>()
    const onChange = vi.fn<(event: Event) => void>()
    const wrapper = mount(
      example(model, { selectionRequired: false }, () => [
        h(MdvSegmentedButtonItem, { value: 'a', label: '甲', onInput, onChange }),
        h(MdvSegmentedButtonItem, { value: 'b', label: '乙' }),
      ]),
      { attachTo: document.body },
    )
    wrapper.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(model.value).toBeNull()
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(false)
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toEqual([[null]])
    expect(onInput).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
  })

  it('updates multiple selections immutably and handles several native clicks in one task', async () => {
    const original = [1]
    const model = ref<MdvSegmentedButtonModelValue>(original)
    const wrapper = mount(
      example(model, { selection: 'multiple' }, () => [
        h(MdvSegmentedButtonItem, { value: 1, label: '数字一' }),
        h(MdvSegmentedButtonItem, { value: '1', label: '字符串一' }),
        h(MdvSegmentedButtonItem, { value: 2, label: '数字二' }),
      ]),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.click()
    inputs[2]!.element.click()
    inputs[0]!.element.click()
    await settle()
    expect(model.value).toEqual(['1', 2])
    expect(original).toEqual([1])
    expect(inputs.map((item) => item.element.checked)).toEqual([false, true, true])
    expect(wrapper.attributes('role')).toBe('group')
    expect(inputs.every((item) => item.attributes('type') === 'checkbox')).toBe(true)
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toEqual([
      [[1, '1']],
      [[1, '1', 2]],
      [['1', 2]],
    ])
  })

  it('keeps unnamed single controls mutually exclusive during consecutive native clicks', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const wrapper = mount(example(model), { attachTo: document.body })
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.click()
    inputs[0]!.element.click()
    await settle()
    expect(model.value).toBe('a')
    expect(inputs.map((input) => input.element.checked)).toEqual([true, false, false])
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toEqual([
      ['b'],
      ['a'],
    ])
  })

  it('does not let a deferred single deselection overwrite a later native selection', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const wrapper = mount(example(model, { selectionRequired: false }), {
      attachTo: document.body,
    })
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[0]!.element.click()
    inputs[1]!.element.click()
    await settle()
    expect(model.value).toBe('b')
    expect(inputs.map((input) => input.element.checked)).toEqual([false, true, false])
  })

  it('allows empty multiple selections by default but protects the last item when required', async () => {
    const model = ref<MdvSegmentedButtonModelValue>(['a'])
    const required = ref(true)
    const onInput = vi.fn<(event: Event) => void>()
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            MdvSegmentedButton,
            {
              selection: 'multiple',
              selectionRequired: required.value,
              modelValue: model.value,
              'onUpdate:modelValue': (next: MdvSegmentedButtonModelValue) => {
                model.value = next
              },
            },
            { default: () => [h(MdvSegmentedButtonItem, { value: 'a', label: '甲', onInput })] },
          ),
      }),
      { attachTo: document.body },
    )
    wrapper.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(model.value).toEqual(['a'])
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
    expect(onInput).not.toHaveBeenCalled()
    required.value = false
    await nextTick()
    wrapper.get<HTMLInputElement>('input').element.click()
    await settle()
    expect(model.value).toEqual([])
    expect(onInput).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    const defaults = mount(MdvSegmentedButton, {
      attachTo: document.body,
      props: { selection: 'multiple', modelValue: [] },
      slots: { default: defaultItems },
    })
    const input = defaults.get<HTMLInputElement>('input').element
    input.click()
    await settle()
    expect(defaults.emitted('update:modelValue')).toEqual([[['a']]])
  })

  it('restores a controlled value that the parent refuses and accepts programmatic changes silently', async () => {
    const update = vi.fn<(value: MdvSegmentedButtonModelValue) => void>()
    const wrapper = mount(MdvSegmentedButton, {
      attachTo: document.body,
      props: { modelValue: 'a', 'onUpdate:modelValue': update },
      slots: { default: defaultItems },
    })
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.click()
    await settle()
    expect(inputs.map((item) => item.element.checked)).toEqual([true, false, false])
    expect(inputs.map((item) => item.attributes('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ])
    await wrapper.setProps({ modelValue: 'c' })
    await settle()
    expect(inputs.map((item) => item.element.checked)).toEqual([false, false, true])
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(update).toHaveBeenCalledExactlyOnceWith('b')
  })

  it('respects cancellation at either the control or an ancestor, including deselection', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const cancel = ref(true)
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            'div',
            {
              onClick: (event: Event) => {
                if (cancel.value) event.preventDefault()
              },
            },
            [h(example(model, { selectionRequired: false }))],
          ),
      }),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.click()
    inputs[0]!.element.click()
    await settle()
    expect(model.value).toBe('a')
    expect(inputs.map((item) => item.element.checked)).toEqual([true, false, false])
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toBeUndefined()
    cancel.value = false
    inputs[1]!.element.addEventListener('click', (event) => event.preventDefault(), { once: true })
    inputs[1]!.element.click()
    await settle()
    expect(model.value).toBe('a')
  })

  it('starts at the first enabled segment even if a later segment is selected', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('c')
    const wrapper = mount(
      example(model, {}, () => [
        h(MdvSegmentedButtonItem, { value: 'a', label: '禁用', disabled: true }),
        h(MdvSegmentedButtonItem, { value: 'b', label: '第一可用' }),
        h(MdvSegmentedButtonItem, { value: 'c', label: '已选中' }),
      ]),
      { attachTo: document.body },
    )
    await settle()
    expect(wrapper.findAll('input').map((item) => item.attributes('tabindex'))).toEqual([
      '-1',
      '0',
      '-1',
    ])
    wrapper.getComponent(MdvSegmentedButton).vm.focus()
    expect(document.activeElement).toBe(wrapper.findAll('input')[1]!.element)
  })

  it('uses arrows and Home/End to select in a single group, skips disabled items and wraps', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const wrapper = mount(
      example(model, {}, () => [
        h(MdvSegmentedButtonItem, { value: 'a', label: '甲' }),
        h(MdvSegmentedButtonItem, { value: 'b', label: '禁用', disabled: true }),
        h(MdvSegmentedButtonItem, { value: 'c', label: '丙' }),
      ]),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[0]!.element.focus()
    await inputs[0]!.trigger('keydown', { key: 'ArrowRight' })
    await settle()
    expect(model.value).toBe('c')
    expect(document.activeElement).toBe(inputs[2]!.element)
    await inputs[2]!.trigger('keydown', { key: 'ArrowRight' })
    await settle()
    expect(model.value).toBe('a')
    await inputs[0]!.trigger('keydown', { key: 'End' })
    await settle()
    expect(model.value).toBe('c')
    await inputs[2]!.trigger('keydown', { key: 'Home' })
    await settle()
    expect(model.value).toBe('a')
  })

  it.each(['single', 'multiple'] as const)(
    'tabs through each enabled %s segment without selecting or trapping focus at the edges',
    async (selection) => {
      const initial = selection === 'single' ? 'c' : ['c']
      const model = ref<MdvSegmentedButtonModelValue>(initial)
      const wrapper = mount(
        example(model, { selection, name: 'tab-options' }, () => [
          h(MdvSegmentedButtonItem, { value: 'a', label: '甲' }),
          h(MdvSegmentedButtonItem, { value: 'b', label: '禁用', disabled: true }),
          h(MdvSegmentedButtonItem, { value: 'c', label: '丙' }),
          h(MdvSegmentedButtonItem, { value: 'd', label: '隐藏', hidden: true }),
          h(MdvSegmentedButtonItem, { value: 'e', label: '戊' }),
          h(MdvSegmentedButtonItem, { value: 'f', label: '不可交互', inert: true }),
        ]),
        { attachTo: document.body },
      )
      await settle()
      const inputs = wrapper.findAll<HTMLInputElement>('input')
      const tab = (index: number, shiftKey = false) => {
        const event = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey,
          bubbles: true,
          cancelable: true,
        })
        inputs[index]!.element.dispatchEvent(event)
        return event.defaultPrevented
      }
      inputs[0]!.element.focus()
      expect(tab(0)).toBe(true)
      expect(document.activeElement).toBe(inputs[2]!.element)
      expect(tab(2)).toBe(true)
      expect(document.activeElement).toBe(inputs[4]!.element)
      expect(tab(4)).toBe(false)
      expect(tab(4, true)).toBe(true)
      expect(document.activeElement).toBe(inputs[2]!.element)
      expect(tab(2, true)).toBe(true)
      expect(document.activeElement).toBe(inputs[0]!.element)
      expect(tab(0, true)).toBe(false)
      await settle()
      expect(model.value).toEqual(initial)
      expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toBeUndefined()
    },
  )

  it('reverses horizontal navigation in RTL and only moves focus for multiple selection', async () => {
    const model = ref<MdvSegmentedButtonModelValue>(['a'])
    const wrapper = mount(
      example(model, { selection: 'multiple', dir: 'rtl', style: { direction: 'rtl' } }),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[0]!.element.focus()
    await inputs[0]!.trigger('keydown', { key: 'ArrowLeft' })
    await settle()
    expect(document.activeElement).toBe(inputs[1]!.element)
    expect(model.value).toEqual(['a'])
    await inputs[1]!.trigger('keydown', { key: 'End' })
    await settle()
    expect(document.activeElement).toBe(inputs[2]!.element)
    expect(inputs.map((input) => input.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toBeUndefined()
  })

  it('respects cancelled keys and activates Enter once without changing button semantics', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const cancelled = ref(true)
    const wrapper = mount(
      example(model, {}, () => [
        h(MdvSegmentedButtonItem, {
          value: 'a',
          label: '甲',
          onKeydown: (event: KeyboardEvent) => {
            if (cancelled.value) event.preventDefault()
          },
        }),
        h(MdvSegmentedButtonItem, { value: 'b', label: '乙' }),
      ]),
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[0]!.element.focus()
    await inputs[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(inputs[0]!.element)
    cancelled.value = false
    await inputs[0]!.trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
    expect(document.activeElement).toBe(inputs[0]!.element)
    await inputs[1]!.trigger('keydown', { key: 'Enter' })
    await settle()
    expect(model.value).toBe('b')
    await inputs[1]!.trigger('keydown', { key: 'Enter', repeat: true })
    await settle()
    expect(wrapper.getComponent(MdvSegmentedButton).emitted('update:modelValue')).toEqual([['b']])
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('navigates in current DOM order and restores focus when the focused item is removed', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const order = ref(['a', 'b', 'c'])
    const wrapper = mount(
      example(model, {}, () =>
        order.value.map((value) => h(MdvSegmentedButtonItem, { key: value, value, label: value })),
      ),
      { attachTo: document.body },
    )
    order.value = ['c', 'a', 'b']
    await settle()
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.focus()
    await inputs[1]!.trigger('keydown', { key: 'ArrowRight' })
    await settle()
    expect(model.value).toBe('b')
    order.value = ['c', 'a']
    await settle()
    expect(document.activeElement).toBe(wrapper.findAll('input')[1]!.element)
    expect(wrapper.findAll('input').map((input) => input.attributes('tabindex'))).toEqual([
      '-1',
      '0',
    ])
  })

  it('keeps leading icons and selected-icon slots, and can omit every selected marker', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const show = ref(true)
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            MdvSegmentedButton,
            { modelValue: model.value, showSelectedIcon: show.value },
            {
              default: () => [
                h(
                  MdvSegmentedButtonItem,
                  { value: 'a', label: '文字' },
                  {
                    leading: () => h('span', { 'data-leading': 'text' }, '图'),
                    'selected-icon': () => h('span', { 'data-custom-check': '' }, '✓'),
                  },
                ),
                h(
                  MdvSegmentedButtonItem,
                  { value: 'b', 'aria-label': '纯图标' },
                  { leading: () => h('span', { 'data-leading': 'icon' }, '图') },
                ),
              ],
            },
          ),
      }),
    )
    expect(wrapper.findAll('.mdv-segmented-button__check')).toHaveLength(2)
    expect(wrapper.find('[data-custom-check]').exists()).toBe(true)
    expect(wrapper.findAll('[data-leading]')).toHaveLength(2)
    model.value = 'b'
    await nextTick()
    expect(wrapper.find('[data-leading="icon"]').exists()).toBe(true)
    expect(wrapper.get('input[aria-label="纯图标"]').attributes('aria-checked')).toBe('true')
    show.value = false
    await nextTick()
    expect(wrapper.find('.mdv-segmented-button__check').exists()).toBe(false)
    expect(wrapper.findAll('[data-leading]')).toHaveLength(2)
  })

  it('honors disabled groups, items and fieldsets for activation, navigation and submission', async () => {
    const model = ref<MdvSegmentedButtonModelValue>(['a'])
    const disabled = ref(false)
    const fieldsetDisabled = ref(true)
    const Group = example(model, {
      name: 'choice',
      selection: 'multiple',
      get disabled() {
        return disabled.value
      },
    })
    const wrapper = mount(
      defineComponent({
        render: () => h('form', [h('fieldset', { disabled: fieldsetDisabled.value }, [h(Group)])]),
      }),
      { attachTo: document.body },
    )
    await settle()
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1]!.element.click()
    await inputs[0]!.trigger('keydown', { key: 'ArrowRight' })
    await settle()
    expect(model.value).toEqual(['a'])
    expect(inputs.map((input) => input.element.tabIndex)).toEqual([-1, -1, -1])
    expect([...new FormData(wrapper.get<HTMLFormElement>('form').element)]).toEqual([])
    fieldsetDisabled.value = false
    await settle()
    expect(inputs.map((input) => input.element.tabIndex)).toEqual([0, -1, -1])
    disabled.value = true
    await nextTick()
    expect(inputs.every((input) => input.element.disabled)).toBe(true)
  })

  it('submits only selected named native fields and leaves unnamed groups out of FormData', async () => {
    const single = ref<MdvSegmentedButtonModelValue>('b')
    const multi = ref<MdvSegmentedButtonModelValue>([1, '1'])
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('form', [
            h(example(single, { name: 'view' })),
            h(
              example(multi, { name: 'flags', selection: 'multiple' }, () => [
                h(MdvSegmentedButtonItem, { value: 1, label: '数值' }),
                h(MdvSegmentedButtonItem, { value: '1', label: '文本' }),
              ]),
            ),
            h(example(single)),
          ]),
      }),
      { attachTo: document.body },
    )
    await settle()
    expect([...new FormData(wrapper.get<HTMLFormElement>('form').element)]).toEqual([
      ['view', 'b'],
      ['flags', '1'],
      ['flags', '1'],
    ])
  })

  it('restores the initial array on native reset and respects a cancelled reset', async () => {
    const original = ['a']
    const model = ref<MdvSegmentedButtonModelValue>(original)
    const wrapper = mount(
      defineComponent({
        render: () => h('form', [h(example(model, { name: 'flags', selection: 'multiple' }))]),
      }),
      { attachTo: document.body },
    )
    const form = wrapper.get<HTMLFormElement>('form').element
    wrapper.findAll<HTMLInputElement>('input')[1]!.element.click()
    await settle()
    expect(model.value).toEqual(['a', 'b'])
    form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
    form.reset()
    await settle()
    expect(model.value).toEqual(['a', 'b'])
    form.reset()
    await settle()
    expect(model.value).toEqual(['a'])
    expect(model.value).not.toBe(original)
    expect(
      wrapper.findAll<HTMLInputElement>('input').map((input) => input.element.checked),
    ).toEqual([true, false, false])
  })

  it('moves external form reset listeners when association changes and removes them on unmount', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const formId = ref('one')
    const visible = ref(true)
    const update = vi.fn<(value: MdvSegmentedButtonModelValue) => void>()
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('div', [
            h('form', { id: 'one' }),
            h('form', { id: 'two' }),
            visible.value
              ? h(
                  MdvSegmentedButton,
                  {
                    modelValue: model.value,
                    name: 'view',
                    form: formId.value,
                    'onUpdate:modelValue': (next: MdvSegmentedButtonModelValue) => {
                      model.value = next
                      update(next)
                    },
                  },
                  { default: defaultItems },
                )
              : null,
          ]),
      }),
      { attachTo: document.body },
    )
    await settle()
    const forms = wrapper.findAll<HTMLFormElement>('form')
    wrapper.findAll<HTMLInputElement>('input')[1]!.element.click()
    await settle()
    expect([...new FormData(forms[0]!.element)]).toEqual([['view', 'b']])
    formId.value = 'two'
    await settle()
    forms[0]!.element.reset()
    await settle()
    expect(model.value).toBe('b')
    forms[1]!.element.reset()
    await settle()
    expect(model.value).toBe('a')
    visible.value = false
    await settle()
    update.mockClear()
    forms[1]!.element.reset()
    await settle()
    expect(update).not.toHaveBeenCalled()
  })

  it('updates density and full-width layout without affecting selection', async () => {
    const wrapper = mount(MdvSegmentedButton, {
      props: { modelValue: 'a', density: -2, fullWidth: true },
      slots: { default: defaultItems },
    })
    expect(wrapper.attributes('style')).toContain('--mdv-segmented-button-height: 32px')
    expect(wrapper.classes()).toContain('mdv-segmented-button--full-width')
    await wrapper.setProps({ density: -3, fullWidth: false })
    expect(wrapper.attributes('style')).toContain('--mdv-segmented-button-height: 28px')
    expect(wrapper.classes()).not.toContain('mdv-segmented-button--full-width')
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps each segment ripple independent and releases a pointer without losing selection', async () => {
    const wrapper = mount(MdvSegmentedButton, {
      attachTo: document.body,
      props: { modelValue: 'a' },
      slots: { default: defaultItems },
    })
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[0]!.element.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 10, clientY: 10 }),
    )
    await nextTick()
    const labels = wrapper.findAll('label')
    expect(labels[0]!.find('.mdv-segmented-button__ripple').exists()).toBe(true)
    expect(labels[1]!.find('.mdv-segmented-button__ripple').exists()).toBe(false)
    inputs[0]!.element.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    await nextTick()
    expect(labels[0]!.find('.mdv-segmented-button__ripple--released').exists()).toBe(true)
    expect(inputs[0]!.element.checked).toBe(true)
    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('.mdv-segmented-button__ripple').exists()).toBe(false)
  })

  it('exposes focus and blur without blurring an unrelated control', async () => {
    const model = ref<MdvSegmentedButtonModelValue>('a')
    const wrapper = mount(example(model), { attachTo: document.body })
    const group = wrapper.getComponent(MdvSegmentedButton)
    const item = wrapper.getComponent(MdvSegmentedButtonItem)
    const input = wrapper.get<HTMLInputElement>('input').element
    group.vm.focus()
    expect(document.activeElement).toBe(input)
    item.vm.blur()
    expect(document.activeElement).not.toBe(input)
    item.vm.focus()
    group.vm.blur()
    expect(document.activeElement).not.toBe(input)
    const other = document.createElement('button')
    document.body.append(other)
    other.focus()
    group.vm.blur()
    expect(document.activeElement).toBe(other)
  })
})
