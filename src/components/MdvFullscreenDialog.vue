<script setup lang="ts">
import type { StyleValue, VNode } from 'vue'
import closeIcon from '@iconify-icons/material-symbols/close'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { animateFullscreenDialog } from './dialog-motion'
import { useDialog } from './use-dialog'
import type { DialogEmits } from './use-dialog'
import type { MdvFullscreenDialogProps, MdvDialogSlotProps } from './dialog.types'

defineOptions({ name: 'MdvFullscreenDialog', inheritAttrs: false })
const slots = defineSlots<{
  title?(): VNode[]
  default?(): VNode[]
  actions?(props: MdvDialogSlotProps): VNode[]
  footer?(props: MdvDialogSlotProps): VNode[]
}>()
const props = withDefaults(defineProps<MdvFullscreenDialogProps>(), {
  modelValue: false,
  title: '',
  description: '',
  closable: true,
  closeOnEsc: true,
  destroyOnClose: false,
})
const emit = defineEmits<DialogEmits>()
const {
  attrs,
  id,
  phase,
  rendered,
  scrollable,
  rootAttrs,
  rootStyle,
  close,
  requestClose,
  listeners,
} = useDialog(props, emit, {
  name: 'MdvFullscreenDialog',
  role: 'dialog',
  hasTitle: () => !!(props.title || slots.title),
  hasContentSlot: () => !!slots.default,
  animate: animateFullscreenDialog,
})
defineExpose({ close })
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="rootAttrs()"
    :style="rootStyle()"
    class="mdv-dialog mdv-fullscreen-dialog"
    :class="{ 'mdv-fullscreen-dialog--scrollable': scrollable }"
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
      class="mdv-fullscreen-dialog__container"
      :class="attrs.class"
      :style="attrs.style as StyleValue"
    >
      <header ref="header" class="mdv-fullscreen-dialog__header">
        <MdvIconButton
          v-if="closable"
          class="mdv-fullscreen-dialog__close"
          variant="standard"
          :aria-label="closeLabel"
          @click="requestClose('close-button')"
        >
          <MdvIcon :icon="closeIcon" />
        </MdvIconButton>
        <h2 v-if="title || slots.title" :id="id + '-title'" class="mdv-fullscreen-dialog__title">
          <slot name="title">{{ title }}</slot>
        </h2>
        <div v-if="slots.actions" ref="actions" class="mdv-fullscreen-dialog__actions">
          <slot name="actions" :close="close" />
        </div>
      </header>
      <div
        ref="content"
        class="mdv-fullscreen-dialog__content"
        :tabindex="scrollable ? 0 : undefined"
      >
        <slot>
          <p v-if="description" :id="id + '-description'" class="mdv-dialog__description">
            {{ description }}
          </p>
        </slot>
      </div>
      <div v-if="slots.footer" ref="footer" class="mdv-fullscreen-dialog__footer">
        <slot name="footer" :close="close" />
      </div>
    </div>
  </dialog>
</template>
