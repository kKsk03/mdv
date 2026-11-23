<script setup lang="ts">
import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom'
import arrowDropDown from '@iconify-icons/material-symbols/arrow-drop-down'
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { ComponentPublicInstance, StyleValue } from 'vue'
import MdvIcon from './MdvIcon.vue'
import MdvTextField from './MdvTextField.vue'
import MdvSelectOptionItem from './_MdvSelectOption.vue'
import type { MdvAutocompleteFilterMode, MdvSelectOption, MdvSelectValue } from './select.types'

defineOptions({ name: 'MdvSelectControl', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    mode: 'select' | 'autocomplete'
    modelValue?: MdvSelectValue | null
    options?: readonly MdvSelectOption[]
    variant?: 'filled' | 'outlined'
    menuVariant?: 'expressive' | 'baseline'
    label?: string
    placeholder?: string
    supportingText?: string
    error?: boolean
    errorText?: string
    disabled?: boolean
    required?: boolean
    name?: string
    form?: string
    fullWidth?: boolean
    open?: boolean
    filterMode?: MdvAutocompleteFilterMode
    loading?: boolean
    loadingText?: string
    noOptionsText?: string
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    variant: 'outlined',
    menuVariant: 'expressive',
    label: '',
    placeholder: '',
    supportingText: '',
    error: false,
    errorText: '',
    disabled: false,
    required: false,
    fullWidth: false,
    open: undefined,
    filterMode: 'local',
    loading: false,
    loadingText: '正在加载…',
    noOptionsText: '没有匹配项',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: MdvSelectValue | null]
  'update:open': [open: boolean]
  select: [option: MdvSelectOption]
  search: [query: string]
}>()

const attrs = useAttrs()
const root = useTemplateRef<HTMLElement>('root')
const panel = useTemplateRef<HTMLElement>('panel')
const viewport = useTemplateRef<HTMLElement>('viewport')
const hiddenValue = useTemplateRef<HTMLInputElement>('hiddenValue')
const validityProxy = useTemplateRef<HTMLSelectElement>('validityProxy')
const field = useTemplateRef<ComponentPublicInstance & { focus(options?: FocusOptions): void }>(
  'field',
)
const id = `mdv-combobox-${useId()}`
const listboxId = `${id}-listbox`
const internalValue = ref<MdvSelectValue | null>(props.modelValue ?? null)
const modelValue = computed(() =>
  props.modelValue === undefined ? internalValue.value : props.modelValue,
)
const initialValue = modelValue.value
const internalOpen = ref(false)
const isOpen = computed(() => props.open ?? internalOpen.value)
const displayText = ref(displayFor(modelValue.value))
const searchQuery = ref('')
const activeIndex = ref(-1)
const keyboard = ref(false)
const positioned = ref(false)
const panelRendered = ref(false)
const live = ref(true)
const nativeInvalid = ref(false)
const nativeErrorText = ref('')
const isTyping = ref(false)
let stopPositioning: (() => void) | undefined
let resetForm: HTMLFormElement | null = null
let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let resetPending = false
let panelTransition = 0
let panelAnimation: Animation | undefined

function optionFor(value: MdvSelectValue | null | undefined) {
  return value === null || value === undefined
    ? undefined
    : props.options.find((option) => Object.is(option.value, value))
}

function displayFor(value: MdvSelectValue | null | undefined) {
  if (value === null || value === undefined) return ''
  return optionFor(value)?.label ?? String(value)
}

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (props.mode !== 'autocomplete' || props.filterMode === 'external' || query.length === 0)
    return props.options
  return props.options.filter((option) => option.label.toLocaleLowerCase().includes(query))
})
const requiredInvalid = computed(() => {
  if (!props.required) return false
  if (props.mode === 'select') return modelValue.value === null || modelValue.value === ''
  return modelValue.value === null || String(modelValue.value).length === 0
})

function optionId(index: number) {
  return `${listboxId}-option-${index}`
}

function firstEnabledIndex(from = 0, direction: 1 | -1 = 1) {
  for (let index = from; index >= 0 && index < filteredOptions.value.length; index += direction) {
    if (!filteredOptions.value[index]?.disabled) return index
  }
  return -1
}

