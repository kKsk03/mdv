import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, onMounted, ref } from 'vue'
import MdvToolbar from '../components/MdvToolbar.vue'
import type { MdvToolbarSlotProps } from '../components/toolbar.types'
import { toolbarReducedMotion, toolbarScroll } from './toolbar-test-platform'

enableAutoUnmount(afterEach)
beforeEach(toolbarReducedMotion)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

const groups = {
  leading: () => h('button', { id: 'undo' }, '撤销'),
  default: () => h('button', { id: 'save' }, '保存'),
  trailing: () => h('button', { id: 'redo' }, '重做'),
}
function region() {
  const node = document.createElement('div')
  document.body.append(node)
  return node
}

describe('MdvToolbar', () => {
  it('keeps native attributes, events, default semantics and external focus', async () => {
    const outside = document.createElement('input')
    document.body.append(outside)
    outside.focus()
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvToolbar, {
      attrs: { id: 'editor', 'aria-label': '编辑', class: 'custom', onClick: click },
      slots: { default: () => h('button', { type: 'button' }, '保存') },
      attachTo: document.body,
    })
    expect(wrapper.attributes('role')).toBe('toolbar')
    expect(wrapper.attributes('aria-label')).toBe('编辑')
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal')
    expect(wrapper.classes()).toContain('mdv-toolbar--docked')
    expect(wrapper.classes()).toContain('custom')
    expect(wrapper.classes()).not.toContain('mdv-toolbar--elevated')
    expect(document.activeElement).toBe(outside)
    expect(wrapper.get('button').attributes('tabindex')).toBeUndefined()
    await wrapper.get('button').trigger('click')
    expect(click).toHaveBeenCalledOnce()
    await wrapper.setProps({
      variant: 'floating',
      color: 'vibrant',
      orientation: 'vertical',
      elevated: false,
    })
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
    expect(wrapper.classes()).toContain('mdv-toolbar--vibrant')
    expect(wrapper.classes()).not.toContain('mdv-toolbar--elevated')
  })

  it('retains side nodes and edits, moves affected focus before inert, and restores the same groups', async () => {
    const mounted = vi.fn<() => void>()
    const Draft = defineComponent({
      setup() {
        onMounted(mounted)
        return () => h('input', { id: 'draft' })
      },
    })
    const wrapper = mount(MdvToolbar, {
      props: { variant: 'floating' },
      slots: { ...groups, leading: () => h(Draft) },
      attachTo: document.body,
    })
    const input = wrapper.get<HTMLInputElement>('#draft').element
    const leading = wrapper.get('.mdv-toolbar__region--leading').element
    input.value = '仍在编辑'
    input.focus()
    expect(await wrapper.vm.collapse()).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('#save').element)
    expect(leading.hasAttribute('inert')).toBe(true)
    expect(leading.getAttribute('aria-hidden')).toBe('true')
    expect(wrapper.get('button[aria-expanded]').attributes('aria-expanded')).toBe('false')
    expect(await wrapper.vm.expand()).toBe(true)
    expect(wrapper.get('.mdv-toolbar__region--leading').element).toBe(leading)
    expect(wrapper.get('#draft').element).toBe(input)
    expect(input.value).toBe('仍在编辑')
    expect(leading.hasAttribute('inert')).toBe(false)
    expect(mounted).toHaveBeenCalledOnce()
  })

  it('leaves rejected controlled requests and focus untouched, then follows an accepted model', async () => {
    const wrapper = mount(MdvToolbar, {
      props: { variant: 'floating', expanded: true },
      slots: groups,
      attachTo: document.body,
    })
    wrapper.get<HTMLButtonElement>('#undo').element.focus()
    expect(await wrapper.vm.collapse()).toBe(false)
    expect(wrapper.emitted('update:expanded')).toEqual([[false]])
    expect(document.activeElement).toBe(wrapper.get('#undo').element)
    expect(wrapper.get('.mdv-toolbar__region--leading').attributes('inert')).toBeUndefined()
    await wrapper.setProps({ expanded: false })
    expect(document.activeElement).toBe(wrapper.get('#save').element)
    expect(wrapper.get('.mdv-toolbar__region--leading').element.hasAttribute('inert')).toBe(true)
  })

  it('supports custom disclosure props without invoking the primary action', async () => {
    const save = vi.fn<() => void>()
    const wrapper = mount(MdvToolbar, {
      props: { variant: 'floating', expanded: false },
      slots: {
        leading: groups.leading,
        default: () => h('button', { onClick: save }, '保存'),
        toggle: ({ toggleProps }: MdvToolbarSlotProps) => h('button', toggleProps, '展开'),
      },
    })
    const button = wrapper.get('button[aria-expanded]')
    expect(button.attributes('aria-controls')).toBe(
      wrapper.get('.mdv-toolbar__region').attributes('id'),
    )
    await button.trigger('click')
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
    expect(save).not.toHaveBeenCalled()
  })

  it('uses direction-aware arrows and Home/End while leaving native Tab and complex widgets alone', async () => {
    const wrapper = mount(MdvToolbar, {
      attrs: { dir: 'rtl', style: 'direction: rtl' },
      slots: {
        default: () => [
          h('button', { id: 'first' }, '一'),
          h('button', { disabled: true }, '禁用'),
          h('button', { hidden: true }, '隐藏'),
          h('button', { style: 'display:none' }, '隐藏'),
          h('input', { id: 'input' }),
          h('div', { role: 'slider', tabindex: 0, id: 'slider' }),
          h('div', { 'data-mdv-toolbar': '', role: 'toolbar' }, [h('button', '内部')]),
          h('div', { role: 'menu' }, [h('button', '菜单内')]),
          h('button', { id: 'last' }, '末尾'),
        ],
      },
      attachTo: document.body,
    })
    wrapper.get<HTMLButtonElement>('#first').element.focus()
    await wrapper.get('#first').trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(wrapper.get('#input').element)
    const inputArrow = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    })
    wrapper.get('#input').element.dispatchEvent(inputArrow)
    expect(inputArrow.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('#input').element)
    wrapper.get<HTMLElement>('#slider').element.focus()
    const sliderArrow = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    })
    wrapper.get('#slider').element.dispatchEvent(sliderArrow)
    expect(sliderArrow.defaultPrevented).toBe(false)
    wrapper.get<HTMLButtonElement>('#first').element.focus()
    await wrapper.get('#first').trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(wrapper.get('#last').element)
    await wrapper.get('#last').trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(wrapper.get('#first').element)
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    wrapper.get('#first').element.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
  })

  it('uses vertical arrows without overriding activation or already handled key events', async () => {
    const wrapper = mount(MdvToolbar, {
      props: { variant: 'floating', orientation: 'vertical' },
      slots: groups,
      attachTo: document.body,
    })
    wrapper.get<HTMLButtonElement>('#undo').element.focus()
    await wrapper.get('#undo').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(wrapper.get('#save').element)
    await wrapper.get('#save').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(wrapper.get('#undo').element)
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    wrapper.get('#undo').element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(false)
    const handled = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    handled.preventDefault()
    wrapper.get('#undo').element.dispatchEvent(handled)
    expect(document.activeElement).toBe(wrapper.get('#undo').element)
  })

  it('accumulates directional scroll only on the explicit target and keeps focused or open controls visible', async () => {
    const target = region()
    const wrapper = mount(MdvToolbar, {
      props: { variant: 'floating', scrollBehavior: 'collapse', scrollTarget: target },
      slots: groups,
      attachTo: document.body,
    })
    toolbarScroll(window, 100)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-toolbar--expanded')
    toolbarScroll(target, 20)
    toolbarScroll(target, 39)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-toolbar--expanded')
    toolbarScroll(target, 40)
    await flushPromises()
    expect(wrapper.classes()).toContain('mdv-toolbar--collapsed')
    toolbarScroll(target, 20)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-toolbar--collapsed')
    toolbarScroll(target, 0)
    await flushPromises()
    expect(wrapper.classes()).toContain('mdv-toolbar--expanded')
    wrapper.get<HTMLButtonElement>('#undo').element.focus()
    toolbarScroll(target, 100)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-toolbar--expanded')
    wrapper.get<HTMLButtonElement>('#undo').element.blur()
    wrapper.get('#redo').element.setAttribute('data-mdv-menu-trigger-open', '')
    toolbarScroll(target, 200)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-toolbar--expanded')
  })

  it('hides without changing selection or DOM, reveals on Tab, and reconnects a getter target', async () => {
    const first = region()
    const second = region()
    const current = ref<HTMLElement | null>(first)
    const wrapper = mount(MdvToolbar, {
      props: { scrollBehavior: 'hide', scrollTarget: () => current.value },
      slots: groups,
      attachTo: document.body,
    })
    const control = wrapper.get('#save').element
    toolbarScroll(first, 50)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-toolbar--hidden')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-toolbar--hidden')
    expect(wrapper.get('#save').element).toBe(control)
    current.value = second
    await flushPromises()
    toolbarScroll(first, 200)
    await nextTick()
    expect(wrapper.classes()).not.toContain('mdv-toolbar--hidden')
    toolbarScroll(second, 100)
    await nextTick()
    expect(wrapper.classes()).toContain('mdv-toolbar--hidden')
  })

  it('does not fall back from a missing selector and disconnects scroll while kept alive', async () => {
    const shown = ref(true)
    const target = region()
    target.id = 'toolbar-region'
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () =>
              shown.value
                ? h(MdvToolbar, { scrollBehavior: 'hide', scrollTarget: '#toolbar-region' }, groups)
                : null,
          }),
      }),
      { attachTo: document.body },
    )
    const root = host.get('[data-mdv-toolbar]').element
    toolbarScroll(target, 100)
    await nextTick()
    expect(root.classList.contains('mdv-toolbar--hidden')).toBe(true)
    shown.value = false
    await flushPromises()
    toolbarScroll(target, 0)
    shown.value = true
    await flushPromises()
    expect(host.get('[data-mdv-toolbar]').element).toBe(root)
    expect(root.classList.contains('mdv-toolbar--hidden')).toBe(false)
    host.unmount()
    const missing = mount(MdvToolbar, {
      props: { scrollBehavior: 'hide', scrollTarget: '#missing' },
      slots: groups,
    })
    toolbarScroll(window, 500)
    await nextTick()
    expect(missing.classes()).not.toContain('mdv-toolbar--hidden')
  })
})
