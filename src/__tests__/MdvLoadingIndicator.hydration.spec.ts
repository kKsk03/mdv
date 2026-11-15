import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvLoadingIndicator from '../components/MdvLoadingIndicator.vue'
import { loadingAnimationClock, loadingMotionPreference } from './loading-indicator-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('Loading Indicator hydration', () => {
  it('复用全部图形节点，动画与属性更新不覆盖相位或移动外部焦点', async () => {
    const clock = loadingAnimationClock()
    loadingMotionPreference()
    vi.stubGlobal('IntersectionObserver', undefined)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const size = ref(48)
    const contained = ref(false)
    const label = ref('正在加载文章')
    const Example = defineComponent({
      setup: () => () =>
        h(MdvLoadingIndicator, {
          id: 'article-loading',
          size: size.value,
          contained: contained.value,
          label: label.value,
        }),
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    const outside = document.createElement('button')
    document.body.append(outside, host)
    outside.focus()
    const root = host.querySelector('span')!
    const svg = host.querySelector('svg')!
    const rotor = host.querySelector('g')!
    const path = host.querySelector('path')!
    const initial = path.getAttribute('d')
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await nextTick()
      expect(path.getAttribute('d')).toBe(initial)
      clock.step(0)
      clock.advance(250)
      const animated = path.getAttribute('d')
      expect(animated).not.toBe(initial)
      size.value = 96
      contained.value = true
      label.value = '正在刷新文章'
      await nextTick()
      expect(host.querySelector('span')).toBe(root)
      expect(host.querySelector('svg')).toBe(svg)
      expect(host.querySelector('g')).toBe(rotor)
      expect(host.querySelector('path')).toBe(path)
      expect(path.getAttribute('d')).toBe(animated)
      expect(svg.getAttribute('width')).toBe('76')
      expect(root.getAttribute('id')).toBe('article-loading')
      expect(root.getAttribute('aria-label')).toBe('正在刷新文章')
      expect(document.activeElement).toBe(outside)
      expect(warning).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
    expect(clock.pending()).toBe(0)
  })
})
