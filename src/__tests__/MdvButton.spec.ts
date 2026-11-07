import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, onMounted } from 'vue'
import MdvButton from '../components/MdvButton.vue'

describe('MdvButton', () => {
  it('defaults to a non-submitting button and forwards form attributes', () => {
    const wrapper = mount(MdvButton, {
      attrs: {
        id: 'save-button',
        form: 'editor',
        name: 'action',
        value: 'save',
        'aria-describedby': 'save-help',
        class: 'custom-button',
        style: { width: '240px' },
      },
      slots: { default: '保存' },
    })
    const button = wrapper.get('button')

    expect(button.text()).toBe('保存')
    expect(button.attributes()).toMatchObject({
      id: 'save-button',
      type: 'button',
      form: 'editor',
      name: 'action',
      value: 'save',
      'aria-describedby': 'save-help',
    })
    expect(button.classes()).toContain('custom-button')
    expect(button.element.style.width).toBe('240px')
    expect(button.attributes('href')).toBeUndefined()
  })

  it.each(['submit', 'reset'] as const)('supports native type=%s', (type) => {
    const wrapper = mount(MdvButton, { props: { type } })

    expect(wrapper.get('button').attributes('type')).toBe(type)
  })

  it('updates local preset and seed colors and restores defaults without changing user styles or the document theme', async () => {
    const themeStyle = document.documentElement.getAttribute('style')
    const wrapper = mount(MdvButton, {
      props: { color: 'success', variant: 'tonal' },
      attrs: { style: { width: '240px' } },
      slots: { default: '保存' },
    })
    const button = wrapper.get('button')
    const style = button.element.style

    expect(style.getPropertyValue('--mdv-button-container-color')).toBe(
      'var(--mdv-sys-color-success-container)',
    )
    expect(button.attributes('color')).toBeUndefined()
    expect(button.attributes('aria-invalid')).toBeUndefined()

    await wrapper.setProps({ color: '#06C' })
    expect(style.getPropertyValue('--mdv-button-color')).toContain('light-dark(')
    expect(style.getPropertyValue('--mdv-button-container-color')).toContain('light-dark(')

    await wrapper.setProps({ color: 'error' })
    expect(button.attributes('aria-invalid')).toBeUndefined()
    expect(style.getPropertyValue('--mdv-button-color')).toBe('var(--mdv-sys-color-error)')
    expect(style.getPropertyValue('--mdv-button-container-color')).toBe(
      'var(--mdv-sys-color-error-container)',
    )

    await wrapper.setProps({ color: undefined })
    for (const role of ['color', 'on-color', 'container-color', 'on-container-color']) {
      expect(style.getPropertyValue(`--mdv-button-${role}`)).toBe('')
    }
    expect(button.classes()).not.toContain('mdv-button--colored')
    expect(style.width).toBe('240px')
    expect(document.documentElement.getAttribute('style')).toBe(themeStyle)
  })

  it('allows user styles to override the generated local color variables', () => {
    const wrapper = mount(MdvButton, {
      props: { color: 'success' },
      attrs: { style: { '--mdv-button-color': '#123456', width: '240px' } },
    })

    expect(wrapper.get('button').element.style.getPropertyValue('--mdv-button-color')).toBe(
      '#123456',
    )
    expect(wrapper.get('button').element.style.width).toBe('240px')
  })

  it('clears the previous color and warns in development when given an invalid seed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const wrapper = mount(MdvButton, { props: { color: '#006c4c' } })

      await wrapper.setProps({ color: '#invalid' })
      expect(wrapper.get('button').element.style.getPropertyValue('--mdv-button-color')).toBe('')
      expect(wrapper.get('button').classes()).not.toContain('mdv-button--colored')
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('[MDV] MdvButton: color'),
      )

      await wrapper.setProps({ color: 'info' })
      expect(wrapper.get('button').element.style.getPropertyValue('--mdv-button-color')).toBe(
        'var(--mdv-sys-color-info)',
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('forwards native clicks and uses the native disabled property', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvButton, { attrs: { onClick } })
    const button = wrapper.get('button')

    button.element.click()
    expect(onClick).toHaveBeenCalledOnce()

    await wrapper.setProps({ disabled: true })
    expect(button.element.disabled).toBe(true)
    button.element.click()
    expect(onClick).toHaveBeenCalledOnce()

    await wrapper.setProps({ disabled: false })
    button.element.click()
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('keeps link styling independent of native link semantics', async () => {
    const wrapper = mount(MdvButton, {
      props: { variant: 'link' },
      slots: { default: '查看详情' },
    })

    expect(wrapper.get('button').attributes('type')).toBe('button')
    expect(wrapper.find('a').exists()).toBe(false)

    await wrapper.setProps({ href: '' })
    expect(wrapper.get('a').attributes('href')).toBe('')
    expect(wrapper.get('a').attributes('type')).toBeUndefined()
    expect(wrapper.get('a').attributes('target')).toBeUndefined()

    await wrapper.setProps({ href: undefined })
    expect(wrapper.get('button').attributes('type')).toBe('button')
  })

  it('forwards native anchor attributes and cancelable click events', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const onFocus = vi.fn<(event: FocusEvent) => void>()
    const wrapper = mount(MdvButton, {
      props: { href: '/guide', variant: 'filled' },
      attrs: { target: '_blank', rel: 'noopener', download: 'guide.pdf', onClick, onFocus },
    })
    const link = wrapper.get('a')
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })

    expect(link.attributes()).toMatchObject({
      href: '/guide',
      target: '_blank',
      rel: 'noopener',
      download: 'guide.pdf',
    })
    expect(link.attributes('disabled')).toBeUndefined()
    link.element.dispatchEvent(click)
    expect(onClick).toHaveBeenCalledExactlyOnceWith(click)
    expect(click.defaultPrevented).toBe(true)

    await link.trigger('focus')
    expect(onFocus).toHaveBeenCalledOnce()
  })

  it('blocks disabled link activation and restores href, listeners and tabindex', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const onClickCapture = vi.fn<(event: MouseEvent) => void>()
    const onAuxclick = vi.fn<(event: MouseEvent) => void>()
    const onKeydown = vi.fn<(event: KeyboardEvent) => void>()
    const wrapper = mount(MdvButton, {
      props: { href: '/guide', disabled: true },
      attrs: { tabindex: 0, onClick, onClickCapture, onAuxclick, onKeydown },
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

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    link.element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    link.element.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
    expect(onClick).not.toHaveBeenCalled()
    expect(onClickCapture).not.toHaveBeenCalled()
    expect(onAuxclick).not.toHaveBeenCalled()
    expect(onKeydown).not.toHaveBeenCalled()

    await wrapper.setProps({ disabled: false })
    expect(link.attributes('href')).toBe('/guide')
    expect(link.attributes('aria-disabled')).toBeUndefined()
    expect(link.attributes('role')).toBeUndefined()
    expect(link.attributes('tabindex')).toBe('0')

    await link.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClickCapture).toHaveBeenCalledOnce()
  })

  it('uses the original label with a spinner and allows repeated clicks while loading', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvButton, {
      props: { loading: true },
      attrs: { onClick },
      slots: { default: '保存更改', leading: '<svg />', trailing: '<svg />' },
    })
    const button = wrapper.get('button')
    const content = wrapper.get('.mdv-button__content')

    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.element.disabled).toBe(false)
    expect(content.text()).toBe('保存更改')
    expect(content.attributes('aria-hidden')).toBeUndefined()
    expect(content.attributes('hidden')).toBeUndefined()
    expect(content.get('.mdv-button__spinner').attributes('aria-hidden')).toBe('true')
    expect(content.findAll('.mdv-button__icon')).toHaveLength(0)

    button.element.click()
    button.element.click()
    expect(onClick).toHaveBeenCalledTimes(2)

    await wrapper.setProps({ loading: false })
    expect(button.attributes('aria-busy')).toBeUndefined()
    expect(wrapper.find('.mdv-button__spinner').exists()).toBe(false)
    expect(content.findAll('.mdv-button__icon')).toHaveLength(2)
    expect(content.text()).toBe('保存更改')
  })

  it('exposes only the active label when reserving a custom loading message', async () => {
    const wrapper = mount(MdvButton, {
      props: { loadingText: '正在保存所有更改…' },
      slots: { default: '保存', leading: '<svg />', trailing: '<svg />' },
    })
    const normal = wrapper.get('.mdv-button__content')
    const loading = wrapper.get('.mdv-button__loading')

    expect(normal.text()).toBe('保存')
    expect(normal.attributes('aria-hidden')).toBeUndefined()
    expect(normal.attributes('inert')).toBeUndefined()
    expect(loading.text()).toBe('正在保存所有更改…')
    expect(loading.attributes('aria-hidden')).toBe('true')
    expect(loading.attributes('inert')).toBeDefined()

    await wrapper.setProps({ loading: true })
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('button').element.disabled).toBe(false)
    expect(normal.attributes('aria-hidden')).toBe('true')
    expect(normal.attributes('inert')).toBeDefined()
    expect(loading.attributes('aria-hidden')).toBeUndefined()
    expect(loading.attributes('inert')).toBeUndefined()
    expect(loading.get('.mdv-button__spinner').attributes('aria-hidden')).toBe('true')
    expect(loading.find('.mdv-button__icon').exists()).toBe(false)

    await wrapper.setProps({ loading: false })
    expect(normal.attributes('aria-hidden')).toBeUndefined()
    expect(normal.attributes('inert')).toBeUndefined()
    expect(loading.attributes('aria-hidden')).toBe('true')
    expect(loading.attributes('inert')).toBeDefined()
    expect(wrapper.get('button').attributes('aria-busy')).toBeUndefined()
  })

  it.each([undefined, '保存中…'])(
    'mounts its label slot only once with loadingText=%s',
    async (loadingText) => {
      const onLabelMounted = vi.fn<() => void>()
      const Label = defineComponent({
        setup() {
          onMounted(onLabelMounted)
          return () => h('span', { id: 'save-label' }, '保存')
        },
      })
      const wrapper = mount(MdvButton, {
        props: { loadingText },
        slots: { default: () => h(Label) },
      })

      expect(onLabelMounted).toHaveBeenCalledOnce()
      expect(wrapper.findAll('#save-label')).toHaveLength(1)

      await wrapper.setProps({ loading: true })
      await wrapper.setProps({ loading: false })
      expect(onLabelMounted).toHaveBeenCalledOnce()
      expect(wrapper.findAll('#save-label')).toHaveLength(1)
    },
  )

  it('switches between custom and original loading labels without disabling the button', async () => {
    const wrapper = mount(MdvButton, {
      props: { loading: true, loadingText: '保存中…' },
      slots: { default: '保存' },
    })

    expect(wrapper.get('.mdv-button__loading').text()).toBe('保存中…')

    await wrapper.setProps({ loadingText: '正在上传…' })
    expect(wrapper.get('.mdv-button__loading').text()).toBe('正在上传…')

    await wrapper.setProps({ loadingText: undefined })
    expect(wrapper.find('.mdv-button__loading').exists()).toBe(false)
    expect(wrapper.get('.mdv-button__content').text()).toBe('保存')
    expect(wrapper.get('.mdv-button__content').attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.get('.mdv-button__spinner').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('button').element.disabled).toBe(false)
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
  })

  it('preserves an explicit accessible name during loading', () => {
    const wrapper = mount(MdvButton, {
      props: { href: '/download', loading: true, loadingText: '下载中…' },
      attrs: { 'aria-label': '下载报告' },
      slots: { default: '下载' },
    })

    expect(wrapper.get('a').attributes('aria-label')).toBe('下载报告')
    expect(wrapper.get('a').attributes('href')).toBe('/download')
    expect(wrapper.get('a').attributes('aria-busy')).toBe('true')
  })

  it('keeps disabled authoritative when loading is also enabled', () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvButton, {
      props: { disabled: true, loading: true, color: 'error' },
      attrs: { onClick },
      slots: { default: '保存' },
    })
    const button = wrapper.get('button')

    expect(button.element.disabled).toBe(true)
    expect(button.attributes('aria-busy')).toBe('true')
    button.element.click()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('keeps icon slots decorative and in their requested order', () => {
    const wrapper = mount(MdvButton, {
      slots: {
        leading: '<svg data-icon="leading" />',
        default: '继续',
        trailing: '<svg data-icon="trailing" />',
      },
    })
    const content = wrapper.get('.mdv-button__content').element

    expect(content.children).toHaveLength(3)
    expect(content.children[0]?.querySelector('[data-icon="leading"]')).not.toBeNull()
    expect(content.children[1]?.textContent).toBe('继续')
    expect(content.children[2]?.querySelector('[data-icon="trailing"]')).not.toBeNull()
    for (const icon of wrapper.findAll('.mdv-button__icon')) {
      expect(icon.attributes('aria-hidden')).toBe('true')
    }
  })
})
