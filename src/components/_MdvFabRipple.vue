<script setup lang="ts">
import type { useButtonRipple } from './button-ripple'

defineProps<{ ripple: ReturnType<typeof useButtonRipple>['ripple']['value'] }>()
</script>

<template>
  <span
    v-if="ripple"
    :key="ripple.key"
    class="mdv-fab__ripple"
    :class="{ 'mdv-fab__ripple--released': ripple.released }"
    aria-hidden="true"
  >
    <span
      class="mdv-fab__ripple-wave"
      :style="{
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
        width: `${ripple.size}px`,
        height: `${ripple.size}px`,
      }"
    />
  </span>
</template>
