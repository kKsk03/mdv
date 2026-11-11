<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import flight from '@iconify-icons/material-symbols/flight'
import luggage from '@iconify-icons/material-symbols/luggage-outline'
import explore from '@iconify-icons/material-symbols/explore-outline'
import shoppingBag from '@iconify-icons/material-symbols/shopping-bag-outline'
import {
  MdvBadge,
  MdvButton,
  MdvCheckbox,
  MdvDialog,
  MdvIcon,
  MdvSlider,
  MdvTab,
  MdvTabPanel,
  MdvTabs,
} from '@/index'
import type {
  MdvSliderModelValue,
  MdvTabValue,
  MdvTabsActivation,
  MdvTabsTabNavigation,
} from '@/index'

const destinations = [
  { value: 'flights', label: '航班', icon: flight, text: '查看航班时间、出发地与目的地。' },
  { value: 'trips', label: '行程', icon: luggage, text: '在这里整理已预订的旅行计划。' },
  { value: 'explore', label: '探索', icon: explore, text: '发现适合下一次出发的地方。' },
  { value: 'buy', label: '购物', icon: shoppingBag, text: '查看旅途中值得收藏的商品。' },
]
const variants = ['primary', 'secondary'] as const
const primary = ref<MdvTabValue>('flights')
const secondary = ref<MdvTabValue>('overview')
const icons = ref<MdvTabValue>('flights')
const badgeTab = ref<MdvTabValue>('flights')
const badgeCount = ref(3)
const badgeVisible = ref(true)
const longLabels = [
  '全部',
  '设计与交互规范',
  'Component implementation',
  '质量与可访问性检查',
  '文档及真实包消费验证',
  '已归档的历史记录',
]
const scroll = ref<MdvTabValue>(0)
const keyboard = ref<MdvTabValue>('flights')
const activation = ref<MdvTabsActivation>('manual')
const tabNavigation = ref<MdvTabsTabNavigation>('all')
const rtl = ref(false)
const fieldsetDisabled = ref(false)
const keyboardGroup = useTemplateRef<InstanceType<typeof MdvTabs>>('keyboardGroup')
const retained = ref<MdvTabValue>('first')
const lazy = ref<MdvTabValue>('first')
const destroyed = ref<MdvTabValue>('first')
const typed = ref<MdvTabValue>(1)
const dynamic = ref<MdvTabValue>('a')
const dynamicItems = ref(['a', 'b', 'c'])
let itemNumber = 3
const reject = ref(false)
const requestCount = ref(0)
const changeCount = ref(0)
const swiped = ref<MdvTabValue>('flights')
const volume = ref<MdvSliderModelValue>(40)
const nested = ref<MdvTabValue>('recent')
const dialogOpen = ref(false)
const dialogTab = ref<MdvTabValue>('overview')
const dialogShowDivider = ref(true)

