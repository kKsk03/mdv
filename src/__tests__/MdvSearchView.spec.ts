import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import MdvSearchView from '../components/MdvSearchView.vue'
import MdvList from '../components/MdvList.vue'
import MdvListItem from '../components/MdvListItem.vue'
import MdvDialog from '../components/MdvDialog.vue'
import type { MdvSearchSlotProps, MdvSearchTriggerSlotProps } from '../components/search.types'
import { mockDialogPlatform } from './dialog-test-platform'

const hosts = new Set<{ unmount(): void }>()
let platform: ReturnType<typeof mockDialogPlatform>
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(async () => {
  for (const host of hosts) host.unmount()
  hosts.clear()
  await flushPromises()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

function suggestionList() {
  return h(MdvList, null, {
    default: () => [
      h(MdvListItem, { headline: '旅行', interactive: true }),
      h(MdvListItem, { headline: '不可用', interactive: true, disabled: true }),
      h(MdvListItem, { headline: '设计', interactive: true }),
    ],
  })
}

describe('MdvSearchView', () => {
  it('preserves the focus source when opening the separate query input', async () => {
    const wrapper = mount(MdvSearchView, {
      props: { layout: 'fullscreen' },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    const entry = wrapper.get<HTMLInputElement>('.mdv-search-view__entry input').element
    entry.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    entry.focus()
    await flushPromises()
    const input = wrapper.get<HTMLInputElement>('dialog input').element
    expect(document.activeElement).toBe(input)
    expect(wrapper.get('.mdv-search-dialog__field').classes()).not.toContain(
      'mdv-search-bar--keyboard-focus',
    )
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(document.activeElement).toBe(entry)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await wrapper.vm.open()
    await flushPromises()
    expect(document.activeElement).toBe(input)
    expect(wrapper.get('.mdv-search-dialog__field').classes()).toContain(
      'mdv-search-bar--keyboard-focus',
    )
  })

  it('clears a closed entry without opening the search view', async () => {
    const wrapper = mount(MdvSearchView, {
      props: { modelValue: '旅行', layout: 'fullscreen' },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    await wrapper.get('.mdv-search-view__entry button[aria-label="清空搜索"]').trigger('click')
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('.mdv-search-view__entry input').element.value).toBe('')
    expect(document.activeElement).toBe(wrapper.get('.mdv-search-view__entry input').element)
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('opens from input focus, keeps exactly one successful form field, submits and restores without reopening', async () => {
    const query = ref('草稿')
    const closedFocus: (Element | null)[] = []
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(
              MdvSearchView,
              {
                modelValue: query.value,
                'onUpdate:modelValue': (value: string) => {
                  query.value = value
                },
                layout: 'fullscreen',
                inputAttrs: { name: 'q' },
                onClosed: () => closedFocus.push(document.activeElement),
              },
              { default: suggestionList },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    hosts.add(host)
    const search = host.getComponent(MdvSearchView)
    const entry = host.get<HTMLInputElement>('.mdv-search-view__entry input').element
    const result = host.get<HTMLElement>('.mdv-search-dialog__results').element
    entry.focus()
    await flushPromises()
    const input = host.get<HTMLInputElement>('dialog input')
    expect(host.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(document.activeElement).toBe(input.element)
    await input.setValue('旅行')
    expect(new FormData(host.element as HTMLFormElement).getAll('q')).toEqual(['旅行'])
    await input.trigger('keydown', { key: 'Enter' })
    expect(search.emitted('search')?.[0]?.[0]).toBe('旅行')
    expect(document.activeElement).toBe(result)
    await host.get('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(host.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    expect(entry.disabled).toBe(false)
    expect(document.activeElement).toBe(entry)
    expect(closedFocus).toEqual([entry])
    expect(query.value).toBe('旅行')
    expect(new FormData(host.element as HTMLFormElement).getAll('q')).toEqual(['旅行'])
    expect(search.emitted('open')).toHaveLength(1)
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('cancels a pending close when the parent immediately reopens and restores focus after the accepted close', async () => {
    const expanded = ref(false)
    let reopen = true
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(MdvSearchView, {
            open: expanded.value,
            'onUpdate:open': (value: boolean) => {
              expanded.value = value
            },
            layout: 'fullscreen',
            onClose: () => {
              if (reopen) expanded.value = true
            },
          }),
      }),
      { attachTo: document.body },
    )
    hosts.add(host)
    const search = host.getComponent(MdvSearchView)
    const entry = host.get<HTMLInputElement>('.mdv-search-view__entry input').element
    entry.focus()
    await flushPromises()
    const input = host.get<HTMLInputElement>('dialog input').element
    expanded.value = false
    await flushPromises()
    expect(expanded.value).toBe(true)
    expect(host.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(document.activeElement).toBe(input)
    expect(search.emitted('closed')).toBeUndefined()
    expect(document.documentElement.style.overflow).toBe('hidden')
    reopen = false
    expanded.value = false
    await flushPromises()
    expect(host.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    expect(document.activeElement).toBe(entry)
    expect(search.emitted('closed')).toEqual([[{ reason: 'model' }]])
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('keeps closed when the parent refuses opening, then retains modal focus if closing is refused', async () => {
    const requested = vi.fn<(value: boolean) => void>()
    const wrapper = mount(MdvSearchView, {
      props: { open: false, 'onUpdate:open': requested, layout: 'fullscreen' },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    const entry = wrapper.get<HTMLInputElement>('.mdv-search-view__entry input').element
    entry.focus()
    await flushPromises()
    expect(requested).toHaveBeenCalledWith(true)
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    expect(document.activeElement).toBe(entry)
    await wrapper.setProps({ open: true })
    await flushPromises()
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(requested).toHaveBeenCalledWith(false)
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('dialog input').element)
  })

  it('resets the query only once while the retained entry is inactive', async () => {
    const query = ref('初始查询')
    const update = vi.fn<(value: string) => void>((value) => {
      query.value = value
    })
    const host = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(MdvSearchView, {
              modelValue: query.value,
              'onUpdate:modelValue': update,
              inputAttrs: { name: 'q' },
              layout: 'fullscreen',
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    hosts.add(host)
    await host.getComponent(MdvSearchView).vm.open()
    await flushPromises()
    await host.get('dialog input').setValue('新查询')
    update.mockClear()
    host.get<HTMLFormElement>('form').element.reset()
    await flushPromises()
    expect(update).toHaveBeenCalledExactlyOnceWith('初始查询')
    expect(host.get<HTMLInputElement>('dialog input').element.value).toBe('初始查询')
    expect(new FormData(host.element as HTMLFormElement).getAll('q')).toEqual(['初始查询'])
  })

  it('waits for docked positioning before moving entry arrow navigation into visible results', async () => {
    const wrapper = mount(MdvSearchView, {
      props: { layout: 'docked' },
      slots: {
        default: () => [
          suggestionList(),
          h(
            'div',
            { style: 'display:none' },
            h('button', { 'data-mdv-search-result': '' }, '隐藏结果'),
          ),
        ],
      },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    await wrapper.get('.mdv-search-view__entry input').trigger('keydown', { key: 'ArrowUp' })
    await flushPromises()
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(document.activeElement).toBe(wrapper.findAll('.mdv-list-item__primary')[2]!.element)
  })

  it('moves focus among available list actions without changing list semantics or consuming embedded keys', async () => {
    const wrapper = mount(MdvSearchView, {
      props: { layout: 'fullscreen' },
      slots: { default: () => [suggestionList(), h('input', { id: 'filter-input' })] },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    await wrapper.vm.open()
    await flushPromises()
    await wrapper.get('dialog .mdv-search-bar__input').trigger('keydown', { key: 'ArrowDown' })
    const buttons = wrapper.findAll('.mdv-list-item__primary')
    expect(document.activeElement).toBe(buttons[0]!.element)
    await buttons[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[2]!.element)
    await buttons[2]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(buttons[0]!.element)
    await buttons[0]!.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(wrapper.get('dialog .mdv-search-bar__input').element)
    const embedded = wrapper.get<HTMLInputElement>('#filter-input').element
    embedded.focus()
    const key = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    embedded.dispatchEvent(key)
    expect(key.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(embedded)
    expect(wrapper.get('ul').attributes('role')).toBe('list')
  })

  it('keeps the same query input and selection while switching auto layout and preserves result nodes across closes', async () => {
    const wrapper = mount(MdvSearchView, {
      props: { modelValue: '旅行计划', layout: 'auto' },
      slots: { default: suggestionList },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    await wrapper.vm.open()
    await flushPromises()
    const input = wrapper.get<HTMLInputElement>('dialog input').element
    input.setSelectionRange(1, 3)
    const list = wrapper.get('ul').element
    platform.media('(max-width: 599px)', true)
    await flushPromises()
    expect(wrapper.get('dialog').classes()).toContain('mdv-search-dialog--fullscreen')
    expect(wrapper.get('dialog input').element).toBe(input)
    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(3)
    expect(document.activeElement).toBe(input)
    await wrapper.vm.close()
    await flushPromises()
    await wrapper.vm.open()
    await flushPromises()
    expect(wrapper.get('ul').element).toBe(list)
  })

  it('binds an icon trigger and honors asynchronous beforeClose with a back reason', async () => {
    let resolve!: (allowed: boolean) => void
    const beforeClose = vi.fn<() => Promise<boolean>>(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const wrapper = mount(MdvSearchView, {
      props: { layout: 'fullscreen', beforeClose, destroyOnClose: true },
      slots: {
        trigger: ({ triggerProps }: MdvSearchTriggerSlotProps) =>
          h('button', { ...triggerProps, id: 'search-trigger' }, '搜索'),
      },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    const trigger = wrapper.get<HTMLButtonElement>('#search-trigger')
    trigger.element.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    trigger.element.click()
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.mdv-search-dialog__field').classes()).not.toContain(
      'mdv-search-bar--keyboard-focus',
    )
    await wrapper.get('button[aria-label="返回"]').trigger('click')
    expect(beforeClose).toHaveBeenCalledWith({ reason: 'back' })
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    resolve(true)
    await flushPromises()
    expect(wrapper.emitted('closed')).toEqual([[{ reason: 'back' }]])
    expect(document.activeElement).toBe(trigger.element)
  })

  it('closes only the top search and leaves its parent dialog locked and focused', async () => {
    const wrapper = mount(MdvDialog, {
      props: { modelValue: true, title: '添加' },
      slots: {
        default: () => [
          h('button', { autofocus: true }, '其它操作'),
          h(MdvSearchView, { layout: 'fullscreen' }),
        ],
      },
      attachTo: document.body,
    })
    hosts.add(wrapper)
    await flushPromises()
    const search = wrapper.getComponent(MdvSearchView)
    await search.vm.open()
    await flushPromises()
    await search.get('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(search.get<HTMLDialogElement>('dialog').element.open).toBe(false)
    expect(wrapper.get<HTMLDialogElement>('.mdv-dialog').element.open).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(document.documentElement.style.overflow).toBe('hidden')
  })

  it('releases modal resources in KeepAlive and destroys results only when requested', async () => {
    const shown = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () =>
              shown.value
                ? h(
                    MdvSearchView,
                    { layout: 'fullscreen', destroyOnClose: true },
                    {
                      default: ({ close }: MdvSearchSlotProps) =>
                        h('button', { onClick: close }, '完成'),
                    },
                  )
                : null,
          }),
      }),
      { attachTo: document.body },
    )
    hosts.add(host)
    const search = host.getComponent(MdvSearchView)
    await search.vm.open()
    await flushPromises()
    shown.value = false
    await flushPromises()
    expect(document.documentElement.style.overflow).toBe('')
    shown.value = true
    await flushPromises()
    expect(host.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    await host.getComponent(MdvSearchView).vm.close()
    await flushPromises()
    expect(host.find('.mdv-search-dialog__results').exists()).toBe(false)
    await nextTick()
  })
})
