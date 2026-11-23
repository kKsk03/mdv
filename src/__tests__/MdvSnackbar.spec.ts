import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import MdvDialog from '../components/MdvDialog.vue'
import MdvSnackbar from '../components/MdvSnackbar.vue'
import MdvSnackbarProvider from '../components/MdvSnackbarProvider.vue'
import { useSnackbar } from '../components/use-snackbar'
import type { MdvSnackbarProps, MdvSnackbarProviderApi } from '../components/snackbar.types'
import { mockMenuPlatform } from './menu-test-platform'

const mounted: { unmount: () => void }[] = []
let platform: ReturnType<typeof mockMenuPlatform>

beforeEach(() => {
  platform = mockMenuPlatform()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queueMicrotask(() => callback(performance.now()))
    return 1
  })
})

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  Reflect.deleteProperty(document, 'visibilityState')
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

async function settle() {
  await nextTick()
  await flushPromises()
  await nextTick()
}

function timers() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
}

function key(target: Element, value: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}

function example(
  props: MdvSnackbarProps = {},
  accept = true,
  onAction?: (event: MouseEvent) => void,
) {
  const visible = ref(props.modelValue ?? true)
  const config = ref<MdvSnackbarProps>({ closeLabel: '关闭通知', ...props })
  const host = mount(
    defineComponent({
      setup: () => () =>
        h('main', [
          h('button', { 'data-origin': '' }, '来源'),
          h(MdvSnackbar, {
            ...config.value,
            modelValue: visible.value,
            onAction,
            'onUpdate:modelValue': (value: boolean) => {
              if (accept) visible.value = value
            },
          }),
        ]),
    }),
    { attachTo: document.body, global: { stubs: { transition: false } } },
  )
  mounted.push(host)
  return { host, visible, config, snackbar: host.getComponent(MdvSnackbar) }
}

function provider() {
  let api!: MdvSnackbarProviderApi
  const consumer = defineComponent({
    setup() {
      api = useSnackbar()
      return () => h('button', '触发入口')
    },
  })
  const host = mount(
    defineComponent({
      setup: () => () => h(MdvSnackbarProvider, null, { default: () => h(consumer) }),
    }),
    { attachTo: document.body, global: { stubs: { transition: false } } },
  )
  mounted.push(host)
  return { host, api }
}