function initialActiveIndex() {
  const selected = filteredOptions.value.findIndex(
    (option) => Object.is(option.value, modelValue.value) && !option.disabled,
  )
  return selected >= 0 ? selected : firstEnabledIndex()
}

function setOpen(next: boolean) {
  if ((props.disabled || isEffectivelyDisabled()) && next) return
  if (next === isOpen.value) return
  emit('update:open', next)
  if (props.open !== undefined) return
  internalOpen.value = next
  activeIndex.value = next ? initialActiveIndex() : -1
}

function focus(options?: FocusOptions) {
  field.value?.focus(options)
}

function isEffectivelyDisabled() {
  return !!root.value
    ?.querySelector<HTMLInputElement>('.mdv-text-field__input')
    ?.matches(':disabled')
}

function choose(option: MdvSelectOption, event?: Event) {
  if (option.disabled || props.disabled || isEffectivelyDisabled() || event?.defaultPrevented)
    return
  isTyping.value = false
  nativeInvalid.value = false
  nativeErrorText.value = ''
  if (props.modelValue === undefined) internalValue.value = option.value
  emit('update:modelValue', option.value)
  emit('select', option)
  setOpen(false)
  nextTick(() => focus({ preventScroll: true }))
}

function handleInput(value: string | number) {
  if (resetPending || props.mode !== 'autocomplete' || props.disabled || isEffectivelyDisabled())
    return
  const text = String(value)
  nativeInvalid.value = false
  nativeErrorText.value = ''
  displayText.value = text
  searchQuery.value = text
  isTyping.value = true
  if (props.modelValue === undefined) internalValue.value = text
  emit('update:modelValue', text)
  emit('search', text)
  if (!isOpen.value) setOpen(true)
  else activeIndex.value = firstEnabledIndex()
}

function handleClick(event: MouseEvent) {
  if (
    props.disabled ||
    isEffectivelyDisabled() ||
    (event.target instanceof Node && panel.value?.contains(event.target))
  )
    return
  keyboard.value = false
  focus({ preventScroll: true })
  if (props.mode === 'select') setOpen(!isOpen.value)
  else setOpen(true)
}

function activateOption(index: number, event: PointerEvent) {
  if (event.pointerType && event.pointerType !== 'mouse') return
  keyboard.value = false
  activeIndex.value = filteredOptions.value[index]?.disabled ? -1 : index
}

function moveActive(direction: 1 | -1) {
  if (!isOpen.value) {
    setOpen(true)
    return
  }
  const start =
    activeIndex.value < 0
      ? direction === 1
        ? 0
        : filteredOptions.value.length - 1
      : activeIndex.value + direction
  const next = firstEnabledIndex(start, direction)
  if (next >= 0) activeIndex.value = next
}

function commitActive() {
  const option = filteredOptions.value[activeIndex.value]
  if (option) choose(option)
}

function handleSelectTypeahead(key: string) {
  typeahead += key.toLocaleLowerCase()
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => (typeahead = ''), 600)
  const start = activeIndex.value >= 0 ? activeIndex.value + 1 : 0
  const options = filteredOptions.value
  const ordered = [...options.slice(start), ...options.slice(0, start)]
  const match = ordered.find(
    (option) => !option.disabled && option.label.toLocaleLowerCase().startsWith(typeahead),
  )
  if (match) {
    const index = options.indexOf(match)
    activeIndex.value = index
    if (!isOpen.value) setOpen(true)
    choose(match)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled || event.isComposing || event.keyCode === 229) return
  keyboard.value = true
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    setOpen(false)
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    return
  }
  if (event.key === 'Enter') {
    if (isOpen.value) {
      const active = filteredOptions.value[activeIndex.value]
      if (active && !active.disabled) {
        event.preventDefault()
        choose(active)
      } else if (props.mode === 'select') {
        event.preventDefault()
      }
      return
    }
    if (props.mode === 'select') {
      event.preventDefault()
      setOpen(true)
    }
    return
  }
  if (props.mode === 'select') {
    if (event.key === ' ') {
      event.preventDefault()
      if (isOpen.value) commitActive()
      else setOpen(true)
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      activeIndex.value =
        event.key === 'Home'
          ? firstEnabledIndex()
          : firstEnabledIndex(filteredOptions.value.length - 1, -1)
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      handleSelectTypeahead(event.key)
    }
  }
}

