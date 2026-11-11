<script setup lang="ts">
import { ref } from 'vue'
import {
  MdvBottomSheet,
  MdvBottomSheetScaffold,
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvMenu,
  MdvMenuItem,
  MdvSlider,
  MdvSnackbar,
  MdvTextField,
  MdvTooltip,
} from '@/index'
import type { MdvBottomSheetChangeDetail, MdvBottomSheetState, MdvSliderModelValue } from '@/index'

const short = ref(false)
const long = ref(false)
const direct = ref(false)
const full = ref(false)
const form = ref(false)
const themed = ref(false)
const rtl = ref(false)
const guarded = ref(false)
const nested = ref(false)
const message = ref(false)
const expanded = ref(false)
const showHandle = ref(true)
const draggable = ref(true)
const blockClose = ref(true)
const checking = ref(false)
const name = ref('')
const volume = ref<MdvSliderModelValue>(40)
const standard = ref<MdvBottomSheetState>('partial')
const hideable = ref(false)
const backgroundCount = ref(0)
const compact = ref(false)
const rows = ref(18)
const events = ref<string[]>([])

function record(value: MdvBottomSheetChangeDetail) {
  events.value = [
    `${value.previousState} → ${value.state} / ${value.reason}`,
    ...events.value,
  ].slice(0, 6)
}
async function beforeClose() {
  checking.value = true
  await new Promise<void>((resolve) => setTimeout(resolve, 600))
  checking.value = false
  return !blockClose.value
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">模态面板</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        短内容自然高度，长内容默认半屏。拖动顶部手柄，或点击／用 Enter、Space 切换高度。
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvButton @click="short = true">短内容</MdvButton>
        <MdvButton variant="tonal" @click="long = true">长内容与高度控制</MdvButton>
        <MdvButton variant="outlined" @click="direct = true">直接展开</MdvButton>
        <MdvButton variant="outlined" @click="full = true">真正全高</MdvButton>
        <MdvButton variant="outlined" @click="form = true">表单与浮层组合</MdvButton>
        <MdvButton variant="outlined" @click="guarded = true">异步关闭拦截</MdvButton>
      </div>
      <div class="mt-4 flex flex-wrap gap-5">
        <MdvCheckbox v-model="showHandle" label="显示拖动手柄" />
        <MdvCheckbox v-model="draggable" label="允许拖动（点击仍可用）" />
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">Standard 页面布局</h2>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <MdvButton size="xs" variant="text" @click="standard = 'hidden'">隐藏</MdvButton>
        <MdvButton size="xs" variant="text" @click="standard = 'partial'">预览高度</MdvButton>
        <MdvButton size="xs" variant="text" @click="standard = 'expanded'">展开</MdvButton>
        <MdvCheckbox v-model="hideable" label="允许用户隐藏" />
        <MdvCheckbox v-model="compact" label="默认 56px 手柄预览" />
      </div>
      <div
        class="mt-4 h-[520px] overflow-hidden rounded-mdv-large border border-mdv-outline-variant"
      >
        <MdvBottomSheetScaffold
          v-model="standard"
          title="附近的地点"
          :peek-height="compact ? 56 : 196"
          :hideable="hideable"
          :draggable="draggable"
          :show-handle="showHandle"
          @change="record"
        >
          <div class="space-y-4 p-6">
            <h3 class="text-mdv-title-medium">主页面保持可操作</h3>
            <p>面板展开时背景也可以点击，不锁页面滚动、不主动移动焦点。</p>
            <MdvButton variant="tonal" @click="backgroundCount++"
              >背景计数 {{ backgroundCount }}</MdvButton
            >
            <p
              v-for="index in 7"
              :key="index"
              class="text-mdv-body-medium text-mdv-on-surface-variant"
            >
              地图与目的地内容 {{ index }}。收起时会预留面板的预览高度。
            </p>
          </div>
          <template #sheet>
            <p>向上展开查看地点，向下回到预览高度。</p>
            <ul class="mt-4 space-y-4">
              <li v-for="index in 15" :key="index">地点 {{ index }} · 步行 {{ index * 3 }} 分钟</li>
            </ul>
          </template>
          <template #actions="{ collapse }"
            ><MdvButton variant="text" @click="collapse()">收起</MdvButton></template
          >
        </MdvBottomSheetScaffold>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">局部深色、RTL 与窄容器</h2>
      <div class="mt-4 flex flex-wrap gap-3">
        <div data-mdv-theme="dark">
          <MdvButton @click="themed = true">局部深色</MdvButton>
          <MdvBottomSheet
            v-model="themed"
            title="局部深色面板"
            description="颜色继承所在容器，不搬移到 body。"
          >
            <template #actions="{ close }"
              ><MdvButton variant="text" @click="close()">完成</MdvButton></template
            >
          </MdvBottomSheet>
        </div>
        <MdvButton variant="outlined" @click="rtl = true">RTL 长标题</MdvButton>
      </div>
      <div
        class="mt-5 h-80 max-w-80 overflow-hidden rounded-mdv-large border border-mdv-outline-variant"
        dir="rtl"
      >
        <MdvBottomSheetScaffold title="وجهات قريبة" :peek-height="140">
          <p class="p-5">يمكن التفاعل مع الصفحة أثناء عرض اللوحة.</p>
          <template #sheet
            ><p v-for="index in 8" :key="index" class="mb-4">
              الوجهة {{ index }} · تفاصيل المكان
            </p></template
          >
        </MdvBottomSheetScaffold>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">最近的高度变化</h2>
      <ol class="mt-3 space-y-1 font-mono text-mdv-body-small" aria-live="polite">
        <li v-for="(event, index) in events" :key="index">{{ event }}</li>
      </ol>
    </section>

    <MdvBottomSheet
      v-model="short"
      title="分享内容"
      description="选择分享方式，或关闭面板返回页面。"
      :show-handle="showHandle"
      :draggable="draggable"
      @change="record"
    >
      <template #actions="{ close }"
        ><MdvButton variant="text" @click="close('cancel')">取消</MdvButton
        ><MdvButton @click="close('share')">分享</MdvButton></template
      >
    </MdvBottomSheet>

    <MdvBottomSheet
      v-model="long"
      v-model:expanded="expanded"
      title="浏览内容"
      :show-handle="showHandle"
      :draggable="draggable"
      @change="record"
    >
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="text" @click="expanded = !expanded">{{
          expanded ? '收起到半屏' : '展开'
        }}</MdvButton>
        <MdvButton variant="text" @click="rows = rows === 18 ? 2 : 18">切换长短内容</MdvButton>
      </div>
      <p v-for="index in rows" :key="index" class="mt-5">
        {{ index }}. 长内容会在面板内部滚动；触屏下先展开，再继续浏览。Long English content should
        wrap naturally without clipping.
      </p>
      <template #actions="{ close }"
        ><MdvButton variant="text" @click="close()">完成浏览</MdvButton></template
      >
    </MdvBottomSheet>

    <MdvBottomSheet v-model="direct" :partial="false" title="直接展开" :draggable="draggable">
      <p v-for="index in 20" :key="index" class="mb-5">
        展开内容 {{ index }}。仍保留官方顶部留白和顶部圆角。
      </p>
    </MdvBottomSheet>
    <MdvBottomSheet
      v-model="full"
      :partial="false"
      max-height="100%"
      title="全高面板"
      style="
        --mdv-bottom-sheet-side-gap: 0px;
        --mdv-bottom-sheet-max-width: 100%;
        --mdv-bottom-sheet-top-gap: 0px;
      "
    >
      <p v-for="index in 25" :key="index" class="mb-5">
        全高内容 {{ index }}。点击顶部手柄或向下拖动即可关闭，也可以按 Esc 返回。
      </p>
    </MdvBottomSheet>

    <MdvBottomSheet v-model="guarded" title="关闭前检查" :before-close="beforeClose">
      <MdvCheckbox v-model="blockClose" label="阻止关闭" />
      <p class="mt-4" role="status">
        {{ checking ? '正在模拟异步检查…' : '拖动、Esc、遮罩和操作关闭都会经过检查。' }}
      </p>
      <template #actions="{ close }"
        ><MdvButton variant="text" :loading="checking" @click="close()"
          >尝试关闭</MdvButton
        ></template
      >
    </MdvBottomSheet>

    <MdvBottomSheet v-model="form" title="编辑设置" :draggable="draggable">
      <form class="space-y-5" @submit.prevent="message = true">
        <MdvTextField v-model="name" label="名称" required full-width />
        <MdvSlider v-model="volume" label="音量" />
        <div class="flex flex-wrap gap-3">
          <MdvButton type="submit">保存设置</MdvButton>
          <MdvButton variant="outlined" @click="nested = true">嵌套 Dialog</MdvButton>
          <MdvMenu>
            <template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="text">更多操作</MdvButton></template
            >
            <MdvMenuItem label="显示消息" @select="message = true" />
          </MdvMenu>
          <MdvTooltip text="输入、Slider 与按钮不会触发面板拖动。">
            <template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="text">操作提示</MdvButton></template
            >
          </MdvTooltip>
        </div>
      </form>
      <p v-for="index in 10" :key="index" class="mt-5">表单后的滚动内容 {{ index }}</p>
      <MdvSnackbar v-model="message" message="已保存设置" :duration="4000" />
      <MdvDialog v-model="nested" title="确认设置" description="关闭后焦点与滚动锁仍属于底部面板。">
        <template #actions="{ close }"
          ><MdvButton variant="text" @click="close()">返回</MdvButton></template
        >
      </MdvDialog>
    </MdvBottomSheet>
    <MdvBottomSheet
      v-model="rtl"
      dir="rtl"
      title="عنوان طويل لاختبار اتجاه النص وتخطيط اللوحة"
      description="يمكنك توسيع اللوحة أو إغلاقها باستخدام لوحة المفاتيح."
    >
      <template #actions="{ close }"
        ><MdvButton variant="text" @click="close()">إغلاق</MdvButton></template
      >
    </MdvBottomSheet>
  </div>
</template>
