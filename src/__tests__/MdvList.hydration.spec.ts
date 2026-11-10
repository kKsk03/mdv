import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvList from '../components/MdvList.vue'
import MdvListItem from '../components/MdvListItem.vue'
import MdvListSubheader from '../components/MdvListSubheader.vue'
import type { MdvListModelValue } from '../components/list.types'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('MdvList hydration', () => {
  it('preserves native item nodes and keeps selection working after hydration', async () => {
    const selected = ref<string | null>('one')
    const update = vi.fn<(value: MdvListModelValue) => void>((value) => {
      selected.value = typeof value === 'string' ? value : null
    })
    const Example = defineComponent({
      setup() {
        return () =>
          h(
            MdvList,
            {
              selectionMode: 'single',
              modelValue: selected.value,
              'onUpdate:modelValue': update,
              'aria-label': '选项',
            },
            {
              default: () => [
                h(MdvListItem, { value: 'one', headline: '第一项' }),
                h(MdvListItem, { value: 'two', headline: '第二项' }),
              ],
            },
          )
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const options = [...container.querySelectorAll<HTMLElement>('[role="option"]')]
    const first = options[0]!
    const second = options[1]!
    first.focus()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect([...container.querySelectorAll('[role="option"]')]).toEqual(options)
      expect(document.activeElement).toBe(first)
      second.click()
      await nextTick()
      expect(update).toHaveBeenCalledExactlyOnceWith('two')
      expect(second.getAttribute('aria-selected')).toBe('true')
      expect(warning).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it('preserves segmented rows and action nodes when a subheader is removed after hydration', async () => {
    const showHeader = ref(true)
    const action = vi.fn<(event: MouseEvent) => void>()
    const primary = vi.fn<(event: MouseEvent) => void>()
    const Example = defineComponent({
      setup() {
        return () =>
          h(MdvList, { layout: 'segmented', 'aria-label': '分组操作' }, () => [
            h(
              MdvListItem,
              { key: 'one', headline: '第一项', interactive: true, onClick: primary },
              {
                'trailing-action': () =>
                  h('button', { type: 'button', 'data-action': true, onClick: action }, '更多'),
              },
            ),
            showHeader.value ? h(MdvListSubheader, null, () => '下一组') : null,
            h(MdvListItem, { key: 'two', headline: '第二项', href: '#settings' }),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const rows = [...container.querySelectorAll('.mdv-list-item')]
    const actionNode = container.querySelector<HTMLButtonElement>('[data-action]')!
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      actionNode.click()
      expect(action).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
      expect(primary).not.toHaveBeenCalled()
      showHeader.value = false
      await nextTick()
      expect([...container.querySelectorAll('.mdv-list-item')]).toEqual(rows)
      expect(container.querySelector('[data-action]')).toBe(actionNode)
      expect(container.querySelector('.mdv-list-subheader')).toBeNull()
      expect(rows[0]!.nextElementSibling).toBe(rows[1])
      expect(warning).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
