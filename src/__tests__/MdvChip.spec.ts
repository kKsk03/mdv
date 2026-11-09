import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import MdvChip from '../components/MdvChip.vue'
import MdvChipSet from '../components/MdvChipSet.vue'
import type {
  MdvChipSetModelValue,
  MdvChipSetSelection,
  MdvChipValue,
} from '../components/chip.types'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

async function settle() {
  await nextTick()
  await nextTick()
}

function filterExample(
  model: Ref<MdvChipSetModelValue>,
  selection: MdvChipSetSelection,
  options: Array<{ value: MdvChipValue; label: string; disabled?: boolean }> = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B', disabled: true },
    { value: 'c', label: 'C' },
  ],
  setProps: Record<string, unknown> = {},
) {
  return defineComponent({
    setup: () => () =>
      h(
        MdvChipSet,
        {
          label: '筛选内容',
          ...setProps,
          selection,
          modelValue: model.value,
          'onUpdate:modelValue': (value: MdvChipSetModelValue) => {
            model.value = value
          },
        },
        {
          default: () =>
            options.map((option, index) =>
              h(MdvChip, {
                key: index,
                ...option,
                variant: 'filter',
              }),
            ),
        },
      ),
  })
}

describe('MdvChip', () => {
  it('uses a non-submitting action and forwards native attributes to it and layout attributes outside', () => {
    const wrapper = mount(MdvChip, {
      props: { label: '加入日历' },
      attrs: {
        id: 'calendar-chip',
        'aria-describedby': 'calendar-help',
        'data-action': 'calendar',
        class: 'custom-chip',
        style: { '--mdv-chip-color': 'red' },
        dir: 'rtl',
        lang: 'zh-CN',
      },
    })
    expect(wrapper.classes()).toContain('mdv-chip--assist')
    expect(wrapper.classes()).toContain('custom-chip')
    expect(wrapper.attributes()).toMatchObject({ dir: 'rtl', lang: 'zh-CN' })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--mdv-chip-color')).toBe('red')
    expect(wrapper.get('button').attributes()).toMatchObject({
      id: 'calendar-chip',
      type: 'button',
      'aria-describedby': 'calendar-help',
      'data-action': 'calendar',
    })
    expect(wrapper.get('button').attributes('aria-pressed')).toBeUndefined()
    expect(wrapper.get('button').text()).toBe('加入日历')
  })

  it('uses the default slot once and keeps decorative icons out of its accessible name', () => {
    const label = vi.fn<() => ReturnType<typeof h>[]>(() => [h('strong', '自定义标签')])
    const wrapper = mount(MdvChip, {
      slots: { default: label, leading: () => h('span', '图标') },
    })
    expect(label).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('strong')).toHaveLength(1)
    expect(wrapper.get('.mdv-chip__leading-track').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.mdv-chip__leading-track').attributes('inert')).toBeDefined()
  })

  it('toggles an uncontrolled Filter without duplicating native click events', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvChip, {
      props: { variant: 'filter', label: '图片' },
      attrs: { onClick: click },
    })
    const primary = wrapper.get<HTMLButtonElement>('.mdv-chip__primary')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    primary.element.dispatchEvent(event)
    await settle()
    expect(click).toHaveBeenCalledExactlyOnceWith(event)
    expect(primary.attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('update:selected')).toEqual([[true]])
    primary.element.click()
    await settle()
    expect(primary.attributes('aria-pressed')).toBe('false')
    expect(wrapper.emitted('update:selected')).toEqual([[true], [false]])
  })

  it('keeps a rejected controlled selection unchanged and accepts programmatic updates', async () => {
    const update = vi.fn<(selected: boolean) => void>()
    const wrapper = mount(MdvChip, {
      props: { variant: 'filter', selected: false, label: '图片', 'onUpdate:selected': update },
    })
    wrapper.get<HTMLButtonElement>('button').element.click()
    await settle()
    expect(update).toHaveBeenCalledExactlyOnceWith(true)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    await wrapper.setProps({ selected: true })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('supports v-model:selected and accumulates rapid toggles before the parent renders', async () => {
    const selected = ref(false)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvChip, {
            variant: 'filter',
            label: '图片',
            selected: selected.value,
            'onUpdate:selected': (value: boolean) => {
              selected.value = value
            },
          }),
      }),
    )
    const primary = wrapper.get<HTMLButtonElement>('button').element
    primary.click()
    primary.click()
    await settle()
    expect(selected.value).toBe(false)
    expect(wrapper.getComponent(MdvChip).emitted('update:selected')).toEqual([[true], [false]])
  })

  it('respects a cancelled click and selectable=false', async () => {
    const wrapper = mount(MdvChip, {
      props: { variant: 'filter', label: '图片' },
      attrs: { onClick: (event: MouseEvent) => event.preventDefault() },
    })
    wrapper.get<HTMLButtonElement>('button').element.click()
    await settle()
    expect(wrapper.emitted('update:selected')).toBeUndefined()
    await wrapper.setProps({ selectable: false })
    expect(wrapper.get('button').attributes('aria-pressed')).toBeUndefined()
  })

  it('keeps Input actions unselected by default and opts into selection explicitly', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvChip, {
      props: { variant: 'input', label: '收件人' },
      attrs: { onClick: click },
    })
    wrapper.get<HTMLButtonElement>('.mdv-chip__primary').element.click()
    await settle()
    expect(click).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:selected')).toBeUndefined()
    expect(wrapper.get('.mdv-chip__primary').attributes('aria-pressed')).toBeUndefined()
    await wrapper.setProps({ selectable: true })
    wrapper.get<HTMLButtonElement>('.mdv-chip__primary').element.click()
    await settle()
    expect(wrapper.get('.mdv-chip__primary').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('.mdv-chip__check').exists()).toBe(false)
  })

  it('makes removal a separately named action without clicking or selecting the primary action', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const remove = vi.fn<(event: MouseEvent | KeyboardEvent) => void>()
    const wrapper = mount(MdvChip, {
      props: { variant: 'input', label: '林同学', selectable: true, onRemove: remove },
      attrs: { onClick: click },
    })
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.find('button button').exists()).toBe(false)
    const button = wrapper.get<HTMLButtonElement>('.mdv-chip__remove')
    expect(button.attributes('aria-label')).toBe('删除林同学')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    button.element.dispatchEvent(event)
    await settle()
    expect(remove).toHaveBeenCalledExactlyOnceWith(event)
    expect(click).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:selected')).toBeUndefined()
    expect(wrapper.exists()).toBe(true)
  })

  it('requests deletion with Delete or Backspace, allowing user cancellation and ignoring repeat', async () => {
    const remove = vi.fn<(event: MouseEvent | KeyboardEvent) => void>()
    const wrapper = mount(MdvChip, { props: { variant: 'input', label: '标签', onRemove: remove } })
    const primary = wrapper.get('button')
    await primary.trigger('keydown', { key: 'Delete', repeat: true })
    expect(remove).not.toHaveBeenCalled()
    await primary.trigger('keydown', { key: 'Backspace', ctrlKey: true })
    expect(remove).not.toHaveBeenCalled()
    await primary.trigger('keydown', { key: 'Delete' })
    expect(remove).toHaveBeenCalledExactlyOnceWith(expect.any(KeyboardEvent))
    const cancelled = mount(MdvChip, {
      props: { variant: 'input', label: '取消删除', onRemove: remove },
      attrs: { onKeydown: (event: KeyboardEvent) => event.preventDefault() },
    })
    await cancelled.get('button').trigger('keydown', { key: 'Backspace' })
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('merges a remove-only Input into one action with its delete name', async () => {
    const wrapper = mount(MdvChip, {
      props: {
        variant: 'input',
        label: '收件人',
        removeOnly: true,
        removeLabel: '移除联系人',
        selectable: true,
      },
    })
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.get('button').attributes('aria-label')).toBe('移除联系人')
    expect(wrapper.get('button').attributes('aria-pressed')).toBeUndefined()
    wrapper.get<HTMLButtonElement>('button').element.click()
    await settle()
    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.emitted('update:selected')).toBeUndefined()
  })

  it('lets removable and trailing choose the end content without losing the built-in delete action', async () => {
    const wrapper = mount(MdvChip, {
      props: { variant: 'input', label: '文件' },
      slots: { trailing: () => h('span', { 'data-custom-close': '' }, '移除') },
    })
    expect(wrapper.find('.mdv-chip__remove [data-custom-close]').exists()).toBe(true)
    wrapper.get<HTMLButtonElement>('.mdv-chip__remove').element.click()
    expect(wrapper.emitted('remove')).toHaveLength(1)
    await wrapper.setProps({ removable: false })
    expect(wrapper.find('.mdv-chip__remove').exists()).toBe(false)
    expect(wrapper.findAll('[data-custom-close]')).toHaveLength(1)
  })

  it('keeps avatar content decorative and gives it precedence over a leading icon', () => {
    const wrapper = mount(MdvChip, {
      props: { variant: 'input', label: '联系人' },
      slots: { avatar: () => h('span', '林'), leading: () => h('span', '图标') },
    })
    expect(wrapper.get('.mdv-chip__avatar').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.mdv-chip__leading-icon').exists()).toBe(false)
  })

  it('forwards link attributes only for action variants and disables native link activation', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvChip, {
      props: { variant: 'suggestion', label: '查看文档', href: '/guide' },
      attrs: { target: '_blank', rel: 'noopener', onClick: click },
    })
    expect(wrapper.get('a').attributes()).toMatchObject({
      href: '/guide',
      target: '_blank',
      rel: 'noopener',
    })
    await wrapper.setProps({ disabled: true })
    expect(wrapper.get('a').attributes()).toMatchObject({
      role: 'link',
      'aria-disabled': 'true',
      tabindex: '-1',
    })
    expect(wrapper.get('a').attributes('href')).toBeUndefined()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.get('a').element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(click).not.toHaveBeenCalled()
    await wrapper.setProps({ disabled: false })
    expect(wrapper.get('a').attributes('href')).toBe('/guide')
  })

  it('ignores href for selection variants and elevated for Input', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(MdvChip, {
      props: { variant: 'input', label: '内容', href: '/ignored', elevated: true },
    })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('mdv-chip--elevated')
    expect(warning).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('href'))
  })

  it('respects disabled props and native fieldsets for both actions', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const remove = vi.fn<(event: MouseEvent | KeyboardEvent) => void>()
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('fieldset', { disabled: true }, [
            h(MdvChip, {
              variant: 'input',
              label: '禁用内容',
              selectable: true,
              onClick: click,
              onRemove: remove,
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    for (const button of wrapper.findAll<HTMLButtonElement>('button')) button.element.click()
    await settle()
    expect(click).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(wrapper.getComponent(MdvChip).emitted('update:selected')).toBeUndefined()
  })

  it('resolves local presets and seed colors, clears overrides and rejects invalid colors', async () => {
    const wrapper = mount(MdvChip, { props: { label: '配色', color: 'success' } })
    const root = wrapper.element as HTMLElement
    expect(root.style.getPropertyValue('--mdv-chip-color')).toBe('var(--mdv-sys-color-success)')
    await wrapper.setProps({ color: '#06c' })
    expect(root.style.getPropertyValue('--mdv-chip-container-color')).toMatch(/^light-dark\(/)
    expect(document.documentElement.style.getPropertyValue('--mdv-sys-color-primary')).toBe('')
    await wrapper.setProps({ color: undefined })
    expect(root.style.getPropertyValue('--mdv-chip-color')).toBe('')
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await wrapper.setProps({ color: '#invalid' })
    expect(root.style.getPropertyValue('--mdv-chip-color')).toBe('')
    expect(warning).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('unsupported color'))
  })

  it('keeps primary and removal ripples independent and releases them without clearing selection', async () => {
    const wrapper = mount(MdvChip, {
      attachTo: document.body,
      props: { variant: 'input', label: '内容', selectable: true },
    })
    const primary = wrapper.get('.mdv-chip__primary')
    primary.element.dispatchEvent(
      new MouseEvent('pointerdown', { button: 0, clientX: 10, clientY: 10, bubbles: true }),
    )
    await nextTick()
    expect(wrapper.find('.mdv-chip__surface .mdv-chip__ripple').exists()).toBe(true)
    expect(wrapper.find('.mdv-chip__remove-surface .mdv-chip__ripple').exists()).toBe(false)
    await primary.trigger('pointerup')
    expect(wrapper.get('.mdv-chip__surface .mdv-chip__ripple').classes()).toContain(
      'mdv-chip__ripple--released',
    )
    wrapper
      .get('.mdv-chip__remove')
      .element.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    await nextTick()
    expect(wrapper.find('.mdv-chip__remove-surface .mdv-chip__ripple').exists()).toBe(true)
    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('.mdv-chip__ripple').exists()).toBe(false)
  })

  it('exposes focus and blur without blurring another control', () => {
    const wrapper = mount(MdvChip, { attachTo: document.body, props: { label: '焦点' } })
    wrapper.vm.focus({ preventScroll: true })
    expect(document.activeElement).toBe(wrapper.get('button').element)
    wrapper.vm.blur()
    expect(document.activeElement).toBe(document.body)
    const external = document.createElement('input')
    document.body.append(external)
    external.focus()
    wrapper.vm.blur()
    expect(document.activeElement).toBe(external)
  })
})

