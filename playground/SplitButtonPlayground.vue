<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, useTemplateRef } from 'vue'
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import saveIcon from '@iconify-icons/material-symbols/save'
import {
  MdvButton,
  MdvCard,
  MdvCheckbox,
  MdvDialog,
  MdvIcon,
  MdvMenu,
  MdvMenuGroup,
  MdvMenuItem,
  MdvSplitButton,
  MdvTextField,
  MdvToolbar,
  MdvTooltip,
} from '@/index'
import type { MdvButtonSize, MdvMenuModelValue, MdvSplitButtonVariant } from '@/index'

const variants: MdvSplitButtonVariant[] = ['filled', 'tonal', 'outlined', 'elevated']
const officialUrl = 'https://m3.material.io/components/split-button'
const sizes: MdvButtonSize[] = ['xs', 's', 'm', 'l', 'xl']
const variant = ref<MdvSplitButtonVariant>('filled')
const size = ref<MdvButtonSize>('s')
const label = ref('保存')
const disabled = ref(false)
const actionDisabled = ref(false)
const menuDisabled = ref(false)
const loading = ref(false)
const loadingText = ref(false)
const iconOnly = ref(false)
const fullWidth = ref(false)
const hoverShadow = ref(false)
const rtl = ref(false)
const dark = ref(false)
const largeText = ref(false)
const message = ref('尚未操作')
const format = ref<MdvMenuModelValue>('pdf')
const attachments = ref<MdvMenuModelValue>(['notes'])
const controlled = ref(false)
const reject = ref(true)
const proposal = ref(false)
const submitted = ref('尚未提交')
const dialog = ref(false)
const cardButton = useTemplateRef<InstanceType<typeof MdvSplitButton>>('cardButton')
const cardPanel = useTemplateRef<HTMLElement>('cardPanel')
const cardOpen = ref(false)
const cardId = `split-export-${useId()}`
let stopPosition: (() => void) | undefined

