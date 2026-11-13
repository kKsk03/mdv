<script setup lang="ts">
import { provide } from 'vue'
import { toolbarFabKey } from './fab-context'
import type { MdvFabColor } from './fab.types'

const props = defineProps<{ color: MdvFabColor }>()
provide(toolbarFabKey, { color: () => props.color })
</script>

<template><slot /></template>
