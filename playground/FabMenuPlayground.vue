<script setup lang="ts">
import { ref } from 'vue'
import noteIcon from '@iconify-icons/material-symbols/note-add'
import imageIcon from '@iconify-icons/material-symbols/add-photo-alternate'
import folderIcon from '@iconify-icons/material-symbols/create-new-folder'
import { MdvButton, MdvCheckbox, MdvDialog, MdvFabMenu, MdvFabMenuItem, MdvIcon } from '@/index'
import type {
  MdvFabMenuColor,
  MdvFabMenuSelectEvent,
  MdvFabMenuSize,
  MdvFabMenuVariant,
} from '@/index'

const variants: MdvFabMenuVariant[] = ['expressive', 'baseline']
const colors: MdvFabMenuColor[] = [
  'primary-container',
  'secondary-container',
  'tertiary-container',
  'primary',
  'secondary',
  'tertiary',
]
const sizes: MdvFabMenuSize[] = ['regular', 'medium', 'large']
const variant = ref<MdvFabMenuVariant>('expressive')
const color = ref<MdvFabMenuColor>('primary-container')
const size = ref<MdvFabMenuSize>('regular')
const elevated = ref(true)
const dark = ref(false)
const rtl = ref(false)
const enlarged = ref(false)
const message = ref('尚未选择操作')
const dialog = ref(false)
const controlled = ref(false)
const reject = ref(true)
const requested = ref(false)
const fixed = ref(false)
function propose(value: boolean) {
  requested.value = value
  if (!reject.value) controlled.value = value
}
function cancelSelection(event: MdvFabMenuSelectEvent) {
  event.preventDefault()
  message.value = '已取消选择，菜单保持展开'
}
const operations = [
  { label: '新建文档', icon: noteIcon },
  { label: '上传图片', icon: imageIcon },
  { label: '创建文件夹', icon: folderIcon },
]
</script>

