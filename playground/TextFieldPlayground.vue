<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import mail from '@iconify-icons/material-symbols/mail-outline'
import person from '@iconify-icons/material-symbols/person-outline'
import search from '@iconify-icons/material-symbols/search'
import send from '@iconify-icons/material-symbols/send'
import { MdvButton, MdvIcon, MdvIconButton, MdvTextField } from '@/index'

const variants = ['outlined', 'filled'] as const
const modes = ['light', 'dark'] as const
const outlinedValue = ref('')
const filledValue = ref('')
const businessError = ref(true)
const searchValue = ref('Material Design 3')
const amount = ref('128.00')
const password = ref('mdv-demo-password')
const clearValue = ref('可以清除这段文字')
const notes = ref('第一行中文\nSecond line in English\n第三行内容\n第四行内容\n第五行内容')
const customActionValue = ref('')
const actionCount = ref(0)
const plainValue = ref('')
const trimValue = ref('')
const lazyValue = ref('')
const numericValue = ref<string | number>('')
const formName = ref('')
const formEmail = ref('')
const externalValue = ref('外部关联值')
const submitted = ref('还未提交。可先直接提交空表单，观察两种外观的原生校验。')
const disabledGroup = ref(false)
const programValue = ref('可以通过公开方法聚焦和选中')
const methodField = useTemplateRef<InstanceType<typeof MdvTextField>>('methodField')
const methodMessage = ref('')

function submitForm(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement
  submitted.value = JSON.stringify(Object.fromEntries(new FormData(form)), null, 2)
}

