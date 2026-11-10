<script setup lang="ts">
import { ref } from 'vue'
import info from '@iconify-icons/material-symbols/info-outline'
import tune from '@iconify-icons/material-symbols/tune'
import { MdvButton, MdvCheckbox, MdvDialog, MdvIcon, MdvTextField } from '@/index'
import type { MdvDialogCloseDetail, MdvDialogSlotProps } from '@/index'

const basic = ref(false)
const icon = ref(false)
const longContent = ref(false)
const longActions = ref(false)
const formOpen = ref(false)
const nativeForm = ref(false)
const localTheme = ref(false)
const rtl = ref(false)
const result = ref('尚未执行操作')
const formName = ref('')
const email = ref('')
const notifications = ref(true)
const closeOnEsc = ref(true)
const closeOnScrim = ref(true)
const destroyOnClose = ref(false)
const lifecycle = ref<string[]>([])

function record(event: string, detail?: MdvDialogCloseDetail) {
  lifecycle.value = [
    `${event}${detail ? `：${detail.reason} / ${detail.returnValue || '空结果'}` : ''}`,
    ...lifecycle.value,
  ].slice(0, 8)
}

function discardBasic(close: MdvDialogSlotProps['close']) {
  result.value = '已放弃修改'
  void close('discard')
}

function submitForm() {
  formOpen.value = false
  result.value = `已提交：${formName.value} / ${email.value}`
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">基本对话框</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        对照标题、图标、正文与操作区。按 Tab／Shift+Tab 检查循环，关闭后焦点应回到原按钮。
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton @click="basic = true">基本确认</MdvButton>
        <MdvButton variant="tonal" @click="icon = true">带图标</MdvButton>
        <MdvButton variant="outlined" @click="longContent = true">长正文</MdvButton>
        <MdvButton variant="outlined" @click="longActions = true">长操作文字</MdvButton>
      </div>
      <div class="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        <MdvCheckbox v-model="closeOnEsc" label="Esc 关闭" />
        <MdvCheckbox v-model="closeOnScrim" label="遮罩关闭" />
        <MdvCheckbox v-model="destroyOnClose" label="关闭后销毁正文" />
      </div>
      <p class="mt-3 text-mdv-body-medium" role="status">{{ result }}</p>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">表单与焦点</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        默认保留输入内容。普通提交经过 required／email 校验；原生 method="dialog" 表单返回按钮的
        value。
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton @click="formOpen = true">输入表单</MdvButton>
        <MdvButton variant="tonal" @click="nativeForm = true">原生关闭表单</MdvButton>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">局部主题与 RTL</h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <div data-mdv-theme="dark" style="--mdv-sys-color-secondary: #b7e2b5">
          <MdvButton @click="localTheme = true">局部深色对话框</MdvButton>
          <MdvDialog
            v-model="localTheme"
            title="局部主题"
            description="弹窗保留所在容器的主题变量，背景遮罩也使用局部 scrim。"
          >
            <template #icon><MdvIcon :icon="tune" /></template>
            <template #actions="{ close }"
              ><MdvButton variant="text" @click="close()">知道了</MdvButton></template
            >
          </MdvDialog>
        </div>
        <MdvButton variant="outlined" @click="rtl = true">RTL 与长标题</MdvButton>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">生命周期记录</h2>
      <ol
        class="mt-3 space-y-1 font-mono text-mdv-body-small text-mdv-on-surface-variant"
        aria-live="polite"
      >
        <li v-for="(event, index) in lifecycle" :key="index">{{ event }}</li>
      </ol>
    </section>

    <MdvDialog
      v-model="basic"
      title="放弃修改？"
      description="尚未保存的修改将会丢失。你也可以继续编辑，稍后再保存。"
      :close-on-esc="closeOnEsc"
      :close-on-scrim="closeOnScrim"
      :destroy-on-close="destroyOnClose"
      @open="record('open')"
      @opened="record('opened')"
      @close="record('close', $event)"
      @closed="record('closed', $event)"
    >
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close('continue')">继续编辑</MdvButton>
        <MdvButton variant="text" @click="discardBasic(close)">放弃修改</MdvButton>
      </template>
    </MdvDialog>

    <MdvDialog
      v-model="icon"
      title="开启消息提醒？"
      description="启用后，你可以及时收到关于行程的更新。正文保持起始对齐，图标与标题居中。"
    >
      <template #icon><MdvIcon :icon="info" /></template>
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close()">暂时不用</MdvButton>
        <MdvButton variant="text" @click="close('enabled')">开启提醒</MdvButton>
      </template>
    </MdvDialog>

    <MdvDialog
      v-model="longContent"
      title="服务说明"
      style="--mdv-dialog-width: 560px"
      role="dialog"
    >
      <div class="space-y-5">
        <p v-for="index in 18" :key="index">
          {{ index }}.
          这里是用于检查滚动的长正文。标题和底部操作应保持可见，鼠标滚轮、触控与键盘滚动都应仅影响正文。页面背景保持原来的滚动位置。
        </p>
      </div>
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close()">返回</MdvButton>
        <MdvButton variant="text" @click="close('accepted')">同意</MdvButton>
      </template>
    </MdvDialog>

    <MdvDialog
      v-model="longActions"
      title="保存本次修改？"
      description="缩小窗口，检查长按钮在空间不足时是否按照确认在上、取消在下排列。"
    >
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close()">取消本次操作并继续编辑</MdvButton>
        <MdvButton variant="text" @click="close('saved')">确认并保存全部修改内容</MdvButton>
      </template>
    </MdvDialog>

    <MdvDialog
      v-model="formOpen"
      title="添加联系人"
      role="dialog"
      :destroy-on-close="destroyOnClose"
      style="--mdv-dialog-width: 440px"
    >
      <form id="dialog-contact-form" class="grid gap-5" @submit.prevent="submitForm">
        <MdvTextField v-model="formName" label="姓名" name="name" required autofocus full-width />
        <MdvTextField v-model="email" label="邮箱" name="email" type="email" required full-width />
        <MdvCheckbox v-model="notifications" label="接收行程更新" />
      </form>
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close()">取消</MdvButton>
        <MdvButton variant="text" type="submit" form="dialog-contact-form">添加</MdvButton>
      </template>
    </MdvDialog>

    <MdvDialog v-model="nativeForm" title="选择操作" @closed="record('form closed', $event)">
      <form id="dialog-native-form" method="dialog">
        <p>原生提交按钮的 value 会作为关闭结果。也支持外部 form 关联。</p>
      </form>
      <template #actions>
        <MdvButton variant="text" type="submit" form="dialog-native-form" value="cancel"
          >取消</MdvButton
        >
        <MdvButton variant="text" type="submit" form="dialog-native-form" value="confirm"
          >确认</MdvButton
        >
      </template>
    </MdvDialog>

    <MdvDialog
      v-model="rtl"
      dir="rtl"
      lang="ar"
      title="عنوان طويل لاختبار اتجاه النص والتفاف عنوان مربع الحوار"
      description="هذا مثال لاختبار ترتيب الأزرار والمحاذاة واتجاه النص داخل مربع الحوار."
    >
      <template #actions="{ close }">
        <MdvButton variant="text" @click="close()">إلغاء</MdvButton>
        <MdvButton variant="text" @click="close('confirm')">تأكيد</MdvButton>
      </template>
    </MdvDialog>
  </div>
</template>
