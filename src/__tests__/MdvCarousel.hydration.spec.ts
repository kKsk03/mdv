import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import type { VNode } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCarousel from '../components/MdvCarousel.vue'
import MdvTextField from '../components/MdvTextField.vue'
import { mockCarouselPlatform } from './carousel-test-platform'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Carousel hydration', () => {
  it('复用条目与输入节点，保留预 hydration 草稿、稳定 ID 和外部焦点', async () => {
    const update = vi.fn<(value: string | number) => void>()
    const Example = defineComponent({
      render: () =>
        h('div', [
          h('button', { id: 'outside' }, '外部'),
          h(
            MdvCarousel,
            { items: [{ key: 'draft' }, { key: 'other' }], variant: 'uncontained' },
            {
              // 输入组件负责接纳挂载前编辑，Carousel 负责复用内容和保持几何更新独立。
              item: () =>
                h(MdvTextField, {
                  label: '备注',
                  modelValue: '初始草稿',
                  'onUpdate:modelValue': update,
                }),
            },
          ),
        ]),
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector('input')!
    const track = host.querySelector('.mdv-carousel__track')!
    const ids = [input.id, track.id]
    const outside = host.querySelector<HTMLButtonElement>('#outside')!
    input.value = '挂载前编辑'
    outside.focus()
    const platform = mockCarouselPlatform()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('input')).toBe(input)
      expect(input.value).toBe('挂载前编辑')
      expect(update).toHaveBeenCalledExactlyOnceWith('挂载前编辑')
      expect(host.querySelector('.mdv-carousel__track')).toBe(track)
      expect([input.id, track.id]).toEqual(ids)
      expect(document.activeElement).toBe(outside)
      for (const reduced of [false, true]) {
        platform.resize(reduced ? 420 : 280)
        platform.reduce(reduced)
        await flushPromises()
        expect(host.querySelector('input')).toBe(input)
        expect(input.value).toBe('挂载前编辑')
        expect([input.id, track.id]).toEqual(ids)
        expect(document.activeElement).toBe(outside)
      }
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      host.remove()
    }
  })

  it('测量和动效偏好不重绘原生输入插槽，业务更新仍可写入受控 value', async () => {
    const value = ref('业务初值')
    const renderItem = vi.fn<() => VNode[]>(() => [h('input', { value: value.value })])
    const Example = defineComponent({
      render: () =>
        h('div', [
          h('button', { id: 'outside' }, '外部'),
          h(
            MdvCarousel,
            { items: [{ key: 'draft' }], variant: 'uncontained' },
            { item: renderItem },
          ),
        ]),
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp(Example))
    document.body.append(host)
    const input = host.querySelector('input')!
    const outside = host.querySelector<HTMLButtonElement>('#outside')!
    const platform = mockCarouselPlatform()
    const app = createSSRApp(Example)
    try {
      app.mount(host)
      await flushPromises()
      expect(host.querySelector('input')).toBe(input)
      expect(input.value).toBe('业务初值')
      const renderCount = renderItem.mock.calls.length
      input.value = '尚未提交的 DOM 草稿'
      input.setSelectionRange(1, 4)
      outside.focus()
      platform.resize(280)
      platform.reduce(false)
      await flushPromises()
      expect(renderItem).toHaveBeenCalledTimes(renderCount)
      expect(input.value).toBe('尚未提交的 DOM 草稿')
      expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4])
      expect(document.activeElement).toBe(outside)
      value.value = '业务更新'
      await flushPromises()
      expect(host.querySelector('input')).toBe(input)
      expect(input.value).toBe('业务更新')
      expect(document.activeElement).toBe(outside)
    } finally {
      app.unmount()
      host.remove()
    }
  })
})
