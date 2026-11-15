import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onMounted, ref } from 'vue'
import MdvIconButton from '../components/MdvIconButton.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.restoreAllMocks())

describe('MdvIconButton', () => {
  it('uses ordinary button semantics when selected is omitted and forwards native attributes', () => {
    const wrapper = mount(MdvIconButton, {
      attrs: {
        'aria-label': '保存',
        'aria-describedby': 'save-help',
        id: 'save',
        form: 'editor',
        name: 'action',
        value: 'save',
        class: 'custom-icon-button',
        style: { '--mdv-icon-button-height': '64px' },
      },
      slots: { default: '<svg viewBox="0 0 24 24" />' },
    })
    const button = wrapper.get('button')

    expect(button.attributes()).toMatchObject({
      type: 'button',
      id: 'save',
      form: 'editor',
      name: 'action',
      value: 'save',
      'aria-label': '保存',
      'aria-describedby': 'save-help',
    })
    expect(button.attributes('aria-pressed')).toBeUndefined()
    expect(button.attributes('selected')).toBeUndefined()
    expect(button.classes()).toContain('custom-icon-button')
    expect(button.element.style.getPropertyValue('--mdv-icon-button-height')).toBe('64px')
    expect(wrapper.get('.mdv-icon-button__icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.mdv-icon-button__icon').attributes('inert')).toBeDefined()

    button.element.click()
    expect(wrapper.emitted('update:selected')).toBeUndefined()
  })

  it.each(['submit', 'reset'] as const)('supports native type=%s', (type) => {
    const wrapper = mount(MdvIconButton, { props: { type }, attrs: { 'aria-label': '操作' } })

    expect(wrapper.get('button').attributes('type')).toBe(type)
  })

  it('treats selected=false as controlled toggle mode without maintaining a second state', async () => {
    const wrapper = mount(MdvIconButton, {
      props: { selected: false },
      attrs: { 'aria-label': '收藏' },
    })
    const button = wrapper.get('button')

    expect(button.attributes('aria-pressed')).toBe('false')
    await button.trigger('click')
    expect(wrapper.emitted('update:selected')).toEqual([[true]])
    expect(button.attributes('aria-pressed')).toBe('false')

    await wrapper.setProps({ selected: true })
    expect(button.attributes('aria-pressed')).toBe('true')
    await button.trigger('click')
    expect(wrapper.emitted('update:selected')).toEqual([[true], [false]])
    expect(button.attributes('aria-label')).toBe('收藏')

    await wrapper.setProps({ selected: undefined })
    expect(button.attributes('aria-pressed')).toBeUndefined()
    await button.trigger('click')
    expect(wrapper.emitted('update:selected')).toHaveLength(2)
  })

  it('supports v-model:selected with a stable name and the corresponding selected icon', async () => {
    const selected = ref(false)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvIconButton,
            {
              selected: selected.value,
              'onUpdate:selected': (value: boolean) => (selected.value = value),
              'aria-label': '收藏',
            },
            {
              default: () => h('svg', { 'data-icon': 'outline' }),
              selected: () => h('svg', { 'data-icon': 'filled' }),
            },
          ),
      }),
    )
    const button = wrapper.get('button')

    expect(wrapper.get('svg').attributes('data-icon')).toBe('outline')
    await button.trigger('click')
    expect(selected.value).toBe(true)
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(button.attributes('aria-label')).toBe('收藏')
    expect(wrapper.findAll('svg')).toHaveLength(1)
    expect(wrapper.get('svg').attributes('data-icon')).toBe('filled')

    await button.trigger('click')
    expect(selected.value).toBe(false)
    expect(wrapper.get('svg').attributes('data-icon')).toBe('outline')
  })

  it('provides selected state to the default slot when the selected slot is omitted', async () => {
    const wrapper = mount(MdvIconButton, {
      props: { selected: true },
      attrs: { 'aria-label': '收藏' },
      slots: {
        default: ({ selected }: { selected: boolean }) =>
          h('svg', { 'data-filled': String(selected) }),
      },
    })

    expect(wrapper.get('svg').attributes('data-filled')).toBe('true')
    await wrapper.setProps({ selected: false })
    expect(wrapper.get('svg').attributes('data-filled')).toBe('false')
    expect(wrapper.findAll('svg')).toHaveLength(1)
  })

  it.each(['real', 'fixed'])(
    'lets a native click listener cancel a toggle update (%s clock)',
    async (clock) => {
      if (clock === 'fixed') vi.spyOn(Date, 'now').mockReturnValue(Date.now())
      const onClickCapture = vi.fn<(event: MouseEvent) => void>()
      const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
      const wrapper = mount(MdvIconButton, {
        props: { selected: false },
        attrs: { 'aria-label': '收藏', onClickCapture, onClick },
      })

      await wrapper.get('button').trigger('click')
      expect(onClickCapture).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
      const event = onClickCapture.mock.calls[0]![0]
      expect(onClick).toHaveBeenCalledExactlyOnceWith(event)
      expect(event.target).toBe(wrapper.get('button').element)
      expect(event.defaultPrevented).toBe(true)
      expect(wrapper.emitted('update:selected')).toBeUndefined()
    },
  )

  it('uses toggle semantics over href and restores native link mode when selected is cleared', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const wrapper = mount(MdvIconButton, {
        props: { selected: false, href: '/saved' },
        attrs: { 'aria-label': '收藏' },
      })

      expect(wrapper.get('button').attributes('href')).toBeUndefined()
      expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
      expect(wrapper.find('a').exists()).toBe(false)
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('selected uses button semantics'),
      )

      await wrapper.setProps({ selected: undefined })
      expect(wrapper.get('a').attributes('href')).toBe('/saved')
      expect(wrapper.get('a').attributes('aria-pressed')).toBeUndefined()
      expect(wrapper.get('a').attributes('type')).toBeUndefined()
    } finally {
      warn.mockRestore()
    }
  })

  it.each(['real', 'fixed'])(
    'forwards link attributes and native cancelable events, including an empty href (%s clock)',
    async (clock) => {
      if (clock === 'fixed') vi.spyOn(Date, 'now').mockReturnValue(Date.now())
      const onClickCapture = vi.fn<(event: MouseEvent) => void>()
      const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
      const wrapper = mount(MdvIconButton, {
        props: { href: '/report' },
        attrs: {
          'aria-label': '下载报告',
          target: '_blank',
          rel: 'noopener noreferrer',
          download: 'report.pdf',
          onClickCapture,
          onClick,
        },
      })
      const link = wrapper.get('a')

      expect(link.attributes()).toMatchObject({
        href: '/report',
        target: '_blank',
        rel: 'noopener noreferrer',
        download: 'report.pdf',
      })
      await link.trigger('click')
      expect(onClickCapture).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
      const event = onClickCapture.mock.calls[0]![0]
      expect(onClick).toHaveBeenCalledExactlyOnceWith(event)
      expect(event.target).toBe(link.element)
      expect(event.defaultPrevented).toBe(true)
      expect(wrapper.emitted('update:selected')).toBeUndefined()

      await wrapper.setProps({ href: '' })
      expect(link.attributes('href')).toBe('')
    },
  )

  it('blocks disabled toggle activation and restores listeners when enabled', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const onClickCapture = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvIconButton, {
      props: { selected: false, disabled: true, loading: true },
      attrs: { 'aria-label': '收藏', onClick, onClickCapture },
    })
    const button = wrapper.get('button')

    expect(button.element.disabled).toBe(true)
    expect(button.attributes('aria-busy')).toBe('true')
    button.element.click()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    button.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(onClick).not.toHaveBeenCalled()
    expect(onClickCapture).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:selected')).toBeUndefined()

    await wrapper.setProps({ disabled: false })
    await button.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClickCapture).toHaveBeenCalledOnce()
    expect(wrapper.emitted('update:selected')).toEqual([[true]])
  })

  it('removes disabled link navigation and activation handlers without trapping Tab', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const onClickCapture = vi.fn<(event: MouseEvent) => void>()
    const onAuxclick = vi.fn<(event: MouseEvent) => void>()
    const onKeydown = vi.fn<(event: KeyboardEvent) => void>()
    const wrapper = mount(MdvIconButton, {
      props: { href: '/report', disabled: true },
      attrs: {
        'aria-label': '下载报告',
        tabindex: 0,
        onClick,
        onClickCapture,
        onAuxclick,
        onKeydown,
      },
    })
    const link = wrapper.get('a')

    expect(link.attributes('href')).toBeUndefined()
    expect(link.attributes('role')).toBe('link')
    expect(link.attributes('aria-disabled')).toBe('true')
    expect(link.attributes('tabindex')).toBe('-1')
    for (const type of ['click', 'auxclick', 'dblclick']) {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true })
      link.element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    }
    for (const type of ['keydown', 'keyup', 'keypress']) {
      const enter = new KeyboardEvent(type, { key: 'Enter', bubbles: true, cancelable: true })
      link.element.dispatchEvent(enter)
      expect(enter.defaultPrevented).toBe(true)
    }
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    link.element.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
    expect(onClick).not.toHaveBeenCalled()
    expect(onClickCapture).not.toHaveBeenCalled()
    expect(onAuxclick).not.toHaveBeenCalled()
    expect(onKeydown).not.toHaveBeenCalled()

    await wrapper.setProps({ disabled: false })
    expect(link.attributes('href')).toBe('/report')
    expect(link.attributes('role')).toBeUndefined()
    expect(link.attributes('aria-disabled')).toBeUndefined()
    expect(link.attributes('tabindex')).toBe('0')
    await link.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClickCapture).toHaveBeenCalledOnce()
  })

  it('keeps loading interactive and preserves the name and single mounted icon', async () => {
    const onMountedIcon = vi.fn<() => void>()
    const Icon = defineComponent({
      setup() {
        onMounted(onMountedIcon)
        return () => h('svg', { id: 'favorite-icon' })
      },
    })
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvIconButton, {
      props: { selected: false },
      attrs: { 'aria-labelledby': 'favorite-label', onClick },
      slots: { default: () => h(Icon) },
    })

    await wrapper.setProps({ loading: true })
    const button = wrapper.get('button')
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.attributes('aria-labelledby')).toBe('favorite-label')
    expect(button.element.disabled).toBe(false)
    expect(wrapper.get('.mdv-icon-button__spinner').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.mdv-icon-button__icon').classes()).toContain(
      'mdv-icon-button__icon--hidden',
    )
    await Promise.all([button.trigger('click'), button.trigger('click')])
    expect(onClick).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('update:selected')).toEqual([[true], [true]])

    await wrapper.setProps({ loading: false })
    expect(button.attributes('aria-busy')).toBeUndefined()
    expect(wrapper.find('.mdv-icon-button__spinner').exists()).toBe(false)
    expect(wrapper.get('.mdv-icon-button__icon').classes()).not.toContain(
      'mdv-icon-button__icon--hidden',
    )
    expect(wrapper.findAll('#favorite-icon')).toHaveLength(1)
    expect(onMountedIcon).toHaveBeenCalledOnce()
  })

  it('keeps href active during loading unless disabled is explicit', async () => {
    const wrapper = mount(MdvIconButton, {
      props: { href: '/report', loading: true },
      attrs: { 'aria-label': '下载报告' },
    })

    expect(wrapper.get('a').attributes('href')).toBe('/report')
    expect(wrapper.get('a').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('a').attributes('aria-label')).toBe('下载报告')
    await wrapper.setProps({ disabled: true })
    expect(wrapper.get('a').attributes('href')).toBeUndefined()
  })

  it('updates and clears local colors without mutating the theme or overriding user styles', async () => {
    const themeStyle = document.documentElement.getAttribute('style')
    const wrapper = mount(MdvIconButton, {
      props: { color: 'success' },
      attrs: {
        'aria-label': '保存',
        style: { '--mdv-icon-button-on-color': '#123456', width: '80px' },
      },
    })
    const button = wrapper.get('button')
    const style = button.element.style

    expect(style.getPropertyValue('--mdv-icon-button-color')).toBe('var(--mdv-sys-color-success)')
    expect(style.getPropertyValue('--mdv-icon-button-on-color')).toBe('#123456')
    expect(button.attributes('color')).toBeUndefined()
    expect(button.attributes('aria-invalid')).toBeUndefined()
    await wrapper.setProps({ color: '#06C' })
    expect(style.getPropertyValue('--mdv-icon-button-color')).toContain('light-dark(')
    expect(style.getPropertyValue('--mdv-icon-button-container-color')).toContain('light-dark(')
    expect(style.getPropertyValue('--mdv-icon-button-on-color')).toBe('#123456')

    await wrapper.setProps({ color: undefined })
    expect(style.getPropertyValue('--mdv-icon-button-color')).toBe('')
    expect(button.classes()).not.toContain('mdv-icon-button--colored')
    expect(style.getPropertyValue('--mdv-icon-button-on-color')).toBe('#123456')
    expect(style.width).toBe('80px')
    expect(document.documentElement.getAttribute('style')).toBe(themeStyle)
  })

  it('falls back from invalid colors and warns only in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const wrapper = mount(MdvIconButton, {
        props: { color: 'error' },
        attrs: { 'aria-label': '删除' },
      })

      await wrapper.setProps({ color: '#invalid' })
      expect(wrapper.get('button').element.style.getPropertyValue('--mdv-icon-button-color')).toBe(
        '',
      )
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('[MDV] MdvIconButton: color'),
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('warns when an accessible action name is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const name = ref('')
      const wrapper = mount(
        defineComponent({
          setup: () => () => h(MdvIconButton, { 'aria-label': name.value }),
        }),
      )

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('provide aria-label or aria-labelledby'),
      )
      name.value = '收藏'
      await nextTick()
      expect(wrapper.get('button').attributes('aria-label')).toBe('收藏')
      expect(warn).toHaveBeenCalledOnce()
    } finally {
      warn.mockRestore()
    }
  })

  it('positions and releases ripples within the visible surface and clears them on disable', async () => {
    const wrapper = mount(MdvIconButton, { attrs: { 'aria-label': '收藏' } })
    const button = wrapper.get('button')
    const bounds = vi
      .spyOn(wrapper.get('.mdv-icon-button__surface').element, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(10, 20, 40, 40))
    try {
      button.element.dispatchEvent(
        new MouseEvent('pointerdown', { button: 0, clientX: 8, clientY: 40, bubbles: true }),
      )
      await nextTick()
      const wave = wrapper.get<HTMLElement>('.mdv-icon-button__ripple-wave').element
      expect(wave.style.left).toBe('0px')
      expect(wave.style.top).toBe('20px')

      await button.trigger('pointerup')
      expect(wrapper.get('.mdv-icon-button__ripple').classes()).toContain(
        'mdv-icon-button__ripple--released',
      )
      await wrapper.setProps({ disabled: true })
      expect(wrapper.find('.mdv-icon-button__ripple').exists()).toBe(false)
    } finally {
      bounds.mockRestore()
    }
  })

  it('leaves keyboard activation native and ignores repeated or unrelated ripple keys', async () => {
    const wrapper = mount(MdvIconButton, {
      props: { selected: false },
      attrs: { 'aria-label': '收藏' },
    })
    const button = wrapper.get('button')

    await button.trigger('keydown', { key: 'Tab' })
    await button.trigger('keydown', { key: 'Enter', repeat: true })
    expect(wrapper.find('.mdv-icon-button__ripple').exists()).toBe(false)
    await button.trigger('keydown', { key: ' ' })
    expect(wrapper.find('.mdv-icon-button__ripple').exists()).toBe(true)
    expect(wrapper.emitted('update:selected')).toBeUndefined()
    await button.trigger('blur')
    expect(wrapper.get('.mdv-icon-button__ripple').classes()).toContain(
      'mdv-icon-button__ripple--released',
    )

    await wrapper.setProps({ selected: undefined, href: '/saved', disabled: true })
    await wrapper.setProps({ disabled: false })
    await wrapper.get('a').trigger('keydown', { key: ' ' })
    expect(wrapper.find('.mdv-icon-button__ripple').exists()).toBe(false)
  })

  it('suppresses ripples when reduced motion is requested without blocking clicks', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduced-motion') }))
    try {
      const wrapper = mount(MdvIconButton, {
        props: { selected: false },
        attrs: { 'aria-label': '收藏' },
      })

      await wrapper.get('button').trigger('keydown', { key: 'Enter' })
      expect(wrapper.find('.mdv-icon-button__ripple').exists()).toBe(false)
      await wrapper.get('button').trigger('click')
      expect(wrapper.emitted('update:selected')).toEqual([[true]])
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
