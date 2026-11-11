import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MdvSideSheet from '../components/MdvSideSheet.vue'
import MdvSideSheetScaffold from '../components/MdvSideSheetScaffold.vue'
import MdvDialog from '../components/MdvDialog.vue'
import type {
  MdvSideSheetProps,
  MdvSideSheetScaffoldProps,
  MdvSideSheetSlotProps,
} from '../components/side-sheet.types'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
const mounted: { unmount: () => void }[] = []
beforeEach(() => {
  platform = mockDialogPlatform()
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
const surface = '.mdv-side-sheet__panel'
const edge = '.mdv-side-sheet__edge'
type Slots = {
  default?: () => VNode[]
  sheet?: (props: MdvSideSheetSlotProps) => VNode[]
  header?: (props: MdvSideSheetSlotProps) => VNode[]
  actions?: (props: MdvSideSheetSlotProps) => VNode[]
}
function example(
  props: MdvSideSheetProps = {},
  slots: Slots = {},
  attrs: Record<string, unknown> = {},
) {
  const visible = ref(props.modelValue ?? true)
  const config = ref(props)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h(
          MdvSideSheet,
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
  return { host, sheet: host.getComponent(MdvSideSheet), visible, config }
}
function standard(props: MdvSideSheetScaffoldProps = {}, slots: Slots = {}) {
  const visible = ref(props.modelValue ?? true)
  const config = ref(props)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h(
          MdvSideSheetScaffold,
          {
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
  return { host, sheet: host.getComponent(MdvSideSheetScaffold), visible, config }
}
function pointer(target: EventTarget, type: string, x: number, y = 100, id = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  })
  Object.defineProperty(event, 'pointerId', { value: id })
  target.dispatchEvent(event)
  return event
}
function geometry(element: Element) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    right: 320,
    top: 0,
    bottom: 600,
    width: 320,
    height: 600,
    toJSON: () => ({}),
  })
}

