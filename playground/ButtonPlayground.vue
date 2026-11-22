<script setup lang="ts">
import { computed, ref } from 'vue'
import add from '@iconify-icons/material-symbols/add'
import chevronRight from '@iconify-icons/material-symbols/chevron-right'
import chevronLeft from '@iconify-icons/material-symbols/chevron-left'
import openInNew from '@iconify-icons/material-symbols/open-in-new'
import { MdvButton, MdvIcon } from '@/index'
import type { MdvButtonColor, MdvButtonShape, MdvButtonSize, MdvButtonVariant } from '@/index'

const previewSize = ref<MdvButtonSize>('s')
const previewShape = ref<MdvButtonShape>('round')
const colorChoice = ref<MdvButtonColor | 'default' | 'custom'>('default')
const seedDraft = ref('#006c4c')
const buttonSeed = ref<`#${string}`>('#006c4c')
const buttonSeedError = ref('')
const previewColor = computed(() =>
  colorChoice.value === 'default'
    ? undefined
    : colorChoice.value === 'custom'
      ? buttonSeed.value
      : colorChoice.value,
)
const showLeading = ref(true)
const showTrailing = ref(false)
const showDisabled = ref(false)
const showLoading = ref(false)
const showHoverShadow = ref(false)
const useLoadingText = ref(true)
const loadingText = ref('保存中…')
const clickCount = ref(0)
const formSubmitCount = ref(0)
const formResetCount = ref(0)

const themes = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
] as const

const variants: { value: MdvButtonVariant; label: string }[] = [
  { value: 'filled', label: '填充' },
  { value: 'tonal', label: '色调' },
  { value: 'outlined', label: '描边' },
  { value: 'elevated', label: '提升' },
  { value: 'text', label: '文本' },
  { value: 'link', label: '链接外观' },
]

// Chromium treats an empty href as visited without requiring a history entry.
const paletteComparison = [
  { label: '原生按钮', href: undefined },
  { label: '原生链接', href: '' },
]

const sizes: { value: MdvButtonSize; height: number; icon: number; space: number }[] = [
  { value: 'xs', height: 32, icon: 20, space: 12 },
  { value: 's', height: 40, icon: 20, space: 16 },
  { value: 'm', height: 56, icon: 24, space: 24 },
  { value: 'l', height: 96, icon: 32, space: 48 },
  { value: 'xl', height: 136, icon: 40, space: 64 },
]

const shapes: MdvButtonShape[] = ['round', 'square']

const colorPresets = [
  { value: 'primary', label: '主题主色' },
  { value: 'secondary', label: '主题次色' },
  { value: 'tertiary', label: '主题第三色' },
  { value: 'success', label: '成功' },
  { value: 'warning', label: '警告' },
  { value: 'error', label: '错误／危险' },
  { value: 'info', label: '提示' },
] as const

const colorSamples = computed<{ value: MdvButtonColor | undefined; label: string }[]>(() => [
  { value: undefined, label: '默认官方配色' },
  ...colorPresets.map((preset) => ({ value: preset.value, label: preset.value })),
  { value: buttonSeed.value, label: `局部种子色 ${buttonSeed.value}` },
])

function applyButtonSeed() {
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(seedDraft.value)) {
    buttonSeedError.value = '请输入 #RGB 或 #RRGGBB，例如 #06C 或 #006c4c。'
    return
  }

  buttonSeed.value = seedDraft.value as `#${string}`
  colorChoice.value = 'custom'
  buttonSeedError.value = ''
}
</script>

