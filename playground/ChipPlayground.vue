<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import calendarMonth from '@iconify-icons/material-symbols/calendar-month-outline'
import directions from '@iconify-icons/material-symbols/directions-outline'
import image from '@iconify-icons/material-symbols/image-outline'
import expandMore from '@iconify-icons/material-symbols/expand-more'
import cancel from '@iconify-icons/material-symbols/cancel-outline'
import { MdvButton, MdvChip, MdvChipSet, MdvIcon } from '@/index'
import type { MdvChipColor, MdvChipSetModelValue, MdvChipVariant } from '@/index'

const variants: MdvChipVariant[] = ['assist', 'filter', 'input', 'suggestion']
const colors: MdvChipColor[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'error',
  'info',
  '#006c4c',
]
const single = ref<MdvChipSetModelValue>('all')
const multiple = ref<MdvChipSetModelValue>(['image'])
const typed = ref<MdvChipSetModelValue>(1)
const selectableInput = ref(false)
const iconSelected = ref(false)
const customSeed = ref('#006c4c')
const customColor = computed<MdvChipColor | undefined>(() =>
  /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(customSeed.value)
    ? (customSeed.value as MdvChipColor)
    : undefined,
)
const inputItems = ref(['设计讨论', '组件验收', '发布准备'])
const removableFilters = ref(['中文', '图片', '最近一周'])
const removeOnlyItems = ref(['仅删除标签', '短', '另一个标签'])
const disabled = ref(false)
const message = ref('点击纸片或使用键盘体验。')
const actionCount = ref(0)
const exampleSet = useTemplateRef<InstanceType<typeof MdvChipSet>>('exampleSet')

function removeInput(label: string) {
  inputItems.value = inputItems.value.filter((item) => item !== label)
  message.value = `已删除“${label}”。`
}

