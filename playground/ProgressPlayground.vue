<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref } from 'vue'
import { MdvButton, MdvCircularProgress, MdvLinearProgress, MdvSlider, MdvSwitch } from '@/index'
import type { MdvProgressVariant, MdvSliderModelValue } from '@/index'

const variants: { value: MdvProgressVariant; label: string }[] = [
  { value: 'flat', label: 'Flat 平直' },
  { value: 'wavy', label: 'Wavy 波浪' },
]
const progress = ref(45)
const customValue = ref(42)
const max = ref(100)
const thickness = ref(4)
const size = ref(64)
const variant = ref<MdvProgressVariant>('flat')
const indeterminate = ref(false)
const validMax = computed(() => (Number.isFinite(max.value) && max.value > 0 ? max.value : 100))
const boundaries = [0, 1, 10, 50, 94, 95, 99, 100]
const running = ref(false)
const jobValue = ref(0)
const jobUnknown = ref(false)
const jobStatus = computed(() => {
  if (running.value) return jobUnknown.value ? '正在准备文件…' : '正在上传文件…'
  if (jobValue.value === 100) return '上传完成。'
  return jobValue.value || jobUnknown.value ? '已暂停。' : '等待开始。'
})
let timer: ReturnType<typeof setInterval> | undefined

function setProgress(value: MdvSliderModelValue | undefined) {
  if (typeof value === 'number') progress.value = value
}

function setCustomValue(value: MdvSliderModelValue | undefined) {
  if (typeof value === 'number') customValue.value = value
}

function stopDemo() {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
  running.value = false
}

function startDemo() {
  stopDemo()
  running.value = true
  jobValue.value = 0
  jobUnknown.value = true
  let ticks = 0
  timer = setInterval(() => {
    ticks += 1
    if (ticks < 4) return
    jobUnknown.value = false
    jobValue.value = Math.min(100, jobValue.value + 8)
    if (jobValue.value === 100) stopDemo()
  }, 300)
}

