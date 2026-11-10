<script setup lang="ts">
import type { VNode } from 'vue'
import { useTooltip } from './use-tooltip'
import type { TooltipEmits } from './use-tooltip'
import type {
  MdvTooltipProps,
  MdvTooltipSlotProps,
  MdvTooltipTriggerSlotProps,
} from './tooltip.types'

defineOptions({ name: 'MdvTooltip', inheritAttrs: false })
const props = withDefaults(defineProps<MdvTooltipProps>(), { modelValue: undefined })
const emit = defineEmits<TooltipEmits>()
defineSlots<{
  trigger?(props: MdvTooltipTriggerSlotProps): VNode[]
  default?(props: MdvTooltipSlotProps): VNode[]
}>()
const tooltip = useTooltip(props, emit)
const panel = tooltip.panel
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
    role="tooltip"
    class="mdv-tooltip"
    data-mdv-tooltip-panel
    :data-phase="tooltip.phase.value"
    :aria-hidden="
      tooltip.phase.value === 'closed' || tooltip.phase.value === 'closing' || undefined
    "
    :inert="tooltip.phase.value === 'closed' || tooltip.phase.value === 'closing' || undefined"
    v-on="tooltip.panelEvents"
  >
    <slot :open="tooltip.isOpen.value" :close="tooltip.close">{{ props.text }}</slot>
  </div>
</template>