function fieldAttrs() {
  const result = { ...attrs }
  for (const key of ['class', 'style', 'dir', 'lang', 'name', 'value', 'defaultValue'])
    delete result[key]
  result.id = typeof attrs.id === 'string' && attrs.id ? attrs.id : `${id}-input`
  result.name = undefined
  result.form = props.form ?? attrs.form
  result.role = 'combobox'
  result['aria-haspopup'] = 'listbox'
  result['aria-required'] = props.required ? 'true' : attrs['aria-required']
  result['aria-expanded'] = isOpen.value ? 'true' : 'false'
  result['aria-controls'] = isOpen.value ? listboxId : undefined
  result['aria-activedescendant'] =
    isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined
  result['aria-autocomplete'] = props.mode === 'autocomplete' ? 'list' : 'none'
  if (result.autocomplete === undefined) result.autocomplete = 'off'
  return result
}

function rootStyle() {
  return attrs.style as StyleValue
}

function updatePanelPosition(anchor: HTMLElement, floating: HTMLElement) {
  const width = anchor.getBoundingClientRect().width
  floating.style.width = `${width}px`
  return computePosition(anchor, floating, {
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, availableWidth, elements }) {
          elements.floating.style.maxWidth = `${Math.max(0, availableWidth)}px`
          elements.floating.style.setProperty(
            '--mdv-select-menu-available-height',
            `${Math.max(0, Math.min(availableHeight, 360))}px`,
          )
        },
      }),
    ],
  }).then(({ x, y, placement }) => {
    if (disposed || !live.value || !isOpen.value || panel.value !== floating) return
    floating.style.left = `${x}px`
    floating.style.top = `${y}px`
    floating.dataset.side = placement.startsWith('top') ? 'top' : 'bottom'
    positioned.value = true
  })
}

function isPopoverOpen(element: HTMLElement) {
  try {
    return element.matches(':popover-open')
  } catch {
    return false
  }
}

async function positionPanel() {
  await nextTick()
  const floating = panel.value
  const anchor = root.value?.querySelector<HTMLElement>('.mdv-text-field__container')
  if (disposed || !live.value || !floating || !anchor || !isOpen.value) return
  if (typeof floating.showPopover === 'function' && !isPopoverOpen(floating)) {
    try {
      floating.showPopover()
    } catch {
      // Older DOM implementations may expose the method without supporting popovers.
    }
  }
  stopPositioning?.()
  stopPositioning = autoUpdate(anchor, floating, () => void updatePanelPosition(anchor, floating))
  await updatePanelPosition(anchor, floating)
}

function animatePanel(floating: HTMLElement, opening: boolean) {
  const view = floating.ownerDocument.defaultView
  const current = panelAnimation && view?.getComputedStyle(floating)
  const start = current
    ? { transform: current.transform, opacity: current.opacity }
    : { transform: opening ? 'scale(0.8)' : 'none', opacity: opening ? '0' : '1' }
  panelAnimation?.cancel()
  panelAnimation = undefined
  if (
    view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    typeof floating.animate !== 'function'
  )
    return Promise.resolve()
  const animation = floating.animate(
    [start, { transform: opening ? 'none' : 'scale(0.8)', opacity: opening ? '1' : '0' }],
    {
      duration: opening ? 200 : 130,
      easing: opening ? 'cubic-bezier(0.2, 0, 0, 1)' : 'cubic-bezier(0.3, 0, 0.8, 0.15)',
      fill: 'both',
    },
  )
  panelAnimation = animation
  return animation.finished.then(
    () => {},
    () => {},
  )
}

async function syncPanel() {
  const ticket = ++panelTransition
  if (isOpen.value && live.value) {
    panelRendered.value = true
    await positionPanel()
    const floating = panel.value
    if (disposed || ticket !== panelTransition || !floating || !isOpen.value || !live.value) return
    await animatePanel(floating, true)
  } else {
    stopPositioning?.()
    stopPositioning = undefined
    const floating = panel.value
    if (floating && positioned.value && live.value) await animatePanel(floating, false)
    if (disposed || ticket !== panelTransition) return
    if (floating && isPopoverOpen(floating)) floating.hidePopover()
    positioned.value = false
    panelRendered.value = false
  }
  if (disposed || ticket !== panelTransition) return
  panelAnimation?.cancel()
  panelAnimation = undefined
}

