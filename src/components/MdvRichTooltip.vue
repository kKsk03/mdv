<script setup lang="ts">
import { useAttrs } from 'vue'
import type { VNode } from 'vue'
import { useTooltip } from './use-tooltip'
import type { TooltipEmits } from './use-tooltip'
import type {
  MdvRichTooltipProps,
  MdvTooltipSlotProps,
  MdvTooltipTriggerSlotProps,
} from './tooltip.types'

defineOptions({ name: 'MdvRichTooltip', inheritAttrs: false })
const props = withDefaults(defineProps<MdvRichTooltipProps>(), { modelValue: undefined })
const emit = defineEmits<TooltipEmits>()
const slots = defineSlots<{
  trigger?(props: MdvTooltipTriggerSlotProps): VNode[]
  title?(props: MdvTooltipSlotProps): VNode[]
  default?(props: MdvTooltipSlotProps): VNode[]
  actions?(props: MdvTooltipSlotProps): VNode[]
}>()
const attrs = useAttrs()
const tooltip = useTooltip(props, emit, true)
const panel = tooltip.panel

function labelledBy() {
  return typeof attrs['aria-labelledby'] === 'string'
    ? attrs['aria-labelledby']
    : attrs['aria-label']
      ? undefined
      : props.title || slots.title
        ? tooltip.id + '-title'
        : undefined
}

function accessibleLabel() {
  return typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : undefined
}

function describedBy() {
  return typeof attrs['aria-describedby'] === 'string'
    ? attrs['aria-describedby']
    : tooltip.id + '-text'
}

defineExpose({ open: tooltip.open, close: tooltip.close, toggle: tooltip.toggle })
</script>

<template>
  <slot
    name="trigger"
    :trigger-props="tooltip.triggerProps"
    :open="tooltip.isOpen.value"
    :close="tooltip.close"
  />
  <div
    v-bind="$attrs"
    :id="tooltip.id"
    ref="panel"
    v-show="tooltip.rendered.value"
    popover="manual"
    role="dialog"
    aria-modal="false"
    :aria-label="accessibleLabel()"
    :aria-labelledby="labelledBy()"
    :aria-describedby="describedBy()"
    class="mdv-rich-tooltip"
    data-mdv-tooltip-panel
    :data-phase="tooltip.phase.value"
    :aria-hidden="
      tooltip.phase.value === 'closed' || tooltip.phase.value === 'closing' || undefined
    "
    :inert="tooltip.phase.value === 'closed' || tooltip.phase.value === 'closing' || undefined"
    v-on="tooltip.panelEvents"
  >
    <div
      v-if="props.title || slots.title"
      :id="tooltip.id + '-title'"
      class="mdv-rich-tooltip__title"
    >
      <slot name="title" :open="tooltip.isOpen.value" :close="tooltip.close">{{
        props.title
      }}</slot>
    </div>
    <div :id="tooltip.id + '-text'" class="mdv-rich-tooltip__text">
      <slot :open="tooltip.isOpen.value" :close="tooltip.close">{{ props.text }}</slot>
    </div>
    <div v-if="slots.actions" class="mdv-rich-tooltip__actions">
      <slot name="actions" :open="tooltip.isOpen.value" :close="tooltip.close" />
    </div>
  </div>
</template>
