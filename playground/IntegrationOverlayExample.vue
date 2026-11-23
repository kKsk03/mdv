<script setup lang="ts">
import { ref } from 'vue'
import {
  MdvButton,
  MdvDatePicker,
  MdvDialog,
  MdvMenu,
  MdvMenuItem,
  MdvRichTooltip,
  MdvTextField,
  useSnackbar,
} from '@/index'
import type { MdvDateValue } from '@/index'
import { datePickerCopy } from './picker-copy'

const snackbar = useSnackbar()
const menuOpen = ref(false)
const confirmOpen = ref(false)
const date = ref<MdvDateValue>('2026-11-21')
const title = ref('周末旅行')
const message = ref('打开菜单或日期面板，再按 Escape，父对话框应保持打开。')
</script>

<template>
  <div class="space-y-5">
    <MdvTextField v-model="title" label="编辑计划名称" full-width autofocus />
    <MdvDatePicker :labels="datePickerCopy" v-model="date" layout="modal" label="模态日期面板" />
    <div class="flex flex-wrap items-center gap-3">
      <MdvMenu v-model="menuOpen">
        <template #trigger="{ triggerProps }">
          <MdvButton v-bind="triggerProps" variant="tonal">更多操作</MdvButton>
        </template>
        <MdvMenuItem label="标为重要" @select="message = '已标为重要。'" />
        <MdvMenuItem label="更多分类">
          <template #children>
            <MdvMenuItem label="城市出行" @select="message = '分类：城市出行。'" />
            <MdvMenuItem label="户外探索" @select="message = '分类：户外探索。'" />
          </template>
        </MdvMenuItem>
      </MdvMenu>
      <MdvRichTooltip title="键盘操作" persistent>
        <template #trigger="{ triggerProps }">
          <MdvButton v-bind="triggerProps" variant="text">查看帮助</MdvButton>
        </template>
        <p>按 Tab 进入帮助中的操作，再按 Escape 返回。父对话框应保持打开。</p>
        <template #actions="{ close }">
          <MdvButton variant="text" @click="close()">知道了</MdvButton>
        </template>
      </MdvRichTooltip>
      <MdvButton
        variant="outlined"
        @click="
          snackbar.show({
            message: '这条消息属于当前对话框。',
            closable: true,
            closeLabel: '关闭通知',
          })
        "
      >
        显示局部消息
      </MdvButton>
      <MdvButton variant="outlined" @click="confirmOpen = true">打开嵌套确认</MdvButton>
    </div>
    <p role="status" class="text-mdv-body-medium text-mdv-on-surface-variant">{{ message }}</p>
    <div class="space-y-4 text-mdv-body-medium">
      <p v-for="index in 5" :key="index">
        组合说明 {{ index }}：滚动正文、切换焦点或关闭内层浮层后，编辑内容应保留。
      </p>
    </div>
    <MdvDialog
      v-model="confirmOpen"
      title="确认嵌套关闭顺序"
      description="关闭这层后应回到编辑对话框。再次关闭父层后，页面滚动应恢复。"
    >
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close()">返回编辑</MdvButton>
      </template>
    </MdvDialog>
  </div>
</template>
