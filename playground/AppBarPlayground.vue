<script setup lang="ts">
import { ref } from 'vue'
import menu from '@iconify-icons/material-symbols/menu'
import arrowBack from '@iconify-icons/material-symbols/arrow-back'
import search from '@iconify-icons/material-symbols/search'
import moreVert from '@iconify-icons/material-symbols/more-vert'
import favorite from '@iconify-icons/material-symbols/favorite-outline'
import home from '@iconify-icons/material-symbols/home-outline'
import settings from '@iconify-icons/material-symbols/settings-outline'
import {
  MdvAppBar,
  MdvAppBarScaffold,
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvIcon,
  MdvIconButton,
  MdvMenu,
  MdvMenuItem,
  MdvNavigationDrawer,
  MdvNavigationDrawerItem,
  MdvNavigationRail,
  MdvNavigationRailItem,
} from '@/index'
import type { MdvAppBarAppearance, MdvAppBarScrollBehavior, MdvAppBarVariant } from '@/index'

const variants: { value: MdvAppBarVariant; name: string; title: string }[] = [
  { value: 'small', name: 'Small', title: '收件箱' },
  { value: 'medium', name: 'Medium flexible', title: '旅行计划' },
  { value: 'large', name: 'Large flexible', title: '周末去远足' },
]
const centered = ref(false)
const subtitles = ref(true)
const showLeading = ref(true)
const twoActions = ref(true)
const variant = ref<MdvAppBarVariant>('large')
const appearance = ref<MdvAppBarAppearance>('default')
const behavior = ref<MdvAppBarScrollBehavior>('exit-until-collapsed')
const transparent = ref(false)
const scroller = ref<InstanceType<typeof MdvAppBarScaffold> | null>(null)
const shortContent = ref(false)
const scrollTitle = ref('探索新的目的地')
const scrollSubtitle = ref(true)
const brandImage = ref(false)
const customAction = ref(false)
const notice = ref('点击应用栏中的按钮查看反馈')
const rtl = ref(false)
const largeText = ref(false)
const dark = ref(false)
const narrow = ref(false)
const boundaryTitle = ref('给下一次旅程，留一点想象的空间')
const shortTitle = ref('下一次旅程')
const localScrolled = ref(false)
const followWindow = ref(false)
const navigation = ref<'rail' | 'drawer'>('rail')
const drawerOpen = ref(false)
const destination = ref('home')
const dialogOpen = ref(false)
const rows = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  title: ['城市漫步', '山间小路', '海边日落', '当地风味'][index % 4],
  text: '放慢脚步，看看沿途的风景。把喜欢的地方收藏起来，下次再来。',
}))

