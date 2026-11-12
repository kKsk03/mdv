import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvNavigationDrawer from '../components/MdvNavigationDrawer.vue'
import MdvModalNavigationDrawer from '../components/MdvModalNavigationDrawer.vue'
import MdvNavigationDrawerItem from '../components/MdvNavigationDrawerItem.vue'
import MdvNavigationDrawerGroup from '../components/MdvNavigationDrawerGroup.vue'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(() => {
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

describe('Navigation Drawer hydration', () => {
  it('keeps standard nodes, disclosure ids, draft input and external focus across hydration and toggles', async () => {
    const visible = ref(true)
    const draft = ref('服务端草稿')
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('input', {
            id: 'draft',
            value: draft.value,
            onInput: (event: Event) => {
              draft.value = (event.target as HTMLInputElement).value
            },
          }),
          h(
            MdvNavigationDrawer,
            { modelValue: visible.value, title: '邮箱' },
            {
              default: () =>
                h(
                  MdvNavigationDrawerGroup,
                  { label: '文件夹', collapsible: true },
                  { default: () => h(MdvNavigationDrawerItem, { label: '收藏', active: true }) },
                ),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector<HTMLInputElement>('input')!
    const item = container.querySelector('[data-mdv-drawer-control][aria-current]')!
    const button = container.querySelector('button[aria-controls]')!
    const controls = button.getAttribute('aria-controls')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    input.focus()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(input)
      input.value = '用户草稿'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await flushPromises()
      expect(draft.value).toBe('用户草稿')
      visible.value = false
      await flushPromises()
      visible.value = true
      await flushPromises()
      expect(container.querySelector('[data-mdv-drawer-control][aria-current]')).toBe(item)
      expect(button.getAttribute('aria-controls')).toBe(controls)
      expect(container.querySelector('input')).toBe(input)
      expect(input.value).toBe('用户草稿')
      expect(document.activeElement).toBe(input)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })

  it('hydrates retained modal nodes, honors autofocus and restores its trigger after closing', async () => {
    const visible = ref(false)
    const draft = ref('服务端草稿')
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(
            'button',
            {
              id: 'trigger',
              onClick: () => {
                visible.value = true
              },
            },
            '打开',
          ),
          h(
            MdvModalNavigationDrawer,
            {
              modelValue: visible.value,
              title: '邮箱',
              'onUpdate:modelValue': (value: boolean) => {
                visible.value = value
              },
            },
            {
              default: () => h(MdvNavigationDrawerItem, { label: '首页' }),
              footer: () =>
                h('input', {
                  autofocus: true,
                  value: draft.value,
                  onInput: (event: Event) => {
                    draft.value = (event.target as HTMLInputElement).value
                  },
                }),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const trigger = container.querySelector<HTMLButtonElement>('#trigger')!
    const dialog = container.querySelector<HTMLDialogElement>('dialog')!
    const input = container.querySelector<HTMLInputElement>('input')!
    const id = dialog.id
    const label = dialog.getAttribute('aria-labelledby')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    trigger.focus()
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(trigger)
      expect(dialog.open).toBe(false)
      trigger.click()
      await flushPromises()
      expect(container.querySelector('dialog')).toBe(dialog)
      expect(container.querySelector('input')).toBe(input)
      expect(dialog.id).toBe(id)
      expect(dialog.getAttribute('aria-labelledby')).toBe(label)
      expect(document.activeElement).toBe(input)
      input.value = '保留的编辑'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await flushPromises()
      expect(draft.value).toBe('保留的编辑')
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
      await flushPromises()
      expect(dialog.open).toBe(false)
      expect(document.activeElement).toBe(trigger)
      trigger.click()
      await flushPromises()
      expect(container.querySelector('input')).toBe(input)
      expect(input.value).toBe('保留的编辑')
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
