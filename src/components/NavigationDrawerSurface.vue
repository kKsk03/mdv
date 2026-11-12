<script setup lang="ts">
import { computed, onBeforeUpdate, onUpdated, provide, useAttrs, useTemplateRef } from 'vue'
import type { VNode } from 'vue'
import {
  drawerAvailable,
  navigationDrawerDepthKey,
  navigationDrawerKey,
} from './navigation-drawer-context'
import type { MdvNavigationDrawerSlotProps } from './navigation-drawer.types'

defineOptions({ name: 'NavigationDrawerSurface', inheritAttrs: false })
const props = defineProps<{
  title: string
  titleId: string
  visible: boolean
  close: () => Promise<boolean>
}>()
const emit = defineEmits<{ select: [event: MouseEvent] }>()
const slots = defineSlots<{
  default?(props: MdvNavigationDrawerSlotProps): VNode[]
  header?(props: MdvNavigationDrawerSlotProps): VNode[]
  footer?(props: MdvNavigationDrawerSlotProps): VNode[]
}>()
const attrs = useAttrs()
const root = useTemplateRef<HTMLElement>('root')
provide(navigationDrawerKey, { select: (event) => emit('select', event) })
provide(
  navigationDrawerDepthKey,
  computed(() => 0),
)
let previousFocus: HTMLElement | null = null

function rootAttrs() {
  const result = { ...attrs }
  delete result.role
  delete result['aria-modal']
  if (!result['aria-label'] && !result['aria-labelledby']) {
    if (props.title || slots.header) result['aria-labelledby'] = props.titleId
    else result['aria-label'] = '主导航'
  }
  return result
}
function ownedItems() {
  const nav = root.value
  return nav
    ? [...nav.querySelectorAll<HTMLElement>('[data-mdv-drawer-control]')].filter(
        (item) =>
          item.closest('[data-mdv-drawer]') === nav &&
          item.closest('dialog') === nav.closest('dialog'),
      )
    : []
}
function focus() {
  const nav = root.value
  if (!nav || !props.visible) return
  const items = ownedItems().filter((item) => drawerAvailable(item, nav))
  ;(items.find((item) => item.getAttribute('aria-current') === 'page') ?? items[0] ?? nav).focus({
    preventScroll: true,
  })
}
function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing)
    return
  if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  const nav = root.value
  const source = event.target as HTMLElement
  if (!nav || !source.matches('[data-mdv-drawer-control]')) return
  const items = ownedItems().filter((item) => drawerAvailable(item, nav))
  const index = items.indexOf(source)
  if (index < 0 || !items.length) return
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
  event.preventDefault()
  items[next]?.focus({ preventScroll: true })
}
function reveal(event: FocusEvent) {
  const nav = root.value
  const element = event.target as HTMLElement
  if (!nav || !ownedItems().includes(element)) return
  const viewport = element.closest<HTMLElement>('.mdv-navigation-drawer__scroll')
  if (!viewport?.clientHeight) return
  const item = element.getBoundingClientRect()
  const frame = viewport.getBoundingClientRect()
  if (item.top < frame.top) viewport.scrollTop += item.top - frame.top
  else if (item.bottom > frame.bottom) viewport.scrollTop += item.bottom - frame.bottom
}
onBeforeUpdate(() => {
  const focused = root.value?.ownerDocument.activeElement
  previousFocus = ownedItems().find((item) => item === focused) ?? null
})
onUpdated(() => {
  const previous = previousFocus
  previousFocus = null
  const nav = root.value
  if (
    !props.visible ||
    !nav ||
    !previous ||
    (nav.contains(previous) && drawerAvailable(previous, nav))
  )
    return
  const doc = nav.ownerDocument
  const current = doc.activeElement
  if (!current || current === previous || current === doc.body || current === doc.documentElement)
    focus()
})
defineExpose({ element: root, focus })
</script>

<template>
  <nav
    ref="root"
    v-bind="rootAttrs()"
    class="mdv-navigation-drawer__surface"
    data-mdv-drawer
    tabindex="-1"
    @keydown="keydown"
    @focusin="reveal"
  >
    <header v-if="slots.header || title" :id="titleId" class="mdv-navigation-drawer__header">
      <slot name="header" :close="close"
        ><h2 class="mdv-navigation-drawer__title">{{ title }}</h2></slot
      >
    </header>
    <div class="mdv-navigation-drawer__scroll">
      <ul class="mdv-navigation-drawer__list">
        <slot :close="close" />
      </ul>
    </div>
    <footer v-if="slots.footer" class="mdv-navigation-drawer__footer">
      <slot name="footer" :close="close" />
    </footer>
  </nav>
</template>
