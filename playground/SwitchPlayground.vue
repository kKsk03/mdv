<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import check from '@iconify-icons/material-symbols/check'
import close from '@iconify-icons/material-symbols/close'
import { MdvButton, MdvIcon, MdvSwitch } from '@/index'
import type { MdvSwitchColor } from '@/index'

const enabled = ref(false)
const startLabel = ref(true)
const notifications = ref(true)
const selectedIconOnly = ref(false)
const plain = ref(true)
const sync = ref(false)
const disabled = ref(false)
const businessError = ref(true)
const customSeed = ref('#006c4c')
const colorValue = ref(true)
const submitted = ref('尚未提交。')
const methodSwitch = useTemplateRef<InstanceType<typeof MdvSwitch>>('methodSwitch')
const methodMessage = ref('')

const colors: MdvSwitchColor[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'error',
  'info',
  '#006c4c',
]
const customColor = computed<MdvSwitchColor>(() =>
  /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(customSeed.value)
    ? (customSeed.value as MdvSwitchColor)
    : 'primary',
)

function submitForm(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement
  submitted.value = JSON.stringify([...new FormData(form).entries()], null, 2)
}

function reportValidity() {
  methodMessage.value = methodSwitch.value?.reportValidity() ? '校验通过' : '校验未通过'
}

function setServerError() {
  methodSwitch.value?.setCustomValidity('服务端暂时无法确认该设置。')
  reportValidity()
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="switch-basic-title" class="space-y-4">
      <div>
        <h2 id="switch-basic-title" class="text-mdv-title-large">标准外观与交互状态</h2>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          Switch 使用原生 checkbox 的二值语义；点击轨道、手柄或标签都可以切换，Tab
          聚焦后按空格切换。默认仅在开启时显示内置勾，无需提供图标插槽。
        </p>
      </div>
      <div class="flex flex-wrap items-start gap-x-8 gap-y-4">
        <MdvSwitch v-model="enabled" label="启用通知" supporting-text="接收重要提醒。" />
        <MdvSwitch v-model="startLabel" label="标签在前" label-position="start" />
        <MdvSwitch :model-value="true" label="禁用已启用" disabled />
        <MdvSwitch label="禁用未启用" disabled />
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        通知：{{ enabled ? '已启用' : '未启用' }}；标签位置演示：{{
          startLabel ? '在前' : '在后'
        }}。
      </p>
    </section>

    <section
      aria-labelledby="switch-icon-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <div>
        <h2 id="switch-icon-title" class="text-mdv-title-large">状态图标</h2>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          默认开启显示勾、关闭无图标；双状态示例通过插槽增加关闭时的叉，纯圆点示例通过空插槽隐藏默认勾。
        </p>
      </div>
      <div class="flex flex-wrap items-start gap-8">
        <MdvSwitch v-model="notifications" label="双状态图标：✓ / ×" color="secondary">
          <template #selected-icon><MdvIcon :icon="check" size="16" /></template>
          <template #unselected-icon><MdvIcon :icon="close" size="16" /></template>
        </MdvSwitch>
        <MdvSwitch v-model="selectedIconOnly" label="默认：仅开启显示 ✓" color="success" />
        <MdvSwitch v-model="plain" label="纯圆点">
          <template #selected-icon />
        </MdvSwitch>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        双状态：{{ notifications ? '开启，显示勾' : '关闭，显示叉' }}；仅开启图标：{{
          selectedIconOnly ? '开启，显示勾' : '关闭，无图标'
        }}；纯圆点：{{
          plain ? '开启' : '关闭'
        }}。图标表示开关状态，业务名称由标签说明；也可在插槽中使用其他图形。
      </p>
    </section>

    <section
      aria-labelledby="switch-color-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <div>
        <h2 id="switch-color-title" class="text-mdv-title-large">主题、语义色与种子色</h2>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          颜色只作用于当前 Switch；错误状态优先于自定义颜色，未选中状态保留中性色轨道。
        </p>
      </div>
      <div class="flex flex-wrap items-start gap-x-8 gap-y-3">
        <MdvSwitch
          v-for="color in colors"
          :key="color"
          v-model="colorValue"
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
        <MdvSwitch v-model="colorValue" :color="customColor" label="自定义种子色" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="mode in ['light', 'dark'] as const"
          :key="mode"
          :data-mdv-theme="mode"
          class="rounded-mdv-large bg-mdv-surface p-5 text-mdv-on-surface"
        >
          <p class="mb-3 text-mdv-label-large">{{ mode }}</p>
          <div class="grid gap-2 justify-items-start">
            <MdvSwitch v-model="enabled" label="普通状态" />
            <MdvSwitch v-model="enabled" label="错误状态" error error-text="请确认该设置。" />
            <MdvSwitch :model-value="true" label="禁用状态" disabled />
          </div>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="switch-form-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="switch-form-title" class="text-mdv-title-large">原生表单、校验与重置</h2>
      <MdvSwitch v-model="disabled" label="禁用下方 fieldset" />
      <form class="space-y-5" @submit.prevent="submitForm">
        <fieldset :disabled="disabled" class="min-w-0 space-y-3">
          <MdvSwitch
            ref="methodSwitch"
            v-model="sync"
            name="sync"
            value="enabled"
            label="自动同步"
            supporting-text="提交时会把开启状态写入 FormData。"
            error-text="请开启自动同步。"
            required
          />
          <div class="flex flex-wrap gap-3">
            <MdvButton type="submit">提交</MdvButton>
            <MdvButton type="reset" variant="outlined">原生重置</MdvButton>
          </div>
        </fieldset>
      </form>
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="outlined" @click="methodSwitch?.focus({ preventScroll: true })"
          >聚焦开关</MdvButton
        >
        <MdvButton variant="outlined" @click="reportValidity">报告原生校验</MdvButton>
        <MdvButton variant="outlined" @click="setServerError">设置自定义错误</MdvButton>
        <MdvButton variant="text" @click="methodSwitch?.setCustomValidity('')"
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

    <section
      aria-labelledby="switch-layout-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="switch-layout-title" class="text-mdv-title-large">长标签、RTL 与窄容器</h2>
      <div class="grid max-w-80 gap-4 rounded-mdv-large border border-mdv-outline-variant p-3">
        <MdvSwitch
          v-model="businessError"
          label="这是一个用于检查中文自动换行和点击区域完整性的长标签。"
          supporting-text="辅助文字同样允许自然换行。"
        />
        <MdvSwitch
          v-model="businessError"
          label="A long English label with LongUnbrokenIdentifierForLayoutVerification"
        />
        <MdvSwitch
          v-model="businessError"
          dir="rtl"
          label="خيار مع نص طويل لاختبار الاتجاه"
          supporting-text="说明与点击区域跟随 RTL。"
        />
      </div>
    </section>
  </div>
</template>
