<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import undoIcon from '@iconify-icons/material-symbols/undo'
import redoIcon from '@iconify-icons/material-symbols/redo'
import brushIcon from '@iconify-icons/material-symbols/brush'
import moreIcon from '@iconify-icons/material-symbols/more-vert'
import saveIcon from '@iconify-icons/material-symbols/save'
import copyIcon from '@iconify-icons/material-symbols/content-copy'
import homeIcon from '@iconify-icons/material-symbols/home-outline'
import {
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvDivider,
  MdvIcon,
  MdvIconButton,
  MdvMenu,
  MdvMenuItem,
  MdvNavigationRail,
  MdvNavigationRailItem,
  MdvTextField,
  MdvToolbar,
  MdvTooltip,
} from '@/index'
import type {
  MdvToolbarAlignment,
  MdvToolbarColor,
  MdvToolbarOrientation,
  MdvToolbarScrollBehavior,
  MdvToolbarVariant,
} from '@/index'

const variant = ref<MdvToolbarVariant>('floating')
const color = ref<MdvToolbarColor>('standard')
const orientation = ref<MdvToolbarOrientation>('horizontal')
const align = ref<MdvToolbarAlignment>('center')
const expanded = ref(true)
const selected = ref(false)
const disabled = ref(false)
const elevated = ref(true)
const rtl = ref(false)
const dark = ref(false)
const narrow = ref(false)
const largeText = ref(false)
const lastAction = ref('选择一个操作')
const scrollBehavior = ref<MdvToolbarScrollBehavior>('collapse')
const scrollExpanded = ref(true)
const scrollArea = useTemplateRef<HTMLElement>('scrollArea')
const controlledExpanded = ref(true)
const acceptChanges = ref(true)
const dialogOpen = ref(false)
const query = ref('')
const railActive = ref('home')
function scrollTarget() {
  return scrollArea.value
}
function action(text: string) {
  lastAction.value = text
}
function acceptExpanded(value: boolean) {
  if (acceptChanges.value) controlledExpanded.value = value
}
</script>