<template>
  <section aria-labelledby="button-preview-title" class="space-y-6">
    <div>
      <h2 id="button-preview-title" class="text-mdv-headline-small">MdvButton</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        五种官方颜色样式与 link 扩展。尺寸和静态形状按 M3 Expressive，默认 filled / s / round。
        使用鼠标、Tab、Enter 和空格检查交互；link 默认带下划线，可直接与正文组合。
      </p>
    </div>

    <section
      aria-labelledby="button-palette-comparison"
      class="space-y-4 rounded-mdv-large bg-mdv-primary-container p-5 text-mdv-on-primary-container"
    >
      <h3 id="button-palette-comparison" class="text-mdv-title-medium">换色对照</h3>
      <div v-for="sample in paletteComparison" :key="sample.label" class="space-y-2">
        <h4 class="text-mdv-title-small">{{ sample.label }}</h4>
        <div class="flex flex-wrap items-center gap-3">
          <MdvButton
            v-for="variant in variants"
            :key="variant.value"
            :variant="variant.value"
            :href="sample.href"
          >
            <template #leading><MdvIcon :icon="chevronRight" /></template>
            {{ variant.label }}
          </MdvButton>
        </div>
      </div>
    </section>

    <div class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h3 class="text-mdv-title-medium">行内链接与文字组合</h3>
      <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        link 继承周围文字的字体与行高，取消按钮的高度和留白。检查默认下划线、基线对齐、
        悬停与键盘焦点，以及窄容器中的换行。
      </p>
      <div class="mt-5 grid gap-4 lg:grid-cols-2">
        <article
          v-for="theme in themes"
          :key="theme.value"
          :data-mdv-theme="theme.value"
          class="rounded-mdv-medium border border-mdv-outline-variant bg-mdv-surface p-5 text-mdv-on-surface"
        >
          <h4 class="text-mdv-title-small">{{ theme.label }}</h4>
          <p class="mt-4 text-mdv-body-large">
            我已阅读<MdvButton variant="link" href="#button-user-agreement">用户协议</MdvButton>。
          </p>
          <p class="mt-3 text-mdv-body-medium" lang="en">
            I have read the
            <MdvButton variant="link" href="#button-user-agreement">Terms of Service</MdvButton>.
          </p>
          <p class="mt-3 text-mdv-body-small">
            禁用状态：<MdvButton variant="link" href="#button-user-agreement" disabled
              >用户协议</MdvButton
            >。
          </p>
          <p class="mt-4 max-w-48 text-mdv-body-medium">
            继续使用前，请阅读<MdvButton variant="link" href="#button-user-agreement"
              >Material Design Vue 用户协议与隐私条款</MdvButton
            >，并确认你已了解相关内容。
          </p>
        </article>
      </div>
      <div
        id="button-user-agreement"
        tabindex="-1"
        class="mt-5 rounded-mdv-small bg-mdv-secondary-container p-4 text-mdv-on-secondary-container"
      >
        <h4 class="text-mdv-title-small">用户协议（演示）</h4>
        <p class="mt-2 text-mdv-body-medium">
          这里是行内链接的页内导航目标，用于检查链接跳转和键盘焦点。
        </p>
      </div>
    </div>

    <div class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <div class="flex flex-wrap items-end gap-5">
        <label class="grid gap-2 text-mdv-label-large">
          尺寸
          <select v-model="previewSize" class="playground-control">
            <option v-for="size in sizes" :key="size.value" :value="size.value">
              {{ size.value }} · {{ size.height }}px
            </option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          形状
          <select v-model="previewShape" class="playground-control">
            <option v-for="shape in shapes" :key="shape" :value="shape">{{ shape }}</option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          颜色
          <select v-model="colorChoice" class="playground-control">
            <option value="default">默认官方配色</option>
            <option v-for="preset in colorPresets" :key="preset.value" :value="preset.value">
              {{ preset.value }} · {{ preset.label }}
            </option>
            <option value="custom">自定义种子色</option>
          </select>
        </label>
        <label class="inline-flex min-h-11 items-center gap-2 text-mdv-body-medium">
          <input v-model="showLeading" class="size-4 accent-mdv-primary" type="checkbox" />
          前置图标
        </label>
        <label class="inline-flex min-h-11 items-center gap-2 text-mdv-body-medium">
          <input v-model="showTrailing" class="size-4 accent-mdv-primary" type="checkbox" />
          后置图标
        </label>
        <label class="inline-flex min-h-11 items-center gap-2 text-mdv-body-medium">
          <input v-model="showDisabled" class="size-4 accent-mdv-primary" type="checkbox" />
          disabled
        </label>
        <label class="inline-flex min-h-11 items-center gap-2 text-mdv-body-medium">
          <input v-model="showLoading" class="size-4 accent-mdv-primary" type="checkbox" />
          loading
        </label>
        <label class="inline-flex min-h-11 items-center gap-2 text-mdv-body-medium">
          <input v-model="showHoverShadow" class="size-4 accent-mdv-primary" type="checkbox" />
          悬停阴影
        </label>
        <label class="inline-flex min-h-11 items-center gap-2 text-mdv-body-medium">
          <input v-model="useLoadingText" class="size-4 accent-mdv-primary" type="checkbox" />
          自定义加载文案
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          加载文案
          <input v-model="loadingText" class="playground-control" :disabled="!useLoadingText" />
        </label>
      </div>
      <div class="mt-4 flex flex-wrap items-end gap-4">
        <label class="grid gap-2 text-mdv-label-large">
          按钮局部种子色
          <input
            v-model="seedDraft"
            class="playground-control"
            spellcheck="false"
            :aria-invalid="!!buttonSeedError"
            aria-describedby="button-seed-help"
            @keydown.enter.prevent="applyButtonSeed"
          />
        </label>
        <MdvButton variant="tonal" @click="applyButtonSeed">应用局部种子色</MdvButton>
      </div>
      <p id="button-seed-help" class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        色号作为 MD3 种子生成浅深色配套颜色，实际背景可能不同。只影响指定按钮，不改变外部主题。
        选择“默认官方配色”可清除局部颜色。
      </p>
      <p v-if="buttonSeedError" role="alert" class="mt-2 text-mdv-body-small text-mdv-error">
        {{ buttonSeedError }}
      </p>
      <p class="mt-4 text-mdv-body-small text-mdv-on-surface-variant">
        loading 显示指示器和标签，前后图标隐藏；尺寸随当前内容自然变化，不提前预留加载空间。
        未提供加载文案时沿用原标签。loading 仍可点击，disabled 才会禁用。
        官方优先建议前置图标，同一按钮避免同时使用两个图标。
      </p>
      <p role="status" class="mt-3 text-mdv-label-large">按钮激活次数：{{ clickCount }}</p>
    </div>

    <div class="grid gap-5 xl:grid-cols-2">
      <article
        v-for="theme in themes"
        :key="theme.value"
        :data-mdv-theme="theme.value"
        class="min-w-0 rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface p-5 text-mdv-on-surface"
      >
        <h3 class="text-mdv-title-medium">{{ theme.label }} · 外观与状态</h3>
        <div class="mt-5 flex flex-wrap items-start gap-6">
          <div v-for="variant in variants" :key="variant.value" class="min-w-0 max-w-full">
            <p class="mb-3 text-mdv-label-medium text-mdv-on-surface-variant">
              {{ variant.value }}
            </p>
            <MdvButton
              :variant="variant.value"
              :color="previewColor"
              :size="previewSize"
              :shape="previewShape"
              :disabled="showDisabled"
              :loading="showLoading"
              :loading-text="useLoadingText ? loadingText : undefined"
              :hover-shadow="showHoverShadow"
              @click="clickCount++"
            >
              <template v-if="showLeading" #leading>
                <MdvIcon :icon="add" />
              </template>
              {{ variant.label }}
              <template v-if="showTrailing" #trailing>
                <MdvIcon :icon="chevronRight" />
              </template>
            </MdvButton>
          </div>
        </div>
      </article>
    </div>

    <div>
      <h3 class="text-mdv-title-medium">全部色系与外观对照</h3>
      <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        success、warning、info 为 MDV 扩展；error 复用主题角色。调整页面顶部的品牌种子色，
        primary／secondary／tertiary 应随主题变化，固定语义色保持含义。这里也跟随 loading 和
        disabled 开关。
      </p>
      <div class="mt-5 grid gap-5 xl:grid-cols-2">
        <article
          v-for="theme in themes"
          :key="theme.value"
          :data-mdv-theme="theme.value"
          class="min-w-0 rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface p-5 text-mdv-on-surface"
        >
          <h4 class="text-mdv-title-medium">{{ theme.label }}</h4>
          <div class="mt-4 space-y-5">
            <div v-for="sample in colorSamples" :key="sample.label">
              <p class="mb-3 text-mdv-label-large">{{ sample.label }}</p>
              <div class="flex flex-wrap gap-3">
                <MdvButton
                  v-for="variant in variants"
                  :key="variant.value"
                  :variant="variant.value"
                  :color="sample.value"
                  :disabled="showDisabled"
                  :loading="showLoading"
                  :loading-text="useLoadingText ? loadingText : undefined"
                  :hover-shadow="showHoverShadow"
                  @click="clickCount++"
                >
                  {{ variant.value }}
                </MdvButton>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div
      class="rounded-mdv-large border border-mdv-outline-variant p-5"
      style="
        --mdv-sys-color-success: var(--mdv-sys-color-info);
        --mdv-sys-color-on-success: var(--mdv-sys-color-on-info);
        --mdv-sys-color-success-container: var(--mdv-sys-color-info-container);
        --mdv-sys-color-on-success-container: var(--mdv-sys-color-on-info-container);
      "
    >
      <h3 class="text-mdv-title-medium">局部主题覆盖</h3>
      <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        本区域将 success 的四个角色覆盖为 info 色系。检查 filled 和 tonal 同步变化， 区域外的
        success、默认按钮与 error 配色不受影响；本区域跟随当前页面主题模式。
      </p>
      <div class="mt-4 flex flex-wrap gap-4">
        <MdvButton color="success">覆盖后的 success</MdvButton>
        <MdvButton color="success" variant="tonal">覆盖后的 tonal</MdvButton>
        <MdvButton color="error">error 保持原色</MdvButton>
        <MdvButton>默认主题按钮</MdvButton>
      </div>
    </div>

    <div class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h3 class="text-mdv-title-medium">悬停阴影对照</h3>
      <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        分别悬停两组按钮。左组默认关闭悬停阴影，右组开启；elevated 始终保留常态阴影。 对
        text、outlined 和 link，开关不额外增加阴影。
      </p>
      <div class="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <p class="mb-3 text-mdv-label-large">默认关闭</p>
          <div class="flex flex-wrap gap-4">
            <MdvButton :color="previewColor" :disabled="showDisabled" @click="clickCount++">
              填充
            </MdvButton>
            <MdvButton
              variant="tonal"
              :color="previewColor"
              :disabled="showDisabled"
              @click="clickCount++"
            >
              色调
            </MdvButton>
            <MdvButton
              variant="elevated"
              :color="previewColor"
              :disabled="showDisabled"
              @click="clickCount++"
            >
              提升
            </MdvButton>
          </div>
        </div>
        <div>
          <p class="mb-3 text-mdv-label-large">hover-shadow 开启</p>
          <div class="flex flex-wrap gap-4">
            <MdvButton
              hover-shadow
              :color="previewColor"
              :disabled="showDisabled"
              @click="clickCount++"
            >
              填充
            </MdvButton>
            <MdvButton
              variant="tonal"
              hover-shadow
              :color="previewColor"
              :disabled="showDisabled"
              @click="clickCount++"
            >
              色调
            </MdvButton>
            <MdvButton
              variant="elevated"
              hover-shadow
              :color="previewColor"
              :disabled="showDisabled"
              @click="clickCount++"
            >
              提升
            </MdvButton>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h3 class="text-mdv-title-medium">尺寸、形状与描边</h3>
      <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        逐行对照 round 和 square，点击与长按时保持圆角。 高度基于默认 16px
        根字号和单行标签；大尺寸可横向滚动查看。
      </p>
      <div class="mt-5 overflow-x-auto pb-2">
        <table class="w-full border-collapse whitespace-nowrap text-left">
          <thead class="text-mdv-label-large">
            <tr>
              <th scope="col" class="p-3">尺寸规格</th>
              <th v-for="shape in shapes" :key="shape" scope="col" class="p-3">{{ shape }}</th>
              <th scope="col" class="p-3">outlined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="size in sizes" :key="size.value" class="border-t border-mdv-outline-variant">
              <th scope="row" class="p-3 font-normal">
                <span class="text-mdv-label-large">{{ size.value }} · {{ size.height }}px</span>
                <span class="mt-1 block text-mdv-body-small text-mdv-on-surface-variant">
                  图标 {{ size.icon }}px / 水平留白 {{ size.space }}px
                </span>
              </th>
              <td v-for="shape in shapes" :key="shape" class="p-3">
                <MdvButton
                  :size="size.value"
                  :color="previewColor"
                  :shape="shape"
                  :disabled="showDisabled"
                  :loading="showLoading"
                  :loading-text="useLoadingText ? loadingText : undefined"
                  :hover-shadow="showHoverShadow"
                  @click="clickCount++"
                >
                  <template #leading>
                    <MdvIcon :icon="add" />
                  </template>
                  Label
                </MdvButton>
              </td>
              <td class="p-3">
                <MdvButton
                  :size="size.value"
                  :color="previewColor"
                  variant="outlined"
                  :disabled="showDisabled"
                  :loading="showLoading"
                  :loading-text="useLoadingText ? loadingText : undefined"
                  :hover-shadow="showHoverShadow"
                  @click="clickCount++"
                >
                  Label
                </MdvButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <article class="min-w-0 rounded-mdv-large border border-mdv-outline-variant p-5">
        <h3 class="text-mdv-title-medium">自然宽度与加载内容</h3>
        <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
          每组使用相同配置：左侧保持普通状态，右侧跟随 loading 开关。
          尺寸按当前可见内容自然变化；没有额外加载占位，较长的加载文字只在加载时撑宽按钮。
        </p>
        <div class="mt-5 space-y-5">
          <div>
            <p class="mb-3 text-mdv-label-medium">普通操作随文字自然撑开</p>
            <div class="flex flex-wrap items-center gap-2">
              <MdvButton variant="text">取消</MdvButton>
              <MdvButton variant="text">确认</MdvButton>
              <MdvButton variant="text">保存全部修改</MdvButton>
            </div>
          </div>
          <div>
            <p class="mb-3 text-mdv-label-medium">无图标，沿用原标签</p>
            <div class="flex flex-wrap items-center gap-4">
              <MdvButton variant="tonal" :color="previewColor" @click="clickCount++">
                保存
              </MdvButton>
              <MdvButton
                variant="tonal"
                :color="previewColor"
                :loading="showLoading"
                @click="clickCount++"
              >
                保存
              </MdvButton>
            </div>
          </div>
          <div>
            <p class="mb-3 text-mdv-label-medium">双图标，加载后仅保留指示器与标签</p>
            <div class="flex flex-wrap items-center gap-4">
              <MdvButton
                v-for="mode in ['normal', 'toggle']"
                :key="mode"
                variant="tonal"
                :color="previewColor"
                :loading="mode === 'toggle' && showLoading"
                @click="clickCount++"
              >
                <template #leading>
                  <MdvIcon :icon="add" />
                </template>
                保存
                <template #trailing>
                  <MdvIcon :icon="chevronRight" />
                </template>
              </MdvButton>
            </div>
          </div>
          <div>
            <p class="mb-3 text-mdv-label-medium">短普通标签与长加载文案</p>
            <div class="flex flex-wrap items-center gap-4">
              <MdvButton
                variant="tonal"
                :color="previewColor"
                loading-text="正在保存所有更改…"
                @click="clickCount++"
              >
                保存
              </MdvButton>
              <MdvButton
                variant="tonal"
                :color="previewColor"
                :loading="showLoading"
                loading-text="正在保存所有更改…"
                @click="clickCount++"
              >
                保存
              </MdvButton>
            </div>
          </div>
          <div>
            <p class="mb-3 text-mdv-label-medium">业务自行指定宽度</p>
            <MdvButton
              variant="text"
              :loading="showLoading"
              loading-text="保存中…"
              style="width: 160px"
            >
              保存
            </MdvButton>
          </div>
          <div>
            <p class="mb-3 text-mdv-label-medium">loading 与 disabled 同时开启</p>
            <MdvButton
              variant="tonal"
              :color="previewColor"
              loading
              loading-text="Saving…"
              disabled
            >
              Save
            </MdvButton>
          </div>
        </div>
      </article>

      <article class="min-w-0 rounded-mdv-large border border-mdv-outline-variant p-5">
        <h3 class="text-mdv-title-medium">全宽、长标签与窄容器</h3>
        <div class="mt-5 max-w-64 space-y-4 rounded-mdv-medium bg-mdv-surface-container-low p-4">
          <MdvButton
            full-width
            :color="previewColor"
            :loading="showLoading"
            :loading-text="useLoadingText ? loadingText : undefined"
            @click="clickCount++"
          >
            全宽按钮
          </MdvButton>
          <MdvButton
            full-width
            variant="outlined"
            :color="previewColor"
            :loading="showLoading"
            loading-text="正在保存这段较长的中文标签，请稍候…"
            @click="clickCount++"
          >
            这是一段用于检查自动换行的较长中文按钮标签
          </MdvButton>
          <MdvButton
            full-width
            variant="text"
            :color="previewColor"
            :loading="showLoading"
            @click="clickCount++"
          >
            SaveAllChangesWithoutLosingAnyUnsavedWork
          </MdvButton>
        </div>
        <MdvButton
          class="mt-4"
          size="m"
          style="min-height: 72px; width: 240px"
          @click="clickCount++"
        >
          style 自定义尺寸
        </MdvButton>
      </article>
    </div>

    <div class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h3 class="text-mdv-title-medium">按钮和链接的原生语义</h3>
      <p class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        variant 只决定外观。提供 href 使用 a；没有 href 使用 button。禁用链接不导航、不触发点击，
        也不参与 Tab 顺序；默认链接在当前标签页打开。
      </p>
      <div class="mt-5 flex flex-wrap items-center gap-4">
        <MdvButton variant="link" @click="clickCount++">link 外观的按钮</MdvButton>
        <MdvButton href="#button-link-destination">填充外观的链接</MdvButton>
        <MdvButton variant="link" href="#button-link-destination">当前页链接</MdvButton>
        <MdvButton
          variant="link"
          href="https://m3.material.io/components/buttons/specs"
          target="_blank"
          rel="noopener noreferrer"
        >
          官方规范（新标签页）
          <template #trailing>
            <MdvIcon :icon="openInNew" />
          </template>
        </MdvButton>
        <MdvButton variant="link" href="#button-link-destination" disabled @click="clickCount++">
          禁用链接
        </MdvButton>
      </div>
      <p
        id="button-link-destination"
        tabindex="-1"
        class="mt-5 rounded-mdv-small bg-mdv-secondary-container p-3 text-mdv-body-medium text-mdv-on-secondary-container"
      >
        页内链接目标。这里用于确认 href 导航与键盘焦点。
      </p>
    </div>

    <div class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h3 class="text-mdv-title-medium">表单关联</h3>
      <form
        id="button-demo-form"
        class="mt-4 flex flex-wrap items-end gap-4"
        @submit.prevent="formSubmitCount++"
        @reset="formResetCount++"
      >
        <label class="grid gap-2 text-mdv-label-large">
          可编辑文本
          <input name="message" value="试着修改后重置" class="playground-control" />
        </label>
        <MdvButton @click="clickCount++">默认按钮（不提交）</MdvButton>
        <MdvButton type="submit" name="action" value="save">提交表单</MdvButton>
        <MdvButton type="reset" variant="outlined">重置表单</MdvButton>
      </form>
      <MdvButton form="button-demo-form" type="submit" variant="text" class="mt-4">
        表单外部的提交按钮
      </MdvButton>
      <p role="status" class="mt-3 text-mdv-body-medium">
        提交 {{ formSubmitCount }} 次 / 重置 {{ formResetCount }} 次
      </p>
    </div>

    <div dir="rtl" class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h3 class="text-mdv-title-medium">RTL 插槽顺序</h3>
      <div class="mt-4 flex flex-wrap gap-4">
        <MdvButton :color="previewColor" :loading="showLoading" lang="ar">
          <template #leading>
            <MdvIcon :icon="add" />
          </template>
          إضافة عنصر
        </MdvButton>
        <MdvButton
          variant="outlined"
          :color="previewColor"
          :loading="showLoading"
          loading-text="جارٍ المتابعة…"
          lang="ar"
        >
          متابعة
          <template #trailing>
            <MdvIcon :icon="chevronLeft" />
          </template>
        </MdvButton>
      </div>
    </div>
  </section>
</template>
