<script setup lang="ts">
import { ref } from 'vue'
import inbox from '@iconify-icons/material-symbols/inbox'
import mail from '@iconify-icons/material-symbols/mail-outline'
import bookmark from '@iconify-icons/material-symbols/bookmark'
import bookmarkOutline from '@iconify-icons/material-symbols/bookmark-outline'
import folder from '@iconify-icons/material-symbols/folder-outline'
import settings from '@iconify-icons/material-symbols/settings'
import help from '@iconify-icons/material-symbols/help-outline'
import menu from '@iconify-icons/material-symbols/menu'
import edit from '@iconify-icons/material-symbols/edit'
import {
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvIcon,
  MdvIconButton,
  MdvMenu,
  MdvMenuItem,
  MdvModalNavigationDrawer,
  MdvNavigationDrawer,
  MdvNavigationDrawerGroup,
  MdvNavigationDrawerItem,
} from '@/index'
import type { MdvNavigationDrawerCloseDetail } from '@/index'

const visible = ref(true)
const current = ref('inbox')
const width = ref('360px')
const foldersExpanded = ref(true)
const navigationCurrent = ref('Navigation drawer')
const navigationRtl = ref(false)
const navigationDestinations = ['Navigation bar', 'Navigation drawer', 'Navigation rail']
const modal = ref(false)
const closeOnSelect = ref(true)
const closeOnScrim = ref(true)
const closeOnEsc = ref(true)
const closeOnSwipe = ref(true)
const destroyOnClose = ref(false)
const rejectClose = ref(false)
const confirmClose = ref(false)
const confirming = ref(false)
const pending = ref(false)
const lastReason = ref('尚未关闭')
const nested = ref(false)
const boundaryVisible = ref(true)
const rtl = ref(false)
const largeText = ref(false)
const dark = ref(false)
const narrow = ref(false)
let resolveClose: ((allowed: boolean) => void) | undefined
const destinations = [
  { value: 'inbox', label: '收件箱', icon: mail, activeIcon: inbox, badge: 24 },
  {
    value: 'saved',
    label: '已收藏',
    icon: bookmarkOutline,
    activeIcon: bookmark,
    badge: undefined,
  },
  { value: 'draft', label: '草稿', icon: edit, activeIcon: edit, badge: 3 },
]
function updateModal(value: boolean) {
  if (value || !rejectClose.value) modal.value = value
}
async function beforeClose() {
  if (!confirmClose.value) return true
  pending.value = true
  confirming.value = true
  const allowed = await new Promise<boolean>((resolve) => {
    resolveClose = resolve
  })
  pending.value = false
  return allowed
}
function answerClose(allowed: boolean) {
  confirming.value = false
  resolveClose?.(allowed)
  resolveClose = undefined
}
function closed(detail: MdvNavigationDrawerCloseDetail) {
  lastReason.value = detail.reason
}
</script>

