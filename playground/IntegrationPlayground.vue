<script setup lang="ts">
import { ref } from 'vue'
import editCalendar from '@iconify-icons/material-symbols/edit-calendar-outline'
import factCheck from '@iconify-icons/material-symbols/fact-check-outline'
import help from '@iconify-icons/material-symbols/help-outline'
import {
  MdvAppBar,
  MdvAppBarScaffold,
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvIcon,
  MdvNavigationBar,
  MdvNavigationBarItem,
  MdvNavigationRail,
  MdvNavigationRailItem,
  MdvSnackbarProvider,
} from '@/index'
import IntegrationFormExample from './IntegrationFormExample.vue'
import IntegrationOverlayExample from './IntegrationOverlayExample.vue'

const compact = ref(false)
const rtl = ref(false)
const expanded = ref(false)
const dialogOpen = ref(false)
const destination = ref('plan')
const submission = ref<[string, string][]>([])
const destinations = [
  { value: 'plan', label: '填写计划', icon: editCalendar },
  { value: 'result', label: '提交结果', icon: factCheck },
  { value: 'checks', label: '操作说明', icon: help },
]
const checks = [
  '用键盘填写表单并提交，检查日期／时间是 ISO 值，同名或禁用字段按原生规则提交。',
  '更改所有字段后重置，检查 Vue 模型和原生控件恢复初始值；切换目的地后草稿仍保留。',
  '打开组合对话框中的菜单、日期面板、帮助和嵌套确认，逐次按 Escape，检查关闭顺序和焦点恢复。',
  '打开对话框前后滚动页面，关闭内层后应继续锁定背景，关闭最后一层后恢复页面滚动。',
  '在浅色／深色／种子主题、RTL、窄屏及系统减少动画偏好下重复操作。',
]

function submitted(entries: [string, string][]) {
  submission.value = entries
  destination.value = 'result'
}
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-4">
      <h2 class="text-mdv-title-large">导航、表单与浮层组合</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        此页用于 0.1.0 组合验收，数据只保留在本地内存，不发送请求。
      </p>
      <div class="flex flex-wrap gap-5">
        <MdvCheckbox v-model="compact" label="窄容器与底部导航" />
        <MdvCheckbox v-model="rtl" label="从右向左" />
        <MdvCheckbox v-if="!compact" v-model="expanded" label="展开导航轨" />
      </div>
    </section>
    <div
      :dir="rtl ? 'rtl' : 'ltr'"
      :style="{ maxInlineSize: compact ? '420px' : undefined }"
      class="overflow-hidden rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low"
    >
      <div class="flex h-180 min-w-0">
        <MdvNavigationRail v-if="!compact" :expanded="expanded" aria-label="组合页导航">
          <MdvNavigationRailItem
            v-for="item in destinations"
            :key="item.value"
            :label="item.label"
            :active="destination === item.value"
            @click="destination = item.value"
          >
            <template #icon><MdvIcon :icon="item.icon" /></template>
          </MdvNavigationRailItem>
        </MdvNavigationRail>
        <div class="flex min-w-0 flex-1 flex-col">
          <MdvAppBarScaffold class="min-h-0 flex-1" :content-attrs="{ 'aria-label': '组合页正文' }">
            <template #appbar>
              <MdvAppBar title="出行计划" subtitle="Material Design Vue" scroll-behavior="pinned">
                <template #actions>
                  <MdvButton variant="text" @click="dialogOpen = true">组合浮层</MdvButton>
                </template>
              </MdvAppBar>
            </template>
            <div class="p-5">
              <IntegrationFormExample v-show="destination === 'plan'" @submitted="submitted" />
              <section v-show="destination === 'result'" class="space-y-4">
                <h3 class="text-mdv-title-large">原生表单提交结果</h3>
                <p class="text-mdv-body-medium text-mdv-on-surface-variant">
                  下方显示最近一次提交的 FormData；未选中的复选框和禁用字段不会出现。
                </p>
                <pre
                  class="overflow-x-auto rounded-mdv-medium bg-mdv-surface-container p-4 text-mdv-body-small"
                  >{{ JSON.stringify(submission, null, 2) }}</pre>
                <MdvButton variant="tonal" @click="destination = 'plan'">返回表单</MdvButton>
              </section>
              <section v-show="destination === 'checks'" class="space-y-4">
                <h3 class="text-mdv-title-large">组合验收操作</h3>
                <ol class="list-decimal space-y-4 ps-5 text-mdv-body-medium">
                  <li v-for="check in checks" :key="check">{{ check }}</li>
                </ol>
              </section>
            </div>
          </MdvAppBarScaffold>
          <MdvNavigationBar v-if="compact" aria-label="组合页导航">
            <MdvNavigationBarItem
              v-for="item in destinations"
              :key="item.value"
              :label="item.label"
              :active="destination === item.value"
              @click="destination = item.value"
            >
              <template #icon><MdvIcon :icon="item.icon" /></template>
            </MdvNavigationBarItem>
          </MdvNavigationBar>
        </div>
      </div>
      <MdvDialog v-model="dialogOpen" title="编辑出行计划">
        <MdvSnackbarProvider><IntegrationOverlayExample /></MdvSnackbarProvider>
        <template #actions="{ close }">
          <MdvButton variant="text" @click="close()">关闭编辑</MdvButton>
        </template>
      </MdvDialog>
    </div>
  </div>
</template>
