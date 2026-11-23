import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import MdvSlider from '../components/MdvSlider.vue'
import type { MdvSliderModelValue, MdvSliderVariant } from '../components/slider.types'

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function settle() {
  await Promise.resolve()
  await nextTick()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function example(initial: MdvSliderModelValue, props: Record<string, unknown> = {}) {
  const value = ref<MdvSliderModelValue>(initial)
  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          h(MdvSlider, {
            label: '数值',
            ...props,
            modelValue: value.value,
            'onUpdate:modelValue': (next: MdvSliderModelValue | undefined) => {
              if (next === undefined) throw new Error('MdvSlider must emit a defined model value')
              value.value = next
            },
          })
      },
    }),
    { attachTo: document.body },
  )
  return { wrapper, value, slider: wrapper.getComponent(MdvSlider) }
}

function railRect(element: Element, vertical = false) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 24,
    y: 24,
    left: 24,
    top: 24,
    right: vertical ? 24 : 224,
    bottom: vertical ? 224 : 24,
    width: vertical ? 0 : 200,
    height: vertical ? 200 : 0,
    toJSON: () => ({}),
  })
}

function pointer(target: EventTarget, type: string, x: number, y = 24, id = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
  })
  Object.defineProperties(event, {
    pointerId: { value: id },
    isPrimary: { value: true },
    pointerType: { value: 'mouse' },
  })
  target.dispatchEvent(event)
  return event
}

