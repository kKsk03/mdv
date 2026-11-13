import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import MdvFab from '../components/MdvFab.vue'
import MdvExtendedFab from '../components/MdvExtendedFab.vue'
import { toolbarReducedMotion, toolbarScroll } from './toolbar-test-platform'

enableAutoUnmount(afterEach)
beforeEach(toolbarReducedMotion)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
const icon = () => h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: 'M4 12h16' })])
const extendedSlots = { leading: icon, default: () => '新建笔记' }
function region() {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}

describe('MdvFab', () => {
  it('preserves native attributes and one click without taking focus or submitting by default', async () => {
    const outside = document.createElement('input')
    document.body.append(outside)
    outside.focus()
    const click = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const wrapper = mount(MdvFab, {
      attrs: {
        'aria-label': '新建笔记',
        onClick: click,
        name: 'action',
        value: 'create',
        form: 'editor',
        class: 'custom',
      },
      slots: { default: icon },
      attachTo: document.body,
    })
    expect(document.activeElement).toBe(outside)
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.attributes('form')).toBe('editor')
    expect(wrapper.attributes('name')).toBe('action')
    expect(wrapper.attributes('value')).toBe('create')
    expect(wrapper.classes()).toContain('custom')
    expect(wrapper.get('.mdv-fab__icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    expect(click).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
    wrapper.vm.focus()
    expect(document.activeElement).toBe(wrapper.element)
    wrapper.vm.blur()
    expect(document.activeElement).toBe(outside.ownerDocument.body)
    await wrapper.setProps({ type: 'submit' })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('renders a real link and leaves keyboard activation and navigation caller-controlled', async () => {
    const click = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const wrapper = mount(MdvFab, {
      props: { href: '/new' },
      attrs: {
        'aria-label': '新建',
        target: '_blank',
        rel: 'noopener',
        download: 'draft',
        onClick: click,
      },
      slots: { default: icon },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/new')
    expect(wrapper.attributes('target')).toBe('_blank')
    expect(wrapper.attributes('rel')).toBe('noopener')
    expect(wrapper.attributes('download')).toBe('draft')
    expect(wrapper.attributes('type')).toBeUndefined()
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(space)
    expect(space.defaultPrevented).toBe(false)
    expect(click).not.toHaveBeenCalled()
    await wrapper.trigger('click')
    expect(click).toHaveBeenCalledOnce()
  })

  it('keeps the ripple within its own surface and respects native disabled attributes', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn<() => { matches: boolean }>(() => ({ matches: false })),
    )
    const wrapper = mount(MdvFab, { attrs: { 'aria-label': '新建' }, slots: { default: icon } })
    wrapper.element.dispatchEvent(
      new MouseEvent('pointerdown', { button: 0, clientX: 10, clientY: 10, bubbles: true }),
    )
    await nextTick()
    expect(wrapper.find('.mdv-fab__surface .mdv-fab__ripple').exists()).toBe(true)
    await wrapper.trigger('pointercancel')
    expect(wrapper.get('.mdv-fab__ripple').classes()).toContain('mdv-fab__ripple--released')
    const ended = new Event('animationend', { bubbles: true })
    Object.defineProperty(ended, 'animationName', { value: 'mdv-button-ripple-fade' })
    wrapper.get('.mdv-fab__ripple').element.dispatchEvent(ended)
    await nextTick()
    expect(wrapper.find('.mdv-fab__ripple').exists()).toBe(false)
    wrapper.element.setAttribute('disabled', '')
    wrapper.element.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    await nextTick()
    expect(wrapper.find('.mdv-fab__ripple').exists()).toBe(false)
  })
})

describe('MdvExtendedFab', () => {
  it('keeps the same button, icon, label and focus while collapsing, expanding and relabelling', async () => {
    const label = ref('新建笔记')
    const wrapper = mount(MdvExtendedFab, {
      slots: { ...extendedSlots, default: () => h('span', label.value) },
      attachTo: document.body,
    })
    const button = wrapper.element
    const text = wrapper.get('.mdv-extended-fab__label').element
    const svg = wrapper.get('svg').element
    wrapper.vm.focus()
    expect(await wrapper.vm.collapse()).toBe(true)
    expect(wrapper.classes()).toContain('mdv-extended-fab--collapsed')
    expect(wrapper.element).toBe(button)
    expect(document.activeElement).toBe(button)
    expect(wrapper.get('.mdv-extended-fab__label').element).toBe(text)
    expect(wrapper.get('.mdv-extended-fab__label').attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.get('.mdv-extended-fab__label').attributes('inert')).toBeUndefined()
    expect(wrapper.attributes('aria-expanded')).toBeUndefined()
    label.value = '保存草稿'
    await nextTick()
    expect(wrapper.get('.mdv-extended-fab__label').text()).toBe('保存草稿')
    expect(await wrapper.vm.expand()).toBe(true)
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    expect(wrapper.get('svg').element).toBe(svg)
    expect(document.activeElement).toBe(button)
  })

  it('does not alter geometry or focus when the caller rejects expansion requests', async () => {
    const wrapper = mount(MdvExtendedFab, {
      props: { expanded: true },
      slots: extendedSlots,
      attachTo: document.body,
    })
    wrapper.vm.focus()
    expect(await wrapper.vm.collapse()).toBe(false)
    expect(wrapper.emitted('update:expanded')).toEqual([[false]])
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    expect(document.activeElement).toBe(wrapper.element)
    await wrapper.setProps({ expanded: false })
    expect(wrapper.classes()).toContain('mdv-extended-fab--collapsed')
    expect(await wrapper.vm.expand()).toBe(false)
    expect(wrapper.emitted('update:expanded')).toEqual([[false], [true]])
  })

  it('keeps a label-only action expanded and updates when its icon is added or removed', async () => {
    const withIcon = ref(false)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvExtendedFab,
            { expanded: false },
            withIcon.value ? extendedSlots : { default: extendedSlots.default },
          ),
      }),
    )
    const button = host.get('button').element
    expect(host.get('button').classes()).not.toContain('mdv-extended-fab--collapsed')
    withIcon.value = true
    await nextTick()
    expect(host.get('button').classes()).toContain('mdv-extended-fab--collapsed')
    withIcon.value = false
    await nextTick()
    expect(host.get('button').classes()).not.toContain('mdv-extended-fab--collapsed')
    expect(host.get('button').element).toBe(button)
  })

  it('collapses only after directional scrolling on its explicit region and protects ongoing interaction', async () => {
    const target = region()
    const wrapper = mount(MdvExtendedFab, {
      props: { scrollBehavior: 'collapse', scrollTarget: target },
      slots: extendedSlots,
      attachTo: document.body,
    })
    toolbarScroll(window, 200)
    toolbarScroll(target, 20)
    toolbarScroll(target, 39)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    toolbarScroll(target, 40)
    await flushPromises()
    expect(wrapper.classes()).toContain('mdv-extended-fab--collapsed')
    toolbarScroll(target, 0)
    await flushPromises()
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    wrapper.vm.focus()
    toolbarScroll(target, 100)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    wrapper.vm.blur()
    await wrapper.trigger('pointerdown')
    toolbarScroll(target, 200)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    document.dispatchEvent(new Event('pointerup'))
    toolbarScroll(target, 300)
    await flushPromises()
    expect(wrapper.classes()).toContain('mdv-extended-fab--collapsed')
  })

  it('rebinds getter targets, expands at the content end and never falls back from a missing target', async () => {
    const first = region()
    const second = region()
    const current = ref(first)
    const wrapper = mount(MdvExtendedFab, {
      props: { scrollBehavior: 'collapse', scrollTarget: () => current.value },
      slots: extendedSlots,
    })
    current.value = second
    await nextTick()
    toolbarScroll(first, 100)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    toolbarScroll(second, 100)
    await flushPromises()
    expect(wrapper.classes()).toContain('mdv-extended-fab--collapsed')
    Object.defineProperties(second, { scrollHeight: { value: 500 }, clientHeight: { value: 200 } })
    toolbarScroll(second, 300)
    await flushPromises()
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
    await wrapper.setProps({ scrollTarget: '#missing-fab-region' })
    toolbarScroll(window, 400)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-extended-fab--collapsed')
  })

  it('disconnects its scrolling and measurement work during KeepAlive and retains the action node', async () => {
    const shown = ref(true)
    const target = region()
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () =>
              shown.value
                ? h(
                    MdvExtendedFab,
                    { scrollBehavior: 'collapse', scrollTarget: target },
                    extendedSlots,
                  )
                : null,
          }),
      }),
      { attachTo: document.body },
    )
    const button = host.get('button').element
    toolbarScroll(target, 100)
    await flushPromises()
    expect(button.classList.contains('mdv-extended-fab--collapsed')).toBe(true)
    shown.value = false
    await flushPromises()
    toolbarScroll(target, 0)
    shown.value = true
    await flushPromises()
    expect(host.get('button').element).toBe(button)
    expect(button.classList.contains('mdv-extended-fab--collapsed')).toBe(true)
    toolbarScroll(target, 100)
    toolbarScroll(target, 0)
    await flushPromises()
    expect(button.classList.contains('mdv-extended-fab--collapsed')).toBe(false)
  })
})
