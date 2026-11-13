<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, useTemplateRef } from 'vue'
import { applyMdvColorScheme, createMdvColorScheme } from '@/dynamic-color'
import ButtonPlayground from './ButtonPlayground.vue'
import IconButtonPlayground from './IconButtonPlayground.vue'
import IconPlayground from './IconPlayground.vue'
import TextFieldPlayground from './TextFieldPlayground.vue'
import CheckboxPlayground from './CheckboxPlayground.vue'
import RadioPlayground from './RadioPlayground.vue'
import SwitchPlayground from './SwitchPlayground.vue'
import SliderPlayground from './SliderPlayground.vue'
import ChipPlayground from './ChipPlayground.vue'
import SegmentedButtonPlayground from './SegmentedButtonPlayground.vue'
import CardPlayground from './CardPlayground.vue'
import DividerPlayground from './DividerPlayground.vue'
import BadgePlayground from './BadgePlayground.vue'
import ListPlayground from './ListPlayground.vue'
import ProgressPlayground from './ProgressPlayground.vue'
import DialogPlayground from './DialogPlayground.vue'
import FullscreenDialogPlayground from './FullscreenDialogPlayground.vue'
import MenuPlayground from './MenuPlayground.vue'
import TooltipPlayground from './TooltipPlayground.vue'
import SnackbarPlayground from './SnackbarPlayground.vue'
import BottomSheetPlayground from './BottomSheetPlayground.vue'
import SideSheetPlayground from './SideSheetPlayground.vue'
import TabsPlayground from './TabsPlayground.vue'
import NavigationBarPlayground from './NavigationBarPlayground.vue'
import NavigationRailPlayground from './NavigationRailPlayground.vue'
import NavigationDrawerPlayground from './NavigationDrawerPlayground.vue'
import AppBarPlayground from './AppBarPlayground.vue'
import SearchPlayground from './SearchPlayground.vue'
import ToolbarPlayground from './ToolbarPlayground.vue'
import FabPlayground from './FabPlayground.vue'
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
    id: 'radio',
    label: 'Radio 单选框',
    description: '对照单选互斥、键盘导航、配色、标签和原生表单行为。',
    component: RadioPlayground,
  },
  {
    id: 'switch',
    label: 'Switch 开关',
    description: '对照开关状态、图标、标签位置、配色和原生表单行为。',
    component: SwitchPlayground,
  },
  {
    id: 'slider',
    label: 'Slider 滑块',
    description: '对照单值、中心与范围滑块，检查尺寸、拖动、键盘、配色和表单。',
    component: SliderPlayground,
  },
  {
    id: 'chip',
    label: 'Chip 纸片',
    description: '对照四类纸片、选择与删除、键盘导航、图标、配色和布局。',
    component: ChipPlayground,
  },
  {
    id: 'segmented-button',
    label: 'SegmentedButton 分段按钮',
    description: '对照单多选、选中图标、密度、逐项键盘导航和原生表单行为。',
    component: SegmentedButtonPlayground,
  },
  {
    id: 'card',
    label: 'Card 卡片',
    description: '对照三种外观、内容插槽、内部操作、整卡按钮与链接、禁用和拖动视觉。',
    component: CardPlayground,
  },
  {
    id: 'divider',
    label: 'Divider 分割线',
    description: '对照横竖方向、三种缩进、RTL、主题、语义和卡片内组合。',
    component: DividerPlayground,
  },
  {
    id: 'badge',
    label: 'Badge 徽标',
    description: '对照 Small／Large 形态、定位、可访问名称、主题和包裹交互内容。',
    component: BadgePlayground,
  },
  {
    id: 'list',
    label: 'List 列表',
    description: '对照标准与 segmented 列表、行高、插槽、选择、分隔线和 RTL。',
    component: ListPlayground,
  },
  {
    id: 'progress',
    label: 'Progress 进度指示器',
    description: '对照线性与圆形、平直与波浪、确定与不确定进度，以及动效、尺寸和布局边界。',
    component: ProgressPlayground,
  },
  {
    id: 'dialog',
    label: 'Dialog 对话框',
    description: '对照普通对话框，检查标题、图标、关闭策略、表单、焦点与滚动。',
    component: DialogPlayground,
  },
  {
    id: 'fullscreen-dialog',
    label: 'Fullscreen Dialog 全屏对话框',
    description: '检查全屏顶栏、底部操作、长正文、异步保存与嵌套确认。',
    component: FullscreenDialogPlayground,
  },
  {
    id: 'menu',
    label: 'Menu 菜单',
    description: '对照菜单外观、分组选择、子菜单、右键触发、键盘和 Dialog 组合。',
    component: MenuPlayground,
  },
  {
    id: 'tooltip',
    label: 'Tooltip 提示',
    description: '对照普通与富内容提示、悬停／键盘／长按、持久提示、定位和浮层组合。',
    component: TooltipPlayground,
  },
  {
    id: 'snackbar',
    label: 'Snackbar 消息提示',
    description: '对照消息布局、操作、队列、键盘和对话框中的局部消息。',
    component: SnackbarPlayground,
  },
  {
    id: 'bottom-sheet',
    label: 'Bottom Sheet 底部面板',
    description: '对照模态与 Standard 面板、预设高度、手势、焦点与浮层组合。',
    component: BottomSheetPlayground,
  },
  {
    id: 'side-sheet',
    label: 'Side Sheet 侧边面板',
    description: '对照 Standard 与模态侧边面板、贴边与分离、布局让位、手势和焦点。',
    component: SideSheetPlayground,
  },
  {
    id: 'tabs',
    label: 'Tabs 标签页',
    description: '对照主／次级标签页、图标与徽标、滚动、键盘、面板生命周期和内容横滑。',
    component: TabsPlayground,
  },
  {
    id: 'navigation-bar',
    label: 'Navigation Bar 导航栏',
    description: '检查 Flexible 导航栏的紧凑／中等布局、目的地状态、徽标与原生导航语义。',
    component: NavigationBarPlayground,
  },
  {
    id: 'navigation-rail',
    label: 'Navigation Rail 导航轨',
    description: '检查收起／展开、Standard 布局与 Modal 覆盖、内容胶囊、徽标、键盘和长标签。',
    component: NavigationRailPlayground,
  },
  {
    id: 'navigation-drawer',
    label: 'Navigation Drawer 导航抽屉',
    description: '检查旧版 M3 的 Standard／Modal、分组、键盘、滑动关闭与焦点恢复。',
    component: NavigationDrawerPlayground,
  },
  {
    id: 'app-bar',
    label: 'App Bar 应用栏',
    description: '检查三种尺寸、副标题、居中、图像、滚动收合／隐藏、键盘和导航组合。',
    component: AppBarPlayground,
  },
  {
    id: 'search',
    label: 'Search 搜索',
    description: '检查两种样式、Docked／全屏、输入法、结果、焦点与搜索应用栏组合。',
    component: SearchPlayground,
  },
  {
    id: 'toolbar',
    label: 'Toolbar 工具栏',
    description: '对照 Docked／Floating、两套配色、横竖布局、收合、滚动与键盘操作。',
    component: ToolbarPlayground,
  },
  {
    id: 'fab',
    label: 'FAB 浮动操作按钮',
    description: '检查尺寸、七套配色、扩缩、正文滚动及 Rail／Toolbar 组合。',
    component: FabPlayground,
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
