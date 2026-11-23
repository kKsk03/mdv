<script setup lang="ts">
import { defineComponent, h, provide, useTemplateRef } from 'vue'
import type { ComponentPublicInstance, VNode } from 'vue'
import MdvAppBar from './MdvAppBar.vue'
import MdvSearchView from './MdvSearchView.vue'
import { appBarSearchKey } from './app-bar-search'
import type { MdvAppBarSlotProps } from './app-bar.types'
import type { MdvSearchAppBarProps, MdvSearchCloseDetail, MdvSearchSlotProps } from './search.types'

defineOptions({ name: 'MdvSearchAppBar' })
const query = defineModel<string>({ default: '' })
const expanded = defineModel<boolean>('open', { default: false })
const props = withDefaults(defineProps<Omit<MdvSearchAppBarProps, 'modelValue' | 'open'>>(), {
  appearance: 'default',
  scrollBehavior: 'none',
  scrolled: undefined,
  variant: 'contained',
  layout: 'auto',
  clearable: true,
  closeOnEsc: true,
  closeOnScrim: true,
})
const slots = defineSlots<{
  leading?(state: MdvAppBarSlotProps): VNode[]
  actions?(state: MdvAppBarSlotProps): VNode[]
  'search-leading'?(state: MdvSearchSlotProps): VNode[]
  'search-trailing'?(state: MdvSearchSlotProps): VNode[]
  default?(state: MdvSearchSlotProps): VNode[]
}>()
const emit = defineEmits<{
  search: [query: string, originalEvent?: Event]
  clear: []
  open: []
  opened: []
  close: [detail: MdvSearchCloseDetail]
  closed: [detail: MdvSearchCloseDetail]
}>()
const bar = useTemplateRef<InstanceType<typeof MdvAppBar>>('bar')
let view: InstanceType<typeof MdvSearchView> | null = null
const SearchContent = defineComponent({
  name: 'MdvSearchAppBarContent',
  setup: () => () => {
    const searchProps: Partial<MdvSearchAppBarProps> = { ...props }
    delete searchProps.appearance
    delete searchProps.scrollBehavior
    delete searchProps.scrollTarget
    delete searchProps.scrolled
    return h(
      MdvSearchView,
      {
        ...searchProps,
        ref: (instance: Element | ComponentPublicInstance | null) => {
          view = instance as InstanceType<typeof MdvSearchView> | null
        },
        modelValue: query.value,
        open: expanded.value,
        'onUpdate:modelValue': (value: string) => {
          query.value = value
        },
        'onUpdate:open': (value: boolean) => {
          expanded.value = value
        },
        onSearch: (value: string, event?: Event) => emit('search', value, event),
        onClear: () => emit('clear'),
        onOpen: () => emit('open'),
        onOpened: () => emit('opened'),
        onClose: (detail: MdvSearchCloseDetail) => emit('close', detail),
        onClosed: (detail: MdvSearchCloseDetail) => emit('closed', detail),
      },
      {
        ...(slots['search-leading'] ? { leading: slots['search-leading'] } : {}),
        ...(slots['search-trailing'] ? { trailing: slots['search-trailing'] } : {}),
        default: slots.default,
      },
    )
  },
})
provide(appBarSearchKey, { content: SearchContent })
defineExpose({
  get element() {
    return bar.value?.element ?? null
  },
  get inputElement() {
    return view?.inputElement ?? null
  },
  open: () => view?.open() ?? Promise.resolve(false),
  close: () => view?.close() ?? Promise.resolve(false),
  focus: (options?: FocusOptions) => view?.focus(options),
  blur: () => view?.blur(),
  refresh: () => bar.value?.refresh(),
})
</script>

<template>
  <MdvAppBar
    ref="bar"
    :appearance="appearance"
    :scroll-behavior="scrollBehavior"
    :scroll-target="scrollTarget"
    :scrolled="scrolled"
  >
    <template v-if="slots.leading" #leading="state"
      ><slot name="leading" v-bind="state"
    /></template>
    <template v-if="slots.actions" #actions="state"
      ><slot name="actions" v-bind="state"
    /></template>
  </MdvAppBar>
</template>
