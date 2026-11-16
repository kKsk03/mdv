<script setup lang="ts">
import { ref } from 'vue'
import contentCopy from '@iconify-icons/material-symbols/content-copy-outline'
import edit from '@iconify-icons/material-symbols/edit-outline'
import moreVert from '@iconify-icons/material-symbols/more-vert'
import undo from '@iconify-icons/material-symbols/undo'
import redo from '@iconify-icons/material-symbols/redo'
import info from '@iconify-icons/material-symbols/info-outline'
import {
  MdvBadge,
  MdvButton,
  MdvCheckbox,
  MdvContextMenu,
  MdvDialog,
  MdvDivider,
  MdvIcon,
  MdvIconButton,
  MdvMenu,
  MdvMenuGroup,
  MdvMenuItem,
} from '@/index'
import type {
  MdvMenuModelValue,
  MdvMenuSelectEvent,
  MdvMenuSubmenuMode,
  MdvMenuVariant,
  MdvMenuColorScheme,
} from '@/index'

const variants: MdvMenuVariant[] = ['expressive', 'baseline']
const schemes: MdvMenuColorScheme[] = ['standard', 'vibrant']
const single = ref<MdvMenuModelValue>('custom')
const multiple = ref<MdvMenuModelValue>(['bold'])
const textSize = ref<MdvMenuModelValue>(14)
const showCheck = ref(true)
const controlled = ref(false)
const dialog = ref(false)
const result = ref('尚未选择操作')
const lifecycle = ref<string[]>([])
const mode = ref<MdvMenuSubmenuMode>('flyout')

