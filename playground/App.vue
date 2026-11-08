<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, useTemplateRef } from 'vue'
import { applyMdvColorScheme, createMdvColorScheme } from '@/dynamic-color'
import ButtonPlayground from './ButtonPlayground.vue'
import IconButtonPlayground from './IconButtonPlayground.vue'
import IconPlayground from './IconPlayground.vue'
import TextFieldPlayground from './TextFieldPlayground.vue'
import CheckboxPlayground from './CheckboxPlayground.vue'
import ThemePlayground from './ThemePlayground.vue'

const pages = [
  {
    id: 'button',
    label: 'Button 按钮',
    description: '对照按钮的变体、尺寸、状态与交互。',
    component: ButtonPlayground,
  },
  {
    id: 'icon-button',
    label: 'IconButton 图标按钮',
    description: '对照图标按钮的尺寸、宽度、选中形状、配色与原生行为。',
    component: IconButtonPlayground,
  },
  {
    id: 'icon',
    label: 'Icon 图标',
    description: '查看本地图标、风格、尺寸、颜色与按钮组合。',
    component: IconPlayground,
  },
  {
    id: 'text-field',
    label: 'TextField 文本框',
    description: '对照填充与描边外观、输入状态、图标、校验和原生表单行为。',
    component: TextFieldPlayground,
  },
  {
    id: 'checkbox',
    label: 'Checkbox 复选框',
    description: '对照三种选择状态、配色、标签、数组多选和原生表单行为。',
    component: CheckboxPlayground,
  },
  {
    id: 'theme',
    label: '主题基础',
    description: '检查颜色角色、字体排版、局部覆盖、阴影、圆角与动效。',
    component: ThemePlayground,
  },
] as const

const activePage = shallowRef<(typeof pages)[number]>(pages[0])
const preview = useTemplateRef<HTMLElement>('preview')
const content = useTemplateRef<HTMLElement>('content')
const theme = ref<'light' | 'dark' | 'system'>('light')
const seed = ref('#6750a4')
const activeSeed = ref<string | null>(null)
const seedError = ref('')
let cleanupScheme: (() => void) | undefined

function selectPage(page: (typeof pages)[number]) {
  if (activePage.value.id === page.id) return

  activePage.value = page
  content.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
}

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
  <div
    ref="preview"
    :data-mdv-theme="theme"
    class="min-h-screen bg-mdv-surface font-mdv text-mdv-body-large text-mdv-on-surface lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]"
  >
    <a
      href="#playground-content"
      class="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-mdv-small focus:bg-mdv-primary focus:px-4 focus:py-3 focus:text-mdv-on-primary"
    >
      跳到预览内容
    </a>

    <aside
      class="border-b border-mdv-outline-variant bg-mdv-surface-container-low p-4 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-e lg:border-b-0 lg:p-6"
    >
      <p class="text-mdv-label-large text-mdv-primary">MDV</p>
      <p class="mt-1 text-mdv-title-large">开发预览</p>

      <nav class="mt-5" aria-label="开发预览页面">
        <ul class="flex flex-wrap gap-2 lg:grid">
          <li v-for="page in pages" :key="page.id">
            <button
              class="playground-nav-item"
              type="button"
              :aria-current="activePage.id === page.id ? 'page' : undefined"
              @click="selectPage(page)"
            >
              {{ page.label }}
            </button>
          </li>
        </ul>
      </nav>
    </aside>

    <main
      id="playground-content"
      ref="content"
      tabindex="-1"
      class="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10"
    >
      <div class="mx-auto max-w-6xl space-y-8">
        <header class="border-b border-mdv-outline-variant pb-6">
          <h1 class="text-mdv-headline-large">{{ activePage.label }}</h1>
          <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
            {{ activePage.description }}
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
              <button class="playground-control" type="button" @click="resetScheme">
                恢复默认
              </button>
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

        <KeepAlive>
          <component :is="activePage.component" />
        </KeepAlive>
      </div>
    </main>
  </div>
</template>
