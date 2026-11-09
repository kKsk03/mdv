<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import viewList from '@iconify-icons/material-symbols/view-list-outline'
import gridView from '@iconify-icons/material-symbols/grid-view-outline'
import calendar from '@iconify-icons/material-symbols/calendar-month-outline'
import bold from '@iconify-icons/material-symbols/format-bold'
import italic from '@iconify-icons/material-symbols/format-italic'
import underlined from '@iconify-icons/material-symbols/format-underlined'
import doneAll from '@iconify-icons/material-symbols/done-all'
import { MdvButton, MdvIcon, MdvSegmentedButton, MdvSegmentedButtonItem } from '@/index'
import type { MdvSegmentedButtonDensity, MdvSegmentedButtonModelValue } from '@/index'

const single = ref<MdvSegmentedButtonModelValue>('week')
const optional = ref<MdvSegmentedButtonModelValue>('all')
const multiple = ref<MdvSegmentedButtonModelValue>(['bold'])
const requiredMultiple = ref<MdvSegmentedButtonModelValue>(['a'])
const view = ref<MdvSegmentedButtonModelValue>('list')
const iconOnly = ref<MdvSegmentedButtonModelValue>('list')
const customCheck = ref<MdvSegmentedButtonModelValue>('a')
const hiddenCheck = ref<MdvSegmentedButtonModelValue>('a')
const typed = ref<MdvSegmentedButtonModelValue>(1)
const disabled = ref(false)
const fieldsetDisabled = ref(true)
const densities: MdvSegmentedButtonDensity[] = [0, -1, -2, -3]
const densityValue = ref<MdvSegmentedButtonModelValue>('a')
const formValue = ref<MdvSegmentedButtonModelValue>('list')
const formOptions = ref<MdvSegmentedButtonModelValue>(['a'])
const submitted = ref('尚未提交。')
const externalValue = ref<MdvSegmentedButtonModelValue>('a')
const externalSubmitted = ref('尚未提交。')
const items = ref(['a', 'b', 'c'])
const dynamic = ref<MdvSegmentedButtonModelValue>('a')
const methodGroup = useTemplateRef<InstanceType<typeof MdvSegmentedButton>>('methodGroup')
const clickCount = ref(0)
const inputCount = ref(0)
const changeCount = ref(0)

