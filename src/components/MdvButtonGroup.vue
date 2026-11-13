<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onMounted,
  onUpdated,
  provide,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { mdvButtonGroupKey } from './button-group-context'
import type { ButtonGroupMember } from './button-group-context'
import { createButtonGroupMotion } from './button-group-motion'
import type {
  MdvButtonGroupModelValue,
  MdvButtonGroupProps,
  MdvButtonGroupValue,
} from './button-group.types'

defineOptions({ name: 'MdvButtonGroup', inheritAttrs: false })
const props = withDefaults(defineProps<MdvButtonGroupProps>(), {
  variant: 'standard',
  size: 's',
  shape: 'round',
  selectionRequired: false,
  disabled: false,
  density: 0,
  fullWidth: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [value: MdvButtonGroupModelValue] }>()
defineSlots<{ default?(): VNode[] }>()
const attrs = useAttrs()
function rootAttrs() {
  const result = { ...attrs }
  delete result.tabindex
  delete result.role
  return result
}
const instance = getCurrentInstance()!
const element = useTemplateRef<HTMLDivElement>('element')
const row = useTemplateRef<HTMLDivElement>('row')
const formAnchor = useTemplateRef<HTMLInputElement>('formAnchor')
const selection = computed(
  () => props.selection ?? (props.variant === 'connected' ? 'single' : 'none'),
)
const fullWidth = computed(() => props.fullWidth ?? props.variant === 'connected')
const internal = ref<MdvButtonGroupModelValue>(null)
const model = computed(() => normalize(controlled() ? props.modelValue : internal.value))
const initialModel = copy(model.value)
const fields = computed(() =>
  selection.value === 'none'
    ? []
    : Array.isArray(model.value)
      ? model.value
      : model.value === null
        ? []
        : [model.value],
)
let pending: MdvButtonGroupModelValue | undefined
let members: ButtonGroupMember[] = []
let active = false
let disposed = false
let frame: number | undefined
let view: Window | null = null
let form: HTMLFormElement | null = null
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let media: MediaQueryList | undefined
let movingFocus: HTMLElement | null = null
const observed = new Set<Element>()

function controlled() {
  const vnodeProps = instance.vnode.props ?? {}
  return (
    Object.prototype.hasOwnProperty.call(vnodeProps, 'modelValue') ||
    Object.prototype.hasOwnProperty.call(vnodeProps, 'model-value')
  )
}
function normalize(value: MdvButtonGroupModelValue | undefined): MdvButtonGroupModelValue {
  return selection.value === 'multiple'
    ? Array.isArray(value)
      ? value
      : []
    : Array.isArray(value)
      ? null
      : (value ?? null)
}
function copy(value: MdvButtonGroupModelValue) {
  return Array.isArray(value) ? [...value] : value
}
function contains(value: MdvButtonGroupModelValue, candidate: MdvButtonGroupValue) {
  return Array.isArray(value)
    ? value.some((entry) => Object.is(entry, candidate))
    : Object.is(value, candidate)
}
function selected(value: MdvButtonGroupValue | undefined) {
  return value !== undefined && selection.value !== 'none' && contains(model.value, value)
}
function request(value: MdvButtonGroupModelValue) {
  pending = copy(value)
  if (!controlled()) internal.value = copy(value)
  emit('update:modelValue', copy(value))
  void nextTick(() => {
    pending = undefined
  })
}
function toggle(value: MdvButtonGroupValue) {
  if (props.disabled || selection.value === 'none') return
  const current = normalize(pending === undefined ? model.value : pending)
  const checked = contains(current, value)
  if (checked && props.selectionRequired && (!Array.isArray(current) || current.length <= 1)) return
  request(
    selection.value === 'multiple'
      ? checked
        ? (current as MdvButtonGroupValue[]).filter((entry) => !Object.is(entry, value))
        : [...(current as MdvButtonGroupValue[]), value]
      : checked
        ? null
        : value,
  )
}
function visibleMembers() {
  const root = element.value
  if (!root) return []
  return members
    .filter((member) => {
      const node = member.element()
      if (!node || !root.contains(node) || node.closest('[data-mdv-button-group]') !== root)
        return false
      for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
        const style = view?.getComputedStyle(parent)
        if (parent.hidden || style?.display === 'none' || style?.visibility === 'hidden')
          return false
      }
      return true
    })
    .sort((a, b) => {
      const first = a.element()!
      const second = b.element()!
      const position = first.compareDocumentPosition(second)
      return position & 1 ? 0 : position & 4 ? -1 : 1
    })
}
function availableMembers() {
  return visibleMembers().filter((member) => {
    const node = member.element()!
    return (
      !member.disabled() &&
      !node.matches(':disabled') &&
      !node.closest('[inert], [aria-hidden="true"]') &&
      view?.getComputedStyle(node).visibility !== 'hidden'
    )
  })
}
const motion = createButtonGroupMotion({
  element: () => element.value,
  row: () => row.value,
  members: visibleMembers,
  variant: () => props.variant,
})
function animate() {
  if (active) motion.play()
}
function register(member: ButtonGroupMember) {
  members.push(member)
  scheduleRefresh()
  return () => {
    const ordered = visibleMembers()
    const index = ordered.indexOf(member)
    const focused = member.element() === element.value?.ownerDocument.activeElement
    const candidates = [...ordered.slice(index + 1), ...ordered.slice(0, index).reverse()]
    members = members.filter((entry) => entry !== member)
    void nextTick(() => {
      if (!active || disposed) return
      const doc = element.value?.ownerDocument
      if (focused && (!doc?.activeElement || doc.activeElement === doc.body)) {
        const available = availableMembers()
        candidates
          .find((entry) => available.includes(entry))
          ?.element()
          ?.focus({ preventScroll: true })
      }
      refresh()
    })
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || props.disabled)
    return
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
    return
  const available = availableMembers()
  const index = available.findIndex((member) => member.element() === event.target)
  if (index < 0 || !available.length) return
  const rtl = element.value && view?.getComputedStyle(element.value).direction === 'rtl'
  const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
  const target =
    available[
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? available.length - 1
          : (index + (forward ? 1 : -1) + available.length) % available.length
    ]?.element()
  if (!target) return
  event.preventDefault()
  target.focus()
  target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}
