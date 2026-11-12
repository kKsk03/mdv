<script setup lang="ts">
import { ref } from 'vue'
import home from '@iconify-icons/material-symbols/home'
import homeOutline from '@iconify-icons/material-symbols/home-outline'
import explore from '@iconify-icons/material-symbols/explore'
import exploreOutline from '@iconify-icons/material-symbols/explore-outline'
import bookmark from '@iconify-icons/material-symbols/bookmark'
import bookmarkOutline from '@iconify-icons/material-symbols/bookmark-outline'
import person from '@iconify-icons/material-symbols/person'
import personOutline from '@iconify-icons/material-symbols/person-outline'
import menu from '@iconify-icons/material-symbols/menu'
import menuOpen from '@iconify-icons/material-symbols/menu-open'
import edit from '@iconify-icons/material-symbols/edit'
import settings from '@iconify-icons/material-symbols/settings'
import {
  MdvBadge,
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvDivider,
  MdvIcon,
  MdvIconButton,
  MdvMenu,
  MdvMenuItem,
  MdvModalNavigationRail,
  MdvNavigationRail,
  MdvNavigationRailItem,
} from '@/index'
import type { MdvNavigationRailAlignment, MdvNavigationRailCloseDetail } from '@/index'

const expanded = ref(false)
const current = ref('home')
const alignment = ref<MdvNavigationRailAlignment>('top')
const transparent = ref(false)
const showDivider = ref(false)
const width = ref('')
const modalExpanded = ref(false)
const hideOnCollapse = ref(false)
const closeOnSelect = ref(true)
const rejectClose = ref(false)
const destroyOnClose = ref(false)
const closeReason = ref('尚未关闭')
const compose = ref(false)
const nested = ref(false)
const boundaryExpanded = ref(true)
const rtl = ref(false)
const largeText = ref(false)
const dark = ref(false)
const destinations = [
  { value: 'home', label: '首页', icon: homeOutline, activeIcon: home },
  { value: 'explore', label: '探索', icon: exploreOutline, activeIcon: explore, badge: '3' },
  { value: 'saved', label: '已保存', icon: bookmarkOutline, activeIcon: bookmark },
  { value: 'profile', label: '个人资料', icon: personOutline, activeIcon: person },
]
const compactDestinations = destinations.slice(0, 3)
function updateModal(value: boolean) {
  if (value || !rejectClose.value) modalExpanded.value = value
}
function closed(detail: MdvNavigationRailCloseDetail) {
  closeReason.value = detail.reason
}
</script>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">Standard · 在布局中展开</h2>
      <div class="flex flex-wrap items-end gap-4">
        <label class="grid gap-2 text-mdv-label-large"
          >项目位置
          <select v-model="alignment" class="playground-control">
            <option value="top">顶部</option>
            <option value="center">居中</option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large"
          >展开宽度
          <select v-model="width" class="playground-control">
            <option value="">按内容</option>
            <option value="280px">280px</option>
            <option value="360px">360px</option>
          </select>
        </label>
        <MdvCheckbox v-model="transparent" label="透明背景" />
        <MdvCheckbox v-model="showDivider" label="边界分割线" />
      </div>
      <div
        class="flex h-[38rem] min-w-0 overflow-hidden rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low"
      >
        <MdvNavigationRail
          v-model:expanded="expanded"
          :alignment="alignment"
          :expanded-width="width || undefined"
          :transparent="transparent"
          :show-divider="showDivider"
          aria-label="标准导航示例"
        >
          <template #menu="{ expanded: isExpanded, menuAttrs }">
            <MdvIconButton
              variant="standard"
              v-bind="menuAttrs"
              :aria-label="isExpanded ? '收起导航' : '展开导航'"
            >
              <MdvIcon :icon="isExpanded ? menuOpen : menu" />
            </MdvIconButton>
          </template>
          <template #fab>
            <MdvIconButton
              variant="tonal"
              size="m"
              shape="square"
              aria-label="撰写新内容"
              @click="compose = true"
              ><MdvIcon :icon="edit"
            /></MdvIconButton>
          </template>
          <template #default="{ expanded: isExpanded }">
            <MdvNavigationRailItem
              v-for="destination in destinations"
              :key="destination.value"
              :label="destination.label"
              :active="current === destination.value"
              @click="current = destination.value"
            >
              <template #icon="{ active }"
                ><MdvIcon :icon="active ? destination.activeIcon : destination.icon"
              /></template>
              <template v-if="destination.badge" #badge
                ><MdvBadge variant="large" :content="destination.badge" aria-label="3 条新内容"
              /></template>
            </MdvNavigationRailItem>
            <template v-if="isExpanded">
              <MdvDivider class="my-3" variant="inset" />
              <p class="px-9 py-2 text-mdv-label-medium text-mdv-on-surface-variant">更多目的地</p>
              <MdvNavigationRailItem
                label="设置"
                :active="current === 'settings'"
                @click="current = 'settings'"
                ><template #icon><MdvIcon :icon="settings" /></template
              ></MdvNavigationRailItem>
              <MdvNavigationRailItem label="暂不可用" disabled
                ><template #icon><MdvIcon :icon="bookmarkOutline" /></template
              ></MdvNavigationRailItem>
            </template>
          </template>
        </MdvNavigationRail>
        <main class="min-w-0 flex-1 space-y-5 overflow-auto p-6">
          <h3 class="text-mdv-headline-small">
            {{ destinations.find((item) => item.value === current)?.label || '设置' }}
          </h3>
          <p class="text-mdv-body-medium text-mdv-on-surface-variant">
            展开时正文自然让位。每个目的地都可通过 Tab 访问，上下方向键与 Home／End 只移动焦点。
          </p>
          <MdvButton variant="tonal" @click="expanded = !expanded"
            >{{ expanded ? '收起' : '展开' }}导航</MdvButton
          >
          <div class="grid gap-4">
            <article
              v-for="n in 3"
              :key="n"
              class="rounded-mdv-medium bg-mdv-surface-container p-5"
            >
              <h4 class="text-mdv-title-medium">内容 {{ n }}</h4>
              <p class="mt-2 text-mdv-body-medium">
                主内容保持正常排版，侧边导航拥有独立滚动区域。
              </p>
            </article>
          </div>
        </main>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">Modal · 覆盖正文</h2>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="hideOnCollapse" label="隐藏收起占位（沉浸模式）" />
        <MdvCheckbox v-model="closeOnSelect" label="选择后收起" />
        <MdvCheckbox v-model="rejectClose" label="父级拒绝收起请求" />
        <MdvCheckbox v-model="destroyOnClose" label="关闭后销毁展开内容" />
      </div>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        沉浸模式收起后不保留窄轨，正文填满可用空间，通过正文顶部的菜单按钮打开；关闭此开关则保留常驻窄轨。
      </p>
      <div
        class="flex h-96 min-w-0 overflow-hidden rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low"
      >
        <MdvModalNavigationRail
          id="modal-navigation-example"
          :expanded="modalExpanded"
          :hide-on-collapse="hideOnCollapse"
          :close-on-select="closeOnSelect"
          :destroy-on-close="destroyOnClose"
          :alignment="alignment"
          :expanded-width="width || undefined"
          aria-label="模态导航示例"
          @update:expanded="updateModal"
          @closed="closed"
        >
          <template #menu="{ expanded: isExpanded, menuAttrs }">
            <MdvIconButton
              variant="standard"
              v-bind="menuAttrs"
              :aria-label="isExpanded ? '收起导航' : '展开导航'"
              ><MdvIcon :icon="isExpanded ? menuOpen : menu"
            /></MdvIconButton>
          </template>
          <template #fab>
            <MdvIconButton
              variant="tonal"
              size="m"
              shape="square"
              aria-label="创建内容"
              @click="nested = true"
              ><MdvIcon :icon="edit"
            /></MdvIconButton>
          </template>
          <template #default="{ expanded: isExpanded }">
            <MdvNavigationRailItem
              v-for="destination in destinations"
              :key="destination.value"
              :label="destination.label"
              :active="current === destination.value"
              @click="current = destination.value"
            >
              <template #icon="{ active }"
                ><MdvIcon :icon="active ? destination.activeIcon : destination.icon"
              /></template>
              <template v-if="destination.badge" #badge
                ><MdvBadge variant="large" :content="destination.badge" aria-label="3 条新内容"
              /></template>
            </MdvNavigationRailItem>
            <template v-if="isExpanded">
              <MdvDivider class="my-3" variant="inset" />
              <MdvNavigationRailItem
                label="设置"
                :active="current === 'settings'"
                @click="current = 'settings'"
                ><template #icon><MdvIcon :icon="settings" /></template
              ></MdvNavigationRailItem>
              <MdvNavigationRailItem
                label="取消此次导航"
                href="#cancelled-navigation"
                @click.prevent
                ><template #icon><MdvIcon :icon="bookmarkOutline" /></template
              ></MdvNavigationRailItem>
              <MdvNavigationRailItem
                label="在新窗口查看规范"
                href="https://m3.material.io/components/navigation-rail/specs"
                target="_blank"
                rel="noopener"
                ><template #icon><MdvIcon :icon="exploreOutline" /></template
              ></MdvNavigationRailItem>
              <div class="px-5 py-3">
                <MdvMenu>
                  <template #trigger="{ triggerProps }"
                    ><MdvButton variant="text" v-bind="triggerProps"
                      >导航内菜单</MdvButton
                    ></template
                  >
                  <MdvMenuItem label="嵌套菜单项目" />
                </MdvMenu>
              </div>
            </template>
          </template>
        </MdvModalNavigationRail>
        <main class="min-w-0 flex-1 space-y-5 overflow-auto p-6">
          <div class="flex items-center gap-3">
            <MdvIconButton
              v-if="hideOnCollapse"
              variant="standard"
              aria-label="打开模态导航"
              aria-controls="modal-navigation-example"
              :aria-expanded="modalExpanded"
              @click="modalExpanded = true"
              ><MdvIcon :icon="menu"
            /></MdvIconButton>
            <h3 class="text-mdv-title-large">模态导航不改变这块区域的宽度</h3>
          </div>
          <MdvButton v-if="!hideOnCollapse" variant="tonal" @click="modalExpanded = true"
            >打开模态导航</MdvButton
          >
          <p class="text-mdv-body-medium text-mdv-on-surface-variant">
            最后关闭原因：{{ closeReason }}
          </p>
          <p class="text-mdv-body-medium text-mdv-on-surface-variant">
            遮罩和 Escape
            请求收起。开启“父级拒绝”后，取消该开关或由外部程序关闭才能收起；导航内菜单按钮仍可发出请求。
          </p>
        </main>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">长文字、短高度、RTL 与局部主题</h2>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="rtl" label="RTL" /><MdvCheckbox
          v-model="largeText"
          label="两倍标签字号"
        /><MdvCheckbox v-model="dark" label="局部深色" />
      </div>
      <div
        class="flex h-[28rem] min-w-0 overflow-hidden rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <MdvNavigationRail
          v-model:expanded="boundaryExpanded"
          show-divider
          aria-label="边界导航"
          :style="
            largeText
              ? {
                  '--mdv-sys-typescale-label-large-size': '28px',
                  '--mdv-sys-typescale-label-large-line-height': '40px',
                  '--mdv-sys-typescale-label-medium-size': '24px',
                  '--mdv-sys-typescale-label-medium-line-height': '32px',
                }
              : undefined
          "
        >
          <template #menu="{ menuAttrs, expanded: isExpanded }"
            ><MdvIconButton
              variant="standard"
              v-bind="menuAttrs"
              :aria-label="isExpanded ? '收起导航' : '展开导航'"
              ><MdvIcon :icon="menu" /></MdvIconButton
          ></template>
          <MdvNavigationRailItem
            v-for="(label, index) in [
              '所有共享内容与团队协作空间',
              'A very long destination label that can wrap',
              '阅读清单',
              '项目草稿',
              '通知',
              '近期内容',
              '归档',
            ]"
            :key="label"
            :label="label"
            :active="index === 0"
          >
            <template #icon><MdvIcon :icon="bookmarkOutline" /></template>
            <template v-if="index === 0" #badge
              ><MdvBadge variant="large" content="99+" aria-label="超过 99 条新内容"
            /></template>
          </MdvNavigationRailItem>
        </MdvNavigationRail>
        <div class="min-w-0 flex-1 p-5 text-mdv-body-medium text-mdv-on-surface-variant">
          长标签允许换行、撑高，滚动只发生在导航项区域。
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-mdv-title-large">没有顶部操作</h2>
      <div class="flex h-96 overflow-hidden rounded-mdv-large border border-mdv-outline-variant">
        <MdvNavigationRail aria-label="无顶部操作的导航" alignment="center">
          <MdvNavigationRailItem
            v-for="destination in compactDestinations"
            :key="destination.value"
            :label="destination.label"
            :active="current === destination.value"
            @click="current = destination.value"
            ><template #icon><MdvIcon :icon="destination.icon" /></template
          ></MdvNavigationRailItem>
        </MdvNavigationRail>
        <div class="flex-1 bg-mdv-surface-container-low p-6 text-mdv-body-medium">
          菜单与 FAB 插槽缺省时不保留占位。
        </div>
      </div>
    </section>

    <MdvDialog
      v-model="compose"
      title="撰写新内容"
      description="FAB 插槽可以组合已有按钮，导航本身不绑定创建动作。"
    >
      <template #actions="{ close }"
        ><MdvButton variant="text" @click="close()">完成</MdvButton></template
      >
    </MdvDialog>
    <MdvDialog
      v-model="nested"
      title="导航内的对话框"
      description="先关闭此对话框，再恢复导航内的创建按钮；再次 Escape 才收起导航。"
    >
      <template #actions="{ close }"
        ><MdvButton variant="text" @click="close()">完成</MdvButton></template
      >
    </MdvDialog>
  </div>
</template>
