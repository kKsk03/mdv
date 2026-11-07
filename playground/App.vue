<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { MdvButton } from '@/index'
import { applyMdvColorScheme, createMdvColorScheme } from '@/dynamic-color'
import type { MdvColorRole } from '@/dynamic-color'
import type { MdvButtonVariant } from '@/components/button.types'

const preview = useTemplateRef<HTMLElement>('preview')
const theme = ref<'light' | 'dark' | 'system'>('light')
const seed = ref('#6750a4')
const activeSeed = ref<string | null>(null)
const seedError = ref('')
const showDisabled = ref(false)
const showMotion = ref(false)
let cleanupScheme: (() => void) | undefined

const comparisonThemes = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
] as const

const variants: { name: string; value: MdvButtonVariant }[] = [
  { name: '填充', value: 'filled' },
  { name: '色调', value: 'tonal' },
  { name: '描边', value: 'outlined' },
  { name: '提升', value: 'elevated' },
  { name: '文本', value: 'text' },
]

const swatches: { background: MdvColorRole; foreground: MdvColorRole }[] = [
  { background: 'primary', foreground: 'on-primary' },
  { background: 'primary-container', foreground: 'on-primary-container' },
  { background: 'secondary', foreground: 'on-secondary' },
  { background: 'secondary-container', foreground: 'on-secondary-container' },
  { background: 'tertiary', foreground: 'on-tertiary' },
  { background: 'tertiary-container', foreground: 'on-tertiary-container' },
  { background: 'error', foreground: 'on-error' },
  { background: 'error-container', foreground: 'on-error-container' },
  { background: 'surface', foreground: 'on-surface' },
  { background: 'surface-container-lowest', foreground: 'on-surface' },
  { background: 'surface-container-low', foreground: 'on-surface' },
  { background: 'surface-container', foreground: 'on-surface' },
  { background: 'surface-container-high', foreground: 'on-surface' },
  { background: 'surface-container-highest', foreground: 'on-surface' },
  { background: 'inverse-surface', foreground: 'inverse-on-surface' },
]

const colorRoles = Object.keys(createMdvColorScheme(seed.value).light) as MdvColorRole[]

const typeSamples = [
  { name: 'display-large', className: 'text-mdv-display-large' },
  { name: 'display-medium', className: 'text-mdv-display-medium' },
  { name: 'display-small', className: 'text-mdv-display-small' },
  { name: 'headline-large', className: 'text-mdv-headline-large' },
  { name: 'headline-medium', className: 'text-mdv-headline-medium' },
  { name: 'headline-small', className: 'text-mdv-headline-small' },
  { name: 'title-large', className: 'text-mdv-title-large' },
  { name: 'title-medium', className: 'text-mdv-title-medium' },
  { name: 'title-small', className: 'text-mdv-title-small' },
  { name: 'body-large', className: 'text-mdv-body-large' },
  { name: 'body-medium', className: 'text-mdv-body-medium' },
  { name: 'body-small', className: 'text-mdv-body-small' },
  { name: 'label-large', className: 'text-mdv-label-large' },
  { name: 'label-medium', className: 'text-mdv-label-medium' },
  { name: 'label-small', className: 'text-mdv-label-small' },
]

const elevations = [
  { level: 0, className: 'shadow-mdv-elevation-0' },
  { level: 1, className: 'shadow-mdv-elevation-1' },
  { level: 2, className: 'shadow-mdv-elevation-2' },
  { level: 3, className: 'shadow-mdv-elevation-3' },
  { level: 4, className: 'shadow-mdv-elevation-4' },
  { level: 5, className: 'shadow-mdv-elevation-5' },
]

const shapes = [
  { name: 'none', className: 'rounded-mdv-none' },
  { name: 'extra-small', className: 'rounded-mdv-extra-small' },
  { name: 'small', className: 'rounded-mdv-small' },
  { name: 'medium', className: 'rounded-mdv-medium' },
  { name: 'large', className: 'rounded-mdv-large' },
  { name: 'extra-large', className: 'rounded-mdv-extra-large' },
  { name: 'full', className: 'rounded-mdv-full' },
]

