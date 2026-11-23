import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import MdvLoadingIndicator from '../components/MdvLoadingIndicator.vue'
import type { MdvLoadingIndicatorProps } from '../components/loading-indicator.types'
import { loadingAnimationClock, loadingMotionPreference } from './loading-indicator-test-platform'

const mounted: { unmount: () => void }[] = []

function track<T extends { unmount: () => void }>(wrapper: T): T {
  mounted.push(wrapper)
  return wrapper
}

function render(props: MdvLoadingIndicatorProps = {}, attrs: Record<string, unknown> = {}) {
  return track(mount(MdvLoadingIndicator, { props, attrs, attachTo: document.body }))
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', undefined)
  vi.stubGlobal('matchMedia', undefined)
  vi.stubGlobal('IntersectionObserver', undefined)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
})

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('MdvLoadingIndicator', () => {
  it('不注入默认名称，并保留不确定进度语义；SVG 不可聚焦且首帧非空', () => {
    const wrapper = render()
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.text()).toBe('')
    expect(wrapper.get('svg').attributes('width')).toBe('38')
    expect(wrapper.get('svg').attributes('height')).toBe('38')
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('svg').attributes('focusable')).toBe('false')
    expect(wrapper.get('path').attributes('d')).toMatch(/^M.+Z$/)
  })

  it.each([
    { size: 0, normalized: 24 },
    { size: 24, normalized: 24 },
    { size: 72.5, normalized: 72.5 },
    { size: 240, normalized: 240 },
    { size: 300, normalized: 240 },
    { size: NaN, normalized: 48 },
    { size: Infinity, normalized: 48 },
  ])('约束 size=$size，并为两种形态保留相同比例', async ({ size, normalized }) => {
    const wrapper = render({ size })
    const expected = String((normalized * 38) / 48)
    expect(wrapper.attributes('style')).toContain(`--mdv-loading-indicator-size: ${normalized}px`)
    expect(wrapper.get('svg').attributes('width')).toBe(expected)
    await wrapper.setProps({ contained: true })
    expect(wrapper.classes()).toContain('mdv-loading-indicator--contained')
    expect(wrapper.get('svg').attributes('width')).toBe(expected)
    expect(wrapper.html()).not.toMatch(/NaN|Infinity/)
  })

  it('名称按原生属性优先，并透传样式和监听；不会接受伪造的百分比', async () => {
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = render(
      { label: '正在加载文章' },
      {
        id: 'article-loading',
        class: 'custom-loading',
        dir: 'rtl',
        style: '--mdv-loading-indicator-active-color: currentColor',
        'aria-label': '正在刷新文章',
        'aria-describedby': 'article-help',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': 60,
        'aria-valuetext': '60%',
        role: 'slider',
        onClick: click,
      },
    )
    expect(wrapper.attributes('aria-label')).toBe('正在刷新文章')
    expect(wrapper.attributes('aria-describedby')).toBe('article-help')
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('id')).toBe('article-loading')
    expect(wrapper.classes()).toContain('custom-loading')
    expect(wrapper.attributes('dir')).toBe('rtl')
    expect(wrapper.attributes('style')).toContain(
      '--mdv-loading-indicator-active-color: currentColor',
    )
    for (const attr of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext']) {
      expect(wrapper.attributes(attr)).toBeUndefined()
    }
    await wrapper.trigger('click')
    expect(click).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    const labelled = render({ label: '备用名称' }, { 'aria-labelledby': 'article-title' })
    expect(labelled.attributes('aria-labelledby')).toBe('article-title')
    expect(labelled.attributes('aria-label')).toBeUndefined()
    const fallback = render({ label: '   ' })
    expect(fallback.attributes('aria-label')).toBeUndefined()
  })

  it('装饰模式移除角色和重复名称，动态恢复时保留同一图形', async () => {
    const wrapper = render(
      { decorative: true, label: '正在保存' },
      {
        role: 'status',
        'aria-label': '正在提交',
        'aria-labelledby': 'save-label',
        'aria-hidden': false,
      },
    )
    const svg = wrapper.get('svg').element
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    await wrapper.setProps({ decorative: false })
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-label')).toBe('正在提交')
    expect(wrapper.attributes('aria-labelledby')).toBe('save-label')
    expect(wrapper.get('svg').element).toBe(svg)
  })
})

