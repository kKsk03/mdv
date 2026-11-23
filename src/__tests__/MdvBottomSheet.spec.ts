import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MdvBottomSheet from '../components/MdvBottomSheet.vue'
import MdvBottomSheetScaffold from '../components/MdvBottomSheetScaffold.vue'
import MdvDialog from '../components/MdvDialog.vue'
import type {
  MdvBottomSheetProps,
  MdvBottomSheetSlotProps,
  MdvBottomSheetState,
} from '../components/bottom-sheet.types'
import { mockBottomSheetPlatform, sheetPointer, sheetTouch } from './bottom-sheet-test-platform'

let platform: ReturnType<typeof mockBottomSheetPlatform>
const mounted: { unmount: () => void }[] = []
beforeEach(() => {
  platform = mockBottomSheetPlatform()
})
afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})
async function settle() {
  await nextTick()
  await flushPromises()
  await nextTick()
}
type Slots = {
  default?: () => VNode[]
  actions?: (props: MdvBottomSheetSlotProps) => VNode[]
}
function example(
  props: MdvBottomSheetProps = {},
  slots: Slots = {},
  attrs: Record<string, unknown> = {},
) {
  const config = ref<MdvBottomSheetProps>({
    expandLabel: '展开面板',
    collapseLabel: '收起面板',
    closeLabel: '关闭面板',
    ...props,
  })
  const visible = ref(props.modelValue ?? true)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h(
          MdvBottomSheet,
          {
            ...attrs,
            ...config.value,
            modelValue: visible.value,
            'onUpdate:modelValue': (value: boolean) => {
              visible.value = value
            },
          },
          slots,
        ),
    }),
    { attachTo: document.body },
  )
  mounted.push(host)
  return { host, sheet: host.getComponent(MdvBottomSheet), visible, config }
}
const handle = '[data-mdv-sheet-handle]'
const surface = '.mdv-bottom-sheet__panel'
const content = '.mdv-bottom-sheet__content'