function applySeed() {
  if (!preview.value) return

  if (!/^#[0-9a-fA-F]{6}$/.test(seed.value)) {
    seedError.value = '请输入完整的十六进制色号，例如 #6750a4。'
    return
  }

  const scheme = createMdvColorScheme(seed.value)
  cleanupScheme?.()
  cleanupScheme = applyMdvColorScheme(preview.value, scheme)
  activeSeed.value = scheme.seed
  seedError.value = ''
}

function resetScheme() {
  cleanupScheme?.()
  cleanupScheme = undefined
  activeSeed.value = null
  seed.value = '#6750a4'
  seedError.value = ''
}

onBeforeUnmount(() => cleanupScheme?.())
</script>

<template>
  <main
    ref="preview"
    :data-mdv-theme="theme"
    class="min-h-screen bg-mdv-surface px-6 py-10 font-mdv text-mdv-body-large text-mdv-on-surface sm:px-10"
  >
    <div class="mx-auto max-w-6xl space-y-10">
      <header class="border-b border-mdv-outline-variant pb-6">
        <p class="text-mdv-label-large text-mdv-primary">MDV / 开发预览</p>
        <h1 class="mt-2 text-mdv-headline-large">主题基础</h1>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          调整主题和种子色，检查颜色角色、排版与局部覆盖。
        </p>
      </header>

      <section
        aria-labelledby="theme-controls-title"
        class="rounded-mdv-large border border-mdv-outline-variant p-5"
      >
        <h2 id="theme-controls-title" class="text-mdv-title-large">主题与配色</h2>
        <div class="mt-5 flex flex-wrap items-end gap-5">
          <label class="grid gap-2 text-mdv-label-large">
            显示模式
            <select v-model="theme" class="playground-control">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="system">跟随系统</option>
            </select>
          </label>

          <form class="flex flex-wrap items-end gap-3" novalidate @submit.prevent="applySeed">
            <label class="grid gap-2 text-mdv-label-large" for="seed-input">
              种子色
              <input
                id="seed-input"
                v-model="seed"
                class="playground-control w-36 font-mono"
                type="text"
                :aria-invalid="seedError ? true : undefined"
                :aria-describedby="seedError ? 'seed-help seed-error' : 'seed-help'"
                autocomplete="off"
                :spellcheck="false"
              />
            </label>
            <button class="playground-control" type="submit">应用配色</button>
            <button class="playground-control" type="button" @click="resetScheme">恢复默认</button>
          </form>
        </div>
        <p id="seed-help" class="mt-3 text-mdv-body-small text-mdv-on-surface-variant">
          使用 #RRGGBB 色号。当前：{{ activeSeed ? `种子色 ${activeSeed}` : 'MD3 默认配色' }}。
        </p>
        <p
          v-if="seedError"
          id="seed-error"
          role="alert"
          class="mt-2 text-mdv-body-medium text-mdv-error"
        >
          {{ seedError }}
        </p>
      </section>

      <section aria-labelledby="colors-title">
        <h2 id="colors-title" class="mb-5 text-mdv-title-large">浅色与深色对照</h2>
        <div class="grid gap-5 lg:grid-cols-2">
          <article
            v-for="item in comparisonThemes"
            :key="item.value"
            :data-mdv-theme="item.value"
            class="rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface p-5 text-mdv-on-surface"
          >
            <h3 class="mb-4 text-mdv-title-medium">{{ item.label }}</h3>
            <div class="grid gap-2 sm:grid-cols-3">
              <div
                v-for="swatch in swatches"
                :key="swatch.background"
                class="flex min-h-24 flex-col justify-between gap-3 rounded-mdv-small p-3"
                :style="{
                  backgroundColor: `var(--mdv-sys-color-${swatch.background})`,
                  color: `var(--mdv-sys-color-${swatch.foreground})`,
                }"
              >
                <p class="break-all text-mdv-label-medium">{{ swatch.background }}</p>
                <p class="text-mdv-body-small">Aa 文字</p>
              </div>
            </div>

            <details class="mt-5">
              <summary class="cursor-pointer text-mdv-label-large">
                查看全部 {{ colorRoles.length }} 个颜色角色
              </summary>
              <dl class="mt-3 grid gap-2 sm:grid-cols-2">
                <div
                  v-for="role in colorRoles"
                  :key="role"
                  class="flex items-center gap-2 rounded-mdv-small border border-mdv-outline-variant p-2"
                >
                  <dt class="order-2 break-all text-mdv-label-medium">{{ role }}</dt>
                  <dd
                    class="order-1 size-8 shrink-0 rounded-mdv-extra-small border border-mdv-outline-variant"
                    :style="{ backgroundColor: `var(--mdv-sys-color-${role})` }"
                  >
                    <span class="sr-only">色样</span>
                  </dd>
                </div>
              </dl>
            </details>
          </article>
        </div>
      </section>

      <section aria-labelledby="button-variants-title">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 id="button-variants-title" class="text-mdv-title-large">Button 工程骨架</h2>
          <label class="inline-flex items-center gap-2 text-mdv-body-medium">
            <input v-model="showDisabled" class="size-4 accent-mdv-primary" type="checkbox" />
            显示禁用状态
          </label>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="variant in variants"
            :key="variant.value"
            class="flex min-h-36 flex-col justify-between gap-4 rounded-mdv-medium border border-mdv-outline-variant p-5"
          >
            <div>
              <h3 class="text-mdv-title-medium">{{ variant.name }}</h3>
              <p class="mt-1 text-mdv-body-small text-mdv-on-surface-variant">
                variant="{{ variant.value }}"
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <MdvButton :variant="variant.value">保存</MdvButton>
              <MdvButton v-if="showDisabled" :variant="variant.value" disabled>禁用</MdvButton>
            </div>
          </article>
        </div>
      </section>

      <section
        aria-labelledby="local-theme-title"
        data-mdv-theme="light"
        class="rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low p-5 text-mdv-on-surface"
        style="--mdv-sys-color-primary: #006c4c; --mdv-sys-color-on-primary: #ffffff"
      >
        <h2 id="local-theme-title" class="text-mdv-title-large">局部主题与变量覆盖</h2>
        <p class="mb-4 mt-2 text-mdv-body-medium">
          这个区域固定浅色，并单独覆盖 primary 和 on-primary。
        </p>
        <MdvButton>局部主题按钮</MdvButton>
      </section>

      <section aria-labelledby="typography-title">
        <h2 id="typography-title" class="mb-5 text-mdv-title-large">排版</h2>
        <div class="divide-y divide-mdv-outline-variant">
          <div v-for="sample in typeSamples" :key="sample.name" class="overflow-x-auto py-4">
            <p class="mb-2 text-mdv-label-medium text-mdv-on-surface-variant">{{ sample.name }}</p>
            <p :class="sample.className">Material Design 3 · 中文排版 012345</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="elevation-title">
        <h2 id="elevation-title" class="mb-5 text-mdv-title-large">Elevation</h2>
        <div class="grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
          <div
            v-for="item in elevations"
            :key="item.level"
            :class="item.className"
            class="flex min-h-24 items-center justify-center rounded-mdv-medium bg-mdv-surface-container-low p-4 text-mdv-label-large"
          >
            Level {{ item.level }}
          </div>
        </div>
      </section>

      <section aria-labelledby="shapes-title">
        <h2 id="shapes-title" class="mb-5 text-mdv-title-large">圆角</h2>
        <div class="flex flex-wrap gap-5">
          <div
            v-for="shape in shapes"
            :key="shape.name"
            :class="shape.className"
            class="flex size-28 items-center justify-center bg-mdv-secondary-container p-3 text-center text-mdv-label-large text-mdv-on-secondary-container"
          >
            {{ shape.name }}
          </div>
        </div>
      </section>

      <section aria-labelledby="motion-title">
        <h2 id="motion-title" class="mb-3 text-mdv-title-large">动效</h2>
        <p class="mb-4 text-mdv-body-medium text-mdv-on-surface-variant">
          标准强调缓动，时长 500ms。系统启用减少动态效果后，位移会立即完成。
        </p>
        <button
          class="playground-control"
          type="button"
          :aria-pressed="showMotion"
          @click="showMotion = !showMotion"
        >
          切换位置
        </button>
        <div class="mt-5 w-44 rounded-mdv-full bg-mdv-surface-container-high" aria-hidden="true">
          <div
            class="size-12 rounded-mdv-full bg-mdv-primary transition-transform duration-(--mdv-sys-motion-duration-long-2) ease-mdv-emphasized"
            :class="{ 'translate-x-32': showMotion }"
          />
        </div>
      </section>
    </div>
  </main>
</template>
