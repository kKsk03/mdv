<script setup lang="ts">
import { ref } from 'vue'
import {
  MdvButton,
  MdvCheckbox,
  MdvDatePicker,
  MdvRadio,
  MdvRadioGroup,
  MdvSlider,
  MdvSwitch,
  MdvTextField,
  MdvTimePicker,
} from '@/index'
import type { MdvDateValue, MdvRadioModelValue, MdvSliderModelValue, MdvTimeValue } from '@/index'
import { datePickerCopy, timePickerCopy } from './picker-copy'

const emit = defineEmits<{ submitted: [entries: [string, string][]] }>()
const name = ref('周末旅行')
const email = ref('hello@example.com')
const date = ref<MdvDateValue>('2026-11-21')
const time = ref<MdvTimeValue>('09:30')
const transport = ref<MdvRadioModelValue>('train')
const guests = ref<MdvSliderModelValue>(2)
const reminder = ref(true)
const agreed = ref(false)
const disabled = ref(false)

function submit(event: SubmitEvent) {
  const form = event.currentTarget
  if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return
  emit(
    'submitted',
    [...new FormData(form)].map(([key, value]) => [key, String(value)]),
  )
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h3 class="text-mdv-title-large">创建出行计划</h3>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        填写后同意条款并提交；重置应恢复所有初始值。禁用整组字段后，提交结果应为空。
      </p>
    </div>
    <MdvCheckbox v-model="disabled" label="禁用表单字段" />
    <form class="space-y-6" @submit.prevent="submit">
      <fieldset :disabled="disabled" class="m-0 min-w-0 space-y-6 border-0 p-0">
        <legend class="sr-only">出行计划详情</legend>
        <MdvTextField v-model="name" name="title" label="计划名称" required full-width />
        <MdvTextField
          v-model="email"
          name="email"
          label="联系邮箱"
          type="email"
          required
          full-width
        />
        <div class="grid gap-5 sm:grid-cols-2">
          <MdvDatePicker
            :labels="datePickerCopy"
            v-model="date"
            name="date"
            label="出发日期"
            min="2026-11-01"
            max="2026-12-31"
            required
          />
          <MdvTimePicker
            :labels="timePickerCopy"
            v-model="time"
            name="time"
            label="出发时间"
            :minute-step="5"
            required
          />
        </div>
        <MdvRadioGroup v-model="transport" name="transport" label="出行方式" required>
          <MdvRadio value="train" label="火车" />
          <MdvRadio value="bus" label="巴士" />
        </MdvRadioGroup>
        <MdvSlider
          v-model="guests"
          name="guests"
          label="同行人数"
          :min="1"
          :max="6"
          :step="1"
          :value-indicator="true"
        />
        <MdvSwitch v-model="reminder" name="reminder" value="yes" label="接收出行提醒" />
        <MdvCheckbox
          v-model="agreed"
          name="terms"
          value="accepted"
          label="我已阅读并同意出行条款"
          required
        />
      </fieldset>
      <div class="flex flex-wrap gap-3">
        <MdvButton type="submit">提交并查看字段</MdvButton>
        <MdvButton type="reset" variant="outlined">重置表单</MdvButton>
      </div>
    </form>
  </div>
</template>
