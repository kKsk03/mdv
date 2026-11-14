<script setup lang="ts">
import { useTemplateRef } from 'vue'
import DatePicker from './_MdvDatePicker.vue'
import type {
  MdvDatePickerProps,
  MdvDatePickerExpose,
  MdvDatePickerSlots,
  MdvDatePickerCloseDetail,
  MdvDateValue,
} from './date-picker.types'

defineOptions({ name: 'MdvDatePicker', inheritAttrs: false })
defineSlots<MdvDatePickerSlots>()
const props = defineProps<Omit<MdvDatePickerProps, 'modelValue' | 'open'>>()
const value = defineModel<MdvDateValue>({ default: null })
const opened = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  confirm: [value: MdvDateValue]
  cancel: [detail: MdvDatePickerCloseDetail]
  open: []
  opened: []
  close: [detail: MdvDatePickerCloseDetail]
  closed: [detail: MdvDatePickerCloseDetail]
}>()
const picker = useTemplateRef<MdvDatePickerExpose>('picker')
defineExpose<MdvDatePickerExpose>({
  open: (event) => picker.value?.open(event) ?? Promise.resolve(false),
  close: () => picker.value?.close() ?? Promise.resolve(false),
  focus: (options) => picker.value?.focus(options),
  checkValidity: () => picker.value?.checkValidity() ?? true,
  reportValidity: () => picker.value?.reportValidity() ?? true,
  setCustomValidity: (message) => picker.value?.setCustomValidity(message),
})
</script>

<template>
  <DatePicker
    ref="picker"
    v-bind="{ ...$attrs, ...props }"
    v-model:open="opened"
    :model-value="value"
    @update:model-value="value = $event as MdvDateValue"
    @confirm="emit('confirm', $event as MdvDateValue)"
    @cancel="emit('cancel', $event)"
    @open="emit('open')"
    @opened="emit('opened')"
    @close="emit('close', $event)"
    @closed="emit('closed', $event)"
  >
    <template v-if="$slots.trigger" #trigger="scope"
      ><slot name="trigger" v-bind="scope"
    /></template>
    <template v-if="$slots.title" #title><slot name="title" /></template>
  </DatePicker>
</template>
