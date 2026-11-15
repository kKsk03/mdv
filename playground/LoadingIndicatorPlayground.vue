<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref } from 'vue'
import { MdvButton, MdvLoadingIndicator, MdvSlider, MdvSwitch } from '@/index'
import type { MdvSliderModelValue } from '@/index'

const size = ref(48)
const contained = ref(false)
const paused = ref(false)
const cached = ref(true)
const sizes = [24, 48, 96, 240]
const loading = ref(false)
const status = computed(() => (loading.value ? '正在加载推荐内容…' : '推荐内容已就绪。'))
let timer: ReturnType<typeof setTimeout> | undefined

function setSize(value: MdvSliderModelValue | undefined) {
  if (typeof value === 'number') size.value = value
}

function finishLoading() {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
  loading.value = false
}

function startLoading() {
  finishLoading()
  loading.value = true
  timer = setTimeout(finishLoading, 2400)
}

onDeactivated(finishLoading)
onBeforeUnmount(finishLoading)
</script>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <div class="space-y-2">
        <h2 class="text-mdv-title-large">Loading Indicator 加载指示器</h2>
        <p class="max-w-3xl text-mdv-body-medium text-mdv-on-surface-variant">
          用连续变换的形状表示短暂等待。默认 48px，支持 Default 与
          Contained；等待时间较长，或需要显示百分比时，使用 Progress。
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          class="flex min-h-44 flex-col items-center justify-center gap-4 rounded-mdv-large bg-mdv-surface-container-low p-6"
        >
          <MdvLoadingIndicator :paused="paused" label="正在加载推荐内容" />
          <span class="text-mdv-label-large">Default</span>
        </div>
        <div
          class="flex min-h-44 flex-col items-center justify-center gap-4 rounded-mdv-large bg-mdv-surface-container-low p-6"
        >
          <MdvLoadingIndicator contained :paused="paused" label="正在刷新页面" />
          <span class="text-mdv-label-large">Contained</span>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-mdv-title-medium">尺寸与暂停</h3>
      <div class="flex flex-wrap gap-6">
        <MdvSwitch v-model="contained" label="圆形背景" />
        <MdvSwitch v-model="paused" label="暂停动画" />
      </div>
      <MdvSlider
        :model-value="size"
        :min="24"
        :max="240"
        :step="1"
        label="加载指示器尺寸"
        @update:model-value="setSize"
      />
      <div
        class="flex min-h-72 items-center justify-center rounded-mdv-large bg-mdv-surface-container-low p-4"
      >
        <MdvLoadingIndicator
          :size="size"
          :contained="contained"
          :paused="paused"
          label="尺寸预览正在加载"
        />
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        当前 {{ size }}px。暂停后再恢复，动画从原来的位置继续。
      </p>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="preset in sizes"
          :key="preset"
          class="flex min-h-72 min-w-0 flex-col items-center justify-center gap-3 rounded-mdv-large bg-mdv-surface-container-low p-2"
        >
          <MdvLoadingIndicator
            :size="preset"
            :contained="contained"
            :paused="paused"
            :label="`${preset}px 加载示例`"
          />
          <span class="text-mdv-label-large">{{ preset }}px</span>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-mdv-title-medium">内容区与按钮组合</h3>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        指示器居中放在即将显示内容的空白区域。按钮中的加载图形采用装饰模式，由按钮文字说明当前状态。
      </p>
      <div class="flex flex-wrap gap-3">
        <MdvButton :disabled="loading" @click="startLoading">{{
          loading ? '正在加载…' : '模拟短暂加载'
        }}</MdvButton>
        <MdvButton variant="tonal" aria-busy="true" style="--mdv-button-icon-size: 24px">
          <template #leading>
            <MdvLoadingIndicator
              :size="24"
              :paused="paused"
              decorative
              style="--mdv-loading-indicator-active-color: currentColor"
            />
          </template>
          正在保存…
        </MdvButton>
      </div>
      <div
        :aria-busy="loading"
        class="grid min-h-52 place-items-center rounded-mdv-large bg-mdv-surface-container-low p-6"
      >
        <MdvLoadingIndicator
          v-if="loading"
          :contained="contained"
          :paused="paused"
          label="正在加载推荐内容"
        />
        <div v-else class="space-y-2 text-center">
          <p class="text-mdv-title-medium">为你推荐</p>
          <p class="text-mdv-body-medium text-mdv-on-surface-variant">
            内容就绪后，加载指示器退出。
          </p>
        </div>
      </div>
      <p role="status" class="text-mdv-body-medium text-mdv-on-surface-variant">{{ status }}</p>
    </section>

    <section class="space-y-4">
      <h3 class="text-mdv-title-medium">浅色、深色与局部主题</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="theme in ['light', 'dark']"
          :key="theme"
          :data-mdv-theme="theme"
          class="flex min-h-44 items-center justify-center gap-8 rounded-mdv-large bg-mdv-surface p-6"
        >
          <MdvLoadingIndicator :paused="paused" :label="`${theme} 主题正在加载`" />
          <MdvLoadingIndicator contained :paused="paused" :label="`${theme} 主题正在刷新`" />
        </div>
        <div
          class="flex min-h-44 items-center justify-center gap-8 rounded-mdv-large bg-mdv-surface-container-low p-6"
          style="
            --mdv-loading-indicator-active-color: var(--mdv-sys-color-on-tertiary-container);
            --mdv-loading-indicator-container-color: var(--mdv-sys-color-tertiary-container);
          "
        >
          <MdvLoadingIndicator contained :paused="paused" label="自定义颜色正在加载" />
          <span class="text-mdv-label-large">局部颜色覆盖</span>
        </div>
        <div
          dir="rtl"
          class="flex min-h-44 items-center justify-center gap-4 rounded-mdv-large bg-mdv-surface-container-low p-6"
        >
          <MdvLoadingIndicator :paused="paused" label="正在加载更多内容" />
          <span class="text-mdv-label-large">正在加载更多内容 / Loading more content</span>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-mdv-title-medium">缓存与系统动效偏好</h3>
      <MdvSwitch v-model="cached" label="显示缓存中的加载指示器" />
      <div
        class="grid min-h-36 place-items-center rounded-mdv-large bg-mdv-surface-container-low p-6"
      >
        <KeepAlive>
          <MdvLoadingIndicator
            v-if="cached"
            key="cached-indicator"
            contained
            :paused="paused"
            label="缓存内容正在加载"
          />
          <p
            v-else
            key="cached-placeholder"
            class="text-mdv-body-medium text-mdv-on-surface-variant"
          >
            预览已隐藏
          </p>
        </KeepAlive>
      </div>
      <p class="max-w-3xl text-mdv-body-medium text-mdv-on-surface-variant">
        开启系统的“减少动态效果”后，图形保持静止，加载名称仍然可读。切走页面或隐藏窗口时停止动画，重新显示时继续。
      </p>
    </section>
  </div>
</template>
