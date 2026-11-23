<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { VNode } from 'vue'
import check from '@iconify-icons/material-symbols/check'
import MdvIcon from './MdvIcon.vue'
import { useButtonRipple } from './button-ripple'
import type { MdvSelectOption } from './select.types'

defineOptions({ name: 'MdvSelectOption' })

const props = defineProps<{
  option: MdvSelectOption
  selected: boolean
  active: boolean
}>()
const emit = defineEmits<{
  select: [event: MouseEvent]
  activate: [event: PointerEvent]
}>()
defineSlots<{ default?(): VNode[] }>()

const element = useTemplateRef<HTMLElement>('element')
const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => !!props.option.disabled,
  isLink: () => false,
  surface: () =>
    element.value?.querySelector<HTMLElement>('.mdv-select-control__option-surface') ??
    element.value,
})

function preserveFocus(event: MouseEvent) {
  // listbox 的活动项通过 aria-activedescendant 表示；按压选项时仍由输入框持有焦点。
  if (event.button === 0) event.preventDefault()
}

function select(event: MouseEvent) {
  if (props.option.disabled || event.button !== 0 || event.defaultPrevented) return
  emit('select', event)
}
</script>

<template>
  <div
    ref="element"
    class="mdv-select-control__option"
    :class="{
      'is-active': props.active,
      'is-selected': props.selected,
      'is-disabled': props.option.disabled,
    }"
    role="option"
    :aria-selected="props.selected ? 'true' : 'false'"
    :aria-disabled="props.option.disabled ? 'true' : undefined"
    @pointermove="emit('activate', $event)"
    @pointerdown="showRipple"
    @pointerup="releaseRipple"
    @pointercancel="releaseRipple"
    @pointerleave="releaseRipple"
    @mousedown="preserveFocus"
    @click.stop="select"
  >
    <span class="mdv-select-control__option-surface" aria-hidden="true">
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-select-control__ripple"
        :class="{ 'is-released': ripple.released }"
        @animationend="finishRipple"
      >
        <span
          class="mdv-select-control__ripple-wave"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }"
        />
      </span>
    </span>
    <span
      class="mdv-select-control__check"
      :class="{ 'is-selected': props.selected }"
      aria-hidden="true"
    >
      <MdvIcon :icon="check" />
    </span>
    <span class="mdv-select-control__option-content">
      <slot>
        <span class="mdv-select-control__option-label">{{ props.option.label }}</span>
        <span v-if="props.option.supportingText" class="mdv-select-control__option-supporting">
          {{ props.option.supportingText }}
        </span>
      </slot>
    </span>
  </div>
</template>
