<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  ref,
  shallowRef,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { mdvListKey } from './list-context'
import type { ListRegistration } from './list-context'
import type {
  MdvListDivider,
  MdvListLayout,
  MdvListModelValue,
  MdvListSelectionMode,
  MdvListValue,
  MdvListVariant,
} from './list.types'

defineOptions({ name: 'MdvList', inheritAttrs: false })
defineSlots<{ default?(): VNode[] }>()

const model = defineModel<MdvListModelValue>({ default: null })
const props = withDefaults(
  defineProps<{
    variant?: MdvListVariant
    layout?: MdvListLayout
    /** Shorthand for layout="segmented"; an explicit layout takes priority. */
    segmented?: boolean
    selectionMode?: MdvListSelectionMode
    dividers?: MdvListDivider
    lines?: 1 | 2 | 3
  }>(),
  {
    variant: 'expressive',
    segmented: false,
    selectionMode: 'none',
    dividers: 'none',
  },
)

const attrs = useAttrs()
const root = useTemplateRef<HTMLUListElement>('root')
const items = shallowRef<ListRegistration[]>([])
const tabStopId = ref<string | null>(null)
let disposed = false

const layout = computed<MdvListLayout>(
  () => props.layout ?? (props.segmented ? 'segmented' : 'standard'),
)

function isSelected(value: MdvListValue | undefined) {
  if (value === undefined || props.selectionMode === 'none') return false
  return props.selectionMode === 'multiple'
    ? Array.isArray(model.value) && model.value.some((entry) => Object.is(entry, value))
    : !Array.isArray(model.value) && Object.is(model.value, value)
}

function toggle(value: MdvListValue) {
  if (props.selectionMode === 'none') return
  if (props.selectionMode === 'single') {
    if (!Object.is(model.value, value)) model.value = value
    return
  }
  const current = Array.isArray(model.value) ? model.value : []
  model.value = current.some((entry) => Object.is(entry, value))
    ? current.filter((entry) => !Object.is(entry, value))
    : [...current, value]
}

function candidates() {
  // DOM order can change independently of registration, for example when sorting a keyed v-for.
  return items.value
    .filter(
      (item) =>
        item.focusable() &&
        !item.disabled() &&
        !item.element()?.closest('[hidden], [inert]') &&
        (props.selectionMode === 'none' || item.selectable()),
    )
    .sort((first, second) => {
      const a = first.element()
      const b = second.element()
      if (!a || !b || a === b) return 0
      const position = a.compareDocumentPosition(b)
      return position & 4 ? -1 : position & 2 ? 1 : 0
    })
}

function refreshTabStop() {
  if (disposed) return
  const available = candidates()
  const active = root.value?.ownerDocument.activeElement
  const activeRegistration = items.value.find((item) => item.primary() === active)
  const focused = available.find((item) => item.primary() === active)
  const selected = available.find((item) => isSelected(item.value()))
  const previous = available.find((item) => item.id === tabStopId.value)
  const next = focused ?? selected ?? previous ?? available[0]
  tabStopId.value = next?.id ?? null
  if (props.selectionMode !== 'none' && activeRegistration && !focused) next?.primary()?.focus()
}

function register(item: ListRegistration) {
  if (
    import.meta.env.DEV &&
    item.value() !== undefined &&
    items.value.some((entry) => Object.is(entry.value(), item.value()))
  ) {
    console.warn('[MDV] MdvList: each selectable item must have a unique value.')
  }
  items.value = [...items.value, item]
  void nextTick(refreshTabStop)
  return () => {
    const element = item.primary()
    const document = root.value?.ownerDocument
    const restoreFocus = props.selectionMode !== 'none' && document?.activeElement === element
    const index = candidates().findIndex((entry) => entry === item)
    items.value = items.value.filter((entry) => entry !== item)
    void nextTick(() => {
      if (disposed) return
      refreshTabStop()
      // Do not steal focus if the user moved to another control while this row was removed.
      if (
        restoreFocus &&
        document &&
        (document.activeElement === document.body || document.activeElement === element)
      ) {
        const available = candidates()
        const adjacent = available[Math.max(0, Math.min(index, available.length - 1))]
        if (adjacent) focusItem(adjacent.id)
      }
    })
  }
}

function tabIndex(id: string, value: MdvListValue | undefined) {
  const available = candidates()
  const preferred =
    available.find((item) => item.id === tabStopId.value) ??
    available.find((item) => isSelected(item.value())) ??
    available[0]
  // SSR has no mounted registrations; a selected option can already be a Tab stop.
  return preferred ? (preferred.id === id ? 0 : -1) : isSelected(value) ? 0 : -1
}

function setTabStop(id: string) {
  if (candidates().some((item) => item.id === id)) tabStopId.value = id
}

function focusItem(id: string) {
  const item = candidates().find((entry) => entry.id === id)
  if (!item) return
  tabStopId.value = id
  item.primary()?.focus()
}

function moveFocus(id: string, direction: 1 | -1 | 'first' | 'last') {
  const available = candidates()
  if (!available.length) return
  const index = Math.max(
    0,
    available.findIndex((item) => item.id === id),
  )
  const nextIndex =
    direction === 'first'
      ? 0
      : direction === 'last'
        ? available.length - 1
        : (index + direction + available.length) % available.length
  const next = available[nextIndex]
  if (next) focusItem(next.id)
}

function onKeydown(event: KeyboardEvent) {
  if (props.selectionMode === 'none' || event.defaultPrevented) return
  // Independent action slots retain their own keyboard behavior.
  const item = candidates().find((entry) => entry.primary() === event.target)
  if (!item) return
  const direction =
    event.key === 'ArrowDown' || event.key === 'ArrowRight'
      ? 1
      : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
        ? -1
        : event.key === 'Home'
          ? 'first'
          : event.key === 'End'
            ? 'last'
            : undefined
  if (direction === undefined) return
  event.preventDefault()
  moveFocus(item.id, direction)
}

function rootAttrs() {
  const result = { ...attrs }
  delete result.role
  delete result['aria-multiselectable']
  if (props.selectionMode === 'multiple') result['aria-multiselectable'] = 'true'
  return result
}

provide(mdvListKey, {
  selectionMode: computed(() => props.selectionMode),
  lines: computed(() => props.lines),
  isSelected,
  toggle,
  register,
  tabIndex,
  setTabStop,
})

watch([() => props.selectionMode, model], () => void nextTick(refreshTabStop), {
  deep: true,
})
onMounted(refreshTabStop)
onUpdated(() => void nextTick(refreshTabStop))
onBeforeUnmount(() => {
  disposed = true
})

defineExpose({
  focus: (options?: FocusOptions) => {
    refreshTabStop()
    candidates()
      .find((item) => item.id === tabStopId.value)
      ?.primary()
      ?.focus(options)
  },
  blur: () => {
    const active = root.value?.ownerDocument.activeElement
    if (active instanceof HTMLElement && root.value?.contains(active)) active.blur()
  },
})
</script>

<template>
  <ul
    ref="root"
    v-bind="rootAttrs()"
    :role="props.selectionMode === 'none' ? 'list' : 'listbox'"
    :class="[
      'mdv-list',
      'mdv-list--' + props.variant,
      'mdv-list--' + layout,
      'mdv-list--dividers-' + props.dividers,
    ]"
    @keydown="onKeydown"
  >
    <slot />
  </ul>
</template>