describe('MdvSnackbar', () => {
  it.each(['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'info'] as const)(
    'uses the local %s theme roles for the surface, text and action',
    async (color) => {
      const { host } = example({
        message: '状态消息',
        color,
        action: { label: '查看' },
        closable: true,
      })
      await settle()
      const panel = host.get<HTMLElement>('.mdv-snackbar-positioner')
      const style = panel.element.style
      expect(style.getPropertyValue('--mdv-snackbar-surface')).toBe(`var(--mdv-sys-color-${color})`)
      expect(style.getPropertyValue('--mdv-snackbar-foreground')).toBe(
        `var(--mdv-sys-color-on-${color})`,
      )
      expect(style.getPropertyValue('--mdv-snackbar-action')).toBe(
        `var(--mdv-sys-color-on-${color})`,
      )
      expect(panel.attributes('color')).toBeUndefined()
      expect(host.get('[role="status"]').text()).toBe('状态消息')
      expect(host.get('.mdv-snackbar__action-button').text()).toBe('查看')
      expect(host.get('.mdv-snackbar__close').attributes('aria-label')).toBe('关闭通知')
    },
  )

  it('updates seed colors and restores the default without changing the timer or global theme', async () => {
    timers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const themeStyle = document.documentElement.getAttribute('style')
    const { host, config, visible } = example({ message: '已保存', color: 'success' })
    await settle()
    const style = host.get<HTMLElement>('.mdv-snackbar-positioner').element.style
    await vi.advanceTimersByTimeAsync(1000)

    config.value = { ...config.value, color: '#06C' }
    await settle()
    expect(style.getPropertyValue('--mdv-snackbar-surface')).toContain('light-dark(')
    expect(style.getPropertyValue('--mdv-snackbar-foreground')).toContain('light-dark(')
    expect(style.getPropertyValue('--mdv-snackbar-action')).toBe(
      style.getPropertyValue('--mdv-snackbar-foreground'),
    )

    config.value = { ...config.value, color: '#invalid' }
    await settle()
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('[MDV] MdvSnackbar: unsupported color'),
    )
    expect(style.getPropertyValue('--mdv-snackbar-surface')).toBe('')
    expect(style.getPropertyValue('--mdv-snackbar-foreground')).toBe('')
    expect(style.getPropertyValue('--mdv-snackbar-action')).toBe('')

    config.value = { ...config.value, color: 'error' }
    await settle()
    expect(style.getPropertyValue('--mdv-snackbar-surface')).toBe('var(--mdv-sys-color-error)')
    config.value = { ...config.value, color: undefined }
    await settle()
    expect(style.getPropertyValue('--mdv-snackbar-surface')).toBe('')
    expect(document.documentElement.getAttribute('style')).toBe(themeStyle)
    await vi.advanceTimersByTimeAsync(2999)
    expect(visible.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(visible.value).toBe(false)
  })

  it('preserves explicit user styles when a color is supplied', async () => {
    const host = mount(MdvSnackbar, {
      props: { modelValue: true, message: '消息', color: 'success', duration: 0 },
      attrs: { style: { '--mdv-snackbar-surface': '#123456', width: '240px' } },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    })
    mounted.push(host)
    await settle()
    const style = host.get<HTMLElement>('.mdv-snackbar-positioner').element.style
    expect(style.getPropertyValue('--mdv-snackbar-surface')).toBe('#123456')
    expect(style.getPropertyValue('--mdv-snackbar-foreground')).toBe(
      'var(--mdv-sys-color-on-success)',
    )
    expect(style.width).toBe('240px')
  })

  it('announces a simple message and starts the default timer after entering', async () => {
    timers()
    const { host, snackbar, visible } = example({ message: '已保存' })
    await settle()
    expect(host.get('[role="status"]').text()).toBe('已保存')
    expect(host.get('[role="status"]').attributes('aria-live')).toBe('polite')
    expect(host.find('.mdv-snackbar__close').exists()).toBe(false)
    expect(snackbar.emitted('opened')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(3999)
    expect(visible.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(visible.value).toBe(false)
    expect(snackbar.emitted('close')).toEqual([[{ reason: 'timeout' }]])
    expect(snackbar.emitted('closed')).toEqual([[{ reason: 'timeout' }]])
  })

  it('keeps actionable messages open by default and derives the close button from duration', async () => {
    timers()
    const { host, config, visible } = example({ message: '已删除', action: { label: '撤销' } })
    await settle()
    expect(host.get('.mdv-snackbar__close').attributes('aria-label')).toBe('关闭通知')
    await vi.advanceTimersByTimeAsync(10000)
    expect(visible.value).toBe(true)
    config.value = { ...config.value, closable: false, duration: 500 }
    await settle()
    expect(host.find('.mdv-snackbar__close').exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(500)
    await settle()
    expect(visible.value).toBe(false)
  })

  it('preserves the remaining duration across hover, focus, hidden page and manual pauses', async () => {
    timers()
    const { host, snackbar, visible } = example({ message: '同步完成', closable: true })
    await settle()
    const panel = host.get<HTMLElement>('.mdv-snackbar-positioner').element
    const close = host.get<HTMLButtonElement>('.mdv-snackbar__close').element
    await vi.advanceTimersByTimeAsync(1000)
    panel.dispatchEvent(new Event('pointerenter'))
    await vi.advanceTimersByTimeAsync(5000)
    panel.dispatchEvent(new Event('pointerleave'))
    close.focus()
    await vi.advanceTimersByTimeAsync(5000)
    host.get<HTMLButtonElement>('[data-origin]').element.focus()
    await nextTick()
    snackbar.vm.pause()
    await vi.advanceTimersByTimeAsync(5000)
    snackbar.vm.resume()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(5000)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(2999)
    expect(visible.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(visible.value).toBe(false)
  })

  it('lets the parent reject a close request without hiding the message', async () => {
    const { host, snackbar, visible } = example({ message: '需要确认', duration: 0 }, false)
    await settle()
    await host.get('.mdv-snackbar__close').trigger('click')
    await settle()
    expect(snackbar.emitted('update:modelValue')).toEqual([[false]])
    expect(snackbar.emitted('close')).toBeUndefined()
    expect(visible.value).toBe(true)
    expect(host.find('[role="status"]').exists()).toBe(true)
  })

  it('focuses on Alt+G and consumes Escape only while focus is inside', async () => {
    const { host, snackbar, visible } = example({ message: '可撤销', action: { label: '撤销' } })
    await settle()
    const origin = host.get<HTMLButtonElement>('[data-origin]').element
    origin.focus()
    expect(key(origin, 'Escape').defaultPrevented).toBe(false)
    expect(visible.value).toBe(true)
    expect(key(origin, 'g', { altKey: true }).defaultPrevented).toBe(true)
    const action = host.get<HTMLButtonElement>('.mdv-snackbar__action-button').element
    expect(document.activeElement).toBe(action)
    expect(key(action, 'Escape').defaultPrevented).toBe(true)
    await settle()
    expect(visible.value).toBe(false)
    expect(snackbar.emitted('closed')).toEqual([[{ reason: 'escape' }]])
    expect(document.activeElement).toBe(origin)
  })

  it('waits for an asynchronous action and closes after it succeeds', async () => {
    let resolve!: () => void
    const action = vi.fn<() => Promise<void>>(
      () =>
        new Promise<void>((done) => {
          resolve = done
        }),
    )
    const { host, snackbar, visible } = example({
      message: '已归档',
      action: { label: '撤销', onClick: action },
    })
    await settle()
    await host.get('.mdv-snackbar__action-button').trigger('click')
    expect(action).toHaveBeenCalledOnce()
    expect(host.get<HTMLButtonElement>('.mdv-snackbar__action-button').element.disabled).toBe(true)
    expect(visible.value).toBe(true)
    resolve()
    await settle()
    expect(visible.value).toBe(false)
    expect(snackbar.emitted('close')).toEqual([[{ reason: 'action' }]])
  })

  it('keeps an asynchronous action pending when equivalent options are recreated', async () => {
    let resolve!: () => void
    const action = () =>
      new Promise<void>((done) => {
        resolve = done
      })
    const { host, config, snackbar, visible } = example({
      message: '已归档',
      action: { label: '撤销', onClick: action },
    })
    await settle()
    await host.get('.mdv-snackbar__action-button').trigger('click')
    config.value = { ...config.value, action: { label: '撤销', onClick: action } }
    await settle()
    expect(host.get<HTMLButtonElement>('.mdv-snackbar__action-button').element.disabled).toBe(true)
    resolve()
    await settle()
    expect(visible.value).toBe(false)
    expect(snackbar.emitted('close')).toEqual([[{ reason: 'action' }]])
  })

  it('keeps the message open on action failure and ignores stale asynchronous results', async () => {
    let reject!: (error: Error) => void
    let resolve!: () => void
    const first = () =>
      new Promise<void>((_done, fail) => {
        reject = fail
      })
    const second = () =>
      new Promise<void>((done) => {
        resolve = done
      })
    const { host, snackbar, config, visible } = example({
      message: '第一条',
      action: { label: '重试', onClick: first },
    })
    await settle()
    await host.get('.mdv-snackbar__action-button').trigger('click')
    const error = new Error('网络错误')
    reject(error)
    await settle()
    expect(snackbar.emitted('actionError')).toEqual([[error]])
    expect(visible.value).toBe(true)
    config.value = { message: '第二条', action: { label: '撤销', onClick: second } }
    await settle()
    await host.get('.mdv-snackbar__action-button').trigger('click')
    config.value = { message: '更新后的消息', action: { label: '完成' } }
    await settle()
    resolve()
    await settle()
    expect(visible.value).toBe(true)
    expect(host.get('[role="status"]').text()).toBe('更新后的消息')
  })

  it('allows a synchronous action listener to prevent automatic closing', async () => {
    const { host, snackbar, visible } = example(
      { message: '文件已删除', action: { label: '撤销' } },
      true,
      (event) => event.preventDefault(),
    )
    await settle()
    await host.get('.mdv-snackbar__action-button').trigger('click')
    await settle()
    expect(visible.value).toBe(true)
    expect(snackbar.emitted('action')).toHaveLength(1)
  })

  it('pauses a page message behind a dialog and lets a local message handle Escape first', async () => {
    timers()
    const dialogOpen = ref(false)
    const pageOpen = ref(true)
    const localOpen = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h(MdvSnackbar, {
              modelValue: pageOpen.value,
              message: '页面消息',
              'onUpdate:modelValue': (value: boolean) => {
                pageOpen.value = value
              },
            }),
            h(
              MdvDialog,
              {
                modelValue: dialogOpen.value,
                title: '对话框',
                'onUpdate:modelValue': (value: boolean) => {
                  dialogOpen.value = value
                },
              },
              {
                default: () =>
                  h(MdvSnackbar, {
                    modelValue: localOpen.value,
                    message: '局部消息',
                    duration: 0,
                    'onUpdate:modelValue': (value: boolean) => {
                      localOpen.value = value
                    },
                  }),
              },
            ),
          ]),
      }),
      { attachTo: document.body, global: { stubs: { transition: false } } },
    )
    mounted.push(host)
    await settle()
    await vi.advanceTimersByTimeAsync(1000)
    dialogOpen.value = true
    await settle()
    const panels = host.findAll<HTMLElement>('.mdv-snackbar-positioner')
    expect(panels[0]?.attributes('data-blocked')).toBe('')
    expect(panels[1]?.attributes('data-blocked')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(5000)
    expect(pageOpen.value).toBe(true)
    const localClose = host.get<HTMLButtonElement>('dialog .mdv-snackbar__close').element
    localClose.focus()
    key(localClose, 'Escape')
    await settle()
    expect(localOpen.value).toBe(false)
    expect(dialogOpen.value).toBe(true)
    dialogOpen.value = false
    await settle()
    await vi.advanceTimersByTimeAsync(2999)
    expect(pageOpen.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(pageOpen.value).toBe(false)
  })

  it('pauses when kept alive but deactivated and cleans up on unmount', async () => {
    timers()
    const active = ref(true)
    const visible = ref(true)
    const child = defineComponent({
      setup: () => () =>
        h(MdvSnackbar, {
          modelValue: visible.value,
          message: '缓存内容',
          'onUpdate:modelValue': (value: boolean) => {
            visible.value = value
          },
        }),
    })
    const host = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, null, { default: () => (active.value ? h(child) : null) }),
      }),
      {
        attachTo: document.body,
        global: { stubs: { transition: false } },
      },
    )
    mounted.push(host)
    await settle()
    await vi.advanceTimersByTimeAsync(1000)
    active.value = false
    await settle()
    await vi.advanceTimersByTimeAsync(5000)
    expect(visible.value).toBe(true)
    active.value = true
    await settle()
    await vi.advanceTimersByTimeAsync(3000)
    await settle()
    expect(visible.value).toBe(false)
    host.unmount()
    mounted.splice(mounted.indexOf(host), 1)
    expect(platform.opened.size).toBe(0)
  })
})