function record(text: string) {
  lifecycle.value = [text, ...lifecycle.value].slice(0, 6)
}
function action(text: string) {
  result.value = text
}
function cancelSelection(event: MdvMenuSelectEvent) {
  event.preventDefault()
  result.value = '本次操作已取消，菜单保持展开'
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">外观与条目</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        对照两套外观、标准与鲜明配色。禁用项仍可用方向键聚焦，点击不会执行。
      </p>
      <div class="mt-5 flex flex-wrap items-center gap-4">
        <template v-for="variant in variants" :key="variant">
          <MdvMenu
            v-for="scheme in variant === 'baseline' ? ['standard' as const] : schemes"
            :key="scheme"
            :variant="variant"
            :color-scheme="scheme"
          >
            <template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="tonal"
                >{{ variant }} / {{ scheme }}</MdvButton
              ></template
            >
            <MdvMenuItem
              :icon="undo"
              label="撤销"
              trailing-text="Ctrl+Z"
              @select="action('已撤销')"
            />
            <MdvMenuItem
              :icon="redo"
              label="重做"
              trailing-text="Ctrl+Y"
              disabled
              @select="action('此操作不应执行')"
            />
            <MdvDivider />
            <MdvMenuItem
              :icon="contentCopy"
              label="创建副本"
              supporting-text="保留原始文件与共享设置"
              @select="action('已创建副本')"
            />
            <MdvMenuItem :icon="edit" label="重命名" @select="action('开始重命名')" />
            <MdvMenuItem
              label="打开官方规格"
              href="https://m3.material.io/components/menus/specs"
              target="_blank"
              rel="noopener noreferrer"
            />
            <MdvMenuItem label="取消这次操作" @select="cancelSelection" />
          </MdvMenu>
        </template>
        <MdvMenu>
          <template #trigger="{ triggerProps }"
            ><MdvIconButton v-bind="triggerProps" aria-label="更多操作" variant="standard"
              ><MdvIcon :icon="moreVert" /></MdvIconButton
          ></template>
          <MdvMenuItem label="消息（8 条新消息）" @select="action('查看消息')"
            ><template #trailing><MdvBadge variant="large" content="8" /></template
          ></MdvMenuItem>
          <MdvMenuItem label="详情" :icon="info" @select="action('查看详情')" />
        </MdvMenu>
      </div>
      <p class="mt-4 text-mdv-body-medium" role="status">{{ result }}</p>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">分组、单选与多选</h2>
      <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
        单选后关闭，多选后保持打开。每组独立管理选择值；数字 14 与字符串不混用。
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <MdvMenu layout="grouped">
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps">文字格式</MdvButton></template
          >
          <MdvMenuGroup v-model="single" selection-mode="single" label="行间距">
            <MdvMenuItem value="single" label="单倍行距" />
            <MdvMenuItem value="double" label="双倍行距" />
            <MdvMenuItem value="custom" label="自定义 1.2" />
          </MdvMenuGroup>
          <MdvMenuGroup v-model="multiple" selection-mode="multiple" label="样式">
            <MdvMenuItem value="bold" label="粗体" trailing-text="Ctrl+B" />
            <MdvMenuItem value="italic" label="斜体" trailing-text="Ctrl+I" />
            <MdvMenuItem value="underline" label="下划线" trailing-text="Ctrl+U" />
          </MdvMenuGroup>
        </MdvMenu>
        <MdvMenu>
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="outlined"
              >字号：{{ textSize }}</MdvButton
            ></template
          >
          <MdvMenuGroup v-model="textSize" selection-mode="single">
            <MdvMenuItem
              v-for="size in [12, 14, 16, 20]"
              :key="size"
              :value="size"
              :label="String(size)"
            />
          </MdvMenuGroup>
        </MdvMenu>
      </div>
      <p class="mt-4 text-mdv-body-medium">行距：{{ single }}；多选：{{ multiple }}</p>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">子菜单与键盘</h2>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <label class="text-mdv-body-medium"
          >子菜单形式
          <select
            v-model="mode"
            class="ms-2 rounded-mdv-small border border-mdv-outline bg-mdv-surface p-2"
          >
            <option value="flyout">侧向级联</option>
            <option value="push">面板内逐级进入</option>
          </select>
        </label>
        <MdvMenu :submenu-mode="mode">
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps">格式菜单</MdvButton></template
          >
          <MdvMenuItem label="Text">
            <template #children>
              <MdvMenuItem label="Font">
                <template #children>
                  <MdvMenuItem label="Roboto" @select="action('字体：Roboto')" />
                  <MdvMenuItem label="系统字体" @select="action('字体：系统默认')" />
                </template>
              </MdvMenuItem>
              <MdvMenuItem label="Color" @select="action('调整文字颜色')" />
            </template>
          </MdvMenuItem>
          <MdvMenuItem label="Line spacing"
            ><template #children
              ><MdvMenuGroup v-model="single" selection-mode="single"
                ><MdvMenuItem value="single" label="Single" /><MdvMenuItem
                  value="double"
                  label="Double" /></MdvMenuGroup></template
          ></MdvMenuItem>
          <MdvMenuItem label="Table" @select="action('插入表格')" />
          <MdvMenuItem label="Image">
            <template #children>
              <MdvMenuItem label="Upload image" @select="action('从本地插入图片')" />
              <MdvMenuItem label="From URL" @select="action('通过链接插入图片')" />
            </template>
          </MdvMenuItem>
        </MdvMenu>
      </div>
      <p class="mt-4 text-mdv-body-medium text-mdv-on-surface-variant">
        上下键移动，Home／End 到首尾，输入字母定位；左右键进入／返回。Escape 逐级关闭，Tab
        退出菜单。
      </p>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">右键菜单</h2>
      <MdvContextMenu>
        <template #trigger="{ triggerProps }"
          ><div
            v-bind="triggerProps"
            tabindex="0"
            class="mt-4 rounded-mdv-medium border border-dashed border-mdv-outline bg-mdv-surface-container-low p-8"
          >
            在此右键，或聚焦后按 Shift+F10／上下文菜单键。
          </div></template
        >
        <MdvMenuItem :icon="contentCopy" label="复制" @select="action('已复制上下文内容')" />
        <MdvMenuItem label="共享"
          ><template #children
            ><MdvMenuItem label="复制链接" @select="action('已复制共享链接')" /><MdvMenuItem
              label="导出文件"
              @select="action('准备导出')" /></template
        ></MdvMenuItem>
      </MdvContextMenu>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">长菜单、边界与状态</h2>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <MdvMenu layout="grouped" style="width: 260px; --mdv-menu-max-height: 260px">
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="outlined">滚动菜单</MdvButton></template
          >
          <MdvMenuGroup label="最近项目"
            ><MdvMenuItem
              v-for="n in 8"
              :key="n"
              :label="`项目 ${n}：较长中文标题与辅助说明`"
              supporting-text="滚动时应显示细滚动条"
              @select="action(`项目 ${n}`)"
          /></MdvMenuGroup>
          <MdvMenuGroup label="其他操作"
            ><MdvMenuItem label="创建项目" @select="action('创建新项目')"
          /></MdvMenuGroup>
        </MdvMenu>
        <MdvMenu
          v-model="controlled"
          @open="record('open')"
          @opened="record('opened')"
          @close="record('close：' + $event.reason)"
          @closed="record('closed：' + $event.reason)"
        >
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="tonal">受控菜单</MdvButton></template
          >
          <MdvMenuItem label="保持展开" keep-open @select="showCheck = !showCheck" />
          <MdvMenuItem label="关闭" />
        </MdvMenu>
        <MdvCheckbox v-model="controlled" label="展开受控菜单" />
        <span class="text-mdv-body-small">当前演示状态：{{ showCheck }}</span>
      </div>
      <ol class="mt-4 text-mdv-body-small text-mdv-on-surface-variant" aria-live="polite">
        <li v-for="(entry, index) in lifecycle" :key="index">{{ entry }}</li>
      </ol>
      <div class="mt-6 flex justify-end">
        <MdvMenu placement="bottom-end"
          ><template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps" variant="text">末端对齐与长标签</MdvButton></template
          ><MdvMenuItem
            label="很长的中文菜单项目名称应能自然换行，保持操作区域清晰"
            supporting-text="LongEnglishTextWithoutAnySpacesToCheckWrapping"
        /></MdvMenu>
      </div>
    </section>

    <section class="rounded-mdv-large border border-mdv-outline-variant p-5">
      <h2 class="text-mdv-title-large">局部主题、RTL 与 Dialog</h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <div data-mdv-theme="dark" class="rounded-mdv-medium bg-mdv-surface p-4">
          <MdvMenu color-scheme="vibrant"
            ><template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="tonal">局部深色</MdvButton></template
            ><MdvMenuItem label="继承这里的主题" /><MdvMenuItem label="子菜单"
              ><template #children><MdvMenuItem label="子菜单也继承主题" /></template></MdvMenuItem
          ></MdvMenu>
        </div>
        <div dir="rtl" class="rounded-mdv-medium border border-mdv-outline-variant p-4">
          <MdvMenu
            ><template #trigger="{ triggerProps }"
              ><MdvButton v-bind="triggerProps" variant="outlined">RTL 菜单</MdvButton></template
            ><MdvMenuItem label="خيار أول" /><MdvMenuItem label="子菜单"
              ><template #children><MdvMenuItem label="左右键方向反转" /></template></MdvMenuItem
          ></MdvMenu>
        </div>
        <MdvButton @click="dialog = true">Dialog 内菜单</MdvButton>
      </div>
      <MdvDialog
        v-model="dialog"
        role="dialog"
        title="菜单组合"
        description="展开菜单后，第一次 Escape 应只关闭菜单，再按一次才关闭对话框。Tab 从菜单退出后继续在对话框内移动。"
      >
        <MdvMenu>
          <template #trigger="{ triggerProps }"
            ><MdvButton v-bind="triggerProps">对话框内操作</MdvButton></template
          >
          <MdvMenuItem label="普通操作" @select="action('Dialog 内操作成功')" />
          <MdvMenuItem label="更多选项"
            ><template #children><MdvMenuItem label="子菜单操作" /></template
          ></MdvMenuItem>
        </MdvMenu>
        <MdvButton variant="text" @click="action('菜单后方按钮')">后方按钮</MdvButton>
        <template #actions="{ close }"
          ><MdvButton variant="text" @click="close()">完成</MdvButton></template
        >
      </MdvDialog>
    </section>
  </div>
</template>
