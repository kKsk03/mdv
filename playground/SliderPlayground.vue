<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import volumeUp from '@iconify-icons/material-symbols/volume-up'
import volumeOff from '@iconify-icons/material-symbols/volume-off'
import remove from '@iconify-icons/material-symbols/remove'
import add from '@iconify-icons/material-symbols/add'
import { MdvButton, MdvIcon, MdvIconButton, MdvSlider, MdvSwitch, MdvTextField } from '@/index'
import type { MdvSliderColor, MdvSliderModelValue, MdvSliderSize } from '@/index'

const volume = ref<MdvSliderModelValue>(40)
const exposure = ref<MdvSliderModelValue>(-20)
const price = ref<MdvSliderModelValue>([20, 80])
const stepped = ref<MdvSliderModelValue>(30)
const steppedRange = ref<MdvSliderModelValue>([20, 80])
const decimal = ref<MdvSliderModelValue>(0.3)
const smallRange = ref<MdvSliderModelValue>([50, 50])
const customCenter = ref<MdvSliderModelValue>(30)
const sizeValue = ref<MdvSliderModelValue>(40)
const verticalValue = ref<MdvSliderModelValue>(40)
const verticalCentered = ref<MdvSliderModelValue>(25)
const verticalRange = ref<MdvSliderModelValue>([25, 75])
const disabled = ref(false)
const formValue = ref<MdvSliderModelValue>(35)
const formRange = ref<MdvSliderModelValue>([10, 90])
const externalValue = ref<MdvSliderModelValue>(25)
const seed = ref('#006c4c')
const rtlValue = ref<MdvSliderModelValue>(30)
const narrow = ref<MdvSliderModelValue>(0)
const updates = ref(0)
const changes = ref(0)
const submitted = ref('尚未提交。')
const events = ref('尚未操作。')
const methodSlider = useTemplateRef<InstanceType<typeof MdvSlider>>('methodSlider')
const sizes: MdvSliderSize[] = ['xs', 's', 'm', 'l', 'xl']
const colors: MdvSliderColor[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'error',
  'info',
]
const customColor = computed<MdvSliderColor>(() =>
  /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(seed.value) ? (seed.value as MdvSliderColor) : 'primary',
)
const numberValue = computed({
  get: () => (typeof volume.value === 'number' ? volume.value : 0),
  set: (value: string | number) => {
    volume.value = Math.min(100, Math.max(0, Number(value) || 0))
  },
})
const percent = (value: number) => `${value}%`
const yuan = (value: number) => `¥${value}`

