<script setup lang="ts">
import { ref } from 'vue'
import person from '@iconify-icons/material-symbols/person-outline'
import security from '@iconify-icons/material-symbols/security'
import settings from '@iconify-icons/material-symbols/settings-outline'
import notifications from '@iconify-icons/material-symbols/notifications-outline'
import more from '@iconify-icons/material-symbols/more-vert'
import {
  MdvCheckbox,
  MdvIcon,
  MdvIconButton,
  MdvList,
  MdvListItem,
  MdvListSubheader,
  MdvSwitch,
} from '@/index'
import type { MdvListDivider, MdvListLayout, MdvListModelValue, MdvListVariant } from '@/index'

const matrices = [
  {
    id: 'expressive-standard',
    variant: 'expressive',
    layout: 'standard',
    title: 'Expressive · Standard',
  },
  {
    id: 'expressive-segmented',
    variant: 'expressive',
    layout: 'segmented',
    title: 'Expressive · Segmented',
  },
  {
    id: 'baseline-standard',
    variant: 'baseline',
    layout: 'standard',
    title: 'Baseline · Standard',
  },
  {
    id: 'baseline-segmented',
    variant: 'baseline',
    layout: 'segmented',
    title: 'Baseline · Segmented',
  },
] as const
const matrixSelection = ref<Record<(typeof matrices)[number]['id'], MdvListModelValue>>({
  'expressive-standard': 3,
  'expressive-segmented': 3,
  'baseline-standard': 3,
  'baseline-segmented': 3,
})
const rowLines = [1, 2, 3] as const
const single = ref<MdvListModelValue>('security')
const multiple = ref<MdvListModelValue>(['updates'])
const variant = ref<MdvListVariant>('expressive')
const layout = ref<MdvListLayout>('standard')
const dividers = ref<MdvListDivider>('inset')
const wifi = ref(true)
const saved = ref(false)
const actionMessage = ref('尚未操作')
const disableActions = ref(false)
const showSection = ref(true)
const thumbnail =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAMGSURBVHhe7dFVWlxBFEXhmnHc3ZVI31s3CjTQ0AaNu0NIiLuSEJnIyXeqTt0p7Jf9sCbwL7enu5C91j6tp5D91oGeQg5ah3pjh3sLOWIdrRZyzDpeLeREX+xkXyGntP5CTvcXcsY6qw0Ucs46P+DlgnWxFrtU83LZujIYu2pdG/Jy3bqh1b3crHvpsm5pDS+3rTsNL3etSjOWNb3klm96KVqxey0v960HLS8P27FHbS+Pre7hWI/VO5JL1erTOrn0d3IZsGraaC6D1tBoLnWrMRZzxMfhN9MA4mPwWzqA+Dj8OID4MPy2DiA+Dr89bgOIj8Ef1gHEx+GHAcTH4Y+kAcTH4Hd0APFx+OUA4mPwRydyccTH4YcBxMfhj6UBxMfgj+sA4uPwwwDi4/AnJm0A8TH4kzqA+Dj8MID4OPypNID4GPzpqVwc8XH4YQDxcfgzYQDxYfizOoD4OPzZ6Vwc8XH4c2kA8TH48zqA+Dj8OID4MPwFHUB8HP7CjA0gPgZ/UQcQH4cfBhAfh780k8UBxMfgL+sA4uPwywHEx+CvzGbiiI/DDwOIj8NfTQOIj8Ff0wHEx+GXA4iPwV+fy8QRH4dfDiA+Bn9DBxAfhx8GEB+HvzlvA4iPwX+iA4iPw48DiA/D39IBxMfhby1k4oiPw3+aBhAfg/9MBxAfhx8HEB+Gv60DiI/D3160AcTH4D/XAcTH4YcBxMfhv0gDiI/Bf6kDiI/DLwcQH4P/aikTR3wcfhhAfBz+6zSA+Bj8NzqA+Dj8MID4OPy3aQDxMfjvljNxxMfhhwHEx+G/TwOIj8H/oAOIj8MPA4iPw/+YBhAfg/9pJRNHfBx+GEB8HP7nNID4GPwvOoD4OPxyAPEx+F9XM3HEx+GXA4iPwf+mA4iPww8DiI/D/75WiQOIj8H/oQOIj8OPA4gPw9/RAcTH4e+sV8QRH4f/Mw0gPgb/lw4gPg4/DiA+DH9XBxAfh7+7YQOIj8H/rQOIj8MPA4iPw/+TBhAfg/9XBxAfh18OID4G/99mRf4Dnu4g+LcHgrQAAAAASUVORK5CYII='

