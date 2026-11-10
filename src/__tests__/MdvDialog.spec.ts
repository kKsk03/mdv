import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MdvDialog from '../components/MdvDialog.vue'
import MdvTextField from '../components/MdvTextField.vue'
import type {
  MdvDialogCloseDetail,
  MdvDialogProps,
  MdvDialogSlotProps,
} from '../components/dialog.types'
import { mockDialogPlatform } from './dialog-test-platform'

const mounted: { unmount: () => void }[] = []
let platform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  platform = mockDialogPlatform()
})
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
})

async function settle() {
  await nextTick()
  await flushPromises()
  await nextTick()
}

type DialogSlots = {
  default?: () => VNode[]
  title?: () => VNode[]
  icon?: () => VNode[]
  actions?: (props: MdvDialogSlotProps) => VNode[]
}

function example(
  props: MdvDialogProps = {},
  slots: DialogSlots = {},
  attrs: Record<string, unknown> = {},
) {
  const config = ref(props)
  const visible = ref(props.modelValue ?? false)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h(
          MdvDialog,
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
  return { host, dialog: host.getComponent(MdvDialog), visible, config }
}

function key(element: Element, value: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  element.dispatchEvent(event)
  return event
}

function pointer(element: Element, type: string, id = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
  })
  Object.defineProperty(event, 'pointerId', { value: id })
  element.dispatchEvent(event)
}

