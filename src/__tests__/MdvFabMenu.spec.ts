import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref, shallowRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import MdvFabMenu from '../components/MdvFabMenu.vue'
import MdvFabMenuItem from '../components/MdvFabMenuItem.vue'
import MdvDialog from '../components/MdvDialog.vue'
import type {
  MdvFabMenuSelectEvent,
  MdvFabMenuTriggerAttrs,
  MdvFabMenuVariant,
} from '../components/fab-menu.types'
import { mockMenuPlatform } from './menu-test-platform'

const nativeMutationObserver = window.MutationObserver
let platform: ReturnType<typeof mockMenuPlatform>
beforeEach(() => {
  platform = mockMenuPlatform()
  vi.stubGlobal('MutationObserver', nativeMutationObserver)
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
// Vitest 默认按栈顺序执行 afterEach，须先卸载组件再恢复原生方法。
enableAutoUnmount(afterEach)
const trigger = '.mdv-fab-menu__trigger'
const layer = '.mdv-fab-menu__layer'
const item = '[data-mdv-fab-menu-item]'
async function settle() {
  await nextTick()
  await flushPromises()
  await nextTick()
}
function key(element: Element, value: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  element.dispatchEvent(event)
  return event
}

describe('MdvFabMenu', () => {
  it('retains one trigger, native Tab order, and external focus until opened, then restores Escape', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    const wrapper = mount(MdvFabMenu, {
      props: { label: '新建内容' },
      slots: {
        default: () => [h(MdvFabMenuItem, { label: '文档' }), h(MdvFabMenuItem, { label: '图片' })],
      },
      attachTo: document.body,
    })
    const button = wrapper.get<HTMLButtonElement>(trigger).element
    expect(document.activeElement).toBe(outside)
    expect(wrapper.get('[role="group"]').attributes('hidden')).toBeDefined()
    button.focus()
    button.click()
    await settle()
    expect(wrapper.get(trigger).element).toBe(button)
    expect(document.activeElement).toBe(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-label')).toBe('关闭菜单')
    expect(button.hasAttribute('aria-haspopup')).toBe(false)
    expect(platform.opened.has(wrapper.get<HTMLElement>(layer).element)).toBe(true)
    const controls = wrapper.findAll('button').map((control) => control.element)
    expect(controls.map((control) => control.textContent?.trim())).toEqual(['', '文档', '图片'])
    expect(controls.map((control) => control.getAttribute('tabindex'))).toEqual([null, null, null])
    expect(key(button, 'Tab').defaultPrevented).toBe(false)
    controls[1]!.focus()
    expect(key(controls[1]!, 'ArrowDown').defaultPrevented).toBe(false)
    key(controls[1]!, 'Escape')
    await settle()
    expect(document.activeElement).toBe(button)
    expect(platform.opened.size).toBe(0)
    expect(button.getAttribute('aria-label')).toBe('新建内容')
    expect(wrapper.emitted('close')).toEqual([[{ reason: 'escape' }]])
    expect(wrapper.emitted('opened')).toHaveLength(1)
    expect(wrapper.emitted('closed')).toHaveLength(1)
  })

  it('accepts controlled state without prematurely showing or hiding the layer', async () => {
    const open = ref(false)
    const reject = ref(true)
    const proposals = vi.fn<(value: boolean) => void>((value) => {
      if (!reject.value) open.value = value
    })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            MdvFabMenu,
            { modelValue: open.value, label: '受控', 'onUpdate:modelValue': proposals },
            () => [h(MdvFabMenuItem, { label: '一' }), h(MdvFabMenuItem, { label: '二' })],
          ),
      }),
      { attachTo: document.body },
    )
    await wrapper.get(trigger).trigger('click')
    await settle()
    expect(proposals).toHaveBeenLastCalledWith(true)
    expect(platform.opened.size).toBe(0)
    reject.value = false
    await wrapper.get(trigger).trigger('click')
    await settle()
    expect(platform.opened.size).toBe(1)
    reject.value = true
    key(wrapper.get(trigger).element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(1)
    expect(wrapper.get(trigger).attributes('aria-expanded')).toBe('true')
    reject.value = false
    key(wrapper.get(trigger).element, 'Escape')
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('leaves outside pointer and focus targets intact without a document scroll lock', async () => {
    const outside = document.createElement('input')
    document.body.append(outside)
    const wrapper = mount(MdvFabMenu, {
      props: { label: '新建' },
      slots: { default: () => h(MdvFabMenuItem, { label: '文档' }) },
      attachTo: document.body,
    })
    wrapper.vm.open()
    await settle()
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    outside.focus()
    await settle()
    expect(document.activeElement).toBe(outside)
    expect(wrapper.emitted('close')).toEqual([[{ reason: 'outside' }]])
    expect(document.documentElement.style.overflow).toBe('')
    wrapper.vm.open()
    await settle()
    outside.focus()
    await settle()
    expect(document.activeElement).toBe(outside)
    expect(wrapper.emitted('close')?.[1]).toEqual([{ reason: 'focus-out' }])
  })

  it('runs an action once, supports cancellation and keepOpen, and blocks disabled native links', async () => {
    const action = vi.fn<(event: MdvFabMenuSelectEvent) => void>()
    const cancelled = vi.fn<(event: MdvFabMenuSelectEvent) => void>((event) =>
      event.preventDefault(),
    )
    const disabled = vi.fn<(event: MdvFabMenuSelectEvent) => void>()
    const wrapper = mount(MdvFabMenu, {
      props: { label: '操作' },
      slots: {
        default: () => [
          h(MdvFabMenuItem, { label: '取消链接', href: '/cancelled', onSelect: cancelled }),
          h(MdvFabMenuItem, { label: '保持展开', keepOpen: true, value: 0, onSelect: action }),
          h(MdvFabMenuItem, {
            label: '不可用',
            href: '/disabled',
            disabled: true,
            onSelect: disabled,
          }),
          h(MdvFabMenuItem, { label: '完成', onSelect: action }),
        ],
      },
      attachTo: document.body,
    })
    wrapper.vm.open()
    await settle()
    const links = wrapper.findAll(item)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    links[0]!.element.dispatchEvent(event)
    await settle()
    expect(event.defaultPrevented).toBe(true)
    expect(cancelled).toHaveBeenCalledOnce()
    expect(platform.opened.size).toBe(1)
    await links[1]!.trigger('click')
    await settle()
    expect(action).toHaveBeenCalledOnce()
    expect(action.mock.calls[0]?.[0].detail.value).toBe(0)
    expect(platform.opened.size).toBe(1)
    expect(links[2]!.attributes('href')).toBeUndefined()
    expect(links[2]!.attributes('aria-disabled')).toBe('true')
    await links[2]!.trigger('click')
    expect(disabled).not.toHaveBeenCalled()
    await links[3]!.trigger('click')
    await settle()
    expect(action).toHaveBeenCalledTimes(2)
    expect(platform.opened.size).toBe(0)
  })

  it('preserves native event cancellation, button type, link attributes and separate group attributes', async () => {
    const wrapper = mount(MdvFabMenu, {
      props: {
        label: '更多',
        triggerAttrs: {
          id: 'custom-id',
          type: 'submit',
          form: 'editor',
          onClick: (event: MouseEvent) => event.preventDefault(),
        },
      },
      attrs: { dir: 'rtl', class: 'host' },
      slots: {
        default: () =>
          h(MdvFabMenuItem, {
            label: '链接',
            href: '/new',
            target: '_blank',
            rel: 'noopener',
            download: 'draft',
          }),
      },
      attachTo: document.body,
    })
    expect(wrapper.classes()).toContain('host')
    expect(wrapper.attributes('dir')).toBe('rtl')
    expect(wrapper.get(trigger).attributes('type')).toBe('button')
    expect(wrapper.get(trigger).attributes('form')).toBe('editor')
    expect(wrapper.get('a').attributes()).toMatchObject({
      href: '/new',
      target: '_blank',
      rel: 'noopener',
      download: 'draft',
    })
    await wrapper.get(trigger).trigger('click')
    await settle()
    expect(platform.opened.size).toBe(0)
  })

  it('blocks native activation callbacks on disabled links and returns focus when a dynamic action disappears', async () => {
    const visible = ref(true)
    const disabled = ref(false)
    const activation = vi.fn<(event: Event) => void>()
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvFabMenu, { label: '动态操作' }, () => [
            h(MdvFabMenuItem, {
              label: '禁用链接',
              href: '/disabled',
              disabled: true,
              onClick: activation,
              onAuxclick: activation,
              onKeydown: activation,
            }),
            visible.value
              ? h(MdvFabMenuItem, { label: '动态操作项', disabled: disabled.value })
              : null,
            h(MdvFabMenuItem, { label: '保留操作' }),
          ]),
      }),
      { attachTo: document.body },
    )
    await wrapper.get(trigger).trigger('click')
    await settle()
    const link = wrapper.get('a').element
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    link.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))
    key(link, 'Enter')
    expect(activation).not.toHaveBeenCalled()
    const operation = wrapper.findAll<HTMLButtonElement>(item)[1]!.element
    operation.focus()
    disabled.value = true
    await settle()
    expect(document.activeElement).toBe(wrapper.get(trigger).element)
    disabled.value = false
    await settle()
    operation.focus()
    visible.value = false
    await settle()
    expect(document.activeElement).toBe(wrapper.get(trigger).element)
    expect(platform.opened.size).toBe(1)
  })

  it('respects a disabled fieldset and becomes interactive again when it is enabled', async () => {
    const disabled = ref(true)
    const activation = vi.fn<(event: Event) => void>()
    const selected = vi.fn<(event: MdvFabMenuSelectEvent) => void>()
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('fieldset', { disabled: disabled.value }, [
            h(MdvFabMenu, { label: '新建', triggerAttrs: { onClick: activation } }, () =>
              h(MdvFabMenuItem, { label: '文档', onClick: activation, onSelect: selected }),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const button = wrapper.get<HTMLButtonElement>(trigger).element
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    wrapper.getComponent(MdvFabMenu).vm.open()
    await settle()
    expect(activation).not.toHaveBeenCalled()
    expect(button.getAttribute('aria-expanded')).toBe('false')

    disabled.value = false
    await nextTick()
    button.click()
    await settle()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(activation).toHaveBeenCalledOnce()

    disabled.value = true
    await nextTick()
    const action = wrapper.get(item).element
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    action.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(activation).toHaveBeenCalledOnce()
    expect(selected).not.toHaveBeenCalled()

    disabled.value = false
    await nextTick()
    action.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await settle()
    expect(activation).toHaveBeenCalledTimes(2)
    expect(selected).toHaveBeenCalledOnce()
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('allows Tab to leave naturally and closes without restoring focus over its destination', async () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h(MdvFabMenu, { label: '操作' }, () => h(MdvFabMenuItem, { label: '文档' })),
            h('button', { id: 'following' }, '下一个控件'),
          ]),
      }),
      { attachTo: document.body },
    )
    await wrapper.get(trigger).trigger('click')
    await settle()
    const operation = wrapper.get<HTMLButtonElement>(item).element
    const following = wrapper.get<HTMLButtonElement>('#following').element
    operation.focus()
    expect(key(operation, 'Tab').defaultPrevented).toBe(false)
    following.focus()
    await settle()
    expect(document.activeElement).toBe(following)
    expect(wrapper.getComponent(MdvFabMenu).emitted('close')).toEqual([[{ reason: 'tab' }]])
    expect(platform.opened.size).toBe(0)
  })

  it('forwards, replaces, and clears the real trigger ref', async () => {
    const first = shallowRef<Element | null>(null)
    const second =
      vi.fn<
        (value: Element | ComponentPublicInstance | null, refs: Record<string, unknown>) => void
      >()
    const attributes = shallowRef<MdvFabMenuTriggerAttrs>({ ref: first })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(MdvFabMenu, { label: '新建', triggerAttrs: attributes.value }, () =>
            h(MdvFabMenuItem, { label: '文档' }),
          ),
      }),
      { attachTo: document.body },
    )
    const button = wrapper.get(trigger).element
    expect(first.value).toBe(button)
    attributes.value = { ref: second }
    await nextTick()
    expect(first.value).toBeNull()
    expect(second).toHaveBeenLastCalledWith(button, expect.any(Object))
    wrapper.unmount()
    expect(second).toHaveBeenLastCalledWith(null, expect.any(Object))
  })

  it('keeps baseline Menu keyboard navigation and closes from an action', async () => {
    const selected = vi.fn<(event: MdvFabMenuSelectEvent) => void>()
    const wrapper = mount(MdvFabMenu, {
      props: { label: '新建', variant: 'baseline' },
      slots: {
        default: () => [
          h(MdvFabMenuItem, { label: '一', onSelect: selected }),
          h(MdvFabMenuItem, { label: '二' }),
        ],
      },
      attachTo: document.body,
    })
    key(wrapper.get(trigger).element, 'ArrowDown')
    await settle()
    const items = wrapper.findAll('[role="menuitem"]')
    expect(document.activeElement).toBe(items[0]!.element)
    expect(wrapper.get(trigger).attributes('aria-haspopup')).toBe('menu')
    key(items[0]!.element, 'ArrowDown')
    await settle()
    expect(document.activeElement).toBe(items[1]!.element)
    key(items[1]!.element, 'Escape')
    await settle()
    expect(document.activeElement).toBe(wrapper.get(trigger).element)
    wrapper.vm.open()
    await settle()
    await items[0]!.trigger('click')
    await settle()
    expect(selected).toHaveBeenCalledOnce()
    expect(platform.opened.size).toBe(0)
  })

  it('keeps the explicit anchor and moves focused items above the close button', async () => {
    const wrapper = mount(MdvFabMenu, {
      props: { label: '新建', size: 'large' },
      slots: { default: () => h(MdvFabMenuItem, { label: '文档' }) },
      attachTo: document.body,
    })
    platform.geometry(wrapper.element as HTMLElement, { x: 800, y: 620, width: 96, height: 96 })
    const viewport = wrapper.get<HTMLElement>('[role="group"]').element
    const operation = wrapper.get<HTMLElement>(item).element
    wrapper.vm.open()
    await settle()
    expect(wrapper.get<HTMLElement>(layer).element.style.left).toBe('800px')
    expect(wrapper.get<HTMLElement>(layer).element.style.top).toBe('620px')
    platform.geometry(viewport, { x: 600, y: 20, width: 300, height: 656 })
    platform.geometry(operation, { x: 680, y: 650, width: 200, height: 56 })
    operation.focus()
    expect(viewport.scrollTop).toBeGreaterThan(0)
    wrapper.vm.close()
    await settle()
    expect(wrapper.get<HTMLElement>(layer).element.style.top).toBe('')
  })

  it('releases top-layer resources across mode changes and KeepAlive deactivation', async () => {
    const shown = ref(true)
    const variant = ref<MdvFabMenuVariant>('expressive')
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, () =>
            shown.value
              ? h(MdvFabMenu, { label: '新建', variant: variant.value }, () => [
                  h(MdvFabMenuItem, { label: '一' }),
                  h(MdvFabMenuItem, { label: '二' }),
                ])
              : h('div'),
          ),
      }),
      { attachTo: document.body },
    )
    await wrapper.get(trigger).trigger('click')
    await settle()
    expect(platform.opened.size).toBe(1)
    variant.value = 'baseline'
    await settle()
    expect(platform.opened.size).toBe(1)
    shown.value = false
    await settle()
    expect(platform.opened.size).toBe(0)
    shown.value = true
    await settle()
    expect(wrapper.get(trigger).attributes('aria-expanded')).toBe('true')
    expect(platform.opened.size).toBe(1)
  })

  it('hands focus to a Dialog opened by an action without a late focus restore', async () => {
    const opened = ref(false)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h(MdvFabMenu, { label: '新建' }, () =>
              h(MdvFabMenuItem, {
                label: '打开对话框',
                onSelect: () => {
                  opened.value = true
                },
              }),
            ),
            h(MdvDialog, { modelValue: opened.value, title: '确认' }, () =>
              h('input', { autofocus: true }),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    await wrapper.get(trigger).trigger('click')
    await settle()
    await wrapper.get(item).trigger('click')
    await settle()
    expect(document.activeElement).toBe(wrapper.get('input').element)
    expect(platform.opened.size).toBe(0)
  })
})