function handleOutsidePointer(event: PointerEvent) {
  if (!live.value || !isOpen.value) return
  const target = event.target
  if (!(target instanceof Node) || root.value?.contains(target)) return
  setOpen(false)
}

function syncForm() {
  const nextForm = validityProxy.value?.form ?? hiddenValue.value?.form ?? null
  if (nextForm === resetForm) return
  resetForm?.removeEventListener('reset', handleFormReset)
  resetForm = nextForm
  resetForm?.addEventListener('reset', handleFormReset)
}

function handleFormReset(event: Event) {
  const formElement = event.currentTarget
  resetPending = true
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented || hiddenValue.value?.form !== formElement) {
      resetPending = false
      return
    }
    isTyping.value = false
    searchQuery.value = ''
    nativeInvalid.value = false
    nativeErrorText.value = ''
    displayText.value = displayFor(initialValue)
    if (props.modelValue === undefined) internalValue.value = initialValue
    emit('update:modelValue', initialValue ?? null)
    setOpen(false)
    queueMicrotask(() => (resetPending = false))
  })
}

function handleInvalid(event: Event) {
  event.preventDefault()
  focus({ preventScroll: true })
  const proxy = validityProxy.value
  nativeInvalid.value = true
  nativeErrorText.value = proxy?.validationMessage ?? ''
}

watch(modelValue, (value) => {
  if (props.mode === 'select' || !isTyping.value) displayText.value = displayFor(value)
  if (value !== null && value !== undefined) {
    nativeInvalid.value = false
    nativeErrorText.value = ''
  }
})

watch(
  () => props.options,
  () => {
    if (!isTyping.value) displayText.value = displayFor(modelValue.value)
    void positionPanel()
  },
  { deep: true },
)

watch(
  filteredOptions,
  (options) => {
    if (
      isOpen.value &&
      (activeIndex.value < 0 ||
        activeIndex.value >= options.length ||
        options[activeIndex.value]?.disabled)
    ) {
      activeIndex.value = initialActiveIndex()
    }
  },
  { deep: true },
)

watch(
  [activeIndex, positioned],
  () => {
    const scroller = viewport.value
    const option = scroller?.querySelectorAll<HTMLElement>('[role="option"]')[activeIndex.value]
    if (!positioned.value || !scroller || !option) return
    const top = option.offsetTop
    const bottom = top + option.offsetHeight
    if (top < scroller.scrollTop) scroller.scrollTop = top
    else if (bottom > scroller.scrollTop + scroller.clientHeight)
      scroller.scrollTop = bottom - scroller.clientHeight
  },
  { flush: 'post' },
)

watch(
  [isOpen, live],
  ([open]) => {
    if (open && !isTyping.value) {
      // 选中后保留筛选结果供退出动画使用，下次打开再恢复完整列表。
      searchQuery.value = ''
      activeIndex.value = initialActiveIndex()
    } else if (open && activeIndex.value < 0) activeIndex.value = initialActiveIndex()
    else if (!open) activeIndex.value = -1
    void syncPanel()
  },
  { flush: 'post', immediate: true },
)
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) setOpen(false)
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointer, true)
  syncForm()
})

onUpdated(syncForm)

onActivated(() => {
  live.value = true
})

onDeactivated(() => {
  live.value = false
})

onBeforeUnmount(() => {
  disposed = true
  ++panelTransition
  panelAnimation?.cancel()
  document.removeEventListener('pointerdown', handleOutsidePointer, true)
  resetForm?.removeEventListener('reset', handleFormReset)
  stopPositioning?.()
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  if (panel.value && isPopoverOpen(panel.value)) panel.value.hidePopover()
})

defineExpose({
  focus,
  blur: () => root.value?.querySelector<HTMLInputElement>('.mdv-text-field__input')?.blur(),
  open: () => setOpen(true),
  close: () => setOpen(false),
  checkValidity: () =>
    (validityProxy.value?.checkValidity() ?? true) &&
    (root.value?.querySelector<HTMLInputElement>('.mdv-text-field__input')?.checkValidity() ??
      true),
  reportValidity: () => {
    const proxyValid = validityProxy.value?.reportValidity() ?? true
    const fieldValid =
      root.value?.querySelector<HTMLInputElement>('.mdv-text-field__input')?.reportValidity() ??
      true
    return proxyValid && fieldValid
  },
  setCustomValidity: (message: string) => {
    validityProxy.value?.setCustomValidity(message)
    root.value
      ?.querySelector<HTMLInputElement>('.mdv-text-field__input')
      ?.setCustomValidity(message)
  },
})
</script>

