<script setup lang="ts">
import MdvProgress from './_MdvProgress.vue'
import type { MdvProgressProps } from './progress.types'

defineOptions({ name: 'MdvLinearProgress', inheritAttrs: false })
const props = defineProps<MdvProgressProps>()
</script>

<template>
  <MdvProgress v-bind="{ ...$attrs, ...props }" kind="linear" />
</template>
