<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvDialog, MdvSnackbar, MdvSnackbarProvider, useSnackbar } from '@/index'
import type { MdvSnackbarColor, MdvSnackbarOptions } from '@/index'
import SnackbarDialogControls from './SnackbarDialogControls.vue'

const snackbar = useSnackbar()
const dialog = ref(false)
const direct = ref(false)
const rtl = ref(false)
const localDark = ref(false)
const directColor = ref<MdvSnackbarColor>()
const result = ref('尚未执行操作')
const count = ref(0)

const configurations: { label: string; options: MdvSnackbarOptions }[] = [
  { label: '单行', options: { message: '更改已保存。' } },
  { label: '单行与操作', options: { message: '项目已移至回收站。', action: { label: '撤销' } } },
  {
    label: '双行与操作',
    options: {
      message: '文件已上传。其他协作者现在可以查看最新版本。',
      action: { label: '查看' },
      actionLayout: 'inline',
    },
  },
  {
    label: '操作换行',
    options: {
      message: '同步暂时不可用，稍后可以重新尝试。',
      action: { label: '检查连接设置' },
      actionLayout: 'stacked',
    },
  },
  {
    label: '操作与关闭',
    options: { message: '项目已归档。', action: { label: '撤销' }, closable: true },
  },
]

const colors: { label: string; color?: MdvSnackbarColor }[] = [
  { label: '默认' },
  { label: 'Primary', color: 'primary' },
  { label: 'Secondary', color: 'secondary' },
  { label: 'Tertiary', color: 'tertiary' },
  { label: 'Success', color: 'success' },
  { label: 'Warning', color: 'warning' },
  { label: 'Error', color: 'error' },
  { label: 'Info', color: 'info' },
  { label: '#006C4C', color: '#006C4C' },
]

function showConfiguration(options: MdvSnackbarOptions) {
  snackbar.show({
    ...options,
    action: options.action && {
      ...options.action,
      onClick: () => {
        result.value = `已执行：${options.action?.label ?? ''}`
      },
    },
  })
}

function showQueue() {
  snackbar.show({ message: '队列：第一条消息', duration: 2500 })
  snackbar.show({ message: '队列：第二条消息', duration: 2500 })
  snackbar.show({ message: '队列：第三条消息', duration: 2500 })
}

function updateMessage() {
  count.value++
  snackbar.show({ key: 'sync', message: `已同步 ${count.value} 项。`, duration: 5000 })
}

function showColor(label: string, color?: MdvSnackbarColor) {
  snackbar.show({
    key: 'color-example',
    message: `${label} 消息`,
    color,
    action: { label: '知道了' },
    closable: true,
  })
}

function showDirect(isRtl: boolean, dark: boolean, color?: MdvSnackbarColor) {
  rtl.value = isRtl
  localDark.value = dark
  directColor.value = color
  direct.value = true
}

function openDialog() {
  snackbar.show({ message: '对话框关闭后，这条页面消息继续计时。', duration: 8000 })
  dialog.value = true
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">消息与操作</h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton
          v-for="configuration in configurations"
          :key="configuration.label"
          variant="outlined"
          @click="showConfiguration(configuration.options)"
          >{{ configuration.label }}</MdvButton
        >
        <MdvButton
          variant="outlined"
          @click="
            snackbar.show({
              message:
                '长内容与连续字符：VeryLongMessageWithoutSpaces用于检查窄屏及较大字体下的自然换行和完整显示。',
              action: { label: '查看详细信息' },
              closable: true,
            })
          "
          >长内容</MdvButton
        >
      </div>
      <p class="mt-4 text-mdv-body-medium" role="status">{{ result }}</p>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">消息颜色</h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton
          v-for="item in colors"
          :key="item.label"
          variant="outlined"
          @click="showColor(item.label, item.color)"
          >{{ item.label }}</MdvButton
        >
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">队列与消息更新</h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton @click="showQueue">加入三条消息</MdvButton>
        <MdvButton variant="tonal" @click="updateMessage">更新同步消息</MdvButton>
        <MdvButton variant="outlined" @click="snackbar.clear()">清空队列</MdvButton>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">声明式、主题与方向</h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton variant="tonal" @click="showDirect(false, false)">默认主题</MdvButton>
        <MdvButton variant="tonal" @click="showDirect(true, false)">RTL 起始侧</MdvButton>
        <MdvButton variant="tonal" @click="showDirect(false, true)">局部深色</MdvButton>
        <MdvButton variant="tonal" @click="showDirect(false, true, 'success')"
          >深色 Success</MdvButton
        >
        <MdvButton variant="tonal" @click="showDirect(false, true, '#006C4C')"
          >深色种子色</MdvButton
        >
      </div>
      <div :data-mdv-theme="localDark ? 'dark' : undefined">
        <MdvSnackbar
          v-model="direct"
          :dir="rtl ? 'rtl' : 'ltr'"
          :placement="rtl ? 'bottom-start' : 'bottom'"
          :color="directColor"
          message="可使用键盘进入消息并执行操作。"
          :action="{
            label: '完成',
            onClick: () => {
              result = '已完成操作'
            },
          }"
          closable
        />
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">对话框组合</h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton @click="openDialog">显示页面消息并打开对话框</MdvButton>
      </div>
    </section>

    <MdvDialog v-model="dialog" title="局部消息" role="dialog">
      <p>对话框内的消息由独立 Provider 管理。</p>
      <div class="mt-4">
        <MdvSnackbarProvider><SnackbarDialogControls /></MdvSnackbarProvider>
      </div>
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close()">关闭对话框</MdvButton>
      </template>
    </MdvDialog>
  </div>
</template>