<template>
  <div
    ref="root"
    class="mdv-select-control"
    :class="[
      `mdv-select-control--${props.mode}`,
      `mdv-select-control--menu-${props.menuVariant}`,
      attrs.class,
      { 'mdv-select-control--full-width': props.fullWidth, 'mdv-select-control--open': isOpen },
    ]"
    :style="rootStyle()"
    :dir="typeof attrs.dir === 'string' ? attrs.dir : undefined"
    :lang="typeof attrs.lang === 'string' ? attrs.lang : undefined"
    @click="handleClick"
  >
    <MdvTextField
      ref="field"
      :model-value="displayText"
      :variant="props.variant"
      :label="props.label"
      :placeholder="props.placeholder"
      :supporting-text="props.supportingText"
      :error="props.error || nativeInvalid"
      :error-text="props.errorText || nativeErrorText"
      :disabled="props.disabled"
      :readonly="props.mode === 'select'"
      :required="false"
      full-width
      v-bind="fieldAttrs()"
      @update:model-value="handleInput"
      @focus="props.mode === 'autocomplete' ? setOpen(true) : undefined"
      @blur="setOpen(false)"
      @keydown="handleKeydown"
    >
      <template #trailing>
        <span
          class="mdv-select-control__indicator"
          :class="{ 'is-open': isOpen }"
          aria-hidden="true"
        >
          <MdvIcon :icon="arrowDropDown" />
        </span>
      </template>
    </MdvTextField>

    <input
      ref="hiddenValue"
      class="mdv-select-control__form-value"
      type="hidden"
      :name="modelValue === null || modelValue === undefined ? undefined : props.name"
      :form="props.form ?? (typeof attrs.form === 'string' ? attrs.form : undefined)"
      :value="modelValue ?? ''"
      :disabled="props.disabled"
    />

    <select
      ref="validityProxy"
      class="mdv-select-control__validity-proxy"
      :form="props.form ?? (typeof attrs.form === 'string' ? attrs.form : undefined)"
      :value="requiredInvalid ? '' : 'valid'"
      :required="props.required"
      :disabled="props.disabled"
      aria-hidden="true"
      tabindex="-1"
      @invalid="handleInvalid"
    >
      <option value="" disabled></option>
      <option value="valid"></option>
    </select>

    <div
      v-if="panelRendered"
      ref="panel"
      class="mdv-select-control__panel"
      :data-positioned="positioned"
      :data-mdv-input="keyboard ? 'keyboard' : 'pointer'"
      :inert="!isOpen"
      :aria-hidden="!isOpen || undefined"
      popover="manual"
      @pointerdown="keyboard = false"
    >
      <div ref="viewport" class="mdv-select-control__viewport">
        <div
          v-if="props.loading"
          class="mdv-select-control__status"
          role="status"
          aria-live="polite"
        >
          {{ props.loadingText }}
        </div>
        <div
          v-if="filteredOptions.length === 0 && !props.loading"
          class="mdv-select-control__status"
          role="status"
          aria-live="polite"
        >
          {{ props.noOptionsText }}
        </div>
        <div
          :id="listboxId"
          role="listbox"
          :class="{ 'mdv-select-control__listbox--after-status': props.loading }"
          :aria-busy="props.loading ? 'true' : undefined"
          :aria-label="props.label || (attrs['aria-label'] as string | undefined) || undefined"
        >
          <MdvSelectOptionItem
            v-for="(option, index) in filteredOptions"
            :id="optionId(index)"
            :key="`${typeof option.value}:${String(option.value)}`"
            :option="option"
            :selected="Object.is(option.value, modelValue)"
            :active="activeIndex === index"
            @activate="activateOption(index, $event)"
            @select="choose(option, $event)"
          >
            <template v-if="$slots.option" #default>
              <slot
                name="option"
                :option="option"
                :selected="Object.is(option.value, modelValue)"
                :active="activeIndex === index"
              />
            </template>
          </MdvSelectOptionItem>
        </div>
      </div>
    </div>
  </div>
</template>
