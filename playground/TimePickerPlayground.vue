<script setup lang="ts">
import { ref, useId } from 'vue'
import { MdvButton, MdvCheckbox, MdvDialog, MdvTimePicker } from '@/index'
import type {
  MdvTimePickerHourCycle,
  MdvTimePickerOrientation,
  MdvTimePickerView,
  MdvTimeValue,
} from '@/index'
import { timePickerCopy } from './picker-copy'

const longTimePickerCopy = {
  ...timePickerCopy,
  title: '请选择适合您的预约时间 Select an appointment time',
  cancel: '取消本次选择',
  confirm: '确认预约时间',
}

const time = ref<MdvTimeValue>('13:05')
const view = ref<MdvTimePickerView>('auto')
const orientation = ref<MdvTimePickerOrientation>('auto')
const cycle = ref<MdvTimePickerHourCycle>('auto')
const locale = ref('zh-CN')
const step = ref(1)
const min = ref('08:00')
const max = ref('22:00')
const disabled = ref(false)
const readonly = ref(false)
const required = ref(false)
const allDisabled = ref(false)
const nightOnly = ref(false)
const dark = ref(false)
const rtl = ref(false)
const longLabels = ref(false)
const customTheme = ref(false)
const samples = ref<MdvTimeValue[]>(['09:30', '21:05', '00:00', '12:00'])
const rejectValue = ref(true)
const rejectOpen = ref(false)
const rejectClose = ref(false)
const controlledValue = ref<MdvTimeValue>('10:00')
const controlledOpen = ref(false)
const logs = ref<string[]>([])
const formTime = ref<MdvTimeValue>('09:00')
const formId = `time-preview-form-${useId()}`
const output = ref('尚未提交')
const dialogOpen = ref(false)
const nestedTime = ref<MdvTimeValue>('15:30')
const customTime = ref<MdvTimeValue>('18:00')
function disabledTime(value: string) {
  return (
    allDisabled.value ||
    (nightOnly.value ? value > '02:00' && value < '22:00' : value >= '12:00' && value < '13:00')
  )
}
function log(text: string) {
  logs.value = [text, ...logs.value].slice(0, 8)
}
function updateValue(value: MdvTimeValue) {
  log(`请求时间 ${value ?? 'null'}${rejectValue.value ? '（拒绝）' : ''}`)
  if (!rejectValue.value) controlledValue.value = value
}
function updateOpen(value: boolean) {
  const reject = value ? rejectOpen.value : rejectClose.value
  log(`请求${value ? '打开' : '关闭'}${reject ? '（拒绝）' : ''}`)
  if (!reject) controlledOpen.value = value
}
function submit(event: SubmitEvent) {
  event.preventDefault()
  output.value = JSON.stringify(
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
        href="https://m3.material.io/components/time-pickers/specs"
        target="_blank"
        rel="noreferrer"
        >Material 3 Time pickers</a
      >。选择先修改草稿，确定后提交；输入框本身支持直接编辑。
    </p>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">模式、布局与约束</h2>
      <div class="flex flex-wrap gap-4">
        <label
          >初始模式
          <select v-model="view" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>auto</option>
            <option>dial</option>
            <option>input</option>
          </select></label
        >
        <label
          >拨盘方向
          <select
            v-model="orientation"
            class="rounded border border-mdv-outline bg-mdv-surface p-2"
          >
            <option>auto</option>
            <option>vertical</option>
            <option>horizontal</option>
          </select></label
        >
        <label
          >小时制
          <select v-model="cycle" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>auto</option>
            <option>h12</option>
            <option>h23</option>
          </select></label
        >
        <label
          >格式
          <select v-model="locale" class="rounded border border-mdv-outline bg-mdv-surface p-2">
            <option>zh-CN</option>
            <option>en-US</option>
            <option>en-GB</option>
            <option>ar-EG</option>
            <option>fi-FI</option>
          </select></label
        >
        <label
          >分钟步长
          <select
            v-model.number="step"
            class="rounded border border-mdv-outline bg-mdv-surface p-2"
          >
            <option v-for="value in [1, 5, 10, 15, 30]" :key="value" :value="value">
              {{ value }}
            </option>
          </select></label
        >
        <label
          >最早
          <input v-model="min" class="w-24 rounded border border-mdv-outline bg-mdv-surface p-2"
        /></label>
        <label
          >最晚
          <input v-model="max" class="w-24 rounded border border-mdv-outline bg-mdv-surface p-2"
        /></label>
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="disabled" label="禁用" /><MdvCheckbox
          v-model="readonly"
          label="只读"
        /><MdvCheckbox v-model="required" label="必填" /><MdvCheckbox
          v-model="allDisabled"
          label="全部时间不可用"
        /><MdvCheckbox v-model="nightOnly" label="仅允许 22:00–02:00" /><MdvCheckbox
          v-model="dark"
          label="局部深色"
        /><MdvCheckbox v-model="rtl" label="RTL" /><MdvCheckbox
          v-model="longLabels"
          label="长文案"
        /><MdvCheckbox v-model="customTheme" label="自定义令牌" />
      </div>
      <div
        class="rounded-mdv-large bg-mdv-surface p-6 text-mdv-on-surface"
        :data-mdv-theme="dark ? 'dark' : 'light'"
        :dir="rtl ? 'rtl' : 'ltr'"
        :style="
          customTheme
            ? {
                '--mdv-sys-color-primary': '#00796b',
                '--mdv-sys-color-primary-container': '#b2dfdb',
                '--mdv-sys-color-on-primary-container': '#00251e',
              }
            : undefined
        "
      >
        <MdvTimePicker
          v-model="time"
          :initial-view="view"
          :orientation="orientation"
          :hour-cycle="cycle"
          :locale="locale"
          :minute-step="step"
          :min="nightOnly ? undefined : min"
          :max="nightOnly ? undefined : max"
          :disabled-time="disabledTime"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :labels="longLabels ? longTimePickerCopy : timePickerCopy"
          label="预约时间"
          clearable
          @confirm="log(`确认 ${$event}`)"
          @cancel="log(`取消 ${$event.reason}`)"
        />
      </div>
      <p>
        模型：{{ time ?? 'null' }}。默认禁止
        12:00–12:59；勾选跨午夜示例后改用禁用谓词。缩小窗口观察拨盘回退输入，草稿保持。
      </p>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">官方形态与 0 点／12 点</h2>
      <div class="flex flex-wrap gap-6">
        <MdvTimePicker
          :labels="timePickerCopy"
          v-model="samples[0]"
          initial-view="dial"
          hour-cycle="h12"
          orientation="vertical"
          locale="en-US"
          label="12 小时纵向拨盘"
        /><MdvTimePicker
          :labels="timePickerCopy"
          v-model="samples[1]"
          initial-view="dial"
          hour-cycle="h23"
          orientation="horizontal"
          label="24 小时横向双圈"
        /><MdvTimePicker
          :labels="timePickerCopy"
          v-model="samples[2]"
          initial-view="input"
          hour-cycle="h12"
          locale="en-US"
          label="午夜 12:00 AM"
        /><MdvTimePicker
          :labels="timePickerCopy"
          v-model="samples[3]"
          initial-view="input"
          hour-cycle="h12"
          locale="en-US"
          label="正午 12:00 PM"
        />
      </div>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">受控拒绝与生命周期</h2>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="rejectValue" label="拒绝模型更新" /><MdvCheckbox
          v-model="rejectOpen"
          label="拒绝打开"
        /><MdvCheckbox v-model="rejectClose" label="拒绝关闭" />
      </div>
      <MdvTimePicker
        :labels="timePickerCopy"
        :model-value="controlledValue"
        :open="controlledOpen"
        initial-view="input"
        label="受控时间"
        @update:model-value="updateValue"
        @update:open="updateOpen"
        @open="log('open')"
        @opened="log('opened')"
        @close="log(`close ${$event.reason}`)"
        @closed="log(`closed ${$event.reason}`)"
      />
      <pre class="overflow-auto text-mdv-body-small">{{ logs.join(String.fromCharCode(10)) }}</pre>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">表单、重置与外部关联</h2>
      <form :id="formId" class="space-y-4" @submit="submit">
        <MdvTimePicker
          :labels="timePickerCopy"
          v-model="formTime"
          name="appointment"
          label="必填预约时间"
          required
          clearable
          :minute-step="5"
        />
        <div class="flex gap-3">
          <MdvButton type="submit">提交</MdvButton
          ><MdvButton type="reset" variant="outlined">重置</MdvButton>
        </div>
      </form>
      <MdvTimePicker
        :labels="timePickerCopy"
        v-model="customTime"
        name="reminder"
        :form="formId"
        label="外部关联提醒时间"
      />
      <pre>{{ output }}</pre>
    </section>
    <section class="space-y-4 rounded-mdv-large border border-mdv-outline-variant p-4">
      <h2 class="text-mdv-title-large">自定义入口与 Dialog 组合</h2>
      <MdvTimePicker :labels="timePickerCopy" v-model="customTime" label="提醒时间"
        ><template #trigger="{ triggerProps }"
          ><button v-bind="triggerProps" class="rounded-full px-3 py-2 text-mdv-primary">
            选择
          </button></template
        ></MdvTimePicker
      ><MdvButton @click="dialogOpen = true">在对话框内选择时间</MdvButton
      ><MdvDialog v-model="dialogOpen" title="编辑预约"
        ><MdvTimePicker :labels="timePickerCopy" v-model="nestedTime" label="开始时间" /><template
          #actions="{ close }"
          ><MdvButton variant="text" @click="close()">关闭</MdvButton></template
        ></MdvDialog
      >
    </section>
  </div>
</template>
