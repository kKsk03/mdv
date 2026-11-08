<script setup lang="ts">
import { ref } from 'vue'
import add from '@iconify-icons/material-symbols/add'
import check from '@iconify-icons/material-symbols/check'
import close from '@iconify-icons/material-symbols/close'
import download from '@iconify-icons/material-symbols/download'
import favorite from '@iconify-icons/material-symbols/favorite'
import favoriteOutline from '@iconify-icons/material-symbols/favorite-outline'
import favoriteRounded from '@iconify-icons/material-symbols/favorite-rounded'
import favoriteOutlineRounded from '@iconify-icons/material-symbols/favorite-outline-rounded'
import favoriteSharp from '@iconify-icons/material-symbols/favorite-sharp'
import favoriteOutlineSharp from '@iconify-icons/material-symbols/favorite-outline-sharp'
import homeOutline from '@iconify-icons/material-symbols/home-outline'
import info from '@iconify-icons/material-symbols/info'
import openInNew from '@iconify-icons/material-symbols/open-in-new'
import save from '@iconify-icons/material-symbols/save'
import search from '@iconify-icons/material-symbols/search'
import settings from '@iconify-icons/material-symbols/settings'
import warning from '@iconify-icons/material-symbols/warning'
import { MdvButton, MdvIcon, MdvIconButton } from '@/index'