describe('Loading Indicator motion lifecycle', () => {
  it('暂停冻结相位；修改尺寸、名称和容器不重置；恢复时不追赶隐藏时长', async () => {
    const clock = loadingAnimationClock()
    const wrapper = render()
    const svg = wrapper.get('svg').element
    const path = wrapper.get('path')
    const rotor = wrapper.get('g')
    const initial = path.attributes('d')
    clock.step(0)
    clock.advance(320)
    expect(path.attributes('d')).not.toBe(initial)
    await wrapper.setProps({ paused: true })
    const frozen = path.attributes('d')
    const rotation = rotor.attributes('transform')
    expect(clock.pending()).toBe(0)
    clock.advance(5000)
    await wrapper.setProps({ size: 96, contained: true, label: '正在刷新内容' })
    expect(wrapper.get('svg').element).toBe(svg)
    expect(path.attributes('d')).toBe(frozen)
    expect(rotor.attributes('transform')).toBe(rotation)
    await wrapper.setProps({ paused: false })
    expect(clock.pending()).toBe(1)
    clock.step()
    expect(path.attributes('d')).toBe(frozen)
    expect(rotor.attributes('transform')).toBe(rotation)
    clock.advance(96)
    expect(path.attributes('d')).not.toBe(frozen)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('初始暂停不排帧；系统减少动画使用静态首帧并监听动态切换', async () => {
    const clock = loadingAnimationClock()
    const media = loadingMotionPreference()
    const wrapper = render({ paused: true, label: '加载中' })
    const path = wrapper.get('path')
    const initial = path.attributes('d')
    expect(clock.pending()).toBe(0)
    await wrapper.setProps({ paused: false })
    clock.step(0)
    clock.advance(400)
    const moving = path.attributes('d')
    media.change(true)
    expect(clock.pending()).toBe(0)
    expect(path.attributes('d')).toBe(initial)
    expect(wrapper.get('g').attributes('transform')).toBe('rotate(0.000 50 50)')
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-label')).toBe('加载中')
    media.change(false)
    expect(clock.pending()).toBe(1)
    expect(path.attributes('d')).toBe(moving)
  })

  it('初始减少动画时不启动帧循环', () => {
    const clock = loadingAnimationClock()
    loadingMotionPreference(true)
    const wrapper = render()
    expect(clock.pending()).toBe(0)
    expect(wrapper.get('path').attributes('d')).toMatch(/^M.+Z$/)
  })

  it('页面与可视区域隐藏时停止，卸载清理观察器及监听', () => {
    const clock = loadingAnimationClock()
    const media = loadingMotionPreference()
    const visibility = vi.spyOn(document, 'visibilityState', 'get')
    let target: Element | undefined
    let updateIntersection: ((visible: boolean) => void) | undefined
    const disconnect = vi.fn<() => void>()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          updateIntersection = (visible) =>
            callback(
              [{ target, isIntersecting: visible } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            )
        }
        observe(element: Element) {
          target = element
        }
        disconnect = disconnect
      },
    )
    const remove = vi.spyOn(document, 'removeEventListener')
    const wrapper = render()
    clock.step(0)
    clock.advance(200)
    const frozen = wrapper.get('path').attributes('d')
    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(clock.pending()).toBe(0)
    clock.advance(5000)
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    clock.step()
    expect(wrapper.get('path').attributes('d')).toBe(frozen)
    updateIntersection?.(false)
    expect(clock.pending()).toBe(0)
    updateIntersection?.(true)
    expect(clock.pending()).toBe(1)
    mounted.splice(mounted.indexOf(wrapper), 1)
    wrapper.unmount()
    expect(clock.pending()).toBe(0)
    expect(disconnect).toHaveBeenCalledOnce()
    expect(media.listeners.size).toBe(0)
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(clock.pending()).toBe(0)
  })

  it('KeepAlive 停用时停止，激活保留节点和相位，多实例互不影响', async () => {
    const clock = loadingAnimationClock()
    const visible = ref(true)
    const wrapper = track(
      mount(
        defineComponent({
          setup: () => () =>
            h(KeepAlive, null, {
              default: () => (visible.value ? h(MdvLoadingIndicator) : h('p', '隐藏')),
            }),
        }),
        { attachTo: document.body },
      ),
    )
    const path = wrapper.get('path').element
    clock.step(0)
    clock.advance(240)
    const frozen = path.getAttribute('d')
    visible.value = false
    await nextTick()
    expect(clock.pending()).toBe(0)
    clock.advance(2000)
    visible.value = true
    await nextTick()
    expect(clock.pending()).toBe(1)
    expect(wrapper.get('path').element).toBe(path)
    expect(path.getAttribute('d')).toBe(frozen)
    const other = render({ paused: true })
    const initial = other.get('path').attributes('d')
    clock.step()
    clock.advance(100)
    expect(path.getAttribute('d')).not.toBe(frozen)
    expect(other.get('path').attributes('d')).toBe(initial)
  })
})
