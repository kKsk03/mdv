<script setup lang="ts">
import { ref } from 'vue'
import {
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvMenu,
  MdvMenuItem,
  MdvSideSheet,
  MdvSideSheetScaffold,
  MdvSlider,
  MdvSnackbar,
  MdvTextField,
  MdvTooltip,
} from '@/index'
import type { MdvSideSheetCloseDetail, MdvSliderModelValue } from '@/index'

const basic = ref(false)
const floating = ref(false)
const leading = ref(false)
const noTitle = ref(false)
const form = ref(false)
const nested = ref(false)
const message = ref(false)
const guarded = ref(false)
const theme = ref(false)
const rtl = ref(false)
const standard = ref(true)
const narrow = ref(false)
const detached = ref(false)
const atStart = ref(false)
const wide = ref(false)
const dividers = ref(false)
const showBack = ref(false)
const blockClose = ref(true)
const checking = ref(false)
const draft = ref('设计评审')
const volume = ref<MdvSliderModelValue>(40)
const count = ref(0)
const rows = ref(15)
const backCount = ref(0)
const events = ref<string[]>([])

function record(detail: MdvSideSheetCloseDetail) {
  events.value = [
    `${detail.reason}${detail.returnValue ? ' / ' + detail.returnValue : ''}`,
    ...events.value,
  ].slice(0, 5)
}
async function beforeClose() {
  checking.value = true
  await new Promise<void>((resolve) => setTimeout(resolve, 500))
  checking.value = false
  return !blockClose.value
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">模态侧边面板</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        从侧边进入，背景暂时不可操作。点击关闭、遮罩，或用 Escape
        返回。也可以从面向内容的一侧边缘滑动关闭。
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton @click="basic = true">默认 256px</MdvButton>
        <MdvButton variant="tonal" @click="floating = true">分离式 400px</MdvButton>
        <MdvButton variant="outlined" @click="leading = true">从起始侧打开</MdvButton>
        <MdvButton variant="outlined" @click="noTitle = true">没有标题</MdvButton>
        <MdvButton variant="outlined" @click="form = true">表单与浮层组合</MdvButton>
        <MdvButton variant="outlined" @click="guarded = true">异步关闭拦截</MdvButton>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">Standard 页面布局</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        打开时主内容让位，面板与主区域分别滚动。Tab 可以自然进入和离开面板。
      </p>
      <div class="mt-4 flex flex-wrap gap-4">
        <MdvCheckbox v-model="standard" label="打开面板" />
        <MdvCheckbox v-model="detached" label="分离式" />
        <MdvCheckbox v-model="atStart" label="起始侧" />
        <MdvCheckbox v-model="wide" label="400px 宽度" />
        <MdvCheckbox v-model="dividers" label="内容分隔线" />
        <MdvCheckbox v-model="showBack" label="返回按钮" />
      </div>
      <div
        class="mt-5 h-[500px] overflow-hidden rounded-mdv-large border border-mdv-outline-variant"
      >
        <MdvSideSheetScaffold
          v-model="standard"
          title="文件详情"
          :width="wide ? '400px' : '256px'"
          :placement="atStart ? 'start' : 'end'"
          :detached="detached"
          :dividers="dividers"
          :show-back="showBack"
          @back="backCount++"
          @close="record"
        >
          <div class="space-y-5 p-6">
            <h3 class="text-mdv-title-medium">项目文件</h3>
            <div class="flex flex-wrap gap-3">
              <MdvButton variant="tonal" @click="standard = !standard">{{
                standard ? '收起详情' : '查看详情'
              }}</MdvButton
              ><MdvButton variant="text" @click="count++">计数 {{ count }}</MdvButton>
            </div>
            <p>返回按钮已点击 {{ backCount }} 次。</p>
            <p
              v-for="index in 14"
              :key="index"
              class="text-mdv-body-medium text-mdv-on-surface-variant"
            >
              文件 {{ index }} · 主页面仍可以浏览、滚动和操作，关闭面板后恢复完整宽度。
            </p>
          </div>
          <template #sheet
            ><p class="text-mdv-title-medium">季度设计稿</p>
            <p
              v-for="index in 14"
              :key="index"
              class="mt-4 text-mdv-body-medium text-mdv-on-surface-variant"
            >
              详情 {{ index }} · 讨论记录与版本说明。
            </p></template
          >
          <template #actions="{ close }"
            ><MdvButton variant="text" @click="close('done')">完成</MdvButton></template
          >
        </MdvSideSheetScaffold>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">局部深色、RTL 与窄容器</h2>
      <div class="mt-4 flex flex-wrap gap-3">
        <div data-mdv-theme="dark">
          <MdvButton @click="theme = true">局部深色</MdvButton
          ><MdvSideSheet
            v-model="theme"
            title="局部主题"
            description="颜色跟随所在区域，正文保留自己的主题。"
            detached
          />
        </div>
        <MdvButton variant="outlined" @click="rtl = true">RTL 模态面板</MdvButton>
        <MdvButton variant="outlined" @click="narrow = !narrow">{{
          narrow ? '关闭窄面板' : '打开窄面板'
        }}</MdvButton>
      </div>
      <div
        dir="rtl"
        class="mt-5 h-80 max-w-80 overflow-hidden rounded-mdv-large border border-mdv-outline-variant"
      >
        <MdvSideSheetScaffold
          v-model="narrow"
          title="تفاصيل الملف"
          width="400px"
          detached
          show-back
          @back="narrow = false"
          ><p class="p-5">يمكنك متابعة العمل أثناء عرض التفاصيل.</p>
          <template #sheet
            ><p v-for="index in 8" :key="index" class="mb-4">
              تفاصيل {{ index }} · وصف الملف والملاحظات.
            </p></template
          ></MdvSideSheetScaffold
        >
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">最近的关闭</h2>
      <ol class="mt-3 space-y-1 font-mono text-mdv-body-small" aria-live="polite">
        <li v-for="(event, index) in events" :key="index">{{ event }}</li>
      </ol>
    </section>

    <MdvSideSheet
      v-model="basic"
      title="文件详情"
      description="侧边面板用来补充当前页面的内容。"
      @close="record"
      ><template #actions="{ close }"
        ><MdvButton variant="text" @click="close('cancel')">取消</MdvButton
        ><MdvButton variant="text" @click="close('save')">保存</MdvButton></template
      ></MdvSideSheet
    >
    <MdvSideSheet
      v-model="floating"
      title="分离式面板与比较长的标题 Long English headline"
      width="400px"
      detached
      dividers
      show-back
      @back="floating = false"
      @close="record"
      ><MdvButton variant="text" @click="rows = rows === 15 ? 2 : 15">切换长短内容</MdvButton>
      <p v-for="index in rows" :key="index" class="mt-5">
        记录 {{ index }} · 标题和操作留在原位，正文独立滚动。
      </p>
      <template #actions="{ close }"
        ><MdvButton variant="text" @click="close('cancel')">取消</MdvButton
        ><MdvButton variant="text" @click="close('save')">保存所有更改</MdvButton></template
      ></MdvSideSheet
    >
    <MdvSideSheet
      v-model="leading"
      title="起始侧面板"
      description="左右位置以逻辑方向决定。"
      placement="start"
      show-back
      @back="leading = false"
      @close="record"
    />
    <MdvSideSheet
      v-model="noTitle"
      aria-label="辅助信息"
      description="省略标题时，关闭入口仍然存在。"
      @close="record"
    />
    <MdvSideSheet
      v-model="rtl"
      dir="rtl"
      title="تفاصيل المشروع وعنوان طويل"
      width="360px"
      show-back
      detached
      @back="rtl = false"
      @close="record"
      ><p>تظهر اللوحة في الجانب الأيسر تلقائيًا.</p>
      <template #actions="{ close }"
        ><MdvButton variant="text" @click="close()">حفظ</MdvButton></template
      ></MdvSideSheet
    >
    <MdvSideSheet
      v-model="guarded"
      title="未保存的更改"
      width="360px"
      :before-close="beforeClose"
      @close="record"
      ><MdvCheckbox v-model="blockClose" label="阻止关闭" />
      <p class="mt-4" role="status">
        {{ checking ? '正在检查…' : '取消勾选后可关闭。' }}
      </p></MdvSideSheet
    >
    <MdvSideSheet v-model="form" title="编辑设置" width="400px" dividers @close="record">
      <form id="side-sheet-form" method="dialog" class="space-y-6">
        <MdvTextField v-model="draft" label="名称" required autofocus /><MdvSlider
          v-model="volume"
          label="音量"
        />
        <div class="flex flex-wrap gap-3">
          <MdvButton variant="tonal" @click="nested = true">打开确认</MdvButton
          ><MdvMenu
            ><template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="outlined">更多</MdvButton></template
            ><MdvMenuItem @select="message = true">提示消息</MdvMenuItem></MdvMenu
          ><MdvTooltip text="面板内部的提示"
            ><template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="text">查看提示</MdvButton></template
            ></MdvTooltip
          >
        </div>
      </form>
      <template #actions
        ><MdvButton type="submit" form="side-sheet-form" value="saved" variant="text"
          >保存</MdvButton
        ></template
      >
      <MdvDialog v-model="nested" title="确认修改" description="关闭确认框后回到侧边面板。"
        ><template #actions="{ close }"
          ><MdvButton variant="text" @click="close()">返回编辑</MdvButton></template
        ></MdvDialog
      >
      <MdvSnackbar v-model="message" message="更改已保存" />
    </MdvSideSheet>
  </div>
</template>
