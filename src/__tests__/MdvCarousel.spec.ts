import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, ref } from 'vue'
import MdvCarousel from '../components/MdvCarousel.vue'
import type { MdvCarouselExpose, MdvCarouselKey } from '../components/carousel.types'
import { mockCarouselPlatform } from './carousel-test-platform'

const items = ['a', 'b', 'c', 'd', 'e', 'f'].map((key) => ({
  key,
  label: `照片 ${key}`,
  src: `${key}.svg`,
}))
const wrappers: VueWrapper[] = []
let platform: ReturnType<typeof mockCarouselPlatform>
function track<T extends VueWrapper>(wrapper: T) {
  wrappers.push(wrapper)
  return wrapper
}
function api(wrapper: VueWrapper) {
  return wrapper.vm as unknown as MdvCarouselExpose
}
function item(wrapper: VueWrapper, index: number) {
  return wrapper.get<HTMLElement>(`[data-carousel-index="${index}"]`)
}
async function pointer(target: EventTarget, type: string, x: number, y = 20) {
  const event = new MouseEvent(type, {
    button: 0,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  })
  Object.defineProperties(event, {
    pointerId: { value: 7 },
    pointerType: { value: 'mouse' },
    isPrimary: { value: true },
  })
  target.dispatchEvent(event)
  await flushPromises()
}
beforeEach(() => {
  platform = mockCarouselPlatform()
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Carousel key 模型、动态列表与事件', () => {
  it('非受控默认首项，初始化不发出更新，导航发出稳定 key', async () => {
    const wrapper = track(mount(MdvCarousel, { props: { items }, attachTo: document.body }))
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('[data-active]').element).toBe(item(wrapper, 0).element)
    expect(await api(wrapper).next({ animate: false })).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(wrapper.emitted('change')).toEqual([
      [{ key: 'b', index: 1, item: items[1], reason: 'programmatic' }],
    ])
    expect(item(wrapper, 1).attributes('data-active')).toBe('true')
    expect(await api(wrapper).scrollTo('missing')).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })
  it('受控拒绝保持已接受锚点，接受后才发 change', async () => {
    const update = vi.fn<(key: MdvCarouselKey | null) => void>()
    const wrapper = track(
      mount(MdvCarousel, {
        props: { items, modelValue: 'a', 'onUpdate:modelValue': update },
        attachTo: document.body,
      }),
    )
    await flushPromises()
    expect(await api(wrapper).scrollTo('d', { animate: false })).toBe(false)
    expect(update).toHaveBeenCalledExactlyOnceWith('d')
    expect(wrapper.attributes('data-current-key')).toBe('a')
    expect(item(wrapper, 0).attributes('data-active')).toBe('true')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({
      'onUpdate:modelValue': (key) => {
        void wrapper.setProps({ modelValue: key })
      },
    })
    expect(await api(wrapper).scrollTo('d', { animate: false })).toBe(true)
    expect(wrapper.attributes('data-current-key')).toBe('d')
    expect(wrapper.emitted('change')).toHaveLength(1)
  })
  it('重排按 key 保留组件与 DOM 身份，当前项不变', async () => {
    const wrapper = track(
      mount(MdvCarousel, { props: { items, modelValue: 'c' }, attachTo: document.body }),
    )
    await flushPromises()
    const node = item(wrapper, 2).element
    await wrapper.setProps({
      items: [items[2]!, items[0]!, items[5]!, items[1]!, items[3]!, items[4]!],
    })
    expect(item(wrapper, 0).element).toBe(node)
    expect(node.dataset.active).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
  it('删除当前项会请求相邻 key；父级拒绝时不伪造替代 active', async () => {
    const wrapper = track(
      mount(MdvCarousel, { props: { items, modelValue: 'b' }, attachTo: document.body }),
    )
    await flushPromises()
    await wrapper.setProps({ items: items.filter((entry) => entry.key !== 'b') })
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    expect(wrapper.attributes('data-current-key')).toBe('b')
    expect(wrapper.find('[data-active]').exists()).toBe(false)
  })
  it('空列表加入项目后建立内部首项；清空后没有虚构 active', async () => {
    const wrapper = track(mount(MdvCarousel, { props: { items: [] as typeof items } }))
    await flushPromises()
    expect(wrapper.text()).toContain('暂无内容')
    expect(wrapper.find('[data-carousel-index]').exists()).toBe(false)
    await wrapper.setProps({ items: items.slice(0, 2) })
    await flushPromises()
    expect(wrapper.attributes('data-current-key')).toBe('a')
    await wrapper.setProps({ items: [] })
    await flushPromises()
    expect(wrapper.find('[data-active]').exists()).toBe(false)
    const updates = wrapper.emitted('update:modelValue') ?? []
    expect(updates[updates.length - 1]).toEqual([null])
  })
  it('业务字段 key 为数字零时也可导航', async () => {
    const wrapper = track(
      mount(MdvCarousel<{ id: number }>, {
        props: { items: [{ id: 0 }, { id: 1 }], itemKey: 'id' },
      }),
    )
    await flushPromises()
    expect(wrapper.attributes('data-current-key')).toBe('0')
    expect(await api(wrapper).scrollTo(1, { animate: false })).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[1]])
  })
  it('当前焦点项保持在遮罩层级最上方', async () => {
    const wrapper = track(
      mount(MdvCarousel, {
        props: { items, modelValue: 'c' },
        attachTo: document.body,
      }),
    )
    await flushPromises()
    const focalZ = Number(item(wrapper, 2).element.style.zIndex)
    expect(focalZ).toBeGreaterThan(0)
    for (const index of [0, 1, 3, 4, 5])
      expect(Number(item(wrapper, index).element.style.zIndex)).toBeLessThan(focalZ)
  })
  it('默认操作用 type=button，禁用链接不导航，也不发 itemClick', async () => {
    const wrapper = track(
      mount(MdvCarousel, {
        props: {
          items: [{ key: 'disabled', href: '/hidden', disabled: true, label: '不可用' }, ...items],
        },
      }),
    )
    await flushPromises()
    expect(item(wrapper, 1).get('button').attributes('type')).toBe('button')
    const link = item(wrapper, 0).get('a')
    expect(link.attributes('href')).toBeUndefined()
    expect(link.attributes('aria-disabled')).toBe('true')
    await link.trigger('click')
    expect(wrapper.emitted('itemClick')).toBeUndefined()
  })
})

