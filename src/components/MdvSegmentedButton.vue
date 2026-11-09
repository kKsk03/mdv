<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  provide,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { StyleValue, VNode } from 'vue'
import { mdvSegmentedButtonKey } from './segmented-button-context'
import type { SegmentedButtonRegistration } from './segmented-button-context'
import type {
  MdvSegmentedButtonDensity,
  MdvSegmentedButtonModelValue,
  MdvSegmentedButtonSelection,
  MdvSegmentedButtonValue,
} from './segmented-button.types'

defineOptions({ name: 'MdvSegmentedButton', inheritAttrs: false })
defineSlots<{ default?(): VNode[] }>()

const model = defineModel<MdvSegmentedButtonModelValue>({ default: null })
const props = withDefaults(
  defineProps<{
    selection?: MdvSegmentedButtonSelection
    /** 默认单选 true、多选 false；只约束取消最后一项，不是 HTML required。 */
    selectionRequired?: boolean
    disabled?: boolean
    fullWidth?: boolean
    density?: MdvSegmentedButtonDensity
    showSelectedIcon?: boolean
    name?: string
    form?: string
  }>(),
  {
    selection: 'single',
    selectionRequired: undefined,
    disabled: false,
    fullWidth: false,
    density: 0,
    showSelectedIcon: true,
  },
)

const attrs = useAttrs()
const root = useTemplateRef<HTMLDivElement>('root')
const activeId = ref<string | null>(null)
const selectionRequired = computed(() => props.selectionRequired ?? props.selection === 'single')
const initialModel = copyModel(normalizeModel(model.value))
let items: SegmentedButtonRegistration[] = []
let pendingModel: MdvSegmentedButtonModelValue | undefined
let resetForm: HTMLFormElement | null = null
let syncQueued = false
let disposed = false
let active = true
let availabilityObserver: MutationObserver | undefined

function normalizeModel(value: MdvSegmentedButtonModelValue): MdvSegmentedButtonModelValue {
  return props.selection === 'multiple'
    ? Array.isArray(value)
      ? value
      : []
    : Array.isArray(value)
      ? null
      : value
}

function copyModel(value: MdvSegmentedButtonModelValue) {
  return Array.isArray(value) ? [...value] : value
}

function contains(value: MdvSegmentedButtonModelValue, item: MdvSegmentedButtonValue) {
  return Array.isArray(value)
    ? value.some((entry) => Object.is(entry, item))
    : Object.is(value, item)
}

function currentModel() {
  return normalizeModel(pendingModel === undefined ? model.value : pendingModel)
}

function rootAttrs() {
  const result = { ...attrs }
  delete result.style
  delete result.role
  delete result.tabindex
  result['aria-disabled'] = props.disabled ? 'true' : attrs['aria-disabled']
  return result
}

function orderedItems() {
  return [...items].sort((a, b) => {
    const first = a.input()
    const second = b.input()
    if (!first || !second || first === second) return 0
    const position = first.compareDocumentPosition(second)
    return position & 1 ? 0 : position & 4 ? -1 : 1
  })
}

function enabledItems() {
  return orderedItems().filter((item) => {
    const input = item.input()
    return (
      !item.disabled() &&
      input &&
      !input.matches(':disabled') &&
      !input.closest('[hidden], [inert]')
    )
  })
}

function isSelected(value: MdvSegmentedButtonValue) {
  return contains(normalizeModel(model.value), value)
}

function canDeselect(value: MdvSegmentedButtonValue) {
  const current = currentModel()
  return (
    !contains(current, value) ||
    !selectionRequired.value ||
    (Array.isArray(current) && current.some((entry) => !Object.is(entry, value)))
  )
}

