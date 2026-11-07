<script setup lang="ts">
import { useAttrs } from 'vue'
import type { MdvButtonType, MdvButtonVariant } from './button.types'

defineOptions({ name: 'MdvButton', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    variant?: MdvButtonVariant
    type?: MdvButtonType
    disabled?: boolean
  }>(),
  {
    variant: 'filled',
    type: 'button',
    disabled: false,
  },
)

const attrs = useAttrs()

const variantClasses: Record<MdvButtonVariant, string> = {
  filled: 'border-transparent bg-mdv-primary text-mdv-on-primary shadow-sm hover:brightness-95',
  tonal:
    'border-transparent bg-mdv-secondary-container text-mdv-on-secondary-container hover:brightness-95',
  outlined: 'border-mdv-outline bg-transparent text-mdv-primary hover:bg-mdv-surface-container-low',
  elevated:
    'border-transparent bg-mdv-surface-container-low text-mdv-primary shadow-sm hover:shadow-md',
  text: 'border-transparent bg-transparent text-mdv-primary hover:bg-mdv-surface-container-low',
}
</script>

<template>
  <button
    v-bind="attrs"
    :type="props.type"
    :disabled="props.disabled"
    :class="[
      'mdv-button inline-flex min-h-10 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mdv-primary disabled:cursor-not-allowed disabled:opacity-[0.38]',
      variantClasses[props.variant],
    ]"
  >
    <slot />
  </button>
</template>