function propose(value: boolean) {
  proposal.value = value
  if (!reject.value) controlled.value = value
}
function submit(event: SubmitEvent) {
  const button = event.submitter as HTMLButtonElement | null
  const data = new FormData(event.target as HTMLFormElement, button)
  submitted.value = JSON.stringify([...data.entries()])
}
async function positionCard() {
  const anchor = cardButton.value?.menuButtonElement
  const panel = cardPanel.value
  if (!anchor || !panel) return
  const { x, y } = await computePosition(anchor, panel, {
    strategy: 'fixed',
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  })
  if (panel.matches(':popover-open')) Object.assign(panel.style, { left: `${x}px`, top: `${y}px` })
}
async function toggleCard() {
  const panel = cardPanel.value
  const anchor = cardButton.value?.menuButtonElement
  if (!panel || !anchor) return
  if (panel.matches(':popover-open')) {
    closeCard()
    return
  }
  panel.showPopover()
  cardOpen.value = true
  stopPosition = autoUpdate(anchor, panel, () => {
    void positionCard()
  })
  await nextTick()
  panel.querySelector<HTMLInputElement>('input')?.focus()
}
function closeCard(restore = true) {
  cardPanel.value?.hidePopover()
  cardOpen.value = false
  stopPosition?.()
  stopPosition = undefined
  if (restore) cardButton.value?.focusMenu()
}
function cardToggled() {
  if (!cardPanel.value?.matches(':popover-open')) closeCard(false)
}
function cardFocusOut() {
  queueMicrotask(() => {
    const active = document.activeElement
    if (!cardPanel.value?.contains(active) && active !== cardButton.value?.menuButtonElement)
      closeCard(false)
  })
}
onBeforeUnmount(() => {
  stopPosition?.()
})
</script>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <h3 class="text-lg font-medium">拆分按钮</h3>
      <div class="split-controls">
        <label
          >外观<select v-model="variant">
            <option v-for="entry in variants" :key="entry">{{ entry }}</option>
          </select></label
        >
        <label
          >尺寸<select v-model="size">
            <option v-for="entry in sizes" :key="entry">{{ entry }}</option>
          </select></label
        >
        <MdvTextField v-model="label" label="主操作文字" />
      </div>
      <div class="flex flex-wrap gap-4">
        <MdvCheckbox v-model="disabled" label="整体禁用" />
        <MdvCheckbox v-model="actionDisabled" label="只禁用主操作" />
        <MdvCheckbox v-model="menuDisabled" label="只禁用菜单" />
        <MdvCheckbox v-model="loading" label="主操作加载" />
        <MdvCheckbox v-model="loadingText" label="替换加载文字" />
        <MdvCheckbox v-model="iconOnly" label="纯图标" />
        <MdvCheckbox v-model="fullWidth" label="填满容器" />
        <MdvCheckbox v-model="hoverShadow" label="悬停阴影" />
        <MdvCheckbox v-model="rtl" label="RTL" />
        <MdvCheckbox v-model="dark" label="局部深色" />
        <MdvCheckbox v-model="largeText" label="两倍文字" />
      </div>
      <div
        class="split-example"
        :class="{ 'split-large-text': largeText }"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <MdvMenu>
          <template #trigger="{ triggerProps, open }">
            <MdvSplitButton
              :variant="variant"
              :size="size"
              :expanded="open"
              :menu-button-attrs="triggerProps"
              :disabled="disabled"
              :action-disabled="actionDisabled"
              :menu-disabled="menuDisabled"
              :loading="loading"
              :loading-text="loadingText ? '正在保存…' : undefined"
              :icon-only="iconOnly"
              :full-width="fullWidth"
              :hover-shadow="hoverShadow"
              :action-attrs="iconOnly ? { 'aria-label': label || '保存' } : undefined"
              menu-button-label="更多保存选项"
              aria-label="保存文档"
              @click="message = '已执行主操作：保存'"
            >
              <template v-if="!iconOnly" #leading><MdvIcon :icon="saveIcon" /></template>
              <MdvIcon v-if="iconOnly" :icon="saveIcon" /><template v-else>{{ label }}</template>
            </MdvSplitButton>
          </template>
          <MdvMenuItem label="另存为…" @select="message = '另存为'" />
          <MdvMenuItem label="保存副本" @select="message = '保存副本'" />
          <MdvMenuItem label="导出">
            <template #children>
              <MdvMenuItem label="PDF 文档" @select="message = '导出 PDF'" />
              <MdvMenuItem label="Markdown" @select="message = '导出 Markdown'" />
            </template>
          </MdvMenuItem>
          <MdvMenuItem label="不可用操作" disabled />
        </MdvMenu>
      </div>
      <p role="status">{{ message }}</p>
      <p class="text-sm text-mdv-on-surface-variant">
        Tab 分别经过主操作和菜单入口；菜单入口用 Enter、空格或方向键打开，Escape 关闭并返回入口。
      </p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">四种外观 × 五档尺寸</h3>
      <div
        class="split-matrix"
        :dir="rtl ? 'rtl' : 'ltr'"
        :data-mdv-theme="dark ? 'dark' : undefined"
      >
        <div v-for="appearance in variants" :key="appearance" class="split-example space-y-3">
          <h4>{{ appearance }}</h4>
          <div v-for="entry in sizes" :key="entry" class="split-matrix-row">
            <span class="split-size-label">{{ entry }}</span>
            <MdvMenu>
              <template #trigger="{ triggerProps, open }">
                <MdvSplitButton
                  :variant="appearance"
                  :size="entry"
                  :expanded="open"
                  :menu-button-attrs="triggerProps"
                  :menu-button-label="`${appearance} ${entry} 更多选项`"
                  @click="message = `${appearance} ${entry} 主操作`"
                  >操作</MdvSplitButton
                >
              </template>
              <MdvMenuItem
                label="另一项操作"
                @select="message = `${appearance} ${entry} 菜单操作`"
              />
            </MdvMenu>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">菜单分组与受控展开</h3>
      <div class="split-example flex flex-wrap items-center gap-6">
        <MdvMenu layout="grouped">
          <template #trigger="{ triggerProps, open }">
            <MdvSplitButton
              variant="tonal"
              :expanded="open"
              :menu-button-attrs="triggerProps"
              menu-button-label="导出格式与附加内容"
              @click="message = `导出 ${format}，附加 ${JSON.stringify(attachments)}`"
              >导出 {{ format }}</MdvSplitButton
            >
          </template>
          <MdvMenuGroup v-model="format" label="文件格式" selection-mode="single">
            <MdvMenuItem value="pdf" label="PDF" /><MdvMenuItem value="markdown" label="Markdown" />
          </MdvMenuGroup>
          <MdvMenuGroup v-model="attachments" label="附加内容" selection-mode="multiple">
            <MdvMenuItem value="notes" label="备注" /><MdvMenuItem value="images" label="图片" />
          </MdvMenuGroup>
        </MdvMenu>
        <MdvMenu :model-value="controlled" @update:model-value="propose">
          <template #trigger="{ triggerProps, open }">
            <MdvSplitButton
              variant="outlined"
              :expanded="open"
              :menu-button-attrs="triggerProps"
              menu-button-label="受控的更多保存选项"
              @click="message = '受控示例主操作'"
              >保存</MdvSplitButton
            >
          </template>
          <MdvMenuItem label="保存到云端" />
        </MdvMenu>
        <MdvCheckbox v-model="reject" label="拒绝菜单展开／关闭请求" />
      </div>
      <p>请求状态：{{ proposal }}；已接受状态：{{ controlled }}。</p>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">原生表单与链接</h3>
      <form
        class="split-example space-y-4"
        @submit.prevent="submit"
        @reset="submitted = '已重置表单'"
      >
        <label class="split-form-label">文件名<input name="filename" value="文档草稿" /></label>
        <div class="flex flex-wrap gap-5">
          <MdvMenu>
            <template #trigger="{ triggerProps, open }"
              ><MdvSplitButton
                type="submit"
                :action-attrs="{ name: 'intent', value: 'save' }"
                :expanded="open"
                :menu-button-attrs="triggerProps"
                menu-button-label="其他提交选项"
                >提交</MdvSplitButton
              ></template
            >
            <MdvMenuItem
              label="保存为草稿"
              @select="message = '保存为草稿（菜单操作不提交表单）'"
            />
          </MdvMenu>
          <MdvSplitButton
            type="reset"
            variant="outlined"
            menu-disabled
            menu-button-label="无其他重置操作"
            >重置</MdvSplitButton
          >
        </div>
      </form>
      <p>{{ submitted }}</p>
      <div class="split-example flex flex-wrap gap-5">
        <MdvMenu>
          <template #trigger="{ triggerProps, open }"
            ><MdvSplitButton
              :href="`${officialUrl}/specs`"
              :action-attrs="{ target: '_blank', rel: 'noopener' }"
              :expanded="open"
              :menu-button-attrs="triggerProps"
              menu-button-label="更多规范资料"
              >官方规范</MdvSplitButton
            ></template
          >
          <MdvMenuItem
            label="使用指南"
            :href="`${officialUrl}/guidelines`"
            target="_blank"
            rel="noopener"
          />
        </MdvMenu>
        <MdvSplitButton
          variant="tonal"
          href="https://example.com"
          action-disabled
          menu-button-label="不可用链接的说明"
          @menu-click="message = '只有主链接被禁用，尾按钮仍可操作'"
          >禁用链接</MdvSplitButton
        >
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">纯图标、局部颜色与长文字</h3>
      <div class="split-example flex flex-wrap items-center gap-5">
        <MdvTooltip text="选择另一种保存方式">
          <template #trigger="{ triggerProps }"
            ><MdvSplitButton
              icon-only
              :action-attrs="{ 'aria-label': '保存' }"
              :menu-button-attrs="triggerProps"
              menu-button-label="更多保存方式"
              @click="message = '图标主操作'"
              @menu-click="message = '图标菜单入口'"
              ><MdvIcon :icon="saveIcon" /></MdvSplitButton
          ></template>
        </MdvTooltip>
        <MdvSplitButton
          color="success"
          menu-button-label="更多完成选项"
          @click="message = '完成'"
          @menu-click="message = '更多完成选项'"
          >完成</MdvSplitButton
        >
        <MdvSplitButton
          color="#8150b5"
          variant="tonal"
          menu-button-label="更多紫色操作"
          @click="message = '自定义种子色'"
          >自定义种子色</MdvSplitButton
        >
      </div>
      <div
        class="split-example split-narrow"
        :class="{ 'split-large-text': largeText }"
        :dir="rtl ? 'rtl' : 'ltr'"
      >
        <MdvSplitButton menu-button-label="更多文档保存方式"
          >保存全部尚未完成的文档更改</MdvSplitButton
        >
        <MdvSplitButton variant="outlined" menu-button-label="More review options"
          >ReviewUninterruptedProjectChanges</MdvSplitButton
        >
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-lg font-medium">工具栏、对话框与自定义内容</h3>
      <div class="split-example flex flex-wrap items-center gap-5">
        <MdvToolbar variant="floating" :elevated="false" aria-label="文档操作">
          <MdvMenu>
            <template #trigger="{ triggerProps, open }"
              ><MdvSplitButton
                size="xs"
                variant="tonal"
                :expanded="open"
                :menu-button-attrs="triggerProps"
                menu-button-label="更多工具栏保存选项"
                @click="message = '工具栏保存'"
                >保存</MdvSplitButton
              ></template
            >
            <MdvMenuItem label="保存副本" />
          </MdvMenu>
        </MdvToolbar>
        <MdvButton variant="outlined" @click="dialog = true">对话框组合</MdvButton>
        <MdvSplitButton
          ref="cardButton"
          variant="outlined"
          :expanded="cardOpen"
          :menu-button-attrs="{ 'aria-haspopup': 'dialog', 'aria-controls': cardId }"
          menu-button-label="自定义导出设置"
          @click="message = '使用当前设置导出'"
          @menu-click="toggleCard"
          >导出</MdvSplitButton
        >
      </div>
      <div
        :id="cardId"
        ref="cardPanel"
        popover="auto"
        role="dialog"
        :aria-labelledby="`${cardId}-title`"
        class="split-card-panel"
        @toggle="cardToggled"
        @keydown.esc.prevent.stop="closeCard()"
        @focusout="cardFocusOut"
      >
        <MdvCard variant="filled" title="导出设置">
          <h4 :id="`${cardId}-title`" class="sr-only">导出设置</h4>
          <MdvTextField label="文件名" model-value="我的文档" />
          <p class="mt-3 text-sm">自定义浮层自行管理定位、名称与焦点。</p>
          <template #actions
            ><MdvButton variant="text" @click="closeCard()">完成</MdvButton></template
          >
        </MdvCard>
      </div>
    </section>
    <MdvDialog v-model="dialog" title="保存文档">
      <p class="mb-5">主操作直接保存；更多选项由同一个菜单管理。</p>
      <MdvMenu>
        <template #trigger="{ triggerProps, open }"
          ><MdvSplitButton
            :expanded="open"
            :menu-button-attrs="triggerProps"
            menu-button-label="对话框中的更多保存选项"
            @click="message = '对话框保存'"
            >保存</MdvSplitButton
          ></template
        >
        <MdvMenuItem label="保存到本地" /><MdvMenuItem label="保存到云端" />
      </MdvMenu>
      <template #actions
        ><MdvButton variant="text" @click="dialog = false">关闭</MdvButton></template
      >
    </MdvDialog>
  </div>
</template>

<style scoped>
.split-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px;
}
.split-controls > label,
.split-form-label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.split-controls select,
.split-form-label input {
  min-width: 100px;
  border: 1px solid var(--mdv-sys-color-outline);
  border-radius: 8px;
  padding: 8px;
  background: var(--mdv-sys-color-surface);
  color: var(--mdv-sys-color-on-surface);
}
.split-example {
  min-width: 0;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 20px;
  padding: 20px;
  background: var(--mdv-sys-color-surface);
  color: var(--mdv-sys-color-on-surface);
  overflow-x: auto;
}
.split-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 410px), 1fr));
  gap: 16px;
}
.split-matrix-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 5px;
}
.split-size-label {
  min-width: 20px;
  font-size: 14px;
}
.split-narrow {
  display: grid;
  width: min(100%, 280px);
  justify-items: start;
  gap: 20px;
}
.split-large-text :deep(.mdv-button) {
  font-size: 2em;
  line-height: 1.5;
}
.split-card-panel {
  position: fixed;
  inset: auto;
  width: min(320px, calc(100vw - 16px));
  margin: 0;
  border: 0;
  padding: 0;
  overflow: visible;
  background: transparent;
  color: var(--mdv-sys-color-on-surface);
}
</style>
