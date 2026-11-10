import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { MdvList, MdvListItem, MdvListSubheader } from '../index'
import type { MdvListLayout, MdvListModelValue, MdvListVariant } from '../index'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

async function settle() {
  await nextTick()
  await nextTick()
}

describe('MdvList', () => {
  it('supports the four visual combinations and gives an explicit layout priority over the shorthand', async () => {
    for (const variant of ['expressive', 'baseline'] as MdvListVariant[]) {
      for (const layout of ['standard', 'segmented'] as MdvListLayout[]) {
        const wrapper = mount(MdvList, {
          props: { variant, layout, segmented: true },
          slots: { default: () => h(MdvListItem, { headline: '条目' }) },
        })
        expect(wrapper.classes()).toEqual(
          expect.arrayContaining(['mdv-list--' + variant, 'mdv-list--' + layout]),
        )
        expect(wrapper.findAll('.mdv-list-item__shape')).toHaveLength(1)
        expect(wrapper.get('.mdv-list-item__shape').element.parentElement).toBe(
          wrapper.get('li').element,
        )
      }
    }
    const shorthand = mount(MdvList, {
      props: { segmented: true },
      slots: { default: () => h(MdvListItem, { headline: '条目' }) },
    })
    expect(shorthand.classes()).toContain('mdv-list--segmented')
    await shorthand.setProps({ segmented: false })
    expect(shorthand.classes()).toContain('mdv-list--standard')
  })

  it('keeps static rows, native buttons and native links in a semantic list', () => {
    const wrapper = mount(MdvList, {
      attrs: { id: 'settings', 'aria-label': '设置', dir: 'rtl' },
      slots: {
        default: () => [
          h(MdvListItem, { headline: '静态内容' }),
          h(MdvListItem, { interactive: true, headline: '按钮' }),
          h(MdvListItem, {
            href: '/settings',
            headline: '链接',
            target: '_blank',
            rel: 'noopener',
          }),
        ],
      },
    })
    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.attributes()).toMatchObject({
      role: 'list',
      id: 'settings',
      dir: 'rtl',
    })
    const rows = wrapper.findAll('li')
    expect(rows.map((row) => row.attributes('role'))).toEqual(['listitem', 'listitem', 'listitem'])
    expect(rows[0]!.get('.mdv-list-item__primary').element.tagName).toBe('DIV')
    expect(rows[0]!.find('[tabindex]').exists()).toBe(false)
    expect(rows[1]!.get('button').attributes('type')).toBe('button')
    expect(rows[2]!.get('a').attributes()).toMatchObject({
      href: '/settings',
      target: '_blank',
      rel: 'noopener',
    })
  })

  it('infers text line counts, inherits the list default and lets an item override it', () => {
    const inferred = mount(MdvList, {
      slots: {
        default: () => [
          h(MdvListItem, { headline: '一行' }),
          h(MdvListItem, { headline: '两行', supportingText: '辅助文字' }),
          h(MdvListItem, {
            overline: '标签',
            headline: '三行',
            supportingText: '辅助文字',
          }),
        ],
      },
    })
    expect(inferred.findAll('.mdv-list-item').map((row) => row.classes())).toEqual([
      expect.arrayContaining(['mdv-list-item--one-line']),
      expect.arrayContaining(['mdv-list-item--two-line']),
      expect.arrayContaining(['mdv-list-item--three-line']),
    ])
    const inherited = mount(MdvList, {
      props: { lines: 3 },
      slots: {
        default: () => [
          h(MdvListItem, { headline: '继承' }),
          h(MdvListItem, { headline: '覆盖', lines: 2 }),
        ],
      },
    })
    expect(inherited.findAll('.mdv-list-item')[0]!.classes()).toContain('mdv-list-item--three-line')
    expect(inherited.findAll('.mdv-list-item')[1]!.classes()).toContain('mdv-list-item--two-line')
  })

  it('associates the headline, supporting text and external descriptions with the actual primary', () => {
    const wrapper = mount(MdvListItem, {
      props: {
        interactive: true,
        headline: '名称',
        supportingText: '帮助',
        overline: '个人资料',
      },
      attrs: { 'aria-describedby': 'external external' },
    })
    const primary = wrapper.get('button')
    expect(primary.attributes('aria-labelledby')).toBe(
      wrapper.get('.mdv-list-item__headline').attributes('id'),
    )
    expect(primary.attributes('aria-describedby')?.split(' ')).toEqual([
      'external',
      wrapper.get('.mdv-list-item__supporting').attributes('id'),
    ])
    const named = mount(MdvListItem, {
      props: { interactive: true, headline: '可见标题' },
      attrs: { 'aria-label': '自定义名称' },
    })
    expect(named.get('button').attributes('aria-label')).toBe('自定义名称')
    expect(named.get('button').attributes('aria-labelledby')).toBeUndefined()
    expect(named.find('.mdv-list-item__supporting').exists()).toBe(false)
  })

  it('lets content and display slots replace their convenience content without dangling label ids', () => {
    const wrapper = mount(MdvListItem, {
      props: {
        interactive: true,
        headline: '原标题',
        trailingText: '原尾部',
        avatarName: '林',
      },
      slots: {
        content: () => h('span', '自定义正文'),
        leading: () => h('span', { 'data-avatar': true }, '头像'),
        trailing: () => h('span', { 'data-trailing': true }, '尾部'),
      },
    })
    const content = wrapper.get('.mdv-list-item__content')
    expect(wrapper.get('button').attributes('aria-labelledby')).toBe(content.attributes('id'))
    expect(content.text()).toBe('自定义正文')
    expect(wrapper.find('.mdv-list-item__headline').exists()).toBe(false)
    expect(wrapper.find('.mdv-list-item__avatar').exists()).toBe(false)
    expect(wrapper.get('[data-avatar]').text()).toBe('头像')
    expect(wrapper.get('[data-trailing]').text()).toBe('尾部')
    expect(wrapper.text()).not.toContain('原尾部')
  })

  it('renders avatar and image content separately and keeps selection indicators non-interactive', () => {
    const wrapper = mount(MdvList, {
      slots: {
        default: () => [
          h(MdvListItem, { headline: '头像', avatarName: '😀名字' }),
          h(MdvListItem, { headline: '图片', image: 'thumbnail.png' }),
          h(MdvListItem, {
            headline: '图片头像',
            leading: 'avatar',
            image: 'avatar.png',
          }),
          h(MdvListItem, {
            interactive: true,
            headline: '复选',
            leading: 'checkbox',
            selected: true,
          }),
          h(MdvListItem, {
            interactive: true,
            headline: '单选',
            trailing: 'radio',
            trailingValue: true,
          }),
          h(MdvListItem, {
            interactive: true,
            headline: '开关',
            trailing: 'switch',
            trailingValue: true,
          }),
        ],
      },
    })
    expect(wrapper.get('.mdv-list-item__avatar').text()).toBe('😀')
    expect(wrapper.get('.mdv-list-item__leading--image img').attributes()).toMatchObject({
      src: 'thumbnail.png',
      alt: '',
    })
    expect(wrapper.get('.mdv-list-item__avatar img').attributes('src')).toBe('avatar.png')
    const controls = wrapper.findAll('.mdv-list-item__control')
    expect(controls).toHaveLength(3)
    for (const control of controls) {
      expect(control.attributes('aria-hidden')).toBe('true')
      expect(control.classes()).toContain('mdv-list-item__control--on')
      expect(control.find('input, button, [tabindex]').exists()).toBe(false)
    }
  })

  it.each(['single', 'multiple'] as const)(
    'keeps selection indicators synchronized with a controlled %s selection',
    async (selectionMode) => {
      const single = selectionMode === 'single'
      const selected = ref<MdvListModelValue>(single ? 'first' : ['first'])
      const control = single ? ({ leading: 'radio' } as const) : ({ trailing: 'checkbox' } as const)
      const Example = defineComponent({
        setup() {
          return () =>
            h(
              MdvList,
              {
                selectionMode,
                modelValue: selected.value,
                'onUpdate:modelValue': (value: MdvListModelValue) => {
                  selected.value = value
                },
              },
              () => [
                h(MdvListItem, { ...control, value: 'first', headline: '第一项' }),
                h(MdvListItem, { ...control, value: 'second', headline: '第二项' }),
              ],
            )
        },
      })
      const wrapper = mount(Example)
      await settle()
      const controls = wrapper.findAll('.mdv-list-item__control')
      const options = wrapper.findAll('[role="option"]')
      const indicatorStates = () =>
        controls.map((control) => control.classes().includes('mdv-list-item__control--on'))
      expect(indicatorStates()).toEqual([true, false])

      await controls[1]!.trigger('click')
      expect(selected.value).toEqual(single ? 'second' : ['first', 'second'])
      expect(indicatorStates()).toEqual(single ? [false, true] : [true, true])
      expect(options.map((option) => option.attributes('aria-selected'))).toEqual(
        single ? ['false', 'true'] : ['true', 'true'],
      )

      await options[0]!.trigger('keydown', { key: ' ' })
      expect(selected.value).toEqual(single ? 'first' : ['second'])
      expect(indicatorStates()).toEqual(single ? [true, false] : [false, true])

      selected.value = single ? null : []
      await settle()
      expect(indicatorStates()).toEqual([false, false])
    },
  )

  it('honors explicit indicator values and resumes following selection when they are omitted', async () => {
    const wrapper = mount(MdvListItem, {
      props: {
        headline: '独立显示值',
        selected: true,
        leading: 'radio',
        trailing: 'checkbox',
        leadingValue: false,
        trailingValue: false,
      },
    })
    const indicatorStates = () =>
      wrapper
        .findAll('.mdv-list-item__control')
        .map((control) => control.classes().includes('mdv-list-item__control--on'))
    expect(indicatorStates()).toEqual([false, false])
    await wrapper.setProps({ selected: false, leadingValue: true, trailingValue: true })
    expect(indicatorStates()).toEqual([true, true])
    await wrapper.setProps({ leadingValue: undefined, trailingValue: undefined })
    expect(indicatorStates()).toEqual([false, false])
    await wrapper.setProps({ selected: true })
    expect(indicatorStates()).toEqual([true, true])
  })

  it('uses listbox options with strict single selection and does not deselect an active option', async () => {
    const wrapper = mount(MdvList, {
      props: { selectionMode: 'single', modelValue: 1 },
      slots: {
        default: () => [
          h(MdvListItem, { value: 1, headline: '数字一' }),
          h(MdvListItem, { value: '1', headline: '字符串一' }),
        ],
      },
    })
    await settle()
    const options = wrapper.findAll('[role="option"]')
    expect(wrapper.attributes('role')).toBe('listbox')
    expect(wrapper.findAll('li').map((item) => item.attributes('role'))).toEqual([
      'presentation',
      'presentation',
    ])
    expect(options.map((item) => item.attributes('aria-selected'))).toEqual(['true', 'false'])
    await options[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['1']])
    expect(options[1]!.attributes('aria-selected')).toBe('true')
    await options[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['1']])
  })

  it('creates fresh multiple-selection arrays and honors rejected controlled updates', async () => {
    const initial: MdvListModelValue = ['a']
    const update = vi.fn<(value: MdvListModelValue) => void>()
    const wrapper = mount(MdvList, {
      props: {
        selectionMode: 'multiple',
        modelValue: initial,
        'onUpdate:modelValue': update,
      },
      slots: {
        default: () => [
          h(MdvListItem, { value: 'a', headline: 'A' }),
          h(MdvListItem, { value: 1, headline: '数字一' }),
          h(MdvListItem, { value: '1', headline: '字符串一' }),
        ],
      },
    })
    const options = wrapper.findAll('[role="option"]')
    expect(wrapper.attributes('aria-multiselectable')).toBe('true')
    await options[1]!.trigger('click')
    expect(update).toHaveBeenCalledExactlyOnceWith(['a', 1])
    expect(initial).toEqual(['a'])
    expect(options[1]!.attributes('aria-selected')).toBe('false')
    await wrapper.setProps({ modelValue: ['a', 1] })
    expect(options[1]!.attributes('aria-selected')).toBe('true')
    await options[0]!.trigger('click')
    expect(update).toHaveBeenLastCalledWith([1])
    expect(options[2]!.attributes('aria-selected')).toBe('false')
  })

  it('honors cancelled pointer and keyboard activation without updating the selection', async () => {
    const cancel = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const wrapper = mount(MdvList, {
      props: { selectionMode: 'single' },
      slots: {
        default: () => h(MdvListItem, { value: 'a', headline: 'A', onClick: cancel }),
      },
    })
    const option = wrapper.get('[role="option"]')
    await option.trigger('click')
    await option.trigger('keydown', { key: 'Enter' })
    expect(cancel).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    const cancelledKey = mount(MdvList, {
      props: { selectionMode: 'single' },
      slots: {
        default: () =>
          h(MdvListItem, {
            value: 'a',
            headline: 'A',
            onKeydown: (event: KeyboardEvent) => event.preventDefault(),
          }),
      },
    })
    await cancelledKey.get('[role="option"]').trigger('keydown', { key: ' ' })
    expect(cancelledKey.emitted('update:modelValue')).toBeUndefined()
  })

  it('uses the selected option as its only tab stop and skips disabled and hidden items', async () => {
    const wrapper = mount(MdvList, {
      attachTo: document.body,
      props: { selectionMode: 'single', modelValue: 'second' },
      slots: {
        default: () => [
          h(MdvListItem, { value: 'first', headline: '第一项' }),
          h(MdvListItem, { value: 'second', headline: '第二项' }),
          h(MdvListItem, {
            value: 'disabled',
            headline: '禁用',
            disabled: true,
          }),
          h(MdvListItem, { value: 'hidden', headline: '隐藏', hidden: true }),
          h(MdvListItem, { value: 'last', headline: '最后一项' }),
        ],
      },
    })
    await settle()
    const options = wrapper.findAll('[role="option"]')
    expect(options.map((item) => item.attributes('tabindex'))).toEqual([
      '-1',
      '0',
      '-1',
      '-1',
      '-1',
    ])
    ;(options[1]!.element as HTMLElement).focus()
    await options[1]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(options[4]!.element)
    await options[4]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(options[0]!.element)
    await options[0]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(options[4]!.element)
    await options[4]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(options[0]!.element)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps pointer-focused options in the tab order and activates only once for held keys', async () => {
    const wrapper = mount(MdvList, {
      attachTo: document.body,
      props: { selectionMode: 'multiple' },
      slots: {
        default: () => [
          h(MdvListItem, { value: 'one', headline: '一' }),
          h(MdvListItem, { value: 'two', headline: '二' }),
        ],
      },
    })
    await settle()
    const options = wrapper.findAll('[role="option"]')
    expect(options[0]!.attributes('tabindex')).toBe('0')
    ;(options[1]!.element as HTMLElement).focus()
    await settle()
    expect(options.map((item) => item.attributes('tabindex'))).toEqual(['-1', '0'])
    await options[1]!.trigger('keydown', { key: ' ', repeat: false })
    await options[1]!.trigger('keydown', { key: ' ', repeat: true })
    expect(wrapper.emitted('update:modelValue')).toEqual([[['two']]])
    await options[1]!.trigger('keydown', { key: 'Enter', repeat: false })
    expect(wrapper.emitted('update:modelValue')).toEqual([[['two']], [[]]])
  })

  it('updates the tab stop for programmatic selection and removal, and navigates reordered keyed items', async () => {
    const values = ref(['one', 'two', 'three'])
    const selected = ref<MdvListModelValue>('one')
    const Example = defineComponent({
      setup() {
        return () =>
          h(MdvList, { selectionMode: 'single', modelValue: selected.value }, () =>
            values.value.map((value) => h(MdvListItem, { key: value, value, headline: value })),
          )
      },
    })
    const wrapper = mount(Example, { attachTo: document.body })
    await settle()
    selected.value = 'three'
    await settle()
    let options = wrapper.findAll('[role="option"]')
    expect(options.map((item) => item.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    values.value = ['three', 'one', 'two']
    await settle()
    options = wrapper.findAll('[role="option"]')
    ;(options[0]!.element as HTMLElement).focus()
    await options[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(options[1]!.element)
    values.value = ['one', 'two']
    selected.value = null
    await settle()
    expect(
      wrapper.findAll('[role="option"]').filter((item) => item.attributes('tabindex') === '0'),
    ).toHaveLength(1)
  })

  it('moves focus away from an option that becomes disabled or is removed', async () => {
    const disabled = ref(false)
    const showFirst = ref(true)
    const Example = defineComponent({
      setup() {
        return () =>
          h(MdvList, { selectionMode: 'single', modelValue: 'two' }, () => [
            showFirst.value
              ? h(MdvListItem, { key: 'one', value: 'one', headline: '第一项' })
              : null,
            h(MdvListItem, {
              key: 'two',
              value: 'two',
              headline: '第二项',
              disabled: disabled.value,
            }),
            h(MdvListItem, { key: 'three', value: 'three', headline: '第三项' }),
          ])
      },
    })
    const wrapper = mount(Example, { attachTo: document.body })
    await settle()
    const options = wrapper.findAll('[role="option"]')
    ;(options[1]!.element as HTMLElement).focus()
    disabled.value = true
    await settle()
    expect(document.activeElement).toBe(options[0]!.element)
    showFirst.value = false
    await settle()
    expect(document.activeElement).toBe(options[2]!.element)
    expect(options[2]!.attributes('tabindex')).toBe('0')
  })

  it('keeps independent actions in the shared shape but outside the primary native button', async () => {
    const main = vi.fn<(event: MouseEvent) => void>()
    const leading = vi.fn<(event: MouseEvent) => void>()
    const trailing = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvListItem, {
      props: { interactive: true, headline: '主操作', selected: true },
      attrs: { onClick: main },
      slots: {
        'leading-action': () =>
          h('button', { type: 'button', 'data-leading': true, onClick: leading }, '选择'),
        'trailing-action': () =>
          h('button', { type: 'button', 'data-trailing': true, onClick: trailing }, '更多'),
      },
    })
    const primary = wrapper.get('button.mdv-list-item__primary')
    const shape = wrapper.get('.mdv-list-item__shape')
    expect(shape.findAll('button')).toHaveLength(3)
    expect(primary.find('button, input, a').exists()).toBe(false)
    expect(wrapper.get('[data-leading]').element.parentElement?.parentElement).toBe(shape.element)
    await wrapper.get('[data-leading]').trigger('click')
    await wrapper.get('[data-trailing]').trigger('click')
    expect(leading).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(trailing).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(main).not.toHaveBeenCalled()
    await primary.trigger('click')
    expect(main).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
  })

  it('blocks disabled row actions and removes href from disabled links', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvListItem, {
      props: { href: '/settings', headline: '不可用', disabled: true },
      attrs: { onClick: click },
      slots: {
        'trailing-action': () => h('button', { onClick: click, type: 'button' }, '更多'),
      },
    })
    const link = wrapper.get('a')
    expect(link.attributes()).toMatchObject({
      role: 'link',
      'aria-disabled': 'true',
      tabindex: '-1',
    })
    expect(link.attributes('href')).toBeUndefined()
    await link.trigger('click')
    await wrapper.get('button').trigger('click')
    expect(click).not.toHaveBeenCalled()
    const options = mount(MdvList, {
      props: { selectionMode: 'single' },
      slots: {
        default: () => h(MdvListItem, { value: 'x', headline: '禁用项', disabled: true }),
      },
    })
    await options.get('[role="option"]').trigger('click')
    await options.get('[role="option"]').trigger('keydown', { key: 'Enter' })
    expect(options.emitted('update:modelValue')).toBeUndefined()
  })

  it('forwards layout attributes to li and interaction attributes to the actual primary', () => {
    const wrapper = mount(MdvListItem, {
      props: { interactive: true, headline: '打开设置' },
      attrs: {
        id: 'settings-item',
        class: 'custom-item',
        style: { minWidth: '240px' },
        dir: 'rtl',
        lang: 'zh-CN',
        'data-test': 'item',
        tabindex: -1,
      },
    })
    expect(wrapper.attributes()).toMatchObject({
      class: expect.stringContaining('custom-item'),
      dir: 'rtl',
      lang: 'zh-CN',
    })
    expect(wrapper.attributes('id')).toBeUndefined()
    expect((wrapper.element as HTMLElement).style.minWidth).toBe('240px')
    expect(wrapper.get('button').attributes()).toMatchObject({
      id: 'settings-item',
      'data-test': 'item',
      tabindex: '-1',
    })
  })

  it('keeps subheaders between direct list-item siblings when a group separator changes', async () => {
    const show = ref(true)
    const Example = defineComponent({
      setup() {
        return () =>
          h(MdvList, { layout: 'segmented' }, () => [
            h(MdvListItem, { key: 'one', headline: '第一项' }),
            show.value ? h(MdvListSubheader, { inset: true }, () => '下一组') : null,
            h(MdvListItem, { key: 'two', headline: '第二项' }),
          ])
      },
    })
    const wrapper = mount(Example)
    const list = wrapper.get('ul').element
    expect([...list.children].map((child) => child.className)).toEqual([
      expect.stringContaining('mdv-list-item'),
      expect.stringContaining('mdv-list-subheader--inset'),
      expect.stringContaining('mdv-list-item'),
    ])
    const before = wrapper.findAll('.mdv-list-item').map((item) => item.element)
    expect(before[0]!.nextElementSibling).toBe(wrapper.get('.mdv-list-subheader').element)
    show.value = false
    await settle()
    expect(wrapper.findAll('.mdv-list-item').map((item) => item.element)).toEqual(before)
    expect(before[0]!.nextElementSibling).toBe(before[1])
  })

  it('removes the finished ripple without removing the persistent state layer', async () => {
    const wrapper = mount(MdvListItem, {
      props: { interactive: true, headline: '按钮' },
    })
    const primary = wrapper.get('.mdv-list-item__primary')
    primary.element.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 10 }),
    )
    await settle()
    expect(wrapper.find('.mdv-list-item__ripple').exists()).toBe(true)
    await primary.trigger('pointerleave')
    const ripple = wrapper.get('.mdv-list-item__ripple')
    expect(ripple.classes()).toContain('mdv-list-item__ripple--released')
    const finished = new Event('animationend', { bubbles: true })
    Object.defineProperty(finished, 'animationName', {
      value: 'mdv-list-ripple-fade',
    })
    ripple.element.dispatchEvent(finished)
    await settle()
    expect(wrapper.find('.mdv-list-item__ripple').exists()).toBe(false)
    expect(wrapper.find('.mdv-list-item__surface').exists()).toBe(true)
  })

  it('exposes focus and blur on both list and item', async () => {
    const wrapper = mount(MdvList, {
      attachTo: document.body,
      props: { selectionMode: 'single', modelValue: 'second' },
      slots: {
        default: () => [
          h(MdvListItem, { value: 'first', headline: '第一项' }),
          h(MdvListItem, { value: 'second', headline: '第二项' }),
        ],
      },
    })
    await settle()
    wrapper.vm.focus()
    expect(document.activeElement).toBe(wrapper.findAll('[role="option"]')[1]!.element)
    wrapper.vm.blur()
    expect(document.activeElement).toBe(document.body)
    const first = wrapper.findAllComponents(MdvListItem)[0]!
    first.vm.focus()
    expect(document.activeElement).toBe(wrapper.findAll('[role="option"]')[0]!.element)
    first.vm.blur()
    expect(document.activeElement).toBe(document.body)
  })
})
