import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvFab from '../components/MdvFab.vue'
import MdvExtendedFab from '../components/MdvExtendedFab.vue'
import MdvToolbar from '../components/MdvToolbar.vue'
import { toolbarReducedMotion } from './toolbar-test-platform'

beforeEach(toolbarReducedMotion)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('FAB hydration', () => {
  it('keeps an initially collapsed action node, its name and external focus across hydration and toggles', async () => {
    const expanded = ref(false)
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h('input', { id: 'outside' }),
          h(
            MdvExtendedFab,
            { id: 'create', expanded: expanded.value },
            {
              leading: () => h('svg'),
              default: () => h('span', '新建笔记'),
            },
          ),
        ]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const button = container.querySelector<HTMLButtonElement>('#create')!
    const label = container.querySelector('.mdv-extended-fab__label')!
    const outside = container.querySelector<HTMLInputElement>('#outside')!
    outside.focus()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      expect(document.activeElement).toBe(outside)
      expect(container.querySelector('#create')).toBe(button)
      expect(container.querySelector('.mdv-extended-fab__label')).toBe(label)
      expect(label.textContent).toBe('新建笔记')
      button.focus()
      expanded.value = true
      await flushPromises()
      expanded.value = false
      await flushPromises()
      expect(document.activeElement).toBe(button)
      expect(container.querySelector('.mdv-extended-fab__label')).toBe(label)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })

  it('retains paired FAB, draft nodes and disclosure ids while transferring only affected focus', async () => {
    const expanded = ref(false)
    const Example = defineComponent({
      setup: () => () =>
        h(
          MdvToolbar,
          {
            variant: 'floating',
            expanded: expanded.value,
            'onUpdate:expanded': (value: boolean) => {
              expanded.value = value
            },
          },
          {
            default: () => h('input', { id: 'draft' }),
            fab: () => h(MdvFab, { id: 'save', 'aria-label': '保存' }, { default: () => h('svg') }),
          },
        ),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const input = container.querySelector<HTMLInputElement>('#draft')!
    const fab = container.querySelector<HTMLButtonElement>('#save')!
    const toggle = container.querySelector<HTMLButtonElement>('[aria-controls]')!
    const controls = toggle.getAttribute('aria-controls')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await flushPromises()
      toggle.click()
      await flushPromises()
      input.value = '保留草稿'
      input.focus()
      expanded.value = false
      await flushPromises()
      expect(document.activeElement).toBe(fab)
      expect(container.querySelector('#save')).toBe(fab)
      expect(container.querySelector('#draft')).toBe(input)
      expect(input.value).toBe('保留草稿')
      expect(toggle.getAttribute('aria-controls')).toBe(controls)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