const icons = [
  { name: 'home-outline', icon: homeOutline },
  { name: 'favorite-outline', icon: favoriteOutline },
  { name: 'search', icon: search },
  { name: 'settings', icon: settings },
  { name: 'add', icon: add },
  { name: 'check', icon: check },
  { name: 'close', icon: close },
  { name: 'info', icon: info },
  { name: 'warning', icon: warning },
  { name: 'download', icon: download },
  { name: 'save', icon: save },
  { name: 'open-in-new', icon: openInNew },
]
const styles = [
  { name: 'Outlined', outline: favoriteOutline, filled: favorite },
  { name: 'Rounded', outline: favoriteOutlineRounded, filled: favoriteRounded },
  { name: 'Sharp', outline: favoriteOutlineSharp, filled: favoriteSharp },
]
const buttonSizes = ['xs', 's', 'm', 'l', 'xl'] as const
const size = ref(32)
const customColor = ref('#006c4c')
const selected = ref(false)
const loading = ref(false)
const disabled = ref(false)
const count = ref(0)
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="icon-gallery-title" class="space-y-4">
      <div>
        <h2 id="icon-gallery-title" class="text-mdv-headline-small">MdvIcon</h2>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          默认 24px，颜色继承所在位置的文字色。下面是部分 Material Symbols 图标。
        </p>
      </div>
      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <li
          v-for="item in icons"
          :key="item.name"
          class="flex min-w-0 flex-col items-center gap-3 rounded-mdv-medium border border-mdv-outline-variant px-3 py-5"
        >
          <MdvIcon :icon="item.icon" />
          <span class="max-w-full break-words text-center text-mdv-body-small">{{
            item.name
          }}</span>
        </li>
      </ul>
    </section>

    <section
      aria-labelledby="icon-styles-title"
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
    >
      <h2 id="icon-styles-title" class="text-mdv-title-large">风格与填充</h2>
      <div class="mt-5 grid gap-4 sm:grid-cols-3">
        <div
          v-for="style in styles"
          :key="style.name"
          class="rounded-mdv-medium bg-mdv-surface-container-low p-4"
        >
          <h3 class="text-mdv-title-medium">{{ style.name }}</h3>
          <div class="mt-4 flex items-center gap-8">
            <div class="grid justify-items-center gap-2">
              <MdvIcon :icon="style.outline" :size="32" />
              <span class="text-mdv-body-small">空心</span>
            </div>
            <div class="grid justify-items-center gap-2">
              <MdvIcon :icon="style.filled" :size="32" />
              <span class="text-mdv-body-small">实心</span>
            </div>
          </div>
        </div>
      </div>
      <p class="mt-4 text-mdv-body-small text-mdv-on-surface-variant">
        推荐以 Outlined 400 为基线。风格与填充由导入的图形决定。
      </p>
    </section>

    <section
      aria-labelledby="icon-size-color-title"
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
    >
      <h2 id="icon-size-color-title" class="text-mdv-title-large">尺寸与颜色</h2>
      <div class="mt-5 flex flex-wrap items-center gap-6">
        <label class="grid gap-2 text-mdv-label-large">
          尺寸 {{ size }}px
          <input
            v-model.number="size"
            type="range"
            min="16"
            max="64"
            class="w-48 accent-mdv-primary"
          />
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          自定义颜色 {{ customColor }}
          <input v-model="customColor" type="color" class="h-10 w-20 cursor-pointer" />
        </label>
        <div class="flex min-h-20 items-center gap-5">
          <MdvIcon :icon="favorite" :size="size" :color="customColor" />
          <span class="text-mdv-body-small">直接使用所选颜色</span>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-6">
        <div class="inline-flex items-center gap-2 text-mdv-primary">
          <MdvIcon :icon="homeOutline" />
          <span>继承 primary 文字色</span>
        </div>
        <div class="inline-flex items-center gap-2 text-mdv-error">
          <MdvIcon :icon="warning" />
          <span>继承 error 文字色</span>
        </div>
        <div class="inline-flex items-center gap-2 text-mdv-title-large">
          <MdvIcon :icon="info" size="1em" />
          <span>1em 跟随字号</span>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap items-center gap-6">
        <div
          v-for="value in [16, 20, 24, 32, 40, 48]"
          :key="value"
          class="grid justify-items-center gap-2"
        >
          <MdvIcon :icon="search" :size="value" />
          <span class="text-mdv-body-small">{{ value }}px</span>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="icon-buttons-title"
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
    >
      <h2 id="icon-buttons-title" class="text-mdv-title-large">与按钮组合</h2>
      <div class="mt-5 flex flex-wrap gap-5">
        <label class="inline-flex min-h-12 items-center gap-2">
          <input v-model="loading" type="checkbox" class="size-4 accent-mdv-primary" />
          loading
        </label>
        <label class="inline-flex min-h-12 items-center gap-2">
          <input v-model="disabled" type="checkbox" class="size-4 accent-mdv-primary" />
          disabled
        </label>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-4">
        <MdvButton :loading="loading" :disabled="disabled" loading-text="保存中…" @click="count++">
          <template #leading><MdvIcon :icon="save" /></template>
          保存
        </MdvButton>
        <MdvButton variant="outlined" :loading="loading" :disabled="disabled" @click="count++">
          查看详情
          <template #trailing><MdvIcon :icon="openInNew" /></template>
        </MdvButton>
        <MdvIconButton
          v-model:selected="selected"
          :loading="loading"
          :disabled="disabled"
          aria-label="收藏"
        >
          <MdvIcon :icon="selected ? favorite : favoriteOutline" />
        </MdvIconButton>
        <p role="status" class="text-mdv-body-medium">
          操作 {{ count }} 次；{{ selected ? '已收藏' : '未收藏' }}
        </p>
      </div>
      <div class="mt-6 flex flex-wrap items-center gap-5">
        <div v-for="value in buttonSizes" :key="value" class="grid justify-items-center gap-3">
          <MdvIconButton :size="value" :aria-label="`${value} 尺寸的收藏按钮`">
            <MdvIcon :icon="favorite" />
          </MdvIconButton>
          <span class="text-mdv-body-small">{{ value }}</span>
        </div>
      </div>
      <p class="mt-4 text-mdv-body-small text-mdv-on-surface-variant">
        图标省略 size 时跟随按钮容器。loading 不自动禁止操作；按钮的名称保留在按钮本身。
      </p>
    </section>

    <section
      aria-labelledby="icon-accessibility-title"
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
    >
      <h2 id="icon-accessibility-title" class="text-mdv-title-large">图标语义</h2>
      <div class="mt-5 flex flex-wrap items-center gap-8">
        <p class="inline-flex items-center gap-2">
          <MdvIcon :icon="check" color="var(--mdv-sys-color-success)" />
          已保存（图标仅作装饰）
        </p>
        <div class="grid justify-items-center gap-2">
          <MdvIcon :icon="check" aria-label="保存成功" color="var(--mdv-sys-color-success)" />
          <span class="text-mdv-body-small">通过 aria-label 命名</span>
        </div>
        <div class="grid justify-items-center gap-2">
          <MdvIcon :icon="warning" aria-labelledby="icon-warning-label" />
          <span id="icon-warning-label" class="text-mdv-body-small">需要关注</span>
        </div>
      </div>
      <p class="mt-4 text-mdv-body-small text-mdv-on-surface-variant">
        默认隐藏装饰图标；提供名称后使用 img 语义。Tab 应跳过独立图标，图标按钮由按钮接收焦点。
      </p>
    </section>
  </div>
</template>