describe('MdvChipSet', () => {
  it('names the toolbar and uses its selected filter as the only tab stop', () => {
    const model = ref<MdvChipSetModelValue>('c')
    const wrapper = mount(filterExample(model, 'single'), { attachTo: document.body })
    const group = wrapper.getComponent(MdvChipSet)
    expect(group.attributes('role')).toBe('toolbar')
    expect(group.attributes('aria-labelledby')).toBe(
      group.get('.mdv-chip-set__label').attributes('id'),
    )
    expect(wrapper.findAll('button').map((button) => button.attributes('tabindex'))).toEqual([
      '-1',
      '-1',
      '0',
    ])
  })

  it('keeps string and number values distinct and allows clearing a single selection', async () => {
    const model = ref<MdvChipSetModelValue>('1')
    const wrapper = mount(
      filterExample(model, 'single', [
        { value: 1, label: '数字' },
        { value: '1', label: '字符串' },
      ]),
    )
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['false', 'true'])
    buttons[0]!.element.click()
    await settle()
    expect(model.value).toBe(1)
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['true', 'false'])
    buttons[0]!.element.click()
    await settle()
    expect(model.value).toBeNull()
    expect(
      wrapper.findAllComponents(MdvChip).every((chip) => !chip.emitted('update:selected')),
    ).toBe(true)
  })

  it('creates new arrays and accumulates rapid multi-selection without mutating the source', async () => {
    const initial: MdvChipValue[] = ['a']
    const model = ref<MdvChipSetModelValue>(initial)
    const wrapper = mount(filterExample(model, 'multiple'))
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    buttons[2]!.element.click()
    buttons[0]!.element.click()
    await settle()
    expect(model.value).toEqual(['c'])
    expect(initial).toEqual(['a'])
    expect(wrapper.getComponent(MdvChipSet).emitted('update:modelValue')).toEqual([
      [['a', 'c']],
      [['c']],
    ])
  })

  it('preserves controlled group state when the parent rejects an update', async () => {
    const update = vi.fn<(value: MdvChipSetModelValue) => void>()
    const wrapper = mount(MdvChipSet, {
      props: {
        selection: 'multiple',
        modelValue: ['a'],
        'onUpdate:modelValue': update,
        label: '受控',
      },
      slots: { default: () => h(MdvChip, { variant: 'filter', value: 'a', label: 'A' }) },
    })
    wrapper.get<HTMLButtonElement>('button').element.click()
    await settle()
    expect(update).toHaveBeenCalledExactlyOnceWith([])
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('moves focus with arrows and Home/End without changing selection and skips disabled items', async () => {
    const model = ref<MdvChipSetModelValue>('a')
    const wrapper = mount(filterExample(model, 'single'), { attachTo: document.body })
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    buttons[0]!.element.focus()
    await buttons[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[2]!.element)
    expect(model.value).toBe('a')
    await buttons[2]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(buttons[0]!.element)
    await buttons[0]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(buttons[2]!.element)
    await buttons[2]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[0]!.element)
    expect(model.value).toBe('a')
  })

  it('reverses horizontal navigation in RTL and honors cancelled or modified keys', async () => {
    const model = ref<MdvChipSetModelValue>(null)
    const wrapper = mount(filterExample(model, 'single', undefined, { dir: 'rtl' }), {
      attachTo: document.body,
    })
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    buttons[0]!.element.focus()
    await buttons[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(buttons[2]!.element)
    await buttons[2]!.trigger('keydown', { key: 'ArrowLeft', ctrlKey: true })
    expect(document.activeElement).toBe(buttons[2]!.element)
    buttons[2]!.element.addEventListener('keydown', (event) => event.preventDefault(), {
      once: true,
    })
    await buttons[2]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(buttons[2]!.element)
  })

  it('uses current DOM order after keyed items are reordered', async () => {
    const items = ref(['a', 'b', 'c'])
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvChipSet,
            { label: '排序' },
            {
              default: () => items.value.map((item) => h(MdvChip, { key: item, label: item })),
            },
          ),
      }),
      { attachTo: document.body },
    )
    items.value = ['c', 'a', 'b']
    await settle()
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    buttons[0]!.element.focus()
    await buttons[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement?.textContent).toBe('a')
  })

  it('navigates independent primary/remove actions and restores focus after actual removal', async () => {
    const items = ref(['a', 'b', 'c'])
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvChipSet,
            { label: '标签' },
            {
              default: () =>
                items.value.map((item) =>
                  h(MdvChip, {
                    key: item,
                    variant: 'input',
                    label: item,
                    onRemove: () => {
                      items.value = items.value.filter((value) => value !== item)
                    },
                  }),
                ),
            },
          ),
      }),
      { attachTo: document.body },
    )
    const group = wrapper.getComponent(MdvChipSet)
    const chips = wrapper.findAllComponents(MdvChip)
    chips[1]!.get<HTMLButtonElement>('.mdv-chip__primary').element.focus()
    await chips[1]!.get('.mdv-chip__primary').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(chips[1]!.get('.mdv-chip__remove').element)
    chips[1]!.get<HTMLButtonElement>('.mdv-chip__remove').element.click()
    await settle()
    expect(document.activeElement?.textContent).toBe('c')
    await wrapper.findAllComponents(MdvChip)[1]!.get('button').trigger('keydown', { key: 'Delete' })
    await settle()
    expect(document.activeElement?.textContent).toBe('a')
    await wrapper.get('button').trigger('keydown', { key: 'Backspace' })
    await settle()
    expect(document.activeElement).toBe(group.element)
    expect(group.attributes('tabindex')).toBe('0')
  })

  it('does not steal focus if the removal handler places it in another control', async () => {
    const show = ref(true)
    const external = document.createElement('input')
    document.body.append(external)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvChipSet,
            { label: '标签' },
            {
              default: () =>
                show.value
                  ? h(MdvChip, {
                      variant: 'input',
                      label: 'A',
                      onRemove: () => {
                        show.value = false
                        external.focus()
                      },
                    })
                  : [],
            },
          ),
      }),
      { attachTo: document.body },
    )
    const remove = wrapper.get<HTMLButtonElement>('.mdv-chip__remove').element
    remove.focus()
    remove.click()
    await settle()
    expect(document.activeElement).toBe(external)
  })

  it('keeps local selection in selection=none and propagates disabled to every action', async () => {
    const wrapper = mount(MdvChipSet, {
      props: { label: '独立状态' },
      slots: {
        default: () => [
          h(MdvChip, { variant: 'filter', label: 'A' }),
          h(MdvChip, { variant: 'input', label: 'B' }),
        ],
      },
    })
    wrapper.get<HTMLButtonElement>('button').element.click()
    await settle()
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ disabled: true })
    expect(
      wrapper.findAll<HTMLButtonElement>('button').every((button) => button.element.disabled),
    ).toBe(true)
    expect(
      wrapper.findAll('button').every((button) => button.attributes('tabindex') === '-1'),
    ).toBe(true)
    expect(wrapper.attributes('tabindex')).toBe('-1')
  })

  it('keeps form actions non-submitting and exposes only owned focus methods', () => {
    const submitted = vi.fn<(event: SubmitEvent) => void>()
    const wrapper = mount(
      defineComponent({
        render: () =>
          h('form', { onSubmit: submitted }, [
            h(
              MdvChipSet,
              { label: '操作' },
              {
                default: () => [
                  h(MdvChip, { label: 'A' }),
                  h(MdvChip, { variant: 'input', label: 'B' }),
                ],
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const group = wrapper.getComponent(MdvChipSet)
    group.vm.focus()
    expect(document.activeElement).toBe(wrapper.get('button').element)
    wrapper.get<HTMLButtonElement>('button').element.click()
    expect(submitted).not.toHaveBeenCalled()
    expect([...new FormData(wrapper.get<HTMLFormElement>('form').element)]).toEqual([])
    group.vm.blur()
    expect(document.activeElement).toBe(document.body)
  })
})