<template>
  <div class="space-y-8">
    <section class="space-y-4">
      <h2 class="text-xl font-medium">Toolbar 工具栏</h2>
      <p class="text-mdv-on-surface-variant">
        Docked 在底部铺满，Floating 按内容自然展开。可组合按钮、分隔线、输入和菜单。
      </p>
      <div class="toolbar-controls">
        <label
          >形态<select v-model="variant">
            <option value="docked">Docked</option>
            <option value="floating">Floating</option>
          </select></label
        >
        <label
          >配色<select v-model="color">
            <option value="standard">Standard</option>
            <option value="vibrant">Vibrant</option>
          </select></label
        >
        <label
          >方向<select v-model="orientation" :disabled="variant === 'docked'">
            <option value="horizontal">横向</option>
            <option value="vertical">竖向</option>
          </select></label
        >
        <label
          >对齐<select v-model="align">
            <option value="start">起始</option>
            <option value="center">居中</option>
            <option value="end">末尾</option>
            <option value="between">两端</option>
          </select></label
        >
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="disabled" label="禁用示例操作" />
        <MdvCheckbox v-model="elevated" label="Floating 阴影" />
        <MdvCheckbox v-model="rtl" label="RTL" />
        <MdvCheckbox v-model="dark" label="局部深色" />
        <MdvCheckbox v-model="narrow" label="320px 容器" />
        <MdvCheckbox v-model="largeText" label="两倍文字" />
      </div>
      <div
        class="toolbar-stage"
        :class="{ 'toolbar-example--large': largeText }"
        :style="{ maxWidth: narrow ? '320px' : undefined }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <div class="p-6 text-mdv-on-surface-variant">
          <h3 class="font-medium text-mdv-on-surface">画布</h3>
          <p class="mt-2">
            {{
              orientation === 'vertical' && variant === 'floating'
                ? '竖向工具栏位于画布另一侧。'
                : '工具栏固定在这个画布内。'
            }}
          </p>
          <p class="mt-3" role="status">{{ lastAction }}</p>
        </div>
        <MdvToolbar
          expand-label="展开工具栏"
          collapse-label="收起工具栏"
          v-model:expanded="expanded"
          :variant="variant"
          :color="color"
          :orientation="variant === 'floating' ? orientation : 'horizontal'"
          :align="align"
          :elevated="variant === 'floating' ? elevated : false"
          position="absolute"
          :placement="variant === 'floating' && orientation === 'vertical' ? 'end' : 'bottom'"
          aria-label="画布编辑"
        >
          <template #leading>
            <MdvTooltip text="撤销">
              <template #trigger="{ triggerProps }"
                ><MdvIconButton
                  v-bind="triggerProps"
                  variant="standard"
                  aria-label="撤销"
                  :disabled="disabled"
                  @click="action('已撤销')"
                  ><MdvIcon :icon="undoIcon" /></MdvIconButton
              ></template>
            </MdvTooltip>
            <MdvIconButton
              variant="standard"
              aria-label="重做"
              :disabled="disabled"
              @click="action('已重做')"
              ><MdvIcon :icon="redoIcon"
            /></MdvIconButton>
          </template>
          <MdvIconButton
            v-model:selected="selected"
            variant="tonal"
            aria-label="画笔"
            :disabled="disabled"
            ><MdvIcon :icon="brushIcon"
          /></MdvIconButton>
          <template #trailing>
            <MdvMenu>
              <template #trigger="{ triggerProps }"
                ><MdvIconButton
                  v-bind="triggerProps"
                  variant="standard"
                  aria-label="更多编辑操作"
                  :disabled="disabled"
                  ><MdvIcon :icon="moreIcon" /></MdvIconButton
              ></template>
              <MdvMenuItem headline="复制" :icon="copyIcon" @click="action('已复制')" />
              <MdvMenuItem headline="保存草稿" :icon="saveIcon" @click="action('已保存草稿')" />
            </MdvMenu>
          </template>
        </MdvToolbar>
      </div>
      <p class="text-sm text-mdv-on-surface-variant">
        Tab 逐项访问；横向用左右键，竖向用上下键。收合后保留画笔及展开入口。
      </p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">两款形态与操作层次</h3>
      <div class="toolbar-examples">
        <div
          v-for="scheme in ['standard', 'vibrant'] as const"
          :key="scheme"
          class="toolbar-example space-y-5"
        >
          <p class="text-sm text-mdv-on-surface-variant">
            {{ scheme === 'standard' ? 'Standard' : 'Vibrant' }}
          </p>
          <MdvToolbar :color="scheme" aria-label="文档操作">
            <MdvIconButton variant="standard" aria-label="撤销" @click="action('已撤销')"
              ><MdvIcon :icon="undoIcon"
            /></MdvIconButton>
            <MdvIconButton variant="standard" aria-label="重做" @click="action('已重做')"
              ><MdvIcon :icon="redoIcon"
            /></MdvIconButton>
            <MdvButton variant="filled" @click="action('已保存')">保存</MdvButton>
          </MdvToolbar>
          <div class="flex justify-center">
            <MdvToolbar variant="floating" :color="scheme" aria-label="文本编辑">
              <MdvIconButton v-model:selected="selected" variant="standard" aria-label="画笔"
                ><MdvIcon :icon="brushIcon"
              /></MdvIconButton>
              <MdvIconButton variant="standard" aria-label="复制" @click="action('已复制')"
                ><MdvIcon :icon="copyIcon"
              /></MdvIconButton>
              <MdvDivider orientation="vertical" style="margin-block: 8px" />
              <MdvIconButton variant="filled" aria-label="保存" @click="action('已保存')"
                ><MdvIcon :icon="saveIcon"
              /></MdvIconButton>
              <MdvIconButton variant="standard" aria-label="无法撤销" disabled
                ><MdvIcon :icon="undoIcon"
              /></MdvIconButton>
            </MdvToolbar>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">随正文滚动</h3>
      <div class="toolbar-controls">
        <label
          >滚动行为<select v-model="scrollBehavior">
            <option value="none">常驻</option>
            <option value="hide">移出／恢复</option>
            <option value="collapse">收合／展开</option>
          </select></label
        >
        <span class="text-sm text-mdv-on-surface-variant"
          >向下滚动后收合，向上滚动恢复；操作正在使用时保持可见。</span
        >
      </div>
      <div class="toolbar-stage toolbar-scroll-stage">
        <div
          ref="scrollArea"
          class="toolbar-scroll-content"
          tabindex="0"
          aria-label="示例正文滚动区"
        >
          <article
            v-for="row in 12"
            :key="row"
            class="space-y-2 border-b border-mdv-outline-variant p-5"
          >
            <h4 class="font-medium">创作笔记 {{ row }}</h4>
            <p class="text-mdv-on-surface-variant">
              从灵感到草稿，再到最后一次修改。滚动这片正文，观察下面的工具栏；外侧页面的滚动不会影响它。
            </p>
          </article>
        </div>
        <MdvToolbar
          expand-label="展开工具栏"
          collapse-label="收起工具栏"
          v-model:expanded="scrollExpanded"
          variant="floating"
          color="vibrant"
          position="absolute"
          :scroll-behavior="scrollBehavior"
          :scroll-target="scrollTarget"
          aria-label="笔记工具"
        >
          <template #leading
            ><MdvIconButton variant="standard" aria-label="撤销" @click="action('已撤销笔记编辑')"
              ><MdvIcon :icon="undoIcon" /></MdvIconButton
          ></template>
          <MdvIconButton variant="filled" aria-label="保存笔记" @click="action('笔记已保存')"
            ><MdvIcon :icon="saveIcon"
          /></MdvIconButton>
          <template #trailing
            ><MdvIconButton variant="standard" aria-label="复制笔记" @click="action('笔记已复制')"
              ><MdvIcon :icon="copyIcon" /></MdvIconButton
          ></template>
        </MdvToolbar>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">受控展开与自定义入口</h3>
      <MdvCheckbox v-model="acceptChanges" label="接受展开／收合请求" />
      <div class="toolbar-example">
        <MdvToolbar
          :expanded="controlledExpanded"
          variant="floating"
          aria-label="草稿工具"
          @update:expanded="acceptExpanded"
        >
          <template #leading
            ><MdvIconButton variant="standard" aria-label="撤销" @click="action('已撤销草稿')"
              ><MdvIcon :icon="undoIcon" /></MdvIconButton
          ></template>
          <MdvButton variant="filled" @click="action('草稿已保存')">保存草稿</MdvButton>
          <template #toggle="{ expanded: isExpanded, toggleProps }"
            ><MdvButton variant="text" v-bind="toggleProps">{{
              isExpanded ? '收起' : '展开'
            }}</MdvButton></template
          >
        </MdvToolbar>
      </div>
      <p class="text-sm text-mdv-on-surface-variant">
        关闭“接受请求”后，按按钮仍会发出请求，当前展开状态保持不变。
      </p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">窄空间与尾部菜单</h3>
      <div class="toolbar-narrow-example">
        <MdvToolbar variant="floating" aria-label="紧凑编辑">
          <MdvIconButton variant="standard" aria-label="撤销" @click="action('已撤销')"
            ><MdvIcon :icon="undoIcon"
          /></MdvIconButton>
          <MdvIconButton v-model:selected="selected" variant="tonal" aria-label="画笔"
            ><MdvIcon :icon="brushIcon"
          /></MdvIconButton>
          <MdvIconButton variant="standard" aria-label="保存" @click="action('已保存')"
            ><MdvIcon :icon="saveIcon"
          /></MdvIconButton>
          <MdvMenu>
            <template #trigger="{ triggerProps }"
              ><MdvIconButton v-bind="triggerProps" variant="standard" aria-label="其它操作"
                ><MdvIcon :icon="moreIcon" /></MdvIconButton
            ></template>
            <MdvMenuItem headline="重做" :icon="redoIcon" @click="action('已重做')" />
            <MdvMenuItem headline="复制" :icon="copyIcon" @click="action('已复制')" />
          </MdvMenu>
        </MdvToolbar>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">长文字与放大字号</h3>
      <p class="text-sm text-mdv-on-surface-variant">
        上方的两倍文字、320px 容器、RTL
        和局部深色也作用于这里。文字按可用宽度换行，工具栏随内容增高。
      </p>
      <div
        class="toolbar-text-example"
        :class="{ 'toolbar-example--large': largeText }"
        :style="{ maxWidth: narrow ? '320px' : undefined }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <MdvToolbar aria-label="长标题文档操作">
          <template #leading>
            <MdvIconButton variant="standard" aria-label="撤销" @click="action('已撤销')">
              <MdvIcon :icon="undoIcon" />
            </MdvIconButton>
          </template>
          <MdvButton @click="action('当前编辑的版本已保存')">保存当前编辑的版本</MdvButton>
          <template #trailing>
            <MdvMenu>
              <template #trigger="{ triggerProps }">
                <MdvIconButton v-bind="triggerProps" variant="standard" aria-label="其它文档操作">
                  <MdvIcon :icon="moreIcon" />
                </MdvIconButton>
              </template>
              <MdvMenuItem
                headline="复制文档内容"
                :icon="copyIcon"
                @click="action('文档内容已复制')"
              />
            </MdvMenu>
          </template>
        </MdvToolbar>
        <div class="flex min-w-0 justify-center">
          <MdvToolbar variant="floating" color="vibrant" aria-label="导出文档">
            <MdvButton variant="text" @click="action('Document exported')">
              ExportCurrentDocumentWithLinkedResources
            </MdvButton>
            <MdvIconButton
              variant="standard"
              aria-label="复制导出链接"
              @click="action('导出链接已复制')"
            >
              <MdvIcon :icon="copyIcon" />
            </MdvIconButton>
          </MdvToolbar>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">Navigation Rail 与竖向工具栏</h3>
      <div class="toolbar-stage toolbar-rail-stage">
        <MdvNavigationRail alignment="center" aria-label="编辑工作区">
          <MdvNavigationRailItem
            label="首页"
            :active="railActive === 'home'"
            @click="railActive = 'home'"
            ><template #icon><MdvIcon :icon="homeIcon" /></template
          ></MdvNavigationRailItem>
          <MdvNavigationRailItem
            label="画布"
            :active="railActive === 'canvas'"
            @click="railActive = 'canvas'"
            ><template #icon><MdvIcon :icon="brushIcon" /></template
          ></MdvNavigationRailItem>
        </MdvNavigationRail>
        <p class="p-5 text-mdv-on-surface-variant">页面导航与画布操作分居两侧。</p>
        <MdvToolbar
          variant="floating"
          orientation="vertical"
          position="absolute"
          placement="end"
          aria-label="画布快捷操作"
        >
          <MdvIconButton v-model:selected="selected" variant="tonal" aria-label="画笔"
            ><MdvIcon :icon="brushIcon"
          /></MdvIconButton>
          <MdvDivider style="margin-inline: 8px; align-self: stretch" />
          <MdvIconButton variant="standard" aria-label="复制" @click="action('已复制画布')"
            ><MdvIcon :icon="copyIcon"
          /></MdvIconButton>
          <MdvIconButton variant="standard" aria-label="保存" @click="action('画布已保存')"
            ><MdvIcon :icon="saveIcon"
          /></MdvIconButton>
        </MdvToolbar>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">输入与对话框</h3>
      <MdvButton variant="tonal" @click="dialogOpen = true">打开文档操作</MdvButton>
      <MdvDialog v-model="dialogOpen" title="查找与编辑">
        <p class="mb-4">
          输入框内的左右键和 Home／End 保持文本编辑行为，Tab 可以继续访问右侧操作。
        </p>
        <MdvToolbar align="start" style="--mdv-toolbar-gap: 8px" aria-label="文档查找">
          <MdvTextField v-model="query" label="查找文字" class="toolbar-query" />
          <MdvIconButton
            variant="standard"
            aria-label="复制查找内容"
            @click="action(`已复制：${query || '空白'}`)"
            ><MdvIcon :icon="copyIcon"
          /></MdvIconButton>
        </MdvToolbar>
        <template #actions
          ><MdvButton variant="text" @click="dialogOpen = false">完成</MdvButton></template
        >
      </MdvDialog>
    </section>
  </div>
