<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import landscape from '@iconify-icons/material-symbols/landscape-outline'
import favorite from '@iconify-icons/material-symbols/favorite-outline'
import moreVert from '@iconify-icons/material-symbols/more-vert'
import arrowOutward from '@iconify-icons/material-symbols/arrow-outward'
import { MdvButton, MdvCard, MdvCheckbox, MdvIcon, MdvIconButton } from '@/index'
import type { MdvCardVariant } from '@/index'

const variants: { value: MdvCardVariant; label: string }[] = [
  { value: 'outlined', label: 'Outlined 描边' },
  { value: 'filled', label: 'Filled 填充' },
  { value: 'elevated', label: 'Elevated 抬升' },
]
const actionCount = ref(0)
const innerAction = ref('尚未操作。')
const selected = ref(false)
const disabled = ref(true)
const fieldsetDisabled = ref(true)
const dragged = ref(true)
const submits = ref(0)
const actionCard = useTemplateRef<InstanceType<typeof MdvCard>>('actionCard')
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="card-variants-title" class="space-y-4">
      <h2 id="card-variants-title" class="text-mdv-title-large">三种标准外观</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        圆角 12px、内容留白 16px。以下是静态卡片，鼠标经过不会出现整卡状态层或阴影变化。
      </p>
      <div class="grid gap-5 md:grid-cols-3">
        <MdvCard
          v-for="variant in variants"
          :key="variant.value"
          :variant="variant.value"
          :title="variant.label"
          subtitle="周末的慢旅行"
        >
          <p>从城市出发，沿湖边步道寻找一处适合停留的地方。</p>
        </MdvCard>
      </div>
    </section>

    <section
      aria-labelledby="card-content-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="card-content-title" class="text-mdv-title-large">内容插槽与内部操作</h2>
      <div class="grid items-start gap-5 md:grid-cols-2">
        <MdvCard variant="elevated">
          <template #media>
            <div class="card-playground-media" aria-hidden="true">
              <MdvIcon :icon="landscape" :size="72" />
            </div>
          </template>
          <h3 class="text-mdv-title-large text-mdv-on-surface">湖畔小屋</h3>
          <p class="mt-2">媒体可以放在最上方，宽高比由内容决定。卡片容器适应内容高度。</p>
          <template #actions>
            <MdvIconButton
              variant="standard"
              aria-label="收藏湖畔小屋"
              @click="innerAction = '已点击收藏。'"
            >
              <MdvIcon :icon="favorite" />
            </MdvIconButton>
            <MdvButton variant="text" @click="innerAction = '已点击了解更多。'">
              了解更多
            </MdvButton>
          </template>
        </MdvCard>
        <MdvCard title="由自定义 header 接管" subtitle="这段文字不会显示">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="grid size-10 shrink-0 place-items-center rounded-full bg-mdv-primary-container text-mdv-on-primary-container"
                aria-hidden="true"
              >
                <MdvIcon :icon="landscape" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-mdv-title-medium">山间行程</h3>
                <p class="text-mdv-body-medium text-mdv-on-surface-variant">自定义标题区域</p>
              </div>
              <MdvIconButton
                variant="standard"
                aria-label="山间行程的更多操作"
                @click="innerAction = '已点击更多操作。'"
              >
                <MdvIcon :icon="moreVert" />
              </MdvIconButton>
            </div>
          </template>
          <template #media>
            <div class="card-playground-media" aria-hidden="true">
              <MdvIcon :icon="landscape" :size="72" />
            </div>
          </template>
          <p>静态卡片允许选择正文，也允许在不同插槽中放置独立控件。</p>
          <template #actions>
            <MdvCheckbox v-model="selected" label="加入行程" />
          </template>
        </MdvCard>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant" role="status">
        {{ innerAction }} 加入行程：{{ selected ? '是' : '否' }}。
      </p>
    </section>

    <section
      aria-labelledby="card-action-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="card-action-title" class="text-mdv-title-large">整卡主操作与原生链接</h2>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        可点击卡片只有一个主操作，内部不放独立控件。用 Tab 检查焦点环，用 Enter／Space
        激活按钮；链接遵循原生键盘规则。
      </p>
      <form class="grid gap-5 md:grid-cols-3" @submit.prevent="submits++">
        <MdvCard
          v-for="variant in variants"
          :key="variant.value"
          :variant="variant.value"
          :title="`${variant.label} 操作`"
          clickable
          @click="actionCount++"
        >
          <p>点击标题、正文或留白均触发同一个操作，不会提交外层表单。</p>
        </MdvCard>
      </form>
      <div class="grid items-start gap-5 md:grid-cols-2">
        <MdvCard
          ref="actionCard"
          title="聚焦这张卡片"
          subtitle="通过公开 focus() 方法进入主操作"
          clickable
          @click="actionCount++"
        >
          <p>上方和下方的空白区域也属于点击范围。按下时圆角保持不变。</p>
        </MdvCard>
        <MdvCard
          title="Material 卡片规范"
          href="https://m3.material.io/components/cards/specs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex items-start gap-3">
            <p class="flex-1">原生链接：可中键打开、复制链接地址，也可使用 Ctrl／Command 点击。</p>
            <MdvIcon :icon="arrowOutward" />
          </div>
        </MdvCard>
      </div>
      <MdvButton variant="outlined" @click="actionCard?.focus({ preventScroll: true })">
        聚焦上方卡片
      </MdvButton>
      <p class="text-mdv-body-small text-mdv-on-surface-variant" role="status">
        主操作次数：{{ actionCount }}；表单提交次数：{{ submits }}（应保持 0）。
      </p>
    </section>

    <section
      aria-labelledby="card-disabled-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="card-disabled-title" class="text-mdv-title-large">禁用状态与原生 fieldset</h2>
      <MdvCheckbox v-model="disabled" label="禁用下方整卡主操作" />
      <div class="grid gap-5 md:grid-cols-3">
        <MdvCard
          v-for="variant in variants"
          :key="variant.value"
          :variant="variant.value"
          :title="variant.label"
          :disabled="disabled"
          clickable
          @click="actionCount++"
        >
          <p>各变体分别处理背景、内容、描边与阴影，整张卡片不使用统一透明度。</p>
        </MdvCard>
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <MdvCard
          title="可禁用的链接"
          href="https://m3.material.io/"
          target="_blank"
          rel="noopener noreferrer"
          :disabled="disabled"
        >
          <p>禁用时移除导航地址和 Tab 入口，恢复后仍是原生链接。</p>
        </MdvCard>
        <fieldset :disabled="fieldsetDisabled">
          <legend class="mb-2 text-mdv-label-large">继承表单区域的禁用状态</legend>
          <MdvCard title="原生按钮卡片" clickable @click="actionCount++">
            <p>通过外部 fieldset 禁用，不额外传入 Card 的 disabled。</p>
          </MdvCard>
        </fieldset>
      </div>
      <MdvCheckbox v-model="fieldsetDisabled" label="禁用上方 fieldset" />
    </section>

    <section
      aria-labelledby="card-dragged-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="card-dragged-title" class="text-mdv-title-large">受控拖动视觉</h2>
      <MdvCheckbox v-model="dragged" label="显示 dragged 状态" />
      <div class="grid gap-5 md:grid-cols-3">
        <MdvCard
          v-for="variant in variants"
          :key="variant.value"
          :variant="variant.value"
          :title="variant.label"
          :dragged="dragged"
        >
          <p>只显示拖动状态的阴影与状态层，实际拖动和排序由业务控制。</p>
        </MdvCard>
      </div>
    </section>

    <section
      aria-labelledby="card-layout-title"
      class="space-y-4 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="card-layout-title" class="text-mdv-title-large">窄容器、RTL、局部主题与圆角</h2>
      <div class="grid items-start gap-5 md:grid-cols-2">
        <MdvCard class="w-full max-w-60" title="一个需要自然换行的中文长标题">
          <p>正文自然换行，不设置固定高度，也不默认截断文字。</p>
          <p class="mt-2">LongUnbrokenIdentifierForCardOverflowVerificationWithoutSpaces</p>
          <template #actions>
            <MdvButton variant="outlined">取消</MdvButton>
            <MdvButton>保存行程</MdvButton>
          </template>
        </MdvCard>
        <MdvCard dir="rtl" title="رحلة نهاية الأسبوع" subtitle="إلى جانب البحيرة">
          <p>تتكيف البطاقة مع اتجاه النص وتبقى الإجراءات في نهاية المحتوى.</p>
          <template #actions>
            <MdvButton variant="text">إلغاء</MdvButton>
            <MdvButton>حفظ</MdvButton>
          </template>
        </MdvCard>
        <div data-mdv-theme="dark" class="rounded-mdv-large bg-mdv-surface p-5">
          <MdvCard variant="filled" title="局部深色卡片" clickable @click="actionCount++">
            <p>切换上方全局主题或种子色，比较此处与外层的颜色、状态层及焦点环。</p>
          </MdvCard>
        </div>
        <MdvCard
          style="--mdv-sys-shape-corner-medium: 20px"
          clickable
          aria-label="查看仅媒体卡片"
          @click="actionCount++"
        >
          <template #media>
            <div class="card-playground-media" aria-hidden="true">
              <MdvIcon :icon="landscape" :size="72" />
            </div>
          </template>
        </MdvCard>
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        右下卡片仅含媒体，并覆盖为 20px 圆角；请检查四角裁切、整卡涟漪及外部焦点环。
        也可开启系统“减少动态效果”后重新检查交互。
      </p>
    </section>
  </div>
</template>

<style scoped>
.card-playground-media {
  display: grid;
  height: 144px;
  place-items: center;
  background: linear-gradient(
    135deg,
    var(--mdv-sys-color-primary-container),
    var(--mdv-sys-color-tertiary-container)
  );
  color: var(--mdv-sys-color-on-primary-container);
}
</style>
