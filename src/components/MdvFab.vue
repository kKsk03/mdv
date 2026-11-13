<script setup lang="ts">
import type { VNode } from 'vue'
import { useFab } from './fab'
import FabRipple from './_MdvFabRipple.vue'
import type { MdvFabProps } from './fab.types'

defineOptions({ name: 'MdvFab', inheritAttrs: false })
defineSlots<{ default?(): VNode[] }>()
const props = withDefaults(defineProps<MdvFabProps>(), {
  size: 'regular',
  elevated: true,
  type: 'button',
  position: 'static',
  placement: 'bottom-end',
  offset: 16,
})
const {
  attrs,
  element,
  surface,
  color,
  paired,
  isLink,
  offsetStyle,
  focus,
  blur,
  ripple,
  showRipple,
  releaseRipple,
  finishRipple,
} = useFab(props, true)

defineExpose({ element, focus, blur })
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    ref="element"
    :style="offsetStyle"
    v-bind="attrs"
    :href="isLink ? props.href : undefined"
    :type="isLink ? undefined : props.type"
    class="mdv-fab"
    :class="[
      `mdv-fab--${props.size}`,
      `mdv-fab--${color}`,
      `mdv-fab--${paired ? 'static' : props.position}`,
      `mdv-fab--${props.placement}`,
      { 'mdv-fab--elevated': props.elevated, 'mdv-fab--toolbar': paired },
    ]"
    @pointerdown="showRipple"
    @pointerup="releaseRipple"
    @pointerleave="releaseRipple"
    @pointercancel="releaseRipple"
    @keydown="showRipple"
    @keyup="releaseRipple"
    @blur="releaseRipple"
  >
    <span ref="surface" class="mdv-fab__surface">
      <FabRipple :ripple="ripple" @animationend="finishRipple" />
      <span class="mdv-fab__icon" aria-hidden="true" inert><slot /></span>
    </span>
  </component>
</template>
