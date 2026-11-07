# MDV

一个以 Vue 3、TypeScript 和 Tailwind CSS v4 构建的 Material Design 3 组件库。
Tailwind 工具类由使用方安装并编译；本项目提供组件、主题入口和必要的普通 CSS。

项目目前处于早期开发阶段。主题、字体、动态配色与基础包消费流程已完成本地验收；MdvButton 首版已实现，本轮行为、视觉与安装包验收仍待完成。正式文档站计划在独立仓库建设；本仓库使用 playground 调试组件。

## 本地开发

在仓库根目录执行。当前环境基线为 Node.js 24.22.1 和 pnpm 12.14.0。

```sh
pnpm install
pnpm dev
```

`pnpm dev` 启动组件 playground。

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

## MdvButton

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton } from 'mdv'

const loading = ref(false)
</script>

<template>
  <MdvButton>保存</MdvButton>
  <MdvButton variant="tonal" size="m" shape="square">创建项目</MdvButton>
  <MdvButton color="success">保存成功</MdvButton>
  <MdvButton color="error" variant="tonal">删除</MdvButton>
  <MdvButton color="#006C4C">局部种子色</MdvButton>
  <MdvButton full-width :loading="loading" loading-text="保存中…" @click="loading = !loading">
    保存
  </MdvButton>
  <MdvButton hover-shadow>开启悬停阴影</MdvButton>
  <MdvButton variant="link" href="/guide" target="_blank" rel="noopener noreferrer">
    打开指南
  </MdvButton>
</template>
```

| Prop | 类型／可选值 | 默认值 |
| --- | --- | --- |
| `variant` | `filled`、`tonal`、`outlined`、`elevated`、`text`、`link` | `filled` |
| `color` | `primary`、`secondary`、`tertiary`、`success`、`warning`、`error`、`info` 或 `#RGB`／`#RRGGBB` 种子色 | 不提供 |
| `size` | `xs`、`s`、`m`、`l`、`xl` | `s` |
| `shape` | `round`、`square` | `round` |
| `type` | `button`、`submit`、`reset`，仅对原生按钮生效 | `button` |
| `href` | `string`；提供时使用原生链接 | 不提供 |
| `disabled` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `loadingText` | `string`；加载时的标签，省略时沿用默认插槽 | 不提供 |
| `hoverShadow` | `boolean`；开启适用变体的悬停阴影 | `false` |
| `fullWidth` | `boolean` | `false` |

`variant` 只控制外观。任何外观都能提供 `href`，此时渲染 `<a>`，透传 `target`、`rel`、`download` 等原生链接属性；不指定 `target` 时在当前标签页打开。`href=""` 按原生链接处理；不需要链接语义时直接省略 `href`。未提供 `href` 时渲染 `<button>`，包括 `variant="link"` 的情况，不自动添加默认 URL。`link` 是 MDV 扩展，外观接近 `text`，仅在 `:focus-visible` 时为标签显示下划线。

`color` 选择色系，可与全部 `variant` 组合。省略时保留官方默认角色：tonal 使用 secondary-container，outlined 使用中性文字和描边；显式指定 `color="primary"` 后，tonal 改用 primary-container，outlined 使用 primary 文字和描边。

| variant | 显式指定 color 后的配色 |
| --- | --- |
| `filled` | 主色背景与配套文字色 |
| `tonal` | 容器背景与配套容器文字色 |
| `outlined` | 透明背景、该色系的文字和描边 |
| `text`／`link` | 透明背景与该色系文字 |
| `elevated` | 保留 surface-container-low 和阴影，使用该色系文字 |

primary／secondary／tertiary／error 引用当前主题角色。success／warning／info 是 MDV 扩展语义色，各自提供浅深色主色、on-color、container 和 on-container；不会随着全局品牌种子色变成另一种语义色。可在所需的主题作用域覆盖 `--mdv-sys-color-success`、`--mdv-sys-color-on-success`、`--mdv-sys-color-success-container`、`--mdv-sys-color-on-success-container`，warning／info 同理，背景和前景需配对覆盖。

十六进制 `color` 表示局部 MD3 种子色，支持大小写和 `#RGB` 缩写，不接受透明色或任意 CSS 表达式。组件使用 HCT Tonal Spot／2021 的 primary 色系与标准对比度，生成按钮所需的四组浅深色角色；最终背景不保证等于输入值。配色由 CSS 跟随浅色／深色／系统模式，不修改外部主题，也不使用异步取色。运行时更改或清除 `color` 会更新或恢复默认配色；无效输入回退默认值，并在开发环境提示。

图标、指示器、状态层、涟漪和焦点反馈跟随该色系；disabled 始终使用统一中性禁用配色，forced-colors 使用系统颜色。`color="error"` 只表达视觉语义，不自动禁用或添加 `aria-invalid`。

`loading` 显示“指示器＋标签”，整组居中，不显示前后图标。提供 `loading-text` 时使用该文字，否则沿用默认标签；根元素设置 `aria-busy="true"`。指示器是装饰内容，可访问名称来自当前显示的标签，或使用方显式传入的 `aria-label`。loading 本身仍可点击、导航或提交表单；需要阻止激活时，同时绑定 `disabled`。

