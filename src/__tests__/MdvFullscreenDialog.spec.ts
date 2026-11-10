import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MdvDialog from '../components/MdvDialog.vue'
import MdvFullscreenDialog from '../components/MdvFullscreenDialog.vue'
import type {
  MdvDialogCloseDetail,
  MdvDialogSlotProps,
  MdvFullscreenDialogProps,
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

function example(
  props: MdvFullscreenDialogProps = {},
  slots: {
    default?: () => VNode[]
    actions?: (props: MdvDialogSlotProps) => VNode[]
    footer?: (props: MdvDialogSlotProps) => VNode[]
  } = {},
) {
  const config = ref(props)
  const visible = ref(props.modelValue ?? false)
  const host = mount(
    defineComponent({
      setup: () => () =>
        h(
          MdvFullscreenDialog,
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
  return { host, dialog: host.getComponent(MdvFullscreenDialog), config, visible }
}

describe('MdvFullscreenDialog', () => {
  it('renders a dedicated full-screen structure with an accessible close action and persistent content', async () => {
    const { dialog, config } = example(
      { modelValue: true, title: '新建行程' },
      {
        default: () => [h('input', { autofocus: true })],
        actions: ({ close }) => [h('button', { onClick: () => close('saved') }, '保存')],
        footer: ({ close }) => [h('button', { onClick: () => close() }, '取消')],
      },
    )
    await settle()
    expect(platform.showModal).toHaveBeenCalledTimes(1)
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-labelledby')).toBe(dialog.get('h2').attributes('id'))
    expect(dialog.get('.mdv-fullscreen-dialog__close').attributes('aria-label')).toBe('关闭对话框')
    expect(
      dialog.get('.mdv-fullscreen-dialog__header .mdv-fullscreen-dialog__actions').text(),
    ).toBe('保存')
    expect(dialog.get('.mdv-fullscreen-dialog__footer').text()).toBe('取消')
    expect(dialog.find('.mdv-dialog__surface').exists()).toBe(false)
    const input = dialog.get<HTMLInputElement>('input').element
    input.value = '行程草稿'
    config.value.title = '修改行程'
    await settle()
    expect(dialog.get('input').element).toBe(input)
    expect(input.value).toBe('行程草稿')
    expect(document.activeElement).toBe(input)
  })

  it('routes its X and footer through the shared close guard and exposes the accepted result', async () => {
    const guard = vi.fn<(detail: Readonly<MdvDialogCloseDetail>) => boolean>(() => false)
    const { dialog, config } = example(
      { modelValue: true, title: '编辑', closeLabel: '退出编辑', beforeClose: guard },
      { footer: ({ close }) => [h('button', { onClick: () => close('cancel') }, '取消')] },
    )
    await settle()
    expect(dialog.get('.mdv-fullscreen-dialog__close').attributes('aria-label')).toBe('退出编辑')
    await dialog.get('.mdv-fullscreen-dialog__close').trigger('click')
    await settle()
    expect(guard).toHaveBeenCalledExactlyOnceWith({ reason: 'close-button', returnValue: '' })
    expect(dialog.attributes('open')).toBe('')
    config.value.beforeClose = undefined
    await settle()
    await dialog.get('.mdv-fullscreen-dialog__footer button').trigger('click')
    await settle()
    expect(dialog.emitted('closed')).toEqual([[{ reason: 'action', returnValue: 'cancel' }]])
  })

  it('allows hiding only the full-screen X and keeps exposed close available', async () => {
    const { dialog } = example({
      modelValue: true,
      title: '保存中',
      closable: false,
      closeOnEsc: false,
    })
    await settle()
    expect(dialog.find('.mdv-fullscreen-dialog__close').exists()).toBe(false)
    dialog.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(dialog.attributes('open')).toBe('')
    expect(await dialog.vm.close('done')).toBe(true)
    await settle()
    expect(dialog.emitted('closed')).toEqual([[{ reason: 'action', returnValue: 'done' }]])
  })

  it('shares the modal stack with an ordinary confirmation and restores focus and document scroll in order', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const confirm = ref(false)
    const { host, dialog, visible } = example(
      { modelValue: true, title: '全屏编辑' },
      {
        default: () => [
          h(
            'button',
            {
              id: 'open-confirm',
              onClick: () => {
                confirm.value = true
              },
            },
            '关闭编辑',
          ),
          h(
            MdvDialog,
            {
              modelValue: confirm.value,
              title: '放弃修改？',
              'onUpdate:modelValue': (value: boolean) => {
                confirm.value = value
              },
            },
            {
              actions: ({ close }: MdvDialogSlotProps) =>
                h('button', { onClick: () => close() }, '继续编辑'),
            },
          ),
        ],
      },
    )
    await settle()
    const opener = dialog.get<HTMLButtonElement>('#open-confirm').element
    opener.focus()
    opener.click()
    await settle()
    const child = host.getComponent(MdvDialog)
    expect(child.attributes('open')).toBe('')
    expect(document.body.style.overflow).toBe('')
    await child.get('button').trigger('click')
    await settle()
    expect(document.activeElement).toBe(opener)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(dialog.attributes('open')).toBe('')
    visible.value = false
    await settle()
    expect(document.activeElement).toBe(trigger)
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
  })
})