function syncControls() {
  if (disposed || !root.value) return
  const enabled = enabledItems()
  const focused = enabled.find((item) => item.input() === root.value?.ownerDocument.activeElement)
  const target = focused ?? enabled.find((item) => item.id === activeId.value) ?? enabled[0]
  activeId.value = target?.id ?? null
  // 浏览器可能在 click、input、change 之间刷新微任务；原生激活结束前不能回写旧 checked。
  const activating = items.some((item) => item.activating())
  for (const item of items) {
    const input = item.input()
    if (!input) continue
    if (!activating) input.checked = isSelected(item.value())
    input.tabIndex = item === target ? 0 : -1
  }
}

function scheduleSync() {
  if (syncQueued || disposed) return
  syncQueued = true
  void nextTick(() => {
    syncQueued = false
    if (!items.some((item) => item.activating())) pendingModel = undefined
    if (disposed) return
    syncControls()
    syncForm()
  })
}

function setSelected(value: MdvSegmentedButtonValue, selected: boolean) {
  if (props.disabled) return false
  const current = currentModel()
  const alreadySelected = contains(current, value)
  if (alreadySelected === selected) return false
  if (!selected && !canDeselect(value)) {
    scheduleSync()
    return false
  }
  const next =
    props.selection === 'multiple'
      ? selected
        ? [...(Array.isArray(current) ? current : []), value]
        : (Array.isArray(current) ? current : []).filter((entry) => !Object.is(entry, value))
      : selected
        ? value
        : null
  pendingModel = next
  model.value = next
  // 同一任务连续激活时也保持原生互斥；无 name 的 radio 不会由浏览器替我们取消另一项。
  for (const item of items) {
    const input = item.input()
    if (input) input.checked = contains(next, item.value())
  }
  scheduleSync()
  return true
}

function register(item: SegmentedButtonRegistration) {
  if (import.meta.env.DEV && items.some((entry) => Object.is(entry.value(), item.value()))) {
    console.warn('[MDV] MdvSegmentedButton: each item must have a unique value.')
  }
  items.push(item)
  // setup 阶段确定第一可用入口，保证 SSR 与 hydration 的首次标记相同。
  if (activeId.value === null && !item.disabled()) activeId.value = item.id
  return () => {
    const ordered = orderedItems()
    const index = ordered.indexOf(item)
    const candidates = [...ordered.slice(index + 1), ...ordered.slice(0, index).reverse()]
    const document = root.value?.ownerDocument
    const restoreFocus = !!document && item.input() === document.activeElement
    items = items.filter((entry) => entry !== item)
    if (activeId.value === item.id) activeId.value = null
    void nextTick(() => {
      if (disposed || !active || !root.value) return
      const enabled = enabledItems()
      const target = candidates.find((entry) => enabled.includes(entry)) ?? enabled[0]
      const focused = root.value.ownerDocument.activeElement
      if (restoreFocus && (!focused || focused === document?.body || !focused.isConnected)) {
        activeId.value = target?.id ?? null
        target?.input()?.focus({ preventScroll: true })
      }
      syncControls()
      syncForm()
    })
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || props.disabled)
    return
  if (
    !['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
  )
    return
  const enabled = enabledItems()
  const current = enabled.findIndex((item) => item.input() === event.target)
  if (current < 0 || !root.value) return
  if (event.key === 'Tab') {
    const target = enabled[current + (event.shiftKey ? -1 : 1)]
    const input = target?.input()
    // 边界交给浏览器离开组；不能循环 Tab，也不能因 radio 同名而跳过组内选项。
    if (!target || !input) return
    event.preventDefault()
    activeId.value = target.id
    input.focus()
    input.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    scheduleSync()
    return
  }
  const rtl =
    (root.value.ownerDocument.defaultView?.getComputedStyle(root.value).direction ||
      root.value.closest('[dir]')?.getAttribute('dir')) === 'rtl'
  const forward =
    event.key === 'ArrowDown' ||
    (event.key === 'ArrowRight' && !rtl) ||
    (event.key === 'ArrowLeft' && rtl)
  const index =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? enabled.length - 1
        : (current + (forward ? 1 : -1) + enabled.length) % enabled.length
  const target = enabled[index]
  const input = target?.input()
  if (!target || !input) return
  event.preventDefault()
  activeId.value = target.id
  input.focus()
  if (props.selection === 'single' && !contains(currentModel(), target.value())) input.click()
  input.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  scheduleSync()
}

function resetFromForm(event: Event) {
  const form = event.currentTarget
  queueMicrotask(() => {
    if (
      disposed ||
      event.defaultPrevented ||
      form !== resetForm ||
      items.find((item) => item.input())?.input()?.form !== form
    )
      return
    pendingModel = undefined
    model.value = copyModel(initialModel)
    scheduleSync()
  })
}

function syncForm() {
  const form = items.find((item) => item.input())?.input()?.form ?? null
  if (form === resetForm) return
  resetForm?.removeEventListener('reset', resetFromForm)
  resetForm = form
  resetForm?.addEventListener('reset', resetFromForm)
}

function observeAvailability() {
  availabilityObserver?.disconnect()
  const element = root.value
  const Observer = element?.ownerDocument.defaultView?.MutationObserver
  if (!element || !Observer) return
  availabilityObserver = new Observer(scheduleSync)
  const attributeFilter = ['disabled', 'hidden', 'inert', 'form']
  availabilityObserver.observe(element, {
    attributes: true,
    subtree: true,
    childList: true,
    attributeFilter,
  })
  // fieldset 的 disabled 是 DOM 继承状态，不会作为子组件 prop 自动触发更新。
  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    availabilityObserver.observe(ancestor, { attributes: true, attributeFilter })
  }
}

