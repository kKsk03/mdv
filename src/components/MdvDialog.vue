<script setup lang="ts">
import type { StyleValue, VNode } from 'vue'
import { animateBasicDialog } from './dialog-motion'
import { useDialog } from './use-dialog'
import type { DialogEmits } from './use-dialog'
import type { MdvDialogProps, MdvDialogSlotProps } from './dialog.types'

defineOptions({ name: 'MdvDialog', inheritAttrs: false })
const slots = defineSlots<{
  icon?(): VNode[]
  title?(): VNode[]
  default?(): VNode[]
  actions?(props: MdvDialogSlotProps): VNode[]
}>()
const props = withDefaults(defineProps<MdvDialogProps>(), {
  modelValue: false,
  title: '',
  description: '',
  closeOnEsc: true,
  closeOnScrim: true,
  destroyOnClose: false,
})
const emit = defineEmits<DialogEmits>()
const { attrs, id, phase, rendered, scrollable, rootAttrs, rootStyle, close, listeners } =
  useDialog(props, emit, {
    name: 'MdvDialog',
    role: 'alertdialog',
    hasTitle: () => !!(props.title || slots.title),
    hasContentSlot: () => !!slots.default,
    animate: animateBasicDialog,
  })
defineExpose({ close })
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="rootAttrs()"
    :style="rootStyle()"
    class="mdv-dialog"
    :class="{
      'mdv-dialog--with-header': !!(title || slots.title || slots.icon),
      'mdv-dialog--with-actions': !!slots.actions,
      'mdv-dialog--scrollable': scrollable,
    }"
    :data-state="phase"
    tabindex="-1"
    closedby="none"
    aria-modal="true"
    v-on="listeners"
  >
    <div ref="scrim" class="mdv-dialog__scrim" aria-hidden="true" />
    <div
      v-if="rendered"
      ref="container"
      class="mdv-dialog__container"
      :class="attrs.class"
      :style="attrs.style as StyleValue"
    >
      <div ref="surface" class="mdv-dialog__surface" aria-hidden="true" />
      <header v-if="title || slots.title || slots.icon" ref="header" class="mdv-dialog__header">
        <div v-if="slots.icon" class="mdv-dialog__icon"><slot name="icon" /></div>
        <h2 v-if="title || slots.title" :id="id + '-title'" class="mdv-dialog__title">
          <slot name="title">{{ title }}</slot>
        </h2>
      </header>
      <div ref="content" class="mdv-dialog__content" :tabindex="scrollable ? 0 : undefined">
        <slot>
          <p v-if="description" :id="id + '-description'" class="mdv-dialog__description">
            {{ description }}
          </p>
        </slot>
      </div>
      <div v-if="slots.actions" ref="actions" class="mdv-dialog__actions">
        <slot name="actions" :close="close" />
      </div>
    </div>
  </dialog>
</template>
