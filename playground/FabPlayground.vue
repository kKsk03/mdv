<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import addIcon from '@iconify-icons/material-symbols/add'
import editIcon from '@iconify-icons/material-symbols/edit'
import undoIcon from '@iconify-icons/material-symbols/undo'
import redoIcon from '@iconify-icons/material-symbols/redo'
import homeIcon from '@iconify-icons/material-symbols/home'
import menuIcon from '@iconify-icons/material-symbols/menu'
import {
  MdvAppBar,
  MdvAppBarScaffold,
  MdvButton,
  MdvCheckbox,
  MdvExtendedFab,
  MdvFab,
  MdvIcon,
  MdvIconButton,
  MdvNavigationRail,
  MdvNavigationRailItem,
  MdvTextField,
  MdvToolbar,
  MdvTooltip,
} from '@/index'
import type { MdvExtendedFabSize, MdvFabColor, MdvFabSize, MdvToolbarFabPosition } from '@/index'

const sizes: MdvFabSize[] = ['small', 'regular', 'medium', 'large']
const extendedSizes: MdvExtendedFabSize[] = ['small', 'medium', 'large']
const colors: MdvFabColor[] = [
  'primary-container',
  'secondary-container',
  'tertiary-container',
  'primary',
  'secondary',
  'tertiary',
  'surface',
]
const color = ref<MdvFabColor>('primary-container')
const size = ref<MdvExtendedFabSize>('small')
const elevated = ref(true)
const expanded = ref(true)
const showIcon = ref(true)
const label = ref('新建笔记')
const rtl = ref(false)
const dark = ref(false)
const largeText = ref(false)
const action = ref('等待操作')
const scrollExpanded = ref(true)
const scrolling = ref(true)
const scrollFab = useTemplateRef<InstanceType<typeof MdvExtendedFab>>('scrollFab')
const scaffold = useTemplateRef<InstanceType<typeof MdvAppBarScaffold>>('scaffold')
const railExpanded = ref(false)
const toolbarExpanded = ref(true)
const toolbarVertical = ref(false)
const toolbarVibrant = ref(false)
const fabPosition = ref<MdvToolbarFabPosition>('end')
const controlled = ref(true)
const accept = ref(false)
const controlledFab = useTemplateRef<InstanceType<typeof MdvExtendedFab>>('controlledFab')
const request = ref('尚无请求')
const count = ref(0)
function updateControlled(value: boolean) {
  request.value = value ? '请求展开' : '请求收合'
  if (accept.value) controlled.value = value
}
function save() {
  count.value++
  action.value = `已保存 ${count.value} 次`
}
function scrollTarget() {
  return scaffold.value?.contentElement
}
</script>