function syncForm() {
  const next = formAnchor.value?.form ?? null
  if (next === form) return
  form?.removeEventListener('reset', resetForm)
  form = next
  form?.addEventListener('reset', resetForm)
}
function resetForm(event: Event) {
  const target = event.currentTarget
  queueMicrotask(() => {
    if (disposed || !active || event.defaultPrevented || target !== form) return
    request(normalize(copy(initialModel)))
  })
}
function refresh() {
  if (!active) return
  const visible = visibleMembers()
  for (const member of members) {
    const node = member.element()
    if (member.disabled() || !visible.includes(member)) member.release()
    node?.toggleAttribute('data-mdv-group-first', visible[0] === member)
    node?.toggleAttribute('data-mdv-group-last', visible[visible.length - 1] === member)
  }
  const nodes = [row.value, ...visible.map((member) => member.content())].filter(
    (node): node is HTMLElement => !!node,
  )
  for (const node of observed)
    if (!nodes.includes(node as HTMLElement)) {
      resizeObserver?.unobserve(node)
      observed.delete(node)
    }
  for (const node of nodes)
    if (!observed.has(node)) {
      resizeObserver?.observe(node)
      observed.add(node)
    }
  motion.measure()
  syncForm()
}
function scheduleRefresh() {
  if (!active || frame !== undefined) return
  if (view?.requestAnimationFrame)
    frame = view.requestAnimationFrame(() => {
      frame = undefined
      refresh()
    })
  else refresh()
}
function onReducedMotion() {
  if (media?.matches) motion.finish()
}
function connect() {
  if (active || !element.value) return
  active = true
  const doc = element.value.ownerDocument
  view = doc.defaultView
  if (typeof ResizeObserver !== 'undefined') resizeObserver = new ResizeObserver(scheduleRefresh)
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(scheduleRefresh)
    mutationObserver.observe(element.value, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'disabled', 'inert', 'dir', 'class', 'form', 'aria-disabled'],
    })
    for (let parent = element.value.parentElement; parent; parent = parent.parentElement)
      mutationObserver.observe(parent, {
        attributes: true,
        attributeFilter: ['hidden', 'disabled', 'inert', 'dir', 'class', 'style'],
      })
  }
  view?.addEventListener('resize', scheduleRefresh)
  element.value.addEventListener('load', scheduleRefresh, true)
  doc.fonts?.addEventListener('loadingdone', scheduleRefresh)
  media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', onReducedMotion)
  refresh()
  motion.measure(true)
}
function disconnect() {
  active = false
  if (frame !== undefined) view?.cancelAnimationFrame(frame)
  frame = undefined
  for (const member of members) member.release()
  motion.reset()
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  observed.clear()
  view?.removeEventListener('resize', scheduleRefresh)
  element.value?.removeEventListener('load', scheduleRefresh, true)
  element.value?.ownerDocument.fonts?.removeEventListener('loadingdone', scheduleRefresh)
  media?.removeEventListener('change', onReducedMotion)
  form?.removeEventListener('reset', resetForm)
  form = null
}
provide(mdvButtonGroupKey, {
  variant: computed(() => props.variant),
  selection,
  size: computed(() => props.size),
  shape: computed(() => props.shape),
  density: computed(() => props.density),
  disabled: computed(() => props.disabled),
  selected,
  toggle,
  register,
  animate,
  refresh: scheduleRefresh,
})
watch(
  [
    model,
    () => props.variant,
    () => props.size,
    () => props.shape,
    selection,
    () => props.disabled,
    () => props.density,
    fullWidth,
  ],
  () => {
    scheduleRefresh()
    animate()
  },
  { flush: 'post' },
)
onMounted(connect)
onActivated(connect)
onDeactivated(disconnect)
onBeforeUpdate(() => {
  const focused = element.value?.ownerDocument.activeElement
  movingFocus =
    visibleMembers()
      .find((member) => member.element() === focused)
      ?.element() ?? null
})
onUpdated(() => {
  const doc = element.value?.ownerDocument
  if (
    active &&
    movingFocus &&
    doc &&
    doc.activeElement === doc.body &&
    availableMembers().some((member) => member.element() === movingFocus)
  )
    movingFocus.focus({ preventScroll: true })
  movingFocus = null
  scheduleRefresh()
})
onBeforeUnmount(() => {
  disposed = true
  disconnect()
})
defineExpose({
  element,
  refresh,
  focus: (options?: FocusOptions) => availableMembers()[0]?.element()?.focus(options),
  blur: () => {
    const node = element.value?.ownerDocument.activeElement
    if (node && element.value?.contains(node)) (node as HTMLElement).blur()
  },
})
</script>

<template>
  <div
    ref="element"
    v-bind="rootAttrs()"
    class="mdv-button-group"
    :class="[
      `mdv-button-group--${props.variant}`,
      `mdv-button-group--${props.size}`,
      { 'mdv-button-group--full-width': fullWidth },
    ]"
    role="group"
    :aria-disabled="
      props.disabled ||
      attrs['aria-disabled'] === true ||
      attrs['aria-disabled'] === 'true' ||
      undefined
    "
    data-mdv-button-group
    @keydown="onKeydown"
  >
    <div class="mdv-button-group__viewport">
      <div ref="row" class="mdv-button-group__items"><slot /></div>
    </div>
    <input
      ref="formAnchor"
      type="hidden"
      :form="props.form"
      :disabled="props.disabled"
      data-mdv-group-form
    />
    <template v-if="props.name">
      <input
        v-for="(value, index) in fields"
        :key="index"
        type="hidden"
        :name="props.name"
        :value="value"
        :form="props.form"
        :disabled="props.disabled"
      />
    </template>
  </div>
</template>
