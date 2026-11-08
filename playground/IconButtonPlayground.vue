<script setup lang="ts">
import { computed, ref } from 'vue'
import favorite from '@iconify-icons/material-symbols/favorite'
import favoriteOutline from '@iconify-icons/material-symbols/favorite-outline'
import openInNew from '@iconify-icons/material-symbols/open-in-new'
import save from '@iconify-icons/material-symbols/save'
import { MdvIcon, MdvIconButton } from '@/index'
import type {
  MdvIconButtonColor,
  MdvIconButtonShape,
  MdvIconButtonSize,
  MdvIconButtonVariant,
  MdvIconButtonWidth,
} from '@/index'

const variants: MdvIconButtonVariant[] = ['filled', 'tonal', 'outlined', 'standard']
const sizes: {
  value: MdvIconButtonSize
  height: number
  icon: number
  widths: [number, number, number]
}[] = [
  { value: 'xs', height: 32, icon: 20, widths: [28, 32, 40] },
  { value: 's', height: 40, icon: 24, widths: [32, 40, 52] },
  { value: 'm', height: 56, icon: 24, widths: [48, 56, 72] },
  { value: 'l', height: 96, icon: 32, widths: [64, 96, 128] },
  { value: 'xl', height: 136, icon: 40, widths: [104, 136, 184] },
]
const widths: MdvIconButtonWidth[] = ['narrow', 'default', 'wide']
const shapes: MdvIconButtonShape[] = ['round', 'square']
const presets = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'info'] as const
const states = [
  { label: '普通', selected: undefined, disabled: false, loading: false },
  { label: '未选中', selected: false, disabled: false, loading: false },
  { label: '已选中', selected: true, disabled: false, loading: false },
  { label: '禁用', selected: undefined, disabled: true, loading: false },
  { label: '禁用未选', selected: false, disabled: true, loading: false },
  { label: '禁用已选', selected: true, disabled: true, loading: false },
  { label: '加载', selected: undefined, disabled: false, loading: true },
] as const

const size = ref<MdvIconButtonSize>('s')
const width = ref<MdvIconButtonWidth>('default')
const shape = ref<MdvIconButtonShape>('round')
const colorChoice = ref<MdvIconButtonColor | 'default' | 'custom'>('default')
const seedDraft = ref('#006c4c')
const seed = ref<`#${string}`>('#006c4c')
const seedError = ref('')
const color = computed(() =>
  colorChoice.value === 'default'
    ? undefined
    : colorChoice.value === 'custom'
      ? seed.value
      : colorChoice.value,
)
const disabled = ref(false)
const loading = ref(false)
const selected = ref<Record<MdvIconButtonVariant, boolean>>({
  filled: false,
  tonal: false,
  outlined: false,
  standard: false,
})
const shapeSelected = ref<Record<MdvIconButtonShape, boolean>>({ round: false, square: false })
const clickCount = ref(0)
const lastTouch = ref('尚未点击')
const submitCount = ref(0)
const resetCount = ref(0)
const colorSamples = computed<{ value: MdvIconButtonColor | undefined; label: string }[]>(() => [
  { value: undefined, label: '默认' },
  ...presets.map((value) => ({ value, label: value })),
  { value: seed.value, label: seed.value },
])

