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
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { mdvChipSetKey } from './chip-context'
import type { ChipAction, ChipActionPart, ChipRegistration } from './chip-context'
import type { MdvChipSetModelValue, MdvChipSetSelection, MdvChipValue } from './chip.types'

defineOptions({ name: 'MdvChipSet', inheritAttrs: false })

const model = defineModel<MdvChipSetModelValue>({ default: null })
const props = withDefaults(
  defineProps<{
    label?: string
    selection?: MdvChipSetSelection
    disabled?: boolean
    /** 默认换行；开启后在一行内水平滚动。 */
    scrollable?: boolean
  }>(),
  { label: '', selection: 'none', disabled: false, scrollable: false },
)
const slots = defineSlots<{
  default?(): VNode[]
  label?(): VNode[]
}>()

const attrs = useAttrs()
const root = useTemplateRef<HTMLDivElement>('root')
const labelId = `mdv-chip-set-label-${useId()}`
const activeId = ref<string | null>(null)
const activePart = ref<ChipActionPart>('primary')
let chips: ChipRegistration[] = []
let pendingModel: MdvChipSetModelValue | undefined
let modelRevision = 0
let disposed = false
let active = true

function rootAttrs() {
  const result = { ...attrs }
  const labelledBy = [
    typeof attrs['aria-labelledby'] === 'string' ? attrs['aria-labelledby'] : '',
    props.label || slots.label ? labelId : '',
  ]
    .filter(Boolean)
    .join(' ')
  if (labelledBy) result['aria-labelledby'] = labelledBy
  result['aria-disabled'] = props.disabled ? 'true' : attrs['aria-disabled']
  return result
}

function orderedChips() {
  return [...chips].sort((first, second) => {
    const a = first.root()
    const b = second.root()
    if (!a || !b || a === b) return 0
    const position = a.compareDocumentPosition(b)
    if (position & 1) return 0
    return position & 4 ? -1 : 1
  })
}

function enabledActions() {
  return orderedChips().flatMap((chip) =>
    chip.disabled()
      ? []
      : chip
          .actions()
          .filter(
            (action) =>
              !action.element.matches(':disabled') &&
              action.element.getAttribute('aria-disabled') !== 'true' &&
              !action.element.closest('[hidden], [inert]'),
          )
          .map((action) => ({ ...action, chip })),
  )
}

function selectTabStop(action: (ChipAction & { chip: ChipRegistration }) | undefined) {
  activeId.value = action?.chip.id ?? null
  activePart.value = action?.part ?? 'primary'
}

function syncTabIndices(preferSelected = false) {
  if (disposed || !root.value) return
  const actions = enabledActions()
  const focused = actions.find(
    (action) => action.element === root.value?.ownerDocument.activeElement,
  )
  const remembered = actions.find(
    (action) => action.chip.id === activeId.value && action.part === activePart.value,
  )
  const selected = actions.find((action) => action.chip.selected())
  const target = focused ?? (preferSelected ? selected : remembered) ?? selected ?? actions[0]
  selectTabStop(target)
  for (const chip of chips) {
    for (const action of chip.actions()) {
      action.element.tabIndex = action.element === target?.element ? 0 : -1
    }
  }
  root.value.tabIndex = actions.length || props.disabled || chips.length ? -1 : 0
}

