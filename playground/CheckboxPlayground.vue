<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { MdvButton, MdvCheckbox } from '@/index'
import type { MdvCheckboxColor, MdvCheckboxModelValue, MdvCheckboxValue } from '@/index'

const basic = ref(false)
const mixed = ref(true)
const mixedChecked = ref(false)
const channels = ref<MdvCheckboxValue[]>(['email'])
const options = [
  { value: 'email', label: '邮件通知' },
  { value: 'sms', label: '短信通知' },
  { value: 'push', label: '应用内通知' },
]
const allSelected = computed(() => channels.value.length === options.length)
const partlySelected = computed(() => channels.value.length > 0 && !allSelected.value)
const colors: MdvCheckboxColor[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'error',
  'info',
  '#006c4c',
]
const colorChecks = ref<MdvCheckboxValue[]>([...colors])
const seed = ref('#6750a4')
const customColor = computed(() =>
  /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(seed.value) ? (seed.value as MdvCheckboxColor) : 'primary',
)
const colorValue = ref(true)
const businessError = ref(true)
const businessValue = ref(false)
const longValue = ref(false)
const rtlValue = ref(false)
const terms = ref(false)
const notifications = ref<MdvCheckboxValue[]>(['email'])
const disabledGroup = ref(false)
const external = ref(true)
const submitted = ref('先直接提交空表单，检查必选项的错误状态；重置恢复初始选择。')
const methodCheckbox = useTemplateRef<InstanceType<typeof MdvCheckbox>>('methodCheckbox')
const methodMessage = ref('')

function selectAll(value: MdvCheckboxModelValue) {
  channels.value = value === true ? options.map((option) => option.value) : []
}

function submitForm(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement
  submitted.value = JSON.stringify([...new FormData(form).entries()], null, 2)
}

function reportValidity() {
  methodMessage.value = methodCheckbox.value?.reportValidity() ? '校验通过' : '校验未通过'
}

