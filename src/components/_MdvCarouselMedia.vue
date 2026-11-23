<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useButtonRipple } from './button-ripple'
import type { MdvCarouselItem } from './carousel.types'

defineOptions({ name: 'MdvCarouselMedia', inheritAttrs: false })
const props = defineProps<{ item: Partial<MdvCarouselItem>; fallbackLabel?: string }>()
const surface = useTemplateRef<HTMLElement>('surface')
const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => !!props.item.disabled || !!surface.value?.matches(':disabled'),
  isLink: () => props.item.href !== undefined,
  surface: () => surface.value,
})
function click(event: MouseEvent) {
  if (props.item.disabled) {
    event.preventDefault()
    event.stopPropagation()
  }
}
</script>

<template>
  <component
    :is="item.href !== undefined ? 'a' : 'button'"
    ref="surface"
    class="mdv-carousel-media"
    :type="item.href === undefined ? 'button' : undefined"
    :href="item.disabled ? undefined : item.href"
    :target="item.target"
    :rel="item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined)"
    :role="item.href !== undefined && item.disabled ? 'link' : undefined"
    :disabled="item.href === undefined ? item.disabled : undefined"
    :aria-disabled="item.disabled || undefined"
    :tabindex="item.disabled ? -1 : undefined"
    :aria-label="item.label || item.alt || fallbackLabel || undefined"
    @click="click"
    @pointerdown="showRipple"
    @pointerup="releaseRipple"
    @pointerleave="releaseRipple"
    @pointercancel="releaseRipple"
    @keydown="showRipple"
    @keyup="releaseRipple"
    @blur="releaseRipple"
  >
    <img
      v-if="item.src"
      :src="item.src"
      :alt="item.alt ?? ''"
      draggable="false"
      class="mdv-carousel-media__image"
    />
    <span v-if="item.label" class="mdv-carousel-media__scrim" aria-hidden="true" />
    <span v-if="item.label" class="mdv-carousel-media__label" aria-hidden="true">{{
      item.label
    }}</span>
    <span class="mdv-carousel-media__state" aria-hidden="true" />
    <span
      v-if="ripple"
      :key="ripple.key"
      class="mdv-button__ripple"
      :class="{ 'mdv-button__ripple--released': ripple.released }"
      aria-hidden="true"
      @animationend="finishRipple"
    >
      <span
        class="mdv-button__ripple-wave"
        :style="{
          left: `${ripple.x}px`,
          top: `${ripple.y}px`,
          width: `${ripple.size}px`,
          height: `${ripple.size}px`,
        }"
      />
    </span>
  </component>
</template>