function checkField() {
  methodMessage.value = methodField.value?.reportValidity() ? '原生校验通过' : '原生校验未通过'
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="text-field-basic-title" class="space-y-5">
      <h2 id="text-field-basic-title" class="text-mdv-title-large">两种官方外观</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        默认 outlined。比较空值、聚焦、有内容、悬停和失焦时的标签与边线，单行容器高度为 56px。
      </p>
      <div class="flex flex-wrap items-start gap-6">
        <MdvTextField
          v-model="outlinedValue"
          label="描边文本框"
          placeholder="请输入内容"
          supporting-text="Outlined · 支持中文输入法"
          :maxlength="30"
        />
        <MdvTextField
          v-model="filledValue"
          variant="filled"
          label="填充文本框"
          placeholder="请输入内容"
          supporting-text="Filled · 支持中文输入法"
          :maxlength="30"
        />
      </div>
    </section>

    <section
      aria-labelledby="text-field-states-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="text-field-states-title" class="text-mdv-title-large">状态与错误</h2>
      <label class="flex items-center gap-2 text-mdv-label-large"
        ><input v-model="businessError" type="checkbox" />显示业务错误</label
      >
      <div v-for="variant in variants" :key="variant" class="space-y-4">
        <h3 class="text-mdv-title-medium">{{ variant }}</h3>
        <div class="flex flex-wrap items-start gap-6">
          <MdvTextField
            :variant="variant"
            label="已有内容"
            model-value="Material Design 3"
            supporting-text="失焦后标签仍浮动"
          />
          <MdvTextField
            :variant="variant"
            label="必填字段"
            required
            supporting-text="首次展示不自动标红"
          />
          <MdvTextField :variant="variant" label="只读" model-value="允许聚焦、复制" readonly />
          <MdvTextField :variant="variant" label="禁用" model-value="不参与表单提交" disabled />
          <MdvTextField
            :variant="variant"
            label="账号名称"
            model-value="already-used"
            :error="businessError"
            error-text="该名称已被使用，请更换。"
            supporting-text="名称可供其他人查看。"
          />
        </div>
      </div>
    </section>

    <section
      aria-labelledby="text-field-content-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="text-field-content-title" class="text-mdv-title-large">图标、前后缀与尾部操作</h2>
      <div class="flex flex-wrap items-start gap-6">
        <MdvTextField v-model="searchValue" label="搜索" type="search" clearable>
          <template #leading><MdvIcon :icon="search" /></template>
        </MdvTextField>
        <MdvTextField
          v-model="amount"
          label="金额"
          prefix-text="￥"
          suffix-text="元"
          inputmode="decimal"
          supporting-text="提交的值不包含前后缀"
        />
        <MdvTextField variant="filled" label="邮箱" type="email" placeholder="name@example.com">
          <template #leading><MdvIcon :icon="mail" /></template>
        </MdvTextField>
        <MdvTextField
          v-model="customActionValue"
          label="发送消息"
          clearable
          supporting-text="自定义 trailing 接管尾部"
        >
          <template #leading><MdvIcon :icon="person" /></template>
          <template #trailing>
            <MdvIconButton variant="standard" aria-label="发送消息" @click="actionCount++"
              ><MdvIcon :icon="send"
            /></MdvIconButton>
          </template>
        </MdvTextField>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        尾部自定义动作次数：{{ actionCount }}
      </p>
    </section>

    <section
      aria-labelledby="text-field-actions-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="text-field-actions-title" class="text-mdv-title-large">清除、密码与多行</h2>
      <div class="flex flex-wrap items-start gap-6">
        <MdvTextField
          v-model="clearValue"
          label="可清除"
          clearable
          supporting-text="清空后焦点回到输入框"
        />
        <MdvTextField
          v-model="password"
          label="密码"
          type="password"
          password-toggle
          clearable
          autocomplete="new-password"
          supporting-text="选中部分文字，再切换显隐检查光标"
          style="width: 340px"
        />
        <MdvTextField
          v-model="notes"
          label="多行备注"
          multiline
          :rows="3"
          :maxlength="120"
          clearable
          supporting-text="拖动右下角；聚焦前后手柄应在边线内侧，内容位置保持稳定"
        >
          <template #leading><MdvIcon :icon="person" /></template>
        </MdvTextField>
        <MdvTextField
          variant="filled"
          label="填充多行"
          multiline
          :rows="3"
          model-value="长内容可以滚动。&#10;第二行&#10;第三行&#10;第四行&#10;第五行"
          clearable
          supporting-text="滚动条从边框顶部开始，底部与缩放手柄分离"
        >
          <template #leading><MdvIcon :icon="person" /></template>
        </MdvTextField>
        <MdvTextField
          v-for="variant in ['outlined', 'filled'] as const"
          :key="`multiline-without-actions-${variant}`"
          :variant="variant"
          label="多行：无尾部操作"
          multiline
          :rows="3"
          model-value="长内容可以滚动。&#10;第二行&#10;第三行&#10;第四行&#10;第五行"
          supporting-text="滚动条应与带清除按钮的输入框一样贴近右边"
        />
        <MdvTextField
          label="多行前后缀"
          multiline
          prefix-text="["
          suffix-text="]"
          model-value="第一行内容&#10;第二行内容"
          supporting-text="缩放后前后缀不进入输入值，辅助文字留在框外"
        />
      </div>
    </section>

    <section
      aria-labelledby="text-field-model-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="text-field-model-title" class="text-mdv-title-large">值绑定与修饰符</h2>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="min-w-0 space-y-2">
          <MdvTextField v-model="plainValue" label="普通输入与中文输入法" full-width />
          <p class="break-all text-mdv-body-small">值：{{ JSON.stringify(plainValue) }}</p>
        </div>
        <div class="min-w-0 space-y-2">
          <MdvTextField
            v-model.trim="trimValue"
            label=".trim"
            full-width
            supporting-text="首尾空格不进入绑定值"
          />
          <p class="break-all text-mdv-body-small">值：{{ JSON.stringify(trimValue) }}</p>
        </div>
        <div class="min-w-0 space-y-2">
          <MdvTextField
            v-model.lazy="lazyValue"
            label=".lazy"
            full-width
            supporting-text="失焦或原生 change 时同步"
          />
          <p class="break-all text-mdv-body-small">值：{{ JSON.stringify(lazyValue) }}</p>
        </div>
        <div class="min-w-0 space-y-2">
          <MdvTextField
            v-model.number="numericValue"
            label=".number"
            type="number"
            step="any"
            full-width
            clearable
          />
          <p class="break-all text-mdv-body-small">
            值：{{ JSON.stringify(numericValue) }} · 类型：{{ typeof numericValue }}
          </p>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="text-field-form-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="text-field-form-title" class="text-mdv-title-large">原生表单、验证与重置</h2>
      <form
        id="mdv-text-field-example-form"
        class="space-y-5"
        @submit.prevent="submitForm"
        @reset="submitted = '已重置到各字段初始值。'"
      >
        <fieldset class="space-y-5" :disabled="disabledGroup">
          <legend class="mb-4 text-mdv-body-medium">
            直接提交空表单，移开鼠标后错误边线也应保持红色；也可禁用整个字段组。
          </legend>
          <div class="flex flex-wrap items-start gap-6">
            <MdvTextField
              v-model="formName"
              label="姓名"
              name="name"
              autocomplete="name"
              required
              :maxlength="20"
            />
            <MdvTextField
              v-model="formEmail"
              variant="filled"
              label="邮箱"
              name="email"
              type="email"
              autocomplete="email"
              required
              supporting-text="提交时执行原生必填／格式校验"
            />
          </div>
        </fieldset>
        <div class="flex flex-wrap gap-3">
          <MdvButton type="submit">提交表单</MdvButton>
          <MdvButton type="reset" variant="outlined">重置表单</MdvButton>
        </div>
      </form>
      <MdvTextField
        v-model="externalValue"
        label="表单外的字段"
        name="external"
        form="mdv-text-field-example-form"
        supporting-text="通过 form 归属同一表单，参与提交与重置"
      />
      <label class="flex items-center gap-2 text-mdv-label-large"
        ><input v-model="disabledGroup" type="checkbox" />禁用表单内的字段组</label
      >
      <pre
        class="overflow-x-auto rounded-mdv-medium bg-mdv-surface-container p-4 text-mdv-body-small"
        aria-live="polite"
        >{{ submitted }}</pre>
    </section>

    <section
      aria-labelledby="text-field-boundary-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="text-field-boundary-title" class="text-mdv-title-large">宽度、长标签与主题</h2>
      <div class="grid min-w-0 gap-6 sm:grid-cols-2">
        <div class="min-w-0 space-y-5 rounded-mdv-medium border border-mdv-outline-variant p-4">
          <MdvTextField
            label="这是一个很长的中文标签，用于检查窄容器中的省略行为"
            model-value="LongEnglishValueWithoutSpaces0123456789"
            full-width
            supporting-text="辅助文字可以换行：中文说明与 LongEnglishWordsWithoutSpaces 都应留在容器中。"
            :maxlength="80"
          />
          <MdvTextField label="200px 宽度" placeholder="占位文字" style="width: 200px" />
          <MdvTextField
            aria-label="没有可见标签的输入框"
            placeholder="无标签，但有 ARIA 名称"
            full-width
          />
        </div>
        <div
          dir="rtl"
          class="min-w-0 space-y-5 rounded-mdv-medium border border-mdv-outline-variant p-4"
        >
          <MdvTextField
            label="الاسم"
            placeholder="أدخل الاسم"
            supporting-text="RTL · 图标、标签及前后缀跟随方向"
            full-width
            ><template #leading><MdvIcon :icon="person" /></template
          ></MdvTextField>
          <MdvTextField
            label="السعر"
            model-value="128"
            prefix-text="$"
            suffix-text="USD"
            variant="filled"
            full-width
          />
        </div>
        <div
          v-for="mode in modes"
          :key="mode"
          :data-mdv-theme="mode"
          class="min-w-0 space-y-5 rounded-mdv-medium bg-mdv-surface-container p-5 text-mdv-on-surface"
        >
          <h3 class="text-mdv-title-medium">{{ mode }}</h3>
          <MdvTextField label="局部主题描边" model-value="透明背景与真实缺口" full-width />
          <MdvTextField
            label="局部主题填充"
            variant="filled"
            supporting-text="颜色角色随当前作用域切换"
            full-width
          />
        </div>
      </div>
    </section>

    <section
      aria-labelledby="text-field-method-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="text-field-method-title" class="text-mdv-title-large">程序赋值与公开方法</h2>
      <MdvTextField
        ref="methodField"
        v-model="programValue"
        label="方法验证"
        clearable
        required
        full-width
      />
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="tonal" @click="methodField?.focus()">聚焦</MdvButton>
        <MdvButton variant="tonal" @click="methodField?.select()">选中文字</MdvButton>
        <MdvButton variant="tonal" @click="programValue = '程序写入新值'">程序赋值</MdvButton>
        <MdvButton variant="outlined" @click="programValue = ''">程序清空</MdvButton>
        <MdvButton variant="outlined" @click="checkField">主动校验</MdvButton>
      </div>
      <p class="text-mdv-body-small" aria-live="polite">{{ methodMessage }}</p>
    </section>
  </div>
</template>
