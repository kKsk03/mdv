import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import favorite from '@iconify-icons/material-symbols/favorite'
import favoriteOutline from '@iconify-icons/material-symbols/favorite-outline'
import MdvIcon from '../components/MdvIcon.vue'
import MdvIconButton from '../components/MdvIconButton.vue'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('MdvIcon hydration', () => {
  it('reuses server-rendered Symbols and updates the selected icon after hydration', async () => {
    const fetchIcon = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchIcon)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Example = defineComponent({
      setup() {
        const selected = ref(false)
        return () =>
          h('div', [
            h(MdvIcon, { icon: favorite, 'aria-label': '已收藏', size: 32 }),
            h(
              MdvIconButton,
              {
                selected: selected.value,
                'onUpdate:selected': (value: boolean) => (selected.value = value),
                'aria-label': '收藏',
              },
              {
                default: () => h(MdvIcon, { icon: favoriteOutline }),
                selected: () => h(MdvIcon, { icon: favorite }),
              },
            ),
          ])
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(container)
    const serverIcons = Array.from(container.querySelectorAll('svg'))
    const serverBody = container.innerHTML
    const app = createSSRApp(Example)

    try {
      app.mount(container)
      await nextTick()
      const clientIcons = Array.from(container.querySelectorAll('svg'))
      expect(clientIcons).toHaveLength(2)
      clientIcons.forEach((icon, index) => expect(icon).toBe(serverIcons[index]))
      expect(container.innerHTML).toBe(serverBody)

      const button = container.querySelector('button')!
      const outlineBody = button.querySelector('svg')!.innerHTML
      button.click()
      await nextTick()
      expect(button.getAttribute('aria-pressed')).toBe('true')
      expect(button.querySelector('svg')!.innerHTML).not.toBe(outlineBody)
      expect(button.getAttribute('aria-label')).toBe('收藏')
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
      expect(fetchIcon).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
    }
  })
})
