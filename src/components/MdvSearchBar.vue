<script setup lang="ts">
import {
  computed,
  mergeProps,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { ObjectDirective, StyleValue, VNode } from 'vue'
import searchIcon from '@iconify-icons/material-symbols/search'
import closeIcon from '@iconify-icons/material-symbols/close'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { useButtonRipple } from './button-ripple'
import { useSearchKeyboardFocus } from './search-focus'
import type { MdvSearchBarProps } from './search.types'

defineOptions({ name: 'MdvSearchBar', inheritAttrs: false })
const props = withDefaults(defineProps<MdvSearchBarProps>(), {
  disabled: false,
  readonly: false,
  clearable: true,
  loading: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string, originalEvent: KeyboardEvent]
  clear: []
}>()
defineSlots<{ leading?(): VNode[]; trailing?(): VNode[] }>()
const attrs = useAttrs()
const element = useTemplateRef<HTMLDivElement>('element')
const input = useTemplateRef<HTMLInputElement>('input')
const keyboardFocus = useSearchKeyboardFocus(element)
const draft = ref(props.modelValue ?? '')
const composing = ref(false)
const local = ref(props.modelValue ?? '')
let mounted = false
let active = true
let preserved: string | undefined
let compositionCommit = false
let form: HTMLFormElement | null = null
const initial = draft.value
const value = computed(() => props.modelValue ?? local.value)
const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => props.disabled,
  isLink: () => false,
  surface: () => element.value,
})

// 保存 hydration 前真实用户的编辑，Vue 的 value patch 之后恢复并提交一次。
const vPreserveSearch: ObjectDirective<HTMLInputElement> = {
  created(control) {
    if (!mounted && control.defaultValue === initial && control.value !== initial)
      preserved = control.value
  },
  mounted(control) {
    if (preserved === undefined) return
    control.value = draft.value = preserved
    commit(preserved)
  },
}
onMounted(() => {
  mounted = true
  syncDefaultValue()
  connectForm()
})
onUpdated(() => {
  syncDefaultValue()
  if (active) connectForm()
})
onActivated(() => {
  active = true
  connectForm()
})
onDeactivated(() => {
  active = false
  disconnectForm()
})
onBeforeUnmount(() => {
  mounted = false
  disconnectForm()
})
watch(
  () => props.modelValue,
  (next) => {
    if (next !== undefined) local.value = next
    if (!composing.value) draft.value = value.value
  },
)

function commit(next: string) {
  local.value = next
  draft.value = next
  emit('update:modelValue', next)
  void nextTick(() => {
    if (composing.value) return
    draft.value = value.value
    if (input.value && input.value.value !== draft.value) input.value.value = draft.value
  })
}
function reset(event: Event) {
  const control = input.value
  const owner = event.currentTarget
  queueMicrotask(() => {
    if (
      !mounted ||
      !active ||
      event.defaultPrevented ||
      input.value !== control ||
      control?.form !== owner
    )
      return
    composing.value = false
    commit(initial)
  })
}
function syncDefaultValue() {
  const control = input.value
  if (!control || control.defaultValue === initial) return
  const current = control.value
  control.defaultValue = initial
  control.value = current
}
function disconnectForm() {
  form?.removeEventListener('reset', reset)
  form = null
}
function connectForm() {
  const next = input.value?.form ?? null
  if (next === form) return
  disconnectForm()
  form = next
  form?.addEventListener('reset', reset)
}
function onInput(event: Event) {
  const next = (event.target as HTMLInputElement).value
  draft.value = next
  if (composing.value || props.readonly || props.disabled || compositionCommit) return
  commit(next)
}
function compositionEnd(event: CompositionEvent) {
  composing.value = false
  if (props.disabled || props.readonly) return
  compositionCommit = true
  commit((event.target as HTMLInputElement).value)
  // 浏览器紧接 compositionend 派发最后一次 input；不重复提交该值。
  queueMicrotask(() => {
    compositionCommit = false
  })
}
function keydown(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.key !== 'Enter' ||
    event.repeat ||
    event.isComposing ||
    composing.value ||
    compositionCommit ||
    event.keyCode === 229 ||
    props.disabled
  )
    return
  event.preventDefault()
  emit('search', draft.value, event)
}
function clear() {
  if (props.disabled || props.readonly) return
  commit('')
  emit('clear')
  input.value?.focus({ preventScroll: true })
}
function inputAttrs() {
  const result = { ...attrs }
  delete result.class
  delete result.style
  return mergeProps(
    { 'aria-label': props.label ?? props.placeholder, autocomplete: 'off', enterkeyhint: 'search' },
    result,
    {
      type: 'search',
      disabled: props.disabled,
      readonly: props.readonly,
      placeholder: props.placeholder,
      'aria-busy': props.loading ? 'true' : undefined,
    },
  )
}
defineExpose({
  element,
  inputElement: input,
  focus: (options?: FocusOptions) => input.value?.focus(options),
  blur: () => input.value?.blur(),
})
</script>

<template>
  <div
    ref="element"
    class="mdv-search-bar"
    :class="[
      attrs.class,
      { 'mdv-search-bar--disabled': disabled, 'mdv-search-bar--keyboard-focus': keyboardFocus },
    ]"
    :style="attrs.style as StyleValue"
    :dir="typeof attrs.dir === 'string' ? attrs.dir : undefined"
  >
    <span class="mdv-search-bar__state" aria-hidden="true">
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-button__ripple"
        :class="{ 'mdv-button__ripple--released': ripple.released }"
        @animationend="finishRipple"
      >
        <span
          class="mdv-button__ripple-wave"
          :style="{
            left: ripple.x + 'px',
            top: ripple.y + 'px',
            width: ripple.size + 'px',
            height: ripple.size + 'px',
          }"
        />
      </span>
    </span>
    <div class="mdv-search-bar__leading">
      <slot name="leading"><MdvIcon :icon="searchIcon" /></slot>
    </div>
    <input
      ref="input"
      v-preserve-search
      v-bind="inputAttrs()"
      :value="draft"
      class="mdv-search-bar__input"
      @input="onInput"
      @compositionstart="composing = true"
      @compositionend="compositionEnd"
      @keydown="keydown"
      @pointerdown="showRipple"
      @pointerup="releaseRipple"
      @pointerleave="releaseRipple"
      @pointercancel="releaseRipple"
      @blur="releaseRipple"
    />
    <div
      v-if="(clearable && draft && !readonly) || $slots.trailing"
      class="mdv-search-bar__trailing"
    >
      <MdvIconButton
        v-if="clearable && draft && !readonly"
        variant="standard"
        :disabled="disabled"
        :aria-label="clearLabel"
        @click="clear"
        ><MdvIcon :icon="closeIcon"
      /></MdvIconButton>
      <slot name="trailing" />
    </div>
  </div>
</template>
