import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCard from '../components/MdvCard.vue'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('MdvCard hydration', () => {
  it('preserves native nodes, names and existing focus, then keeps static and primary actions working', async () => {
    const innerClick = vi.fn<(event: MouseEvent) => void>()
    const primaryClick = vi.fn<(event: MouseEvent) => void>()
    const linkClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault())
    const Example = defineComponent({
      setup() {
        const disabled = ref(false)
        return () =>
          h('main', [
            h(
              MdvCard,
              { title: '普通容器' },
              { actions: () => h('button', { type: 'button', onClick: innerClick }, '收藏') },
            ),
            h(MdvCard, { title: '打开详情', clickable: true, onClick: primaryClick }),
            h(MdvCard, {
              title: '查看指南',
              href: '/guide',
              target: '_blank',
              disabled: disabled.value,
              onClick: linkClick,
            }),
            h(
              'button',
              { type: 'button', onClick: () => (disabled.value = !disabled.value) },
              '禁用',
            ),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const actions = [
      ...container.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('button, a'),
    ]
    const names = actions.map((action) => action.getAttribute('aria-labelledby'))
    actions[1]!.focus()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(container)
      await nextTick()
      expect([...container.querySelectorAll('button, a')]).toEqual(actions)
      expect(actions.map((action) => action.getAttribute('aria-labelledby'))).toEqual(names)
      expect(document.activeElement).toBe(actions[1])
      actions[0]!.click()
      actions[1]!.click()
      actions[2]!.click()
      expect(innerClick).toHaveBeenCalledTimes(1)
      expect(primaryClick).toHaveBeenCalledTimes(1)
      expect(linkClick).toHaveBeenCalledTimes(1)
      actions[3]!.click()
      await nextTick()
      expect(actions[2]!.getAttribute('href')).toBeNull()
      expect(actions[2]!.getAttribute('aria-disabled')).toBe('true')
      actions[2]!.click()
      expect(linkClick).toHaveBeenCalledTimes(1)
      expect(warning).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