<template>
  <div class="space-y-8">
    <section class="space-y-4">
      <h2 class="text-xl font-medium">FAB／Extended FAB 浮动操作按钮</h2>
      <p class="text-mdv-on-surface-variant">
        用于页面的主要操作。可保留旧版 Small／Surface；Extended 的文字保持单行，收合后仍有动作名称。
      </p>
      <div class="fab-controls">
        <label
          >配色<select v-model="color">
            <option v-for="item in colors" :key="item" :value="item">{{ item }}</option>
          </select></label
        >
        <label
          >Extended 尺寸<select v-model="size">
            <option v-for="item in extendedSizes" :key="item" :value="item">{{ item }}</option>
          </select></label
        >
        <MdvTextField v-model="label" label="动作标签" />
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="elevated" label="阴影" />
        <MdvCheckbox v-model="expanded" label="Extended 展开" />
        <MdvCheckbox v-model="showIcon" label="Extended 图标" />
        <MdvCheckbox v-model="rtl" label="RTL" />
        <MdvCheckbox v-model="dark" label="局部深色" />
        <MdvCheckbox v-model="largeText" label="两倍文字" />
      </div>
      <div
        class="fab-example"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <div class="fab-row">
          <div v-for="item in sizes" :key="item" class="fab-sample">
            <MdvTooltip :text="`新建 · ${item}`">
              <template #trigger="{ triggerProps }">
                <MdvFab
                  v-bind="triggerProps"
                  :size="item"
                  :color="color"
                  :elevated="elevated"
                  aria-label="新建"
                  @click="action = `新建 · ${item}`"
                >
                  <MdvIcon :icon="addIcon" />
                </MdvFab>
              </template>
            </MdvTooltip>
            <span class="text-sm text-mdv-on-surface-variant">{{ item }}</span>
          </div>
        </div>
        <div class="fab-row mt-8">
          <MdvExtendedFab
            v-model:expanded="expanded"
            :size="size"
            :color="color"
            :elevated="elevated"
            :class="{ 'fab-large-text': largeText }"
            @click="save"
          >
            <template v-if="showIcon" #leading><MdvIcon :icon="editIcon" /></template>
            {{ label || '新建笔记' }}
          </MdvExtendedFab>
        </div>
      </div>
      <p class="text-sm text-mdv-on-surface-variant">
        Small 的可见表面为 40px，点击区域至少 48px。没有图标的 Extended 保持展开。
      </p>
      <p role="status">{{ action }}</p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">配色与 Extended 尺寸</h3>
      <div class="fab-palette">
        <div v-for="scheme in colors" :key="scheme" class="fab-example fab-sample">
          <MdvFab :color="scheme" aria-label="添加项目" @click="action = scheme"
            ><MdvIcon :icon="addIcon"
          /></MdvFab>
          <span class="text-sm">{{ scheme }}</span>
        </div>
      </div>
      <div class="fab-example fab-row">
        <MdvExtendedFab v-for="item in extendedSizes" :key="item" :size="item" @click="save">
          <template #leading><MdvIcon :icon="editIcon" /></template>新建笔记
        </MdvExtendedFab>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">正文滚动、Rail 与应用栏组合</h3>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="scrolling" label="下滚收合／上滚展开" />
        <MdvCheckbox v-model="railExpanded" label="展开 Rail" />
        <MdvButton variant="tonal" @click="scrollFab?.toggle()">切换正文 FAB</MdvButton>
      </div>
      <div class="fab-layout" :dir="rtl ? 'rtl' : 'ltr'">
        <MdvNavigationRail v-model:expanded="railExpanded" aria-label="笔记导航">
          <template #menu="{ menuAttrs }"
            ><MdvIconButton v-bind="menuAttrs" variant="standard" aria-label="切换导航"
              ><MdvIcon :icon="menuIcon" /></MdvIconButton
          ></template>
          <template #fab>
            <MdvExtendedFab :expanded="railExpanded" @click="action = 'Rail 新建笔记'">
              <template #leading><MdvIcon :icon="editIcon" /></template>新建
            </MdvExtendedFab>
          </template>
          <MdvNavigationRailItem label="笔记" active
            ><template #icon><MdvIcon :icon="homeIcon" /></template
          ></MdvNavigationRailItem>
        </MdvNavigationRail>
        <div class="fab-pane">
          <MdvAppBarScaffold
            ref="scaffold"
            class="h-full"
            :content-attrs="{ 'aria-label': '笔记正文' }"
          >
            <template #appbar
              ><MdvAppBar title="我的笔记" variant="small" scroll-behavior="pinned"
            /></template>
            <div class="fab-content">
              <p v-for="n in 24" :key="n">
                笔记 {{ n }}：在正文中滚动，应用栏旁不会出现正文滚动条。
              </p>
            </div>
          </MdvAppBarScaffold>
          <MdvExtendedFab
            ref="scrollFab"
            v-model:expanded="scrollExpanded"
            position="absolute"
            :scroll-behavior="scrolling ? 'collapse' : 'none'"
            :scroll-target="scrollTarget"
            @click="save"
          >
            <template #leading><MdvIcon :icon="editIcon" /></template>记录想法
          </MdvExtendedFab>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">Floating Toolbar 配套 FAB</h3>
      <div class="flex flex-wrap items-center gap-4">
        <MdvCheckbox v-model="toolbarExpanded" label="展开工具栏" />
        <MdvCheckbox v-model="toolbarVertical" label="竖向" />
        <MdvCheckbox v-model="toolbarVibrant" label="Vibrant" />
        <label
          >FAB 位置<select v-model="fabPosition">
            <option value="start">起始</option>
            <option value="end">末尾</option>
          </select></label
        >
      </div>
      <div class="fab-toolbar-stage" :dir="rtl ? 'rtl' : 'ltr'">
        <MdvToolbar
          v-model:expanded="toolbarExpanded"
          variant="floating"
          :orientation="toolbarVertical ? 'vertical' : 'horizontal'"
          :color="toolbarVibrant ? 'vibrant' : 'standard'"
          :fab-position="fabPosition"
          aria-label="笔记编辑"
        >
          <MdvIconButton variant="standard" aria-label="撤销" @click="action = '撤销'"
            ><MdvIcon :icon="undoIcon"
          /></MdvIconButton>
          <MdvIconButton variant="standard" aria-label="重做" @click="action = '重做'"
            ><MdvIcon :icon="redoIcon"
          /></MdvIconButton>
          <template #fab
            ><MdvFab aria-label="保存笔记" @click="save"><MdvIcon :icon="editIcon" /></MdvFab
          ></template>
        </MdvToolbar>
      </div>
      <p class="text-sm text-mdv-on-surface-variant">
        收合时 FAB 从 56px 增至 80px。FAB 执行保存，旁边的展开按钮控制工具栏。
      </p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">受控状态、原生链接与表单</h3>
      <div class="flex flex-wrap items-center gap-4">
        <MdvCheckbox v-model="accept" label="接受扩缩请求" />
        <MdvButton variant="tonal" @click="controlledFab?.toggle()">请求扩缩</MdvButton>
        <span role="status">{{ request }}</span>
      </div>
      <div class="fab-example fab-row">
        <MdvExtendedFab
          ref="controlledFab"
          :expanded="controlled"
          @update:expanded="updateControlled"
          @click="save"
        >
          <template #leading><MdvIcon :icon="editIcon" /></template>保存草稿
        </MdvExtendedFab>
        <MdvFab
          href="https://m3.material.io/components/floating-action-button/specs"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="打开 FAB 官方规范"
          ><MdvIcon :icon="addIcon"
        /></MdvFab>
        <form @submit.prevent="save">
          <MdvExtendedFab type="submit" color="secondary-container"
            ><template #leading><MdvIcon :icon="editIcon" /></template>提交草稿</MdvExtendedFab
          >
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fab-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px;
}
.fab-controls label {
  display: grid;
  gap: 4px;
}
select {
  border: 1px solid var(--mdv-sys-color-outline);
  border-radius: 8px;
  padding: 8px;
  background: var(--mdv-sys-color-surface);
  color: var(--mdv-sys-color-on-surface);
}
.fab-example {
  padding: 24px;
  border-radius: 24px;
  background: var(--mdv-sys-color-surface-container-low);
  color: var(--mdv-sys-color-on-surface);
}
.fab-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}
.fab-sample {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.fab-palette {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
}
.fab-large-text {
  font-size: calc(var(--mdv-sys-typescale-title-medium-size) * 2);
  line-height: 1.5;
}
.fab-large-text.mdv-extended-fab--medium {
  font-size: calc(var(--mdv-sys-typescale-title-large-size) * 2);
}
.fab-large-text.mdv-extended-fab--large {
  font-size: calc(var(--mdv-sys-typescale-headline-small-size) * 2);
}
.fab-layout {
  display: flex;
  height: 440px;
  overflow: hidden;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 24px;
}
.fab-pane {
  position: relative;
  min-width: 0;
  flex: 1;
}
.fab-content {
  padding: 24px 24px 120px;
}
.fab-content p {
  margin-bottom: 24px;
}
.fab-toolbar-stage {
  display: flex;
  min-height: 310px;
  justify-content: center;
  align-items: center;
  padding: 24px;
  border-radius: 24px;
  background: var(--mdv-sys-color-surface-container-low);
}
@media (max-width: 540px) {
  .fab-layout > :deep(.mdv-navigation-rail) {
    display: none;
  }
}
</style>