<template>
  <div class="space-y-10">
    <p class="text-mdv-body-medium text-mdv-on-surface-variant">
      旧版 M3 的 Standard／Modal 导航抽屉。当前 Expressive 新项目可优先选用 Expanded Navigation
      Rail。
    </p>
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">Standard · 布局让位</h2>
      <div class="flex flex-wrap items-center gap-4">
        <MdvCheckbox v-model="visible" label="显示抽屉" />
        <label class="flex items-center gap-2 text-mdv-label-large"
          >宽度<select v-model="width" class="playground-control">
            <option value="360px">360px（默认）</option>
            <option value="280px">280px</option>
            <option value="24rem">24rem</option>
          </select></label
        >
      </div>
      <div class="drawer-demo">
        <MdvNavigationDrawer id="standard-drawer" v-model="visible" title="邮箱" :width="width">
          <MdvNavigationDrawerItem
            v-for="destination in destinations"
            :key="destination.value"
            :label="destination.label"
            :active="current === destination.value"
            :badge="destination.badge"
            @click="current = destination.value"
          >
            <template #icon="{ active }"
              ><MdvIcon :icon="active ? destination.activeIcon : destination.icon"
            /></template>
          </MdvNavigationDrawerItem>
          <MdvNavigationDrawerGroup label="工作空间" divider>
            <MdvNavigationDrawerItem
              label="所有文件"
              :active="current === 'files'"
              @click="current = 'files'"
              ><template #icon><MdvIcon :icon="folder" /></template
            ></MdvNavigationDrawerItem>
            <MdvNavigationDrawerGroup
              v-model:expanded="foldersExpanded"
              label="项目文件夹"
              collapsible
            >
              <template #icon><MdvIcon :icon="folder" /></template>
              <MdvNavigationDrawerItem
                label="产品设计"
                :active="current === 'design'"
                @click="current = 'design'"
              />
              <MdvNavigationDrawerGroup label="开发" collapsible>
                <MdvNavigationDrawerItem
                  label="组件库"
                  :active="current === 'components'"
                  badge="12"
                  @click="current = 'components'"
                />
                <MdvNavigationDrawerItem label="已归档项目" disabled />
              </MdvNavigationDrawerGroup>
            </MdvNavigationDrawerGroup>
          </MdvNavigationDrawerGroup>
          <MdvNavigationDrawerGroup label="更多" divider>
            <MdvNavigationDrawerItem
              label="设置"
              :active="current === 'settings'"
              @click="current = 'settings'"
              ><template #icon><MdvIcon :icon="settings" /></template
            ></MdvNavigationDrawerItem>
            <MdvNavigationDrawerItem
              label="帮助"
              href="https://m3.material.io/components/navigation-drawer/overview"
              target="_blank"
              rel="noopener"
              ><template #icon><MdvIcon :icon="help" /></template
            ></MdvNavigationDrawerItem>
          </MdvNavigationDrawerGroup>
          <template #footer><span class="text-mdv-body-small">已同步所有更改</span></template>
        </MdvNavigationDrawer>
        <main class="drawer-demo__main">
          <div class="flex items-center gap-3">
            <MdvIconButton
              variant="standard"
              aria-label="切换标准抽屉"
              aria-controls="standard-drawer"
              :aria-expanded="visible"
              @click="visible = !visible"
              ><MdvIcon :icon="menu"
            /></MdvIconButton>
            <h3 class="text-mdv-title-large">{{ current }}</h3>
          </div>
          <p class="mt-5 text-mdv-body-medium">
            抽屉关闭后正文获得完整空间。展开不抢走正文焦点，主内容和导航分别滚动。
          </p>
          <article
            v-for="n in 5"
            :key="n"
            class="mt-4 rounded-mdv-medium bg-mdv-surface-container p-5"
          >
            <h4 class="text-mdv-title-medium">邮件 {{ n }}</h4>
            <p class="mt-2 text-mdv-body-medium">
              Tab 逐项访问；上下方向键、Home、End 移动焦点，选择状态由页面管理。
            </p>
          </article>
        </main>
      </div>
    </section>
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">纯文字 · 分层导航</h2>
      <MdvCheckbox v-model="navigationRtl" label="RTL" />
      <div class="drawer-demo drawer-demo--nested" :dir="navigationRtl ? 'rtl' : 'ltr'">
        <MdvNavigationDrawer title="Components" width="280px" aria-label="组件导航">
          <MdvNavigationDrawerGroup label="Navigation" collapsible>
            <MdvNavigationDrawerItem
              v-for="destination in navigationDestinations"
              :key="destination"
              :label="destination"
              :active="navigationCurrent === destination"
              @click="navigationCurrent = destination"
            />
          </MdvNavigationDrawerGroup>
          <MdvNavigationDrawerItem
            label="Search"
            :active="navigationCurrent === 'Search'"
            @click="navigationCurrent = 'Search'"
          />
        </MdvNavigationDrawer>
        <main class="drawer-demo__main space-y-3">
          <h3 class="text-mdv-title-medium">{{ navigationCurrent }}</h3>
          <p class="text-mdv-body-medium">展开 Navigation 查看子项；按 Tab 检查各行的焦点轮廓。</p>
        </main>
      </div>
    </section>
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">Modal · 覆盖正文</h2>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="closeOnSelect" label="选择后关闭" /><MdvCheckbox
          v-model="closeOnScrim"
          label="点击遮罩关闭"
        /><MdvCheckbox v-model="closeOnEsc" label="Escape 关闭" /><MdvCheckbox
          v-model="closeOnSwipe"
          label="向起始边滑动关闭"
        />
        <MdvCheckbox v-model="destroyOnClose" label="退出后销毁内容" /><MdvCheckbox
          v-model="rejectClose"
          label="父级拒绝关闭"
        /><MdvCheckbox v-model="confirmClose" label="关闭前确认" />
      </div>
      <MdvButton aria-controls="modal-drawer" :aria-expanded="modal" @click="modal = true"
        >打开模态抽屉</MdvButton
      >
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        最近关闭原因：{{ lastReason }}{{ pending ? ' · 等待确认' : '' }}。向左横滑关闭，RTL
        时向右；纵向手势继续滚动列表。
      </p>
      <MdvModalNavigationDrawer
        id="modal-drawer"
        :model-value="modal"
        :width="width"
        title="邮箱"
        :close-on-select="closeOnSelect"
        :close-on-scrim="closeOnScrim"
        :close-on-esc="closeOnEsc"
        :close-on-swipe="closeOnSwipe"
        :destroy-on-close="destroyOnClose"
        :before-close="beforeClose"
        :dir="rtl ? 'rtl' : 'ltr'"
        @update:model-value="updateModal"
        @closed="closed"
      >
        <MdvNavigationDrawerItem
          v-for="destination in destinations"
          :key="destination.value"
          :label="destination.label"
          :active="current === destination.value"
          :badge="destination.badge"
          @click="current = destination.value"
          ><template #icon="{ active }"
            ><MdvIcon :icon="active ? destination.activeIcon : destination.icon" /></template
        ></MdvNavigationDrawerItem>
        <MdvNavigationDrawerGroup label="文件夹" collapsible divider
          ><template #icon><MdvIcon :icon="folder" /></template
          ><MdvNavigationDrawerItem
            v-for="n in 12"
            :key="n"
            :label="`项目文件夹 ${n}`"
            :active="current === `folder-${n}`"
            @click="current = `folder-${n}`"
        /></MdvNavigationDrawerGroup>
        <MdvNavigationDrawerGroup label="原生链接" divider>
          <MdvNavigationDrawerItem label="取消本次激活" href="#cancelled" @click.prevent />
          <MdvNavigationDrawerItem
            label="新窗口查看规范"
            href="https://m3.material.io/components/navigation-drawer/specs"
            target="_blank"
            rel="noopener"
          />
          <MdvNavigationDrawerItem label="不可用的目的地" disabled />
        </MdvNavigationDrawerGroup>
        <template #footer="{ close }">
          <div class="flex flex-wrap gap-2">
            <MdvMenu
              ><template #trigger="{ triggerProps }"
                ><MdvButton variant="text" v-bind="triggerProps">更多操作</MdvButton></template
              ><MdvMenuItem label="菜单内操作"
            /></MdvMenu>
            <MdvButton variant="text" @click="nested = true">打开对话框</MdvButton
            ><MdvButton variant="text" @click="close()">关闭导航</MdvButton>
          </div>
          <label class="mt-3 grid gap-2 text-mdv-body-small"
            >保留的草稿<input class="playground-control" placeholder="关闭后再次打开检查"
          /></label>
          <MdvDialog
            v-model="nested"
            title="抽屉中的对话框"
            description="Escape 先关闭最上层对话框，焦点恢复到抽屉中的按钮。"
            ><template #actions="{ close: closeDialog }"
              ><MdvButton variant="text" @click="closeDialog()">完成</MdvButton></template
            ></MdvDialog
          >
        </template>
      </MdvModalNavigationDrawer>
      <MdvDialog
        :model-value="confirming"
        title="离开导航？"
        description="可以继续浏览，或确认本次关闭。"
        @update:model-value="answerClose(false)"
        ><template #actions
          ><MdvButton variant="text" @click="answerClose(false)">继续浏览</MdvButton
          ><MdvButton variant="text" @click="answerClose(true)">确认关闭</MdvButton></template
        ></MdvDialog
      >
    </section>
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">短高度、窄空间、长文字与局部主题</h2>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="rtl" label="RTL" /><MdvCheckbox
          v-model="largeText"
          label="两倍文字"
        /><MdvCheckbox v-model="dark" label="局部深色" /><MdvCheckbox
          v-model="narrow"
          label="240px 容器"
        /><MdvCheckbox v-model="boundaryVisible" label="显示抽屉" />
      </div>
      <div
        class="drawer-demo drawer-demo--boundary"
        :class="{ 'drawer-demo--narrow': narrow }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
        :style="
          largeText
            ? {
                '--mdv-sys-typescale-label-large-size': '28px',
                '--mdv-sys-typescale-label-large-line-height': '40px',
              }
            : undefined
        "
      >
        <MdvNavigationDrawer v-model="boundaryVisible" title="长标签与计数">
          <MdvNavigationDrawerItem
            label="这是一条会在窄空间内单行省略的完整中文导航标签"
            active
            badge="999+"
            ><template #icon><MdvIcon :icon="inbox" /></template
          ></MdvNavigationDrawerItem>
          <MdvNavigationDrawerItem
            label="A very long English destination name without losing its accessible label"
            badge="100"
          />
          <MdvNavigationDrawerGroup label="分组与嵌套" collapsible
            ><MdvNavigationDrawerGroup label="第二层" collapsible
              ><MdvNavigationDrawerItem label="嵌套目的地" badge="12" /></MdvNavigationDrawerGroup
          ></MdvNavigationDrawerGroup>
          <MdvNavigationDrawerItem v-for="n in 20" :key="n" :label="`其他目的地 ${n}`" />
        </MdvNavigationDrawer>
        <main class="drawer-demo__main"><p class="text-mdv-body-medium">边界内容区</p></main>
      </div>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        全局主题／种子颜色使用侧栏设置；reduced-motion
        使用系统设置。长标签视觉省略，完整文字保留在导航项的可访问名称中。
      </p>
    </section>
  </div>
</template>

<style scoped>
.drawer-demo {
  display: flex;
  height: 40rem;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 16px;
  background: var(--mdv-sys-color-surface-container-low);
}
.drawer-demo__main {
  min-width: 0;
  flex: 1 1 0;
  padding: 24px;
  overflow: auto;
}
.drawer-demo--boundary {
  height: 20rem;
}
.drawer-demo--nested {
  height: 22rem;
}
.drawer-demo--narrow {
  width: 240px;
  max-width: 100%;
}
</style>