describe('MdvSideSheet', () => {
  it('keeps its panel visible without playing animation when reduced motion is requested', async () => {
    platform.enableAnimations()
    platform.media('(prefers-reduced-motion: reduce)', true)
    const { sheet, visible } = example()
    await settle()
    expect(sheet.attributes('data-state')).toBe('open')
    expect((sheet.get(surface).element as HTMLElement).style.transform).toBe('translateX(0%)')
    expect((sheet.get('.mdv-side-sheet__scrim').element as HTMLElement).style.opacity).toBe('1')
    expect(platform.animations).toHaveLength(0)
    visible.value = false
    await settle()
    expect((sheet.element as HTMLDialogElement).open).toBe(false)
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('uses the original DOM and names its modal, while preserving local theme and panel attributes', async () => {
    const { sheet } = example(
      {
        title: '文件详情',
        description: '更多信息',
        detached: true,
        placement: 'start',
        width: '360px',
      },
      {},
      {
        class: 'custom-sheet',
        dir: 'rtl',
        style: '--mdv-sys-color-primary: red',
      },
    )
    await settle()
    const dialog = sheet.element as HTMLDialogElement
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe(sheet.get('h2').attributes('id'))
    expect(dialog.getAttribute('aria-describedby')).toBe(
      sheet.get('.mdv-side-sheet__description').attributes('id'),
    )
    expect(dialog.getAttribute('dir')).toBe('rtl')
    expect(dialog.style.getPropertyValue('--mdv-sys-color-primary')).toBe('red')
    expect(sheet.get(surface).classes()).toContain('custom-sheet')
    expect(sheet.get(surface).attributes('style')).toContain('360px')
    expect(sheet.classes()).toContain('mdv-side-sheet--detached')
    expect(sheet.attributes('data-placement')).toBe('start')
    expect(document.querySelectorAll('dialog')).toHaveLength(1)
    expect(document.documentElement.style.overflow).toBe('hidden')
  })

  it('keeps the close control without a title or when a custom heading is used, and treats back as intent', async () => {
    const { sheet, visible } = example({
      showBack: true,
      backLabel: '返回详情',
      closeLabel: '收起详情',
    })
    await settle()
    expect(sheet.attributes('aria-label')).toBe('侧边面板')
    await sheet.get('button[aria-label="返回详情"]').trigger('click')
    expect(sheet.emitted('back')).toHaveLength(1)
    expect(visible.value).toBe(true)
    await sheet.get('button[aria-label="收起详情"]').trigger('click')
    await settle()
    expect(visible.value).toBe(false)
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'close-button', returnValue: '' }]])
    const custom = example({}, { header: () => [h('strong', '自定义标题')] })
    await settle()
    expect(custom.sheet.get('.mdv-side-sheet__heading').text()).toBe('自定义标题')
    expect(custom.sheet.find('button[aria-label="关闭面板"]').exists()).toBe(true)
  })

  it('focuses autofocus content, traps Tab and restores the trigger after Escape', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const { sheet } = example(
      {},
      { default: () => [h('input', { autofocus: true }), h('button', { id: 'last' }, '最后')] },
    )
    await settle()
    const input = sheet.get('input').element
    expect(document.activeElement).toBe(input)
    const last = sheet.get<HTMLButtonElement>('#last')
    last.element.focus()
    await last.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(sheet.get('.mdv-side-sheet__close').element)
    await sheet.trigger('keydown', { key: 'Escape' })
    await settle()
    expect(document.activeElement).toBe(trigger)
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('requires a complete outside pointer activation and respects Escape and scrim switches', async () => {
    const { sheet, config, visible } = example({ closeOnScrim: false, closeOnEsc: false })
    await settle()
    const scrim = sheet.get('.mdv-side-sheet__scrim').element
    pointer(scrim, 'pointerdown', 0)
    pointer(scrim, 'pointerup', 0)
    await sheet.trigger('keydown', { key: 'Escape' })
    await settle()
    expect(visible.value).toBe(true)
    config.value.closeOnScrim = true
    await settle()
    pointer(sheet.get(surface).element, 'pointerdown', 0)
    pointer(scrim, 'pointerup', 0)
    await settle()
    expect(visible.value).toBe(true)
    pointer(scrim, 'pointerdown', 0)
    pointer(scrim, 'pointerup', 0)
    await settle()
    expect(visible.value).toBe(false)
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'scrim', returnValue: '' }]])
  })

  it('preserves a rejected controlled model and forwards the native dialog form result', async () => {
    const rejected = mount(MdvSideSheet, { attachTo: document.body, props: { modelValue: true } })
    mounted.push(rejected)
    await settle()
    expect(await rejected.vm.close('try')).toBe(false)
    expect((rejected.element as HTMLDialogElement).open).toBe(true)
    rejected.unmount()
    mounted.pop()
    const { sheet } = example(
      {},
      {
        default: () => [h('form', { method: 'dialog' }, [h('button', { value: 'saved' }, '保存')])],
      },
    )
    await settle()
    const form = sheet.get('form').element
    form.dispatchEvent(
      new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: sheet.get<HTMLButtonElement>('form button').element,
      }),
    )
    await settle()
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'form', returnValue: 'saved' }]])
  })

  it('coalesces asynchronous close requests and ignores a stale guard after reopening', async () => {
    let resolve!: (allowed: boolean) => void
    const guard = vi.fn<() => Promise<boolean>>(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const { sheet, visible } = example({ beforeClose: guard })
    await settle()
    const pending = sheet.vm.close('save')
    const repeated = sheet.vm.close('again')
    expect(guard).toHaveBeenCalledTimes(1)
    visible.value = false
    await settle()
    visible.value = true
    await settle()
    resolve(true)
    expect(await pending).toBe(false)
    expect(await repeated).toBe(false)
    expect(visible.value).toBe(true)
    expect((sheet.element as HTMLDialogElement).open).toBe(true)
  })

  it('dismisses from the inner edge on window pointerup and cleans listeners after unmount', async () => {
    const { sheet, host, visible } = example()
    await settle()
    geometry(sheet.get(surface).element)
    pointer(sheet.get(edge).element, 'pointerdown', 100)
    const move = pointer(window, 'pointermove', 270)
    await nextTick()
    expect(move.defaultPrevented).toBe(true)
    expect(sheet.get(surface).classes()).toContain('mdv-side-sheet__panel--dragging')
    pointer(window, 'pointerup', 270)
    await settle()
    expect(visible.value).toBe(false)
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'swipe', returnValue: '' }]])
    visible.value = true
    await settle()
    geometry(sheet.get(surface).element)
    pointer(sheet.get(edge).element, 'pointerdown', 100)
    host.unmount()
    mounted.pop()
    expect(pointer(window, 'pointermove', 300).defaultPrevented).toBe(false)
    pointer(window, 'pointerup', 300)
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('cancels vertical gestures, cancelled pointers and denied swipes without intercepting body controls', async () => {
    const guard = vi.fn<() => boolean>(() => false)
    const { sheet, visible, config } = example(
      { beforeClose: guard },
      { default: () => [h('input')] },
    )
    await settle()
    geometry(sheet.get(surface).element)
    pointer(sheet.get('input').element, 'pointerdown', 100)
    expect(pointer(window, 'pointermove', 300).defaultPrevented).toBe(false)
    pointer(sheet.get(edge).element, 'pointerdown', 100)
    expect(pointer(window, 'pointermove', 102, 200).defaultPrevented).toBe(false)
    pointer(sheet.get(edge).element, 'pointerdown', 100)
    pointer(window, 'pointermove', 260)
    pointer(window, 'pointercancel', 260)
    await settle()
    expect(sheet.get(surface).classes()).not.toContain('mdv-side-sheet__panel--dragging')
    expect(guard).not.toHaveBeenCalled()
    pointer(sheet.get(edge).element, 'pointerdown', 100)
    pointer(window, 'pointermove', 280)
    pointer(window, 'pointerup', 280)
    await settle()
    expect(guard).toHaveBeenCalledWith({ reason: 'swipe', returnValue: '' })
    expect(visible.value).toBe(true)
    expect((sheet.get(surface).element as HTMLElement).style.transform).toBe('translateX(0%)')
    config.value.closeOnSwipe = false
    await settle()
    expect(sheet.find(edge).exists()).toBe(false)
  })

  it('mirrors edge dismissal for a start placement and retains nested modal focus and locks', async () => {
    const { sheet, visible } = example({ placement: 'start' })
    await settle()
    geometry(sheet.get(surface).element)
    pointer(sheet.get(edge).element, 'pointerdown', 280)
    pointer(window, 'pointermove', 100)
    pointer(window, 'pointerup', 100)
    await settle()
    expect(visible.value).toBe(false)
    const nested = ref(false)
    const parent = example(
      {},
      { default: () => [h(MdvDialog, { modelValue: nested.value, title: '确认' })] },
    )
    await settle()
    nested.value = true
    await settle()
    expect(document.querySelectorAll('dialog[open]')).toHaveLength(2)
    expect(await parent.sheet.vm.close()).toBe(false)
    expect(document.documentElement.style.overflow).toBe('hidden')
    parent.host.unmount()
    mounted.pop()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('destroys content only after closing and suspends the modal when kept alive', async () => {
    const first = example({ destroyOnClose: true }, { default: () => [h('input')] })
    await settle()
    first.visible.value = false
    await settle()
    expect(first.sheet.find('input').exists()).toBe(false)
    const active = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () =>
              active.value ? h(MdvSideSheet, { modelValue: true, title: '缓存面板' }) : h('div'),
          }),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    await settle()
    expect(document.documentElement.style.overflow).toBe('hidden')
    active.value = false
    await settle()
    expect(document.documentElement.style.overflow).toBe('')
    active.value = true
    await settle()
    expect(document.querySelector('dialog[open]')).not.toBeNull()
    expect(document.documentElement.style.overflow).toBe('hidden')
  })
})