describe('Carousel 键盘、焦点与嵌套内容', () => {
  it('容器没有 Tab 停点，方向键和 Tab 显露下一项，End 后能离开', async () => {
    const wrapper = track(
      mount(MdvCarousel, { props: { items, 'aria-label': '相册' }, attachTo: document.body }),
    )
    await flushPromises()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBe('相册')
    const first = item(wrapper, 0).get<HTMLButtonElement>('button')
    first.element.focus()
    await first.trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(document.activeElement).toBe(item(wrapper, 1).get('button').element)
    await item(wrapper, 1).get('button').trigger('keydown', { key: 'Tab' })
    await flushPromises()
    expect(document.activeElement).toBe(item(wrapper, 2).get('button').element)
    await item(wrapper, 2).get('button').trigger('keydown', { key: 'End' })
    await flushPromises()
    expect(document.activeElement).toBe(item(wrapper, 5).get('button').element)
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    document.activeElement!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
  it('RTL 使用左方向键前进；resize 保留当前 key 和焦点', async () => {
    const wrapper = track(
      mount(MdvCarousel, { props: { items, dir: 'rtl' }, attachTo: document.body }),
    )
    await flushPromises()
    item(wrapper, 0).get<HTMLButtonElement>('button').element.focus()
    await item(wrapper, 0).get('button').trigger('keydown', { key: 'ArrowLeft' })
    await flushPromises()
    const focused = document.activeElement
    platform.resize(700)
    await flushPromises()
    expect(wrapper.attributes('data-current-key')).toBe('b')
    expect(document.activeElement).toBe(focused)
  })
  it('输入框保留方向键；Tab 在卡片内部先走控件，再移至下一项', async () => {
    const wrapper = track(
      mount(MdvCarousel, {
        props: { items, variant: 'uncontained', itemSize: 280 },
        attachTo: document.body,
        slots: {
          item: ({ index }: { index: number }) => [
            h('input', { value: `草稿 ${index}` }),
            h('button', { type: 'button' }, '保存'),
          ],
        },
      }),
    )
    await flushPromises()
    const input = item(wrapper, 0).get<HTMLInputElement>('input')
    input.element.focus()
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    input.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    input.element.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
    const button = item(wrapper, 0).get<HTMLButtonElement>('button')
    button.element.focus()
    await button.trigger('keydown', { key: 'Tab' })
    await flushPromises()
    expect(document.activeElement).toBe(item(wrapper, 1).get('input').element)
    expect(wrapper.find('button button').exists()).toBe(false)
  })
  it('不在挂载时抢焦点；跳过链接移动到轮播后方', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    const wrapper = track(mount(MdvCarousel, { props: { items }, attachTo: document.body }))
    await flushPromises()
    expect(document.activeElement).toBe(outside)
    await wrapper.get('.mdv-carousel__skip').trigger('click')
    expect(document.activeElement).toBe(wrapper.get('.mdv-carousel__end').element)
  })
})

describe('Carousel 手势、滚轮与资源清理', () => {
  it('主轴拖动后取消恢复原位置和原 user-select，不提交 key', async () => {
    const wrapper = track(mount(MdvCarousel, { props: { items }, attachTo: document.body }))
    await flushPromises()
    const surface = wrapper.get<HTMLElement>('.mdv-carousel__track').element
    surface.style.setProperty('user-select', 'text', 'important')
    const initial = item(wrapper, 0).element.style.transform
    await pointer(surface, 'pointerdown', 300)
    await pointer(window, 'pointermove', 290)
    await pointer(window, 'pointermove', 100)
    platform.frames()
    expect(item(wrapper, 0).element.style.transform).not.toBe(initial)
    await pointer(window, 'pointercancel', 100)
    expect(item(wrapper, 0).element.style.transform).toBe(initial)
    expect(surface.style.getPropertyValue('user-select')).toBe('text')
    expect(surface.style.getPropertyPriority('user-select')).toBe('important')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
  it('纵向手势不接管横向轮播；普通竖滚轮与 Ctrl 缩放不被阻止', async () => {
    const wrapper = track(mount(MdvCarousel, { props: { items } }))
    await flushPromises()
    const surface = wrapper.get('.mdv-carousel__track').element
    await pointer(surface, 'pointerdown', 200)
    await pointer(window, 'pointermove', 202, 100)
    expect(surface.hasAttribute('data-dragging')).toBe(false)
    for (const init of [{ deltaY: 100 }, { deltaX: 100, ctrlKey: true }]) {
      const event = new WheelEvent('wheel', { ...init, cancelable: true, bubbles: true })
      surface.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
  it('Uncontained 接受自由滚动的锚点时不强行吸附，端点继续放行', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = track(
      mount(MdvCarousel, { props: { items, variant: 'uncontained', itemSize: 180 } }),
    )
    await flushPromises()
    const surface = wrapper.get('.mdv-carousel__track').element
    surface.dispatchEvent(new WheelEvent('wheel', { deltaX: 115, cancelable: true, bubbles: true }))
    platform.frames()
    const transform = item(wrapper, 0).element.style.transform
    await vi.advanceTimersByTimeAsync(130)
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(item(wrapper, 0).element.style.transform).toBe(transform)
    await api(wrapper).scrollTo('f', { animate: false })
    const edge = new WheelEvent('wheel', { deltaX: 100, cancelable: true, bubbles: true })
    surface.dispatchEvent(edge)
    expect(edge.defaultPrevented).toBe(false)
  })
  it('系统减弱动画动态切换后保留 key，并清理旧 rAF', async () => {
    const wrapper = track(
      mount(MdvCarousel, { props: { items, variant: 'hero', modelValue: 'c' } }),
    )
    await flushPromises()
    platform.reduce(false)
    await flushPromises()
    expect(wrapper.classes()).not.toContain('mdv-carousel--reduced')
    await wrapper.setProps({ modelValue: 'e' })
    platform.frames(2)
    platform.reduce(true)
    await flushPromises()
    expect(wrapper.classes()).toContain('mdv-carousel--reduced')
    expect(wrapper.attributes('data-current-key')).toBe('e')
    expect(platform.pendingFrames()).toBe(0)
  })
  it('KeepAlive 停用清理动画和观察器，恢复后重新测量', async () => {
    const show = ref(true)
    const Example = defineComponent({
      setup: () => () =>
        h(KeepAlive, () => (show.value ? h(MdvCarousel, { items }) : h('div', '已暂停'))),
    })
    const wrapper = track(mount(Example, { attachTo: document.body }))
    await flushPromises()
    expect(platform.connectedObservers()).toBe(1)
    show.value = false
    await flushPromises()
    expect(platform.connectedObservers()).toBe(0)
    expect(platform.pendingFrames()).toBe(0)
    show.value = true
    await flushPromises()
    expect(platform.connectedObservers()).toBe(1)
    expect(wrapper.find('.mdv-carousel--ready').exists()).toBe(true)
  })
})