describe('MdvBottomSheet', () => {
  it('opens in the original DOM, associates its name and description and preserves local styling', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const { sheet, visible } = example(
      { title: '分享', description: '选择方式' },
      {},
      {
        dir: 'rtl',
        class: 'custom-sheet',
        style: '--mdv-sys-color-secondary: red',
      },
    )
    await settle()
    const dialog = sheet.element as HTMLDialogElement
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('dir')).toBe('rtl')
    expect(sheet.get('h2').attributes('id')).toBe(dialog.getAttribute('aria-labelledby'))
    expect(sheet.get('.mdv-bottom-sheet__description').attributes('id')).toBe(
      dialog.getAttribute('aria-describedby'),
    )
    expect(sheet.get(surface).classes()).toContain('custom-sheet')
    expect(dialog.style.getPropertyValue('--mdv-sys-color-secondary')).toBe('red')
    expect(platform.height(sheet.get(surface).element)).toBe(400)
    expect(document.activeElement).toBe(sheet.get(handle).element)
    expect(document.documentElement.style.overflow).toBe('hidden')
    visible.value = false
    await settle()
    expect(dialog.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('does not inject accessible labels when callers omit them', async () => {
    const wrapper = mount(MdvBottomSheet, { props: { modelValue: true }, attachTo: document.body })
    mounted.push(wrapper)
    await settle()
    expect(wrapper.get(handle).attributes('aria-label')).toBeUndefined()
  })

  it('merges short-content anchors and reacts to content shrinking without retaining the old height', async () => {
    const { sheet } = example({ title: '短内容' })
    await settle()
    platform.setContentHeight(120)
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(220)
    expect(sheet.get(surface).attributes('data-sheet-state')).toBe('expanded')
    expect(sheet.get(handle).attributes('aria-label')).toBe('关闭面板')
  })

  it('expands and closes from the native handle and reopens at its configured initial height', async () => {
    const { sheet, visible } = example({ title: '高度', closeOnSwipe: false })
    await settle()
    await sheet.get(handle).trigger('click')
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(728)
    expect(sheet.emitted('update:expanded')).toEqual([[true]])
    await sheet.get(handle).trigger('click')
    await settle()
    expect(visible.value).toBe(false)
    expect(sheet.emitted('close')).toEqual([[{ reason: 'handle', returnValue: '' }]])
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'handle', returnValue: '' }]])
    visible.value = true
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(400)
    expect(sheet.emitted('change')).toEqual([
      [{ state: 'expanded', previousState: 'partial', reason: 'handle' }],
      [{ state: 'hidden', previousState: 'expanded', reason: 'handle' }],
      [{ state: 'partial', previousState: 'hidden', reason: 'model' }],
    ])
  })

  it('accepts a controlled expanded model and restores the accepted height when the parent rejects an update', async () => {
    const { sheet, config } = example({ title: '受控', expanded: false })
    await settle()
    expect(await sheet.vm.expand()).toBe(false)
    expect(platform.height(sheet.get(surface).element)).toBe(400)
    config.value.expanded = true
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(728)
    expect(sheet.get(handle).attributes('aria-expanded')).toBe('true')
    expect(await sheet.vm.collapse()).toBe(false)
    expect(platform.height(sheet.get(surface).element)).toBe(728)
  })

  it('supports explicit partial ratios and full-height expansion without adding a close button', async () => {
    const { sheet, config, visible } = example({ title: '高度配置', partial: 0.35 })
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(280)
    expect(sheet.find('button[aria-label="关闭面板"]').exists()).toBe(false)
    config.value.partial = 0.01
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(48)
    config.value.partial = false
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(728)
    expect(sheet.find('.mdv-bottom-sheet__header button').exists()).toBe(false)
    config.value.maxHeight = '100%'
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(800)
    expect(sheet.get(surface).classes()).toContain('mdv-bottom-sheet__panel--full')
    expect(sheet.find('.mdv-bottom-sheet__header button').exists()).toBe(false)
    await sheet.get(handle).trigger('click')
    await settle()
    expect(visible.value).toBe(false)
    expect(sheet.emitted('close')).toEqual([[{ reason: 'handle', returnValue: '' }]])
  })

  it('keeps a keyboard-operable alternative when the handle is hidden and dragging is disabled', async () => {
    const { sheet, config } = example({
      title: '替代操作',
      showHandle: false,
      draggable: false,
      closeOnSwipe: false,
    })
    await settle()
    expect(sheet.find(handle).exists()).toBe(false)
    const button = sheet.get<HTMLButtonElement>('button[aria-label="展开面板"]')
    expect(button.element.type).toBe('button')
    button.element.click()
    await settle()
    expect(sheet.get(surface).attributes('data-sheet-state')).toBe('expanded')
    sheet.get<HTMLButtonElement>('button[aria-label="收起面板"]').element.click()
    await settle()
    expect(sheet.get(surface).attributes('data-sheet-state')).toBe('partial')
    config.value.maxHeight = '100%'
    await settle()
    sheet.get<HTMLButtonElement>('button[aria-label="展开面板"]').element.click()
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(800)
    expect(sheet.find('button[aria-label="关闭面板"]').exists()).toBe(false)
    sheet.get<HTMLButtonElement>('button[aria-label="收起面板"]').element.click()
    await settle()
    expect(sheet.get(surface).attributes('data-sheet-state')).toBe('partial')
    config.value.partial = false
    await settle()
    expect(platform.height(sheet.get(surface).element)).toBe(800)
    expect(sheet.find('.mdv-bottom-sheet__header button').exists()).toBe(false)
    expect(await sheet.vm.close()).toBe(true)
    await settle()
    expect((sheet.element as HTMLDialogElement).open).toBe(false)
  })

  it('releases a drag on window pointerup and cancels a second drag back to the accepted anchor', async () => {
    const { sheet } = example({ title: '手势', closeOnSwipe: false })
    await settle()
    sheetPointer(sheet.get(handle).element, 'pointerdown', 600)
    expect(sheetPointer(window, 'pointermove', 200).defaultPrevented).toBe(true)
    await nextTick()
    expect(sheet.get(surface).classes()).toContain('mdv-bottom-sheet__panel--dragging')
    sheetPointer(window, 'pointerup', 200)
    await settle()
    expect(sheet.get(surface).classes()).not.toContain('mdv-bottom-sheet__panel--dragging')
    expect(platform.height(sheet.get(surface).element)).toBe(728)
    sheetPointer(sheet.get(handle).element, 'pointerdown', 100)
    expect(sheetPointer(window, 'pointermove', 250).defaultPrevented).toBe(true)
    await nextTick()
    expect(sheet.get(surface).classes()).toContain('mdv-bottom-sheet__panel--dragging')
    sheetPointer(window, 'pointercancel', 250)
    await settle()
    expect(sheet.get(surface).classes()).not.toContain('mdv-bottom-sheet__panel--dragging')
    expect(platform.height(sheet.get(surface).element)).toBe(728)
    expect(sheet.emitted('update:expanded')).toEqual([[true]])
  })

  it('deduplicates async close requests, reports swipe origin and rebounds when a guard refuses', async () => {
    let resolve!: (value: boolean) => void
    const beforeClose = vi.fn<() => Promise<boolean>>(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const { sheet, visible } = example({ title: '拦截', beforeClose })
    await settle()
    sheetPointer(sheet.get(handle).element, 'pointerdown', 100)
    sheetPointer(window, 'pointermove', 700)
    sheetPointer(window, 'pointerup', 700)
    const pending = sheet.vm.close()
    expect(beforeClose).toHaveBeenCalledExactlyOnceWith({ reason: 'swipe', returnValue: '' })
    resolve(false)
    expect(await pending).toBe(false)
    await settle()
    expect(visible.value).toBe(true)
    expect(platform.height(sheet.get(surface).element)).toBe(400)
    expect(sheet.emitted('close')).toBeUndefined()
  })

  it('hands touch movement to content after expansion and does not intercept nested controls or horizontal gestures', async () => {
    const { sheet } = example({ title: '触控' }, { default: () => [h('p', '正文'), h('input')] })
    await settle()
    const paragraph = sheet.get('p').element
    sheetTouch(paragraph, 'touchstart', 100, 600)
    expect(sheetTouch(paragraph, 'touchmove', 100, 160).defaultPrevented).toBe(true)
    sheetTouch(paragraph, 'touchend', 100, 160)
    await settle()
    const body = sheet.get<HTMLElement>(content).element
    expect(platform.height(sheet.get(surface).element)).toBe(728)
    expect(body.scrollTop).toBeGreaterThan(0)
    sheetTouch(paragraph, 'touchstart', 100, 200)
    expect(sheetTouch(paragraph, 'touchmove', 100, 300).defaultPrevented).toBe(false)
    sheetTouch(paragraph, 'touchend', 100, 300)
    sheetTouch(sheet.get('input').element, 'touchstart', 100, 200)
    expect(sheetTouch(sheet.get('input').element, 'touchmove', 100, 400).defaultPrevented).toBe(
      false,
    )
    sheetTouch(sheet.get('input').element, 'touchend', 100, 400)
    sheetTouch(paragraph, 'touchstart', 100, 200)
    expect(sheetTouch(paragraph, 'touchmove', 220, 202).defaultPrevented).toBe(false)
    sheetTouch(paragraph, 'touchend', 220, 202)
    expect(sheet.emitted('update:expanded')).toEqual([[true]])
  })

  it('respects escape and scrim policies and supports form return values', async () => {
    const { sheet, visible, config } = example(
      { title: '关闭', closeOnEsc: false, closeOnScrim: false },
      {
        default: () => [h('form', { method: 'dialog' }, [h('button', { value: 'saved' }, '保存')])],
      },
    )
    await settle()
    await sheet.trigger('keydown', { key: 'Escape' })
    sheetPointer(sheet.get('.mdv-bottom-sheet__scrim').element, 'pointerdown', 20)
    sheetPointer(sheet.get('.mdv-bottom-sheet__scrim').element, 'pointerup', 20)
    await settle()
    expect(visible.value).toBe(true)
    config.value.closeOnEsc = true
    const button = sheet.get<HTMLButtonElement>('form button').element
    const event = new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: button })
    sheet.get('form').element.dispatchEvent(event)
    await settle()
    expect(visible.value).toBe(false)
    expect((sheet.element as HTMLDialogElement).returnValue).toBe('saved')
    expect(sheet.emitted('close')).toEqual([[{ reason: 'form', returnValue: 'saved' }]])
  })

  it('retains the parent scroll lock when a nested dialog closes', async () => {
    const child = ref(false)
    const { sheet } = example(
      { title: '父面板' },
      {
        default: () => [
          h(
            'button',
            {
              onClick: () => {
                child.value = true
              },
            },
            '打开子窗口',
          ),
          h(MdvDialog, {
            modelValue: child.value,
            title: '子窗口',
            'onUpdate:modelValue': (value: boolean) => {
              child.value = value
            },
          }),
        ],
      },
    )
    await settle()
    await sheet.get('.mdv-bottom-sheet__body > button').trigger('click')
    await settle()
    expect(sheet.getComponent(MdvDialog).element.hasAttribute('open')).toBe(true)
    await sheet.getComponent(MdvDialog).trigger('keydown', { key: 'Escape' })
    await settle()
    expect(child.value).toBe(false)
    expect((sheet.element as HTMLDialogElement).open).toBe(true)
    expect(document.documentElement.style.overflow).toBe('hidden')
  })

  it('discards stale async approvals after a model-driven close and reopen', async () => {
    let resolve!: (value: boolean) => void
    let resolveNew!: (value: boolean) => void
    const beforeClose = vi
      .fn<() => Promise<boolean>>()
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolveNew = done
          }),
      )
    const { sheet, visible } = example({ title: '异步竞态', beforeClose })
    await settle()
    const oldRequest = sheet.vm.close()
    visible.value = false
    await settle()
    visible.value = true
    await settle()
    const newRequest = sheet.vm.close()
    expect(beforeClose).toHaveBeenCalledTimes(2)
    resolve(true)
    expect(await oldRequest).toBe(false)
    await settle()
    expect(visible.value).toBe(true)
    expect((sheet.element as HTMLDialogElement).open).toBe(true)
    resolveNew(true)
    expect(await newRequest).toBe(true)
    await settle()
    expect(visible.value).toBe(false)
  })

  it('destroys only opted-in content and rebuilds it on reopening', async () => {
    const { sheet, visible } = example(
      { title: '按需销毁', destroyOnClose: true },
      {
        default: () => [h('input', { value: '初始值' })],
      },
    )
    await settle()
    const original = sheet.get<HTMLInputElement>('input').element
    original.value = '未保存草稿'
    visible.value = false
    await settle()
    expect(sheet.find('input').exists()).toBe(false)
    visible.value = true
    await settle()
    expect(sheet.get('input').element).not.toBe(original)
    expect(sheet.get<HTMLInputElement>('input').element.value).toBe('初始值')
  })

  it('releases native modality when kept alive off screen and measures again on activation', async () => {
    const active = ref(true)
    const Page = defineComponent({
      setup: () => () => h(MdvBottomSheet, { modelValue: true, title: '缓存页面' }),
    })
    const Other = defineComponent({ setup: () => () => h('p', '其他页面') })
    const host = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, null, { default: () => h(active.value ? Page : Other) }),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    await settle()
    expect(host.getComponent(MdvBottomSheet).element.hasAttribute('open')).toBe(true)
    active.value = false
    await settle()
    expect(document.documentElement.style.overflow).toBe('')
    platform.setContentHeight(120)
    active.value = true
    await settle()
    const sheet = host.getComponent(MdvBottomSheet)
    expect((sheet.element as HTMLDialogElement).open).toBe(true)
    expect(platform.height(sheet.get(surface).element)).toBe(220)
    expect(platform.showModal).toHaveBeenCalledTimes(2)
  })

  it('prepares initial geometry with reduced motion and removes pointer listeners on unmount', async () => {
    platform.media('(prefers-reduced-motion: reduce)', true)
    const update = vi.fn<(value: boolean) => void>()
    const host = mount(MdvBottomSheet, {
      props: { modelValue: true, title: '减少动态', 'onUpdate:expanded': update },
      attachTo: document.body,
    })
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(400)
    expect(host.get<HTMLElement>(surface).element.style.transform).toBe('translateY(0px)')
    const remove = vi.spyOn(window, 'removeEventListener')
    sheetPointer(host.get(handle).element, 'pointerdown', 600)
    sheetPointer(window, 'pointermove', 200)
    host.unmount()
    sheetPointer(window, 'pointerup', 200)
    await settle()
    expect(update).not.toHaveBeenCalled()
    expect(remove.mock.calls.map(([type]) => type)).toContain('pointermove')
    expect(document.documentElement.style.overflow).toBe('')
  })
})

