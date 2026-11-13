<script setup lang="ts">
import { computed, ref } from 'vue'
import editIcon from '@iconify-icons/material-symbols/edit'
import checkIcon from '@iconify-icons/material-symbols/check'
import micIcon from '@iconify-icons/material-symbols/mic'
import micOffIcon from '@iconify-icons/material-symbols/mic-off'
import videoIcon from '@iconify-icons/material-symbols/videocam'
import videoOffIcon from '@iconify-icons/material-symbols/videocam-off'
import callEndIcon from '@iconify-icons/material-symbols/call-end'
import addIcon from '@iconify-icons/material-symbols/add'
import moreIcon from '@iconify-icons/material-symbols/more-horiz'
import {
  MdvButton,
  MdvButtonGroup,
  MdvButtonGroupItem,
  MdvCheckbox,
  MdvDialog,
  MdvIcon,
  MdvMenu,
  MdvMenuItem,
  MdvTextField,
  MdvToolbar,
  MdvTooltip,
} from '@/index'
import type {
  MdvButtonGroupDensity,
  MdvButtonGroupItemVariant,
  MdvButtonGroupModelValue,
  MdvButtonGroupSelection,
  MdvButtonGroupVariant,
  MdvButtonShape,
  MdvButtonSize,
  MdvIconButtonWidth,
} from '@/index'

