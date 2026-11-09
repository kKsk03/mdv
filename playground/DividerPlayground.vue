<script setup lang="ts">
import { ref } from 'vue'
import formatBold from '@iconify-icons/material-symbols/format-bold'
import formatItalic from '@iconify-icons/material-symbols/format-italic'
import formatUnderlined from '@iconify-icons/material-symbols/format-underlined'
import { MdvButton, MdvCard, MdvDivider, MdvIcon, MdvIconButton } from '@/index'
import type { MdvDividerVariant } from '@/index'

const variants: { value: MdvDividerVariant; label: string; description: string }[] = [
  { value: 'full-width', label: 'Full-width 全宽', description: '两端均不缩进' },
  { value: 'inset', label: 'Inset 单端缩进', description: '起始端 16px，末端 0' },
  { value: 'middle-inset', label: 'Middle-inset 双端缩进', description: '两端各 16px' },
]
const bold = ref(false)
const italic = ref(false)
const underlined = ref(false)
const action = ref('尚未操作。')
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="divider-horizontal-title" class="space-y-4">
      <h2 id="divider-horizontal-title" class="text-mdv-title-large">三种标准缩进</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        默认 1px、outline-variant 色、方形线端。每个容器内的文字距两侧 16px，可与线条端点对照。
      </p>
      <div class="grid gap-5 md:grid-cols-3">
        <div v-for="variant in variants" :key="variant.value" class="min-w-0 space-y-3">
          <h3 class="text-mdv-title-medium">{{ variant.label }}</h3>
          <div class="rounded-mdv-medium bg-mdv-surface-container-low">
            <p class="p-4">第一组内容</p>
            <MdvDivider :variant="variant.value" />
            <p class="p-4 text-mdv-on-surface-variant">{{ variant.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="divider-vertical-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="divider-vertical-title" class="text-mdv-title-large">竖向工具栏与显式高度</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        第一条线由横向 flex 容器拉伸到 64px；第二条通过 h-8、self-center 工具类设为 32px
        并居中。分割线不占用 Tab 位置。
      </p>
      <div
        role="group"
        aria-label="文字格式"
        class="flex h-16 max-w-md items-center gap-2 rounded-mdv-medium bg-mdv-surface-container-low px-3"
      >
        <MdvIconButton v-model:selected="bold" variant="standard" aria-label="加粗">
          <MdvIcon :icon="formatBold" />
        </MdvIconButton>
        <MdvDivider orientation="vertical" />
        <MdvIconButton v-model:selected="italic" variant="standard" aria-label="斜体">
          <MdvIcon :icon="formatItalic" />
        </MdvIconButton>
        <MdvDivider orientation="vertical" class="h-8 self-center" />
        <MdvIconButton v-model:selected="underlined" variant="standard" aria-label="下划线">
          <MdvIcon :icon="formatUnderlined" />
        </MdvIconButton>
      </div>
      <p :class="{ 'font-bold': bold, italic, underline: underlined }">
        选择格式，查看这段文字的变化。
      </p>

      <div class="grid gap-5 lg:grid-cols-3">
        <div v-for="variant in variants" :key="variant.value" class="min-w-0 space-y-3">
          <h3 class="text-mdv-title-medium">{{ variant.label }}</h3>
          <div
            class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4 rounded-mdv-medium bg-mdv-surface-container-low p-4"
          >
            <p>简短内容</p>
            <MdvDivider orientation="vertical" :variant="variant.value" />
            <p class="text-mdv-on-surface-variant">
              这一侧的内容稍长。分割线随网格行高拉伸，不需要测量文字或固定整个容器的高度。
            </p>
          </div>
        </div>
      </div>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        竖向 inset 映射为顶部 16px，middle-inset 为上下各 16px；周围留白由容器 gap 和 padding 控制。
      </p>
    </section>

    <section
      aria-labelledby="divider-card-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="divider-card-title" class="text-mdv-title-large">卡片内的内容分组</h2>
      <MdvCard title="湖畔小屋" subtitle="周末的慢旅行" class="max-w-lg">
        <div class="space-y-4">
          <p>沿着湖边步道散步，在傍晚之前回到小屋。</p>
          <MdvDivider />
          <p class="text-mdv-on-surface-variant">两晚住宿 · 早餐 · 湖边步道</p>
        </div>
        <template #actions>
          <MdvButton variant="text" @click="action = '已查看行程。'">查看行程</MdvButton>
          <MdvButton @click="action = '已收藏湖畔小屋。'">收藏</MdvButton>
        </template>
      </MdvCard>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        这里的 full-width 占满卡片正文可用宽度；卡片自身的内容留白仍由卡片管理。
      </p>
    </section>

    <section
      aria-labelledby="divider-boundaries-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="divider-boundaries-title" class="text-mdv-title-large">RTL 与窄容器</h2>
      <div class="grid items-start gap-5 md:grid-cols-2">
        <div dir="rtl" class="space-y-4 rounded-mdv-medium bg-mdv-surface-container-low py-4">
          <p class="px-4 text-mdv-title-medium">RTL：起始端在右侧</p>
          <template v-for="variant in variants" :key="variant.value">
            <MdvDivider :variant="variant.value" />
            <p class="px-4 text-mdv-body-medium">{{ variant.label }}</p>
          </template>
        </div>
        <div class="space-y-3">
          <h3 class="text-mdv-title-medium">180px 窄容器</h3>
          <div
            class="w-[180px] max-w-full space-y-4 rounded-mdv-medium bg-mdv-surface-container-low py-4"
          >
            <p class="px-4">长中文与 English content 自然换行。</p>
            <MdvDivider variant="inset" />
            <p class="px-4 text-mdv-body-medium">单端缩进</p>
            <MdvDivider variant="middle-inset" />
            <p class="px-4 text-mdv-body-medium">双端缩进，不撑出容器。</p>
          </div>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="divider-theme-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="divider-theme-title" class="text-mdv-title-large">局部主题与样式覆盖</h2>
      <div class="grid gap-5 md:grid-cols-2">
        <div
          data-mdv-theme="dark"
          class="space-y-4 rounded-mdv-medium bg-mdv-surface-container-low p-4 text-mdv-on-surface"
        >
          <h3 class="text-mdv-title-medium">局部深色</h3>
          <MdvDivider />
          <p class="text-mdv-body-medium text-mdv-on-surface-variant">
            使用当前主题的 outline-variant；也可用页面上方的种子色与浅深主题控制对照。
          </p>
        </div>
        <div
          class="space-y-4 rounded-mdv-medium bg-mdv-surface-container-low p-4"
          style="--mdv-sys-color-outline-variant: var(--mdv-sys-color-primary)"
        >
          <h3 class="text-mdv-title-medium">局部令牌 + 2px 厚度</h3>
          <MdvDivider style="height: 2px" />
          <p class="text-mdv-body-medium text-mdv-on-surface-variant">
            仅当前容器将线条角色改为 primary；厚度由这条线自己的 style 设置。
          </p>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="divider-semantics-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="divider-semantics-title" class="text-mdv-title-large">装饰与语义分隔</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        普通示例默认隐藏于辅助技术。下面显式使用非交互 separator，方向为
        horizontal，名称为“内容与操作区”。按 Tab 会直接在前后按钮之间移动。
      </p>
      <div class="space-y-4 rounded-mdv-medium bg-mdv-surface-container-low p-4">
        <MdvButton variant="outlined" @click="action = '已点击分割线前的按钮。'">前一项</MdvButton>
        <MdvDivider :decorative="false" aria-label="内容与操作区" />
        <MdvButton variant="outlined" @click="action = '已点击分割线后的按钮。'">后一项</MdvButton>
      </div>
    </section>

    <p role="status" class="text-mdv-body-medium text-mdv-on-surface-variant">{{ action }}</p>
  </div>
</template>
