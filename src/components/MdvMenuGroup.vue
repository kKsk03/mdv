<script setup lang="ts">
import { computed, provide, ref, useId } from 'vue'
import type { VNode } from 'vue'
import { menuGroupKey } from './menu-context'
import type { MdvMenuModelValue, MdvMenuSelectionMode, MdvMenuValue } from './menu.types'

defineOptions({ name: 'MdvMenuGroup' })
const props = withDefaults(
  defineProps<{
    modelValue?: MdvMenuModelValue
    selectionMode?: MdvMenuSelectionMode
    label?: string
  }>(),
  { selectionMode: 'none', label: '' },
)
const emit = defineEmits<{
  'update:modelValue': [value: MdvMenuModelValue]
  change: [value: MdvMenuModelValue]
}>()
const slots = defineSlots<{ default?(): VNode[]; label?(): VNode[] }>()
const localValue = ref<MdvMenuModelValue>(props.selectionMode === 'multiple' ? [] : null)
const value = computed(() => (props.modelValue === undefined ? localValue.value : props.modelValue))
const labelId = 'mdv-menu-group-' + useId()

function selected(candidate: MdvMenuValue | undefined) {
  if (candidate === undefined || props.selectionMode === 'none') return false
  return props.selectionMode === 'multiple'
    ? Array.isArray(value.value) && value.value.includes(candidate)
    : value.value === candidate
}

function select(candidate: MdvMenuValue) {
  const next: MdvMenuModelValue =
    props.selectionMode === 'multiple'
      ? selected(candidate)
        ? (Array.isArray(value.value) ? value.value : []).filter((item) => item !== candidate)
        : [...(Array.isArray(value.value) ? value.value : []), candidate]
      : candidate
  if (props.selectionMode !== 'none') {
    if (props.modelValue === undefined) localValue.value = next
    emit('update:modelValue', next)
    emit('change', next)
  }
  return next
}

provide(menuGroupKey, { selectionMode: computed(() => props.selectionMode), selected, select })
</script>

<template>
  <div
    class="mdv-menu-group"
    role="group"
    :aria-labelledby="props.label || slots.label ? labelId : undefined"
  >
    <div v-if="props.label || slots.label" :id="labelId" class="mdv-menu-group__label">
      <slot name="label">{{ props.label }}</slot>
    </div>
    <slot />
  </div>
</template>