describe('MdvSnackbarProvider', () => {
  it('updates the colors of current and queued messages through show and update', async () => {
    const { host, api } = provider()
    const first = api.show({ key: 'color', message: '当前消息', color: 'success', duration: 0 })
    const second = api.show({ message: '等待中的消息', color: 'warning', duration: 0 })
    await settle()
    const style = () => host.get<HTMLElement>('.mdv-snackbar-positioner').element.style
    expect(style().getPropertyValue('--mdv-snackbar-surface')).toBe('var(--mdv-sys-color-success)')

    expect(api.show({ key: 'color', message: '当前消息', color: 'info' })).toBe(first)
    expect(api.update(second, { color: 'error' })).toBe(true)
    await settle()
    expect(style().getPropertyValue('--mdv-snackbar-surface')).toBe('var(--mdv-sys-color-info)')

    expect(api.update(first, { color: '#006C4C' })).toBe(true)
    await settle()
    expect(style().getPropertyValue('--mdv-snackbar-surface')).toContain('light-dark(')
    expect(api.close(first)).toBe(true)
    await settle()
    expect(host.get('[role="status"]').text()).toBe('等待中的消息')
    expect(style().getPropertyValue('--mdv-snackbar-surface')).toBe('var(--mdv-sys-color-error)')

    expect(api.update(second, { color: undefined })).toBe(true)
    await settle()
    expect(style().getPropertyValue('--mdv-snackbar-surface')).toBe('')
  })

  it('advances a FIFO queue after exit, updates by key and can remove waiting items', async () => {
    const { host, api } = provider()
    const first = api.show({ key: 'sync', message: '第一条', duration: 0 })
    const second = api.show({ message: '第二条', duration: 0 })
    const third = api.show({ message: '第三条', duration: 0 })
    expect(api.show({ key: 'sync', message: '第一条已更新', duration: 0 })).toBe(first)
    expect(api.update(third, { message: '第三条已更新' })).toBe(true)
    expect(api.close(second)).toBe(true)
    await settle()
    expect(host.get('[role="status"]').text()).toBe('第一条已更新')
    expect(api.close(first)).toBe(true)
    await settle()
    expect(host.get('[role="status"]').text()).toBe('第三条已更新')
    api.clear()
    await settle()
    expect(host.find('[role="status"]').exists()).toBe(false)
    expect(api.update('不存在', { message: '忽略' })).toBe(false)
    expect(api.close('不存在')).toBe(false)
  })

  it('advances when a message is closed before its component starts', async () => {
    const { host, api } = provider()
    const first = api.show({ message: '未开始', duration: 0 })
    api.show({ message: '后续消息', duration: 0 })
    api.close(first)
    await settle()
    expect(host.get('[role="status"]').text()).toBe('后续消息')
  })
})
