<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { MdvButton, MdvRadio, MdvRadioGroup } from '@/index'
import type { MdvRadioColor, MdvRadioModelValue, MdvRadioValue } from '@/index'

const plan = ref<MdvRadioModelValue>('basic')
const horizontal = ref<MdvRadioModelValue>('email')
const customSeed = ref('#6750a4')
const colors: MdvRadioColor[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'error',
  'info',
  '#006c4c',
]
const colorValue = ref<MdvRadioModelValue>('primary')
const customColor = computed<MdvRadioColor>(() =>
  /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(customSeed.value)
    ? (customSeed.value as MdvRadioColor)
    : 'primary',
)
const formValue = ref<MdvRadioModelValue>(null)
const disabledGroup = ref(false)
const submitted = ref('还没有提交。')
const methodGroup = useTemplateRef<InstanceType<typeof MdvRadioGroup>>('methodGroup')
const methodMessage = ref('')

const options: Array<{ value: MdvRadioValue; label: string }> = [
  { value: 'basic', label: '基础版' },
  { value: 'pro', label: '专业版' },
  { value: 'enterprise', label: '企业版' },
]

function submitForm(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement
  submitted.value = JSON.stringify([...new FormData(form).entries()], null, 2)
}

function reportValidity() {
  methodMessage.value = methodGroup.value?.reportValidity() ? '校验通过' : '校验未通过'
}

function setServerError() {
  methodGroup.value?.setCustomValidity('服务端暂时无法确认该选择。')
  reportValidity()
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="radio-basic-title" class="space-y-4">
      <h2 id="radio-basic-title" class="text-mdv-title-large">标准外观与组内互斥</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        Radio 使用单一标量模型。用 Tab 进入当前选项，再用方向键移动、选择并跳过禁用项。
      </p>
      <div class="grid gap-6 sm:grid-cols-2">
        <MdvRadioGroup v-model="plan" label="套餐" supporting-text="请选择一个套餐。">
          <MdvRadio
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </MdvRadioGroup>
        <MdvRadioGroup v-model="horizontal" orientation="horizontal" label="通知方式">
          <MdvRadio value="email" label="邮件" />
          <MdvRadio value="sms" label="短信" />
          <MdvRadio value="push" label="应用内" />
        </MdvRadioGroup>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        套餐：{{ plan }} · 通知：{{ horizontal }}
      </p>
    </section>

    <section
      aria-labelledby="radio-state-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="radio-state-title" class="text-mdv-title-large">禁用与标签内容</h2>
      <div class="flex flex-wrap items-start gap-6">
        <MdvRadioGroup model-value="pro" label="禁用整组" disabled>
          <MdvRadio value="basic" label="基础版" />
          <MdvRadio value="pro" label="专业版" />
        </MdvRadioGroup>
        <MdvRadioGroup v-model="plan" label="禁用单项">
          <MdvRadio value="basic" label="基础版" />
          <MdvRadio value="pro" label="专业版（暂不可用）" disabled />
          <MdvRadio value="enterprise">
            企业版
            <span class="text-mdv-body-small text-mdv-on-surface-variant">（含专属支持）</span>
          </MdvRadio>
        </MdvRadioGroup>
      </div>
      <label class="flex items-center gap-3 text-mdv-label-large">
        <input v-model="disabledGroup" type="checkbox" /> 禁用下面的 fieldset
      </label>
    </section>

    <section
      aria-labelledby="radio-color-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="radio-color-title" class="text-mdv-title-large">主题、语义色与种子色</h2>
      <div class="flex flex-wrap items-start gap-x-6 gap-y-3">
        <MdvRadio
          v-for="color in colors"
          :key="color"
          v-model="colorValue"
          :value="color"
          :color="color"
          :label="color"
        />
      </div>
      <div class="flex flex-wrap items-end gap-4">
        <label class="grid gap-2 text-mdv-label-large">
          局部种子色
          <input
            v-model="customSeed"
            class="playground-control w-40 font-mono"
            type="text"
            spellcheck="false"
          />
        </label>
        <MdvRadio v-model="colorValue" value="custom" :color="customColor" label="自定义种子色" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="mode in ['light', 'dark'] as const"
          :key="mode"
          :data-mdv-theme="mode"
          class="rounded-mdv-large bg-mdv-surface p-5 text-mdv-on-surface"
        >
          <p class="mb-3 text-mdv-label-large">{{ mode }}</p>
          <MdvRadioGroup v-model="plan" label="主题中的选择">
            <MdvRadio value="basic" label="普通状态" />
            <MdvRadio value="pro" label="错误状态" error />
            <MdvRadio value="enterprise" label="禁用状态" disabled />
          </MdvRadioGroup>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="radio-form-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="radio-form-title" class="text-mdv-title-large">原生表单、校验与重置</h2>
      <form class="space-y-5" :class="{ 'opacity-60': disabledGroup }" @submit.prevent="submitForm">
        <fieldset :disabled="disabledGroup" class="min-w-0 space-y-3">
          <MdvRadioGroup
            ref="methodGroup"
            v-model="formValue"
            name="delivery"
            label="配送方式"
            supporting-text="提交空表单会显示必选错误。"
            error-text="请选择配送方式。"
            required
          >
            <MdvRadio value="standard" label="标准配送" />
            <MdvRadio value="express" label="加急配送" />
          </MdvRadioGroup>
          <div class="flex flex-wrap gap-3">
            <MdvButton type="submit">提交</MdvButton>
            <MdvButton type="reset" variant="outlined">原生重置</MdvButton>
          </div>
        </fieldset>
      </form>
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="outlined" @click="methodGroup?.focus({ preventScroll: true })"
          >聚焦选项</MdvButton
        >
        <MdvButton variant="outlined" @click="reportValidity">报告原生校验</MdvButton>
        <MdvButton variant="outlined" @click="setServerError">设置自定义错误</MdvButton>
        <MdvButton variant="text" @click="methodGroup?.setCustomValidity('')"
          >清除自定义错误</MdvButton
        >
      </div>
      <p role="status" class="text-mdv-body-small text-mdv-on-surface-variant">
        {{ methodMessage }}
      </p>
      <pre
        class="overflow-auto rounded-mdv-medium bg-mdv-surface-container p-4 text-mdv-body-small"
        >{{ submitted }}</pre>
    </section>
  </div>
</template>
