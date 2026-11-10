<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { MdvButton, MdvDialog, MdvFullscreenDialog, MdvTextField } from '@/index'

const visible = ref(false)
const edit = ref(false)
const discard = ref(false)
const savedName = ref('周末旅行')
const draftName = ref(savedName.value)
const notes = ref('')
const saving = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let resolveDiscard: ((value: boolean) => void) | undefined

function beginEdit() {
  draftName.value = savedName.value
  notes.value = ''
  edit.value = true
}

function guardEdit() {
  if (saving.value) return false
  if (draftName.value === savedName.value && !notes.value) return true
  discard.value = true
  return new Promise<boolean>((resolve) => {
    resolveDiscard = resolve
  })
}

function answerDiscard(value: boolean) {
  discard.value = false
  const resolve = resolveDiscard
  resolveDiscard = undefined
  resolve?.(value)
}

function saveEdit() {
  if (saving.value) return
  saving.value = true
  timer = setTimeout(() => {
    savedName.value = draftName.value
    saving.value = false
    edit.value = false
    timer = undefined
  }, 1200)
}

onBeforeUnmount(() => {
  if (timer !== undefined) clearTimeout(timer)
  resolveDiscard?.(false)
})
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">全屏对话框</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        顶栏提供 X、标题和确认操作，正文独立滚动，按需提供底部操作栏。
      </p>
      <MdvButton class="mt-5" @click="visible = true">新建行程</MdvButton>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">表单与未保存确认</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        修改后按 Esc 或 X，会打开普通对话框确认。保存成功后关闭，保存期间保留编辑内容。
      </p>
      <MdvButton class="mt-5" variant="tonal" @click="beginEdit">编辑行程</MdvButton>
      <p class="mt-3 text-mdv-body-medium">当前保存的名称：{{ savedName }}</p>
    </section>

    <MdvFullscreenDialog v-model="visible" title="新建行程">
      <div class="mx-auto grid max-w-3xl gap-6">
        <MdvTextField label="行程名称" placeholder="输入名称" full-width autofocus />
        <MdvTextField label="目的地" full-width />
        <MdvTextField label="行程备注" multiline :rows="6" full-width />
        <p v-for="index in 12" :key="index">
          行程说明 {{ index }}：顶栏和可选底部栏固定，正文独立滚动。
        </p>
      </div>
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close('saved')">保存</MdvButton>
      </template>
      <template #footer="{ close }">
        <MdvButton variant="text" @click="close()">取消</MdvButton>
      </template>
    </MdvFullscreenDialog>

    <MdvFullscreenDialog v-model="edit" title="编辑行程" :before-close="guardEdit">
      <form id="dialog-edit-form" class="mx-auto grid max-w-3xl gap-6" @submit.prevent="saveEdit">
        <MdvTextField v-model="draftName" label="行程名称" required full-width autofocus />
        <MdvTextField v-model="notes" label="行程备注" multiline :rows="5" full-width />
      </form>
      <template #actions>
        <MdvButton
          variant="text"
          type="submit"
          form="dialog-edit-form"
          :loading="saving"
          loading-text="保存中…"
        >
          保存
        </MdvButton>
      </template>
      <MdvDialog
        v-model="discard"
        title="放弃未保存的修改？"
        description="关闭此编辑页面后，本次修改会丢失。"
        @closed="answerDiscard(false)"
      >
        <template #actions>
          <MdvButton variant="text" @click="answerDiscard(false)">继续编辑</MdvButton>
          <MdvButton variant="text" @click="answerDiscard(true)">放弃修改</MdvButton>
        </template>
      </MdvDialog>
    </MdvFullscreenDialog>
  </div>
</template>
