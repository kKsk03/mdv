import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MdvCard from '../components/MdvCard.vue'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function pointer(element: Element, type: string, options: MouseEventInit = {}) {
  const event = new MouseEvent(type, {
    button: 0,
    bubbles: true,
    cancelable: true,
    ...options,
  })
  element.dispatchEvent(event)
  return event
}

describe('MdvCard', () => {
  it('keeps a static card out of the tab order and renders only the supplied content', () => {
    const wrapper = mount(MdvCard, {
      props: { title: '周末旅行', subtitle: '附近的目的地' },
      slots: { default: () => h('p', '路线与住宿建议') },
    })
    expect(wrapper.classes()).toContain('mdv-card--outlined')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.find('button, a').exists()).toBe(false)
    expect(wrapper.get('.mdv-card__title').text()).toBe('周末旅行')
    expect(wrapper.get('.mdv-card__subtitle').text()).toBe('附近的目的地')
    expect(wrapper.get('.mdv-card__body p').text()).toBe('路线与住宿建议')
    expect(wrapper.find('.mdv-card__media').exists()).toBe(false)
    expect(wrapper.find('.mdv-card__actions').exists()).toBe(false)

    const empty = mount(MdvCard)
    expect(empty.get('.mdv-card__content').element.children).toHaveLength(0)
    expect(empty.attributes('aria-labelledby')).toBeUndefined()
  })

  it('lets the header slot replace built-in text and renders each slot once', () => {
    const header = vi.fn<() => ReturnType<typeof h>[]>(() => [h('h3', '自定义标题')])
    const media = vi.fn<() => ReturnType<typeof h>[]>(() => [
      h('img', { src: '/lake.jpg', alt: '山间湖泊' }),
    ])
    const body = vi.fn<() => ReturnType<typeof h>[]>(() => [h('p', '正文')])
    const actions = vi.fn<() => ReturnType<typeof h>[]>(() => [
      h('button', { type: 'button' }, '收藏'),
    ])
    const wrapper = mount(MdvCard, {
      props: { title: '被替换的标题', subtitle: '被替换的副标题' },
      slots: { header, media, default: body, actions },
    })
    for (const slot of [header, media, body, actions]) expect(slot).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.mdv-card__title, .mdv-card__subtitle').exists()).toBe(false)
    expect(wrapper.get('.mdv-card__header h3').text()).toBe('自定义标题')
    expect(wrapper.get('.mdv-card__media img').attributes('alt')).toBe('山间湖泊')
    expect(wrapper.get('.mdv-card__actions button').text()).toBe('收藏')
  })

  it('does not make a card actionable just because it has a click listener', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvCard, { attrs: { onClick }, slots: { default: '普通内容' } })
    const event = pointer(wrapper.get('.mdv-card__body').element, 'click')
    await nextTick()
    expect(onClick).toHaveBeenCalledExactlyOnceWith(event)
    expect(wrapper.find('.mdv-card__primary').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('mdv-card--interactive')
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
  })

  it('keeps static inner actions and text selection available even when disabled is supplied', () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvCard, {
      attachTo: document.body,
      props: { disabled: true },
      slots: {
        default: () => h('p', '可选择的正文'),
        actions: () => h('button', { type: 'button', onClick }, '收藏'),
      },
    })
    const button = wrapper.get<HTMLButtonElement>('.mdv-card__actions button')
    button.element.click()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(button.element.disabled).toBe(false)
    expect(wrapper.classes()).not.toContain('mdv-card--disabled')
    expect(wrapper.attributes('inert')).toBeUndefined()
    expect(wrapper.get('.mdv-card__content').attributes('aria-hidden')).toBeUndefined()
  })

  it('uses a named native button without nesting block content or submitting a form', () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const onSubmit = vi.fn<(event: SubmitEvent) => void>((event) => event.preventDefault())
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('form', { id: 'card-form', onSubmit }, [
            h(
              MdvCard,
              { clickable: true, title: '查看行程', type: 'submit', onClick },
              { default: () => h('section', [h('h3', '住宿'), h('p', '湖畔小屋')]) },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const card = wrapper.getComponent(MdvCard)
    const primary = card.get<HTMLButtonElement>('.mdv-card__primary')
    expect(primary.attributes('type')).toBe('button')
    expect(primary.attributes('aria-labelledby')).toBe(
      card.get('.mdv-card__title').attributes('id'),
    )
    expect(primary.element.children).toHaveLength(0)
    expect(card.get('.mdv-card__body h3').element.closest('button')).toBeNull()
    primary.element.click()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]![0].target).toBe(primary.element)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('forwards layout attributes outside and native action attributes and events to the primary', () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvCard, {
      props: { clickable: true, title: '默认名称' },
      attrs: {
        id: 'trip-card',
        class: 'custom-card',
        style: { width: '240px', '--mdv-sys-shape-corner-medium': '16px' },
        dir: 'rtl',
        lang: 'zh-CN',
        'data-trip': 'weekend',
        'aria-label': '打开周末行程',
        'aria-describedby': 'trip-help',
        form: 'external-form',
        tabindex: '2',
        onClick,
      },
    })
    expect(wrapper.attributes()).toMatchObject({
      id: 'trip-card',
      dir: 'rtl',
      lang: 'zh-CN',
      'data-trip': 'weekend',
    })
    expect(wrapper.classes()).toContain('custom-card')
    expect((wrapper.element as HTMLElement).style.width).toBe('240px')
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    const primary = wrapper.get('.mdv-card__primary')
    expect(primary.attributes()).toMatchObject({
      type: 'button',
      'aria-label': '打开周末行程',
      'aria-describedby': 'trip-help',
      form: 'external-form',
      tabindex: '2',
    })
    expect(primary.attributes('aria-labelledby')).toBeUndefined()
    expect(primary.attributes('id')).toBeUndefined()
    const event = pointer(primary.element, 'click')
    expect(onClick).toHaveBeenCalledExactlyOnceWith(event)
  })

  it('keeps accessible names current across title, attribute and header changes', async () => {
    const title = ref('行程')
    const label = ref<string>()
    const customHeader = ref(false)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvCard,
            {
              clickable: true,
              title: title.value,
              'aria-label': label.value,
              'aria-labelledby': customHeader.value ? 'custom-card-heading' : undefined,
            },
            customHeader.value
              ? { header: () => h('h3', { id: 'custom-card-heading' }, '自定义标题') }
              : undefined,
          ),
      }),
    )
    const wrapper = host.getComponent(MdvCard)
    const titleId = wrapper.get('.mdv-card__title').attributes('id')
    title.value = '新行程'
    await nextTick()
    expect(wrapper.get('.mdv-card__title').attributes('id')).toBe(titleId)
    expect(wrapper.get('.mdv-card__title').text()).toBe('新行程')
    expect(wrapper.get('.mdv-card__primary').attributes('aria-labelledby')).toBe(titleId)
    label.value = '打开行程'
    await nextTick()
    expect(wrapper.get('.mdv-card__primary').attributes('aria-label')).toBe('打开行程')
    expect(wrapper.get('.mdv-card__primary').attributes('aria-labelledby')).toBeUndefined()
    label.value = undefined
    customHeader.value = true
    await nextTick()
    expect(wrapper.get('.mdv-card__primary').attributes('aria-labelledby')).toBe(
      'custom-card-heading',
    )
    expect(wrapper.get('.mdv-card__header h3').text()).toBe('自定义标题')
    expect(wrapper.find('.mdv-card__title').exists()).toBe(false)
  })

  it('preserves native link attributes, empty href, modifier clicks and middle clicks', async () => {
    const seen: boolean[] = []
    const onClick = vi.fn<(event: MouseEvent) => void>((event) => {
      seen.push(event.defaultPrevented)
      event.preventDefault()
    })
    const onAuxclick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvCard, {
      props: { clickable: true, href: '/trips', title: '周末行程' },
      attrs: {
        target: '_blank',
        rel: 'noopener noreferrer',
        download: 'trips.html',
        hreflang: 'zh-CN',
        referrerpolicy: 'no-referrer',
        onClick,
        onAuxclick,
      },
    })
    const primary = wrapper.get<HTMLAnchorElement>('.mdv-card__primary')
    expect(primary.element.tagName).toBe('A')
    expect(primary.attributes()).toMatchObject({
      href: '/trips',
      target: '_blank',
      rel: 'noopener noreferrer',
      download: 'trips.html',
      hreflang: 'zh-CN',
      referrerpolicy: 'no-referrer',
    })
    const click = pointer(primary.element, 'click', { ctrlKey: true })
    const middle = pointer(primary.element, 'auxclick', { button: 1 })
    expect(onClick).toHaveBeenCalledExactlyOnceWith(click)
    expect(onAuxclick).toHaveBeenCalledExactlyOnceWith(middle)
    expect(seen).toEqual([false])
    expect(middle.defaultPrevented).toBe(false)
    await wrapper.setProps({ href: '' })
    expect(wrapper.get('a').attributes('href')).toBe('')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('respects cancelled click and keyboard activation without redispatching events', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const onKeydown = vi.fn<(event: KeyboardEvent) => void>((event) => event.preventDefault())
    const wrapper = mount(MdvCard, {
      props: { clickable: true, title: '取消操作' },
      attrs: { onClick, onKeydown },
    })
    const primary = wrapper.get('.mdv-card__primary')
    const click = pointer(primary.element, 'click')
    const keydown = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    primary.element.dispatchEvent(keydown)
    await nextTick()
    expect(onClick).toHaveBeenCalledExactlyOnceWith(click)
    expect(onKeydown).toHaveBeenCalledExactlyOnceWith(keydown)
    expect(click.defaultPrevented).toBe(true)
    expect(keydown.defaultPrevented).toBe(true)
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
  })

  it('disables native buttons and respects a disabled fieldset', () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvCard, {
      attachTo: document.body,
      props: { clickable: true, title: '已禁用', disabled: true },
      attrs: { onClick },
    })
    const primary = wrapper.get<HTMLButtonElement>('.mdv-card__primary')
    expect(primary.element.disabled).toBe(true)
    expect(primary.element.tabIndex).toBe(-1)
    primary.element.click()
    wrapper.vm.focus()
    expect(document.activeElement).not.toBe(primary.element)
    expect(onClick).not.toHaveBeenCalled()

    const fieldset = mount(
      defineComponent({
        setup: () => () =>
          h('fieldset', { disabled: true }, [
            h(MdvCard, { clickable: true, title: '继承禁用', onClick }),
          ]),
      }),
      { attachTo: document.body },
    )
    const nested = fieldset.getComponent(MdvCard)
    const button = nested.get<HTMLButtonElement>('button')
    expect(button.element.matches(':disabled')).toBe(true)
    button.element.click()
    nested.vm.focus()
    expect(document.activeElement).not.toBe(button.element)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('blocks disabled link activation and restores navigation and listeners when enabled', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const onCapture = vi.fn<(event: MouseEvent) => void>()
    const onAuxclick = vi.fn<(event: MouseEvent) => void>()
    const onKeydown = vi.fn<(event: KeyboardEvent) => void>()
    const wrapper = mount(MdvCard, {
      attachTo: document.body,
      props: { href: '/trips', title: '周末行程', disabled: true },
      attrs: { onClick, onClickCapture: onCapture, onAuxclick, onKeydown },
    })
    const link = wrapper.get<HTMLAnchorElement>('a')
    expect(link.attributes('href')).toBeUndefined()
    expect(link.attributes()).toMatchObject({
      role: 'link',
      'aria-disabled': 'true',
      tabindex: '-1',
    })
    for (const type of ['click', 'auxclick', 'dblclick']) {
      expect(pointer(link.element, type).defaultPrevented).toBe(true)
    }
    for (const key of ['Enter', ' ']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      link.element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    }
    wrapper.vm.focus()
    expect(document.activeElement).not.toBe(link.element)
    expect(onClick).not.toHaveBeenCalled()
    expect(onCapture).not.toHaveBeenCalled()
    expect(onAuxclick).not.toHaveBeenCalled()
    expect(onKeydown).not.toHaveBeenCalled()
    await wrapper.setProps({ disabled: false })
    expect(link.attributes('href')).toBe('/trips')
    expect(link.attributes('aria-disabled')).toBeUndefined()
    expect(link.attributes('tabindex')).toBeUndefined()
    const event = pointer(link.element, 'click')
    expect(onClick).toHaveBeenCalledExactlyOnceWith(event)
    expect(onCapture).toHaveBeenCalledExactlyOnceWith(event)
  })

  it('releases ripples independently of the persistent state layer and clears them on disable', async () => {
    const wrapper = mount(MdvCard, { props: { clickable: true, title: '交互反馈' } })
    const primary = wrapper.get('.mdv-card__primary')
    pointer(primary.element, 'pointerdown', { clientX: 10, clientY: 10 })
    await nextTick()
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(true)
    pointer(primary.element, 'pointerup')
    await nextTick()
    expect(wrapper.get('.mdv-card__ripple').classes()).toContain('mdv-card__ripple--released')
    const animation = new Event('animationend', { bubbles: true })
    Object.defineProperty(animation, 'animationName', { value: 'mdv-button-ripple-fade' })
    wrapper.get('.mdv-card__ripple').element.dispatchEvent(animation)
    await nextTick()
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
    expect(wrapper.find('.mdv-card__surface').exists()).toBe(true)
    pointer(primary.element, 'pointerdown')
    await nextTick()
    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
  })

  it('uses native keyboard semantics for button and link ripples', async () => {
    const wrapper = mount(MdvCard, { props: { clickable: true, title: '键盘交互' } })
    const primary = wrapper.get('.mdv-card__primary')
    await primary.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
    await primary.trigger('keydown', { key: ' ' })
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(true)
    await primary.trigger('keyup', { key: ' ' })
    expect(wrapper.get('.mdv-card__ripple').classes()).toContain('mdv-card__ripple--released')
    await wrapper.setProps({ href: '/trips' })
    const link = wrapper.get('a')
    await link.trigger('keydown', { key: ' ' })
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
    await link.trigger('keydown', { key: 'Enter' })
    const ripple = wrapper.get('.mdv-card__ripple').element
    await link.trigger('keydown', { key: 'Enter', repeat: true })
    expect(wrapper.get('.mdv-card__ripple').element).toBe(ripple)
    await link.trigger('blur')
    expect(wrapper.get('.mdv-card__ripple').classes()).toContain('mdv-card__ripple--released')
  })

  it('does not start ripples for reduced motion, secondary pointers or cancelled pointer events', async () => {
    const wrapper = mount(MdvCard, { props: { clickable: true, title: '动效偏好' } })
    const primary = wrapper.get('.mdv-card__primary')
    pointer(primary.element, 'pointerdown', { button: 1 })
    await nextTick()
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
    const event = new MouseEvent('pointerdown', { button: 0, bubbles: true })
    Object.defineProperty(event, 'isPrimary', { value: false })
    primary.element.dispatchEvent(event)
    await nextTick()
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    pointer(primary.element, 'pointerdown')
    await nextTick()
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
    vi.unstubAllGlobals()
    const cancelled = mount(MdvCard, {
      props: { clickable: true, title: '取消涟漪' },
      attrs: { onPointerdown: (pointerEvent: PointerEvent) => pointerEvent.preventDefault() },
    })
    pointer(cancelled.get('.mdv-card__primary').element, 'pointerdown')
    await nextTick()
    expect(cancelled.find('.mdv-card__ripple').exists()).toBe(false)
  })

  it('changes the action mode without replacing content and keeps dragged visual-only', async () => {
    const wrapper = mount(MdvCard, {
      props: { title: '行程', dragged: true },
      slots: { default: () => h('p', '保持内容节点') },
    })
    const body = wrapper.get('.mdv-card__body p').element
    expect(wrapper.classes()).toContain('mdv-card--dragged')
    expect(wrapper.attributes('draggable')).toBeUndefined()
    expect(wrapper.find('.mdv-card__primary').exists()).toBe(false)
    await wrapper.setProps({ clickable: true })
    expect(wrapper.get('.mdv-card__primary').element.tagName).toBe('BUTTON')
    pointer(wrapper.get('.mdv-card__primary').element, 'pointerdown')
    await nextTick()
    await wrapper.setProps({ href: '/trips' })
    expect(wrapper.get('.mdv-card__primary').element.tagName).toBe('A')
    expect(wrapper.find('.mdv-card__ripple').exists()).toBe(false)
    await wrapper.setProps({ href: undefined, clickable: false, dragged: false })
    expect(wrapper.find('.mdv-card__primary').exists()).toBe(false)
    expect(wrapper.get('.mdv-card__body p').element).toBe(body)
  })

  it('exposes focus and blur only for its own primary action', () => {
    const wrapper = mount(MdvCard, {
      attachTo: document.body,
      props: { clickable: true, title: '焦点操作' },
    })
    const primary = wrapper.get('.mdv-card__primary')
    wrapper.vm.focus({ preventScroll: true })
    expect(document.activeElement).toBe(primary.element)
    wrapper.vm.blur()
    expect(document.activeElement).toBe(document.body)
    const external = document.createElement('button')
    document.body.append(external)
    external.focus()
    wrapper.vm.blur()
    expect(document.activeElement).toBe(external)
    const staticCard = mount(MdvCard)
    staticCard.vm.focus()
    staticCard.vm.blur()
    expect(document.activeElement).toBe(external)
  })

  it('warns about unnamed primary actions and interactive content inside actionable cards', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(MdvCard, { props: { clickable: true } })
    expect(warning).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('accessible name'))
    warning.mockClear()
    mount(MdvCard, {
      props: { title: '交互冲突', clickable: true },
      slots: { actions: () => h('button', { type: 'button' }, '内部操作') },
    })
    expect(warning).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('static card'))
  })
})