const sizes: MdvButtonSize[] = ['xs', 's', 'm', 'l', 'xl']
const variants: MdvButtonGroupVariant[] = ['standard', 'connected']
const appearances: MdvButtonGroupItemVariant[] = ['filled', 'tonal', 'outlined', 'elevated']
const variant = ref<MdvButtonGroupVariant>('standard')
const size = ref<MdvButtonSize>('s')
const shape = ref<MdvButtonShape>('round')
const appearance = ref<MdvButtonGroupItemVariant>('tonal')
const selection = ref<MdvButtonGroupSelection>('single')
const density = ref<MdvButtonGroupDensity>(0)
const width = ref<MdvIconButtonWidth>('default')
const model = ref<MdvButtonGroupModelValue>('edit')
const required = ref(false)
const disabled = ref(false)
const loading = ref(false)
const iconOnly = ref(false)
const fullWidth = ref(false)
const rtl = ref(false)
const dark = ref(false)
const largeText = ref(false)
const label = ref('编辑')
const message = ref('尚未操作')
const matrixModels = ref<Record<string, MdvButtonGroupModelValue>>({})
const microphone = ref(true)
const camera = ref(true)
const multi = ref<MdvButtonGroupModelValue>(['photo'])
const reject = ref(true)
const accepted = ref<MdvButtonGroupModelValue>('a')
const proposed = ref<MdvButtonGroupModelValue>(null)
const members = ref(['a', 'b', 'c'])
const dynamicModel = ref<MdvButtonGroupModelValue>('b')
const formModel = ref<MdvButtonGroupModelValue>(['email'])
const submitted = ref('尚未提交')
const dialog = ref(false)
const options = computed(() => [
  { value: 'edit', label: label.value || '编辑', icon: editIcon },
  { value: 'review', label: '审阅', icon: checkIcon },
  { value: 'create', label: '新建', icon: addIcon },
])
function changeSelection(event: Event) {
  selection.value = (event.target as HTMLSelectElement).value as MdvButtonGroupSelection
  model.value = selection.value === 'multiple' ? ['edit'] : 'edit'
}
function propose(value: MdvButtonGroupModelValue) {
  proposed.value = value
  if (!reject.value) accepted.value = value
}
function submit(event: Event) {
  submitted.value = JSON.stringify([...new FormData(event.target as HTMLFormElement).entries()])
}
</script>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <h3 class="text-lg font-medium">按钮组</h3>
      <div class="group-controls">
        <label
          >布局<select v-model="variant">
            <option v-for="entry in variants" :key="entry">{{ entry }}</option>
          </select></label
        >
        <label
          >尺寸<select v-model="size">
            <option v-for="entry in sizes" :key="entry">{{ entry }}</option>
          </select></label
        >
        <label
          >形状<select v-model="shape">
            <option>round</option>
            <option>square</option>
          </select></label
        >
        <label
          >外观<select v-model="appearance">
            <option v-for="entry in appearances" :key="entry">{{ entry }}</option>
          </select></label
        >
        <label
          >选择<select :value="selection" @change="changeSelection">
            <option>none</option>
            <option>single</option>
            <option>multiple</option>
          </select></label
        >
        <label
          >密度<select v-model="density">
            <option v-for="entry in [0, -1, -2, -3]" :key="entry" :value="entry">
              {{ entry }}
            </option>
          </select></label
        >
        <label
          >图标宽度<select v-model="width">
            <option>narrow</option>
            <option>default</option>
            <option>wide</option>
          </select></label
        >
        <MdvTextField v-model="label" label="首项文字" />
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="required" label="至少保留一项" />
        <MdvCheckbox v-model="disabled" label="整组禁用" />
        <MdvCheckbox v-model="loading" label="首项加载" />
        <MdvCheckbox v-model="iconOnly" label="纯图标" />
        <MdvCheckbox v-model="fullWidth" label="填满容器" />
        <MdvCheckbox v-model="rtl" label="RTL" />
        <MdvCheckbox v-model="dark" label="局部深色" />
        <MdvCheckbox v-model="largeText" label="两倍文字" />
      </div>
      <div
        class="group-example"
        :class="{ 'group-large-text': largeText }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <MdvButtonGroup
          v-model="model"
          :variant="variant"
          :size="size"
          :shape="shape"
          :selection="selection"
          :selection-required="required"
          :disabled="disabled"
          :full-width="fullWidth"
          :density="density"
          aria-label="编辑方式"
        >
          <MdvButtonGroupItem
            v-for="(option, index) in options"
            :key="option.value"
            :value="option.value"
            :variant="appearance"
            :icon-only="iconOnly"
            :width="width"
            :aria-label="iconOnly ? option.label : undefined"
            :loading="index === 0 && loading"
            @click="message = `点击了${option.label}`"
          >
            <template v-if="!iconOnly" #leading><MdvIcon :icon="option.icon" /></template>
            <MdvIcon v-if="iconOnly" :icon="option.icon" />
            <template v-else>{{ option.label }}</template>
          </MdvButtonGroupItem>
        </MdvButtonGroup>
      </div>
      <p class="text-sm text-mdv-on-surface-variant">
        Tab 逐项移动，方向键／Home／End 移动焦点，空格或 Enter 确认。
      </p>
      <p role="status">{{ message }} · 当前选择：{{ JSON.stringify(model) }}</p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">两款布局与五档尺寸</h3>
      <div v-for="kind in variants" :key="kind" class="space-y-3">
        <h4 class="font-medium">{{ kind }}</h4>
        <div
          v-for="scale in sizes"
          :key="scale"
          class="group-example"
          :dir="rtl ? 'rtl' : 'ltr'"
          :data-mdv-theme="dark ? 'dark' : undefined"
        >
          <span class="group-caption">{{ scale }}</span>
          <MdvButtonGroup
            v-model="matrixModels[`${kind}-${scale}`]"
            :variant="kind"
            :size="scale"
            :shape="shape"
            selection="single"
            :aria-label="`${kind} ${scale} 选择`"
          >
            <MdvButtonGroupItem value="one">一</MdvButtonGroupItem>
            <MdvButtonGroupItem value="two">二</MdvButtonGroupItem>
            <MdvButtonGroupItem value="three">三</MdvButtonGroupItem>
          </MdvButtonGroup>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">外观与多选</h3>
      <div class="group-grid">
        <div
          v-for="style in appearances"
          :key="style"
          class="group-example space-y-3"
          :data-mdv-theme="dark ? 'dark' : undefined"
        >
          <h4>{{ style }}</h4>
          <MdvButtonGroup
            v-model="multi"
            :variant="variant"
            :shape="shape"
            selection="multiple"
            :selection-required="required"
            :aria-label="`${style} 内容类型`"
          >
            <MdvButtonGroupItem value="photo" :variant="style">照片</MdvButtonGroupItem>
            <MdvButtonGroupItem value="video" :variant="style">视频</MdvButtonGroupItem>
            <MdvButtonGroupItem value="audio" :variant="style">音频</MdvButtonGroupItem>
          </MdvButtonGroup>
        </div>
      </div>
      <p>选择：{{ JSON.stringify(multi) }}</p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">独立切换与普通操作</h3>
      <div class="group-example" :dir="rtl ? 'rtl' : 'ltr'">
        <MdvButtonGroup size="m" aria-label="通话控制">
          <MdvTooltip text="麦克风"
            ><template #trigger="{ triggerProps }"
              ><MdvButtonGroupItem
                v-model:selected="microphone"
                v-bind="triggerProps"
                icon-only
                aria-label="麦克风"
                ><MdvIcon :icon="micOffIcon" /><template #selected
                  ><MdvIcon :icon="micIcon" /></template></MdvButtonGroupItem></template
          ></MdvTooltip>
          <MdvButtonGroupItem
            v-model:selected="camera"
            icon-only
            variant="tonal"
            aria-label="摄像头"
            ><MdvIcon :icon="videoOffIcon" /><template #selected
              ><MdvIcon :icon="videoIcon" /></template
          ></MdvButtonGroupItem>
          <MdvButtonGroupItem color="error" @click="message = '通话已结束'"
            ><template #leading><MdvIcon :icon="callEndIcon" /></template
            >结束通话</MdvButtonGroupItem
          >
        </MdvButtonGroup>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">受控选择与动态选项</h3>
      <MdvCheckbox v-model="reject" label="拒绝新的选择" />
      <div class="group-example">
        <MdvButtonGroup
          :model-value="accepted"
          variant="connected"
          aria-label="受控选择"
          @update:model-value="propose"
        >
          <MdvButtonGroupItem value="a">选项 A</MdvButtonGroupItem
          ><MdvButtonGroupItem value="b">选项 B</MdvButtonGroupItem
          ><MdvButtonGroupItem value="c">选项 C</MdvButtonGroupItem>
        </MdvButtonGroup>
      </div>
      <p>已接受：{{ accepted }} · 最近请求：{{ proposed }}</p>
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="tonal" @click="members = [...members].reverse()">倒序</MdvButton>
        <MdvButton
          variant="tonal"
          @click="members = members.length === 3 ? ['a', 'c'] : ['a', 'b', 'c']"
          >增减中项</MdvButton
        >
      </div>
      <div class="group-example">
        <MdvButtonGroup v-model="dynamicModel" variant="connected" aria-label="动态选项">
          <MdvButtonGroupItem v-for="member in members" :key="member" :value="member"
            >选项 {{ member.toUpperCase() }}</MdvButtonGroupItem
          >
        </MdvButtonGroup>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">表单与原生链接</h3>
      <form class="group-example space-y-4" @submit.prevent="submit">
        <MdvButtonGroup
          v-model="formModel"
          variant="connected"
          selection="multiple"
          name="notifications"
          aria-label="消息通知"
        >
          <MdvButtonGroupItem value="email">邮件</MdvButtonGroupItem
          ><MdvButtonGroupItem value="sms">短信</MdvButtonGroupItem
          ><MdvButtonGroupItem value="push" disabled>推送</MdvButtonGroupItem>
        </MdvButtonGroup>
        <div class="flex flex-wrap gap-3">
          <MdvButton type="submit">提交</MdvButton
          ><MdvButton type="reset" variant="text">重置</MdvButton>
        </div>
      </form>
      <p>{{ submitted }}</p>
      <div class="group-example">
        <MdvButtonGroup aria-label="相关资源"
          ><MdvButtonGroupItem
            href="https://m3.material.io/components/button-groups/specs"
            target="_blank"
            rel="noopener"
            >官方规范</MdvButtonGroupItem
          ><MdvButtonGroupItem variant="tonal" @click="dialog = true"
            >打开对话框</MdvButtonGroupItem
          ></MdvButtonGroup
        >
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">窄容器与长文字</h3>
      <div
        class="group-narrow group-example"
        :class="{ 'group-large-text': largeText }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <MdvButtonGroup aria-label="长文字操作"
          ><MdvButtonGroupItem>保存所有未完成的更改</MdvButtonGroupItem
          ><MdvButtonGroupItem variant="outlined"
            >ReviewUninterruptedProjectChanges</MdvButtonGroupItem
          ><MdvButtonGroupItem disabled>不可用</MdvButtonGroupItem></MdvButtonGroup
        >
      </div>
      <p class="text-sm text-mdv-on-surface-variant">
        横向滚动查看长标签。可用顶部主题入口核对动态取色。
      </p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">工具栏与菜单组合</h3>
      <div class="group-example">
        <MdvToolbar variant="floating" aria-label="编辑操作" :elevated="false">
          <MdvButtonGroup size="xs" aria-label="撤销与重做"
            ><MdvButtonGroupItem variant="tonal" @click="message = '撤销'">撤销</MdvButtonGroupItem
            ><MdvButtonGroupItem variant="tonal" @click="message = '重做'"
              >重做</MdvButtonGroupItem
            ></MdvButtonGroup
          >
          <MdvMenu
            ><template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="text"
                ><MdvIcon :icon="moreIcon" />更多</MdvButton
              ></template
            ><MdvMenuItem @select="message = '导出'">导出</MdvMenuItem
            ><MdvMenuItem @select="dialog = true">设置</MdvMenuItem></MdvMenu
          >
        </MdvToolbar>
      </div>
    </section>

    <MdvDialog v-model="dialog" title="编辑方式">
      <p class="mb-5">选择适合当前任务的方式。</p>
      <MdvButtonGroup
        v-model="model"
        variant="connected"
        selection="single"
        aria-label="对话框内的编辑方式"
        ><MdvButtonGroupItem value="edit">编辑</MdvButtonGroupItem
        ><MdvButtonGroupItem value="review">审阅</MdvButtonGroupItem></MdvButtonGroup
      >
      <template #actions
        ><MdvButton variant="text" @click="dialog = false">完成</MdvButton></template
      >
    </MdvDialog>
  </div>
</template>

<style scoped>
.group-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px;
}
.group-controls > label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.group-controls select {
  min-width: 100px;
  border: 1px solid var(--mdv-sys-color-outline);
  border-radius: 8px;
  padding: 8px;
  background: var(--mdv-sys-color-surface);
  color: var(--mdv-sys-color-on-surface);
}
.group-example {
  min-width: 0;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 20px;
  padding: 20px;
  background: var(--mdv-sys-color-surface);
  color: var(--mdv-sys-color-on-surface);
}
.group-caption {
  display: block;
  margin-block-end: 12px;
  color: var(--mdv-sys-color-on-surface-variant);
  font-size: 14px;
}
.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 16px;
}
.group-narrow {
  width: min(100%, 280px);
}
.group-large-text {
  --mdv-sys-typescale-label-large-size: 28px;
  --mdv-sys-typescale-label-large-line-height: 40px;
}
</style>
