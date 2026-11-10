<script setup lang="ts">
import { ref } from 'vue'
import favorite from '@iconify-icons/material-symbols/favorite-outline'
import refresh from '@iconify-icons/material-symbols/refresh'
import info from '@iconify-icons/material-symbols/info-outline'
import {
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvIcon,
  MdvIconButton,
  MdvMenu,
  MdvMenuItem,
  MdvRichTooltip,
  MdvTooltip,
} from '@/index'
import type { MdvTooltipCloseDetail, MdvTooltipPlacement } from '@/index'

const disabled = ref(false)
const openDelay = ref(600)
const closeDelay = ref(0)
const controlled = ref(false)
const dialog = ref(false)
const favoriteCount = ref(0)
const result = ref('尚未执行操作')
const events = ref<string[]>([])
const configurations = [
  { title: true, actions: 2, label: '标题、正文、两个操作' },
  { title: true, actions: 1, label: '标题、正文、一个操作' },
  { title: true, actions: 0, label: '标题和正文' },
  { title: false, actions: 1, label: '正文和一个操作' },
  { title: false, actions: 2, label: '正文和两个操作' },
]
const placements: MdvTooltipPlacement[] = [
  'top-start',
  'top',
  'top-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
  'right-start',
  'right',
  'right-end',
]