describe('MdvDialog', () => {
  it('starts closed without making a non-modal dialog or changing background styles', () => {
    const { dialog } = example({ title: '提醒', description: '正文' })
    expect(dialog.element.tagName).toBe('DIALOG')
    expect(dialog.attributes('open')).toBeUndefined()
    expect(dialog.attributes('role')).toBe('alertdialog')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.find('.mdv-dialog__close').exists()).toBe(false)
    expect(platform.showModal).not.toHaveBeenCalled()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('opens modally, associates names and descriptions, and separates panel styles from native attributes', async () => {
    const { dialog } = example(
      { modelValue: true, title: '默认标题', description: '简短正文' },
      {},
      {
        id: 'test-dialog',
        dir: 'rtl',
        lang: 'zh-CN',
        class: 'custom-panel',
        style: { width: '420px', '--mdv-sys-color-scrim': '#173b31' },
        'data-example': 'native',
        open: true,
      },
    )
    await settle()
    expect(platform.showModal).toHaveBeenCalledTimes(1)
    expect(dialog.attributes()).toMatchObject({
      id: 'test-dialog',
      dir: 'rtl',
      lang: 'zh-CN',
      'data-example': 'native',
    })
    expect(dialog.attributes('aria-labelledby')).toBe(dialog.get('h2').attributes('id'))
    expect(dialog.attributes('aria-describedby')).toBe(
      dialog.get('.mdv-dialog__description').attributes('id'),
    )
    expect(dialog.get('.mdv-dialog__container').classes()).toContain('custom-panel')
    expect(dialog.get<HTMLElement>('.mdv-dialog__container').element.style.width).toBe('420px')
    expect((dialog.element as HTMLElement).style.width).toBe('')
    expect((dialog.element as HTMLElement).style.getPropertyValue('--mdv-sys-color-scrim')).toBe(
      '#173b31',
    )
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(dialog.emitted('open')).toHaveLength(1)
    expect(dialog.emitted('opened')).toHaveLength(1)
  })

  it('keeps title slots named, respects explicit ARIA, and avoids describing complex content as one block', async () => {
    const { dialog } = example(
      { modelValue: true, title: '备用', description: '备用正文' },
      {
        title: () => [h('span', '自定义标题')],
        default: () => [
          h('form', [h('label', { for: 'test-name' }, '姓名'), h('input', { id: 'test-name' })]),
        ],
      },
      {
        role: 'dialog',
        'aria-label': '联系人编辑',
        'aria-describedby': 'outside-help',
      },
    )
    await settle()
    expect(dialog.get('h2').text()).toBe('自定义标题')
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-label')).toBe('联系人编辑')
    expect(dialog.attributes('aria-labelledby')).toBeUndefined()
    expect(dialog.attributes('aria-describedby')).toBe('outside-help')
    expect(dialog.find('.mdv-dialog__description').exists()).toBe(false)
  })

  it('keeps ordinary content and actions stable when its title changes', async () => {
    const { dialog, config } = example(
      { modelValue: true, title: '编辑' },
      {
        icon: () => [h('span', { 'data-icon': '' })],
        default: () => [h('input', { autofocus: true })],
        actions: ({ close }) => [h('button', { onClick: () => close('saved') }, '保存')],
      },
    )
    await settle()
    const input = dialog.get<HTMLInputElement>('input').element
    input.value = '保留输入'
    config.value.title = '编辑资料'
    await settle()
    expect(dialog.get('h2').text()).toBe('编辑资料')
    expect(dialog.get('input').element).toBe(input)
    expect(input.value).toBe('保留输入')
    expect(document.activeElement).toBe(input)
    expect(dialog.findAll('.mdv-dialog__actions')).toHaveLength(1)
    expect(dialog.find('.mdv-dialog__close').exists()).toBe(false)
    expect(dialog.find('.mdv-fullscreen-dialog__container').exists()).toBe(false)
  })

  it('respects autofocus inside a Vue field and restores the original trigger without scrolling it', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = '打开'
    document.body.append(trigger)
    trigger.focus()
    const { dialog, visible } = example(
      { modelValue: true, title: '编辑' },
      {
        default: () => [h(MdvTextField, { label: '名称', autofocus: true })],
      },
    )
    await settle()
    expect(document.activeElement).toBe(dialog.get('input').element)
    visible.value = false
    await settle()
    expect(document.activeElement).toBe(trigger)
    expect(dialog.attributes('open')).toBeUndefined()
    expect(dialog.emitted('close')).toEqual([[{ reason: 'model', returnValue: '' }]])
    expect(dialog.emitted('closed')).toEqual([[{ reason: 'model', returnValue: '' }]])
  })

  it('cycles Tab in both directions while skipping disabled, inert, hidden and closed details content', async () => {
    const { dialog } = example(
      { modelValue: true, title: '焦点' },
      {
        default: () => [
          h('button', { disabled: true }, '禁用'),
          h('div', { hidden: true }, [h('button', '隐藏')]),
          h('div', { inert: true }, [h('button', '惰性')]),
          h('details', [h('summary', { tabindex: 0 }, '详情'), h('button', '未展开')]),
          h('fieldset', { disabled: true }, [h('input')]),
          h('button', { id: 'last-tab' }, '末项'),
        ],
      },
    )
    await settle()
    const first = dialog.get<HTMLElement>('summary').element
    const last = dialog.get<HTMLElement>('#last-tab').element
    expect(document.activeElement).toBe(first)
    expect(key(first, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
    expect(key(last, 'Tab').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
  })

  it('focuses an empty container and redirects attempted focus outside the top modal', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const { dialog } = example({ modelValue: true, title: '只读信息' })
    await settle()
    expect(document.activeElement).toBe(dialog.element)
    expect(key(dialog.element, 'Tab').defaultPrevented).toBe(true)
    outside.focus()
    expect(document.activeElement).toBe(dialog.element)
  })

  it('keeps only the checked radio in a native radio group on the Tab boundary', async () => {
    const { dialog } = example(
      { modelValue: true, title: '选项' },
      {
        default: () => [
          h('input', { type: 'radio', name: 'choice', value: 'a' }),
          h('input', {
            type: 'radio',
            name: 'choice',
            value: 'b',
            checked: true,
          }),
        ],
      },
    )
    await settle()
    const checked = dialog.get<HTMLElement>('input[value="b"]').element
    expect(document.activeElement).toBe(checked)
    expect(key(checked, 'Tab').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(checked)
  })

  it('closes from Escape once and honors disabled dismissal and composing input', async () => {
    const { dialog, visible, config } = example(
      { modelValue: true, title: '编辑', closeOnEsc: false },
      {
        default: () => [h('input', { autofocus: true })],
      },
    )
    await settle()
    const input = dialog.get('input').element
    key(input, 'Escape')
    await settle()
    expect(visible.value).toBe(true)
    config.value.closeOnEsc = true
    await settle()
    key(input, 'Escape', { isComposing: true })
    input.dispatchEvent(new Event('compositionstart', { bubbles: true }))
    key(input, 'Escape')
    await settle()
    expect(visible.value).toBe(true)
    input.dispatchEvent(new Event('compositionend', { bubbles: true }))
    key(input, 'Escape')
    await settle()
    expect(visible.value).toBe(false)
    expect(dialog.emitted('update:modelValue')).toEqual([[false]])
    expect(dialog.emitted('closed')).toEqual([[{ reason: 'escape', returnValue: '' }]])
  })

  it('honors a cancelled native close request and intercepts the platform cancel event', async () => {
    const onCancel = vi.fn<(event: Event) => void>((event) => event.preventDefault())
    const { dialog } = example({ modelValue: true, title: '提醒' }, {}, { onCancel })
    await settle()
    const event = new Event('cancel', { cancelable: true })
    dialog.element.dispatchEvent(event)
    await settle()
    expect(onCancel).toHaveBeenCalledExactlyOnceWith(event)
    expect(event.defaultPrevented).toBe(true)
    expect(dialog.attributes('open')).toBe('')
    expect(dialog.emitted('update:modelValue')).toBeUndefined()
  })

  it('requires both pointer endpoints on the scrim and ignores a cancelled or different pointer', async () => {
    const { dialog, visible, config } = example({
      modelValue: true,
      title: '点击遮罩',
    })
    await settle()
    const panel = dialog.get('.mdv-dialog__container').element
    const scrim = dialog.get('.mdv-dialog__scrim').element
    pointer(panel, 'pointerdown')
    pointer(scrim, 'pointerup')
    pointer(scrim, 'pointerdown')
    pointer(panel, 'pointerup')
    pointer(scrim, 'pointerdown')
    pointer(scrim, 'pointercancel')
    pointer(scrim, 'pointerup')
    pointer(scrim, 'pointerdown', 1)
    pointer(scrim, 'pointerup', 2)
    await settle()
    expect(visible.value).toBe(true)
    config.value.closeOnScrim = false
    await settle()
    pointer(scrim, 'pointerdown')
    pointer(scrim, 'pointerup')
    await settle()
    expect(visible.value).toBe(true)
    config.value.closeOnScrim = true
    await settle()
    pointer(scrim, 'pointerdown')
    pointer(scrim, 'pointerup')
    await settle()
    expect(dialog.emitted('closed')).toEqual([[{ reason: 'scrim', returnValue: '' }]])
  })

  it('uses the same guarded close path for scoped actions and expose', async () => {
    const guard = vi.fn<(detail: Readonly<MdvDialogCloseDetail>) => boolean>(() => false)
    const { dialog, config } = example(
      {
        modelValue: true,
        title: '关闭',
        beforeClose: guard,
      },
      {
        actions: ({ close }) => [h('button', { onClick: () => close('cancel') }, '取消')],
      },
    )
    await settle()
    await dialog.get('.mdv-dialog__actions button').trigger('click')
    await settle()
    expect(guard).toHaveBeenCalledExactlyOnceWith({
      reason: 'action',
      returnValue: 'cancel',
    })
    expect(dialog.attributes('open')).toBe('')
    config.value.beforeClose = undefined
    await settle()
    expect(await dialog.vm.close('done')).toBe(true)
    await settle()
    expect(dialog.emitted('closed')).toEqual([[{ reason: 'action', returnValue: 'done' }]])
  })

  it('merges pending async close requests and closes only after the guard permits it', async () => {
    let permit!: (value: boolean) => void
    const guard = vi.fn<(detail: Readonly<MdvDialogCloseDetail>) => Promise<boolean>>(
      () =>
        new Promise((resolve) => {
          permit = resolve
        }),
    )
    const { dialog, visible } = example({
      modelValue: true,
      title: '异步确认',
      beforeClose: guard,
    })
    await settle()
    const first = dialog.vm.close('saved')
    const second = dialog.vm.close('duplicate')
    await nextTick()
    expect(guard).toHaveBeenCalledExactlyOnceWith({
      reason: 'action',
      returnValue: 'saved',
    })
    expect(visible.value).toBe(true)
    permit(true)
    expect(await first).toBe(true)
    expect(await second).toBe(true)
    await settle()
    expect(dialog.emitted('update:modelValue')).toEqual([[false]])
  })

  it('keeps a guard failure open and invalidates stale results after external close and reopen', async () => {
    const failure = new Error('校验失败')
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { dialog, config, visible } = example({
      modelValue: true,
      title: '失败处理',
      beforeClose: () => Promise.reject(failure),
    })
    await settle()
    expect(await dialog.vm.close()).toBe(false)
    expect(report).toHaveBeenCalledExactlyOnceWith(
      '[MDV] MdvDialog: beforeClose failed; the dialog remains open.',
      failure,
    )
    expect(visible.value).toBe(true)
    let permit!: (value: boolean) => void
    config.value.beforeClose = () =>
      new Promise((resolve) => {
        permit = resolve
      })
    await settle()
    const pending = dialog.vm.close()
    visible.value = false
    await settle()
    visible.value = true
    await settle()
    permit(true)
    expect(await pending).toBe(false)
    expect(visible.value).toBe(true)
    expect(dialog.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps the modal open when its parent rejects a model update', async () => {
    const update = vi.fn<(value: boolean) => void>()
    const dialog = mount(MdvDialog, {
      attachTo: document.body,
      props: { modelValue: true, title: '受控', 'onUpdate:modelValue': update },
    })
    mounted.push(dialog)
    await settle()
    expect(await dialog.vm.close()).toBe(false)
    expect(update).toHaveBeenCalledExactlyOnceWith(false)
    expect(dialog.attributes('open')).toBe('')
    expect(dialog.emitted('close')).toBeUndefined()
  })

  it('does not close ordinary submits and routes method=dialog and submitter overrides through the guard', async () => {
    const ordinary = vi.fn<(event: SubmitEvent) => void>((event) => event.preventDefault())
    const { dialog } = example(
      { modelValue: true, title: '表单' },
      {
        default: () => [
          h('form', { id: 'native-dialog-form', method: 'post', onSubmit: ordinary }, [
            h('input', { required: true }),
          ]),
        ],
        actions: () => [
          h(
            'button',
            {
              type: 'submit',
              form: 'native-dialog-form',
              formmethod: 'dialog',
              value: 'confirmed',
            },
            '确认',
          ),
        ],
      },
    )
    await settle()
    const form = dialog.get<HTMLFormElement>('form').element
    const button = dialog.get<HTMLButtonElement>('.mdv-dialog__actions button').element
    form.dispatchEvent(
      new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: button,
      }),
    )
    await settle()
    expect(ordinary).toHaveBeenCalledTimes(1)
    expect(dialog.attributes('open')).toBe('')
    const other = example(
      { modelValue: true, title: '原生关闭表单' },
      {
        default: () => [
          h('form', { method: 'dialog' }, [h('button', { value: 'accepted' }, '接受')]),
        ],
      },
    )
    await settle()
    const otherForm = other.dialog.get<HTMLFormElement>('form').element
    const otherButton = other.dialog.get<HTMLButtonElement>('button').element
    const event = new SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
      submitter: otherButton,
    })
    otherForm.dispatchEvent(event)
    await settle()
    expect(event.defaultPrevented).toBe(true)
    expect(other.dialog.emitted('closed')).toEqual([[{ reason: 'form', returnValue: 'accepted' }]])
  })

  it('accepts a submitter formmethod=dialog override through external native form association', async () => {
    const guard = vi.fn<(detail: Readonly<MdvDialogCloseDetail>) => boolean>(() => true)
    const { dialog } = example(
      { modelValue: true, title: '按钮覆盖提交方式', beforeClose: guard },
      {
        default: () => [h('form', { id: 'override-method', method: 'post' })],
        actions: () => [
          h(
            'button',
            {
              type: 'submit',
              form: 'override-method',
              formmethod: 'dialog',
              value: 'create',
            },
            '创建',
          ),
        ],
      },
    )
    await settle()
    const form = dialog.get<HTMLFormElement>('form').element
    const button = dialog.get<HTMLButtonElement>('button').element
    expect(button.form).toBe(form)
    form.dispatchEvent(
      new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: button,
      }),
    )
    await settle()
    expect(guard).toHaveBeenCalledExactlyOnceWith({
      reason: 'form',
      returnValue: 'create',
    })
    expect(dialog.emitted('closed')).toEqual([[{ reason: 'form', returnValue: 'create' }]])
  })

  it('retains native input nodes by default and destroys content only after closing when requested', async () => {
    const { dialog, visible, config } = example(
      { modelValue: true, title: '保留草稿' },
      {
        default: () => [h('input')],
      },
    )
    await settle()
    const input = dialog.get<HTMLInputElement>('input').element
    input.value = '内部草稿'
    visible.value = false
    await settle()
    visible.value = true
    await settle()
    expect(dialog.get('input').element).toBe(input)
    expect(input.value).toBe('内部草稿')
    config.value.destroyOnClose = true
    visible.value = false
    await settle()
    expect(dialog.find('input').exists()).toBe(false)
    visible.value = true
    await settle()
    expect(dialog.get('input').element).not.toBe(input)
    expect(dialog.get<HTMLInputElement>('input').element.value).toBe('')
  })

  it('keeps nested dismissal and scroll locks separate and restores focus through both levels', async () => {
    document.documentElement.style.setProperty('overflow', 'auto', 'important')
    document.body.style.setProperty('overflow', 'scroll')
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const parent = example(
      { modelValue: true, title: '编辑' },
      { default: () => [h('button', '打开确认')] },
    )
    await settle()
    const parentButton = parent.dialog.get<HTMLElement>('.mdv-dialog__content button').element
    parentButton.focus()
    const child = example(
      { modelValue: true, title: '确认关闭' },
      {
        actions: ({ close }) => [h('button', { onClick: () => close() }, '返回编辑')],
      },
    )
    await settle()
    key(parentButton, 'Escape')
    await settle()
    expect(parent.visible.value).toBe(true)
    expect(child.visible.value).toBe(true)
    await child.dialog.get('button').trigger('click')
    await settle()
    expect(document.activeElement).toBe(parentButton)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('scroll')
    parent.visible.value = false
    await settle()
    expect(document.activeElement).toBe(trigger)
    expect(document.documentElement.style.getPropertyValue('overflow')).toBe('auto')
    expect(document.documentElement.style.getPropertyPriority('overflow')).toBe('important')
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('locks only the document and preserves the body scrolling context during a modal session', async () => {
    const { visible } = example({ modelValue: true, title: '保留页面布局' })
    await settle()
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.overflowX).toBe('')
    expect(document.body.style.overflowY).toBe('')
    visible.value = false
    await settle()
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.getAttribute('style')).toBeNull()
  })

  it('restores independently configured overflow axes and their priorities after closing', async () => {
    document.documentElement.style.setProperty('overflow-y', 'scroll', 'important')
    document.body.style.setProperty('overflow-x', 'clip')
    const bodyStyle = document.body.getAttribute('style')
    const { visible } = example({ modelValue: true, title: '独立滚动轴' })
    await settle()
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.getAttribute('style')).toBe(bodyStyle)
    visible.value = false
    await settle()
    expect(document.documentElement.style.getPropertyValue('overflow-x')).toBe('')
    expect(document.documentElement.style.getPropertyValue('overflow-y')).toBe('scroll')
    expect(document.documentElement.style.getPropertyPriority('overflow-y')).toBe('important')
    expect(document.body.style.getPropertyValue('overflow-x')).toBe('clip')
    expect(document.body.style.getPropertyValue('overflow-y')).toBe('')
  })

  it('holds modal focus and content through exit, and cancels obsolete transition completion on rapid reopen', async () => {
    platform.enableAnimations()
    const { dialog, visible } = example(
      { modelValue: true, title: '动画', destroyOnClose: true },
      { default: () => [h('input')] },
    )
    await settle()
    expect(dialog.attributes('data-state')).toBe('opening')
    expect(dialog.emitted('opened')).toBeUndefined()
    for (const animation of platform.animations) animation.finish()
    await settle()
    expect(dialog.attributes('data-state')).toBe('open')
    visible.value = false
    await settle()
    expect(dialog.find('input').exists()).toBe(true)
    expect(dialog.attributes('open')).toBe('')
    expect(document.documentElement.style.overflow).toBe('hidden')
    visible.value = true
    await settle()
    for (const animation of platform.animations) animation.finish()
    await settle()
    expect(dialog.attributes('data-state')).toBe('open')
    expect(dialog.emitted('closed')).toBeUndefined()
    visible.value = false
    await settle()
    for (const animation of platform.animations) animation.finish()
    await settle()
    expect(dialog.attributes('open')).toBeUndefined()
    expect(dialog.find('input').exists()).toBe(false)
    expect(dialog.emitted('closed')).toHaveLength(1)
  })

  it('finishes a running transition when reduced motion is enabled and removes active resources on unmount', async () => {
    platform.enableAnimations()
    let permit!: (value: boolean) => void
    const { host, dialog } = example({
      modelValue: true,
      title: '资源清理',
      beforeClose: () =>
        new Promise((resolve) => {
          permit = resolve
        }),
    })
    await settle()
    platform.media('(prefers-reduced-motion: reduce)', true)
    await settle()
    expect(dialog.emitted('opened')).toHaveLength(1)
    const pending = dialog.vm.close()
    host.unmount()
    mounted.splice(mounted.indexOf(host), 1)
    permit(true)
    expect(await pending).toBe(false)
    expect(document.documentElement.style.overflow).toBe('')
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    expect(document.activeElement).toBe(outside)
  })

  it('suspends native modality in KeepAlive and opens again when reactivated', async () => {
    const present = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            KeepAlive,
            {},
            {
              default: () =>
                present.value
                  ? h(MdvDialog, { modelValue: true, title: '缓存' })
                  : h('div', '其他页面'),
            },
          ),
      }),
      { attachTo: document.body },
    )
    mounted.push(host)
    await settle()
    expect(document.documentElement.style.overflow).toBe('hidden')
    present.value = false
    await settle()
    expect(document.documentElement.style.overflow).toBe('')
    present.value = true
    await settle()
    expect(host.get('dialog').attributes('open')).toBe('')
    expect(document.documentElement.style.overflow).toBe('hidden')
  })
})