<template>
  <div class="fab-menu-playground">
    <section class="fab-menu-playground__section">
      <div class="fab-menu-playground__heading">
        <h2>两种呈现</h2>
        <a
          href="https://m3.material.io/components/fab-menu/specs"
          target="_blank"
          rel="noopener noreferrer"
          >官方规范</a
        >
      </div>
      <p>
        Expressive：焦点留在关闭按钮，Tab
        依次访问顶部至底部操作。Baseline：普通菜单，使用方向键导航。
      </p>
      <div class="fab-menu-playground__comparison">
        <div v-for="item in variants" :key="item" class="fab-menu-playground__canvas">
          <h3>{{ item === 'expressive' ? 'Expressive 胶囊操作项' : 'Web Baseline 普通菜单' }}</h3>
          <p>同一组相关操作，按各自的视觉与键盘规则呈现。</p>
          <MdvFabMenu :variant="item" position="absolute" :offset="16" :label="`${item} 新建内容`">
            <MdvFabMenuItem
              v-for="operation in operations"
              :key="operation.label"
              :label="operation.label"
              :icon="operation.icon"
              @select="message = operation.label"
            />
          </MdvFabMenu>
        </div>
      </div>
      <p role="status">{{ message }}</p>
    </section>
    <section class="fab-menu-playground__section">
      <h2>颜色、尺寸与边界</h2>
      <div class="fab-menu-playground__controls">
        <label
          >呈现<select v-model="variant">
            <option v-for="item in variants" :key="item">{{ item }}</option>
          </select></label
        >
        <label
          >入口颜色<select v-model="color">
            <option v-for="item in colors" :key="item">{{ item }}</option>
          </select></label
        >
        <label
          >入口尺寸<select v-model="size">
            <option v-for="item in sizes" :key="item">{{ item }}</option>
          </select></label
        >
        <MdvCheckbox v-model="elevated">启用阴影</MdvCheckbox>
        <MdvCheckbox v-model="dark">深色局部主题</MdvCheckbox>
        <MdvCheckbox v-model="rtl">RTL</MdvCheckbox>
        <MdvCheckbox v-model="enlarged">两倍文字</MdvCheckbox>
      </div>
      <div
        class="fab-menu-playground__canvas fab-menu-playground__wide"
        :data-mdv-theme="dark ? 'dark' : 'light'"
        :dir="rtl ? 'rtl' : 'ltr'"
        :style="
          enlarged
            ? {
                '--mdv-sys-typescale-title-medium-size': '32px',
                '--mdv-sys-typescale-title-medium-line-height': '48px',
              }
            : undefined
        "
      >
        <h3>自然宽度、顶部末端锚点</h3>
        <p>操作项保留各自宽度。较大入口展开后，关闭按钮保持原入口的顶部末端角。</p>
        <MdvFabMenu
          :variant="variant"
          :color="color"
          :size="size"
          :elevated="elevated"
          position="absolute"
          :offset="16"
          label="更多创建操作"
        >
          <MdvFabMenuItem label="新建" :icon="noteIcon" @select="message = '新建'" />
          <MdvFabMenuItem
            label="上传照片和视频"
            :icon="imageIcon"
            @select="message = '上传照片和视频'"
          />
          <MdvFabMenuItem
            label="创建共享文件夹"
            :icon="folderIcon"
            @select="message = '创建共享文件夹'"
          />
        </MdvFabMenu>
      </div>
    </section>
    <section class="fab-menu-playground__section">
      <h2>短窗口、六项与长标签</h2>
      <p>把浏览器窗口高度缩小，或在下方拖动示例高度。菜单在视口内滚动，关闭按钮保持可达。</p>
      <div class="fab-menu-playground__canvas fab-menu-playground__resizable">
        <h3>可调整高度的内容区</h3>
        <button type="button">菜单前的原生按钮</button>
        <MdvFabMenu position="absolute" :offset="16" label="六项创建操作">
          <MdvFabMenuItem label="新建文档" :icon="noteIcon" @select="message = '文档'" />
          <MdvFabMenuItem label="新建表格" :icon="noteIcon" @select="message = '表格'" />
          <MdvFabMenuItem label="创建演示文稿" :icon="noteIcon" @select="message = '演示文稿'" />
          <MdvFabMenuItem label="上传图片" :icon="imageIcon" @select="message = '图片'" />
          <MdvFabMenuItem
            label="Create a shared folder with a longer English label"
            :icon="folderIcon"
            @select="message = '共享文件夹'"
          />
          <MdvFabMenuItem
            label="为整个团队创建一个可以共同编辑的中文工作空间"
            :icon="folderIcon"
            @select="message = '工作空间'"
          />
        </MdvFabMenu>
      </div>
    </section>
    <section class="fab-menu-playground__section">
      <h2>受控状态、取消选择与原生操作</h2>
      <MdvCheckbox v-model="reject">拒绝展开／关闭提议</MdvCheckbox>
      <p>
        最近提议：{{ requested ? '展开' : '关闭' }}；已接受状态：{{ controlled ? '展开' : '关闭' }}
      </p>
      <div class="fab-menu-playground__canvas">
        <MdvFabMenu
          :model-value="controlled"
          label="受控操作"
          position="absolute"
          :offset="16"
          @update:model-value="propose"
        >
          <MdvFabMenuItem label="取消本次选择" :icon="noteIcon" @select="cancelSelection" />
          <MdvFabMenuItem
            label="执行并保持展开"
            :icon="folderIcon"
            keep-open
            @select="message = '已执行，保持展开'"
          />
          <MdvFabMenuItem label="禁用操作" :icon="imageIcon" disabled />
          <MdvFabMenuItem
            label="查看官方规范"
            href="https://m3.material.io/components/fab-menu/specs"
            target="_blank"
            rel="noopener noreferrer"
            :icon="noteIcon"
          />
        </MdvFabMenu>
      </div>
    </section>
    <section class="fab-menu-playground__section">
      <h2>Dialog 与固定定位</h2>
      <div class="fab-menu-playground__controls">
        <MdvButton @click="dialog = true">打开组合示例</MdvButton>
        <MdvCheckbox v-model="fixed">显示窗口右下角菜单</MdvCheckbox>
      </div>
      <MdvFabMenu v-if="fixed" label="窗口操作" position="fixed" color="tertiary-container">
        <MdvFabMenuItem
          label="新建文档"
          :icon="noteIcon"
          @select="message = '窗口菜单：新建文档'"
        />
        <MdvFabMenuItem label="打开对话框" :icon="folderIcon" @select="dialog = true" />
      </MdvFabMenu>
      <MdvDialog v-model="dialog" title="创建工作空间">
        <p>菜单保留局部主题和 Dialog 的焦点边界；关闭菜单后不会把焦点移到对话框外。</p>
        <div class="fab-menu-playground__canvas">
          <input aria-label="工作空间名称" placeholder="输入名称" />
          <MdvFabMenu label="添加到工作空间" position="absolute" :offset="16">
            <template #icon><MdvIcon :icon="folderIcon" /></template>
            <MdvFabMenuItem label="添加文档" :icon="noteIcon" @select="message = '添加文档'" />
            <MdvFabMenuItem label="添加图片" :icon="imageIcon" @select="message = '添加图片'" />
          </MdvFabMenu>
        </div>
        <template #actions
          ><MdvButton variant="text" @click="dialog = false">完成</MdvButton></template
        >
      </MdvDialog>
    </section>
  </div>
</template>

<style scoped>
.fab-menu-playground {
  display: grid;
  gap: 24px;
}
.fab-menu-playground__section {
  display: grid;
  gap: 16px;
}
.fab-menu-playground__section h2,
.fab-menu-playground__section h3,
.fab-menu-playground__section p {
  margin: 0;
}
.fab-menu-playground__section h2 {
  font-size: 22px;
}
.fab-menu-playground__heading,
.fab-menu-playground__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.fab-menu-playground__heading {
  justify-content: space-between;
}
.fab-menu-playground__controls label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fab-menu-playground__controls select {
  border: 1px solid var(--mdv-sys-color-outline);
  border-radius: 8px;
  padding: 8px;
  background: var(--mdv-sys-color-surface);
  color: var(--mdv-sys-color-on-surface);
}
.fab-menu-playground__comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 16px;
}
.fab-menu-playground__canvas {
  position: relative;
  display: grid;
  box-sizing: border-box;
  min-block-size: 300px;
  align-content: start;
  gap: 12px;
  border: 1px solid var(--mdv-sys-color-outline-variant);
  border-radius: 20px;
  padding: 20px;
  background: var(--mdv-sys-color-surface-container-low);
  color: var(--mdv-sys-color-on-surface);
}
.fab-menu-playground__wide {
  min-block-size: 400px;
}
.fab-menu-playground__resizable {
  block-size: 320px;
  min-block-size: 180px;
  overflow: auto;
  resize: vertical;
}
.fab-menu-playground__canvas > button {
  justify-self: start;
}
</style>
