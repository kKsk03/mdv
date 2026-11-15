<h1 align="center">Material Design Vue</h1>

<p align="center">
  A web component library based on Material Design.
</p>

# MDV · Material Design Vue

基于 Vue 3、TypeScript 和 Tailwind CSS v4 的 Material Design 3 组件库。Tailwind 工具类由使用方安装并编译；MDV 提供组件、主题入口和必要的普通 CSS。

当前版本为 **0.1.0**，npm 包名为 `@mdv-ui/mdv`，采用 [MIT 许可](./LICENSE)。此前的 `@kksk03/mdv@0.1.0` 是迁移前包名；后续安装请使用新包名。下列组件的约定范围、本批组合验收、整库安装包消费及 Button 按需导入体积对照已通过；生产预览实测范围为 Windows Chrome，版本未记录。正式文档站后期在独立仓库建设，本仓库使用 playground 调试与验证组件。

## 本地开发

在仓库根目录执行。当前环境基线为 Node.js 24.22.1 和 pnpm 12.14.0。

```sh
pnpm install
pnpm dev
```

`pnpm dev` 启动组件 playground，可在侧栏切换组件页面、主题基础和“组合验收”预览。组合页提供原生表单提交／重置、导航页面与嵌套浮层场景。

## 检查与构建

```sh
pnpm type-check
pnpm test:unit
pnpm lint:check
pnpm format:check
pnpm build
```

包使用 Changesets 管理版本和 CHANGELOG。普通开发提交不会直接发布；合并到 `main` 后，GitHub Actions 会创建或更新发布 PR。审核并合并发布 PR 后，工作流会重新执行检查和构建，创建版本标签与 GitHub Release，并通过 npm Trusted Publishing 发布公开包。

### 发布流程

组织创建后不需要、也不能先创建一个空的 npm 包。第一次发布 `@mdv-ui/mdv` 时，npm 会自动在 `mdv-ui` 组织下创建它。

#### 首次发布新包

当前 `package.json` 已切换到 `@mdv-ui/mdv@0.1.0`。由具备 `mdv-ui` 组织发布权限的账号在仓库根目录手动执行：

```powershell
pnpm install
pnpm type-check
pnpm test:unit
pnpm lint:check
pnpm format:check
pnpm build
pnpm publish --access public
```

发布完成后验证：

```powershell
pnpm view @mdv-ui/mdv@0.1.0 version --registry https://registry.npmjs.org
```

如果 npm 页面将新包置于 staged publishing 阶段，先按 npm 页面完成扫描后的批准流程，再复查上面的版本命令。

#### 启用后续自动发布

首次发布成功后，npm 才会出现 `@mdv-ui/mdv` 的包设置页。之后完成以下平台设置：

1. 在 GitHub 仓库 Settings → Actions → General 中允许工作流使用读写权限，并允许 Actions 创建和批准 Pull Request。
2. 在 npm 的 `@mdv-ui/mdv` 包设置中添加 GitHub Actions Trusted Publisher：仓库所有者填 `kKsk03`，仓库填 `mdv`，工作流文件填 `release.yml`，不设置环境。选择直接发布权限；如果选择 staged publishing，每次还需要手动批准。

日常开发完成一项需要进入下个版本的改动后，在仓库根目录执行：

```powershell
pnpm changeset
```

选择版本级别并填写面向使用者的说明，把生成的 `.changeset/*.md` 文件和代码一起提交。代码合并到 `main` 后，机器人会创建或更新发布 PR。你审核版本号和 CHANGELOG 后合并这个 PR；发布工作流通过后，npm 会出现新版本。

修复和兼容优化使用 `patch`，新增向后兼容能力使用 `minor`，破坏性 API 调整使用 `major`。当前版本策略是 `0.1.x` 承载修复，新增能力按后续次版本规划；在 0.x 阶段选择 `major` 可能直接进入 `1.0.0`，请只在明确决定首个稳定版本时使用。

发布后，在业务项目中按需升级：

```powershell
pnpm add @mdv-ui/mdv@0.1.1
```

从旧包迁移时，在业务项目中执行：

```powershell
pnpm remove @kksk03/mdv
pnpm add @mdv-ui/mdv@0.1.0
```

如果发布工作流在 npm 上传后于标签或 Release 步骤失败，先查询该版本是否已存在，再从 GitHub Actions 重跑工作流；不要修改同一个已发布版本或重新上传不同内容。

## 使用方样式入口

使用方自行安装并配置 Tailwind CSS v4，然后在应用的 CSS 入口按顺序导入：

```css
@import 'tailwindcss';
@import '@mdv-ui/mdv/theme';
@import '@mdv-ui/mdv/styles';
```

`@mdv-ui/mdv/theme` 提供字体、系统令牌、Tailwind 映射和包内组件的 `@source` 扫描入口；`@mdv-ui/mdv/styles` 提供必要的普通组件样式。JavaScript 入口不隐式导入 CSS。库不预编译整套 Tailwind 工具类。

