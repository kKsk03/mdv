import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MdvFab from '../components/MdvFab.vue'
import MdvToolbar from '../components/MdvToolbar.vue'
import { toolbarControls } from '../components/toolbar-focus'
import { toolbarReducedMotion } from './toolbar-test-platform'

enableAutoUnmount(afterEach)
beforeEach(toolbarReducedMotion)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
function slots(click = vi.fn<() => void>()) {
  return {
    default: () => h('button', { id: 'undo' }, '撤销'),
    fab: () => h(MdvFab, { 'aria-label': '新建', onClick: click }, { default: () => h('svg') }),
  }
}

describe('Toolbar paired FAB', () => {
  it('keeps primary activation separate from disclosure and hides the action body accessibly', async () => {
    const click = vi.fn<() => void>()
    const wrapper = mount(MdvToolbar, {
      props: { variant: 'floating', expandLabel: '展开工具栏' },
      slots: slots(click),
      attachTo: document.body,
    })
    const fab = wrapper.get<HTMLButtonElement>('.mdv-fab').element
    expect(fab.classList.contains('mdv-fab--secondary-container')).toBe(true)
    fab.click()
    await nextTick()
    expect(click).toHaveBeenCalledOnce()
    expect(wrapper.emitted('update:expanded')).toBeUndefined()
    wrapper.get<HTMLButtonElement>('#undo').element.focus()
    expect(await wrapper.vm.collapse()).toBe(true)
    expect(document.activeElement).toBe(fab)
    expect(wrapper.get('.mdv-toolbar__body').attributes('inert')).toBeDefined()
    expect(toolbarControls(wrapper.element).map((node) => node.getAttribute('aria-label'))).toEqual(
      ['新建', '展开工具栏'],
    )
    const toggle = wrapper.get<HTMLButtonElement>('[aria-expanded]')
    expect(toggle.attributes('aria-controls')).toBe(
      wrapper.get('.mdv-toolbar__body').attributes('id'),
    )
    toggle.element.click()
    await flushPromises()
    expect(wrapper.get('.mdv-toolbar__body').attributes('inert')).toBeUndefined()
    expect(click).toHaveBeenCalledOnce()
  })

  it('preserves draft and action nodes through position changes, while respecting controlled rejection', async () => {
    const wrapper = mount(MdvToolbar, {
      props: { variant: 'floating', expanded: true },
      slots: { ...slots(), default: () => h('input', { id: 'draft' }) },
      attachTo: document.body,
    })
    const input = wrapper.get<HTMLInputElement>('#draft').element
    const fab = wrapper.get('.mdv-fab').element
    input.value = '草稿'
    input.focus()
    expect(await wrapper.vm.collapse()).toBe(false)
    expect(document.activeElement).toBe(input)
    expect(wrapper.get('.mdv-toolbar__body').attributes('inert')).toBeUndefined()
    await wrapper.setProps({ fabPosition: 'start', orientation: 'vertical' })
    expect(wrapper.get('#draft').element).toBe(input)
    expect(wrapper.get('.mdv-fab').element).toBe(fab)
    expect(input.value).toBe('草稿')
    await wrapper.setProps({ expanded: false })
    expect(document.activeElement).toBe(fab)
    expect(wrapper.get('.mdv-toolbar__body').attributes('inert')).toBeDefined()
  })

  it('scopes contextual color and sizing to the fab slot and leaves explicit color intact', async () => {
    const explicit = ref(false)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvToolbar,
            { variant: 'floating', color: 'vibrant' },
            {
              default: () => h(MdvFab, { 'aria-label': '独立' }, { default: () => h('svg') }),
              fab: () =>
                h(
                  MdvFab,
                  {
                    'aria-label': '主要',
                    color: explicit.value ? 'primary' : undefined,
                    elevated: false,
                  },
                  { default: () => h('svg') },
                ),
            },
          ),
      }),
    )
    expect(host.get('[aria-label="主要"]').classes()).toContain('mdv-fab--tertiary-container')
    expect(host.get('[aria-label="主要"]').classes()).toContain('mdv-fab--toolbar')
    expect(host.get('[aria-label="主要"]').classes()).not.toContain('mdv-fab--elevated')
    expect(host.get('[aria-label="独立"]').classes()).toContain('mdv-fab--primary-container')
    expect(host.get('[aria-label="独立"]').classes()).not.toContain('mdv-fab--toolbar')
    explicit.value = true
    await nextTick()
    expect(host.get('[aria-label="主要"]').classes()).toContain('mdv-fab--primary')
  })
})
