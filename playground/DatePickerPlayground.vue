<script setup lang="ts">
import { ref, useId } from 'vue'
import {
  MdvButton,
  MdvCheckbox,
  MdvDatePicker,
  MdvDateRangePicker,
  MdvDialog,
  MdvTextField,
} from '@/index'
import type {
  MdvDatePickerLayout,
  MdvDatePickerView,
  MdvDateRangeValue,
  MdvDateValue,
} from '@/index'
import { datePickerCopy } from './picker-copy'

const date = ref<MdvDateValue>('2026-11-14')
const range = ref<MdvDateRangeValue>({
  start: '2026-11-18',
  end: '2026-11-20',
})
const layout = ref<MdvDatePickerLayout>('auto')
const initialView = ref<MdvDatePickerView>('calendar')
const locale = ref('zh-CN')
const min = ref('2026-01-01')
const max = ref('2027-12-31')
const disabled = ref(false)
const readonly = ref(false)
const required = ref(false)
const clearable = ref(true)
const allDisabled = ref(false)
const rtl = ref(false)
const dark = ref(false)
const large = ref(false)
const narrow = ref(false)
const logs = ref<string[]>([])
const dockedDate = ref<MdvDateValue>('2026-11-14')
const modalDate = ref<MdvDateValue>('2026-11-14')
const fullscreenDate = ref<MdvDateValue>('2026-11-14')
const inputDate = ref<MdvDateValue>('2000-02-29')
const controlledDate = ref<MdvDateValue>('2026-11-14')
const controlledOpen = ref(false)
const rejectValue = ref(true)
const rejectOpen = ref(false)
const rejectClose = ref(false)
const formDate = ref<MdvDateValue>('2026-11-14')
const formRange = ref<MdvDateRangeValue>({
  start: '2026-11-18',
  end: '2026-11-20',
})
const formId = `date-preview-form-${useId()}`
const formOutput = ref('尚未提交')
const dialogOpen = ref(false)
const dialogDate = ref<MdvDateValue>('2026-11-14')
const customDate = ref<MdvDateValue>('2026-11-14')
function disabledDate(value: string) {
  return allDisabled.value || value === '2026-11-16'
}
function log(message: string) {
  logs.value = [message, ...logs.value].slice(0, 8)
}
function updateValue(value: MdvDateValue) {
  log(`请求日期 ${value ?? 'null'}${rejectValue.value ? '（拒绝）' : ''}`)
  if (!rejectValue.value) controlledDate.value = value
}
function updateOpen(value: boolean) {
  const reject = value ? rejectOpen.value : rejectClose.value
  log(`请求${value ? '打开' : '关闭'}${reject ? '（拒绝）' : ''}`)
  if (!reject) controlledOpen.value = value
}
function submit(event: SubmitEvent) {
  event.preventDefault()
  formOutput.value = JSON.stringify(
    Object.fromEntries(new FormData(event.target as HTMLFormElement)),
    null,
    2,
  )
}
</script>

