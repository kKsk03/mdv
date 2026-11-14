<script setup lang="ts">
import { computed, ref } from 'vue'
import { MdvButton, MdvCarousel, MdvCheckbox, MdvTextField } from '@/index'
import type {
  MdvCarouselAlignment,
  MdvCarouselChangeDetail,
  MdvCarouselFlingBehavior,
  MdvCarouselItem,
  MdvCarouselKey,
  MdvCarouselVariant,
} from '@/index'

function landscape(background: string, mountain: string, sun: string) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${background}"/><circle cx="600" cy="150" r="64" fill="${sun}"/><path d="M-80 500 220 130 560 580H-80Z" fill="${mountain}"/><path d="M200 600 590 230 900 600Z" fill="${mountain}" opacity=".7"/><path d="M0 490Q200 420 400 510T800 480V600H0Z" fill="${sun}" opacity=".4"/></svg>`)}`
}
const gallery: MdvCarouselItem[] = [
  {
    key: 'lake',
    label: '山间湖泊',
    alt: '绿色山峦与晨光中的湖面',
    src: landscape('#bedbca', '#305e53', '#fff1bc'),
  },
  {
    key: 'desert',
    label: '沙漠日落',
    alt: '暖色天空下层叠的沙丘',
    src: landscape('#edc8ac', '#9d5b49', '#ffe9a0'),
  },
  {
    key: 'ocean',
    label: '海边假日',
    alt: '蓝色海岸与远处山峰',
    src: landscape('#b7dce9', '#426a91', '#f9edc8'),
  },
  {
    key: 'forest',
    label: '森林漫步',
    alt: '深绿色山林与金色天空',
    src: landscape('#d8d7ae', '#47634a', '#f5e3a8'),
  },
  {
    key: 'snow',
    label: '雪山清晨',
    alt: '淡紫色的高山与柔和晨光',
    src: landscape('#dbd4ed', '#777294', '#fff2db'),
  },
  {
    key: 'city',
    label: '旅途中的片刻',
    alt: '粉色天空下的远山',
    src: landscape('#ecd0d1', '#946e84', '#ffedbc'),
  },
  {
    key: 'night',
    label: '月下山谷',
    alt: '深蓝山谷与明亮月光',
    src: landscape('#a7b3d1', '#41486e', '#e4dfc4'),
  },
  {
    key: 'island',
    label: '岛屿与微风',
    alt: '柔和青色背景中的海岛',
    src: landscape('#bededb', '#4c7b79', '#fff0b2'),
  },
]
const items = ref([...gallery])
const current = ref<MdvCarouselKey | null>('lake')
const variant = ref<MdvCarouselVariant>('multi-browse')
const alignment = ref<MdvCarouselAlignment>('start')
const fling = ref<MdvCarouselFlingBehavior>('auto')
const width = ref(620)
const height = ref(205)
const itemSize = ref(186)
const rtl = ref(false)
const dark = ref(false)
const custom = ref(false)
const gestures = ref(true)
const rejected = ref(true)
const locked = ref<MdvCarouselKey | null>('lake')
const logs = ref<string[]>([])
const note = ref('保留的输入草稿')
const allVisible = ref(false)
const mixed = computed(() =>
  gallery.map((item, index) => ({ ...item, aspectRatio: [16 / 9, 9 / 16, 1, 3 / 4][index % 4] })),
)
function log(detail: MdvCarouselChangeDetail) {
  logs.value = [
    `${detail.reason} → ${detail.key ?? '空'}（第 ${detail.index + 1} 项）`,
    ...logs.value,
  ].slice(0, 6)
}
function updateLocked(key: MdvCarouselKey | null) {
  logs.value = [`请求 ${key}：${rejected.value ? '拒绝' : '接受'}`, ...logs.value].slice(0, 6)
  if (!rejected.value) locked.value = key
}
function rotate() {
  if (items.value.length) items.value = [...items.value.slice(1), items.value[0]!]
}
function removeCurrent() {
  items.value = items.value.filter((item) => item.key !== current.value)
}
function reset() {
  items.value = [...gallery]
  current.value = 'lake'
}
</script>