function applySeed() {
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(seedDraft.value)) {
    seedError.value = '请输入 #RGB 或 #RRGGBB，例如 #06C 或 #006c4c。'
    return
  }
  seed.value = seedDraft.value as `#${string}`
  colorChoice.value = 'custom'
  seedError.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="icon-button-interaction-title" class="space-y-5">
      <div>
        <h2 id="icon-button-interaction-title" class="text-mdv-headline-small">MdvIconButton</h2>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          四种官方外观，默认 filled / s / default width /
          round。普通按钮使用实心图标；切换按钮由空心变实心。 使用鼠标、Tab、Enter
          和空格检查交互，上方主题控制对整页生效。
        </p>
      </div>

      <div class="rounded-mdv-large border border-mdv-outline-variant p-5">
        <div class="flex flex-wrap items-end gap-5">
          <label class="grid gap-2 text-mdv-label-large">
            尺寸
            <select v-model="size" class="playground-control">
              <option v-for="item in sizes" :key="item.value" :value="item.value">
                {{ item.value }} · {{ item.height }}px
              </option>
            </select>
          </label>
          <label class="grid gap-2 text-mdv-label-large">
            宽度
            <select v-model="width" class="playground-control">
              <option v-for="item in widths" :key="item">{{ item }}</option>
            </select>
          </label>
          <label class="grid gap-2 text-mdv-label-large">
            未选形状
            <select v-model="shape" class="playground-control">
              <option v-for="item in shapes" :key="item">{{ item }}</option>
            </select>
          </label>
          <label class="grid gap-2 text-mdv-label-large">
            颜色
            <select v-model="colorChoice" class="playground-control">
              <option value="default">默认官方配色</option>
              <option v-for="preset in presets" :key="preset">{{ preset }}</option>
              <option value="custom">自定义种子色</option>
            </select>
          </label>
          <label class="inline-flex min-h-12 items-center gap-2">
            <input v-model="disabled" class="size-4 accent-mdv-primary" type="checkbox" />
            disabled
          </label>
          <label class="inline-flex min-h-12 items-center gap-2">
            <input v-model="loading" class="size-4 accent-mdv-primary" type="checkbox" />
            loading
          </label>
        </div>

        <form class="mt-5 flex flex-wrap items-end gap-3" novalidate @submit.prevent="applySeed">
          <label class="grid gap-2 text-mdv-label-large" for="icon-button-seed">
            局部种子色
            <input
              id="icon-button-seed"
              v-model="seedDraft"
              class="playground-control w-36 font-mono"
              type="text"
              :aria-invalid="seedError ? true : undefined"
              :aria-describedby="seedError ? 'icon-button-seed-error' : undefined"
              autocomplete="off"
              :spellcheck="false"
            />
          </label>
          <button class="playground-control" type="submit">应用种子色</button>
        </form>
        <p v-if="seedError" id="icon-button-seed-error" role="alert" class="mt-2 text-mdv-error">
          {{ seedError }}
        </p>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <div
            v-for="variant in variants"
            :key="variant"
            class="min-w-0 rounded-mdv-medium bg-mdv-surface-container-low p-4"
          >
            <h3 class="text-mdv-title-medium">{{ variant }}</h3>
            <div class="mt-4 flex flex-wrap items-center gap-6">
              <div class="grid justify-items-center gap-2">
                <MdvIconButton
                  :variant="variant"
                  :size="size"
                  :width="width"
                  :shape="shape"
                  :color="color"
                  :disabled="disabled"
                  :loading="loading"
                  aria-label="收藏"
                  @click="clickCount++"
                >
                  <MdvIcon :icon="favorite" />
                </MdvIconButton>
                <span class="text-mdv-label-medium">普通按钮</span>
              </div>
              <div class="grid justify-items-center gap-2">
                <MdvIconButton
                  v-model:selected="selected[variant]"
                  :variant="variant"
                  :size="size"
                  :width="width"
                  :shape="shape"
                  :color="color"
                  :disabled="disabled"
                  :loading="loading"
                  aria-label="收藏"
                  @click="clickCount++"
                >
                  <template #default><MdvIcon :icon="favoriteOutline" /></template>
                  <template #selected><MdvIcon :icon="favorite" /></template>
                </MdvIconButton>
                <span class="text-mdv-label-medium">
                  切换 · {{ selected[variant] ? '已选中' : '未选中' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-5 text-mdv-body-medium" role="status">有效点击：{{ clickCount }} 次</p>
        <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
          loading 只替换图标，仍可点击与切换；disabled 才阻止操作。选中时 round ↔
          square，按住和释放不改变圆角。
        </p>
      </div>
    </section>

    <section aria-labelledby="icon-button-size-title" class="space-y-4">
      <h2 id="icon-button-size-title" class="text-mdv-title-large">五档尺寸 × 三档宽度</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        标注的是可见容器；实际命中区至少 48 × 48px。此表跟随上方形状与颜色选择。
      </p>
      <div class="overflow-x-auto rounded-mdv-large border border-mdv-outline-variant">
        <table class="w-full text-start text-mdv-body-medium">
          <thead>
            <tr class="bg-mdv-surface-container-low">
              <th scope="col" class="p-4 text-start">尺寸／图标</th>
              <th v-for="item in widths" :key="item" scope="col" class="p-4">{{ item }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sizes" :key="item.value" class="border-t border-mdv-outline-variant">
              <th scope="row" class="p-4 text-start whitespace-nowrap">
                {{ item.value }}／{{ item.icon }}px
              </th>
              <td v-for="(itemWidth, index) in widths" :key="itemWidth" class="p-4">
                <div class="grid justify-items-center gap-3">
                  <MdvIconButton
                    :size="item.value"
                    :width="itemWidth"
                    :shape="shape"
                    :color="color"
                    :aria-label="`收藏，${item.value}，${itemWidth}`"
                  >
                    <MdvIcon :icon="favorite" />
                  </MdvIconButton>
                  <span class="text-mdv-label-medium whitespace-nowrap">
                    {{ item.widths[index] }} × {{ item.height }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="icon-button-states-title" class="space-y-4">
      <h2 id="icon-button-states-title" class="text-mdv-title-large">默认配色与状态对照</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        固定默认色与 s 档；选中状态由示例固定，点击不会改变，便于比较浅深色与禁用规则。
      </p>
      <div class="overflow-x-auto rounded-mdv-large border border-mdv-outline-variant">
        <table class="w-full text-mdv-body-medium">
          <thead>
            <tr class="bg-mdv-surface-container-low">
              <th scope="col" class="p-4 text-start">外观</th>
              <th
                v-for="state in states"
                :key="state.label"
                scope="col"
                class="p-4 whitespace-nowrap"
              >
                {{ state.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="variant in variants"
              :key="variant"
              class="border-t border-mdv-outline-variant"
            >
              <th scope="row" class="p-4 text-start">{{ variant }}</th>
              <td v-for="state in states" :key="state.label" class="p-4 text-center">
                <MdvIconButton
                  :variant="variant"
                  :shape="shape"
                  :selected="state.selected"
                  :disabled="state.disabled"
                  :loading="state.loading"
                  :aria-label="`收藏，${variant}，${state.label}`"
                >
                  <template #default>
                    <MdvIcon :icon="state.selected === false ? favoriteOutline : favorite" />
                  </template>
                  <template #selected><MdvIcon :icon="favorite" /></template>
                </MdvIconButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="icon-button-colors-title" class="space-y-4">
      <h2 id="icon-button-colors-title" class="text-mdv-title-large">预设色与种子色</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        每组左侧未选、右侧已选。自定义种子色使用上方输入，默认配色与显式 primary 的 tonal／outlined
        行为不同。
      </p>
      <div class="overflow-x-auto rounded-mdv-large border border-mdv-outline-variant">
        <table class="w-full text-mdv-body-medium">
          <thead>
            <tr class="bg-mdv-surface-container-low">
              <th scope="col" class="p-4 text-start">颜色</th>
              <th v-for="variant in variants" :key="variant" scope="col" class="p-4">
                {{ variant }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sample in colorSamples"
              :key="sample.label"
              class="border-t border-mdv-outline-variant"
            >
              <th scope="row" class="p-4 text-start whitespace-nowrap">{{ sample.label }}</th>
              <td v-for="variant in variants" :key="variant" class="p-3">
                <div class="flex justify-center gap-2">
                  <MdvIconButton
                    v-for="isSelected in [false, true]"
                    :key="String(isSelected)"
                    :variant="variant"
                    :color="sample.value"
                    :selected="isSelected"
                    :aria-label="`收藏，${sample.label}，${variant}`"
                  >
                    <template #default><MdvIcon :icon="favoriteOutline" /></template>
                    <template #selected><MdvIcon :icon="favorite" /></template>
                  </MdvIconButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      aria-labelledby="icon-button-shape-title"
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
    >
      <h2 id="icon-button-shape-title" class="text-mdv-title-large">选中形变与 scoped 插槽</h2>
      <div class="mt-5 flex flex-wrap gap-8">
        <div v-for="item in shapes" :key="item" class="grid justify-items-center gap-3">
          <MdvIconButton
            v-model:selected="shapeSelected[item]"
            variant="tonal"
            size="m"
            :shape="item"
            aria-label="收藏"
          >
            <template #default="slot">
              <MdvIcon :icon="slot.selected ? favorite : favoriteOutline" />
            </template>
          </MdvIconButton>
          <span class="text-mdv-body-medium"
            >起始 {{ item }} · {{ shapeSelected[item] ? '已选' : '未选' }}</span
          >
        </div>
      </div>
      <p class="mt-4 text-mdv-body-small text-mdv-on-surface-variant">
        图标也可由默认插槽的 selected
        参数切换。系统开启减少动态效果后，形状直接切换，加载指示器停止旋转。
      </p>
    </section>

    <section
      aria-labelledby="icon-button-touch-title"
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
    >
      <h2 id="icon-button-touch-title" class="text-mdv-title-large">相邻命中区域</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        xs / narrow 的可见容器为 28 × 32px，每个虚线格占 48 ×
        48px。点击容器外、格子内的留白也应只命中对应按钮。
      </p>
      <div class="mt-5 inline-flex">
        <div
          v-for="index in 3"
          :key="index"
          class="bg-mdv-surface-container-low outline outline-dashed outline-mdv-outline-variant"
        >
          <MdvIconButton
            size="xs"
            width="narrow"
            :aria-label="`按钮 ${index}`"
            @click="lastTouch = `按钮 ${index}`"
          >
            <MdvIcon :icon="favorite" />
          </MdvIconButton>
        </div>
      </div>
      <p class="mt-4" role="status">最近命中：{{ lastTouch }}</p>
    </section>

    <section
      aria-labelledby="icon-button-native-title"
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
    >
      <h2 id="icon-button-native-title" class="text-mdv-title-large">原生链接、表单与自定义尺寸</h2>
      <div class="mt-5 flex flex-wrap items-center gap-6">
        <div class="grid justify-items-center gap-2">
          <MdvIconButton
            href="https://m3.material.io/components/icon-buttons/specs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="在新标签页打开图标按钮规范"
          >
            <MdvIcon :icon="openInNew" />
          </MdvIconButton>
          <span class="text-mdv-label-medium">原生链接</span>
        </div>
        <div class="grid justify-items-center gap-2">
          <MdvIconButton href="https://m3.material.io/" disabled aria-label="不可用链接">
            <MdvIcon :icon="openInNew" />
          </MdvIconButton>
          <span class="text-mdv-label-medium">禁用链接</span>
        </div>
        <div class="grid justify-items-center gap-2">
          <span id="icon-button-custom-label" class="text-mdv-label-medium"
            >保存自定义尺寸示例</span
          >
          <MdvIconButton
            variant="outlined"
            aria-labelledby="icon-button-custom-label"
            :style="{
              '--mdv-icon-button-height': '64px',
              '--mdv-icon-button-width': '80px',
              '--mdv-icon-button-icon-size': '28px',
            }"
          >
            <MdvIcon :icon="save" />
          </MdvIconButton>
        </div>
      </div>

      <form
        class="mt-6 flex flex-wrap items-center gap-4"
        @submit.prevent="submitCount++"
        @reset="resetCount++"
      >
        <label class="grid gap-2 text-mdv-label-large">
          表单文字
          <input name="message" class="playground-control" value="修改后可检查重置" />
        </label>
        <MdvIconButton type="submit" aria-label="提交表单"><MdvIcon :icon="save" /></MdvIconButton>
        <MdvIconButton type="reset" variant="outlined" aria-label="重置表单"
          ><MdvIcon :icon="save"
        /></MdvIconButton>
        <MdvIconButton aria-label="普通按钮，不提交表单"
          ><MdvIcon :icon="favorite"
        /></MdvIconButton>
        <p role="status">提交 {{ submitCount }} 次，重置 {{ resetCount }} 次</p>
      </form>
      <p class="mt-4 text-mdv-body-small text-mdv-on-surface-variant">
        默认 type="button"；普通模式可提供 href，切换模式优先 button。图标按钮必须有 aria-label 或
        aria-labelledby。 Tooltip 将由独立组件提供，此处未以原生 title 替代。
      </p>
    </section>
  </div>
</template>
