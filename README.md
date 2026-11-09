# MDV

一个以 Vue 3、TypeScript 和 Tailwind CSS v4 构建的 Material Design 3 组件库。
Tailwind 工具类由使用方安装并编译；本项目提供组件、主题入口和必要的普通 CSS。

项目目前处于早期开发阶段。主题、字体、动态配色与 MdvButton 已完成本地验收及真实安装包消费验证；MdvIconButton、MdvIcon、MdvTextField、MdvCheckbox、MdvRadio、MdvSwitch、MdvSlider、MdvChip 与 MdvChipSet 已完成当前约定范围的本地检查与开发预览验收，真实包消费另行验证。正式文档站计划在独立仓库建设；本仓库使用 playground 调试组件。

## 本地开发

在仓库根目录执行。当前环境基线为 Node.js 24.22.1 和 pnpm 12.14.0。

```sh
pnpm install
pnpm dev
```

`pnpm dev` 启动组件 playground，可在侧栏切换组件页面和主题基础预览。

## 检查与构建

```sh
pnpm type-check
pnpm test:unit
pnpm lint:check
pnpm format:check
pnpm build
```

根包当前仍设置为 `private`。通过本地检查和真实消费项目验证后，再准备发布配置。

## 使用方样式入口

以下示例用于安装本地 tarball 后的接入；项目目前尚未公开发布。使用方自行安装并配置 Tailwind CSS v4，然后在应用的 CSS 入口按顺序导入：

```css
@import 'tailwindcss';
@import 'mdv/theme';
@import 'mdv/styles';
```

`mdv/theme` 提供字体、系统令牌、Tailwind 映射和包内组件的 `@source` 扫描入口；`mdv/styles` 提供必要的普通组件样式。JavaScript 入口不隐式导入 CSS。库不预编译整套 Tailwind 工具类。

## 组件使用说明

组件的示例、Props、插槽、状态与使用限制见 [COMPONENTS.md](./COMPONENTS.md)。

- [MdvButton 按钮](./COMPONENTS.md#mdvbutton)
- [MdvIconButton 图标按钮](./COMPONENTS.md#mdviconbutton)
- [MdvIcon 图标](./COMPONENTS.md#mdvicon)
- [MdvTextField 文本框](./COMPONENTS.md#mdvtextfield)
- [MdvCheckbox 复选框](./COMPONENTS.md#mdvcheckbox)
- [MdvRadio 单选框](./COMPONENTS.md#mdvradio)
- [MdvSwitch 开关](./COMPONENTS.md#mdvswitch)
- [MdvSlider 滑块](./COMPONENTS.md#mdvslider)
- [MdvChip 纸片与 MdvChipSet](./COMPONENTS.md#mdvchip)

## 主题与排版

默认使用浅色主题。把 `data-mdv-theme` 设置在 `html` 或局部容器上，可使用 `light`、`dark`、`system`；`system` 通过 CSS 跟随系统变化，不需要 JavaScript 监听器。

```html
<section data-mdv-theme="system" class="bg-mdv-surface font-mdv text-mdv-on-surface">
  <h1 class="text-mdv-headline-large">应用标题</h1>
  <p class="text-mdv-body-large">跟随系统的颜色与排版。</p>
</section>
```

主题使用 `--mdv-sys-*` CSS 变量，包含 49 个 MD3 颜色角色及 success／warning／info 的 12 个扩展角色、15 级排版、圆角、6 级阴影和动效基础。常用工具类包括 `bg-mdv-primary`、`text-mdv-on-primary`、`bg-mdv-success-container`、`text-mdv-on-success-container`、`text-mdv-body-large`、`rounded-mdv-medium`、`shadow-mdv-elevation-2`。动效时长可以使用 `duration-(--mdv-sys-motion-duration-medium-2)`；系统开启减少动态效果时，默认时长令牌会缩短。

在需要自定义的作用域上覆盖变量。背景与前景应配对调整：

```css
.brand-panel {
  --mdv-sys-color-primary: #006c4c;
  --mdv-sys-color-on-primary: #ffffff;
}
```

主题入口通过 `@fontsource/roboto` 随包依赖提供 Roboto 400／500 正体，字体资源由应用构建工具处理，不请求字体 CDN，也无需另行下载字体。中文按 `Noto Sans SC`、`Microsoft YaHei UI`、`Microsoft YaHei`、系统字体的顺序回退；未安装 Noto Sans SC 时使用后续字体，不附带完整中文字库。组件使用固定字体栈，应用页面可通过 `font-mdv` 使用同一字体；库不设置 `body` 字体或布局。

主题颜色使用 CSS `light-dark()`，需要支持该特性的现代浏览器；完整浏览器兼容矩阵尚待验收。每个显式主题作用域会重新解析颜色角色，局部覆盖应放在所需的作用域上。后续浮层组件的主题继承会随对应组件实现。

## 种子色动态配色

完整主题生成和 DOM 应用从独立入口导入。Button、IconButton 和 Checkbox 的局部种子色能力共用 HCT／TonalPalette 基础算法，因此组件入口会包含相应计算代码；它不导入这里的完整主题生成与 DOM 管理逻辑。预设色直接引用 CSS 变量，自定义种子色按规范化色号复用有容量上限的计算结果。

```ts
import { applyMdvColorScheme, createMdvColorScheme } from 'mdv/dynamic-color'

const colors = createMdvColorScheme('#006c4c')
const restore = applyMdvColorScheme(document.documentElement, colors)

// 不再需要这次应用时，恢复此前的配色。
restore()
```

`createMdvColorScheme` 接受完整的 `#RRGGBB` 色号，返回只读的 `{ seed, light, dark }`；输入无效时抛出 `TypeError`。使用 Material Color Utilities 的 Tonal Spot、2021 配色规范和标准对比度，生成浅色／深色完整角色。输出色彩按官方算法调整，不保证 `primary` 等于输入的种子色；生成结果也不等同于默认固定色板。

该 API 仍生成 49 个 MD3 角色，`MdvColorRole` 表示这组生成角色；固定的 success／warning／info 扩展由主题 CSS 提供，不在返回值或该类型中。

`applyMdvColorScheme` 接受 HTML 元素、SVG 元素或 Document，同时写入两套配色，保留 `data-mdv-theme`，由 CSS 决定当前模式。不同容器可应用不同种子色；返回的清理函数可重复调用，并恢复原有内联变量与优先级。同一目标多次应用时，最后一份尚未清理的配色生效。

在 Vue 中，把 DOM 应用与清理放进生命周期：

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { applyMdvColorScheme, createMdvColorScheme } from 'mdv/dynamic-color'

const panel = useTemplateRef<HTMLElement>('panel')
const colors = createMdvColorScheme('#006c4c')
let restore: (() => void) | undefined

onMounted(() => {
  if (panel.value) restore = applyMdvColorScheme(panel.value, colors)
})

onBeforeUnmount(() => restore?.())
</script>

<template>
  <section ref="panel" data-mdv-theme="system" class="bg-mdv-surface font-mdv text-mdv-on-surface">
    <p class="text-mdv-body-large">局部动态主题</p>
  </section>
</template>
```

生成配色不读取浏览器全局变量，可在服务端调用；应用配色需要真实 DOM 目标。主题持久化与 SSR 首屏配色注入尚未封装，初始模式可由应用直接写入 HTML 属性。

第三方令牌、算法和字体的来源及许可见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