## 组件覆盖

以下按 [Material Design 3 官方目录](https://m3.material.io/components) 的 36 个家族列出当前支持的主要形态；Props、事件、插槽、Expose 和详细限制见各行的使用说明。家族覆盖包含传统 M3 和 Expressive，不表示已实现官网全部可选能力。

| 官方家族／使用说明                                                              | 组件                                                                                             | 当前支持范围                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [App bars](./COMPONENTS.md#mdvappbar)                                           | MdvAppBar、MdvAppBarScaffold                                                                     | Small／Medium／Large、滚动收合与隐藏、导航组合            |
| [Badges](./COMPONENTS.md#mdvbadge)                                              | MdvBadge                                                                                         | Small 圆点、Large 标签、逻辑方向定位                      |
| [Button groups](./COMPONENTS.md#mdvbuttongroup-与-mdvbuttongroupitem)           | MdvButtonGroup、MdvButtonGroupItem                                                               | Standard／Connected、操作与单多选、五档尺寸               |
| [Buttons](./COMPONENTS.md#mdvbutton)                                            | MdvButton                                                                                        | 五种官方配色外观、五档尺寸、Round／Square；另有 link 扩展 |
| [Extended FABs](./COMPONENTS.md#mdvfab-与-mdvextendedfab)                       | MdvExtendedFab                                                                                   | 三档尺寸、扩缩、滚动与 Toolbar 联动                       |
| [FAB menu](./COMPONENTS.md#mdvfabmenu-与-mdvfabmenuitem)                        | MdvFabMenu、MdvFabMenuItem                                                                       | Expressive／Baseline、展开、键盘与浮层组合                |
| [FABs](./COMPONENTS.md#mdvfab-与-mdvextendedfab)                                | MdvFab                                                                                           | 四档尺寸、七套配色、按钮／链接与定位                      |
| [Icon buttons](./COMPONENTS.md#mdviconbutton)                                   | MdvIconButton                                                                                    | 四种配色外观、五档尺寸、三档宽度、形状与 toggle           |
| [Segmented buttons](./COMPONENTS.md#mdvsegmentedbutton)                         | MdvSegmentedButton、MdvSegmentedButtonItem                                                       | 传统 M3 单选／多选、密度与表单                            |
| [Split buttons](./COMPONENTS.md#mdvsplitbutton)                                 | MdvSplitButton                                                                                   | 四种外观、五档尺寸、独立操作与菜单入口                    |
| [Cards](./COMPONENTS.md#mdvcard)                                                | MdvCard                                                                                          | Filled／Outlined／Elevated、按钮／链接与 dragged 视觉     |
| [Carousel](./COMPONENTS.md#mdvcarousel)                                         | MdvCarousel                                                                                      | 四类布局、居中、多宽高比、稳定 key 与动态遮罩             |
| [Checkbox](./COMPONENTS.md#mdvcheckbox)                                         | MdvCheckbox                                                                                      | 布尔／数组选择、mixed、表单与校验                         |
| [Chips](./COMPONENTS.md#mdvchip)                                                | MdvChip、MdvChipSet                                                                              | Assist／Filter／Input／Suggestion、选择与删除             |
| [Date pickers](./COMPONENTS.md#mdvdatepicker-与-mdvdaterangepicker)             | MdvDatePicker、MdvDateRangePicker                                                                | Docked 单日、Modal／Fullscreen 单日和范围、输入模式       |
| [Time pickers](./COMPONENTS.md#mdvtimepicker)                                   | MdvTimePicker                                                                                    | Modal 拨盘／输入、12／24 小时、纵横与自动模式             |
| [Dialogs](./COMPONENTS.md#mdvdialog)                                            | MdvDialog、MdvFullscreenDialog                                                                   | 普通／全屏、关闭拦截、焦点与滚动管理                      |
| [Divider](./COMPONENTS.md#mdvdivider)                                           | MdvDivider                                                                                       | 横竖、Full-width／Inset／Middle-inset 与语义              |
| [Lists](./COMPONENTS.md#mdvlist)                                                | MdvList、MdvListItem、MdvListSubheader                                                           | Expressive／Baseline × Standard／Segmented、内容与选择    |
| [Loading indicator](./COMPONENTS.md#mdvloadingindicator)                        | MdvLoadingIndicator                                                                              | Default／Contained、七形状、暂停／装饰和静态减弱动画      |
| [Progress indicators](./COMPONENTS.md#mdvlinearprogress-与-mdvcircularprogress) | MdvLinearProgress、MdvCircularProgress                                                           | Flat／Wavy、确定／不确定进度                              |
| [Menus](./COMPONENTS.md#mdvmenu)                                                | MdvMenu、MdvContextMenu、MdvMenuItem、MdvMenuGroup                                               | Expressive／Baseline、分组／选择、Flyout／Push 子菜单     |
| [Navigation bar](./COMPONENTS.md#mdvnavigationbar)                              | MdvNavigationBar、MdvNavigationBarItem                                                           | 当前 Flexible 形态、紧凑／中等窗口布局                    |
| [Navigation drawer](./COMPONENTS.md#mdvnavigationdrawer)                        | MdvNavigationDrawer、MdvModalNavigationDrawer、MdvNavigationDrawerItem、MdvNavigationDrawerGroup | 传统 M3 Standard／Modal、分组与关闭拦截                   |
| [Navigation rail](./COMPONENTS.md#mdvnavigationrail)                            | MdvNavigationRail、MdvModalNavigationRail、MdvNavigationRailItem                                 | 收起／展开、Standard／Modal、内容与焦点管理               |
| [Radio button](./COMPONENTS.md#mdvradio)                                        | MdvRadio、MdvRadioGroup                                                                          | 互斥选择、键盘、表单与校验                                |
| [Search](./COMPONENTS.md#mdvsearchbarmdvsearchview-与-mdvsearchappbar)          | MdvSearchBar、MdvSearchView、MdvSearchAppBar                                                     | Contained／Divided、Docked／Fullscreen／auto 与应用栏组合 |
| [Bottom sheets](./COMPONENTS.md#mdvbottomsheet)                                 | MdvBottomSheet、MdvBottomSheetScaffold                                                           | Standard／Modal、预设高度、手势与键盘替代操作             |
| [Side sheets](./COMPONENTS.md#mdvsidesheet)                                     | MdvSideSheet、MdvSideSheetScaffold                                                               | Standard／Modal、Start／End、贴边／分离与布局让位         |
| [Sliders](./COMPONENTS.md#mdvslider)                                            | MdvSlider                                                                                        | 单值／中心／范围、五档尺寸、横竖与离散步进                |
| [Snackbar](./COMPONENTS.md#mdvsnackbar)                                         | MdvSnackbar、MdvSnackbarProvider、useSnackbar                                                    | 消息、操作、队列、显式作用域与计时                        |
| [Switch](./COMPONENTS.md#mdvswitch)                                             | MdvSwitch                                                                                        | 原生表单、校验、标签与状态图标                            |
| [Tabs](./COMPONENTS.md#mdvtabs)                                                 | MdvTabs、MdvTab、MdvTabPanel                                                                     | Primary／Secondary、固定／滚动、键盘与可选横滑            |
| [Text fields](./COMPONENTS.md#mdvtextfield)                                     | MdvTextField                                                                                     | Filled／Outlined、单行／多行、错误、计数与原生表单        |
| [Toolbars](./COMPONENTS.md#mdvtoolbar)                                          | MdvToolbar                                                                                       | Docked／Floating、Standard／Vibrant、收合／隐藏与配套 FAB |
| [Tooltips](./COMPONENTS.md#mdvtooltip)                                          | MdvTooltip、MdvRichTooltip                                                                       | 普通／富内容、临时／持久提示与键盘进入                    |

[MdvIcon](./COMPONENTS.md#mdvicon) 是配套的本地 SVG 图标渲染器，不额外计为官方组件家族。

### 首版支持边界

- 普通 MdvButton 提供操作按钮，尚无独立 toggle 选择模型；按压时保持当前圆角是本项目的交互约定。带选择语义的操作可使用 MdvIconButton 或 MdvButtonGroup。
- Segmented Button 与 Navigation Drawer 保留传统 M3 形态。Expressive 项目分别优先使用 Connected Button Group 与 Expanded Navigation Rail。
- 日期范围不提供 Docked 布局；Time Picker 使用 Modal。轮播不提供自动播放或无限循环。
- 不同组件的原生表单支持范围见各自 API；ChipSet 不隐式创建提交字段。SSR／hydration 有组件规格，真实读屏、触屏、跨浏览器和当前整库安装包验证范围按实际结果记录。

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

主题颜色使用 CSS `light-dark()`，需要支持该特性的现代浏览器；完整浏览器兼容矩阵尚待验收。每个显式主题作用域会重新解析颜色角色，局部覆盖应放在所需的作用域上。浮层的原生 dialog／popover、局部主题和回退层级约束见各组件说明，嵌套组合在 playground 的“组合验收”页复核。

## 种子色动态配色

完整主题生成和 DOM 应用从独立入口导入。Button、IconButton 和 Checkbox 的局部种子色能力共用 HCT／TonalPalette 基础算法，因此组件入口会包含相应计算代码；它不导入这里的完整主题生成与 DOM 管理逻辑。预设色直接引用 CSS 变量，自定义种子色按规范化色号复用有容量上限的计算结果。

```ts
import { applyMdvColorScheme, createMdvColorScheme } from '@mdv-ui/mdv/dynamic-color'

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
import { applyMdvColorScheme, createMdvColorScheme } from '@mdv-ui/mdv/dynamic-color'

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