<template>
  <div class="space-y-8">
    <p>
      对照
      <a
        href="https://m3.material.io/components/carousel/specs"
        class="text-mdv-primary underline"
        target="_blank"
        rel="noreferrer"
        >Material 3 Carousel</a
      >，可拖动、使用横向触控板或 Shift＋滚轮，也可用下方按钮与键盘浏览。
    </p>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">布局、尺寸与动态列表</h2>
      <div class="flex flex-wrap items-center gap-4">
        <label
          >布局
          <select v-model="variant" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>multi-browse</option>
            <option>uncontained</option>
            <option>hero</option>
            <option>full-screen</option>
          </select></label
        >
        <label
          >对齐
          <select v-model="alignment" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>start</option>
            <option>center</option>
          </select></label
        >
        <label
          >滚动
          <select v-model="fling" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>auto</option>
            <option>single-advance</option>
            <option>multi-browse</option>
            <option>no-snap</option>
          </select></label
        >
        <label
          >容器宽 {{ width }}px <input v-model.number="width" type="range" min="200" max="1000"
        /></label>
        <label
          >高度 {{ height }}px <input v-model.number="height" type="range" min="160" max="640"
        /></label>
        <label
          >首选项宽 {{ itemSize }}px
          <input v-model.number="itemSize" type="range" min="120" max="400"
        /></label>
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="rtl" label="RTL" /><MdvCheckbox
          v-model="dark"
          label="局部深色"
        /><MdvCheckbox v-model="custom" label="局部令牌" /><MdvCheckbox
          v-model="gestures"
          label="启用拖动／滚轮"
        />
      </div>
      <div
        class="max-w-full rounded-mdv-medium bg-mdv-surface"
        :data-mdv-theme="dark ? 'dark' : 'light'"
        :dir="rtl ? 'rtl' : 'ltr'"
        :style="{ width: `${width}px` }"
      >
        <MdvCarousel
          v-model="current"
          :items="items"
          :variant="variant"
          :alignment="alignment"
          :fling-behavior="fling"
          :item-size="itemSize"
          :height="variant === 'full-screen' ? Math.max(height, 480) : height"
          :user-scroll-enabled="gestures"
          :style="
            custom
              ? {
                  '--mdv-carousel-radius': '16px',
                  '--mdv-carousel-background': 'var(--mdv-sys-color-tertiary-container)',
                }
              : undefined
          "
          aria-label="旅行相册"
          @change="log"
        />
      </div>
      <p>
        当前 key：<code>{{ current ?? '空' }}</code
        >。开启系统的减弱动画后，可观察相同尺寸、无展开和视差的呈现。
      </p>
      <div class="flex flex-wrap gap-2">
        <MdvButton variant="tonal" @click="rotate">首项移至末尾</MdvButton
        ><MdvButton variant="tonal" @click="removeCurrent">移除当前项</MdvButton
        ><MdvButton variant="text" @click="items = []">清空</MdvButton
        ><MdvButton variant="text" @click="reset">恢复</MdvButton>
      </div>
    </section>

    <section class="space-y-6 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">官方布局</h2>
      <div class="grid min-w-0 gap-6 lg:grid-cols-2">
        <div class="min-w-0">
          <h3 class="px-4 text-mdv-title-medium">Multi-browse</h3>
          <MdvCarousel :items="gallery" :item-size="220" aria-label="多项旅行照片" />
        </div>
        <div class="min-w-0">
          <h3 class="px-4 text-mdv-title-medium">Uncontained</h3>
          <MdvCarousel
            :items="gallery"
            variant="uncontained"
            :item-size="180"
            aria-label="自由浏览旅行照片"
          />
        </div>
        <div class="min-w-0">
          <h3 class="px-4 text-mdv-title-medium">Hero</h3>
          <MdvCarousel :items="gallery" variant="hero" aria-label="推荐目的地" />
        </div>
        <div class="min-w-0">
          <h3 class="px-4 text-mdv-title-medium">居中 Hero</h3>
          <MdvCarousel
            :items="gallery"
            variant="hero"
            alignment="center"
            aria-label="居中的推荐目的地"
          />
        </div>
      </div>
      <div>
        <h3 class="px-4 text-mdv-title-medium">多宽高比 Uncontained</h3>
        <MdvCarousel
          :items="mixed"
          variant="uncontained"
          :height="256"
          aria-label="不同画幅的旅行照片"
        />
      </div>
      <div class="mx-auto max-w-full" style="width: 340px; height: 560px">
        <MdvCarousel
          :items="gallery"
          variant="full-screen"
          aria-label="沉浸式旅行照片"
          :show-controls="true"
        />
      </div>
    </section>

    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">内容插槽与查看全部</h2>
      <MdvCarousel
        :items="gallery"
        variant="uncontained"
        :item-size="280"
        :height="300"
        aria-label="旅行计划"
      >
        <template #header><h3 class="text-mdv-title-medium">我的旅行计划</h3></template>
        <template #item="{ item, active }">
          <article
            class="flex h-full flex-col gap-3 rounded-mdv-extra-large border border-mdv-outline-variant bg-mdv-surface-container p-4"
          >
            <img
              :src="item.src"
              :alt="item.alt"
              draggable="false"
              class="h-20 w-full rounded-mdv-medium object-cover"
            />
            <h4 class="text-mdv-title-medium">{{ item.label }}</h4>
            <MdvTextField v-model="note" label="行程备注" />
            <span class="text-mdv-body-small">{{ active ? '当前浏览项' : '待浏览' }}</span>
          </article>
        </template>
        <template #controls="{ previous, next, canPrevious, canNext }"
          ><MdvButton variant="text" :disabled="!canPrevious" @click="previous()">上一项</MdvButton
          ><MdvButton variant="text" :disabled="!canNext" @click="next()">下一项</MdvButton
          ><MdvButton variant="tonal" @click="allVisible = !allVisible">{{
            allVisible ? '收起全部' : '查看全部'
          }}</MdvButton></template
        >
      </MdvCarousel>
      <div v-if="allVisible" class="grid gap-4 sm:grid-cols-2">
        <article
          v-for="item in gallery"
          :key="item.key"
          class="rounded-mdv-medium bg-mdv-surface-container p-4"
        >
          <h3 class="text-mdv-title-medium">{{ item.label }}</h3>
          <p>{{ item.alt }}</p>
        </article>
      </div>
    </section>

    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">受控拒绝与边界</h2>
      <MdvCheckbox v-model="rejected" label="拒绝定位请求" />
      <MdvCarousel
        :items="gallery"
        :model-value="locked"
        aria-label="受控相册"
        @update:model-value="updateLocked"
      />
      <p>已接受的 key：{{ locked }}</p>
      <div class="grid min-w-0 gap-4 md:grid-cols-2">
        <MdvCarousel :items="[gallery[0]!]" aria-label="单张照片" /><MdvCarousel
          :items="[{ ...gallery[1]!, disabled: true }, gallery[2]!]"
          variant="hero"
          aria-label="包含禁用操作的照片"
        />
      </div>
      <pre
        class="overflow-auto whitespace-pre-wrap rounded-mdv-medium bg-mdv-surface-container p-3 text-mdv-body-small"
        >{{ logs.join('\n') || '尚未请求定位' }}</pre>
    </section>
  </div>
</template>