describe('MdvSideSheetScaffold', () => {
  it('cancels a pending exit when reopened and destroys content only after the final exit', async () => {
    platform.enableAnimations()
    const { sheet, visible } = standard(
      { destroyOnClose: true },
      { sheet: () => [h('input', { value: '草稿' })] },
    )
    await settle()
    const input = sheet.get('input').element
    visible.value = false
    await settle()
    expect(sheet.attributes('data-state')).toBe('closing')
    expect(sheet.get('input').element).toBe(input)
    visible.value = true
    await settle()
    expect(sheet.attributes('data-state')).toBe('open')
    expect(sheet.get('input').element).toBe(input)
    visible.value = false
    await settle()
    for (const animation of platform.animations) animation.finish()
    await settle()
    expect(sheet.attributes('data-state')).toBe('closed')
    expect(sheet.find('input').exists()).toBe(false)
    expect(sheet.emitted('closed')).toHaveLength(1)
  })

  it('ignores stale asynchronous guards after a programmatic close and reopen', async () => {
    let resolve!: (allowed: boolean) => void
    const guard = vi.fn<() => Promise<boolean>>(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const { sheet, visible } = standard({ beforeClose: guard })
    await settle()
    const pending = sheet.vm.close('save')
    void sheet.vm.close('again')
    expect(guard).toHaveBeenCalledTimes(1)
    visible.value = false
    await settle()
    visible.value = true
    await settle()
    resolve(true)
    expect(await pending).toBe(false)
    expect(visible.value).toBe(true)
    expect(sheet.get(surface).attributes('inert')).toBeUndefined()
  })

  it('keeps the page interactive, has a nonmodal dialog name and reserves only the sheet track', async () => {
    const { sheet, visible } = standard(
      { title: '详情' },
      { default: () => [h('button', '主页面')], sheet: () => [h('input')] },
    )
    await settle()
    expect(platform.showModal).not.toHaveBeenCalled()
    expect(document.documentElement.style.overflow).toBe('')
    expect(sheet.get(surface).attributes('role')).toBe('dialog')
    expect(sheet.get(surface).attributes('aria-modal')).toBeUndefined()
    expect(sheet.get(surface).attributes('aria-labelledby')).toBe(sheet.get('h2').attributes('id'))
    const background = sheet.get<HTMLButtonElement>('.mdv-side-sheet-scaffold__main button')
    background.element.focus()
    await sheet.get('input').trigger('keydown', { key: 'Escape' })
    expect(visible.value).toBe(true)
    expect(document.activeElement).toBe(background.element)
    expect(sheet.get('.mdv-side-sheet-scaffold__track').attributes('style')).toContain(
      '--mdv-side-sheet-extent',
    )
    visible.value = false
    await settle()
    expect(sheet.get('.mdv-side-sheet-scaffold__track').attributes('hidden')).toBeDefined()
    expect(sheet.get(surface).attributes('inert')).toBeDefined()
    expect(sheet.get(surface).attributes('aria-hidden')).toBe('true')
  })

  it('does not steal focus when opening and restores it only if the sheet contained focus', async () => {
    const { sheet, visible } = standard(
      { modelValue: false },
      { default: () => [h('button', '打开')], sheet: () => [h('input')] },
    )
    const trigger = sheet.get<HTMLButtonElement>('.mdv-side-sheet-scaffold__main button')
    trigger.element.focus()
    visible.value = true
    await settle()
    expect(document.activeElement).toBe(trigger.element)
    sheet.get<HTMLInputElement>('input').element.focus()
    expect(await sheet.vm.close()).toBe(true)
    await settle()
    expect(document.activeElement).toBe(trigger.element)
    visible.value = true
    await settle()
    trigger.element.focus()
    visible.value = false
    await settle()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('preserves slots and drafts across changes and allows back without closing', async () => {
    const { sheet, visible, config } = standard(
      { showBack: true },
      {
        sheet: () => [h('input', { value: '草稿' })],
        header: () => [h('strong', '标题')],
        actions: ({ close }) => [h('button', { onClick: () => close('saved') }, '保存')],
      },
    )
    await settle()
    const input = sheet.get('input').element
    await sheet.get('.mdv-side-sheet__back').trigger('click')
    expect(visible.value).toBe(true)
    expect(sheet.emitted('back')).toHaveLength(1)
    config.value = {
      ...config.value,
      placement: 'start',
      detached: true,
      width: '400px',
      dividers: true,
    }
    await settle()
    expect(sheet.get('input').element).toBe(input)
    await sheet.get('.mdv-side-sheet__actions button').trigger('click')
    await settle()
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'action', returnValue: 'saved' }]])
    visible.value = true
    await settle()
    expect(sheet.get('input').element).toBe(input)
    expect(sheet.get(surface).attributes('inert')).toBeUndefined()
    expect(sheet.attributes('data-placement')).toBe('start')
  })

  it('guards close requests, supports explicit focus and discards destroyed content', async () => {
    const beforeClose = vi.fn<() => boolean>(() => false)
    const { sheet, config, visible } = standard(
      { beforeClose, destroyOnClose: true },
      { sheet: () => [h('input')] },
    )
    await settle()
    sheet.vm.focus()
    expect(document.activeElement).toBe(sheet.get(surface).element)
    expect(await sheet.vm.close()).toBe(false)
    expect(visible.value).toBe(true)
    config.value.beforeClose = () => true
    await settle()
    expect(await sheet.vm.close('done')).toBe(true)
    await settle()
    expect(sheet.find(surface).exists()).toBe(false)
    expect(sheet.emitted('closed')).toEqual([[{ reason: 'action', returnValue: 'done' }]])
    visible.value = true
    await settle()
    expect(sheet.find('input').exists()).toBe(true)
  })
})
