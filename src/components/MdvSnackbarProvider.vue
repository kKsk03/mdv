<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef } from 'vue'
import MdvSnackbar from './MdvSnackbar.vue'
import { mdvSnackbarKey } from './snackbar-context'
import type { MdvSnackbarInput, MdvSnackbarOptions, MdvSnackbarProviderApi } from './snackbar.types'

defineOptions({ name: 'MdvSnackbarProvider' })

interface QueueEntry extends MdvSnackbarOptions {
  id: string
  visible: boolean
}

const current = shallowRef<QueueEntry | null>(null)
const queue = ref<QueueEntry[]>([])
let nextId = 0
let currentStarted = false

const allEntries = computed(() => [current.value, ...queue.value].filter(Boolean) as QueueEntry[])
const currentProps = computed(() => {
  if (!current.value) return {}
  const options: Partial<QueueEntry> = { ...current.value }
  delete options.id
  delete options.visible
  delete options.key
  return options
})

function normalize(input: MdvSnackbarInput): Omit<MdvSnackbarOptions, 'key'> & { key?: string } {
  return typeof input === 'string' ? { message: input } : { ...input }
}

function show(input: MdvSnackbarInput) {
  const options = normalize(input)
  if (options.key) {
    const existing = allEntries.value.find(
      (entry) => entry.key === options.key && (entry !== current.value || entry.visible),
    )
    if (existing) {
      Object.assign(existing, options)
      if (existing === current.value) current.value = { ...existing }
      else queue.value = [...queue.value]
      return existing.id
    }
  }

  const entry: QueueEntry = { ...options, id: `mdv-snackbar-${++nextId}`, visible: true }
  if (!current.value) current.value = entry
  else queue.value.push(entry)
  return entry.id
}

function update(id: string, patch: Partial<MdvSnackbarOptions>) {
  const entry = allEntries.value.find((item) => item.id === id)
  if (!entry) return false
  Object.assign(entry, patch)
  if (entry === current.value) current.value = { ...entry }
  else queue.value = [...queue.value]
  return true
}

function close(id: string) {
  if (current.value?.id === id) {
    current.value = { ...current.value, visible: false }
    finishUnstarted(id)
    return true
  }
  const index = queue.value.findIndex((entry) => entry.id === id)
  if (index < 0) return false
  queue.value.splice(index, 1)
  return true
}

function clear() {
  queue.value = []
  if (current.value) close(current.value.id)
}

function finishUnstarted(id: string) {
  void nextTick(() => {
    if (!currentStarted && current.value?.id === id && !current.value.visible) onClosed(id)
  })
}

function setCurrentVisible(value: boolean) {
  if (current.value) current.value = { ...current.value, visible: value }
}

function onClosed(id: string) {
  if (current.value?.id !== id) return
  currentStarted = false
  current.value = queue.value.shift() ?? null
}

const api: MdvSnackbarProviderApi = { show, update, close, clear }
provide(mdvSnackbarKey, api)
onBeforeUnmount(() => {
  queue.value = []
  current.value = null
})
</script>

<template>
  <slot />
  <MdvSnackbar
    v-if="current"
    :key="current.id"
    v-bind="currentProps"
    :model-value="current.visible"
    @open="currentStarted = true"
    @update:model-value="setCurrentVisible"
    @closed="onClosed(current.id)"
  />
</template>
