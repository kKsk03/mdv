<script setup lang="ts">
import { ref } from 'vue'
import notifications from '@iconify-icons/material-symbols/notifications-outline'
import mail from '@iconify-icons/material-symbols/mail-outline'
import { MdvBadge, MdvButton, MdvIcon, MdvIconButton } from '@/index'

const variant = ref<'small' | 'large'>('small')
const content = ref<string | number>(3)
const visible = ref(true)
const clicks = ref(0)

function increment() {
  clicks.value += 1
  content.value = clicks.value
}
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="badge-basic-title" class="space-y-4">
      <h2 id="badge-basic-title" class="text-mdv-title-large">两种官方形态</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        Small 只显示 6px 圆点；Large 显示最小 16px 高度的数字或短文本。徽标不抢点击，也不会进入 Tab
        顺序。
      </p>
      <div
        class="flex flex-wrap items-center gap-8 rounded-mdv-large bg-mdv-surface-container-low p-6"
      >
        <div class="grid justify-items-center gap-3">
          <MdvBadge aria-label="有未读消息">
            <MdvIconButton variant="standard" aria-label="通知">
              <MdvIcon :icon="notifications" />
            </MdvIconButton>
          </MdvBadge>
          <span class="text-mdv-label-medium">Small 圆点</span>
        </div>

        <div class="grid justify-items-center gap-3">
          <MdvBadge variant="large" :content="content" aria-label="未读消息数量">
            <MdvIconButton variant="standard" aria-label="邮件">
              <MdvIcon :icon="mail" />
            </MdvIconButton>
          </MdvBadge>
          <span class="text-mdv-label-medium">Large {{ content }}</span>
        </div>

        <div class="grid justify-items-center gap-3">
          <MdvBadge variant="large" content="99+" aria-label="超过 99 条未读消息">
            <MdvButton variant="tonal">查看消息</MdvButton>
          </MdvBadge>
          <span class="text-mdv-label-medium">短文本</span>
        </div>

        <div class="grid justify-items-center gap-3">
          <MdvBadge variant="large" :content="0" aria-label="没有未读消息">
            <div class="badge-playground-avatar" aria-hidden="true">A</div>
          </MdvBadge>
          <span class="text-mdv-label-medium">数字 0 也会显示</span>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="badge-controls-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="badge-controls-title" class="text-mdv-title-large">状态与交互</h2>
      <div class="flex flex-wrap items-end gap-4">
        <label class="grid gap-2 text-mdv-label-large">
          形态
          <select v-model="variant" class="playground-control">
            <option value="small">Small 圆点</option>
            <option value="large">Large 内容</option>
          </select>
        </label>
        <label class="grid gap-2 text-mdv-label-large">
          内容
          <input v-model="content" class="playground-control w-28" type="text" />
        </label>
        <MdvButton variant="outlined" @click="visible = !visible">
          {{ visible ? '隐藏徽标' : '显示徽标' }}
        </MdvButton>
        <MdvButton @click="increment">点击外层内容（{{ clicks }}）</MdvButton>
      </div>
      <div class="flex flex-wrap items-center gap-5 rounded-mdv-large bg-mdv-surface-container p-6">
        <MdvBadge :variant="variant" :content="content" :visible="visible" aria-label="当前徽标">
          <MdvButton variant="outlined" @click="increment">徽标不会拦截点击</MdvButton>
        </MdvBadge>
        <span class="text-mdv-body-medium text-mdv-on-surface-variant">
          外层点击次数：{{ clicks }}；当前 {{ visible ? '显示' : '隐藏' }}。
        </span>
      </div>
    </section>

    <section
      aria-labelledby="badge-layout-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="badge-layout-title" class="text-mdv-title-large">RTL、主题与边界</h2>
      <div class="grid gap-5 md:grid-cols-2">
        <div
          dir="rtl"
          class="flex min-w-0 items-center justify-between gap-6 rounded-mdv-large bg-mdv-surface-container-low p-6"
        >
          <MdvBadge variant="large" content="חדש" aria-label="הודעות חדשות">
            <MdvButton variant="tonal">RTL 操作</MdvButton>
          </MdvBadge>
          <span class="text-mdv-body-medium">逻辑方向下徽标仍定位在 top-end</span>
        </div>
        <div
          data-mdv-theme="dark"
          class="flex min-w-0 items-center justify-between gap-6 rounded-mdv-large bg-mdv-surface p-6 text-mdv-on-surface"
        >
          <MdvBadge variant="large" content="7" aria-label="7 条通知">
            <MdvIconButton variant="filled" aria-label="深色主题通知">
              <MdvIcon :icon="notifications" />
            </MdvIconButton>
          </MdvBadge>
          <span class="text-mdv-body-medium">深色主题与局部种子色</span>
        </div>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        Large 没有 content 时不会渲染空徽标；visible=false 只隐藏指示器，包裹内容保持原样。
      </p>
    </section>
  </div>
</template>

<style scoped>
.badge-playground-avatar {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: var(--mdv-sys-shape-corner-full);
  background: var(--mdv-sys-color-primary-container);
  color: var(--mdv-sys-color-on-primary-container);
  font-weight: var(--mdv-sys-typescale-title-medium-weight);
}
</style>