describe('MdvBottomSheetScaffold', () => {
  it('keeps the handle or replacement control accessible when a requested preview is too small', async () => {
    const host = mount(MdvBottomSheetScaffold, {
      props: {
        title: '小预览',
        peekHeight: 8,
        expandLabel: '展开面板',
        collapseLabel: '收起面板',
        closeLabel: '关闭面板',
      },
      attachTo: document.body,
    })
    mounted.push(host)
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(48)
    expect(host.get(content).attributes('inert')).toBeDefined()
    await host.setProps({ showHandle: false })
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(52)
    expect(host.get(content).attributes('inert')).toBeUndefined()
    await host.setProps({ maxHeight: '100%', hideable: true })
    await settle()
    host.get<HTMLButtonElement>('button[aria-label="展开面板"]').element.click()
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(800)
    expect(host.find('button[aria-label="关闭面板"]').exists()).toBe(false)
    host.get<HTMLButtonElement>('button[aria-label="收起面板"]').element.click()
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(52)
    expect(host.get(surface).attributes('data-sheet-state')).toBe('partial')
    await host.setProps({ peekHeight: 1000 })
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(800)
    expect(host.find('.mdv-bottom-sheet__header button').exists()).toBe(false)
  })

  it('keeps the background interactive and outside the modal stack, while hiding clipped preview content from Tab', async () => {
    const background = vi.fn<() => void>()
    const host = mount(MdvBottomSheetScaffold, {
      props: { title: '地点' },
      slots: {
        default: () => h('button', { id: 'background', onClick: background }, '主页面'),
        sheet: () => h('input', { value: '保留的草稿' }),
      },
      attachTo: document.body,
    })
    mounted.push(host)
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(56)
    expect(host.get(content).attributes('inert')).toBeDefined()
    host.get<HTMLButtonElement>('#background').element.click()
    expect(background).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    expect(document.documentElement.style.overflow).toBe('')
    expect(platform.showModal).not.toHaveBeenCalled()
    await host.get(handle).trigger('click')
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(728)
    expect(host.get(content).attributes('inert')).toBeUndefined()
    expect(host.emitted('update:modelValue')).toEqual([['expanded']])
    await host.get(handle).trigger('click')
    await settle()
    expect(platform.height(host.get(surface).element)).toBe(56)
    expect(host.get('input').element.value).toBe('保留的草稿')
  })

  it('lets code hide and reopen a non-hideable sheet and pairs lifecycle events once per transition', async () => {
    const value = ref<MdvBottomSheetState>('hidden')
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(MdvBottomSheetScaffold, {
            modelValue: value.value,
            title: '程序控制',
            'onUpdate:modelValue': (next: MdvBottomSheetState) => {
              value.value = next
            },
          }),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    const sheet = host.getComponent(MdvBottomSheetScaffold)
    await settle()
    expect(sheet.get(surface).attributes('hidden')).toBeDefined()
    value.value = 'partial'
    await settle()
    expect(sheet.get(surface).attributes('hidden')).toBeUndefined()
    expect(platform.height(sheet.get(surface).element)).toBe(56)
    expect(sheet.emitted('open')).toHaveLength(1)
    expect(sheet.emitted('opened')).toHaveLength(1)
    value.value = 'hidden'
    await settle()
    expect(sheet.get(surface).attributes('hidden')).toBeDefined()
    expect(sheet.emitted('close')).toEqual([[{ reason: 'model', returnValue: '' }]])
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'model', returnValue: '' }]])
  })

  it('rebounds rejected controlled gestures and honors hideable for user requests', async () => {
    const host = mount(MdvBottomSheetScaffold, {
      props: { title: '受控', modelValue: 'partial', peekHeight: 160, hideable: true },
      attachTo: document.body,
    })
    mounted.push(host)
    await settle()
    sheetPointer(host.get(handle).element, 'pointerdown', 200)
    sheetPointer(window, 'pointermove', 600)
    sheetPointer(window, 'pointerup', 600)
    await settle()
    expect(host.emitted('update:modelValue')).toEqual([['hidden']])
    expect(platform.height(host.get(surface).element)).toBe(160)
    expect(host.get(surface).attributes('hidden')).toBeUndefined()
    await host.setProps({ hideable: false })
    sheetPointer(host.get(handle).element, 'pointerdown', 200)
    sheetPointer(window, 'pointermove', 600)
    sheetPointer(window, 'pointerup', 600)
    await settle()
    expect(host.emitted('update:modelValue')).toEqual([['hidden'], ['partial']])
    expect(platform.height(host.get(surface).element)).toBe(160)
  })

  it('settles a cached layout at the latest model after an interrupted animation', async () => {
    platform.enableAnimations()
    const active = ref(true)
    const value = ref<MdvBottomSheetState>('partial')
    const Page = defineComponent({
      setup: () => () => h(MdvBottomSheetScaffold, { modelValue: value.value, title: '缓存布局' }),
    })
    const Other = defineComponent({ setup: () => () => h('p', '其他页面') })
    const host = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, null, { default: () => h(active.value ? Page : Other) }),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    await settle()
    value.value = 'expanded'
    await settle()
    active.value = false
    await settle()
    value.value = 'hidden'
    await settle()
    active.value = true
    await settle()
    platform.animations.forEach((animation) => animation.finish())
    await settle()
    const sheet = host.getComponent(MdvBottomSheetScaffold)
    expect(sheet.get(surface).attributes('hidden')).toBeDefined()
    expect(sheet.emitted('opened')).toHaveLength(1)
    expect(sheet.emitted('closed')).toHaveLength(1)
    expect(document.documentElement.style.overflow).toBe('')
  })
})