provide(mdvSegmentedButtonKey, {
  selection: computed(() => props.selection),
  disabled: computed(() => props.disabled),
  // 无 name 时保持真正的无名字段，不向 FormData 注入内部生成的字段名。
  name: computed(() => props.name),
  form: computed(() => props.form),
  showSelectedIcon: computed(() => props.showSelectedIcon),
  isSelected,
  isInitiallySelected: (value) => contains(initialModel, value),
  isCurrentlySelected: (value) => contains(currentModel(), value),
  canDeselect,
  setSelected,
  register,
  tabIndex: (id) => (activeId.value === id ? 0 : -1),
  scheduleSync,
  syncForm,
  handleKeydown,
})

watch(
  [model, () => props.selection, () => props.disabled, () => props.name, () => props.form],
  scheduleSync,
  { flush: 'post' },
)
onMounted(() => {
  syncControls()
  syncForm()
  observeAvailability()
})
onUpdated(() => {
  syncControls()
  syncForm()
})
onActivated(() => {
  active = true
  syncControls()
  syncForm()
  observeAvailability()
})
onDeactivated(() => {
  active = false
  availabilityObserver?.disconnect()
})
onBeforeUnmount(() => {
  disposed = true
  pendingModel = undefined
  resetForm?.removeEventListener('reset', resetFromForm)
  availabilityObserver?.disconnect()
  items = []
})

defineExpose({
  focus: (options?: FocusOptions) => {
    syncControls()
    enabledItems()
      .find((item) => item.id === activeId.value)
      ?.input()
      ?.focus(options)
  },
  blur: () => {
    const element = root.value?.ownerDocument.activeElement
    if (element instanceof HTMLElement && root.value?.contains(element)) element.blur()
  },
})
</script>

<template>
  <div
    ref="root"
    v-bind="rootAttrs()"
    :style="[
      { '--mdv-segmented-button-height': `${40 + props.density * 4}px` },
      attrs.style as StyleValue,
    ]"
    :class="['mdv-segmented-button', { 'mdv-segmented-button--full-width': props.fullWidth }]"
    :role="props.selection === 'single' ? 'radiogroup' : 'group'"
    @focusin="scheduleSync"
  >
    <div class="mdv-segmented-button__viewport">
      <div class="mdv-segmented-button__items"><slot /></div>
    </div>
  </div>
</template>
