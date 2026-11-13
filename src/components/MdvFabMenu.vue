<script setup lang="ts">
import { computed, provide, useId } from 'vue'
import type { VNode } from 'vue'
import MdvMenu from './MdvMenu.vue'
import FabMenuTrigger from './_MdvFabMenuTrigger.vue'
import { fabMenuKey } from './fab-menu-context'
import { useFabMenu } from './use-fab-menu'
import type { MdvFabMenuProps, MdvFabMenuCloseDetail } from './fab-menu.types'

defineOptions({ name: 'MdvFabMenu', inheritAttrs: false })
const props = withDefaults(defineProps<MdvFabMenuProps>(), {
  modelValue: undefined,
  variant: 'expressive',
  color: 'primary-container',
  size: 'regular',
  elevated: true,
  position: 'static',
  closeLabel: '关闭菜单',
})
defineSlots<{ icon?(): VNode[]; default?(): VNode[] }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvFabMenuCloseDetail]
  closed: [detail: MdvFabMenuCloseDetail]
}>()
const id = `mdv-fab-menu-${useId()}`
const menu = useFabMenu(props, emit)
provide(fabMenuKey, { variant: computed(() => props.variant), close: () => menu.close('select') })
const family = computed(() => props.color.replace('-container', ''))
const offsetStyle = computed(() =>
  Number.isFinite(props.offset)
    ? { '--mdv-fab-menu-offset': `${Math.max(0, props.offset!)}px` }
    : undefined,
)
defineExpose({
  open: menu.open,
  close: () => menu.close(),
  toggle: menu.toggle,
  focus: menu.focus,
  triggerElement: menu.triggerElement,
})
</script>

<template>
  <div
    ref="element"
    v-bind="$attrs"
    class="mdv-fab-menu"
    :class="[
      `mdv-fab-menu--${variant}`,
      `mdv-fab-menu--${size}`,
      `mdv-fab-menu--${family}`,
      `mdv-fab-menu--${position}`,
      { 'mdv-fab-menu--elevated': elevated },
    ]"
    :style="offsetStyle"
  >
    <MdvMenu
      v-if="variant === 'baseline'"
      :id="id"
      ref="baseline"
      :model-value="menu.isOpen.value"
      variant="baseline"
      placement="top-end"
      :offset="4"
      :aria-label="label"
      @update:model-value="menu.request"
      @open="emit('open')"
      @opened="emit('opened')"
      @close="emit('close', $event)"
      @closed="emit('closed', $event)"
    >
      <template #trigger="{ triggerProps, open }">
        <FabMenuTrigger
          :settings="props"
          :binding="triggerProps"
          :open="open"
          :control-id="triggerProps.id"
          :panel-id="id"
          @element="menu.triggerElement.value = $event"
        >
          <slot name="icon"
            ><svg viewBox="0 0 24 24" focusable="false">
              <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6Z" /></svg
          ></slot>
        </FabMenuTrigger>
      </template>
      <slot />
    </MdvMenu>
    <div v-else ref="layer" class="mdv-fab-menu__layer" @beforetoggle="menu.beforeToggle">
      <FabMenuTrigger
        :settings="props"
        :open="menu.isOpen.value"
        :control-id="`${id}-trigger`"
        :panel-id="id"
        @element="menu.triggerElement.value = $event"
        @toggle="menu.toggle"
      >
        <slot name="icon"
          ><svg viewBox="0 0 24 24" focusable="false">
            <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6Z" /></svg
        ></slot>
      </FabMenuTrigger>
      <div
        :id="id"
        ref="viewport"
        class="mdv-fab-menu__viewport"
        role="group"
        :aria-label="label"
        :hidden="!menu.rendered.value"
        :inert="!menu.isOpen.value ? true : undefined"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
