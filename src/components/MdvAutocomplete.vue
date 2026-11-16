<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ComponentPublicInstance, VNode } from 'vue'
import MdvSelectControl from './_MdvSelectControl.vue'
import type { MdvAutocompleteProps, MdvSelectOptionSlotProps, MdvSelectValue } from './select.types'

defineOptions({ name: 'MdvAutocomplete', inheritAttrs: false })
const props = withDefaults(defineProps<MdvAutocompleteProps>(), { open: undefined })
const emit = defineEmits<{
  'update:modelValue': [value: MdvSelectValue | null]
  'update:open': [open: boolean]
  select: [option: MdvAutocompleteProps['options'][number]]
  search: [query: string]
}>()
defineSlots<{ option?(props: MdvSelectOptionSlotProps): VNode[] }>()
const control = useTemplateRef<
  ComponentPublicInstance & {
    focus(options?: FocusOptions): void
    blur(): void
    open(): void
    close(): void
    checkValidity(): boolean
    reportValidity(): boolean
    setCustomValidity(message: string): void
  }
>('control')

defineExpose({
  focus: (options?: FocusOptions) => control.value?.focus(options),
  blur: () => control.value?.blur(),
  open: () => control.value?.open(),
  close: () => control.value?.close(),
  checkValidity: () => control.value?.checkValidity() ?? true,
  reportValidity: () => control.value?.reportValidity() ?? true,
  setCustomValidity: (message: string) => control.value?.setCustomValidity(message),
})
</script>

<template>
  <MdvSelectControl
    ref="control"
    v-bind="{ ...props, ...$attrs }"
    mode="autocomplete"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="emit('update:open', $event)"
    @select="emit('select', $event)"
    @search="emit('search', $event)"
  >
    <template v-if="$slots.option" #option="slotProps">
      <slot name="option" v-bind="slotProps" />
    </template>
  </MdvSelectControl>
</template>