describe('MdvSlider', () => {
  it('associates the visible label and descriptions with a native range and splits outer attrs', () => {
    const wrapper = mount(MdvSlider, {
      attachTo: document.body,
      props: { modelValue: 30, label: '音量', supportingText: '调整音量' },
      attrs: {
        id: 'volume',
        name: 'volume',
        form: 'settings',
        'aria-describedby': 'external-help',
        'data-purpose': 'sound',
        dir: 'rtl',
        lang: 'zh-CN',
        class: 'custom',
        style: { marginTop: '4px' },
      },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    expect(input.attributes()).toMatchObject({
      type: 'range',
      id: 'volume',
      name: 'volume',
      form: 'settings',
      min: '0',
      max: '100',
      step: 'any',
      'data-purpose': 'sound',
      'aria-orientation': 'horizontal',
    })
    expect(input.element.value).toBe('30')
    expect(wrapper.get('label').attributes('for')).toBe('volume')
    expect(input.attributes('aria-labelledby')).toBe(wrapper.get('label').attributes('id'))
    expect(input.attributes('aria-describedby')?.split(' ')).toContain(
      wrapper.get('p').attributes('id'),
    )
    expect(input.attributes('aria-describedby')).toContain('external-help')
    expect(wrapper.attributes()).toMatchObject({ dir: 'rtl', lang: 'zh-CN' })
    expect(wrapper.classes()).toContain('custom')
    expect((wrapper.element as HTMLElement).style.marginTop).toBe('4px')
    expect(input.attributes('dir')).toBeUndefined()
    wrapper.unmount()
  })

  it('provides defaults by variant and distinct stable ids within an app', async () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h(MdvSlider, { label: '普通', min: 10 }),
            h(MdvSlider, { label: '中心', variant: 'centered', min: -100 }),
            h(MdvSlider, { label: '范围', variant: 'range', min: 20, max: 80 }),
          ]),
      }),
    )
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    expect(inputs.map((input) => input.element.value)).toEqual(['10', '0', '20', '80'])
    const ids = inputs.map((input) => input.attributes('id'))
    expect(new Set(ids).size).toBe(4)
    await wrapper.get('input').trigger('focus')
    expect(wrapper.findAll('input').map((input) => input.attributes('id'))).toEqual(ids)
    wrapper.unmount()
  })

  it('commits native input/change once and forwards the original events', async () => {
    const onInput = vi.fn<(event: Event) => void>()
    const onChange = vi.fn<(event: Event) => void>()
    const { wrapper, slider, value } = example(10, { onInput, onChange })
    const input = wrapper.get<HTMLInputElement>('input').element
    input.value = '35'
    const inputEvent = new Event('input', { bubbles: true })
    const changeEvent = new Event('change', { bubbles: true })
    input.dispatchEvent(inputEvent)
    input.dispatchEvent(changeEvent)
    await settle()
    expect(value.value).toBe(35)
    expect(input.value).toBe('35')
    expect(slider.emitted('update:modelValue')).toEqual([[35]])
    expect(onInput).toHaveBeenCalledExactlyOnceWith(inputEvent)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(changeEvent)
    expect(inputEvent.target).toBe(input)
    wrapper.unmount()
  })

  it('snaps from min with decimal precision and never mutates an input range array', async () => {
    const initial: [number, number] = [0.1, 0.7]
    const { wrapper, value } = example(initial, { variant: 'range', min: -0.1, max: 1, step: 0.1 })
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    await inputs[0]!.setValue('0.26')
    await settle()
    expect(value.value).toEqual([0.3, 0.7])
    expect(initial).toEqual([0.1, 0.7])
    expect(value.value).not.toBe(initial)
    await inputs[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(value.value).toEqual([0.4, 0.7])
    wrapper.unmount()
  })

  it('keeps max reachable when step does not divide the range and visits the last regular stop', async () => {
    const { wrapper, value } = example(6, { max: 10, step: 3, stops: true })
    const input = wrapper.get('input')
    await input.trigger('keydown', { key: 'ArrowRight' })
    expect(value.value).toBe(9)
    await input.trigger('keydown', { key: 'ArrowRight' })
    expect(value.value).toBe(10)
    await input.trigger('keydown', { key: 'ArrowLeft' })
    expect(value.value).toBe(9)
    await input.trigger('keydown', { key: 'Home' })
    expect(value.value).toBe(0)
    wrapper.unmount()
  })

  it('restores rejected controlled edits and accepts programmatic values without synthetic events', async () => {
    const update = vi.fn<(value: MdvSliderModelValue | undefined) => void>()
    const onInput = vi.fn<(event: Event) => void>()
    const onChange = vi.fn<(event: Event) => void>()
    const wrapper = mount(MdvSlider, {
      attachTo: document.body,
      props: { modelValue: 20, label: '受控', 'onUpdate:modelValue': update },
      attrs: { onInput, onChange },
    })
    const input = wrapper.get<HTMLInputElement>('input')
    await input.setValue('80')
    await settle()
    expect(input.element.value).toBe('20')
    expect(update).toHaveBeenCalledExactlyOnceWith(80)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    onInput.mockClear()
    onChange.mockClear()
    await wrapper.setProps({ modelValue: 65 })
    await settle()
    expect(input.element.value).toBe('65')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps range identities, dependent limits, accessible names and separate tab stops', async () => {
    const { wrapper, value } = example([20, 80], {
      variant: 'range',
      startAriaLabel: '价格下限',
      endAriaLabel: '价格上限',
    })
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    expect(inputs.map((input) => input.attributes('aria-label'))).toEqual(['价格下限', '价格上限'])
    expect(inputs[0]!.attributes('max')).toBe('80')
    expect(inputs[1]!.attributes('min')).toBe('20')
    expect(inputs.every((input) => input.element.tabIndex === 0)).toBe(true)
    await inputs[0]!.trigger('keydown', { key: 'End' })
    expect(value.value).toEqual([80, 80])
    await inputs[1]!.trigger('keydown', { key: 'Home' })
    expect(value.value).toEqual([80, 80])
    await inputs[1]!.trigger('keydown', { key: 'ArrowRight' })
    expect(value.value).toEqual([80, 81])
    wrapper.unmount()
  })

  it('derives range handle names from the visible label and lets a slot replace it', () => {
    const wrapper = mount(MdvSlider, {
      props: { variant: 'range', label: '价格' },
      slots: { default: '预算' },
    })
    const label = wrapper.get('label')
    expect(label.text()).toBe('预算')
    const inputs = wrapper.findAll('input')
    expect(inputs[0]!.attributes('aria-labelledby')).toContain(label.attributes('id'))
    expect(inputs[1]!.attributes('aria-labelledby')).toContain(label.attributes('id'))
    expect(inputs[0]!.attributes('aria-labelledby')).toBe(label.attributes('id'))
    expect(inputs[1]!.attributes('aria-labelledby')).toBe(label.attributes('id'))
    expect(wrapper.find('.mdv-slider__sr-only').exists()).toBe(false)
    wrapper.unmount()
  })

  it('supports small and large keyboard increments while respecting a cancelled keydown', async () => {
    const { wrapper, value } = example(20)
    const input = wrapper.get('input')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(value.value).toBe(21)
    await input.trigger('keydown', { key: 'PageUp' })
    expect(value.value).toBe(31)
    await input.trigger('keydown', { key: ' ' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(value.value).toBe(21)
    await input.trigger('keyup', { key: ' ' })
    await input.trigger('keydown', { key: 'End' })
    expect(value.value).toBe(100)
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(value.value).toBe(100)
    await input.trigger('keydown', { key: 'Home' })
    expect(value.value).toBe(0)
    wrapper.unmount()

    const blocked = example(20, { onKeydown: (event: KeyboardEvent) => event.preventDefault() })
    await blocked.wrapper.get('input').trigger('keydown', { key: 'ArrowRight' })
    expect(blocked.value.value).toBe(20)
    blocked.wrapper.unmount()
  })

  it('reverses horizontal RTL arrows and maps vertical pointer positions from bottom to top', async () => {
    const rtl = example(40, { dir: 'rtl' })
    await rtl.wrapper.get('input').trigger('keydown', { key: 'ArrowRight' })
    expect(rtl.value.value).toBe(39)
    railRect(rtl.wrapper.get('.mdv-slider__rail').element)
    pointer(rtl.wrapper.get('.mdv-slider__surface').element, 'pointerdown', 64)
    pointer(window, 'pointerup', 64)
    await settle()
    expect(rtl.value.value).toBe(80)
    rtl.wrapper.unmount()

    const vertical = example(20, { orientation: 'vertical' })
    railRect(vertical.wrapper.get('.mdv-slider__rail').element, true)
    pointer(vertical.wrapper.get('.mdv-slider__surface').element, 'pointerdown', 24, 74)
    pointer(window, 'pointerup', 24, 74)
    await settle()
    expect(vertical.value.value).toBe(75)
    expect(vertical.wrapper.get('input').attributes('aria-orientation')).toBe('vertical')
    vertical.wrapper.unmount()
  })

  it('updates during a captured gesture and emits exactly one change when it ends', async () => {
    const onChange = vi.fn<(event: Event) => void>()
    const { wrapper, slider, value } = example(20, { onChange, valueIndicator: true })
    railRect(wrapper.get('.mdv-slider__rail').element)
    pointer(wrapper.get('.mdv-slider__surface').element, 'pointerdown', 84)
    await nextTick()
    expect(value.value).toBe(30)
    pointer(window, 'pointermove', 144)
    await nextTick()
    expect(value.value).toBe(60)
    expect(wrapper.get('.mdv-slider__value').text()).toBe('60')
    expect(onChange).not.toHaveBeenCalled()
    pointer(window, 'pointerup', 164)
    await settle()
    expect(value.value).toBe(70)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event))
    expect(onChange.mock.calls[0]![0].target).toBe(wrapper.get('input').element)
    expect(slider.emitted('update:modelValue')).toEqual([[30], [60], [70]])
    expect(wrapper.find('.mdv-slider__thumb--pressed').exists()).toBe(false)
    expect(wrapper.find('.mdv-slider__thumb--keyboard-focused').exists()).toBe(false)
    expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('input').element)
    await wrapper.get('input').trigger('keydown', { key: 'ArrowRight' })
    expect(value.value).toBe(71)
    expect(wrapper.get('.mdv-slider__value').text()).toBe('71')
    expect(wrapper.get('.mdv-slider__thumb').classes()).toContain(
      'mdv-slider__thumb--keyboard-focused',
    )
    pointer(wrapper.get('.mdv-slider__thumb').element, 'pointerdown', 166)
    await nextTick()
    pointer(window, 'pointerup', 166)
    await settle()
    expect(wrapper.find('.mdv-slider__thumb--keyboard-focused').exists()).toBe(false)
    expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not jump when grabbing a handle away from its center', async () => {
    const { wrapper, value } = example(50)
    railRect(wrapper.get('.mdv-slider__rail').element)
    pointer(wrapper.get('.mdv-slider__thumb').element, 'pointerdown', 134)
    expect(value.value).toBe(50)
    pointer(window, 'pointermove', 154)
    await nextTick()
    expect(value.value).toBe(60)
    pointer(window, 'pointerup', 154)
    await settle()
    wrapper.unmount()
  })

  it.each([
    { orientation: 'horizontal', dir: 'ltr' },
    { orientation: 'horizontal', dir: 'rtl' },
    { orientation: 'vertical', dir: 'ltr' },
    { orientation: 'vertical', dir: 'rtl' },
  ])('reaches both endpoints after an off-center grab in $orientation $dir', async (props) => {
    const vertical = props.orientation === 'vertical'
    const reversed = vertical || props.dir === 'rtl'
    const at = (target: EventTarget, type: string, ratio: number) => {
      const position = reversed ? 224 - ratio * 200 : 24 + ratio * 200
      return vertical ? pointer(target, type, 24, position) : pointer(target, type, position)
    }
    for (const offset of [-0.01, 0.01]) {
      const single = example(50, props)
      railRect(single.wrapper.get('.mdv-slider__rail').element, vertical)
      at(single.wrapper.get('.mdv-slider__thumb').element, 'pointerdown', 0.5 + offset)
      expect(single.value.value).toBe(50)
      for (const [ratio, value] of [
        [1.1, 100],
        [-0.1, 0],
        [1.1, 100],
      ] as const) {
        at(window, 'pointermove', ratio)
        await nextTick()
        expect(single.value.value).toBe(value)
        expect(single.wrapper.get<HTMLInputElement>('input').element.valueAsNumber).toBe(value)
      }
      at(window, 'pointerup', 1.1)
      await settle()
      expect(single.value.value).toBe(100)
      single.wrapper.unmount()

      const range = example([20, 80], { ...props, variant: 'range' })
      railRect(range.wrapper.get('.mdv-slider__rail').element, vertical)
      const thumbs = range.wrapper.findAll('.mdv-slider__thumb')
      at(thumbs[0]!.element, 'pointerdown', 0.2 + offset)
      at(window, 'pointermove', -0.1)
      await nextTick()
      expect(range.value.value).toEqual([0, 80])
      at(window, 'pointerup', -0.1)
      await settle()
      at(thumbs[1]!.element, 'pointerdown', 0.8 + offset)
      at(window, 'pointermove', 1.1)
      await nextTick()
      expect(range.value.value).toEqual([0, 100])
      at(window, 'pointerup', 1.1)
      await settle()
      range.wrapper.unmount()
    }
  })

  it('suppresses the indicator for quick stop taps and reveals it when a drag starts', async () => {
    vi.useFakeTimers()
    const { wrapper, value } = example(20, { step: 10, stops: true, valueIndicator: true })
    try {
      railRect(wrapper.get('.mdv-slider__rail').element)
      pointer(wrapper.get('.mdv-slider__surface').element, 'pointerdown', 144)
      await nextTick()
      expect(value.value).toBe(60)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
      await vi.advanceTimersByTimeAsync(50)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
      pointer(window, 'pointerup', 144)
      await vi.advanceTimersByTimeAsync(300)
      expect(value.value).toBe(60)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)

      pointer(wrapper.get('.mdv-slider__thumb').element, 'pointerdown', 144)
      await nextTick()
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
      pointer(window, 'pointermove', 184)
      await nextTick()
      expect(value.value).toBe(80)
      expect(wrapper.get('.mdv-slider__value').text()).toBe('80')
      pointer(window, 'pointerup', 184)
      await vi.advanceTimersByTimeAsync(300)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('reveals a held stop indicator and clears pending feedback on cancel, disable and unmount', async () => {
    vi.useFakeTimers()
    const wrapper = mount(MdvSlider, {
      attachTo: document.body,
      props: { label: '按住查看', step: 10, stops: true, valueIndicator: true },
    })
    try {
      railRect(wrapper.get('.mdv-slider__rail').element)
      const surface = wrapper.get('.mdv-slider__surface').element
      pointer(surface, 'pointerdown', 64)
      await vi.advanceTimersByTimeAsync(250)
      expect(wrapper.get('.mdv-slider__value').text()).toBe('20')
      pointer(window, 'pointercancel', 64)
      await vi.advanceTimersByTimeAsync(300)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)

      await wrapper.get('input').trigger('keydown', { key: 'ArrowRight' })
      expect(wrapper.get('.mdv-slider__value').text()).toBe('30')
      pointer(surface, 'pointerdown', 84)
      await vi.advanceTimersByTimeAsync(50)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
      pointer(window, 'pointercancel', 84)
      await vi.advanceTimersByTimeAsync(300)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)

      pointer(surface, 'pointerdown', 84)
      await wrapper.setProps({ disabled: true })
      await vi.advanceTimersByTimeAsync(300)
      expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
      expect(wrapper.find('.mdv-slider__thumb--pressed').exists()).toBe(false)
      await wrapper.setProps({ disabled: false })
      pointer(surface, 'pointerdown', 84)
      expect(vi.getTimerCount()).toBeGreaterThan(0)
    } finally {
      wrapper.unmount()
    }
    expect(vi.getTimerCount()).toBe(0)
  })

  it('selects the nearest range handle and resolves overlapping handles by drag direction', async () => {
    const { wrapper, value } = example([20, 80], { variant: 'range' })
    railRect(wrapper.get('.mdv-slider__rail').element)
    pointer(wrapper.get('.mdv-slider__surface').element, 'pointerdown', 164)
    pointer(window, 'pointerup', 164)
    await settle()
    expect(value.value).toEqual([20, 70])
    wrapper.unmount()

    for (const [x, expected] of [
      [84, [30, 50]],
      [164, [50, 70]],
    ] as const) {
      const overlap = example([50, 50], { variant: 'range' })
      railRect(overlap.wrapper.get('.mdv-slider__rail').element)
      pointer(overlap.wrapper.get('.mdv-slider__surface').element, 'pointerdown', 124)
      expect(overlap.value.value).toEqual([50, 50])
      pointer(window, 'pointermove', x)
      await nextTick()
      pointer(window, 'pointerup', x)
      await settle()
      expect(overlap.value.value).toEqual(expected)
      overlap.wrapper.unmount()
    }
  })

  it('ignores unrelated pointers and cancels a drag without a completion change', async () => {
    const { wrapper, slider, value } = example(20)
    railRect(wrapper.get('.mdv-slider__rail').element)
    pointer(wrapper.get('.mdv-slider__surface').element, 'pointerdown', 64)
    pointer(window, 'pointermove', 184, 24, 2)
    expect(value.value).toBe(20)
    pointer(window, 'pointermove', 104)
    await nextTick()
    pointer(window, 'pointercancel', 104)
    pointer(window, 'pointermove', 224)
    await settle()
    expect(value.value).toBe(40)
    expect(slider.emitted('change')).toBeUndefined()
    expect(wrapper.find('.mdv-slider__thumb--pressed').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows one formatted indicator at a time and exposes the same accessible value text', async () => {
    const { wrapper } = example([20, 80], {
      variant: 'range',
      valueIndicator: true,
      formatValue: (value: number) => `¥${value}`,
    })
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    expect(wrapper.find('.mdv-slider__value').exists()).toBe(false)
    inputs[0]!.element.focus()
    await nextTick()
    expect(wrapper.get('.mdv-slider__value').text()).toBe('¥20')
    inputs[1]!.element.focus()
    await nextTick()
    expect(wrapper.findAll('.mdv-slider__value')).toHaveLength(1)
    expect(wrapper.get('.mdv-slider__value').text()).toBe('¥80')
    expect(inputs[1]!.attributes('aria-valuetext')).toBe('¥80')
    expect(wrapper.get('.mdv-slider__value').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('keeps intermediate stops optional and limits rendering for dense step scales', async () => {
    const wrapper = mount(MdvSlider, {
      props: { modelValue: 30, label: '刻度', step: 0.001, valueIndicator: false },
    })
    expect(wrapper.findAll('.mdv-slider__dot')).toHaveLength(1)
    await wrapper.setProps({ stops: true })
    expect(wrapper.findAll('.mdv-slider__dot').length).toBeLessThanOrEqual(102)
    expect(wrapper.findAll('.mdv-slider__dot').length).toBeGreaterThan(1)
    await wrapper.setProps({ min: 10, max: 10, modelValue: 10 })
    expect(wrapper.html()).not.toContain('NaN')
    expect(wrapper.html()).not.toContain('Infinity')
    wrapper.unmount()
  })

  it('preserves track elements across endpoint and overlapping-handle transitions', async () => {
    const cases: {
      variant: MdvSliderVariant
      min: number
      initial: MdvSliderModelValue
      values: MdvSliderModelValue[]
    }[] = [
      { variant: 'standard', min: 0, initial: 0, values: [10, 100, 90, 0] },
      { variant: 'centered', min: -100, initial: 0, values: [20, 0, -20, -100, 100] },
      {
        variant: 'range',
        min: 0,
        initial: [0, 100],
        values: [
          [20, 80],
          [50, 50],
          [0, 0],
          [100, 100],
          [0, 100],
        ],
      },
    ]
    for (const entry of cases) {
      const wrapper = mount(MdvSlider, {
        props: {
          variant: entry.variant,
          min: entry.min,
          modelValue: entry.initial,
          stops: true,
          label: '档位动画',
        },
      })
      const segments = wrapper.findAll('.mdv-slider__segment').map((segment) => segment.element)
      const active = wrapper.get('.mdv-slider__segment--active').element
      for (const value of entry.values) {
        await wrapper.setProps({ modelValue: value })
        const nextSegments = wrapper.findAll('.mdv-slider__segment')
        expect(nextSegments).toHaveLength(segments.length)
        for (const [index, element] of segments.entries())
          expect(nextSegments[index]!.element).toBe(element)
        expect(wrapper.get('.mdv-slider__segment--active').element).toBe(active)
      }
      wrapper.unmount()
    }
  })

  it('keeps inset content anchored and fades it out only while the handle overlaps it', async () => {
    const wrapper = mount(MdvSlider, {
      props: { modelValue: 80, label: '图标', size: 'm' },
      slots: {
        'inset-icon': ({ value }: { value: number }) => h('span', String(value)),
        leading: h('button', { type: 'button' }, '减少'),
        trailing: h('button', { type: 'button' }, '增加'),
      },
    })
    const icon = wrapper.get('.mdv-slider__inset').element as HTMLElement
    expect(wrapper.get('.mdv-slider__inset').classes()).toContain('mdv-slider__inset--active')
    expect(wrapper.get('.mdv-slider__inset').text()).toBe('80')
    const position = (
      wrapper.get('.mdv-slider__inset').element as HTMLElement
    ).style.getPropertyValue('--point')
    await wrapper.setProps({ modelValue: 0 })
    expect(wrapper.get('.mdv-slider__inset').classes()).not.toContain('mdv-slider__inset--active')
    expect(wrapper.get('.mdv-slider__inset').text()).toBe('0')
    expect(
      (wrapper.get('.mdv-slider__inset').element as HTMLElement).style.getPropertyValue('--point'),
    ).toBe(position)
    await wrapper.setProps({ modelValue: 10 })
    expect(
      (wrapper.get('.mdv-slider__inset').element as HTMLElement).style.getPropertyValue('--point'),
    ).toBe(position)
    expect(wrapper.get('.mdv-slider__inset').classes()).not.toContain('mdv-slider__inset--active')
    expect(wrapper.get('.mdv-slider__inset').classes()).toContain('mdv-slider__inset--occluded')
    expect(wrapper.get('.mdv-slider__inset').element).toBe(icon)
    await wrapper.setProps({ modelValue: 1 })
    expect(wrapper.get('.mdv-slider__inset').classes()).not.toContain('mdv-slider__inset--active')
    expect(wrapper.get('.mdv-slider__inset').classes()).not.toContain('mdv-slider__inset--occluded')
    expect(wrapper.get('.mdv-slider__inset').element).toBe(icon)
    await wrapper.setProps({ modelValue: 80 })
    expect(
      (wrapper.get('.mdv-slider__inset').element as HTMLElement).style.getPropertyValue('--point'),
    ).toBe(position)
    expect(wrapper.get('.mdv-slider__inset').classes()).toContain('mdv-slider__inset--active')
    expect(wrapper.get('.mdv-slider__inset').classes()).not.toContain('mdv-slider__inset--occluded')
    expect(wrapper.get('.mdv-slider__inset').element).toBe(icon)
    await wrapper.get('.mdv-slider__leading button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('resolves preset and seed colors locally and removes stale custom variables', async () => {
    const wrapper = mount(MdvSlider, { props: { label: '颜色', color: '#006c4c' } })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--mdv-slider-color')).toContain(
      'light-dark(',
    )
    expect(document.documentElement.style.getPropertyValue('--mdv-slider-color')).toBe('')
    await wrapper.setProps({ color: 'success' })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--mdv-slider-color')).toBe(
      'var(--mdv-sys-color-success)',
    )
    wrapper.unmount()
  })

  it('disables pointer, keyboard and form participation in a disabled fieldset but respects its first legend', async () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h('fieldset', { disabled: true }, [
              h('legend', [
                h(MdvSlider, { id: 'legend-range', label: '例外', name: 'legend', modelValue: 15 }),
              ]),
              h(MdvSlider, {
                id: 'disabled-range',
                label: '禁用',
                name: 'disabled',
                modelValue: 20,
              }),
            ]),
          ]),
      }),
      { attachTo: document.body },
    )
    const sliders = wrapper.findAllComponents(MdvSlider)
    const input = sliders[1]!.get('input')
    await input.trigger('keydown', { key: 'ArrowUp' })
    pointer(sliders[1]!.get('.mdv-slider__surface').element, 'pointerdown', 100)
    expect(sliders[1]!.emitted('update:modelValue')).toBeUndefined()
    expect(new FormData(wrapper.get('form').element).get('disabled')).toBeNull()
    expect(new FormData(wrapper.get('form').element).get('legend')).toBe('15')
    await sliders[0]!.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(sliders[0]!.emitted('update:modelValue')).toEqual([[16]])
    wrapper.unmount()
  })

  it('submits a range in order, associates external forms and resets to an independent initial snapshot', async () => {
    const initial: [number, number] = [20, 80]
    const value = ref<MdvSliderModelValue>(initial)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h('form', { id: 'range-form' }),
            h(MdvSlider, {
              label: '范围',
              variant: 'range',
              form: 'range-form',
              name: 'price',
              modelValue: value.value,
              'onUpdate:modelValue': (next: MdvSliderModelValue | undefined) => {
                if (next === undefined) throw new Error('MdvSlider must emit a defined model value')
                value.value = next
              },
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    const form = wrapper.get('form').element
    expect(new FormData(form).getAll('price')).toEqual(['20', '80'])
    value.value = [30, 70]
    await nextTick()
    expect(new FormData(form).getAll('price')).toEqual(['30', '70'])
    form.reset()
    await settle()
    expect(value.value).toEqual([20, 80])
    expect(value.value).not.toBe(initial)
    expect(initial).toEqual([20, 80])
    expect(new FormData(form).getAll('price')).toEqual(['20', '80'])
    wrapper.unmount()
  })

  it('respects cancelled resets and detaches reset listeners when the external form changes', async () => {
    const first = document.createElement('form')
    const second = document.createElement('form')
    first.id = 'first-slider-form'
    second.id = 'second-slider-form'
    document.body.append(first, second)
    const value = ref<MdvSliderModelValue>(20)
    const formId = ref(first.id)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvSlider, {
            label: '外部表单',
            modelValue: value.value,
            form: formId.value,
            'onUpdate:modelValue': (next: MdvSliderModelValue | undefined) => {
              if (next === undefined) throw new Error('MdvSlider must emit a defined model value')
              value.value = next
            },
          }),
      }),
      { attachTo: document.body },
    )
    const cancel = (event: Event) => event.preventDefault()
    first.addEventListener('reset', cancel)
    value.value = 60
    await nextTick()
    first.reset()
    await settle()
    expect(value.value).toBe(60)
    first.removeEventListener('reset', cancel)
    formId.value = second.id
    await nextTick()
    first.reset()
    await settle()
    expect(value.value).toBe(60)
    second.reset()
    await settle()
    expect(value.value).toBe(20)
    wrapper.unmount()
    value.value = 55
    second.reset()
    await settle()
    expect(value.value).toBe(55)
  })

  it('exposes focus and blur for either handle and cleans up an active pointer on unmount', async () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const value = ref<MdvSliderModelValue>([20, 80])
    const updates = vi.fn<(next: MdvSliderModelValue | undefined) => void>((next) => {
      if (next === undefined) throw new Error('MdvSlider must emit a defined model value')
      value.value = next
    })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvSlider, {
            label: '范围',
            variant: 'range',
            modelValue: value.value,
            'onUpdate:modelValue': updates,
          }),
      }),
      { attachTo: document.body },
    )
    const slider = wrapper.getComponent(MdvSlider)
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    slider.vm.focus({ preventScroll: true }, 'end')
    expect(document.activeElement).toBe(inputs[1]!.element)
    slider.vm.blur()
    expect(document.activeElement).not.toBe(inputs[1]!.element)
    railRect(wrapper.get('.mdv-slider__rail').element)
    pointer(wrapper.get('.mdv-slider__surface').element, 'pointerdown', 100)
    await nextTick()
    expect(updates).toHaveBeenCalledExactlyOnceWith([38, 80])
    const pointerEvents = ['pointermove', 'pointerup', 'pointercancel']
    const registered = addListener.mock.calls.filter(([type]) => pointerEvents.includes(type))
    expect(registered.map(([type]) => type)).toEqual(pointerEvents)
    updates.mockClear()
    wrapper.unmount()
    for (const [type, listener] of registered) {
      expect(removeListener).toHaveBeenCalledWith(type, listener)
    }
    pointer(window, 'pointermove', 200)
    pointer(window, 'pointerup', 200)
    await settle()
    expect(updates).not.toHaveBeenCalled()
    expect(value.value).toEqual([38, 80])
  })
})