function backToTop() {
  scroller.value?.contentElement?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">三种尺寸 · 标题与副标题</h2>
      <div class="flex flex-wrap gap-4">
        <label class="grid gap-2 text-mdv-label-large">
          外观
          <select v-model="appearance" class="playground-control">
            <option value="default">Default · 无阴影</option>
            <option value="elevated">Elevated · 滚动阴影</option>
            <option value="bordered">Bordered · 底部分隔线</option>
          </select>
        </label>
        <MdvCheckbox v-model="centered" label="居中标题" />
        <MdvCheckbox v-model="subtitles" label="副标题" />
        <MdvCheckbox v-model="showLeading" label="前置按钮" />
        <MdvCheckbox v-model="twoActions" label="两个尾部操作" />
      </div>
      <div v-for="item in variants" :key="item.value" class="space-y-2">
        <p class="text-mdv-label-large text-mdv-on-surface-variant">{{ item.name }}</p>
        <div class="overflow-hidden rounded-mdv-large border border-mdv-outline-variant">
          <MdvAppBar
            :variant="item.value"
            :appearance="appearance"
            :title="item.title"
            :subtitle="subtitles ? '留住每一段美好时光' : undefined"
            :title-alignment="centered ? 'center' : 'start'"
            :heading-level="3"
            :scrolled="false"
          >
            <template v-if="showLeading" #leading>
              <MdvIconButton variant="standard" aria-label="打开导航" @click="notice = '打开导航'">
                <MdvIcon :icon="menu" />
              </MdvIconButton>
            </template>
            <template #actions>
              <MdvIconButton variant="standard" aria-label="搜索" @click="notice = '搜索'">
                <MdvIcon :icon="search" />
              </MdvIconButton>
              <MdvIconButton
                v-if="twoActions"
                variant="standard"
                aria-label="更多操作"
                @click="notice = '更多操作'"
              >
                <MdvIcon :icon="moreVert" />
              </MdvIconButton>
            </template>
          </MdvAppBar>
        </div>
      </div>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant" role="status">{{ notice }}</p>
      <div class="overflow-hidden rounded-mdv-large border border-mdv-outline-variant">
        <MdvAppBar
          :appearance="appearance"
          title-alignment="center"
          :heading-level="3"
          :scrolled="false"
        >
          <template #title>
            <svg width="88" height="32" viewBox="0 0 88 32" role="img" aria-label="漫游">
              <path d="M16 0 32 16 16 32 0 16Z" fill="currentColor" />
              <text x="40" y="23" font-size="20" fill="currentColor">漫游</text>
            </svg>
          </template>
          <template #actions>
            <MdvIconButton
              class="app-bar-playground-avatar"
              variant="standard"
              aria-label="查看个人资料"
              @click="notice = '查看个人资料'"
            >
              <span aria-hidden="true">林</span>
            </MdvIconButton>
          </template>
        </MdvAppBar>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">滚动 · 收合、固定与自动隐藏</h2>
      <div class="flex flex-wrap items-end gap-4">
        <label class="grid gap-2 text-mdv-label-large">
          尺寸
          <select v-model="variant" class="playground-control">
            <option v-for="item in variants" :key="item.value" :value="item.value">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          滚动行为
          <select v-model="behavior" class="playground-control">
            <option value="none">不收合（固定布局）</option>
            <option value="pinned">固定可见</option>
            <option value="exit-until-collapsed">收合至 Small，回顶部展开</option>
            <option value="enter-always">向下隐藏，向上出现</option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          外观
          <select v-model="appearance" class="playground-control">
            <option value="default">Default · 无阴影</option>
            <option value="elevated">Elevated · 滚动阴影</option>
            <option value="bordered">Bordered · 底部分隔线</option>
          </select>
        </label>
        <MdvCheckbox v-model="scrollSubtitle" label="副标题" />
        <MdvCheckbox v-model="brandImage" label="品牌图像" />
        <MdvCheckbox v-model="transparent" label="滚动后透明" />
        <MdvCheckbox v-model="customAction" label="右侧自定义操作（actions 插槽）" />
        <MdvCheckbox v-model="shortContent" label="短正文" />
        <MdvButton variant="text" @click="backToTop">回到顶部</MdvButton>
      </div>
      <label class="grid max-w-lg gap-2 text-mdv-label-large">
        标题
        <input v-model="scrollTitle" class="playground-control" />
      </label>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        在下面的内容区域滚动。自动隐藏后，可使用 Shift+Tab 返回应用栏，检查按钮是否重新出现。
      </p>
      <MdvAppBarScaffold
        ref="scroller"
        class="rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low"
        :class="largeText ? 'app-bar-playground-large-text h-[40rem]' : 'h-[30rem]'"
        :style="{ width: narrow ? '320px' : '100%' }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : 'light'"
        :content-attrs="{ 'aria-label': '应用栏滚动预览' }"
      >
        <template #appbar>
          <MdvAppBar
            :variant="variant"
            :appearance="appearance"
            :title="scrollTitle"
            :subtitle="scrollSubtitle ? '出发之前，先看看这些好地方' : undefined"
            :title-alignment="centered ? 'center' : 'start'"
            :scroll-behavior="behavior"
            :transparent-on-scroll="transparent"
            :heading-level="3"
          >
            <template #leading="{ scrolled }">
              <MdvIconButton
                :variant="transparent && scrolled ? 'tonal' : 'standard'"
                aria-label="返回顶部"
                @click="backToTop"
              >
                <MdvIcon :icon="arrowBack" />
              </MdvIconButton>
            </template>
            <template v-if="brandImage" #image>
              <svg width="88" height="32" viewBox="0 0 88 32" role="img" aria-label="漫游">
                <path d="M16 0 32 16 16 32 0 16Z" fill="currentColor" />
                <text x="40" y="23" font-size="20" fill="currentColor">漫游</text>
              </svg>
            </template>
            <template #actions="{ scrolled }">
              <MdvButton
                v-if="customAction"
                variant="text"
                @click="notice = '通过 actions 插槽导出行程'"
                >导出行程</MdvButton
              >
              <MdvIconButton
                :variant="transparent && scrolled ? 'tonal' : 'standard'"
                aria-label="收藏目的地"
                @click="notice = '已收藏目的地'"
              >
                <MdvIcon :icon="favorite" />
              </MdvIconButton>
            </template>
          </MdvAppBar>
        </template>
        <div class="grid gap-4 p-4">
          <article
            v-for="row in shortContent ? rows.slice(0, 1) : rows"
            :key="row.id"
            class="rounded-mdv-large bg-mdv-surface p-5"
          >
            <h4 class="text-mdv-title-medium">{{ row.title }} · {{ row.id }}</h4>
            <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">{{ row.text }}</p>
          </article>
          <MdvButton variant="text" @click="backToTop">返回应用栏</MdvButton>
        </div>
      </MdvAppBarScaffold>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">长标题 · RTL、窄容器与大字</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        以下环境开关也会应用到上方的滚动预览，便于检查内容区域的布局。
      </p>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="rtl" label="RTL" />
        <MdvCheckbox v-model="dark" label="局部深色" />
        <MdvCheckbox v-model="largeText" label="两倍文字令牌" />
        <MdvCheckbox v-model="narrow" label="窄容器" />
        <MdvCheckbox v-model="localScrolled" label="手动控制滚动外观" />
      </div>
      <div class="grid max-w-xl gap-3">
        <label class="grid gap-2 text-mdv-label-large">
          完整标题
          <input v-model="boundaryTitle" class="playground-control" />
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          收合标题
          <input v-model="shortTitle" class="playground-control" />
        </label>
      </div>
      <div
        class="max-w-full overflow-hidden rounded-mdv-large border border-mdv-outline-variant"
        :class="{ 'app-bar-playground-large-text': largeText }"
        :style="{ width: narrow ? '320px' : '100%' }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : 'light'"
      >
        <MdvAppBar
          variant="large"
          :appearance="appearance"
          :title="boundaryTitle"
          :collapsed-title="shortTitle"
          subtitle="Plan your next adventure"
          :scrolled="localScrolled"
          :title-alignment="centered ? 'center' : 'start'"
          :heading-level="3"
        >
          <template #leading>
            <MdvIconButton variant="standard" aria-label="返回" @click="notice = '返回'">
              <MdvIcon :icon="arrowBack" />
            </MdvIconButton>
          </template>
          <template #actions>
            <MdvIconButton variant="standard" aria-label="更多" @click="notice = '更多'">
              <MdvIcon :icon="moreVert" />
            </MdvIconButton>
          </template>
        </MdvAppBar>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">导航与浮层组合</h2>
      <label class="grid max-w-xs gap-2 text-mdv-label-large">
        导航布局
        <select v-model="navigation" class="playground-control">
          <option value="rail">Navigation Rail</option>
          <option value="drawer">Navigation Drawer</option>
        </select>
      </label>
      <MdvButton
        v-if="navigation === 'drawer'"
        variant="text"
        aria-controls="app-bar-preview-drawer"
        :aria-expanded="drawerOpen"
        @click="drawerOpen = !drawerOpen"
        >切换抽屉</MdvButton
      >
      <div
        class="flex h-[30rem] min-w-0 overflow-hidden rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low"
        :dir="rtl ? 'rtl' : 'ltr'"
      >
        <MdvNavigationRail v-if="navigation === 'rail'" aria-label="组合示例导航">
          <MdvNavigationRailItem
            label="首页"
            :active="destination === 'home'"
            @click="destination = 'home'"
          >
            <template #icon><MdvIcon :icon="home" /></template>
          </MdvNavigationRailItem>
          <MdvNavigationRailItem
            label="设置"
            :active="destination === 'settings'"
            @click="destination = 'settings'"
          >
            <template #icon><MdvIcon :icon="settings" /></template>
          </MdvNavigationRailItem>
        </MdvNavigationRail>
        <MdvNavigationDrawer
          v-else
          id="app-bar-preview-drawer"
          v-model="drawerOpen"
          aria-label="组合示例抽屉"
        >
          <MdvNavigationDrawerItem
            label="首页"
            :active="destination === 'home'"
            @click="destination = 'home'"
          >
            <template #icon><MdvIcon :icon="home" /></template>
          </MdvNavigationDrawerItem>
        </MdvNavigationDrawer>
        <MdvAppBarScaffold class="min-w-0 flex-1" :content-attrs="{ 'aria-label': '导航组合正文' }">
          <template #appbar>
            <MdvAppBar
              :title="destination === 'home' ? '我的收藏' : '偏好设置'"
              :appearance="appearance"
              :transparent-on-scroll="transparent"
              scroll-behavior="pinned"
              :heading-level="3"
            >
              <template v-if="navigation === 'drawer'" #leading>
                <MdvIconButton
                  variant="standard"
                  aria-label="切换导航抽屉"
                  aria-controls="app-bar-preview-drawer"
                  :aria-expanded="drawerOpen"
                  @click="drawerOpen = !drawerOpen"
                >
                  <MdvIcon :icon="menu" />
                </MdvIconButton>
              </template>
              <template #actions>
                <MdvMenu>
                  <template #trigger="{ triggerProps }">
                    <MdvIconButton v-bind="triggerProps" variant="standard" aria-label="更多操作">
                      <MdvIcon :icon="moreVert" />
                    </MdvIconButton>
                  </template>
                  <MdvMenuItem label="打开对话框" @click="dialogOpen = true" />
                  <MdvMenuItem label="返回首页" @click="destination = 'home'" />
                </MdvMenu>
              </template>
            </MdvAppBar>
          </template>
          <div class="grid gap-4 p-4">
            <article
              v-for="row in rows.slice(0, 10)"
              :key="row.id"
              class="rounded-mdv-large bg-mdv-surface p-5"
            >
              <h4 class="text-mdv-title-medium">{{ row.title }}</h4>
              <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">{{ row.text }}</p>
            </article>
          </div>
        </MdvAppBarScaffold>
      </div>
      <MdvDialog v-model="dialogOpen" title="保留这份旅行计划？">
        <p>关闭后焦点应回到应用栏中的菜单按钮，导航和局部滚动位置应保留。</p>
        <template #actions>
          <MdvButton variant="text" @click="dialogOpen = false">取消</MdvButton>
          <MdvButton variant="text" @click="dialogOpen = false">保留</MdvButton>
        </template>
      </MdvDialog>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">跟随页面滚动</h2>
      <MdvCheckbox v-model="followWindow" label="启用页面应用栏" />
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        开启后滚动整个页面。这个示例跟随页面，前面的独立预览跟随各自的内容区域。
      </p>
      <MdvAppBar
        variant="medium"
        title="页面中的应用栏"
        subtitle="随整个页面的滚动位置变化"
        :scroll-behavior="followWindow ? 'exit-until-collapsed' : 'none'"
        :heading-level="3"
      >
        <template #actions>
          <MdvIconButton variant="standard" aria-label="页面操作" @click="notice = '页面操作'">
            <MdvIcon :icon="moreVert" />
          </MdvIconButton>
        </template>
      </MdvAppBar>
      <article
        v-for="row in rows.slice(0, 6)"
        :key="row.id"
        class="rounded-mdv-large bg-mdv-surface-container-low p-6"
      >
        <h4 class="text-mdv-title-medium">{{ row.title }}</h4>
        <p class="mt-2 text-mdv-body-large text-mdv-on-surface-variant">{{ row.text }}</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.app-bar-playground-large-text {
  --mdv-sys-typescale-title-large-size: 44px;
  --mdv-sys-typescale-title-large-line-height: 56px;
  --mdv-sys-typescale-headline-medium-size: 56px;
  --mdv-sys-typescale-headline-medium-line-height: 72px;
  --mdv-sys-typescale-display-small-size: 72px;
  --mdv-sys-typescale-display-small-line-height: 88px;
  --mdv-sys-typescale-label-medium-size: 24px;
  --mdv-sys-typescale-label-medium-line-height: 32px;
  --mdv-sys-typescale-label-large-size: 28px;
  --mdv-sys-typescale-label-large-line-height: 40px;
  --mdv-sys-typescale-title-medium-size: 32px;
  --mdv-sys-typescale-title-medium-line-height: 48px;
}

.app-bar-playground-avatar {
  --mdv-icon-button-icon-size: 32px;
}

.app-bar-playground-avatar span {
  display: grid;
  inline-size: 32px;
  block-size: 32px;
  place-items: center;
  border-radius: 50%;
  background: var(--mdv-sys-color-tertiary-container);
  color: var(--mdv-sys-color-on-tertiary-container);
  font: 500 14px / 20px var(--mdv-sys-typescale-font-family);
}
</style>