<template>
  <div class="space-y-8">
    <p>
      对照
      <a
        class="text-mdv-primary underline"
        href="https://m3.material.io/components/date-pickers/specs"
        target="_blank"
        rel="noreferrer"
        >Material 3 Date pickers</a
      >。点击日历图标打开；日历选择先修改草稿，确定后写回模型。
    </p>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">布局、约束与文本输入</h2>
      <div class="flex flex-wrap gap-4">
        <label
          >布局
          <select v-model="layout" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>auto</option>
            <option>docked</option>
            <option>modal</option>
            <option>fullscreen</option>
          </select></label
        >
        <label
          >初始视图
          <select
            v-model="initialView"
            class="rounded border border-mdv-outline bg-mdv-surface p-2"
          >
            <option>calendar</option>
            <option>input</option>
          </select></label
        >
        <label
          >日期格式
          <select v-model="locale" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>zh-CN</option>
            <option>en-US</option>
            <option>en-GB</option>
            <option>de-DE</option>
            <option>ar-EG</option>
          </select></label
        >
        <MdvTextField v-model="min" label="最早日期（ISO）" />
        <MdvTextField v-model="max" label="最晚日期（ISO）" />
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="disabled" label="禁用" />
        <MdvCheckbox v-model="readonly" label="只读" />
        <MdvCheckbox v-model="required" label="必填" />
        <MdvCheckbox v-model="clearable" label="允许清除" />
        <MdvCheckbox v-model="allDisabled" label="全部日期禁用" />
        <MdvCheckbox v-model="rtl" label="RTL" />
        <MdvCheckbox v-model="dark" label="局部深色" />
        <MdvCheckbox v-model="large" label="两倍文字" />
        <MdvCheckbox v-model="narrow" label="窄容器" />
      </div>
      <div
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
        class="space-y-6 rounded-mdv-large bg-mdv-surface p-4 text-mdv-on-surface"
        :style="{ maxWidth: narrow ? '300px' : undefined, zoom: large ? 2 : 1 }"
      >
        <MdvDatePicker
          :labels="datePickerCopy"
          v-model="date"
          :layout="layout"
          :initial-view="initialView"
          :locale="locale"
          :min="min || undefined"
          :max="max || undefined"
          :disabled-date="disabledDate"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :clearable="clearable"
          label="预约日期"
          @confirm="log(`确认单日 ${$event}`)"
          @cancel="log(`取消：${$event.reason}`)"
          @close="log(`关闭：${$event.reason}`)"
        />
        <p>
          已提交：<code>{{ date }}</code>
        </p>
        <MdvDateRangePicker
          :labels="datePickerCopy"
          v-model="range"
          :layout="layout === 'docked' ? 'auto' : layout"
          :initial-view="initialView"
          :locale="locale"
          :min="min || undefined"
          :max="max || undefined"
          :disabled-date="disabledDate"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :clearable="clearable"
          start-label="入住日期"
          end-label="离店日期"
          @confirm="log(`确认范围 ${JSON.stringify($event)}`)"
        />
        <p>
          已提交：<code>{{ range }}</code>
        </p>
      </div>
      <p>
        11 月 16 日不可选，尝试跨越它的范围，应禁止保存。同日范围允许；文本倒序报错。auto 在小于
        600px 的窗口使用全屏形态。
      </p>
      <p>
        可输入 ISO 日期，或按所选地区顺序使用
        /、-、.、空格分隔。Enter／离开字段后提交；无效文本会保留原文。日历中方向键移动，PageUp／PageDown
        翻月，Shift 组合翻年。
      </p>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">官方形态</h2>
      <div class="flex flex-wrap gap-6">
        <MdvDatePicker
          :labels="datePickerCopy"
          v-model="dockedDate"
          layout="docked"
          label="Docked 单日"
        />
        <MdvDatePicker
          :labels="datePickerCopy"
          v-model="modalDate"
          layout="modal"
          label="Modal 单日"
        />
        <MdvDatePicker
          :labels="datePickerCopy"
          v-model="fullscreenDate"
          layout="fullscreen"
          label="全屏单日"
        />
        <MdvDatePicker
          :labels="datePickerCopy"
          v-model="inputDate"
          layout="modal"
          initial-view="input"
          label="输入出生日期"
          locale="en-GB"
        />
      </div>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">父级控制与拒绝更新</h2>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="rejectValue" label="拒绝日期更新" /><MdvCheckbox
          v-model="rejectOpen"
          label="拒绝打开"
        /><MdvCheckbox v-model="rejectClose" label="拒绝关闭" />
      </div>
      <MdvDatePicker
        :labels="datePickerCopy"
        :model-value="controlledDate"
        :open="controlledOpen"
        label="受控日期"
        @update:model-value="updateValue"
        @update:open="updateOpen"
        @confirm="log(`父级接受并确认 ${$event}`)"
      />
      <p>父级值：{{ controlledDate }}；打开：{{ controlledOpen }}</p>
      <ol aria-live="polite" class="space-y-1 text-mdv-body-small">
        <li v-for="(message, index) in logs" :key="index">{{ message }}</li>
      </ol>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">原生表单与外部 form 关联</h2>
      <form :id="formId" class="space-y-4" @submit="submit">
        <MdvDatePicker
          :labels="datePickerCopy"
          v-model="formDate"
          name="appointment"
          required
          clearable
          label="必填预约日期"
        />
        <div class="flex gap-3">
          <MdvButton type="submit">读取 FormData</MdvButton
          ><MdvButton type="reset" variant="outlined">重置</MdvButton>
        </div>
      </form>
      <MdvDateRangePicker
        :labels="datePickerCopy"
        v-model="formRange"
        :form="formId"
        start-name="arrival"
        end-name="departure"
        required
        clearable
      />
      <pre class="overflow-auto rounded bg-mdv-surface-container p-3">{{ formOutput }}</pre>
      <p>FormData 的日期应为 YYYY-MM-DD；输入框的本地化显示不会重复提交。</p>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">自定义入口、长标签与 Dialog 组合</h2>
      <MdvDatePicker
        v-model="customDate"
        label="为跨地区团队安排一次较长的会议日期"
        :labels="{
          ...datePickerCopy,
          title: '为跨地区团队选择一个会议日期',
          confirm: '确认会议日期',
        }"
      >
        <template #trigger="{ triggerProps }"
          ><button v-bind="triggerProps" class="min-h-12 min-w-12 rounded-full text-mdv-primary">
            选择
          </button></template
        >
      </MdvDatePicker>
      <div>
        <MdvButton @click="dialogOpen = true">在 Dialog 中选择日期</MdvButton>
      </div>
      <MdvDialog v-model="dialogOpen" title="日程设置">
        <div class="space-y-4">
          <MdvDatePicker
            :labels="datePickerCopy"
            v-model="dialogDate"
            layout="docked"
            label="非模态日期浮层"
          /><MdvDatePicker
            :labels="datePickerCopy"
            v-model="dialogDate"
            layout="modal"
            label="嵌套模态日期选择"
          /><button type="button" class="min-h-12 px-4">后续操作</button>
        </div>
        <template #actions
          ><MdvButton variant="text" @click="dialogOpen = false">关闭日程设置</MdvButton></template
        >
      </MdvDialog>
    </section>
  </div>
</template>