function setServerError() {
  methodCheckbox.value?.setCustomValidity('服务端校验失败，请稍后重试。')
  reportValidity()
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="checkbox-basic-title" class="space-y-4">
      <h2 id="checkbox-basic-title" class="text-mdv-title-large">标准外观与三种状态</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        方框 18px、圆角 2px、状态层 40px、点击目标 48px。点击文字和方框周围都能切换； 用 Tab
        聚焦、空格切换，观察勾线、横线、涟漪和焦点环。
      </p>
      <div class="flex flex-wrap items-start gap-x-8 gap-y-4">
        <MdvCheckbox v-model="basic" label="普通选择" />
        <MdvCheckbox v-model="mixedChecked" v-model:indeterminate="mixed" label="初始为半选" />
        <MdvCheckbox :model-value="false" label="禁用未选中" disabled />
        <MdvCheckbox :model-value="true" label="禁用已选中" disabled />
        <MdvCheckbox label="禁用半选" indeterminate disabled />
        <MdvCheckbox v-model="basic" aria-label="只有图形的复选框" />
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        普通：{{ basic }} · 半选：{{ mixed }} · 半选项的底层选中值：{{ mixedChecked }}
      </p>
      <MdvButton variant="outlined" @click="mixed = true">重新设为半选</MdvButton>
    </section>

    <section
      aria-labelledby="checkbox-group-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="checkbox-group-title" class="text-mdv-title-large">数组多选与全选</h2>
      <fieldset class="min-w-0">
        <legend class="mb-2 text-mdv-label-large">接收通知的方式</legend>
        <MdvCheckbox
          :model-value="allSelected"
          :indeterminate="partlySelected"
          label="全选"
          supporting-text="部分选中时显示横线，点击半选父项选择全部。"
          @update:model-value="selectAll"
        />
        <div class="ms-6 mt-2 grid justify-items-start">
          <MdvCheckbox
            v-for="option in options"
            :key="option.value"
            v-model="channels"
            :value="option.value"
            :label="option.label"
          />
        </div>
      </fieldset>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">当前数组：{{ channels }}</p>
    </section>

    <section
      aria-labelledby="checkbox-colors-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="checkbox-colors-title" class="text-mdv-title-large">主题、预设与种子色</h2>
      <div class="flex flex-wrap gap-x-6 gap-y-3">
        <MdvCheckbox
          v-for="color in colors"
          :key="color"
          v-model="colorChecks"
          :value="color"
          :color="color"
          :label="color"
        />
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <label class="grid gap-2 text-mdv-label-large">
          局部种子色
          <input
            v-model="seed"
            class="playground-control w-40 font-mono"
            type="text"
            spellcheck="false"
          />
        </label>
        <MdvCheckbox v-model="colorValue" :color="customColor" label="自定义种子色" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="mode in ['light', 'dark'] as const"
          :key="mode"
          :data-mdv-theme="mode"
          class="rounded-mdv-large bg-mdv-surface p-5 text-mdv-on-surface"
        >
          <p class="mb-3 text-mdv-label-large">{{ mode }}</p>
          <div class="grid justify-items-start">
            <MdvCheckbox v-model="basic" label="主色与普通标签" />
            <MdvCheckbox v-model="mixedChecked" v-model:indeterminate="mixed" label="半选切换" />
            <MdvCheckbox v-model="colorValue" :color="customColor" label="局部种子色" />
            <MdvCheckbox label="错误状态" error error-text="请选择该项。" />
            <MdvCheckbox :model-value="true" label="禁用状态" error disabled />
          </div>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="checkbox-labels-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="checkbox-labels-title" class="text-mdv-title-large">标签、错误与窄容器</h2>
      <MdvCheckbox v-model="businessError" label="显示业务错误" />
      <MdvCheckbox
        v-model="businessValue"
        :error="businessError"
        color="success"
        label="业务选项"
        supporting-text="正常状态下显示辅助说明。"
        error-text="该选项暂不可用。错误态优先于 success 配色。"
      />
      <MdvCheckbox v-model="longValue">
        我已阅读
        <a
          href="https://m3.material.io/components/checkbox/overview"
          target="_blank"
          rel="noopener noreferrer"
          class="text-mdv-primary underline"
          >复选框说明</a
        >
        并同意该选项
      </MdvCheckbox>
      <div class="grid max-w-64 gap-4 rounded-mdv-large border border-mdv-outline-variant p-3">
        <MdvCheckbox
          v-model="longValue"
          label="这是一个用于检查中文自动换行和复选框首行对齐的长标签。"
          supporting-text="辅助文字同样允许自然换行。"
        />
        <MdvCheckbox
          v-model="longValue"
          label="A long English label with LongUnbrokenIdentifierForLayoutVerification"
        />
        <MdvCheckbox
          v-model="rtlValue"
          dir="rtl"
          label="خيار مع نص طويل لاختبار الاتجاه"
          supporting-text="说明与点击区域跟随 RTL。"
        />
      </div>
    </section>

    <section
      aria-labelledby="checkbox-form-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="checkbox-form-title" class="text-mdv-title-large">原生表单、校验与重置</h2>
      <MdvCheckbox v-model="disabledGroup" label="禁用下方 fieldset" />
      <form id="checkbox-example-form" class="space-y-5" @submit.prevent="submitForm">
        <fieldset :disabled="disabledGroup" class="min-w-0 space-y-3">
          <legend class="mb-3 text-mdv-label-large">表单选择</legend>
          <MdvCheckbox
            ref="methodCheckbox"
            v-model="terms"
            name="terms"
            value="accepted"
            label="同意服务条款"
            required
            supporting-text="本项必选；首次显示不自动报红。"
          />
          <fieldset class="min-w-0">
            <legend class="text-mdv-label-large">可选通知渠道</legend>
            <div class="flex flex-wrap gap-x-4">
              <MdvCheckbox v-model="notifications" name="channel" value="email" label="邮件" />
              <MdvCheckbox v-model="notifications" name="channel" value="sms" label="短信" />
            </div>
          </fieldset>
          <div class="flex flex-wrap gap-3">
            <MdvButton type="submit">提交</MdvButton>
            <MdvButton type="reset" variant="outlined">原生重置</MdvButton>
          </div>
        </fieldset>
      </form>
      <MdvCheckbox
        v-model="external"
        form="checkbox-example-form"
        name="external"
        value="yes"
        label="表单外的关联选项"
        supporting-text="仍参与上方表单提交与重置，初始为选中。"
      />
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="outlined" @click="methodCheckbox?.focus({ preventScroll: true })"
          >聚焦必选项</MdvButton
        >
        <MdvButton variant="outlined" @click="reportValidity">报告原生校验</MdvButton>
        <MdvButton variant="outlined" @click="setServerError">设置自定义错误</MdvButton>
        <MdvButton variant="text" @click="methodCheckbox?.setCustomValidity('')"
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
