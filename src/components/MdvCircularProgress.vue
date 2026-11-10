<script setup lang="ts">
import MdvProgress from './_MdvProgress.vue'
import type { MdvCircularProgressProps } from './progress.types'

defineOptions({ name: 'MdvCircularProgress', inheritAttrs: false })
const props = defineProps<MdvCircularProgressProps>()
</script>

<template>
  <MdvProgress v-bind="{ ...$attrs, ...props }" kind="circular" />
</template>