function resetItems() {
  inputItems.value = ['设计讨论', '组件验收', '发布准备']
  removableFilters.value = ['中文', '图片', '最近一周']
  removeOnlyItems.value = ['仅删除标签', '短', '另一个标签']
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="chip-types-title" class="space-y-4">
      <div>
        <h2 id="chip-types-title" class="text-mdv-title-large">四种用途与默认外观</h2>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          可见容器高 32px、圆角 8px，交互区域至少 48px。Filter 默认切换选中；Input
          默认执行主体操作，右侧独立请求删除。
        </p>
      </div>
      <MdvChipSet label="上下文操作 Assist">
        <MdvChip label="加入日历" @click="message = '已点击加入日历。'">
          <template #leading><MdvIcon :icon="calendarMonth" /></template>
        </MdvChip>
        <MdvChip label="查看路线" @click="message = '已点击查看路线。'">
          <template #leading><MdvIcon :icon="directions" /></template>
        </MdvChip>
        <MdvChip label="禁用操作" disabled />
      </MdvChipSet>
      <MdvChipSet label="建议 Suggestion">
        <MdvChip
          variant="suggestion"
          label="好的，谢谢！"
          @click="message = '已采用回复：好的，谢谢！'"
        />
        <MdvChip
          variant="suggestion"
          label="稍后回复"
          @click="message = '已采用回复：稍后回复。'"
        />
        <MdvChip variant="suggestion" label="查看图片" @click="message = '已点击图片建议。'">
          <template #leading><MdvIcon :icon="image" /></template>
        </MdvChip>
      </MdvChipSet>
      <MdvChipSet label="内容 Input">
        <MdvChip
          variant="input"
          label="设计文件"
          @click="message = '已打开设计文件；没有切换选中。'"
          @remove="message = '收到删除请求，当前示例保留该项。'"
        />
        <MdvChip
          variant="input"
          label="林同学"
          @click="message = '已打开联系人。'"
          @remove="message = '收到删除联系人请求。'"
        >
          <template #avatar
            ><span
              class="grid size-full place-items-center bg-mdv-primary-container text-mdv-on-primary-container"
              >林</span
            ></template
          >
        </MdvChip>
        <MdvChip variant="input" label="禁用内容" disabled />
      </MdvChipSet>
      <p role="status" class="text-mdv-body-small text-mdv-on-surface-variant">{{ message }}</p>
    </section>

    <section
      aria-labelledby="chip-filter-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="chip-filter-title" class="text-mdv-title-large">Filter 单选、多选与图标切换</h2>
      <MdvChipSet v-model="single" selection="single" label="选择内容类型（单选，可取消）">
        <MdvChip variant="filter" value="all" label="全部" />
        <MdvChip variant="filter" value="article" label="文章" />
        <MdvChip variant="filter" value="image" label="图片">
          <template #leading><MdvIcon :icon="image" /></template>
        </MdvChip>
        <MdvChip variant="filter" value="disabled" label="暂不可用" disabled />
      </MdvChipSet>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        单选结果：{{ JSON.stringify(single) }}
      </p>
      <MdvChipSet v-model="multiple" selection="multiple" label="筛选结果（多选）">
        <MdvChip variant="filter" value="image" label="图片" />
        <MdvChip variant="filter" value="video" label="视频" />
        <MdvChip variant="filter" value="recent" label="最近一周" />
      </MdvChipSet>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        多选结果：{{ JSON.stringify(multiple) }}
      </p>
      <MdvChipSet label="独立选中状态与菜单触发">
        <MdvChip v-model:selected="iconSelected" variant="filter" label="带图标筛选">
          <template #leading><MdvIcon :icon="image" /></template>
        </MdvChip>
        <MdvChip
          variant="filter"
          label="排序方式"
          :selectable="false"
          @click="message = '整个纸片触发排序操作；菜单组件后续单独实现。'"
        >
          <template #trailing><MdvIcon :icon="expandMore" /></template>
        </MdvChip>
      </MdvChipSet>
      <MdvChipSet v-model="typed" selection="single" label="严格区分数字与字符串">
        <MdvChip variant="filter" :value="1" label="数字 1" />
        <MdvChip variant="filter" value="1" label="字符串 1" />
      </MdvChipSet>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        {{ typeof typed }}：{{ JSON.stringify(typed) }}
      </p>
    </section>

    <section
      aria-labelledby="chip-remove-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <div>
        <h2 id="chip-remove-title" class="text-mdv-title-large">删除、独立操作与焦点恢复</h2>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          Tab 进入组，左右方向键经过主体与关闭按钮，Home／End 到首尾。聚焦 Input 后可按
          Delete／Backspace 删除；删除后焦点交给相邻可用项，全部删除后回到组。
        </p>
      </div>
      <MdvChipSet ref="exampleSet" label="任务标签">
        <MdvChip
          v-for="item in inputItems"
          :key="item"
          variant="input"
          :label="item"
          @click="message = `打开“${item}”`"
          @remove="removeInput(item)"
        />
        <span v-if="!inputItems.length" class="text-mdv-body-small text-mdv-on-surface-variant"
          >标签已全部删除，可恢复后继续检查。</span
        >
      </MdvChipSet>
      <MdvChipSet label="整颗纸片只执行删除">
        <MdvChip
          v-for="item in removeOnlyItems"
          :key="item"
          variant="input"
          :label="item"
          remove-only
          @remove="removeOnlyItems = removeOnlyItems.filter((current) => current !== item)"
        />
      </MdvChipSet>
      <MdvChipSet label="可移除的筛选条件">
        <MdvChip
          v-for="item in removableFilters"
          :key="item"
          variant="filter"
          :label="item"
          removable
          @remove="removableFilters = removableFilters.filter((current) => current !== item)"
        />
      </MdvChipSet>
      <MdvChipSet label="Input 显式启用选择">
        <MdvChip
          v-model:selected="selectableInput"
          variant="input"
          label="选中内容"
          selectable
          @remove="message = '收到删除选中内容请求。'"
        />
        <MdvChip
          variant="input"
          label="自定义删除图标"
          @remove="message = '收到自定义图标的删除请求。'"
        >
          <template #trailing><MdvIcon :icon="cancel" /></template>
        </MdvChip>
      </MdvChipSet>
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="outlined" @click="resetItems">恢复标签</MdvButton>
        <MdvButton variant="text" @click="exampleSet?.focus()">聚焦任务标签组</MdvButton>
      </div>
    </section>

    <section
      aria-labelledby="chip-states-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="chip-states-title" class="text-mdv-title-large">描边、抬升、选中与禁用</h2>
      <div v-for="variant in variants" :key="variant" class="space-y-2">
        <MdvChipSet :label="variant">
          <MdvChip :variant="variant" :label="`${variant} 默认`" />
          <MdvChip v-if="variant !== 'input'" :variant="variant" label="抬升款" elevated />
          <MdvChip
            v-if="variant === 'filter' || variant === 'input'"
            :variant="variant"
            label="已选中"
            :selected="true"
            :selectable="true"
          />
          <MdvChip :variant="variant" label="禁用" disabled />
          <MdvChip
            v-if="variant === 'filter' || variant === 'input'"
            :variant="variant"
            label="禁用已选中"
            :selected="true"
            disabled
          />
        </MdvChipSet>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="mode in ['light', 'dark'] as const"
          :key="mode"
          :data-mdv-theme="mode"
          class="rounded-mdv-large bg-mdv-surface p-5 text-mdv-on-surface"
        >
          <MdvChipSet :label="`${mode} 配色`">
            <MdvChip label="普通操作" />
            <MdvChip variant="filter" label="已选择" :selected="true" />
            <MdvChip variant="input" label="头像内容">
              <template #avatar
                ><span
                  class="grid size-full place-items-center bg-mdv-tertiary-container text-mdv-on-tertiary-container"
                  >文</span
                ></template
              >
            </MdvChip>
          </MdvChipSet>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="chip-color-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="chip-color-title" class="text-mdv-title-large">局部语义色与种子色</h2>
      <MdvChipSet label="带种子色的筛选条件">
        <MdvChip
          v-for="color in colors"
          :key="color"
          variant="filter"
          :color="color"
          :label="color"
        />
      </MdvChipSet>
      <label class="grid max-w-48 gap-2 text-mdv-label-large">
        自定义种子色
        <input
          v-model="customSeed"
          class="playground-control font-mono"
          type="text"
          spellcheck="false"
        />
      </label>
      <MdvChipSet label="同一局部色系">
        <MdvChip label="操作" :color="customColor" />
        <MdvChip variant="filter" label="已选择" :color="customColor" :selected="true" />
        <MdvChip variant="input" label="内容" :color="customColor" />
      </MdvChipSet>
    </section>

    <section
      aria-labelledby="chip-layout-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="chip-layout-title" class="text-mdv-title-large">窄容器、长标签、滚动与 RTL</h2>
      <div class="max-w-80 rounded-mdv-large border border-mdv-outline-variant p-4">
        <MdvChipSet label="自动换行与省略">
          <MdvChip label="短标签" />
          <MdvChip variant="filter" label="这是一个用于检查窄容器截断效果的中文长标签" />
          <MdvChip variant="input" label="LongUnbrokenIdentifierForChipOverflowVerification" />
          <MdvChip variant="input" label="短" />
        </MdvChipSet>
      </div>
      <div class="max-w-80 rounded-mdv-large border border-mdv-outline-variant p-4">
        <MdvChipSet label="单行滚动，方向键自动滚入视野" scrollable>
          <MdvChip v-for="index in 8" :key="index" variant="filter" :label="`筛选选项 ${index}`" />
        </MdvChipSet>
      </div>
      <MdvChipSet label="RTL：左右导航与尾部删除方向" dir="rtl">
        <MdvChip label="إضافة إلى التقويم">
          <template #leading><MdvIcon :icon="calendarMonth" /></template>
        </MdvChip>
        <MdvChip variant="filter" label="الصور" />
        <MdvChip variant="input" label="جهة الاتصال" />
      </MdvChipSet>
    </section>

    <section
      aria-labelledby="chip-native-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="chip-native-title" class="text-mdv-title-large">链接、禁用组与表单内操作</h2>
      <MdvChipSet label="原生链接">
        <MdvChip
          label="Material 规范"
          href="https://m3.material.io/components/chips/specs"
          target="_blank"
          rel="noopener noreferrer"
        />
        <MdvChip variant="suggestion" label="禁用链接" href="https://m3.material.io/" disabled />
      </MdvChipSet>
      <MdvButton variant="outlined" @click="disabled = !disabled">{{
        disabled ? '启用下方组' : '禁用下方组'
      }}</MdvButton>
      <MdvChipSet label="组级禁用" :disabled="disabled">
        <MdvChip label="普通操作" />
        <MdvChip variant="filter" label="筛选条件" />
        <MdvChip variant="input" label="输入内容" />
      </MdvChipSet>
      <form @submit.prevent="actionCount += 100">
        <MdvChipSet label="表单内点击不会提交">
          <MdvChip label="计数加一" @click="actionCount++" />
          <MdvChip
            variant="input"
            label="内容动作"
            @click="actionCount++"
            @remove="message = '删除不触发表单提交。'"
          />
        </MdvChipSet>
      </form>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        操作次数：{{ actionCount }}。筛选值由业务提交，不生成隐式表单字段。
      </p>
    </section>
  </div>
</template>
