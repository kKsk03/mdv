<script setup lang="ts">
import {
  computed,
  inject,
  mergeProps,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  useAttrs,
  useId,
  useTemplateRef,
} from 'vue'
import type { HTMLAttributes, ObjectDirective, StyleValue, VNode } from 'vue'
import check from '@iconify-icons/material-symbols/check'
import MdvIcon from './MdvIcon.vue'
import { useButtonRipple } from './button-ripple'
import { mdvSegmentedButtonKey } from './segmented-button-context'
import type { MdvSegmentedButtonValue } from './segmented-button.types'

defineOptions({ name: 'MdvSegmentedButtonItem', inheritAttrs: false })
const slots = defineSlots<{
  default?(props: { selected: boolean }): VNode[]
  leading?(props: { selected: boolean }): VNode[]
  'selected-icon'?(props: { selected: boolean }): VNode[]
}>()
const props = withDefaults(
  defineProps<{
    value: MdvSegmentedButtonValue
    label?: string
    disabled?: boolean
  }>(),
  { label: '', disabled: false },
)

const context = inject(mdvSegmentedButtonKey, undefined)
const attrs = useAttrs()
const control = useTemplateRef<HTMLInputElement>('control')
const surface = useTemplateRef<HTMLSpanElement>('surface')
const itemId = `mdv-segmented-button-item-${useId()}`
const controlId = computed(() => (typeof attrs.id === 'string' && attrs.id ? attrs.id : itemId))
const selected = computed(() => context?.isSelected(props.value) ?? false)
const disabled = computed(() => props.disabled || !context || context.disabled.value)
const hasLabel = computed(() => !!props.label || !!slots.default)
const hasLeading = computed(() => !!slots.leading)
const showSelectedIcon = computed(() => context?.showSelectedIcon.value ?? true)
const initialChecked = context?.isInitiallySelected(props.value) ?? false
let preHydrationChecked: boolean | undefined
let disposed = false
let syncTimer: ReturnType<typeof setTimeout> | undefined
let activation: { changed: boolean; checked: boolean } | undefined
const activationTimers = new Set<ReturnType<typeof setTimeout>>()

// Hydration 写入受控 checked 前，保存用户在服务端首屏已经做出的原生选择。
const vNativeState: ObjectDirective<HTMLInputElement> = {
  created(element) {
    if (element.defaultChecked === initialChecked && element.checked !== initialChecked) {
      preHydrationChecked = element.checked
    }
  },
}

function nativeDisabled() {
  return disabled.value || !!control.value?.matches(':disabled')
}

const unregister = context?.register({
  id: itemId,
  value: () => props.value,
  input: () => control.value,
  disabled: () => disabled.value || (attrs.hidden != null && attrs.hidden !== false),
  activating: () => activation !== undefined,
})

function outerAttrs(): HTMLAttributes {
  return {
    class: attrs.class as HTMLAttributes['class'],
    style: attrs.style as StyleValue,
    dir: typeof attrs.dir === 'string' ? attrs.dir : undefined,
    lang: typeof attrs.lang === 'string' ? attrs.lang : undefined,
    hidden: attrs.hidden as HTMLAttributes['hidden'],
  }
}

function controlAttrs() {
  const result = { ...attrs }
  for (const key of [
    'class',
    'style',
    'dir',
    'lang',
    'hidden',
    'type',
    'checked',
    'defaultChecked',
    'defaultchecked',
    'value',
    'role',
    'tabindex',
    'name',
    'form',
  ]) {
    delete result[key]
  }
  result.id = controlId.value
  result.name = context?.name.value
  result.form = context?.form.value
  result.tabindex = disabled.value ? -1 : (context?.tabIndex(itemId) ?? -1)
  result['aria-checked'] = String(selected.value)
  // 使用方的原生监听先执行；input/change 只由原生激活或显式取消单选产生一次。
  return mergeProps(result, {
    onClick: handleClick,
    onInput: handleInput,
    onChange: handleInput,
    onKeydown: handleKeydown,
  })
}

function scheduleNativeSync() {
  context?.scheduleSync()
  if (syncTimer !== undefined) return
  // cancelled activation 的 checked 回滚发生在 click 分发结束后，再补一次同步。
  syncTimer = setTimeout(() => {
    syncTimer = undefined
    if (!disposed) context?.scheduleSync()
  }, 0)
}