function supporting(lines: 1 | 2 | 3) {
  if (lines === 1) return undefined
  return lines === 2
    ? 'Supporting text'
    : 'Supporting text that wraps onto a second line when the available space is limited.'
}
</script>

<template>
  <div class="space-y-10">
    <section aria-labelledby="list-matrix-title" class="space-y-4">
      <div>
        <h2 id="list-matrix-title" class="text-mdv-title-large">Standard / Segmented</h2>
        <p class="mt-1 text-mdv-body-medium text-mdv-on-surface-variant">
          四组使用相同内容，初始选中第三项。点击切换；用键盘检查焦点，按住检查形状。 Standard
          普通项透明，Segmented 普通项有背景。
        </p>
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <article
          v-for="demo in matrices"
          :key="demo.id"
          class="min-w-0 rounded-mdv-large border border-mdv-outline-variant p-4"
        >
          <h3 class="mb-4 text-mdv-title-medium">{{ demo.title }}</h3>
          <div class="list-demo-stage">
            <MdvList
              v-model="matrixSelection[demo.id]"
              selection-mode="single"
              :variant="demo.variant"
              :layout="demo.layout"
              :aria-label="demo.title"
              class="mx-auto w-full max-w-80"
            >
              <MdvListItem
                v-for="index in 6"
                :key="index"
                :value="index"
                headline="List item"
                :icon="settings"
                trailing-text="⌘C"
              />
            </MdvList>
          </div>
        </article>
      </div>
    </section>

    <section aria-labelledby="list-content-title" class="space-y-4">
      <div>
        <h2 id="list-content-title" class="text-mdv-title-large">行高与内容</h2>
        <p class="mt-1 text-mdv-body-medium text-mdv-on-surface-variant">
          最小高度 56 / 72 / 88px。图标 24px、头像 40px、图片 56px；较大的媒体可撑高条目。
          三行内容顶部对齐，辅助文字最多两行。
        </p>
      </div>
      <div class="grid gap-6 xl:grid-cols-3">
        <article
          v-for="line in rowLines"
          :key="line"
          class="min-w-0 rounded-mdv-large border border-mdv-outline-variant p-3"
        >
          <h3 class="px-3 py-2 text-mdv-title-medium">{{ line }} line</h3>
          <MdvList :lines="line" :aria-label="line + ' 行内容'">
            <MdvListItem
              headline="Headline"
              :supporting-text="supporting(line)"
              :icon="person"
              trailing-text="100+"
            />
            <MdvListItem
              headline="Avatar"
              :supporting-text="supporting(line)"
              avatar-name="林"
              :trailing-icon="more"
            />
            <MdvListItem
              headline="Image"
              :supporting-text="supporting(line)"
              :image="thumbnail"
              trailing="checkbox"
              :trailing-value="true"
            />
          </MdvList>
        </article>
      </div>
      <MdvList layout="segmented" aria-label="完整文字结构">
        <MdvListItem
          :lines="3"
          overline="OVERLINE"
          headline="主标题和辅助文字"
          supporting-text="上方标签、主标题、辅助文字使用各自的排版层级。"
          :icon="security"
          trailing-text="12:30"
        />
        <MdvListItem headline="自定义内容插槽" avatar-name="周">
          <template #content>
            <span class="text-mdv-body-large">项目同步</span>
            <span class="text-mdv-body-medium text-mdv-on-surface-variant"
              >可以组合自己需要的正文内容。</span
            >
          </template>
        </MdvListItem>
      </MdvList>
    </section>

    <section aria-labelledby="list-selection-title" class="space-y-4">
      <div>
        <h2 id="list-selection-title" class="text-mdv-title-large">选择与键盘</h2>
        <p class="mt-1 text-mdv-body-medium text-mdv-on-surface-variant">
          Tab 进入选中项，方向键移动，Home / End 跳转，Space / Enter 选择。
          单选再次点击保持选中，多选可以取消；禁用项跳过。
        </p>
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <article>
          <h3 class="mb-2 text-mdv-title-medium">单选 · leading radio</h3>
          <MdvList v-model="single" selection-mode="single" aria-label="单选设置">
            <MdvListItem
              value="account"
              headline="个人资料"
              supporting-text="管理公开信息"
              leading="radio"
            />
            <MdvListItem
              value="security"
              headline="安全设置"
              supporting-text="密码和登录验证"
              leading="radio"
            />
            <MdvListItem
              value="disabled"
              headline="暂不可用"
              supporting-text="禁用项不会改变选择"
              leading="radio"
              disabled
            />
            <MdvListItem
              value="notifications"
              headline="通知设置"
              supporting-text="提醒与活动"
              leading="radio"
            />
          </MdvList>
          <p class="mt-2 text-mdv-body-medium">当前值：{{ single ?? '无' }}</p>
        </article>
        <article>
          <h3 class="mb-2 text-mdv-title-medium">多选 · trailing checkbox</h3>
          <MdvList
            v-model="multiple"
            selection-mode="multiple"
            layout="segmented"
            aria-label="通知类型"
          >
            <MdvListItem
              value="updates"
              headline="产品更新"
              :icon="notifications"
              trailing="checkbox"
            />
            <MdvListItem
              value="security"
              headline="安全提醒"
              :icon="security"
              trailing="checkbox"
            />
            <MdvListItem value="account" headline="账户消息" :icon="person" trailing="checkbox" />
          </MdvList>
          <p class="mt-2 text-mdv-body-medium">
            当前值：{{ Array.isArray(multiple) ? multiple.join('、') || '无' : '无' }}
          </p>
        </article>
      </div>
    </section>

    <section aria-labelledby="list-actions-title" class="space-y-4">
      <div>
        <h2 id="list-actions-title" class="text-mdv-title-large">原生主操作与独立操作</h2>
        <p class="mt-1 text-mdv-body-medium text-mdv-on-surface-variant">
          普通列表的按钮、链接和独立控件各自进入 Tab 顺序。操作区域共享条目背景；
          点击复选框、开关或更多按钮时，不触发主操作。
        </p>
      </div>
      <div class="flex flex-wrap gap-4">
        <label class="grid gap-2 text-mdv-label-large">
          变体
          <select v-model="variant" class="playground-control">
            <option value="expressive">Expressive</option>
            <option value="baseline">Baseline</option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          布局
          <select v-model="layout" class="playground-control">
            <option value="standard">Standard</option>
            <option value="segmented">Segmented</option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          分隔线
          <select v-model="dividers" class="playground-control">
            <option value="none">无</option>
            <option value="full-width">Full width</option>
            <option value="inset">Inset</option>
          </select>
        </label>
        <MdvCheckbox v-model="disableActions" label="禁用操作行" />
      </div>
      <MdvList :variant="variant" :layout="layout" :dividers="dividers" aria-label="操作列表">
        <MdvListItem
          interactive
          headline="保存项目"
          supporting-text="点击正文打开项目"
          :selected="saved"
          :disabled="disableActions"
          @click="actionMessage = '主操作：打开项目'"
        >
          <template #leading-action="{ disabled: itemDisabled }">
            <MdvCheckbox v-model="saved" :disabled="itemDisabled" aria-label="保存这个项目" />
          </template>
          <template #trailing-action="{ disabled: itemDisabled }">
            <MdvIconButton
              variant="standard"
              :disabled="itemDisabled"
              aria-label="项目更多操作"
              @click="actionMessage = '独立操作：更多'"
            >
              <MdvIcon :icon="more" />
            </MdvIconButton>
          </template>
        </MdvListItem>
        <MdvListItem
          interactive
          headline="Wi-Fi"
          supporting-text="点击正文查看网络设置"
          :icon="settings"
          :disabled="disableActions"
          @click="actionMessage = '主操作：网络设置'"
        >
          <template #trailing-action="{ disabled: itemDisabled }">
            <MdvSwitch v-model="wifi" :disabled="itemDisabled" aria-label="启用 Wi-Fi" />
          </template>
        </MdvListItem>
        <MdvListItem
          href="#list-matrix-title"
          headline="回到视觉矩阵"
          supporting-text="原生链接；可以使用 target、rel、下载等属性"
          :icon="security"
        />
        <MdvListItem
          headline="静态信息"
          supporting-text="没有按钮角色，不占用 Tab 入口"
          :icon="person"
          trailing-text="只读"
        />
        <MdvListItem interactive disabled headline="不可用的操作" :icon="notifications" />
      </MdvList>
      <p class="text-mdv-body-medium" aria-live="polite">
        {{ actionMessage }}；Wi-Fi：{{ wifi ? '开' : '关' }}；已保存：{{ saved ? '是' : '否' }}
      </p>
    </section>

    <section aria-labelledby="list-group-title" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 id="list-group-title" class="text-mdv-title-large">分组、窄容器与 RTL</h2>
        <MdvCheckbox v-model="showSection" label="显示分组标题" />
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <article class="min-w-0">
          <MdvList layout="segmented" aria-label="分段分组">
            <MdvListItem headline="第一组首项" :icon="person" interactive />
            <MdvListItem headline="第一组末项" :icon="security" interactive />
            <MdvListSubheader v-if="showSection">下一组</MdvListSubheader>
            <MdvListItem headline="第二组首项" :icon="notifications" interactive />
            <MdvListItem headline="第二组末项" :icon="settings" interactive />
          </MdvList>
        </article>
        <article class="min-w-0">
          <div class="w-80 max-w-full rounded-mdv-large border border-mdv-outline-variant">
            <MdvList layout="segmented" aria-label="窄容器长文本">
              <MdvListItem
                :lines="3"
                headline="这是一条足够长的中文主标题，用来检查省略"
                supporting-text="辅助文字在三行条目中可以换成两行，超过空间的部分保持省略，尾部图标和控件不会被文字挤走。"
                :icon="notifications"
                :trailing-icon="more"
              />
              <MdvListItem
                :lines="3"
                headline="Long English headline without horizontal overflow"
                supporting-text="LongUnbrokenSupportingTextToCheckWrappingAndAvoidHorizontalOverflowInsideTheListItem"
                :icon="security"
                trailing-text="⌘C"
              />
            </MdvList>
          </div>
        </article>
        <article dir="rtl" class="min-w-0 rounded-mdv-large border border-mdv-outline-variant">
          <MdvList layout="segmented" aria-label="RTL 内容与控件">
            <MdvListItem
              headline="الإشعارات"
              supporting-text="管理通知与提醒"
              :icon="notifications"
              trailing="switch"
              :trailing-value="true"
            />
            <MdvListItem
              headline="الحساب"
              supporting-text="头像与文字随逻辑方向反转"
              avatar-name="林"
              trailing="checkbox"
              :trailing-value="true"
            />
            <MdvListItem
              headline="الأمان"
              :icon="security"
              trailing="radio"
              :trailing-value="true"
            />
          </MdvList>
        </article>
        <article class="min-w-0">
          <MdvList layout="segmented" aria-label="前置与尾部指示器">
            <MdvListItem
              headline="Leading checkbox"
              leading="checkbox"
              :leading-value="true"
              trailing-text="只读指示"
            />
            <MdvListItem
              headline="Trailing radio"
              :icon="person"
              trailing="radio"
              :trailing-value="true"
            />
            <MdvListItem
              headline="Trailing switch"
              :icon="notifications"
              trailing="switch"
              :trailing-value="false"
            />
          </MdvList>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.list-demo-stage {
  border-radius: var(--mdv-sys-shape-corner-medium);
  background-color: var(--mdv-sys-color-surface-container-lowest);
  background-image: radial-gradient(var(--mdv-sys-color-outline-variant) 0.7px, transparent 0.7px);
  background-size: 8px 8px;
  padding: 16px;
}
</style>