function request(value: MdvTabValue) {
  requestCount.value++
  if (!reject.value) dynamic.value = value
}
function addItem() {
  dynamicItems.value.push(`item-${++itemNumber}`)
}
function removeCurrent() {
  if (dynamicItems.value.length <= 1) return
  const index = dynamicItems.value.indexOf(String(dynamic.value))
  dynamicItems.value = dynamicItems.value.filter((value) => value !== dynamic.value)
  dynamic.value = dynamicItems.value[Math.min(Math.max(0, index), dynamicItems.value.length - 1)]!
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="tabs-basic-title" class="space-y-4">
      <h2 id="tabs-basic-title" class="text-mdv-title-large">Primary 与 Secondary</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        主标签页用于主要分类，次级标签页用于内容内部的进一步分类。
      </p>
      <MdvTabs v-model="primary" aria-label="旅行主要分类">
        <MdvTab
          v-for="item in destinations"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
        <template #panels>
          <MdvTabPanel
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            class="p-5"
          >
            <p class="text-mdv-title-medium">{{ item.label }}</p>
            <p class="mt-2 text-mdv-body-medium">{{ item.text }}</p>
          </MdvTabPanel>
        </template>
      </MdvTabs>
      <MdvTabs v-model="secondary" variant="secondary" aria-label="旅行内容分类">
        <MdvTab value="overview" label="概览" />
        <MdvTab value="details" label="详细信息" />
        <template #panels>
          <MdvTabPanel value="overview" class="p-5">行程摘要与待办事项。</MdvTabPanel>
          <MdvTabPanel value="details" class="p-5">查看航班、酒店与出行提醒。</MdvTabPanel>
        </template>
      </MdvTabs>
    </section>

    <section
      aria-labelledby="tabs-icons-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-icons-title" class="text-mdv-title-large">图标与排列</h2>
      <div v-for="variant in variants" :key="variant" class="space-y-2">
        <p class="text-mdv-label-large">{{ variant }} · 默认排列</p>
        <MdvTabs v-model="icons" :variant="variant" :aria-label="`${variant} 图文分类`">
          <MdvTab
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          >
            <template #icon><MdvIcon :icon="item.icon" /></template>
          </MdvTab>
          <template #panels>
            <MdvTabPanel
              v-for="item in destinations"
              :key="item.value"
              :value="item.value"
              class="p-4"
              >{{ item.text }}</MdvTabPanel
            >
          </template>
        </MdvTabs>
      </div>
      <p class="text-mdv-label-large">Primary · 前置图标</p>
      <MdvTabs v-model="icons" icon-position="leading" aria-label="横排旅行分类">
        <MdvTab
          v-for="item in destinations"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        >
          <template #icon><MdvIcon :icon="item.icon" /></template>
        </MdvTab>
        <template #panels>
          <MdvTabPanel
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            class="p-4"
            >{{ item.text }}</MdvTabPanel
          >
        </template>
      </MdvTabs>
      <p class="text-mdv-label-large">纯图标 · 每项提供可访问名称</p>
      <MdvTabs v-model="icons" aria-label="旅行快捷分类">
        <MdvTab
          v-for="item in destinations"
          :key="item.value"
          :value="item.value"
          :aria-label="item.label"
        >
          <template #icon><MdvIcon :icon="item.icon" /></template>
        </MdvTab>
        <template #panels>
          <MdvTabPanel
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            class="p-4"
            >{{ item.text }}</MdvTabPanel
          >
        </template>
      </MdvTabs>
    </section>

    <section
      aria-labelledby="tabs-badges-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-badges-title" class="text-mdv-title-large">徽标与指示线宽度</h2>
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2"
          ><input v-model="badgeVisible" type="checkbox" />显示通知</label
        >
        <MdvButton variant="tonal" @click="badgeCount = badgeCount === 3 ? 999 : 3"
          >切换徽标宽度</MdvButton
        >
      </div>
      <MdvTabs v-model="badgeTab" aria-label="有通知的旅行分类">
        <MdvTab
          v-for="item in destinations"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        >
          <template #badge>
            <MdvBadge
              v-if="item.value === 'flights'"
              variant="large"
              :content="badgeCount"
              :visible="badgeVisible"
              :aria-label="`${badgeCount} 条新通知`"
            />
            <MdvBadge
              v-else-if="item.value === 'trips'"
              :visible="badgeVisible"
              aria-label="有更新"
            />
          </template>
        </MdvTab>
        <template #panels
          ><MdvTabPanel
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            class="p-4"
            >{{ item.text }}</MdvTabPanel
          ></template
        >
      </MdvTabs>
      <MdvTabs v-model="badgeTab" aria-label="图标上的通知">
        <MdvTab
          v-for="item in destinations"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        >
          <template #icon><MdvIcon :icon="item.icon" /></template>
          <template #badge
            ><MdvBadge
              v-if="item.value === 'flights'"
              variant="large"
              content="99+"
              :visible="badgeVisible"
              aria-label="超过 99 条新通知"
          /></template>
        </MdvTab>
        <template #panels
          ><MdvTabPanel
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            class="p-4"
            >{{ item.text }}</MdvTabPanel
          ></template
        >
      </MdvTabs>
    </section>

    <section
      aria-labelledby="tabs-scroll-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-scroll-title" class="text-mdv-title-large">长标题与横向滚动</h2>
      <div class="max-w-lg border border-mdv-outline-variant">
        <MdvTabs v-model="scroll" scrollable aria-label="项目工作分类">
          <MdvTab v-for="(label, index) in longLabels" :key="label" :value="index" :label="label" />
          <template #panels
            ><MdvTabPanel
              v-for="(label, index) in longLabels"
              :key="label"
              :value="index"
              class="p-5"
              >{{ label }}的内容。</MdvTabPanel
            ></template
          >
        </MdvTabs>
      </div>
      <div class="flex flex-wrap gap-3">
        <MdvButton variant="tonal" @click="scroll = 0">第一项</MdvButton
        ><MdvButton variant="tonal" @click="scroll = longLabels.length - 1">最后一项</MdvButton>
      </div>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        触摸或触控板可以横向滚动；键盘聚焦和程序选中会让对应选项进入视野。
      </p>
    </section>

    <section
      aria-labelledby="tabs-keyboard-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-keyboard-title" class="text-mdv-title-large">选择与键盘</h2>
      <div class="flex flex-wrap items-center gap-4">
        <label class="grid gap-2"
          >激活方式<select v-model="activation" class="playground-control">
            <option value="manual">Enter／Space 选中</option>
            <option value="automatic">焦点进入即选中</option>
          </select></label
        >
        <label class="grid gap-2"
          >Tab 导航<select v-model="tabNavigation" class="playground-control">
            <option value="all">逐项访问</option>
            <option value="active">整组一个入口</option>
          </select></label
        >
        <label class="flex items-center gap-2"><input v-model="rtl" type="checkbox" />RTL</label>
        <label class="flex items-center gap-2"
          ><input v-model="fieldsetDisabled" type="checkbox" />禁用 fieldset</label
        >
        <MdvButton variant="tonal" @click="keyboardGroup?.focus()">聚焦当前选项</MdvButton>
      </div>
      <fieldset :disabled="fieldsetDisabled" class="min-w-0" :dir="rtl ? 'rtl' : 'ltr'">
        <legend class="mb-2 text-mdv-label-large">
          左右方向键、Home／End 移动焦点；探索选项已禁用
        </legend>
        <MdvTabs
          ref="keyboardGroup"
          v-model="keyboard"
          :activation="activation"
          :tab-navigation="tabNavigation"
          aria-label="键盘旅行分类"
        >
          <MdvTab
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            :label="item.label"
            :disabled="item.value === 'explore'"
          />
          <template #panels
            ><MdvTabPanel
              v-for="item in destinations"
              :key="item.value"
              :value="item.value"
              class="p-4"
              >{{ item.text }}</MdvTabPanel
            ></template
          >
        </MdvTabs>
      </fieldset>
      <MdvTabs v-model="typed" aria-label="严格区分数字与字符串">
        <MdvTab :value="1" label="数字 1" /><MdvTab value="1" label="字符串 1" />
        <template #panels
          ><MdvTabPanel :value="1" class="p-4">当前模型为 number：{{ typed }}</MdvTabPanel
          ><MdvTabPanel value="1" class="p-4">当前模型为 string：{{ typed }}</MdvTabPanel></template
        >
      </MdvTabs>
    </section>

    <section
      aria-labelledby="tabs-panels-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-panels-title" class="text-mdv-title-large">内容保留、懒挂载与销毁</h2>
      <div class="grid gap-5 lg:grid-cols-3">
        <div
          v-for="mode in ['retained', 'lazy', 'destroyed'] as const"
          :key="mode"
          class="min-w-0 border border-mdv-outline-variant"
        >
          <p class="p-4 text-mdv-label-large">
            {{
              mode === 'retained'
                ? '默认保留'
                : mode === 'lazy'
                  ? '首次访问才挂载，之后保留'
                  : '离开后销毁'
            }}
          </p>
          <MdvTabs
            :model-value="mode === 'retained' ? retained : mode === 'lazy' ? lazy : destroyed"
            variant="secondary"
            :aria-label="`面板生命周期 ${mode}`"
            @update:model-value="
              (value) => {
                if (mode === 'retained') retained = value
                else if (mode === 'lazy') lazy = value
                else destroyed = value
              }
            "
          >
            <MdvTab value="first" label="草稿" /><MdvTab value="second" label="预览" />
            <template #panels>
              <MdvTabPanel
                value="first"
                :lazy="mode === 'lazy'"
                :destroy-on-hide="mode === 'destroyed'"
                class="space-y-3 p-4"
              >
                <label class="grid gap-2 text-mdv-body-medium"
                  >临时草稿<input
                    class="playground-control w-full min-w-0"
                    placeholder="输入后切换至预览，再切回"
                /></label>
              </MdvTabPanel>
              <MdvTabPanel
                value="second"
                :lazy="mode === 'lazy'"
                :destroy-on-hide="mode === 'destroyed'"
                class="p-4"
                >切回草稿以检查输入内容。</MdvTabPanel
              >
            </template>
          </MdvTabs>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="tabs-dynamic-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-dynamic-title" class="text-mdv-title-large">动态项目与受控选择</h2>
      <div class="flex flex-wrap items-center gap-3">
        <MdvButton variant="tonal" @click="addItem">添加</MdvButton>
        <MdvButton variant="tonal" :disabled="dynamicItems.length <= 1" @click="removeCurrent"
          >移除当前项</MdvButton
        >
        <MdvButton variant="tonal" @click="dynamicItems.reverse()">反转顺序</MdvButton>
        <label class="flex items-center gap-2"
          ><input v-model="reject" type="checkbox" />暂不接受选择请求</label
        >
      </div>
      <MdvTabs
        :model-value="dynamic"
        scrollable
        aria-label="动态标签页"
        @update:model-value="request"
        @change="changeCount++"
      >
        <MdvTab
          v-for="value in dynamicItems"
          :key="value"
          :value="value"
          :label="`项目 ${value}`"
        />
        <template #panels
          ><MdvTabPanel v-for="value in dynamicItems" :key="value" :value="value" class="p-5"
            >项目 {{ value }}。</MdvTabPanel
          ></template
        >
      </MdvTabs>
      <p class="text-mdv-body-medium">
        选择请求：{{ requestCount }}；已接受的用户切换：{{ changeCount }}；当前：{{ dynamic }}。
      </p>
    </section>

    <section
      aria-labelledby="tabs-swipe-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-swipe-title" class="text-mdv-title-large">内容横滑与嵌套</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        此组开启触摸横滑。在正文空白处左右滑动切换分类；纵向滚动、内部横向滚动区、输入和滑块各自操作。
      </p>
      <MdvTabs v-model="swiped" swipeable aria-label="可横滑的旅行分类">
        <MdvTab
          v-for="item in destinations"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
        <template #panels>
          <MdvTabPanel
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            class="min-h-56 space-y-5 p-5"
          >
            <p>{{ item.text }} 在此区域横滑。</p>
            <label class="grid max-w-xs gap-2"
              >出行备注<input class="playground-control" placeholder="备注会保留"
            /></label>
            <MdvSlider v-model="volume" label="提醒音量" />
            <div class="overflow-x-auto rounded-mdv-small bg-mdv-surface-container-low p-4">
              <p class="w-max">
                此区域保留原生横向滚动：北京 · 上海 · 广州 · 深圳 · 杭州 · 成都 · 西安 · 南京 · 重庆
                · 昆明 · 厦门 · 长沙。
              </p>
            </div>
            <MdvTabs v-model="nested" variant="secondary" aria-label="内层旅行记录">
              <MdvTab value="recent" label="最近" /><MdvTab value="saved" label="收藏" />
              <template #panels
                ><MdvTabPanel value="recent" class="p-4">最近浏览的记录。</MdvTabPanel
                ><MdvTabPanel value="saved" class="p-4">已收藏的目的地。</MdvTabPanel></template
              >
            </MdvTabs>
          </MdvTabPanel>
        </template>
      </MdvTabs>
    </section>

    <section
      aria-labelledby="tabs-theme-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="tabs-theme-title" class="text-mdv-title-large">局部主题与对话框</h2>
      <div
        data-mdv-theme="dark"
        dir="rtl"
        class="rounded-mdv-medium bg-mdv-surface p-4 text-mdv-on-surface"
        style="--mdv-sys-color-primary: #a8dbc5; --mdv-sys-color-secondary: #b6ccbe"
      >
        <MdvTabs v-model="primary" aria-label="局部深色 RTL 分类">
          <MdvTab
            v-for="item in destinations"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
          <template #panels
            ><MdvTabPanel
              v-for="item in destinations"
              :key="item.value"
              :value="item.value"
              class="p-4"
              >{{ item.text }}</MdvTabPanel
            ></template
          >
        </MdvTabs>
      </div>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <MdvCheckbox v-model="dialogShowDivider" label="显示对话框内标签分割线" />
        <MdvButton @click="dialogOpen = true">打开包含标签页的对话框</MdvButton>
      </div>
      <MdvDialog v-model="dialogOpen" title="旅行信息">
        <MdvTabs
          v-model="dialogTab"
          :show-divider="dialogShowDivider"
          aria-label="对话框中的旅行信息"
        >
          <MdvTab value="overview" label="概览" /><MdvTab value="notes" label="备注" />
          <template #panels
            ><MdvTabPanel value="overview" class="p-4">查看旅行安排。</MdvTabPanel
            ><MdvTabPanel value="notes" class="p-4"
              ><label class="grid gap-2"
                >备注<input class="playground-control" /></label></MdvTabPanel
          ></template>
        </MdvTabs>
        <template #actions
          ><MdvButton variant="text" @click="dialogOpen = false">完成</MdvButton></template
        >
      </MdvDialog>
    </section>
  </div>
</template>