function handleClick(event: MouseEvent) {
  if (nativeDisabled()) {
    event.preventDefault()
    return
  }
  const wasSelected = context?.isCurrentlySelected(props.value) ?? false
  if (wasSelected && !context?.canDeselect(props.value)) {
    // 尤其阻止 checkbox 原生取消最后一项，避免发出和模型矛盾的 input/change。
    event.preventDefault()
  }
  const element = control.value
  const currentActivation = { changed: false, checked: element?.checked ?? false }
  activation = currentActivation
  // 使用任务边界等待整次原生激活结束，包括祖先取消 click 与随后的 input/change。
  const timer = setTimeout(() => {
    activationTimers.delete(timer)
    const latest = activation === currentActivation
    if (latest) activation = undefined
    if (disposed) return
    scheduleNativeSync()
    if (!element || element !== control.value || nativeDisabled()) return
    if (
      latest &&
      !event.defaultPrevented &&
      !currentActivation.changed &&
      wasSelected &&
      context?.selection.value === 'single' &&
      context.isCurrentlySelected(props.value) &&
      context.canDeselect(props.value)
    ) {
      // 原生 radio 再次激活不产生 change；只补全取消，后续选择已经取代本次取消时不覆盖它。
      element.checked = false
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }, 0)
  activationTimers.add(timer)
}

function handleInput(event: Event) {
  if (nativeDisabled() || event.defaultPrevented || !context) return
  // input 与 change 属于同一次激活；即使父级在两者之间拒绝更新，也只请求一次模型变更。
  if (activation?.changed) return
  const checked = activation?.checked ?? (event.currentTarget as HTMLInputElement).checked
  if (activation) activation.changed = true
  context.setSelected(props.value, checked)
  scheduleNativeSync()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  if (nativeDisabled()) {
    if (['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
      event.preventDefault()
    return
  }
  context?.handleKeydown(event)
  if (event.defaultPrevented) return
  if (event.key === ' ' || event.key === 'Enter') showRipple(event)
  if (event.key === 'Enter') {
    event.preventDefault()
    if (!event.repeat) control.value?.click()
  }
}

const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: nativeDisabled,
  isLink: () => false,
  surface: () => surface.value,
})

onMounted(() => {
  if (preHydrationChecked !== undefined) {
    context?.setSelected(props.value, preHydrationChecked)
    preHydrationChecked = undefined
  }
  context?.syncForm()
  scheduleNativeSync()
})
onUpdated(() => context?.scheduleSync())
onDeactivated(() => {
  ripple.value = null
})
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(syncTimer)
  for (const timer of activationTimers) clearTimeout(timer)
  activationTimers.clear()
  activation = undefined
  unregister?.()
})

if (import.meta.env.DEV && !context) {
  console.warn('[MDV] MdvSegmentedButtonItem must be a child of MdvSegmentedButton.')
}

defineExpose({
  focus: (options?: FocusOptions) => control.value?.focus(options),
  blur: () => control.value?.blur(),
})
</script>

<template>
  <label
    v-bind="outerAttrs()"
    class="mdv-segmented-button__item"
    :class="{
      'mdv-segmented-button__item--selected': selected,
      'mdv-segmented-button__item--has-label': hasLabel,
      'mdv-segmented-button__item--has-leading': hasLeading,
      'mdv-segmented-button__item--show-selected-icon': showSelectedIcon,
    }"
    :for="controlId"
    @pointerdown="showRipple"
    @pointerup="releaseRipple"
    @pointercancel="releaseRipple"
    @pointerleave="releaseRipple"
    @keyup="releaseRipple"
    @focusout="releaseRipple"
  >
    <input
      ref="control"
      v-native-state
      v-bind="controlAttrs()"
      class="mdv-segmented-button__input"
      :type="context?.selection.value === 'multiple' ? 'checkbox' : 'radio'"
      :value="props.value"
      :checked="selected"
      :disabled="disabled"
    />
    <span ref="surface" class="mdv-segmented-button__surface" aria-hidden="true">
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-segmented-button__ripple"
        :class="{ 'mdv-segmented-button__ripple--released': ripple.released }"
        @animationend="finishRipple"
      >
        <span
          class="mdv-segmented-button__ripple-wave"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }"
        />
      </span>
    </span>
    <span class="mdv-segmented-button__content">
      <span
        v-if="hasLeading"
        class="mdv-segmented-button__icon mdv-segmented-button__leading"
        aria-hidden="true"
      >
        <slot name="leading" :selected="selected" />
      </span>
      <span v-if="hasLabel" class="mdv-segmented-button__label">
        <slot :selected="selected">{{ props.label }}</slot>
      </span>
      <span
        v-if="showSelectedIcon"
        class="mdv-segmented-button__icon mdv-segmented-button__check"
        aria-hidden="true"
      >
        <slot name="selected-icon" :selected="selected"><MdvIcon :icon="check" /></slot>
      </span>
    </span>
  </label>
</template>