function record(event: string) {
  events.value = [event, ...events.value].slice(0, 6)
}
function closed(detail: MdvTooltipCloseDetail) {
  record('closed：' + detail.reason)
}
function action(text: string, close: () => void) {
  result.value = text
  close()
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">Plain 普通提示</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        悬停、键盘聚焦或触屏长按查看。普通提示在鼠标移开后直接收起；触屏抬手后保留 1.5
        秒。图标按钮仍有自己的名称。
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-5">
        <MdvTooltip text="刷新当前内容">
          <template #trigger="{ triggerProps }">
            <MdvIconButton
              v-bind="triggerProps"
              variant="standard"
              aria-label="刷新"
              @click="result = '已刷新'"
            >
              <MdvIcon :icon="refresh" />
            </MdvIconButton>
          </template>
        </MdvTooltip>
        <MdvTooltip text="加入收藏">
          <template #trigger="{ triggerProps }">
            <MdvIconButton
              v-bind="triggerProps"
              variant="tonal"
              aria-label="收藏"
              @click="favoriteCount++"
            >
              <MdvIcon :icon="favorite" />
            </MdvIconButton>
          </template>
        </MdvTooltip>
        <MdvTooltip
          text="说明较长时按可用宽度自然换行。This description also checks wrapping of longer English text."
        >
          <template #trigger="{ triggerProps }">
            <MdvIconButton v-bind="triggerProps" variant="standard" aria-label="查看说明">
              <MdvIcon :icon="info" />
            </MdvIconButton>
          </template>
        </MdvTooltip>
        <MdvTooltip text="当前账户没有编辑权限" :offset="8">
          <template #trigger="{ triggerProps }">
            <span
              v-bind="triggerProps"
              tabindex="0"
              class="cursor-help border-b border-dotted border-mdv-outline"
              >权限说明</span
            >
          </template>
        </MdvTooltip>
      </div>
      <p class="mt-4 text-mdv-body-medium">收藏操作：{{ favoriteCount }} 次；{{ result }}</p>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">Rich 五种内容组合</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        悬停或聚焦查看。从触发器移向提示预留 120ms，移入提示后可继续阅读；Tab
        可依次进入链接和文字按钮，Esc 只关闭提示。
      </p>
      <div class="mt-6 flex flex-wrap gap-4">
        <MdvRichTooltip
          v-for="configuration in configurations"
          :key="configuration.label"
          :title="configuration.title ? '云端备份' : undefined"
          aria-label="云端备份说明"
        >
          <template #trigger="{ triggerProps }">
            <MdvButton v-bind="triggerProps" variant="outlined">{{
              configuration.label
            }}</MdvButton>
          </template>
          将文件保存在云端，以便在其他设备上继续使用。<a
            href="https://m3.material.io/components/tooltips/guidelines"
            target="_blank"
            rel="noopener noreferrer"
            >了解详情</a
          >
          <template v-if="configuration.actions" #actions="{ close }">
            <MdvButton variant="text" @click="action('已启用云端备份', close)">启用</MdvButton>
            <MdvButton v-if="configuration.actions === 2" variant="text" @click="close"
              >稍后</MdvButton
            >
          </template>
        </MdvRichTooltip>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">点击持久提示与受控开关</h2>
      <div class="mt-6 flex flex-wrap items-center gap-4">
        <MdvRichTooltip
          persistent
          title="新的整理方式"
          text="点击触发后保留显示。可以使用操作按钮，也可以点击或聚焦其他区域关闭。"
        >
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="tonal">了解新功能</MdvButton></template
          >
          <template #actions="{ close }"
            ><MdvButton variant="text" @click="close">知道了</MdvButton></template
          >
        </MdvRichTooltip>
        <MdvRichTooltip
          v-model="controlled"
          persistent
          title="受控提示"
          text="由 v-model 打开与关闭，也响应外部交互和 Escape。打开时保持原焦点。"
          @open="record('open')"
          @opened="record('opened')"
          @close="record('close：' + $event.reason)"
          @closed="closed"
        >
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="outlined">受控触发器</MdvButton></template
          >
          <template #actions="{ close }"
            ><MdvButton variant="text" @click="close">关闭</MdvButton></template
          >
        </MdvRichTooltip>
        <MdvButton variant="text" @click="controlled = !controlled">切换受控值</MdvButton>
      </div>
      <p class="mt-4 text-mdv-body-medium">当前模型：{{ controlled }}</p>
      <ol class="mt-2 text-mdv-body-small text-mdv-on-surface-variant">
        <li v-for="(event, index) in events" :key="index">{{ event }}</li>
      </ol>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">方向、延迟与禁用提示</h2>
      <div class="mt-5 flex flex-wrap items-end gap-5">
        <label class="grid gap-2 text-mdv-label-large"
          >打开延迟（ms）<input
            v-model.number="openDelay"
            class="playground-control w-36"
            type="number"
            min="0"
            step="100"
        /></label>
        <label class="grid gap-2 text-mdv-label-large"
          >关闭延迟（ms）<input
            v-model.number="closeDelay"
            class="playground-control w-36"
            type="number"
            min="0"
            step="100"
        /></label>
        <MdvCheckbox v-model="disabled" label="禁用提示" />
      </div>
      <div class="mt-6 flex flex-wrap gap-4">
        <MdvTooltip
          v-for="placement in placements"
          :key="placement"
          :placement="placement"
          :text="placement + '：靠近视口边缘时自动翻转。'"
          :open-delay="openDelay"
          :close-delay="closeDelay"
          :disabled="disabled"
        >
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="text">{{ placement }}</MdvButton></template
          >
        </MdvTooltip>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">局部深色、RTL 与滚动容器</h2>
      <div class="mt-5 grid gap-5 md:grid-cols-2">
        <div
          data-mdv-theme="dark"
          class="rounded-mdv-medium bg-mdv-surface p-6 text-mdv-on-surface"
        >
          <MdvRichTooltip
            title="局部深色"
            text="提示继承当前容器的颜色角色；页面整体切换主题后也可以继续对照。"
          >
            <template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="tonal">查看深色提示</MdvButton></template
            >
            <template #actions="{ close }"
              ><MdvButton variant="text" @click="close">知道了</MdvButton></template
            >
          </MdvRichTooltip>
        </div>
        <div dir="rtl" class="rounded-mdv-medium bg-mdv-surface-container p-6">
          <MdvRichTooltip
            title="معلومات إضافية"
            text="تحقق من اتجاه النص ومحاذاة الأزرار عند استخدام اللغة العربية."
          >
            <template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="outlined"
                >عرض التفاصيل</MdvButton
              ></template
            >
            <template #actions="{ close }"
              ><MdvButton variant="text" @click="close">حسنًا</MdvButton></template
            >
          </MdvRichTooltip>
        </div>
      </div>
      <div class="mt-5 h-44 overflow-auto rounded-mdv-medium border border-mdv-outline-variant p-4">
        <p class="text-mdv-body-medium">在这个容器内滚动，检查提示跟随与边缘位置。</p>
        <div class="flex h-80 items-center justify-between gap-4">
          <MdvTooltip text="靠近左边缘的说明"
            ><template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="outlined">左侧</MdvButton></template
            ></MdvTooltip
          >
          <MdvTooltip text="靠近右边缘的说明"
            ><template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="outlined">右侧</MdvButton></template
            ></MdvTooltip
          >
        </div>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">Menu 与 Dialog 内组合</h2>
      <div class="mt-5 flex flex-wrap gap-4">
        <MdvMenu>
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="outlined">带说明的菜单</MdvButton></template
          >
          <MdvTooltip text="将此项目从列表移除；之后可以在回收站恢复。">
            <template #trigger="{ triggerProps }"
              ><MdvMenuItem
                v-bind="triggerProps"
                label="移到回收站"
                @select="result = '已移到回收站'"
            /></template>
          </MdvTooltip>
          <MdvMenuItem label="取消" />
        </MdvMenu>
        <MdvButton variant="tonal" @click="dialog = true">在 Dialog 中查看</MdvButton>
      </div>
      <MdvDialog v-model="dialog" title="提示与对话框" role="dialog">
        <p>聚焦下方按钮，再按 Tab 进入提示内容。第一次 Esc 关闭提示，第二次关闭对话框。</p>
        <div class="mt-5">
          <MdvRichTooltip title="同步选项">
            <template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="outlined"
                >查看同步说明</MdvButton
              ></template
            >
            只同步你选中的文件夹，其他内容继续保存在本机。
            <template #actions="{ close }"
              ><MdvButton variant="text" @click="close">明白了</MdvButton></template
            >
          </MdvRichTooltip>
        </div>
        <template #actions="{ close }"
          ><MdvButton variant="text" @click="close()">关闭</MdvButton></template
        >
      </MdvDialog>
    </section>
  </div>
</template>