</template>

<style scoped>
.toolbar-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.toolbar-controls label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-controls select {
  min-height: 40px;
  border: 1px solid var(--mdv-sys-color-outline);
  border-radius: 8px;
  padding: 4px 10px;
  background: var(--mdv-sys-color-surface);
  color: var(--mdv-sys-color-on-surface);
}
.toolbar-stage {
  position: relative;
  min-height: 360px;
  overflow: clip;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 16px;
  background: var(--mdv-sys-color-surface-container-low);
  color: var(--mdv-sys-color-on-surface);
}
.toolbar-example--large {
  --mdv-sys-typescale-label-large-size: 28px;
  --mdv-sys-typescale-label-large-line-height: 40px;
  font-size: 1.25rem;
}
.toolbar-text-example {
  display: grid;
  min-width: 0;
  gap: 24px;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 16px;
  padding: 16px;
  background: var(--mdv-sys-color-surface-container-low);
  color: var(--mdv-sys-color-on-surface);
}
.toolbar-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 16px;
}
.toolbar-example {
  min-width: 0;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 16px;
  padding: 16px;
}
.toolbar-scroll-stage {
  height: 360px;
}
.toolbar-scroll-content {
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  padding-bottom: 104px;
  scrollbar-width: thin;
  scrollbar-color: var(--mdv-sys-color-outline-variant) transparent;
}
.toolbar-scroll-content:focus-visible {
  outline: 3px solid var(--mdv-sys-color-secondary);
  outline-offset: -3px;
}
.toolbar-narrow-example {
  display: flex;
  width: min(100%, 280px);
  min-height: 128px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 16px;
  background: var(--mdv-sys-color-surface-container-low);
}
.toolbar-rail-stage {
  display: flex;
  align-items: stretch;
  padding-inline-end: 104px;
}
.toolbar-rail-stage :deep(.mdv-navigation-rail) {
  align-self: stretch;
}
.toolbar-query {
  width: 192px;
  min-width: 0;
}
</style>