function submit(event: SubmitEvent) {
  submitted.value = JSON.stringify(
    [...new FormData(event.currentTarget as HTMLFormElement)],
    null,
    2,
  )
}
function submitExternal(event: SubmitEvent) {
  externalSubmitted.value = JSON.stringify(
    [...new FormData(event.currentTarget as HTMLFormElement)],
    null,
    2,
  )
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="segmented-basic-title" class="space-y-4">
      <h2 id="segmented-basic-title" class="text-mdv-title-large">标准单选与多选</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        可见高度 40px、描边 1px，分段等宽、外端全圆角。单选默认保留最后一项；多选默认允许清空。
      </p>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <p id="segmented-period" class="text-mdv-label-large">时间范围（单选）</p>
          <MdvSegmentedButton v-model="single" aria-labelledby="segmented-period">
            <MdvSegmentedButtonItem value="day" label="日" />
            <MdvSegmentedButtonItem value="week" label="周" />
            <MdvSegmentedButtonItem value="month" label="月" />
          </MdvSegmentedButton>
          <p class="text-mdv-body-small text-mdv-on-surface-variant">
            当前：{{ JSON.stringify(single) }}
          </p>
        </div>
        <div class="space-y-2">
          <p id="segmented-optional" class="text-mdv-label-large">允许取消的单选</p>
          <MdvSegmentedButton
            v-model="optional"
            :selection-required="false"
            aria-labelledby="segmented-optional"
          >
            <MdvSegmentedButtonItem value="all" label="全部" />
            <MdvSegmentedButtonItem value="unread" label="未读" />
            <MdvSegmentedButtonItem value="saved" label="收藏" />
          </MdvSegmentedButton>
          <p class="text-mdv-body-small text-mdv-on-surface-variant">
            再次点击选中项：{{ JSON.stringify(optional) }}
          </p>
        </div>
        <div class="space-y-2">
          <p id="segmented-format" class="text-mdv-label-large">文字格式（多选）</p>
          <MdvSegmentedButton
            v-model="multiple"
            selection="multiple"
            aria-labelledby="segmented-format"
          >
            <MdvSegmentedButtonItem value="bold" label="粗体"
              ><template #leading><MdvIcon :icon="bold" /></template
            ></MdvSegmentedButtonItem>
            <MdvSegmentedButtonItem value="italic" label="斜体"
              ><template #leading><MdvIcon :icon="italic" /></template
            ></MdvSegmentedButtonItem>
            <MdvSegmentedButtonItem value="underline" label="下划线"
              ><template #leading><MdvIcon :icon="underlined" /></template
            ></MdvSegmentedButtonItem>
          </MdvSegmentedButton>
          <p class="text-mdv-body-small text-mdv-on-surface-variant">
            当前：{{ JSON.stringify(multiple) }}
          </p>
        </div>
        <div class="space-y-2">
          <p id="segmented-required" class="text-mdv-label-large">至少保留一个（多选）</p>
          <MdvSegmentedButton
            v-model="requiredMultiple"
            selection="multiple"
            selection-required
            aria-labelledby="segmented-required"
          >
            <MdvSegmentedButtonItem value="a" label="设计" />
            <MdvSegmentedButtonItem value="b" label="开发" />
            <MdvSegmentedButtonItem value="c" label="验证" />
          </MdvSegmentedButton>
          <p class="text-mdv-body-small text-mdv-on-surface-variant">
            当前：{{ JSON.stringify(requiredMultiple) }}
          </p>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="segmented-icons-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="segmented-icons-title" class="text-mdv-title-large">图标与稳定宽度</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        图文项选中后将前置图标替换为勾；纯图标项保留原图形并增加勾。连续切换时检查整组及每段宽度。
      </p>
      <div class="flex flex-wrap items-center gap-6">
        <MdvSegmentedButton v-model="view" aria-label="内容视图">
          <MdvSegmentedButtonItem value="list" label="列表"
            ><template #leading><MdvIcon :icon="viewList" /></template
          ></MdvSegmentedButtonItem>
          <MdvSegmentedButtonItem value="grid" label="网格"
            ><template #leading><MdvIcon :icon="gridView" /></template
          ></MdvSegmentedButtonItem>
          <MdvSegmentedButtonItem value="calendar" label="日历"
            ><template #leading><MdvIcon :icon="calendar" /></template
          ></MdvSegmentedButtonItem>
        </MdvSegmentedButton>
        <MdvSegmentedButton v-model="iconOnly" aria-label="纯图标视图">
          <MdvSegmentedButtonItem value="list" aria-label="列表"
            ><template #leading><MdvIcon :icon="viewList" /></template
          ></MdvSegmentedButtonItem>
          <MdvSegmentedButtonItem value="grid" aria-label="网格"
            ><template #leading><MdvIcon :icon="gridView" /></template
          ></MdvSegmentedButtonItem>
          <MdvSegmentedButtonItem value="calendar" aria-label="日历"
            ><template #leading><MdvIcon :icon="calendar" /></template
          ></MdvSegmentedButtonItem>
        </MdvSegmentedButton>
        <MdvSegmentedButton v-model="customCheck" aria-label="自定义选中图标">
          <MdvSegmentedButtonItem value="a" label="自定义勾"
            ><template #selected-icon><MdvIcon :icon="doneAll" /></template
          ></MdvSegmentedButtonItem>
          <MdvSegmentedButtonItem value="b" label="默认勾" />
        </MdvSegmentedButton>
        <MdvSegmentedButton
          v-model="hiddenCheck"
          :show-selected-icon="false"
          aria-label="隐藏选中图标"
        >
          <MdvSegmentedButtonItem value="a" label="无选中图标" />
          <MdvSegmentedButtonItem value="b" label="另一项" />
        </MdvSegmentedButton>
      </div>
    </section>

    <section
      aria-labelledby="segmented-layout-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="segmented-layout-title" class="text-mdv-title-large">密度、全宽、长文本与窄容器</h2>
      <div class="flex flex-wrap items-center gap-6">
        <div v-for="density in densities" :key="density" class="space-y-1">
          <p class="text-mdv-label-large">density {{ density }} · {{ 40 + density * 4 }}px</p>
          <MdvSegmentedButton
            v-model="densityValue"
            :density="density"
            :aria-label="`密度 ${density}`"
          >
            <MdvSegmentedButtonItem value="a" label="第一项" />
            <MdvSegmentedButtonItem value="b" label="第二项" />
          </MdvSegmentedButton>
        </div>
      </div>
      <MdvSegmentedButton v-model="single" full-width aria-label="全宽时间范围">
        <MdvSegmentedButtonItem value="day" label="今天" />
        <MdvSegmentedButtonItem value="week" label="本周" />
        <MdvSegmentedButtonItem value="month" label="本月" />
      </MdvSegmentedButton>
      <div class="max-w-64 rounded-mdv-small border border-dashed border-mdv-outline p-3">
        <MdvSegmentedButton v-model="single" aria-label="窄容器中的长标签">
          <MdvSegmentedButtonItem value="day" label="今天的全部设计任务" />
          <MdvSegmentedButtonItem value="week" label="This week’s development" />
          <MdvSegmentedButtonItem value="month" label="本月验收与后续发布计划" />
        </MdvSegmentedButton>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        窄容器中保持单行，可水平滚动；用方向键导航时目标会滚入视野。四档密度的命中高度均为 48px。
      </p>
    </section>

    <section
      aria-labelledby="segmented-states-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="segmented-states-title" class="text-mdv-title-large">禁用、RTL、值类型与原生事件</h2>
      <label class="flex items-center gap-2"
        ><input v-model="disabled" type="checkbox" />禁用第一组</label
      >
      <MdvSegmentedButton v-model="single" :disabled="disabled" aria-label="禁用状态">
        <MdvSegmentedButtonItem value="day" label="今天" />
        <MdvSegmentedButtonItem value="week" label="本周" />
        <MdvSegmentedButtonItem value="month" label="暂不可用" disabled />
      </MdvSegmentedButton>
      <label class="flex items-center gap-2"
        ><input v-model="fieldsetDisabled" type="checkbox" />禁用 fieldset</label
      >
      <fieldset
        :disabled="fieldsetDisabled"
        class="rounded-mdv-small border border-mdv-outline-variant p-3"
      >
        <legend class="px-2 text-mdv-label-large">原生 fieldset</legend>
        <MdvSegmentedButton v-model="view" aria-label="fieldset 中的视图">
          <MdvSegmentedButtonItem value="list" label="列表" />
          <MdvSegmentedButtonItem value="grid" label="网格" />
        </MdvSegmentedButton>
      </fieldset>
      <div dir="rtl" class="space-y-2">
        <MdvSegmentedButton v-model="single" aria-label="RTL 时间范围">
          <MdvSegmentedButtonItem value="day" label="اليوم" />
          <MdvSegmentedButtonItem value="week" label="أسبوع" />
          <MdvSegmentedButtonItem value="month" label="شهر" />
        </MdvSegmentedButton>
      </div>
      <MdvSegmentedButton v-model="typed" aria-label="字符串和数字严格区分">
        <MdvSegmentedButtonItem
          :value="1"
          label="数字 1"
          @click="clickCount++"
          @input="inputCount++"
          @change="changeCount++"
        />
        <MdvSegmentedButtonItem
          value="1"
          label="字符串 1"
          @click="clickCount++"
          @input="inputCount++"
          @change="changeCount++"
        />
      </MdvSegmentedButton>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        类型：{{ typeof typed }} · click {{ clickCount }} / input {{ inputCount }} / change
        {{ changeCount }}
      </p>
    </section>

    <section
      aria-labelledby="segmented-form-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="segmented-form-title" class="text-mdv-title-large">原生提交、reset 与外部表单关联</h2>
      <form class="space-y-3" @submit.prevent="submit">
        <MdvSegmentedButton v-model="formValue" name="view" aria-label="提交的视图">
          <MdvSegmentedButtonItem value="list" label="列表" />
          <MdvSegmentedButtonItem value="grid" label="网格" />
        </MdvSegmentedButton>
        <div>
          <MdvSegmentedButton
            v-model="formOptions"
            selection="multiple"
            name="options"
            aria-label="提交的选项"
          >
            <MdvSegmentedButtonItem value="a" label="显示摘要" />
            <MdvSegmentedButtonItem value="b" label="显示图片" />
            <MdvSegmentedButtonItem value="c" label="不可用" disabled />
          </MdvSegmentedButton>
        </div>
        <div class="flex gap-3">
          <MdvButton type="submit">提交</MdvButton
          ><MdvButton type="reset" variant="outlined">原生重置</MdvButton>
        </div>
        <pre
          class="overflow-auto rounded-mdv-small bg-mdv-surface-container p-3 text-mdv-body-small"
          >{{ submitted }}</pre>
      </form>
      <MdvSegmentedButton
        v-model="externalValue"
        name="external"
        form="segmented-external-form"
        aria-label="外部表单选项"
      >
        <MdvSegmentedButtonItem value="a" label="外部 A" />
        <MdvSegmentedButtonItem value="b" label="外部 B" />
      </MdvSegmentedButton>
      <form
        id="segmented-external-form"
        class="flex flex-wrap gap-3"
        @submit.prevent="submitExternal"
      >
        <MdvButton type="submit">提交外部字段</MdvButton
        ><MdvButton type="reset" variant="outlined">重置外部字段</MdvButton>
      </form>
      <pre
        class="overflow-auto rounded-mdv-small bg-mdv-surface-container p-3 text-mdv-body-small"
        >{{ externalSubmitted }}</pre>
    </section>

    <section
      aria-labelledby="segmented-keyboard-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="segmented-keyboard-title" class="text-mdv-title-large">焦点方法与动态分段</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        Tab / Shift+Tab
        逐项前后移动焦点，到首尾后离开组，不改变选中值。单选方向键同时选择，多选只移焦。 Home / End
        到首尾，Space / Enter 激活。聚焦分段后按 Delete 可移除该项。
      </p>
      <MdvSegmentedButton ref="methodGroup" v-model="dynamic" aria-label="可动态移除的分段">
        <MdvSegmentedButtonItem
          v-for="item in items"
          :key="item"
          :value="item"
          :label="`分段 ${item.toUpperCase()}`"
          @keydown.delete.prevent="items = items.filter((value) => value !== item)"
        />
      </MdvSegmentedButton>
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="outlined" @click="methodGroup?.focus()">聚焦分段</MdvButton>
        <MdvButton variant="outlined" @click="items = ['a', 'b', 'c']">恢复分段</MdvButton>
        <MdvButton variant="text" @click="items = [...items].reverse()">反转排列</MdvButton>
      </div>
    </section>
  </div>
</template>
