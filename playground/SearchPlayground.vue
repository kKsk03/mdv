<script setup lang="ts">
import { computed, ref } from 'vue'
import searchIcon from '@iconify-icons/material-symbols/search'
import menuIcon from '@iconify-icons/material-symbols/menu'
import moreIcon from '@iconify-icons/material-symbols/more-vert'
import historyIcon from '@iconify-icons/material-symbols/history'
import mailIcon from '@iconify-icons/material-symbols/mail-outline'
import {
  MdvAppBarScaffold,
  MdvButton,
  MdvCheckbox,
  MdvChip,
  MdvDialog,
  MdvIcon,
  MdvIconButton,
  MdvLinearProgress,
  MdvList,
  MdvListItem,
  MdvListSubheader,
  MdvMenu,
  MdvMenuItem,
  MdvNavigationDrawer,
  MdvNavigationDrawerItem,
  MdvSearchAppBar,
  MdvSearchBar,
  MdvSearchView,
} from '@/index'
import type { MdvSearchLayout, MdvSearchSlotProps, MdvSearchVariant } from '@/index'

const query = ref('')
const submitted = ref('尚未提交搜索')
const variant = ref<MdvSearchVariant>('contained')
const layout = ref<MdvSearchLayout>('auto')
const loading = ref(false)
const failed = ref(false)
const filters = ref(false)
const onlyUnread = ref(false)
const disabled = ref(false)
const readonly = ref(false)
const rtl = ref(false)
const dark = ref(false)
const narrow = ref(false)
const largeText = ref(false)
const viewOpen = ref(false)
const drawerOpen = ref(false)
const appQuery = ref('')
const standalone = ref('')
const dialogOpen = ref(false)
const refuseClose = ref(false)
const parentAccepts = ref(true)
const controlledOpen = ref(false)
const formResult = ref('')
const rows = [
  {
    id: 1,
    title: '周末的旅行计划',
    description: '林晓 · 山间步道、出行时间与集合地点',
    unread: true,
  },
  {
    id: 2,
    title: '设计评审：搜索体验',
    description: '设计团队 · 新版搜索稿与交互说明',
    unread: true,
  },
  {
    id: 3,
    title: '旅行照片与沿途的风景',
    description: '陈明 · 一起整理上周末的照片',
    unread: false,
  },
  {
    id: 4,
    title: 'Material Design 的排版与颜色',
    description: '产品周刊 · 本周阅读推荐',
    unread: false,
  },
  {
    id: 5,
    title: '下一次旅行的目的地与一个很长的中文搜索结果标题',
    description: '旅行小组 · 长内容、换行与滚动检查',
    unread: true,
  },
  {
    id: 6,
    title: 'A long English subject about exploring new places together',
    description: 'Travel club · Keep meaningful content readable in a narrow pane',
    unread: false,
  },
]
const results = computed(() =>
  rows.filter(
    (row) =>
      (!onlyUnread.value || row.unread) &&
      `${row.title} ${row.description}`.toLowerCase().includes(query.value.toLowerCase()),
  ),
)
const examples = ref<
  {
    variant: MdvSearchVariant
    layout: 'docked' | 'fullscreen'
    name: string
    query: string
  }[]
