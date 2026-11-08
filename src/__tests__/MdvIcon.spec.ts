import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import favorite from '@iconify-icons/material-symbols/favorite'
import favoriteOutline from '@iconify-icons/material-symbols/favorite-outline'
import { MdvButton, MdvIcon, MdvIconButton } from '../index'
import type { MdvIconData } from '../index'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('MdvIcon', () => {
  it('renders local SVG immediately without fetching or mutating the input data', async () => {
    const fetchIcon = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchIcon)
    const icon = Object.freeze({ ...favorite })
    const wrapper = mount(MdvIcon, { props: { icon } })
    const svg = wrapper.get('svg')

    expect(wrapper.element).toBe(svg.element)
    expect(svg.classes()).toContain('mdv-icon')
    expect(svg.attributes()).toMatchObject({
      viewBox: '0 0 24 24',
      width: '24',
      height: '24',
      focusable: 'false',
      'aria-hidden': 'true',
    })
    expect(svg.find('path').exists()).toBe(true)
    expect(svg.element.innerHTML).toContain('currentColor')
    expect(svg.element.style.width).toBe('')
    expect(svg.element.style.color).toBe('')
    await nextTick()
    expect(fetchIcon).not.toHaveBeenCalled()
    expect(icon).toEqual(favorite)
  })

  it('switches outlined and filled data on the same SVG element', async () => {
    const wrapper = mount(MdvIcon, { props: { icon: favoriteOutline } })
    const svg = wrapper.get('svg').element
    const outlineBody = svg.innerHTML

    await wrapper.setProps({ icon: favorite })
    expect(wrapper.get('svg').element).toBe(svg)
    expect(svg.innerHTML).not.toBe(outlineBody)
    await wrapper.setProps({ icon: favoriteOutline })
    expect(svg.innerHTML).toBe(outlineBody)
  })

  it.each([
    { size: 32, attribute: '32', css: '32px' },
    { size: '1.5em', attribute: '1.5em', css: '1.5em' },
    { size: 'var(--icon-size)', attribute: 'var(--icon-size)', css: 'var(--icon-size)' },
  ])('supports size=$size without changing the viewBox', ({ size, attribute, css }) => {
    const wrapper = mount(MdvIcon, { props: { icon: favorite, size } })
    const svg = wrapper.get('svg')

    expect(svg.attributes('width')).toBe(attribute)
    expect(svg.attributes('height')).toBe(attribute)
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(svg.element.style.width).toBe(css)
    expect(svg.element.style.height).toBe(css)
  })

  it('uses CSS color directly and restores inheritance when overrides are removed', async () => {
    const wrapper = mount(MdvIcon, {
      props: { icon: favorite, color: '#123456', size: 32 },
    })
    const svg = wrapper.get('svg').element

    expect(svg.style.color).toBe('rgb(18, 52, 86)')
    expect(svg.style.getPropertyValue('--mdv-button-color')).toBe('')
    await wrapper.setProps({ color: 'var(--mdv-sys-color-error)' })
    expect(svg.style.color).toBe('var(--mdv-sys-color-error)')
    await wrapper.setProps({ color: undefined, size: undefined })
    expect(svg.style.color).toBe('')
    expect(svg.style.width).toBe('')
    expect(svg.style.height).toBe('')
  })

  it.each([
    { style: 'width: 40px; height: 2rem; color: red' },
    { style: { width: '40px', height: '2rem', color: 'red' } },
    {
      style: [{ width: '20px', color: 'blue' }, 'width: 40px', { height: '2rem', color: 'red' }],
    },
  ])('gives native style precedence over size and color ($style)', ({ style }) => {
    const wrapper = mount(MdvIcon, {
      props: { icon: favorite, size: 32, color: 'green' },
      attrs: { style },
    })
    const svg = wrapper.get('svg').element

    expect(svg.style.width).toBe('40px')
    expect(svg.style.height).toBe('2rem')
    expect(svg.style.color).toBe('red')
  })

  it('forwards native attributes, classes and events to the SVG root', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvIcon, {
      props: { icon: favorite },
      attrs: {
        id: 'favorite-icon',
        class: 'custom-icon',
        'data-test': 'icon',
        'aria-label': '已收藏',
        'aria-describedby': 'favorite-help',
        onClick,
        mode: 'mask',
      },
    })
    const svg = wrapper.get('svg')

    expect(svg.attributes()).toMatchObject({
      id: 'favorite-icon',
      'data-test': 'icon',
      'aria-label': '已收藏',
      'aria-describedby': 'favorite-help',
      role: 'img',
    })
    expect(svg.classes()).toContain('custom-icon')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
    expect(svg.attributes('tabindex')).toBeUndefined()
    await svg.trigger('click')
    expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
  })

  it('updates accessibility and native style when only attrs change', async () => {
    const label = ref<string | undefined>()
    const labelledby = ref<string | undefined>()
    const color = ref('red')
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvIcon, {
            icon: favorite,
            'aria-label': label.value,
            'aria-labelledby': labelledby.value,
            style: `color: ${color.value}`,
          }),
      }),
    )
    const svg = wrapper.get('svg')

    expect(svg.attributes('aria-hidden')).toBe('true')
    label.value = '已收藏'
    color.value = 'blue'
    await nextTick()
    expect(svg.attributes('aria-hidden')).toBeUndefined()
    expect(svg.element.style.color).toBe('blue')
    label.value = undefined
    labelledby.value = 'favorite-label'
    await nextTick()
    expect(svg.attributes('aria-hidden')).toBeUndefined()
    expect(svg.attributes('aria-labelledby')).toBe('favorite-label')
    labelledby.value = '  '
    await nextTick()
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it('respects explicit aria-hidden independently of the name', () => {
    const hidden = mount(MdvIcon, {
      props: { icon: favorite },
      attrs: { 'aria-label': '收藏', 'aria-hidden': true },
    })
    const visible = mount(MdvIcon, {
      props: { icon: favorite },
      attrs: { 'aria-hidden': false },
    })

    expect(hidden.get('svg').attributes('aria-hidden')).toBe('true')
    expect(visible.get('svg').attributes('aria-hidden')).toBeUndefined()
  })

  it.each(['material-symbols:favorite', null, { width: 24 }, { body: 42 }])(
    'keeps invalid input %j empty and local, then recovers with valid data',
    async (invalidIcon) => {
      const fetchIcon = vi.fn<typeof fetch>()
      vi.stubGlobal('fetch', fetchIcon)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = mount(MdvIcon, {
        props: { icon: invalidIcon as unknown as MdvIconData },
      })

      expect(wrapper.find('svg').exists()).toBe(true)
      expect(wrapper.find('path').exists()).toBe(false)
      expect(warn).toHaveBeenCalledWith(
        '[MDV] MdvIcon: icon must be a local SVG data object with a string body.',
      )
      await wrapper.setProps({ icon: favorite })
      expect(wrapper.find('svg path').exists()).toBe(true)
      expect(fetchIcon).not.toHaveBeenCalled()
    },
  )

  it('fits directly into both Button icon slots and preserves the button label', async () => {
    const wrapper = mount(MdvButton, {
      slots: {
        default: '收藏',
        leading: () => h(MdvIcon, { icon: favorite }),
        trailing: () => h(MdvIcon, { icon: favoriteOutline }),
      },
    })
    const icons = wrapper.findAll('.mdv-button__icon > svg.mdv-icon')

    expect(icons).toHaveLength(2)
    expect(wrapper.get('.mdv-button__label').text()).toBe('收藏')
    for (const icon of icons) {
      expect(icon.attributes('aria-hidden')).toBe('true')
      expect((icon.element as SVGElement).style.width).toBe('')
    }
    await wrapper.setProps({ loading: true })
    expect(wrapper.find('.mdv-button__spinner').exists()).toBe(true)
    expect(wrapper.find('.mdv-button__icon').exists()).toBe(false)
  })

  it('works with IconButton selected slots and keeps icons mounted while loading', async () => {
    const wrapper = mount(MdvIconButton, {
      props: { selected: false },
      attrs: { 'aria-label': '收藏' },
      slots: {
        default: () => h(MdvIcon, { icon: favoriteOutline }),
        selected: () => h(MdvIcon, { icon: favorite }),
      },
    })
    const outlineBody = wrapper.get('.mdv-icon-button__icon > svg.mdv-icon').element.innerHTML

    await wrapper.setProps({ selected: true })
    const svg = wrapper.get('.mdv-icon-button__icon > svg.mdv-icon').element
    expect(svg.innerHTML).not.toBe(outlineBody)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('button').attributes('aria-label')).toBe('收藏')
    await wrapper.setProps({ loading: true })
    expect(wrapper.get('.mdv-icon-button__icon > svg').element).toBe(svg)
    expect(wrapper.get('.mdv-icon-button__icon').classes()).toContain(
      'mdv-icon-button__icon--hidden',
    )
    expect(wrapper.find('.mdv-icon-button__spinner').exists()).toBe(true)
  })
})