function adjust(delta: number) {
  numberValue.value = numberValue.value + delta
}
function submitForm(event: SubmitEvent) {
  submitted.value = JSON.stringify(
    [...new FormData(event.currentTarget as HTMLFormElement).entries()],
    null,
    2,
  )
}
function record(event: Event) {
  if (event.type === 'input') updates.value++
  else changes.value++
  events.value = `${event.type}：${(event.target as HTMLInputElement).value}`
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="slider-basic-title" class="space-y-4">
      <h2 id="slider-basic-title" class="text-mdv-title-large">三种官方变体</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        拖动实时更新；点击轨道跳至对应值。Tab
        聚焦手柄后使用方向键、Home／End、PageUp／PageDown；空格配合方向键采用较大步进。
      </p>
      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <MdvSlider
            v-model="volume"
            label="音量"
            value-indicator
            :format-value="percent"
            @input="record"
            @change="record"
          />
          <p>当前：{{ volume }}%；{{ events }}；input {{ updates }} 次 / change {{ changes }} 次</p>
        </div>
        <div class="space-y-2">
          <MdvSlider
            v-model="exposure"
            variant="centered"
            :min="-100"
            :max="100"
            label="曝光偏移"
            value-indicator
          />
          <p>当前：{{ exposure }}</p>
        </div>
        <div class="space-y-2">
          <MdvSlider
            v-model="price"
            variant="range"
            label="价格"
            value-indicator
            :format-value="yuan"
            start-aria-label="最低价格"
            end-aria-label="最高价格"
          />
          <p>范围：{{ price }}</p>
        </div>
        <div class="space-y-2">
          <MdvSlider
            v-model="customCenter"
            variant="centered"
            :center-value="50"
            label="自定义中心 50"
            value-indicator
          />
          <p>当前：{{ customCenter }}</p>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="slider-stops-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="slider-stops-title" class="text-mdv-title-large">步长、刻度、小数与重合手柄</h2>
      <div class="grid gap-6 md:grid-cols-2">
        <MdvSlider
          v-model="stepped"
          :step="10"
          stops
          label="十档刻度"
          value-indicator
          supporting-text="快速点击只切换档位；拖动或按住稍久显示数值。手柄与轨道保留移动过渡。"
        />
        <MdvSlider
          v-model="steppedRange"
          variant="range"
          :step="10"
          stops
          label="范围刻度"
          value-indicator
          supporting-text="分别点击、按住或拖动两个手柄，检查数值提示和档位过渡。"
        />
        <MdvSlider
          v-model="decimal"
          :min="-0.5"
          :max="1.5"
          :step="0.1"
          label="小数步长 0.1"
          value-indicator
          :supporting-text="`值：${decimal}`"
        />
        <MdvSlider
          v-model="smallRange"
          variant="range"
          label="两个手柄重合"
          value-indicator
          :supporting-text="`值：${JSON.stringify(smallRange)}；拖向两侧，或 Tab 访问第二个手柄。`"
        />
        <MdvSlider
          :min="0"
          :max="10"
          :step="3"
          stops
          label="非整除：0、3、6、9、10"
          value-indicator
        />
        <MdvSlider :step="0.001" stops label="密集刻度自动稀疏显示" value-indicator />
        <MdvSlider
          :min="10"
          :max="10"
          label="上下界相等"
          value-indicator
          supporting-text="值固定为 10，不生成无效坐标。"
        />
      </div>
    </section>

    <section
      aria-labelledby="slider-sizes-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="slider-sizes-title" class="text-mdv-title-large">五档尺寸与内嵌图标</h2>
      <div class="flex flex-wrap gap-2">
        <MdvButton variant="text" @click="sizeValue = 0">最小值 0</MdvButton>
        <MdvButton variant="text" @click="sizeValue = 50">中间值 50</MdvButton>
        <MdvButton variant="text" @click="sizeValue = 100">最大值 100</MdvButton>
      </div>
      <div v-for="size in sizes" :key="size" class="space-y-2">
        <MdvSlider v-model="sizeValue" :size="size" :label="size.toUpperCase()" value-indicator>
          <template v-if="['m', 'l', 'xl'].includes(size)" #inset-icon="{ value }"
            ><MdvIcon :icon="value === 0 ? volumeOff : volumeUp"
          /></template>
        </MdvSlider>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        轨道厚度依次为 16 / 24 / 40 / 56 / 96px。图标固定在轨道起点附近，随所在轨道改变颜色；
        手柄经过时淡出避让，再在原位恢复。靠近两端时观察短轨道段外圆角逐渐收缩，
        手柄旁的轨道保持小内角。也可从手柄不同位置抓取，检查能否到达 0／100。当前值：{{
          sizeValue
        }}。
      </p>
    </section>

    <section
      aria-labelledby="slider-composition-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="slider-composition-title" class="text-mdv-title-large">前后操作与精确输入</h2>
      <MdvSlider v-model="volume" label="音量" value-indicator :format-value="percent">
        <template #leading
          ><MdvIconButton variant="standard" aria-label="降低音量" @click="adjust(-1)"
            ><MdvIcon :icon="remove" /></MdvIconButton
        ></template>
        <template #trailing
          ><MdvIconButton variant="standard" aria-label="提高音量" @click="adjust(1)"
            ><MdvIcon :icon="add" /></MdvIconButton
        ></template>
      </MdvSlider>
      <MdvTextField
        v-model.number="numberValue"
        type="number"
        label="音量精确值"
        min="0"
        max="100"
      />
    </section>

    <section
      aria-labelledby="slider-orientation-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="slider-orientation-title" class="text-mdv-title-large">竖向、RTL 与窄容器</h2>
      <div class="flex flex-wrap gap-x-16 gap-y-8">
        <MdvSlider
          v-model="verticalValue"
          orientation="vertical"
          :step="10"
          stops
          label="竖向刻度"
          value-indicator
        />
        <MdvSlider
          v-model="verticalCentered"
          variant="centered"
          orientation="vertical"
          :min="-100"
          :max="100"
          label="竖向中心"
          value-indicator
        />
        <MdvSlider
          v-model="verticalRange"
          variant="range"
          orientation="vertical"
          label="竖向范围"
          value-indicator
        />
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        范围模式优先使用横向；竖向从下向上增加。
      </p>
      <div dir="rtl">
        <MdvSlider v-model="rtlValue" label="RTL：从右向左增加" stops :step="10" value-indicator />
      </div>
      <div class="max-w-48">
        <MdvSlider
          v-model="narrow"
          label="窄容器与长提示"
          value-indicator
          :format-value="(value) => `当前音量 ${value} 百分比`"
        />
      </div>
    </section>

    <section
      aria-labelledby="slider-color-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="slider-color-title" class="text-mdv-title-large">配色、浅深色与禁用</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <MdvSlider
          v-for="color in colors"
          :key="color"
          v-model="sizeValue"
          :color="color"
          :label="color"
          value-indicator
        />
      </div>
      <label class="grid gap-2 text-mdv-label-large"
        >局部种子色<input
          v-model="seed"
          class="playground-control w-40 font-mono"
          spellcheck="false"
      /></label>
      <MdvSlider v-model="sizeValue" :color="customColor" label="局部种子色" value-indicator />
      <div class="grid gap-4 md:grid-cols-2">
        <div
          v-for="mode in ['light', 'dark'] as const"
          :key="mode"
          :data-mdv-theme="mode"
          class="space-y-4 rounded-mdv-large bg-mdv-surface p-5 text-mdv-on-surface"
        >
          <p>{{ mode }}</p>
          <MdvSlider v-model="sizeValue" label="普通" value-indicator /><MdvSlider
            :model-value="40"
            label="禁用"
            disabled
          /><MdvSlider :model-value="[20, 80]" variant="range" label="禁用范围" disabled />
        </div>
      </div>
    </section>

    <section
      aria-labelledby="slider-form-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="slider-form-title" class="text-mdv-title-large">表单、reset 与公开方法</h2>
      <MdvSwitch v-model="disabled" label="禁用下方 fieldset" />
      <form id="slider-preview-form" class="space-y-4" @submit.prevent="submitForm">
        <fieldset :disabled="disabled" class="space-y-4">
          <legend>原生表单关联</legend>
          <MdvSlider v-model="formValue" name="volume" label="提交音量" value-indicator /><MdvSlider
            ref="methodSlider"
            v-model="formRange"
            variant="range"
            name="price"
            label="同名提交两个值"
            value-indicator
          />
        </fieldset>
        <div class="flex flex-wrap gap-3">
          <MdvButton type="submit">读取 FormData</MdvButton
          ><MdvButton type="reset" variant="outlined">重置</MdvButton
          ><MdvButton variant="text" @click="methodSlider?.focus(undefined, 'end')"
            >聚焦上限手柄</MdvButton
          ><MdvButton variant="text" @click="methodSlider?.blur()">失焦</MdvButton>
        </div>
      </form>
      <MdvSlider
        v-model="externalValue"
        form="slider-preview-form"
        name="external"
        label="外部 form 关联"
        value-indicator
      />
      <pre
        class="overflow-auto rounded-mdv-small bg-mdv-surface-container p-4 text-mdv-body-small"
        >{{ submitted }}</pre>
    </section>
  </div>
</template>
