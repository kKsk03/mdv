<script setup lang="ts">
import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  useTemplateRef,
} from 'vue'
import type { VNode } from 'vue'
import { AppBarScaffoldHeader, createAppBarDrawerBackground } from './app-bar-scaffold'
import type { AppBarScaffoldContext } from './app-bar-scaffold'
import type { MdvAppBarScaffoldProps } from './app-bar.types'

defineOptions({ name: 'MdvAppBarScaffold' })
const props = defineProps<MdvAppBarScaffoldProps>()
const slots = defineSlots<{
  appbar?(): VNode[]
  default?(): VNode[]
}>()
const element = useTemplateRef<HTMLElement>('element')
const contentElement = useTemplateRef<HTMLElement>('contentElement')
let layout: { owner: HTMLElement; visible: number; offset: number } | undefined
const drawerBackground = createAppBarDrawerBackground(() => element.value)

function applyLayout() {
  const root = element.value
  if (!root) return
  if (layout) {
    root.style.setProperty('--mdv-app-bar-scaffold-height', `${layout.visible}px`)
    root.style.setProperty('--mdv-app-bar-scaffold-offset', `${layout.offset}px`)
  } else {
    root.style.removeProperty('--mdv-app-bar-scaffold-height')
    root.style.removeProperty('--mdv-app-bar-scaffold-offset')
  }
  drawerBackground.sync(layout?.owner ?? null, layout?.visible ?? 0)
}

const context: AppBarScaffoldContext = {
  scrollTarget: () => contentElement.value,
  update(owner, expanded, collapse, hidden) {
    const offset = Math.max(0, Math.min(expanded, collapse + hidden))
    const visible = expanded - offset
    if (layout?.owner === owner && layout.visible === visible && layout.offset === offset) return
    layout = { owner, visible, offset }
    applyLayout()
  },
  remove(owner) {
    if (layout?.owner !== owner) return
    layout = undefined
    applyLayout()
  },
}

function start() {
  drawerBackground.start()
  applyLayout()
}

onMounted(start)
onActivated(start)
onUpdated(applyLayout)
onDeactivated(drawerBackground.stop)
onBeforeUnmount(drawerBackground.stop)

defineExpose({ element, contentElement })
</script>

<template>
  <div ref="element" class="mdv-app-bar-scaffold">
    <AppBarScaffoldHeader v-if="slots.appbar" :context="context">
      <slot name="appbar" />
    </AppBarScaffoldHeader>
    <div
      ref="contentElement"
      class="mdv-app-bar-scaffold__content"
      role="region"
      tabindex="0"
      v-bind="props.contentAttrs"
    >
      <div class="mdv-app-bar-scaffold__canvas">
        <slot />
      </div>
    </div>
  </div>
</template>