onDeactivated(stopDemo)
onBeforeUnmount(stopDemo)
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="progress-overview-title" class="space-y-5">
      <h2 id="progress-overview-title" class="text-mdv-title-large">线性与圆形 · 八种组合</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        默认平直、4px 线宽。平直圆形直径 40px，波浪圆形 48px；波浪线性高 10px。
        不确定的平直圆形默认没有底环，波浪圆形保留底环。
      </p>
      <MdvSlider
        :model-value="progress"
        label="调整确定进度"
        value-indicator
        @update:model-value="setProgress"
      />
      <div v-for="shape in variants" :key="shape.value" class="space-y-3">
        <h3 class="text-mdv-title-medium">{{ shape.label }}</h3>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="min-w-0 space-y-5 rounded-mdv-medium bg-mdv-surface-container-low p-5">
            <p class="text-mdv-label-large">线性 · 确定</p>
            <MdvLinearProgress :value="progress" :variant="shape.value" label="文件上传" />
            <p class="text-mdv-body-small text-mdv-on-surface-variant">{{ progress }} / 100</p>
          </div>
          <div class="min-w-0 space-y-5 rounded-mdv-medium bg-mdv-surface-container-low p-5">
            <p class="text-mdv-label-large">线性 · 不确定</p>
            <MdvLinearProgress indeterminate :variant="shape.value" label="正在连接" />
          </div>
          <div class="space-y-4 rounded-mdv-medium bg-mdv-surface-container-low p-5">
            <p class="text-mdv-label-large">圆形 · 确定</p>
            <div class="flex min-h-20 items-center justify-center">
              <MdvCircularProgress :value="progress" :variant="shape.value" label="文件上传" />
            </div>
          </div>
          <div class="space-y-4 rounded-mdv-medium bg-mdv-surface-container-low p-5">
            <p class="text-mdv-label-large">圆形 · 不确定</p>
            <div class="flex min-h-20 items-center justify-center">
              <MdvCircularProgress indeterminate :variant="shape.value" label="正在连接" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="progress-controls-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="progress-controls-title" class="text-mdv-title-large">数值、模式与尺寸</h2>
      <div class="flex flex-wrap items-end gap-5">
        <label class="grid gap-2 text-mdv-label-large">
          外观
          <select v-model="variant" class="playground-control">
            <option v-for="shape in variants" :key="shape.value" :value="shape.value">
              {{ shape.label }}
            </option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          value
          <input
            v-model.number="customValue"
            type="number"
            step="any"
            class="playground-control w-28"
          />
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          max
          <input v-model.number="max" type="number" step="any" class="playground-control w-28" />
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          线宽（px）
          <input
            v-model.number="thickness"
            type="number"
            step="0.5"
            class="playground-control w-28"
          />
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          圆形直径（px）
          <input v-model.number="size" type="number" class="playground-control w-28" />
        </label>
        <MdvSwitch v-model="indeterminate" label="不确定进度" />
      </div>
      <MdvSlider
        :model-value="customValue"
        :max="validMax"
        :step="0.1"
        label="连续调整数值"
        @update:model-value="setCustomValue"
      />
      <div
        class="grid items-center gap-6 rounded-mdv-medium bg-mdv-surface-container-low p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <MdvLinearProgress
          :value="customValue"
          :max="max"
          :variant="variant"
          :thickness="thickness"
          :indeterminate="indeterminate"
          label="正在处理文件，长中文与 long English content 均应自然换行"
        />
        <MdvCircularProgress
          :value="customValue"
          :max="max"
          :variant="variant"
          :size="size"
          :thickness="thickness"
          :indeterminate="indeterminate"
          aria-label="文件处理进度"
        />
      </div>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        试试负值、超过 max、小数和快速往返；显示范围限制在 0–max。无效 max 回退到 100，
        无效尺寸回退到默认值。切换为不确定模式后，不再对辅助技术报告当前数值。
      </p>
    </section>

    <section
      aria-labelledby="progress-boundaries-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="progress-boundaries-title" class="text-mdv-title-large">波浪收放与端点</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        进度不超过 10% 或达到 95% 时，波浪收回为平直。0% 保留轨道与线性末端标记； 100%
        只显示完整进度，组件保持可见。
      </p>
      <div class="space-y-5 rounded-mdv-medium bg-mdv-surface-container-low p-5">
        <div
          v-for="value in boundaries"
          :key="value"
          class="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-4"
        >
          <span class="text-mdv-label-large">{{ value }}%</span>
          <MdvLinearProgress :value="value" variant="wavy" :aria-label="`线性 ${value}%`" />
          <MdvCircularProgress :value="value" variant="wavy" :aria-label="`圆形 ${value}%`" />
        </div>
      </div>
      <div class="flex flex-wrap gap-3">
        <MdvButton
          v-for="value in [0, 10, 50, 95, 100]"
          :key="value"
          variant="tonal"
          @click="progress = value"
        >
          设为 {{ value }}%
        </MdvButton>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        上方按钮控制页面首组；连续点击不同按钮，检查动画是否平顺接向最新值。
      </p>
    </section>

    <section
      aria-labelledby="progress-job-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="progress-job-title" class="text-mdv-title-large">从等待到完成</h2>
      <div class="flex flex-wrap gap-3">
        <MdvButton @click="startDemo">开始 / 重新开始</MdvButton>
        <MdvButton variant="outlined" :disabled="!running" @click="stopDemo">暂停</MdvButton>
      </div>
      <div
        class="grid items-center gap-6 rounded-mdv-medium bg-mdv-surface-container-low p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <MdvLinearProgress
          :value="jobValue"
          :indeterminate="jobUnknown"
          variant="wavy"
          aria-labelledby="progress-job-title"
        />
        <MdvCircularProgress
          :value="jobValue"
          :indeterminate="jobUnknown"
          variant="wavy"
          aria-label="上传任务进度"
        />
      </div>
      <p role="status" class="text-mdv-body-medium text-mdv-on-surface-variant">{{ jobStatus }}</p>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        系统启用“减少动态效果”后，进度直接更新，不确定模式保留静态图形。
        切到其他组件页时，自动演示会暂停。
      </p>
    </section>

    <section
      aria-labelledby="progress-layout-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="progress-layout-title" class="text-mdv-title-large">RTL、窄容器与局部主题</h2>
      <div class="grid items-start gap-5 md:grid-cols-2">
        <div dir="rtl" class="space-y-6 rounded-mdv-medium bg-mdv-surface-container-low p-5">
          <h3 class="text-mdv-title-medium">RTL：线性从右向左，圆形保持顺时针</h3>
          <MdvLinearProgress :value="progress" label="上传进度" />
          <MdvLinearProgress indeterminate variant="wavy" label="正在连接" />
          <MdvCircularProgress :value="progress" variant="wavy" label="上传进度" />
        </div>
        <div class="space-y-4 rounded-mdv-medium bg-mdv-surface-container-low p-5">
          <h3 class="text-mdv-title-medium">120px 宽度</h3>
          <div class="w-[120px] max-w-full space-y-6">
            <MdvLinearProgress :value="progress" label="较窄的容器也能正常显示" />
            <MdvLinearProgress :value="progress" variant="wavy" aria-label="窄容器处理进度" />
          </div>
        </div>
        <div
          data-mdv-theme="dark"
          class="space-y-6 rounded-mdv-medium bg-mdv-surface-container-low p-5 text-mdv-on-surface"
        >
          <h3 class="text-mdv-title-medium">局部深色</h3>
          <MdvLinearProgress :value="progress" variant="wavy" label="文件处理" />
          <MdvCircularProgress indeterminate variant="wavy" label="正在连接" />
        </div>
        <div
          class="space-y-6 rounded-mdv-medium bg-mdv-surface-container-low p-5"
          style="
            --mdv-progress-active-color: var(--mdv-sys-color-tertiary);
            --mdv-progress-track-color: var(--mdv-sys-color-tertiary-container);
          "
        >
          <h3 class="text-mdv-title-medium">局部颜色覆盖</h3>
          <MdvLinearProgress :value="progress" label="文件处理" />
          <MdvCircularProgress :value="progress" variant="wavy" label="文件处理" />
        </div>
      </div>
    </section>
  </div>
</template>