>([
  { variant: 'contained', layout: 'docked', name: 'Contained · Docked', query: '' },
  { variant: 'contained', layout: 'fullscreen', name: 'Contained · Fullscreen', query: '' },
  { variant: 'divided', layout: 'docked', name: 'Divided · Docked', query: '' },
  { variant: 'divided', layout: 'fullscreen', name: 'Divided · Fullscreen', query: '' },
])
function submit(value: string) {
  submitted.value = value ? `搜索：${value}` : '搜索全部内容'
}
function selectResult(value: string, close: MdvSearchSlotProps['close']) {
  submit(value)
  void close()
}
function selectSuggestion(
  example: { query: string },
  value: string,
  close: MdvSearchSlotProps['close'],
) {
  example.query = value
  selectResult(value, close)
}
function submitForm(event: Event) {
  formResult.value = JSON.stringify([...new FormData(event.target as HTMLFormElement).entries()])
}
</script>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">搜索与建议</h2>
      <div class="flex flex-wrap items-end gap-4">
        <label class="grid gap-2 text-mdv-label-large"
          >样式
          <select v-model="variant" class="playground-control">
            <option value="contained">Contained</option>
            <option value="divided">Divided</option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large"
          >布局
          <select v-model="layout" class="playground-control">
            <option value="auto">Auto · 小屏全屏</option>
            <option value="docked">Docked</option>
            <option value="fullscreen">Fullscreen</option>
          </select>
        </label>
        <MdvCheckbox v-model="filters" label="筛选区" />
        <MdvCheckbox v-model="loading" label="加载中" />
        <MdvCheckbox v-model="failed" label="请求失败" />
        <MdvCheckbox v-model="disabled" label="禁用" />
        <MdvCheckbox v-model="readonly" label="只读" />
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="rtl" label="RTL" />
        <MdvCheckbox v-model="dark" label="局部深色" />
        <MdvCheckbox v-model="narrow" label="320px 容器" />
        <MdvCheckbox v-model="largeText" label="两倍字号" />
      </div>
      <div
        class="search-preview rounded-mdv-large bg-mdv-surface-container-low py-8"
        :class="{ 'search-preview--large': largeText }"
        :style="{ maxWidth: narrow ? '320px' : undefined }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <MdvSearchView
          clear-label="清空搜索"
          back-label="返回"
          results-label="搜索建议与结果"
          v-model="query"
          v-model:open="viewOpen"
          :variant="variant"
          :layout="layout"
          :disabled="disabled"
          :readonly="readonly"
          :loading="loading"
          placeholder="搜索邮件"
          :status-text="
            loading ? '正在搜索' : failed ? '搜索失败，请重试' : `${results.length} 条结果`
          "
          @search="submit"
        >
          <template #trailing="{ expanded }">
            <MdvIconButton
              v-if="!expanded"
              variant="standard"
              aria-label="账号"
              :disabled="disabled"
              ><span class="search-avatar">林</span></MdvIconButton
            >
          </template>
          <template #default="{ close }">
            <div v-if="filters" class="px-4 pb-2">
              <MdvChip
                variant="filter"
                :selected="onlyUnread"
                @update:selected="onlyUnread = $event"
                >仅未读</MdvChip
              >
            </div>
            <MdvLinearProgress v-if="loading" indeterminate aria-label="正在搜索" />
            <div v-else-if="failed" class="space-y-3 p-6">
              <p>暂时无法取得结果。</p>
              <MdvButton variant="text" @click="failed = false">重试</MdvButton>
            </div>
            <MdvList
              v-else-if="results.length"
              :variant="variant === 'contained' ? 'expressive' : 'baseline'"
            >
              <MdvListSubheader>{{ query ? '搜索结果' : '最近与推荐' }}</MdvListSubheader>
              <MdvListItem
                v-for="row in results"
                :key="row.id"
                :headline="row.title"
                :supporting-text="row.description"
                :icon="query ? mailIcon : historyIcon"
                interactive
                @click="selectResult(row.title, close)"
              />
            </MdvList>
            <p v-else class="p-6 text-mdv-on-surface-variant">
              没有匹配的邮件，试试“旅行”或“设计”。
            </p>
          </template>
        </MdvSearchView>
        <p class="mt-6 px-6 text-mdv-body-medium text-mdv-on-surface-variant">
          {{ submitted }} · {{ viewOpen ? '展开中' : '已收起' }}
        </p>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">四种样式布局</h2>
      <div class="grid gap-6 xl:grid-cols-2">
        <div
          v-for="example in examples"
          :key="example.name"
          class="space-y-3 rounded-mdv-large border border-mdv-outline-variant py-6"
        >
          <h3 class="px-6 text-mdv-title-medium">{{ example.name }}</h3>
          <MdvSearchView
            clear-label="清空搜索"
            back-label="返回"
            results-label="搜索建议与结果"
            v-model="example.query"
            :variant="example.variant"
            :layout="example.layout"
            :placeholder="example.name"
            @search="submit"
          >
            <template #default="{ close }">
              <MdvList :variant="example.variant === 'contained' ? 'expressive' : 'baseline'">
                <MdvListSubheader>建议搜索</MdvListSubheader>
                <MdvListItem
                  v-for="text in ['设计规范', '旅行计划', '团队分享']"
                  :key="text"
                  :headline="text"
                  :icon="historyIcon"
                  interactive
                  @click="selectSuggestion(example, text, close)"
                />
              </MdvList>
            </template>
          </MdvSearchView>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">搜索应用栏 · 正文独立滚动</h2>
      <div class="flex h-[28rem] overflow-hidden rounded-mdv-large bg-mdv-surface-container-low">
        <MdvNavigationDrawer v-model="drawerOpen" title="邮箱" width="240px">
          <MdvNavigationDrawerItem label="收件箱" active />
          <MdvNavigationDrawerItem label="收藏邮件" />
        </MdvNavigationDrawer>
        <MdvAppBarScaffold class="min-w-0 flex-1" :content-attrs="{ 'aria-label': '邮箱正文' }">
          <template #appbar>
            <MdvSearchAppBar
              clear-label="清空搜索"
              back-label="返回"
              results-label="搜索建议与结果"
              placeholder="搜索邮件"
              v-model="appQuery"
              :variant="variant"
              :layout="layout"
              scroll-behavior="enter-always"
              @search="submit"
            >
              <template #leading
                ><MdvIconButton
                  variant="standard"
                  aria-label="切换导航抽屉"
                  @click="drawerOpen = !drawerOpen"
                  ><MdvIcon :icon="menuIcon" /></MdvIconButton
              ></template>
              <template #actions>
                <MdvMenu
                  ><template #trigger="{ triggerProps }"
                    ><MdvIconButton v-bind="triggerProps" variant="standard" aria-label="更多选项"
                      ><MdvIcon :icon="moreIcon" /></MdvIconButton></template
                  ><MdvMenuItem @click="dialogOpen = true">打开对话框</MdvMenuItem></MdvMenu
                >
              </template>
              <template #default="{ close }">
                <MdvList
                  ><MdvListItem
                    v-for="row in rows.filter((item) => item.title.includes(appQuery))"
                    :key="row.id"
                    :headline="row.title"
                    :supporting-text="row.description"
                    :icon="mailIcon"
                    interactive
                    @click="selectResult(row.title, close)"
                /></MdvList>
              </template>
            </MdvSearchAppBar>
          </template>
          <MdvList
            ><MdvListItem
              v-for="index in 24"
              :key="index"
              :headline="rows[(index - 1) % rows.length]!.title"
              supporting-text="向下滚动隐藏栏，向上滚动显示；Tab 聚焦时恢复。"
              :icon="mailIcon"
          /></MdvList>
        </MdvAppBarScaffold>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">独立输入栏与表单</h2>
      <form class="grid max-w-xl gap-4" @submit.prevent="submitForm">
        <MdvSearchBar
          clear-label="清空搜索"
          v-model="standalone"
          name="query"
          form="search-native-form"
          placeholder="直接筛选当前内容"
          @search="submit"
        />
        <p class="text-mdv-body-medium">当前值：{{ standalone || '空' }}</p>
      </form>
      <form id="search-native-form" class="flex flex-wrap gap-3" @submit.prevent="submitForm">
        <MdvButton type="submit" variant="tonal">读取表单字段</MdvButton>
        <output class="self-center text-mdv-body-medium">{{ formResult }}</output>
      </form>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">图标入口、关闭拦截与嵌套</h2>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="parentAccepts" label="父级接受开关请求" />
        <MdvCheckbox v-model="refuseClose" label="拦截关闭" />
        <MdvSearchView
          clear-label="清空搜索"
          back-label="返回"
          results-label="搜索建议与结果"
          placeholder="搜索邮件"
          :open="controlledOpen"
          :before-close="() => !refuseClose"
          :variant="variant"
          :layout="layout"
          @update:open="parentAccepts && (controlledOpen = $event)"
        >
          <template #trigger="{ triggerProps }"
            ><MdvIconButton v-bind="triggerProps" variant="tonal" aria-label="打开搜索"
              ><MdvIcon :icon="searchIcon" /></MdvIconButton
          ></template>
          <template #default="{ close }"
            ><div class="space-y-4 p-6">
              <p>可检查父级拒绝请求、Escape 与遮罩关闭。</p>
              <MdvButton variant="text" @click="close()">关闭搜索</MdvButton>
            </div></template
          >
        </MdvSearchView>
        <MdvButton variant="outlined" @click="dialogOpen = true">在对话框中搜索</MdvButton>
      </div>
      <MdvDialog v-model="dialogOpen" title="添加邮件">
        <MdvSearchView
          clear-label="清空搜索"
          back-label="返回"
          results-label="搜索建议与结果"
          :variant="variant"
          :layout="layout"
          placeholder="搜索要添加的邮件"
        >
          <template #default="{ close }"
            ><MdvList
              ><MdvListItem
                v-for="row in rows"
                :key="row.id"
                :headline="row.title"
                :icon="mailIcon"
                interactive
                @click="close()" /></MdvList
          ></template>
        </MdvSearchView>
        <template #actions="{ close }"
          ><MdvButton variant="text" autofocus @click="close()">完成</MdvButton></template
        >
      </MdvDialog>
    </section>
  </div>
</template>

<style scoped>
.search-avatar {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: var(--mdv-sys-color-tertiary-container);
  color: var(--mdv-sys-color-on-tertiary-container);
  font-size: 14px;
}
.search-preview--large {
  --mdv-sys-typescale-body-large-size: 32px;
  --mdv-sys-typescale-body-large-line-height: 48px;
}
</style>
