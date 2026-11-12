import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import type { VNodeChild } from 'vue'
import MdvModalNavigationRail from '../components/MdvModalNavigationRail.vue'
import MdvNavigationRailItem from '../components/MdvNavigationRailItem.vue'
import MdvDialog from '../components/MdvDialog.vue'
import { topDialog } from '../components/dialog-modal'
import type {
  MdvModalNavigationRailProps,
  MdvNavigationRailSlotProps,
} from '../components/navigation-rail.types'
import { mockDialogPlatform } from './dialog-test-platform'

let platform: ReturnType<typeof mockDialogPlatform>
const hosts = new Set<{ exists(): boolean; unmount(): void }>()
beforeEach(() => {
  platform = mockDialogPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(async () => {
  for (const host of hosts) {
    if (host.exists()) host.unmount()
  }
  hosts.clear()
  await flushPromises()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

function example(
  props: MdvModalNavigationRailProps = {},
  slots: Record<string, (scope: MdvNavigationRailSlotProps) => VNodeChild> = {},
) {
  const expanded = ref(props.expanded ?? false)
  const accept = ref(true)
  const Example = defineComponent({
    setup: () => () =>
      h('main', [
        h(
          'button',
          {
            id: 'external',
            onClick: () => {
              expanded.value = true
            },
          },
          '外部打开',
        ),
        h(
          MdvModalNavigationRail,
          {
            ...props,
            expanded: expanded.value,
            'aria-label': '主要导航',
            'onUpdate:expanded': (value: boolean) => {
              if (accept.value || value) expanded.value = value
            },
          },
          {
            menu: ({ menuAttrs }: MdvNavigationRailSlotProps) =>
              h('button', { ...menuAttrs, 'data-toggle': '', 'aria-label': '切换导航' }, '菜单'),
            default: () => [
              h(MdvNavigationRailItem, { label: '首页', active: true }),
              h(MdvNavigationRailItem, { label: '探索' }),
            ],
            ...slots,
          },
        ),
      ]),
  })
  const host = mount(Example, { attachTo: document.body })
  hosts.add(host)
  const rail = host.getComponent(MdvModalNavigationRail)
  return { host, rail, expanded, accept }
}
function scrimPointer(element: Element, type: string) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  element.dispatchEvent(event)
}

describe('MdvModalNavigationRail', () => {
  it('retains the collapsed rail, covers the page, emits lifecycle events and restores its original menu trigger', async () => {
    const { host, rail } = example()
    const trigger = host.get<HTMLButtonElement>(
      '.mdv-modal-navigation-rail-host > nav [data-toggle]',
    )
    const dialog = rail.get<HTMLDialogElement>('dialog')
    expect(dialog.element.open).toBe(false)
    expect(rail.findAll('nav')).toHaveLength(2)
    trigger.element.focus()
    await trigger.trigger('click')
    await flushPromises()
    expect(dialog.element.open).toBe(true)
    expect(dialog.attributes('aria-label')).toBe('主要导航')
    expect(trigger.attributes('aria-controls')).toBe(dialog.attributes('id'))
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(dialog.get('[data-toggle]').element)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(rail.emitted('open')).toHaveLength(1)
    expect(rail.emitted('opened')).toHaveLength(1)
    await dialog.get('[data-toggle]').trigger('click')
    await flushPromises()
    expect(dialog.element.open).toBe(false)
    expect(rail.emitted('close')).toEqual([[{ reason: 'menu' }]])
    expect(rail.emitted('closed')).toEqual([[{ reason: 'menu' }]])
    expect(document.activeElement).toBe(trigger.element)
    expect(document.documentElement.style.overflow).toBe('')
    host.unmount()
  })

  it('supports an external trigger, explicit autofocus and destroy-on-close without a collapsed placeholder', async () => {
    const { host, rail } = example(
      { hideOnCollapse: true, destroyOnClose: true },
      {
        default: () => [
          h(MdvNavigationRailItem, { label: '首页' }),
          h(MdvNavigationRailItem, { label: '探索', autofocus: true }),
        ],
      },
    )
    const trigger = host.get<HTMLButtonElement>('#external')
    expect(rail.find('nav').exists()).toBe(false)
    trigger.element.focus()
    await trigger.trigger('click')
    await flushPromises()
    const destination = rail.get('[autofocus]')
    expect(document.activeElement).toBe(destination.element)
    expect(rail.findAll('nav')).toHaveLength(1)
    const accepted = await rail.vm.close()
    await flushPromises()
    expect(accepted).toBe(true)
    expect(rail.find('nav').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    host.unmount()
  })

  it.each(['escape', 'scrim'] as const)(
    'requests an accepted %s close exactly once',
    async (reason) => {
      const { host, rail } = example({ expanded: true })
      await flushPromises()
      const dialog = rail.get('dialog')
      if (reason === 'escape') await dialog.trigger('keydown', { key: 'Escape' })
      else {
        const scrim = rail.get('.mdv-modal-navigation-rail__scrim').element
        scrimPointer(scrim, 'pointerdown')
        scrimPointer(scrim, 'pointerup')
      }
      await flushPromises()
      expect(rail.emitted('update:expanded')).toEqual([[false]])
      expect(rail.emitted('close')).toEqual([[{ reason }]])
      expect(dialog.attributes('open')).toBeUndefined()
      host.unmount()
    },
  )

  it('keeps content and position when the parent rejects closing, and coalesces simultaneous close requests', async () => {
    const { host, rail, accept } = example({ expanded: true })
    await flushPromises()
    accept.value = false
    const first = rail.vm.close()
    const second = rail.vm.close()
    expect(first).toBe(second)
    expect(await first).toBe(false)
    await flushPromises()
    expect(rail.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(rail.emitted('update:expanded')).toEqual([[false]])
    expect(rail.emitted('close')).toBeUndefined()
    accept.value = true
    expect(await rail.vm.close()).toBe(true)
    await flushPromises()
    expect(rail.emitted('close')).toEqual([[{ reason: 'menu' }]])
    host.unmount()
  })

  it('closes after one normal destination activation and leaves active selection with the caller', async () => {
    const { host, rail } = example({ expanded: true })
    await flushPromises()
    const target = rail.get('dialog').findAll('[data-mdv-rail-item]')[1]!
    await target.trigger('click')
    await flushPromises()
    expect(target.attributes('aria-current')).toBeUndefined()
    expect(rail.emitted('close')).toEqual([[{ reason: 'select' }]])
    expect(rail.emitted('update:expanded')).toEqual([[false]])
    host.unmount()
  })

  it.each([
    {
      name: 'item cancellation',
      props: { onClick: (event: MouseEvent) => event.preventDefault() },
      init: {},
    },
    { name: 'Ctrl click', props: {}, init: { ctrlKey: true } },
    { name: 'Meta click', props: {}, init: { metaKey: true } },
    { name: 'Shift click', props: {}, init: { shiftKey: true } },
    { name: 'new window link', props: { target: '_blank' }, init: {} },
    { name: 'download link', props: { download: 'file.txt' }, init: {} },
  ])('keeps the rail open for $name', async ({ props, init }) => {
    const { host, rail } = example(
      { expanded: true },
      {
        default: () => h(MdvNavigationRailItem, { label: '探索', href: '#explore', ...props }),
      },
    )
    await flushPromises()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init })
    rail.get('dialog [data-mdv-rail-item]').element.dispatchEvent(event)
    await flushPromises()
    expect(rail.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(rail.emitted('update:expanded')).toBeUndefined()
    host.unmount()
  })

  it('respects cancellation by an ancestor after the item listener has run', async () => {
    const { host, rail } = example(
      { expanded: true },
      {
        default: () =>
          h('div', { onClick: (event: MouseEvent) => event.preventDefault() }, [
            h(MdvNavigationRailItem, { label: '首页' }),
          ]),
      },
    )
    await flushPromises()
    await rail.get('dialog [data-mdv-rail-item]').trigger('click')
    await flushPromises()
    expect(rail.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(rail.emitted('close')).toBeUndefined()
    host.unmount()
  })

  it('honors the dismissal switches while leaving explicit close available', async () => {
    const { host, rail } = example({
      expanded: true,
      closeOnEsc: false,
      closeOnScrim: false,
      closeOnSelect: false,
    })
    await flushPromises()
    await rail.get('dialog [data-mdv-rail-item]').trigger('click')
    await rail.get('dialog').trigger('keydown', { key: 'Escape' })
    const scrim = rail.get('.mdv-modal-navigation-rail__scrim').element
    scrimPointer(scrim, 'pointerdown')
    scrimPointer(scrim, 'pointerup')
    await flushPromises()
    expect(rail.emitted('update:expanded')).toBeUndefined()
    expect(await rail.vm.close()).toBe(true)
    await flushPromises()
    host.unmount()
  })

  it('traps Tab in the top dialog and does not close a rail covered by another dialog', async () => {
    const inner = ref(false)
    const { host, rail } = example(
      { expanded: true },
      {
        fab: ({ expanded: open }) =>
          h('div', [
            h(
              'button',
              {
                id: open ? 'nested-trigger' : 'collapsed-nested-trigger',
                onClick: () => {
                  inner.value = true
                },
              },
              '打开对话框',
            ),
            open
              ? h(
                  MdvDialog,
                  {
                    modelValue: inner.value,
                    title: '详情',
                    'onUpdate:modelValue': (value: boolean) => {
                      inner.value = value
                    },
                  },
                  { default: () => h('button', '内部按钮') },
                )
              : null,
          ]),
      },
    )
    await flushPromises()
    const dialog = rail.get<HTMLDialogElement>('dialog.mdv-modal-navigation-rail')
    const last = dialog.findAll<HTMLButtonElement>('[data-mdv-rail-item]')[1]!
    last.element.focus()
    await last.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(dialog.get('[data-toggle]').element)
    const trigger = rail.get<HTMLButtonElement>('dialog.mdv-modal-navigation-rail #nested-trigger')
    trigger.element.focus()
    await trigger.trigger('click')
    await flushPromises()
    expect(await rail.vm.close()).toBe(false)
    const innerDialog = rail.get<HTMLDialogElement>(
      'dialog.mdv-modal-navigation-rail .mdv-dialog:not(.mdv-modal-navigation-rail)',
    )
    expect(topDialog(document)).toBe(innerDialog.element)
    await innerDialog.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(inner.value).toBe(false)
    expect(dialog.element.open).toBe(true)
    expect(document.activeElement).toBe(trigger.element)
    expect(document.documentElement.style.overflow).toBe('hidden')
    host.unmount()
    expect(topDialog(document)).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('releases the modal stack on KeepAlive deactivation and opens again on reactivation', async () => {
    const shown = ref(true)
    const Example = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, {
          default: () =>
            shown.value
              ? h(
                  MdvModalNavigationRail,
                  { expanded: true },
                  { default: () => h(MdvNavigationRailItem, { label: '首页' }) },
                )
              : null,
        }),
    })
    const host = mount(Example, { attachTo: document.body })
    hosts.add(host)
    await flushPromises()
    expect(topDialog(document)?.open).toBe(true)
    shown.value = false
    await nextTick()
    await flushPromises()
    expect(topDialog(document)).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
    shown.value = true
    await flushPromises()
    expect(topDialog(document)?.open).toBe(true)
    host.unmount()
    expect(topDialog(document)).toBeNull()
  })
})