组件提前预留普通内容和加载内容中较宽的尺寸，必要时同时预留较高的内容，避免仅切换 loading 时宽高跳动。普通状态可能比只容纳原标签略宽；未提供 `loading-text` 时也会为指示器预留空间。隐藏占位内容不参与交互与可访问名称，默认标签插槽只渲染一次。文案、图标、字号、size 或容器宽度改变时会正常重新布局；希望显示不同加载文案时，优先使用 `loading-text`，而不是在切换 loading 的同时替换默认标签。

悬停阴影默认关闭。`hover-shadow` 为 filled／tonal 开启悬停时的 elevation 1，为 elevated 开启从常态 elevation 1 到悬停 elevation 2 的变化；elevated 自身的常态阴影一直保留。text／outlined／link 不因此新增阴影，disabled 时不显示阴影，键盘焦点轮廓也不受此开关影响。默认关闭是 MDV 的设计选择；官方规范为上述适用变体定义了悬停 elevation。

`disabled` 对按钮使用原生禁用；对链接临时移除 `href`、设置 `role="link"`、`aria-disabled="true"` 和 `tabindex="-1"`，阻止鼠标与键盘激活及调用方的对应事件处理。恢复启用时，原链接地址、Tab 顺序和监听恢复。

默认插槽是标签，`leading` 和 `trailing` 分别提供前后图标。图标容器按尺寸设置大小，直接传入的 SVG／图片填满容器，并隐藏于辅助技术；可访问名称应来自标签或根节点的 `aria-label`。使用 SVG 时推荐 `currentColor`。官方优先建议前置图标，且避免同一按钮同时使用两个图标；两个插槽均可用。

```vue
<MdvButton>
  <template #leading>
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
      <path d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8z" />
    </svg>
  </template>
  创建
</MdvButton>
```

尺寸采用当前 [M3 Expressive Button 规格](https://m3.material.io/components/buttons/specs)。常规单行标签、默认根字号下的规格如下；长标签和较大字体允许自然撑高：

| size | 高度 | 水平留白（含描边） | 图标大小 | 图标间距 | outlined 描边 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `xs` | 32px | 12px | 20px | 4px | 1px |
| `s` | 40px | 16px | 20px | 8px | 1px |
| `m` | 56px | 24px | 24px | 8px | 1px |
| `l` | 96px | 48px | 32px | 12px | 2px |
| `xl` | 136px | 64px | 40px | 16px | 3px |

`round` 使用胶囊圆角；`square` 在 xs／s 为 12px、m 为 16px、l／xl 为 28px。点击、长按与释放时保持所选圆角，按压反馈使用状态层、涟漪与适用的阴影变化。状态层与涟漪独立叠加，点击结束后鼠标仍在按钮上时，保留悬停底色；鼠标离开后清除对应的悬停状态。

支持 hover、局部涟漪、键盘焦点与减少动态效果；触控设备上最小命中区域为 48px，不改变可见容器尺寸。`fullWidth` 填满可用宽度，特殊尺寸可通过 `style` 调整。`class`、`style`、`id`、`form`、`name`、`value`、ARIA 和原生事件透传到根节点。按钮保留浏览器原生的 Enter／空格与表单行为，链接使用原生 Enter 激活；不要在内容或图标插槽中嵌套其他交互控件。

公共类型可从 `mdv` 导入：`MdvButtonVariant`、`MdvButtonColor`、`MdvButtonSize`、`MdvButtonShape`、`MdvButtonType`。`MdvButtonColor` 的十六进制分支使用模板字面量类型，位数与字符合法性由运行时校验。当前普通 Button 不包含 toggle 选择行为或 Icon Button。

## 主题与排版

默认使用浅色主题。把 `data-mdv-theme` 设置在 `html` 或局部容器上，可使用 `light`、`dark`、`system`；`system` 通过 CSS 跟随系统变化，不需要 JavaScript 监听器。

```vue
<script setup lang="ts">
import { MdvButton } from 'mdv'
</script>

<template>
  <section data-mdv-theme="system" class="bg-mdv-surface font-mdv text-mdv-on-surface">
    <h1 class="text-mdv-headline-large">应用标题</h1>
    <MdvButton>保存</MdvButton>
  </section>
</template>
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

完整主题生成和 DOM 应用从独立入口导入。Button 的局部种子色能力也使用 HCT／TonalPalette 基础算法，因此组件入口会包含相应计算代码；它不导入这里的完整主题生成与 DOM 管理逻辑。预设色直接引用 CSS 变量，自定义种子色按规范化色号复用有容量上限的计算结果。

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
import { MdvButton } from 'mdv'
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
  <section ref="panel" data-mdv-theme="system" class="font-mdv">
    <MdvButton>保存</MdvButton>
  </section>
</template>
```

生成配色不读取浏览器全局变量，可在服务端调用；应用配色需要真实 DOM 目标。主题持久化与 SSR 首屏配色注入尚未封装，初始模式可由应用直接写入 HTML 属性。

第三方令牌、算法和字体的来源及许可见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