function register(chip: ChipRegistration) {
  chips.push(chip)
  // setup 时只确定首个可用入口；服务端与 hydration 首次渲染使用相同顺序。
  if (activeId.value === null && !chip.disabled()) activeId.value = chip.id
  return () => {
    const ordered = orderedChips()
    const index = ordered.indexOf(chip)
    const candidates = [...ordered.slice(index + 1), ...ordered.slice(0, index).reverse()].map(
      (item) => item.id,
    )
    const document = root.value?.ownerDocument
    const restoreFocus = !!document && !!chip.root()?.contains(document.activeElement)
    chips = chips.filter((item) => item !== chip)
    if (activeId.value === chip.id) activeId.value = null

    void nextTick(() => {
      if (disposed || !active || !root.value) return
      const actions = enabledActions()
      const next =
        candidates
          .map((id) => actions.find((action) => action.chip.id === id))
          .find((action) => action !== undefined) ?? actions[0]
      if (restoreFocus) {
        const focused = root.value.ownerDocument.activeElement
        // 使用方在 remove 处理器中明确转移焦点时，尊重其落点。
        if (focused && focused !== document?.body && focused.isConnected) {
          syncTabIndices()
          return
        }
        selectTabStop(next)
        syncTabIndices()
        const focusTarget = next?.element ?? root.value
        focusTarget.focus({ preventScroll: true })
      } else {
        syncTabIndices()
      }
    })
  }
}

function isSelected(value: MdvChipValue | undefined) {
  if (value === undefined) return false
  if (props.selection === 'multiple') {
    return Array.isArray(model.value) && model.value.some((item) => Object.is(item, value))
  }
  return props.selection === 'single' && Object.is(model.value, value)
}

function toggle(value: MdvChipValue) {
  if (props.disabled || props.selection === 'none') return
  const current = pendingModel !== undefined ? pendingModel : model.value
  let next: MdvChipSetModelValue
  if (props.selection === 'multiple') {
    const values = Array.isArray(current) ? current : []
    next = values.some((item) => Object.is(item, value))
      ? values.filter((item) => !Object.is(item, value))
      : [...values, value]
  } else {
    next = Object.is(current, value) ? null : value
  }
  pendingModel = next
  model.value = next
  const revision = ++modelRevision
  void nextTick(() => {
    if (revision === modelRevision) pendingModel = undefined
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || props.disabled)
    return
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const actions = enabledActions()
  const current = actions.findIndex((action) => action.element === event.target)
  if (current < 0 || !root.value) return
  const rtl =
    (getComputedStyle(root.value).direction || root.value.closest('[dir]')?.getAttribute('dir')) ===
    'rtl'
  const forward = event.key === 'ArrowRight' ? !rtl : rtl
  const index =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? actions.length - 1
        : (current + (forward ? 1 : -1) + actions.length) % actions.length
  const next = actions[index]
  if (!next) return
  event.preventDefault()
  selectTabStop(next)
  next.element.focus()
  syncTabIndices()
  if (props.scrollable) next.element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}

provide(mdvChipSetKey, {
  disabled: computed(() => props.disabled),
  selection: computed(() => props.selection),
  isSelected,
  toggle,
  register,
  tabIndex: (id, part) => (activeId.value === id && activePart.value === part ? 0 : -1),
  syncTabIndices,
})

watch([model, () => props.disabled, () => props.selection], () => syncTabIndices(), {
  flush: 'post',
})
onMounted(() => syncTabIndices(true))
onUpdated(() => syncTabIndices())
onActivated(() => {
  active = true
  syncTabIndices()
})
onDeactivated(() => {
  active = false
})
onBeforeUnmount(() => {
  disposed = true
  pendingModel = undefined
  chips = []
})

defineExpose({
  focus: (options?: FocusOptions) => {
    syncTabIndices()
    const target = enabledActions().find(
      (action) => action.chip.id === activeId.value && action.part === activePart.value,
    )
    const focusTarget = target?.element ?? root.value
    focusTarget?.focus(options)
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
    :class="['mdv-chip-set', { 'mdv-chip-set--scrollable': props.scrollable }]"
    role="toolbar"
    aria-orientation="horizontal"
    tabindex="-1"
    @focusin="syncTabIndices()"
    @keydown="handleKeydown"
  >
    <span v-if="props.label || $slots.label" :id="labelId" class="mdv-chip-set__label">
      <slot name="label">{{ props.label }}</slot>
    </span>
    <div class="mdv-chip-set__items"><slot /></div>
  </div>
</template>
