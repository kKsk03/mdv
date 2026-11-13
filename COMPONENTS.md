# MDV 组件使用说明

本文记录已实现组件的 API、示例与使用注意事项。使用前请先完成 [样式接入](./README.md#使用方样式入口)。

- [MdvButton 按钮](#mdvbutton)
- [MdvIconButton 图标按钮](#mdviconbutton)
- [MdvIcon 图标](#mdvicon)
- [MdvTextField 文本框](#mdvtextfield)
- [MdvCheckbox 复选框](#mdvcheckbox)
- [MdvRadio 单选框](#mdvradio)
- [MdvSwitch 开关](#mdvswitch)
- [MdvSlider 滑块](#mdvslider)
- [MdvChip 纸片与 MdvChipSet](#mdvchip)
- [MdvSegmentedButton 分段按钮](#mdvsegmentedbutton)
- [MdvCard 卡片](#mdvcard)
- [MdvDivider 分割线](#mdvdivider)
- [MdvBadge 徽标](#mdvbadge)
- [MdvList 列表](#mdvlist)
- [MdvLinearProgress 与 MdvCircularProgress 进度指示器](#mdvlinearprogress-与-mdvcircularprogress)
- [MdvDialog 对话框](#mdvdialog)
- [MdvFullscreenDialog 全屏对话框](#mdvfullscreendialog)
- [MdvMenu 菜单家族](#mdvmenu)
- [MdvTooltip 与 MdvRichTooltip 提示](#mdvtooltip)
- [MdvSnackbar 消息提示](#mdvsnackbar)
- [MdvBottomSheet 与 MdvBottomSheetScaffold 底部面板](#mdvbottomsheet)
- [MdvSideSheet 与 MdvSideSheetScaffold 侧边面板](#mdvsidesheet)
- [MdvTabs、MdvTab 与 MdvTabPanel 标签页](#mdvtabs)
- [MdvNavigationBar 与 MdvNavigationBarItem 导航栏](#mdvnavigationbar)
- [MdvNavigationRail、MdvModalNavigationRail 与 MdvNavigationRailItem 导航轨](#mdvnavigationrail)
- [MdvNavigationDrawer 导航抽屉家族](#mdvnavigationdrawer)
- [MdvAppBar 应用栏](#mdvappbar)
- [MdvSearchBar、MdvSearchView 与 MdvSearchAppBar 搜索](#mdvsearchbarmdvsearchview-与-mdvsearchappbar)
- [MdvToolbar 工具栏](#mdvtoolbar)

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

| Prop          | 类型／可选值                                                                                          | 默认值   |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| `variant`     | `filled`、`tonal`、`outlined`、`elevated`、`text`、`link`                                             | `filled` |
| `color`       | `primary`、`secondary`、`tertiary`、`success`、`warning`、`error`、`info` 或 `#RGB`／`#RRGGBB` 种子色 | 不提供   |
| `size`        | `xs`、`s`、`m`、`l`、`xl`                                                                             | `s`      |
| `shape`       | `round`、`square`                                                                                     | `round`  |
| `type`        | `button`、`submit`、`reset`，仅对原生按钮生效                                                         | `button` |
| `href`        | `string`；提供时使用原生链接                                                                          | 不提供   |
| `disabled`    | `boolean`                                                                                             | `false`  |
| `loading`     | `boolean`                                                                                             | `false`  |
| `loadingText` | `string`；加载时的标签，省略时沿用默认插槽                                                            | 不提供   |
| `hoverShadow` | `boolean`；开启适用变体的悬停阴影                                                                     | `false`  |
| `fullWidth`   | `boolean`                                                                                             | `false`  |

`variant` 只控制外观。任何外观都能提供 `href`，此时渲染 `<a>`，透传 `target`、`rel`、`download` 等原生链接属性；不指定 `target` 时在当前标签页打开。`href=""` 按原生链接处理；不需要链接语义时直接省略 `href`。未提供 `href` 时渲染 `<button>`，包括 `variant="link"` 的情况，不自动添加默认 URL。`link` 是 MDV 扩展，外观接近 `text`，仅在 `:focus-visible` 时为标签显示下划线。

`color` 选择色系，可与全部 `variant` 组合。省略时保留官方默认角色：tonal 使用 secondary-container，outlined 使用中性文字和描边；显式指定 `color="primary"` 后，tonal 改用 primary-container，outlined 使用 primary 文字和描边。

| variant        | 显式指定 color 后的配色                           |
| -------------- | ------------------------------------------------- |
| `filled`       | 主色背景与配套文字色                              |
| `tonal`        | 容器背景与配套容器文字色                          |
| `outlined`     | 透明背景、该色系的文字和描边                      |
| `text`／`link` | 透明背景与该色系文字                              |
| `elevated`     | 保留 surface-container-low 和阴影，使用该色系文字 |

primary／secondary／tertiary／error 引用当前主题角色。success／warning／info 是 MDV 扩展语义色，各自提供浅深色主色、on-color、container 和 on-container；不会随着全局品牌种子色变成另一种语义色。可在所需的主题作用域覆盖 `--mdv-sys-color-success`、`--mdv-sys-color-on-success`、`--mdv-sys-color-success-container`、`--mdv-sys-color-on-success-container`，warning／info 同理，背景和前景需配对覆盖。

十六进制 `color` 表示局部 MD3 种子色，支持大小写和 `#RGB` 缩写，不接受透明色或任意 CSS 表达式。组件使用 HCT Tonal Spot／2021 的 primary 色系与标准对比度，生成按钮所需的四组浅深色角色；最终背景不保证等于输入值。配色由 CSS 跟随浅色／深色／系统模式，不修改外部主题，也不使用异步取色。运行时更改或清除 `color` 会更新或恢复默认配色；无效输入回退默认值，并在开发环境提示。

图标、指示器、状态层、涟漪和焦点反馈跟随该色系；disabled 始终使用统一中性禁用配色，forced-colors 使用系统颜色。`color="error"` 只表达视觉语义，不自动禁用或添加 `aria-invalid`。

`loading` 显示“指示器＋标签”，整组居中，不显示前后图标。提供 `loading-text` 时使用该文字，否则沿用默认标签；根元素设置 `aria-busy="true"`。指示器是装饰内容，可访问名称来自当前显示的标签，或使用方显式传入的 `aria-label`。loading 本身仍可点击、导航或提交表单；需要阻止激活时，同时绑定 `disabled`。

普通状态与加载状态均按当前可见的文字、图标／指示器和标准内边距自然布局，不提前预留另一状态的空间。加载文案较长时按钮会自然变宽，结束后恢复；需要始终等宽时，由使用方通过 `style` 指定宽度，或使用 `full-width`。默认标签插槽只挂载一次，使用自定义加载文案时原标签暂时移出布局和可访问名称，结束后恢复；未加载时不渲染自定义加载文案或指示器。显式传入空字符串 `loading-text=""` 时，加载期间仅显示居中指示器，此时请通过 `aria-label` 或 `aria-labelledby` 提供名称。

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

| size |  高度 | 水平留白（含描边） | 图标大小 | 图标间距 | outlined 描边 |
| ---- | ----: | -----------------: | -------: | -------: | ------------: |
| `xs` |  32px |               12px |     20px |      4px |           1px |
| `s`  |  40px |               16px |     20px |      8px |           1px |
| `m`  |  56px |               24px |     24px |      8px |           1px |
| `l`  |  96px |               48px |     32px |     12px |           2px |
| `xl` | 136px |               64px |     40px |     16px |           3px |

MDV 为短内容设置最小宽度，普通外观按两侧留白加 32px、text／link 按两侧留白加 16px 计算；这是 MDV 的布局约定。内容超过下限后自然撑开，最小宽度也不会超过父容器的可用宽度。

| size | filled／tonal／outlined／elevated 最小宽度 | text／link 最小宽度 |
| ---- | -----------------------------------------: | ------------------: |
| `xs` |                                       56px |                40px |
| `s`  |                                       64px |                48px |
| `m`  |                                       80px |                64px |
| `l`  |                                      128px |               112px |
| `xl` |                                      160px |               144px |

`round` 使用胶囊圆角；`square` 在 xs／s 为 12px、m 为 16px、l／xl 为 28px。点击、长按与释放时保持所选圆角，按压反馈使用状态层、涟漪与适用的阴影变化。状态层与涟漪独立叠加，点击结束后鼠标仍在按钮上时，保留悬停底色；鼠标离开后清除对应的悬停状态。

支持 hover、局部涟漪、键盘焦点与减少动态效果；触控设备上最小命中区域为 48px，不改变可见容器尺寸。`fullWidth` 填满可用宽度，特殊尺寸可通过 `style` 调整。`class`、`style`、`id`、`form`、`name`、`value`、ARIA 和原生事件透传到根节点。按钮保留浏览器原生的 Enter／空格与表单行为，链接使用原生 Enter 激活；不要在内容或图标插槽中嵌套其他交互控件。

公共类型可从 `mdv` 导入：`MdvButtonVariant`、`MdvButtonColor`、`MdvButtonSize`、`MdvButtonShape`、`MdvButtonType`。`MdvButtonColor` 的十六进制分支使用模板字面量类型，位数与字符合法性由运行时校验。当前普通 Button 不包含 toggle 选择行为或 Icon Button。

## MdvIconButton

基于 [M3 Icon buttons](https://m3.material.io/components/icon-buttons/specs)，提供普通操作与受控切换两种行为。默认 filled／s／default width／round。

下面通过 `MdvIcon` 组合图标，先按 [图标接入说明](#mdvicon) 安装数据包。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvIcon, MdvIconButton } from 'mdv'
import favorite from '@iconify-icons/material-symbols/favorite'
import favoriteOutline from '@iconify-icons/material-symbols/favorite-outline'

const selected = ref(false)
const loading = ref(false)
</script>

<template>
  <MdvIconButton v-model:selected="selected" :loading="loading" aria-label="收藏">
    <template #default>
      <MdvIcon :icon="favoriteOutline" />
    </template>
    <template #selected>
      <MdvIcon :icon="favorite" />
    </template>
  </MdvIconButton>
</template>
```

示例图形来自 Material Symbols，许可见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。插槽仍接受自己的 SVG 或图标组件。

| Prop       | 类型／可选值                                                                                          | 默认值                  |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------- |
| `variant`  | `filled`、`tonal`、`outlined`、`standard`                                                             | `filled`                |
| `color`    | `primary`、`secondary`、`tertiary`、`success`、`warning`、`error`、`info` 或 `#RGB`／`#RRGGBB` 种子色 | 不提供                  |
| `size`     | `xs`、`s`、`m`、`l`、`xl`                                                                             | `s`                     |
| `width`    | `narrow`、`default`、`wide`                                                                           | `default`               |
| `shape`    | `round`、`square`，指定未选中时的形状                                                                 | `round`                 |
| `selected` | `boolean`；提供时进入受控切换模式                                                                     | `undefined`（普通模式） |
| `type`     | `button`、`submit`、`reset`，仅对原生按钮生效                                                         | `button`                |
| `href`     | `string`；普通模式中提供时使用原生链接                                                                | 不提供                  |
| `disabled` | `boolean`                                                                                             | `false`                 |
| `loading`  | `boolean`；显示居中指示器                                                                             | `false`                 |

省略 `selected` 是普通按钮，不产生 `aria-pressed` 或切换事件；`selected="false"` 应使用布尔绑定 `:selected="false"`。提供布尔 `selected`（包括 false）即进入切换模式；点击发出 `update:selected`，父级更新后才改变选中外观，不维护另一份内部状态。一般使用 `v-model:selected`；也可绑定固定值并监听更新。原生 `@click` 先执行，调用 `event.preventDefault()` 可取消这次切换。键盘激活交给原生按钮，避免重复触发。

普通模式中，`href` 决定是否渲染 `<a>`，与外观无关。支持空字符串及原生 `target`、`rel`、`download`，不自动添加地址或 `_blank`。切换模式始终使用 `<button>`；同时提供 `selected` 与 `href` 时忽略 `href`，并在开发环境提示。

`disabled` 使用原生按钮禁用；链接则移除 `href`，设置 `role="link"`、`aria-disabled="true"`、`tabindex="-1"`，阻止激活与调用方对应的事件处理。恢复启用时恢复地址和监听。`loading` 只把图标替换为居中指示器，宽高保持不变，设置 `aria-busy="true"`，保留原可访问名称；仍能点击、切换或导航，阻止操作需同时传入 `disabled`。隐藏的图标保持挂载，指示器不参与名称。

| 插槽       | 参数                               | 用途                                                   |
| ---------- | ---------------------------------- | ------------------------------------------------------ |
| 默认       | `{ selected: boolean }`            | 普通／未选中图标；没有 selected 插槽时，也用于选中状态 |
| `selected` | `{ selected: boolean }`，值为 true | 已选中图标；省略时回退默认插槽                         |

也可在默认插槽中读取状态，让已有图标组件切换图形：

```vue
<MdvIconButton v-model:selected="selected" aria-label="收藏">
  <template #default="{ selected: isSelected }">
    <MdvIcon :icon="isSelected ? favorite : favoriteOutline" />
  </template>
</MdvIconButton>
```

普通按钮建议实心图标；切换按钮建议未选空心、选中实心，以颜色之外的方式表达状态。组件不自动把任意 SVG 改成对应实心图形。SVG 推荐 `currentColor` 与 `focusable="false"`；直接放入的 SVG／图片按尺寸填满图标容器。图标容器始终隐藏于辅助技术并禁止内部聚焦，不要在插槽中放置可交互控件。

**必须提供 `aria-label` 或 `aria-labelledby` 描述动作。** 仅图标或 SVG 的 title 不作为组件名称来源。切换按钮自动设置 `aria-pressed`，名称保持稳定，例如始终为“收藏”；不要随选中状态改成“取消收藏”。loading 不移除名称。缺失名称时开发环境会提示；引用的标签元素是否存在仍由使用方保证。可透传原生 `title`，但它不是 MD3 Tooltip；本组件不内置 Tooltip，可通过独立的 `MdvTooltip`／`MdvRichTooltip` 组合。

| size | 可见高度 | 图标 | narrow 宽 | default 宽 | wide 宽 | square 圆角 | outlined 描边 |
| ---- | -------: | ---: | --------: | ---------: | ------: | ----------: | ------------: |
| `xs` |     32px | 20px |      28px |       32px |    40px |        12px |           1px |
| `s`  |     40px | 24px |      32px |       40px |    52px |        12px |           1px |
| `m`  |     56px | 24px |      48px |       56px |    72px |        16px |           1px |
| `l`  |     96px | 32px |      64px |       96px |   128px |        28px |           2px |
| `xl` |    136px | 40px |     104px |      136px |   184px |        28px |           3px |

`round` 使用完整圆角。切换按钮选中时 round→square、square→round，取消后恢复，并支持平滑过渡。按下、长按与释放均不额外改变圆角；按压反馈使用独立状态层和涟漪。hover 为 8%，focus／pressed 为 10%；涟漪结束后保留仍适用的悬停底色。四款均不增加阴影。

**根节点的命中区域至少 48×48px，并实际占据布局空间。** 可见容器小于 48px 时，通过根节点留白居中显示；例如 s／default 的可见区域 40×40px，根节点为 48×48px。并排布局不会由组件向外扩张隐形命中区。特殊尺寸优先通过 style 的局部变量设置，同时调整可见尺寸和留白：

```vue
<MdvIconButton
  aria-label="收藏"
  :style="{
    '--mdv-icon-button-height': '64px',
    '--mdv-icon-button-width': '80px',
    '--mdv-icon-button-icon-size': '28px',
  }"
>
  <!-- 项目的 SVG 或图标组件 -->
</MdvIconButton>
```

直接设置根节点的 CSS width／height 会调整包含命中留白的外盒；需要精确控制可见容器时使用上面的变量。用户 style 可以覆盖自动生成的局部配色变量。

省略 `color` 时，按官方角色区分普通、切换未选与已选：

| variant    | 普通                                                    | 切换未选                              | 切换已选                                    |
| ---------- | ------------------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| `filled`   | primary／on-primary                                     | surface-container／on-surface-variant | primary／on-primary                         |
| `tonal`    | secondary-container／on-secondary-container             | 同普通                                | secondary／on-secondary                     |
| `outlined` | 透明背景，outline-variant 描边，on-surface-variant 图标 | 同普通                                | inverse-surface／inverse-on-surface，无描边 |
| `standard` | 透明背景，on-surface-variant 图标                       | 同普通                                | 透明背景，primary 图标                      |

显式 `color` 沿用 Button 的预设与种子色规则：filled 普通／已选使用该色系主色，未选仍为中性；tonal 普通／未选使用容器色，选中使用主色；outlined 普通／未选使用该色系图标和描边，选中使用容器色、去掉描边；standard 普通／已选使用主色，切换未选保持中性。十六进制表示种子色而非直接背景色，浅深模式由 CSS 跟随当前主题；两类按钮共享有容量上限的算法缓存，不修改全局主题。

禁用时使用中性颜色：图标为 on-surface 的 38%，filled／tonal 与已选 outlined 容器为 on-surface 的 10%；未选 outlined 保留 outline-variant 描边，standard 保持透明。支持键盘焦点、reduced-motion 和 forced-colors；减少动态效果时关闭旋转与涟漪，形状过渡缩短，forced-colors 使用系统前景、边框和选中颜色。

`class`、`style`、`id`、`form`、`name`、`value`、ARIA、原生事件透传到根节点。不声明自定义 click 事件或额外 expose 方法；按钮保留原生 Enter／空格／表单行为，链接使用原生 Enter。

公共类型可从 `mdv` 导入：`MdvIconButtonVariant`、`MdvIconButtonColor`、`MdvIconButtonSize`、`MdvIconButtonWidth`、`MdvIconButtonShape`、`MdvIconButtonType`。

## MdvIcon

使用 Google Material Symbols 图形和本地 SVG 数据，渲染由 `@iconify/vue/offline` 提供。图标同步输出为 `<svg>`，不请求图标 API 或字体 CDN。`MdvIcon` 随 MDV 提供；使用 Material Symbols 的应用另行安装图标数据包：

```sh
pnpm add @iconify-icons/material-symbols
```

每个图标从自己的子路径导入。MDV 不导入或注册整套图标集合，应用构建工具按实际导入处理产物。

```vue
<script setup lang="ts">
import { MdvButton, MdvIcon } from 'mdv'
import homeOutline from '@iconify-icons/material-symbols/home-outline'
import save from '@iconify-icons/material-symbols/save'
</script>

<template>
  <span class="inline-flex items-center gap-2 text-mdv-primary">
    <MdvIcon :icon="homeOutline" />
    首页
  </span>
  <MdvIcon :icon="homeOutline" :size="32" color="#006c4c" aria-label="首页" />
  <MdvButton>
    <template #leading><MdvIcon :icon="save" /></template>
    保存
  </MdvButton>
</template>
```

| Prop    | 类型                                           | 默认值                            |
| ------- | ---------------------------------------------- | --------------------------------- |
| `icon`  | `MdvIconData`；本地 Iconify SVG 数据对象，必填 | 无                                |
| `size`  | `MdvIconSize`，即 `number \| string`           | 独立使用 24px；按钮插槽内跟随容器 |
| `color` | `string`，CSS 颜色                             | 继承 `currentColor`               |

`icon` 接收导入的数据对象，不接收 `"material-symbols:home"` 等字符串名称。也可使用其他图标集或自有的 Iconify 格式数据，至少包含 SVG `body`，可提供 `width`、`height` 等数据字段。只传入可信的数据，组件不负责清洗 SVG。无效输入保留空的图标盒子，开发环境提示；不会尝试联网补取。

默认图标盒子为 24×24px。数字 `size` 按 px 处理；字符串支持 `1em`、`2rem`、`var(--my-icon-size)` 等 CSS 长度。在 `MdvButton` 前后插槽或 `MdvIconButton` 中省略 `size`，由按钮的官方尺寸规则控制图标。显式传入 `size` 可覆盖容器填充大小，但不会自动扩大按钮或图标容器；自定义时需一起考虑可用空间。

图形默认使用 `currentColor`，跟随文字色、按钮颜色、禁用态和当前主题。`color` 直接使用 CSS 颜色，也支持 `var(--mdv-sys-color-error)`；它不执行种子色计算，也不把 `success` 等名称转换为语义色。需要使用语义色时传入相应 CSS 变量。用户 `style` 优先于 `size` 和 `color`，支持对象、字符串或数组；可用 `class` 覆盖默认样式，尺寸覆盖建议使用 `size` 或 `style`。

推荐以 Material Symbols 的 **Outlined 风格、400 字重**为基线。风格与填充由导入资源决定，例如：

| 风格     | 空心                       | 实心               |
| -------- | -------------------------- | ------------------ |
| Outlined | `favorite-outline`         | `favorite`         |
| Rounded  | `favorite-outline-rounded` | `favorite-rounded` |
| Sharp    | `favorite-outline-sharp`   | `favorite-sharp`   |

上表名称都是 `@iconify-icons/material-symbols/` 后的单图标子路径。空心／实心切换时更换 `icon` 数据，也可使用 `MdvIconButton` 的默认／selected 插槽。这里使用静态 SVG，不提供可变字体的 `FILL`、`wght`、`GRAD`、`opsz` 轴，也不会随尺寸自动换用另一份光学轮廓。

图标默认是装饰内容，设置 `aria-hidden="true"`、`focusable="false"`，不会自行加入 Tab 顺序。独立表达含义的图标使用 `aria-label` 或 `aria-labelledby`，组件会保留 `role="img"` 并解除默认隐藏；显式传入的 `aria-hidden` 优先。引用的标签元素由应用保证存在。

在带文字的按钮内保持图标装饰语义；只有图标的操作使用 `MdvIconButton`，把名称提供给按钮。图标的 `@click` 和原生属性可以透传，但图标本身不提供按钮的键盘或表单行为。`title` 可按原生属性透传，不替代可访问名称或 Tooltip。

`class`、`style`、`id`、ARIA、`data-*` 和原生事件透传至根 SVG；没有自定义事件、插槽或额外 expose 方法。数据中的原始图形坐标保留在 `viewBox` 内。Material Symbols 的纯路径数据可在 SSR 首屏同步输出；本轮提供了 SSR／hydration 测试，执行结果仍待验收。自定义数据若含渐变、裁剪或内部 ID，需要在自己的 SSR 页面额外验证引用与 hydration，当前不承诺覆盖全部自定义 SVG。

公共类型可从 `mdv` 导入：`MdvIconData`、`MdvIconSize`。渲染器作为 MDV 的正常依赖提供；整套 Material Symbols 数据仅用于本仓库开发，使用方按需安装数据包。

## MdvTextField

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvTextField } from 'mdv'

const name = ref('')
const password = ref('')
const notes = ref('')
const quantity = ref<string | number>('')
</script>

<template>
  <MdvTextField
    v-model="name"
    label="姓名"
    name="name"
    autocomplete="name"
    required
    clearable
    :maxlength="20"
    supporting-text="用于公开显示"
  />
  <MdvTextField
    v-model="password"
    label="密码"
    type="password"
    autocomplete="new-password"
    password-toggle
  />
  <MdvTextField v-model="notes" variant="filled" label="备注" multiline :rows="4" full-width />
  <MdvTextField v-model.number="quantity" label="数量" type="number" min="0" step="1" />
</template>
```

| Prop                               | 类型／说明                                                                | 默认值     |
| ---------------------------------- | ------------------------------------------------------------------------- | ---------- |
| `modelValue`／`v-model`            | `string \| number`                                                        | `''`       |
| `modelModifiers`                   | Vue 自动传入的 `trim`／`number`／`lazy` 标记                              | `{}`       |
| `variant`                          | `outlined`、`filled`                                                      | `outlined` |
| `type`                             | `text`、`password`、`email`、`tel`、`url`、`search`、`number`；单行时生效 | `text`     |
| `label`                            | 浮动标签                                                                  | `''`       |
| `placeholder`                      | 原生占位提示，避免与未浮动标签重叠                                        | `''`       |
| `supportingText`                   | 辅助说明                                                                  | `''`       |
| `error`                            | 业务错误状态                                                              | `false`    |
| `errorText`                        | 错误状态下优先显示的说明，替换辅助文字                                    | `''`       |
| `prefixText`／`suffixText`         | 仅展示的前缀／后缀，不计入输入值                                          | `''`       |
| `multiline`                        | 改用原生 `textarea`                                                       | `false`    |
| `rows`                             | 多行输入的初始行数                                                        | `3`        |
| `disabled`／`readonly`／`required` | 对应原生输入属性                                                          | `false`    |
| `clearable`                        | 有内容且可编辑时提供清除操作                                              | `false`    |
| `passwordToggle`                   | `type="password"` 单行输入提供显隐操作                                    | `false`    |
| `showCount`                        | 显示当前字数；省略时有合法 `maxlength` 才显示字数／上限                   | 不提供     |
| `fullWidth`                        | 占满父容器可用宽度                                                        | `false`    |

单行输入默认容器高度 56px、输入排版 16px／24px、浮动标签与辅助文字 12px／16px、图标 24px。普通边线为 1px，聚焦按现行官网令牌使用 3px；线宽变化不改变布局。填充外观只有上方圆角，描边外观四角为 4px。默认宽度 280px 是 MDV 的布局默认值，可通过外层 `style` 调整，也可用 `full-width`；默认最大宽度不会超过父容器。

聚焦、有值或浏览器自动填充时标签浮动。描边外观使用透明背景和真实边框缺口；缺口直接开合，标签保留上浮／收回过渡。点击框内边缘或留白也可聚焦，插槽中的独立交互元素保留自身操作。

多行输入从整个框的角落原生竖向缩放。textarea 的滚动区域从边框内缘开始，文字仍保留原有上边距；textarea 跨过尾部操作列，滚动条使用细宽度、主题 outline 色和透明轨道，仅在本组件内生效。滚动条与缩放手柄贴近框缘并位于边线内侧，聚焦时随边线加粗向内移动；尾部操作的触控范围留在滚动条内侧。Filled 多行底部同样预留完整的缩放区域，避免滚动条与手柄重叠。图标、前后缀与尾部操作保持顶部对齐，辅助文字和计数位于框外。`rows` 决定初始行数，禁用时关闭拖动；类型选择器、自动增高和富文本不在该组件范围内。

### 值、事件与原生属性

默认绑定字符串，包括 `type="number"`。需要数值时明确使用 `v-model.number`，空输入仍是 `''`，非空值按 Vue 常用的 `parseFloat` 规则转换，无法转换时保留字符串。`.trim` 去除绑定值首尾空白，编辑时保留原始文本至 change／失焦；`.lazy` 等原生 change 再提交绑定值。中文拼音组合过程中不提交中间字符。清除操作立即提交空字符串，包括 `.lazy`。

`update:modelValue` 的参数为处理后的 `string | number`；常用 `@input`、`@change`、`@focus`、`@blur`、组合输入和 `@invalid` 监听获得实际 input／textarea 的原生事件，`event.target` 是该控件。程序赋值不伪造 input／change；内置清除会派发一次原生 input，不派发 change。不要使用 `value`／`defaultValue` 与 `v-model` 竞争控制内容。

`id`、`name`、`form`、`autocomplete`、`inputmode`、`maxlength`、`min`、`max`、`step`、`pattern`、ARIA、`data-*` 和原生监听透传到实际控件，按浏览器支持的输入类型生效；`class`／`style` 属于最外层。`dir`／`lang` 同时用于外层布局与控件。提供 `label` 时自动关联；省略可见标签时必须自行提供 `aria-label`／`aria-labelledby`，placeholder 不能代替名称。

辅助文字、计数与调用方 `aria-describedby` 自动合并，保留外部描述。错误时设置 `aria-invalid` 并关联错误文字；辅助说明变化使用礼貌播报，计数不会每输入一个字就强制播报。前后缀是装饰内容，重要单位请同时在标签或辅助说明中说明。长标签在可用空间内省略，辅助说明允许换行。

`maxlength` 和计数遵循原生 UTF-16 长度规则，表情可能占两位；它们不是按可见字形分组计数。`show-count="false"` 在模板中应写作 `:show-count="false"`。`maxlength` 对 `type="number"` 的原生输入限制不生效，数值约束使用 min／max／step。

### 图标、清除与密码

`leading`／`trailing` 插槽接收装饰图标或操作控件。图标推荐 `MdvIcon`；自定义操作使用 `MdvIconButton`，提供可访问名称，表单中保留 `type="button"`。自定义 `trailing` 接管整个尾部区域，即使同时设置 clearable／passwordToggle，也不再渲染内置动作。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import search from '@iconify-icons/material-symbols/search'
import { MdvIcon, MdvTextField } from 'mdv'

const query = ref('')
</script>

<template>
  <MdvTextField v-model="query" label="搜索" type="search" clearable>
    <template #leading><MdvIcon :icon="search" /></template>
  </MdvTextField>
</template>
```

自定义图标的数据包需按 [MdvIcon 接入说明](#mdvicon) 安装；文本框内置的三个图标已随组件构建，无需额外安装图标集或请求网络。

清除操作只在有内容、未禁用、非只读且不在组合输入时显示；为尾部动作预留位置，清空后焦点回到输入框。密码切换保留值、焦点与选区，按钮名称在“显示密码”／“隐藏密码”间切换并提供 `aria-pressed`；只读密码仍可显隐，禁用时不可操作。内置动作名称当前为中文。自定义插槽动作的禁用、名称和行为由使用方负责。

### 表单与校验

使用原生 input／textarea，所以 `FormData`、Enter 提交、浏览器自动填充、外部 `form` 关联及 disabled／readonly 语义按浏览器规则工作。disabled 输入不参与提交；readonly 输入仍提交。祖先 `fieldset disabled` 会沿用原生禁用规则。

必填、格式等原生约束首次展示时不自动标红，提交或调用原生检查方法触发 invalid 后才显示错误；更正后恢复辅助说明。错误文字优先级为 `errorText`、已报告的原生校验消息、`supportingText`，原生消息语言由浏览器决定。`errorText` 单独存在不开启错误状态，业务错误由 `error` 控制。`error` 只表达业务状态，不会自动阻止原生表单提交；业务提交拦截由应用处理，或通过 `setCustomValidity()` 纳入原生校验。

```vue
<form @submit.prevent="save">
  <MdvTextField v-model="email" label="邮箱" name="email" type="email" required />
  <MdvButton type="submit">保存</MdvButton>
  <MdvButton type="reset" variant="outlined">重置</MdvButton>
</form>
```

原生 reset 将字段与绑定值恢复到**组件创建时的 modelValue**，清理已报告的错误显示；若应用取消 reset，字段保持当前值。程序写入新值不会改变重置基线。reset 不清除调用方持有的 `error`／`errorText`，也不清除原生自定义校验消息；后者用 `setCustomValidity('')` 主动移除。表单 reset 事件后的绑定同步在微任务执行，需要读取 Vue 更新后状态时等待 `nextTick()`。

### 公开方法与类型

通过模板 ref 调用以下方法：

| 方法                                 | 原生行为                             |
| ------------------------------------ | ------------------------------------ |
| `focus(options?: FocusOptions)`      | 聚焦实际控件，支持 preventScroll     |
| `blur()`                             | 移除输入焦点                         |
| `select()`                           | 选中全部文字；仅在原生类型支持时生效 |
| `checkValidity(): boolean`           | 检查原生约束，失败触发 invalid       |
| `reportValidity(): boolean`          | 检查约束并显示浏览器的校验反馈       |
| `setCustomValidity(message: string)` | 设置自定义原生校验；空字符串解除     |

```ts
import { useTemplateRef } from 'vue'
import { MdvTextField } from 'mdv'

const field = useTemplateRef<InstanceType<typeof MdvTextField>>('field')
field.value?.focus({ preventScroll: true })
```

公共类型：`MdvTextFieldVariant`、`MdvTextFieldType`、`MdvTextFieldValue`、`MdvTextFieldModelModifiers`。SSR 使用 Vue 稳定 ID 关联标签与描述；已提供行为、SSR 和 hydration 测试，当前约定范围已完成本地检查与开发预览验收。自动填充和密码管理器的实际表现需要在目标浏览器中验证。

## MdvCheckbox

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvCheckbox } from 'mdv'
import type { MdvCheckboxValue } from 'mdv'

const accepted = ref(false)
const channels = ref<MdvCheckboxValue[]>(['email'])
</script>

<template>
  <MdvCheckbox v-model="accepted" label="接受服务条款" name="terms" value="accepted" required />
  <fieldset>
    <legend>通知方式</legend>
    <MdvCheckbox v-model="channels" value="email" name="channel" label="邮件通知" />
    <MdvCheckbox v-model="channels" value="sms" name="channel" label="短信通知" />
  </fieldset>
</template>
```

| Prop／模型                               | 类型／说明                                   | 默认值      |
| ---------------------------------------- | -------------------------------------------- | ----------- |
| `modelValue`／`v-model`                  | `boolean \| (string \| number)[]`            | `false`     |
| `value`                                  | 数组成员与原生表单提交值，`string \| number` | `'on'`      |
| `indeterminate`／`v-model:indeterminate` | 半选状态，横线优先于勾显示                   | `false`     |
| `label`                                  | 可点击的标签文字                             | `''`        |
| `supportingText`                         | 标签下方的辅助说明                           | `''`        |
| `error`                                  | 外部业务错误状态                             | `false`     |
| `errorText`                              | 错误状态下优先显示的说明                     | `''`        |
| `disabled`／`required`                   | 原生禁用／本项必选约束                       | `false`     |
| `color`                                  | 主题／语义色或十六进制种子色                 | `'primary'` |

方框 18px、圆角 2px、状态层 40px；组件实际保留 48 × 48px 的控件点击区域。标签默认在后，长中文、英文和连续标识符可以换行，控件对齐标签首行；`dir="rtl"` 同时作用于布局和输入。相邻标签使用 on-surface，不随选中颜色变化；禁用时使用禁用文字色。

默认插槽替换 `label`，适合加入强调文字或链接。点击标签与控件区域均可切换；标签中的原生链接、按钮等独立交互元素保持自身行为。辅助说明位于标签下方，不属于切换区域。没有可见标签时，必须用 `aria-label`／`aria-labelledby` 为实际输入提供名称。

### 模型、半选与事件

布尔模型表示单个选项；数组模型按 `value` 是否存在决定选中状态，数字 `1` 与字符串 `'1'` 分开处理。添加／删除成员时生成新数组，保留其他成员与顺序，不修改传入数组。多个 Checkbox 可以绑定同一个数组；组的标题和语义使用 `fieldset`／`legend`。

半选是独立状态：`indeterminate` 为 true 时显示横线并向辅助技术表达 mixed。激活半选项会请求清除半选并选中；之后再激活才取消选中，不在三种状态间循环。可通过 `v-model:indeterminate` 同步，也可用计算属性从子项推导：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { MdvCheckbox } from 'mdv'
import type { MdvCheckboxModelValue } from 'mdv'

const options = ['email', 'sms']
const selected = ref<string[]>(['email'])
const allSelected = computed(() => selected.value.length === options.length)
const partlySelected = computed(() => selected.value.length > 0 && !allSelected.value)

function toggleAll(value: MdvCheckboxModelValue) {
  selected.value = value === true ? [...options] : []
}
</script>

<template>
  <fieldset>
    <legend>通知方式</legend>
    <MdvCheckbox
      :model-value="allSelected"
      :indeterminate="partlySelected"
      label="全选"
      @update:model-value="toggleAll"
    />
    <MdvCheckbox
      v-for="option in options"
      :key="option"
      v-model="selected"
      :value="option"
      :label="option"
    />
  </fieldset>
</template>
```

`update:modelValue` 传入布尔值或新数组，`update:indeterminate` 传入布尔值。一次原生激活的 input／change 不会重复提交同一个模型更新。`@click`、`@input`、`@change`、`@focus`、`@blur`、`@invalid` 等监听获得实际 input 的原生事件；程序赋值与 reset 不伪造 input／change。取消 click 的默认动作不会提交模型更新。受控 v-model 未接受更新时，实际 input 会恢复父级状态。

Tab／Shift+Tab 移动焦点，空格切换；Enter 保持所在原生表单的行为。勾线与半选横线平滑过渡，按压圆角不变；hover／focus 状态层和涟漪独立叠加。系统减少动态效果时关闭组件动画；forced-colors 下保留可辨识的边框、图形与键盘焦点。

### 配色与错误

`color` 支持 `primary`、`secondary`、`tertiary`、`success`、`warning`、`error`、`info`，以及 `#RGB`／`#RRGGBB` 种子色。预设引用当前作用域的主题令牌；种子色沿用 Button 的 HCT／TonalPalette 浅深色计算和缓存，不直接把原色号作为选中填充，也不修改全局主题。无效颜色回退到 primary，开发环境给出提示。

禁用表现优先于错误，错误优先于自定义颜色。`color="error"` 仅采用红色系，不表示校验失败；`error` 表达业务错误并设置 `aria-invalid`。`errorText` 单独存在不开启错误状态；有错误时文字优先级为 errorText、已报告的原生校验消息、supportingText。外部描述与内部辅助／错误说明的 ARIA ID 自动合并，动态说明使用礼貌播报。

### 原生表单与重置

`id`、`name`、`form`、ARIA、`data-*`、原生监听等透传到实际 `input[type="checkbox"]`；`class`／`style` 属于最外层。checked／indeterminate 由模型管理，不使用原生 `checked`／`defaultChecked` 属性竞争控制。

FormData 只包含有 name、选中且未禁用的控件，值取自 value；数字提交时由原生表单转为字符串。未选中项不提交，半选本身不会增加独立的提交值：是否提交仍取决于底层 checked。相同 name 可以提交多个值，通过 `FormData.getAll()` 读取。外部 form 关联和祖先 fieldset disabled 按原生规则工作，包括首个 legend 内控件的禁用例外。

`required` 表示**当前这一项必须选中**，不会自动变成同名组“至少选一个”。首次展示不会自动报红；提交或显式校验触发 invalid 后显示原生错误，更正后恢复辅助文字。`error` 本身不阻止原生提交；需要原生约束时使用 required 或 setCustomValidity。

`form.reset()` 恢复组件创建时的模型和半选状态，并同步 v-model；数组基线保留独立快照。程序修改模型不改变重置基线，取消 reset 时不恢复。reset 隐藏已报告的原生错误，但不清除使用方的 error／errorText 或原生自定义约束；后者用 setCustomValidity('') 清除。同步在 reset 默认动作后的微任务执行，读取最终 Vue／DOM 状态时等待 nextTick。

### 公开方法与类型

| 方法                                 | 行为                             |
| ------------------------------------ | -------------------------------- |
| `focus(options?: FocusOptions)`      | 聚焦实际输入，支持 preventScroll |
| `blur()`                             | 移除输入焦点                     |
| `checkValidity(): boolean`           | 检查原生约束，失败触发 invalid   |
| `reportValidity(): boolean`          | 检查约束并显示浏览器的校验反馈   |
| `setCustomValidity(message: string)` | 设置原生自定义错误；空字符串解除 |

公共类型：`MdvCheckboxValue`、`MdvCheckboxModelValue`、`MdvCheckboxColor`，均可从 mdv 主入口导入。已提供行为、SSR 与 hydration 测试及独立开发预览；当前约定范围已完成本地检查与开发预览验收。新版本包消费另行验证。

## MdvRadio

`MdvRadio` 是单个 Material 3 单选项，`MdvRadioGroup` 是用于互斥、键盘导航和组级校验的便利容器。组容器使用原生 `fieldset`／`legend`，不把官方 Radio Button 扩展成一套选项配置 API。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvRadio, MdvRadioGroup } from 'mdv'

const plan = ref<string | number | null>(null)
</script>

<template>
  <MdvRadioGroup
    v-model="plan"
    name="plan"
    label="选择套餐"
    supporting-text="请选择一个套餐。"
    required
  >
    <MdvRadio value="basic" label="基础版" />
    <MdvRadio value="pro" label="专业版" />
    <MdvRadio value="enterprise" label="企业版" />
  </MdvRadioGroup>
</template>
```

### MdvRadio 属性

| Prop／模型              | 类型／说明                             | 默认值        |
| ----------------------- | -------------------------------------- | ------------- |
| `modelValue`／`v-model` | `string \| number \| null`；选中项的值 | `null`        |
| `value`                 | 当前选项的值，数字和字符串严格区分     | 必填          |
| `label`                 | 可点击的标签文字                       | `''`          |
| `supportingText`        | 单独使用时显示的辅助说明               | `''`          |
| `error`／`errorText`    | 单独使用时的业务错误及说明             | `false`／`''` |
| `disabled`／`required`  | 原生禁用／必选约束                     | `false`       |
| `color`                 | 主题／语义色或十六进制种子色           | `primary`     |

单独使用时可以像原生 radio 一样传入 `name`：

```vue
<MdvRadio v-model="plan" name="plan" value="basic" label="基础版" />
<MdvRadio v-model="plan" name="plan" value="pro" label="专业版" />
```

`id`、`name`、`form`、ARIA、`data-*` 和原生事件透传到实际 `input[type="radio"]`；`class`／`style` 属于组件外层。没有可见标签时，必须使用 `aria-label` 或 `aria-labelledby`。

### MdvRadioGroup 属性

| Prop／模型              | 类型／说明                    | 默认值        |
| ----------------------- | ----------------------------- | ------------- |
| `modelValue`／`v-model` | `string \| number \| null`    | `null`        |
| `name`                  | 传给组内原生 radio 的表单名称 | 未设置        |
| `label`                 | `legend` 文字                 | `''`          |
| `supportingText`        | 组级辅助说明                  | `''`          |
| `error`／`errorText`    | 组级业务错误及说明            | `false`／`''` |
| `disabled`／`required`  | 禁用整组／至少选择一项        | `false`       |
| `color`                 | 组级默认主题／语义色或种子色  | 未设置        |
| `orientation`           | `vertical` 或 `horizontal`    | `vertical`    |

组内 `MdvRadio` 会继承组的 `color` 和 `disabled`。子项仍可以用自己的 `disabled` 或 `color` 覆盖。`supportingText`、`error`、`errorText` 和 `required` 主要由组管理；这样错误说明只出现一次，也符合“这一组选一个”的校验语义。

`name` 不传时，组仍由 Vue 管理互斥和键盘行为，但不会为表单生成隐式字段。需要使用 `FormData` 时应显式传入 `name`。传入 `name` 后，选中的 radio 按原生规则提交，未选中项和 disabled 项不会提交。

### 交互、键盘与校验

- `Tab` 进入当前选中项；没有选中项时进入第一个可用项。
- `ArrowUp`／`ArrowLeft` 选择前一项，`ArrowDown`／`ArrowRight` 选择后一项；方向键会跳过 disabled 项并循环。
- `Home`／`End` 移到第一项／最后一项，`Space` 选择当前焦点项。
- 组内每次选择只产生一个 `update:modelValue`；数字 `1` 与字符串 `'1'` 分开处理。
- `required` 只在调用原生校验、提交或 `reportValidity()` 后显示错误，更正后恢复辅助说明。
- `focus()`、`blur()`、`checkValidity()`、`reportValidity()` 和 `setCustomValidity()` 可通过模板 ref 使用。
- 支持原生 `FormData`、外部 `form`、`fieldset disabled`、首个 `legend` 例外和 `form.reset()`。

单选圆点、40px 状态层和 48px 命中区使用 MD3 几何；hover 使用 8% 状态层，focus／pressed 使用 12% 状态层。支持浅色／深色、语义色、十六进制种子色、RTL、reduced-motion 与 forced-colors。已提供行为、SSR、hydration 测试和独立开发预览；当前约定范围已完成本地检查与开发预览验收。新版本包消费另行验证。

公共类型：`MdvRadioValue`、`MdvRadioModelValue`、`MdvRadioColor`、`MdvRadioOrientation`，均可从 mdv 主入口导入。

## MdvSwitch

`MdvSwitch` 是基于原生 `input[type="checkbox"]` 的二值开关。可见轨道遵循 Material 3 的 52 × 32 px 规格，外层控制区保持至少 48 px 的触控命中高度；标签、辅助文字、原生表单和校验语义由组件统一关联。未选中且无图标时手柄为 16px；选中或当前状态带图标时为 24px，按下时为 28px。选中手柄距轨道外沿 4px，RTL 时镜像排列；平移使用轻微回弹，手柄尺寸独立过渡。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvSwitch } from 'mdv'

const enabled = ref(false)
</script>

<template>
  <MdvSwitch
    v-model="enabled"
    label="接收通知"
    supporting-text="接收重要提醒。"
    name="notifications"
    value="enabled"
  />
</template>
```

### MdvSwitch 属性

| Prop／模型              | 类型／说明                              | 默认值        |
| ----------------------- | --------------------------------------- | ------------- |
| `modelValue`／`v-model` | `boolean`；开启或关闭                   | `false`       |
| `label`                 | 可点击的标签文字；默认插槽优先          | `''`          |
| `supportingText`        | 辅助说明；错误报告后按错误优先级显示    | `''`          |
| `error`／`errorText`    | 业务错误及说明；与原生 validity 分开    | `false`／`''` |
| `disabled`／`required`  | 原生禁用／必选约束                      | `false`       |
| `color`                 | 主题／语义色或 `#RGB`／`#RRGGBB` 种子色 | `primary`     |
| `labelPosition`         | `start` 或 `end`                        | `end`         |
| `value`                 | 原生表单提交值                          | `'on'`        |

`id`、`name`、`form`、`value`、`required`、ARIA、`data-*` 和原生事件会透传到实际的 `input[type="checkbox"]`；`class`、`style`、`dir` 和 `lang` 属于组件外层。没有可见标签时，必须提供 `aria-label` 或 `aria-labelledby`。`labelPosition="start"` 只改变视觉排列，不改变原生表单和阅读顺序。

### 图标与状态

默认开启时显示内置的 Material Symbols 勾，关闭时不显示图标，无需额外安装图标集或提供插槽。通过具名插槽可自定义对应状态：

```vue
<MdvSwitch v-model="enabled" label="同步">
  <template #unselected-icon><MdvIcon :icon="close" size="16" /></template>
</MdvSwitch>
```

可用插槽为 `selected-icon` 和 `unselected-icon`，只渲染与当前状态对应的图标。上例保留默认开启勾，并在关闭时显示叉；提供 `selected-icon` 可替换默认勾，提供显式空插槽则隐藏默认勾：

```vue
<MdvSwitch v-model="enabled" label="纯圆点开关">
  <template #selected-icon />
</MdvSwitch>
```

自定义插槽（包括空插槽）优先于内置图标。图标区域为 16px，尺寸变化不缩放图标；图形表示状态，组件不会把业务名称转换成图标。组件不提供 `indeterminate`、`size`、`density`、`variant`、`loading` 或 `readonly` API。颜色优先级为禁用、错误、自定义 `color`、默认主题色；未选中状态保持 surface／outline 中性色。

### 表单、校验与公开方法

- `required`、`checkValidity()`、`reportValidity()` 和 `setCustomValidity()` 使用原生约束；首次渲染不会自动显示 required 错误。
- 原生 `form.reset()` 恢复组件创建时的模型值，支持外部 `form` 关联、`fieldset disabled` 和 SSR hydration 前的用户点击。
- `focus(options?)` 与 `blur()` 通过模板 ref 操作实际 input。
- `error`／`errorText` 只表达业务状态；原生 invalid 报告后才显示原生错误，值恢复有效时回到 `supportingText`。

Switch 的状态层、选中移动、hover／focus／pressed、reduced-motion、forced-colors 和 RTL 样式限定在组件自身。已提供行为、SSR、hydration 测试及独立 playground；当前约定范围已完成本地检查与开发预览验收，真实包消费另行安排。

公共类型：`MdvSwitchColor`、`MdvSwitchLabelPosition`，均可从 mdv 主入口导入。

## MdvSlider

按现行 [Material 3 Slider 规格](https://m3.material.io/components/sliders/specs)实现标准、中心与范围滑块。当前约定范围已完成类型、单测、lint、格式、构建与开发预览验收；真实包消费另行安排。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvSlider } from 'mdv'
import type { MdvSliderModelValue } from 'mdv'

const volume = ref<MdvSliderModelValue>(40)
const exposure = ref<MdvSliderModelValue>(0)
const price = ref<MdvSliderModelValue>([20, 80])
const percent = (value: number) => `${value}%`
</script>

<template>
  <MdvSlider v-model="volume" label="音量" value-indicator :format-value="percent" />
  <MdvSlider v-model="exposure" variant="centered" :min="-100" :max="100" label="曝光偏移" />
  <MdvSlider
    v-model="price"
    variant="range"
    name="price"
    label="价格区间"
    :step="10"
    stops
    value-indicator
  />
</template>
```

### MdvSlider 属性

| Prop／模型                       | 类型／说明                                                         | 默认值                                                           |
| -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `modelValue`／`v-model`          | standard／centered 使用 `number`，range 使用 `[number, number]`    | standard 从 min 开始；centered 从中心开始；range 为 `[min, max]` |
| `variant`                        | `standard`／`centered`／`range`                                    | `standard`                                                       |
| `min`／`max`                     | 有限的上下界，max 不小于 min                                       | `0`／`100`                                                       |
| `step`                           | 正数步长，以 min 为起点；支持小数                                  | `1`                                                              |
| `centerValue`                    | centered 的高亮起点，须位于上下界内                                | `0`                                                              |
| `stops`                          | 绘制中间刻度，手柄通过短动画移动到有效档位                         | `false`                                                          |
| `size`                           | `xs`／`s`／`m`／`l`／`xl`                                          | `xs`                                                             |
| `orientation`                    | `horizontal`／`vertical`                                           | `horizontal`                                                     |
| `valueIndicator`                 | 连续滑块按压时显示；有刻度时拖动或按住稍久显示；键盘聚焦时立即显示 | `false`                                                          |
| `formatValue`                    | `(value: number) => string`，同时用于提示与 aria-valuetext         | 普通数字文字                                                     |
| `label`                          | 可见标签；默认插槽优先                                             | `''`                                                             |
| `supportingText`                 | 与原生控件关联的辅助说明                                           | `''`                                                             |
| `disabled`                       | 禁用交互和表单提交                                                 | `false`                                                          |
| `color`                          | 主题／语义色或 `#RGB`／`#RRGGBB` 种子色                            | `primary`                                                        |
| `startAriaLabel`／`endAriaLabel` | range 两个手柄的独立无障碍名称                                     | 从标签与“下限／上限”组合                                         |

五档轨道厚度为 16／24／40／56／96px，手柄长度为 44／44／52／68／108px；手柄常态厚度 4px，键盘聚焦与按压时为 2px。指针松开后恢复常态厚度并隐藏提示，保留原生焦点，随后可直接使用方向键继续调整并恢复键盘焦点反馈。横向填充所在容器；竖向初始整体高度 240px，可通过 style 调整。竖向由下向上增加，横向跟随继承的 dir；range 建议优先使用横向。

轨道朝向手柄的一侧使用 2px 小内角，在最小值或最大值处同样保持。远离手柄的外端保留对应尺寸的圆角；轨道段逐渐缩短时，外圆角随可用长度收缩，避免到达端点时突然变成大圆头。

省略模型时采用对应默认值，不在挂载时额外发出模型更新；首次用户操作后更新。传入数值会在显示、交互和表单值中限制到有效范围并对齐步长，程序传入的原始变量不会被静默改写。range 显示时整理为升序；用户更新始终发出新的升序二元组，不修改传入数组。两个手柄可相等，不能穿越；重合后可向两侧拖动或通过 Tab 分别操作。

max 始终可选；上下界差值不能被 step 整除时，最后一格较短，例如 `min=0 max=10 step=3` 可选择 0、3、6、9、10。步长很细时中间刻度会按容器长度稀疏绘制，最多约 100 个；可选数值精度仍由 step 决定。stops 关闭时保留未激活轨道的端点圆点，拖动视觉平滑跟随指针，模型仍按步长更新，释放时对齐最终有效值。

stops 开启时，手柄及轨道在拖动、点击和键盘切换档位时保留短移动过渡；连续拖动直接跟随指针。模型与事件即时更新，不等待动画结束；系统启用 reduced-motion 时关闭过渡。

启用 valueIndicator 后，有刻度的滑块快速点击只更新档位，不弹数值提示；沿滑动方向开始拖动，或按住约 200ms 后显示，松开或取消即隐藏。连续滑块和键盘焦点仍即时显示提示。提示时机不影响模型、input／change 事件或无障碍数值报告。

### 插槽、提示与组合

- 默认插槽：自定义可见标签。
- `leading`／`trailing`：轨道外侧的文字、图标或操作按钮；按钮需自行提供可访问名称。
- `inset-icon="{ value }"`：standard 且 size 为 m／l／xl 时可用。固定在轨道起点附近，随所在轨道切换颜色；手柄经过时淡出避让，并在原位恢复。RTL 时位于右侧，竖向时位于底端附近；极窄空间容纳不下时隐藏。

```vue
<MdvSlider v-model="volume" size="m" label="音量" value-indicator>
  <template #inset-icon="{ value }">
    <MdvIcon :icon="value === 0 ? volumeOff : volumeUp" />
  </template>
</MdvSlider>
```

图标通过现有 MdvIcon 与本地图形数据组合，示例需自行导入所用图标。数值提示不拦截操作；范围模式一次只显示活动手柄的提示。formatValue 应返回能独立读懂的单位文字，例如“40%”或“¥80”；没有可见 label 时须提供 aria-label／aria-labelledby，或为 range 提供两个独立名称。

精确输入可组合 MdvTextField，共享同一变量；将输入框放在滑块之后，让键盘可以紧接着访问。leading／trailing 可组合 MdvIconButton 修改同一变量。

### 交互、事件与原生表单

- `update:modelValue` 实时报告用户选取的有效数值；相同值不重复提交模型更新。
- `@input`／`@change`／`@focus`／`@blur` 及原生监听接收实际 range input 的 Event。指针拖动产生实时 input，释放且最终值与起点不同时产生一次 change；键盘每次有效步进产生 input 与 change。程序赋值和 reset 不伪造这些事件。
- pointercancel、丢失指针捕获或离开 KeepAlive 页面时结束拖动，保留最后已报告值，不额外发出 change；卸载清理监听。
- Tab 访问手柄，范围模式两个手柄分别可聚焦；方向键增减一步，Home／End 到当前手柄允许边界，PageUp／PageDown 或空格配合方向键调整十步。横向左右键按 RTL 反向，上下键保持上增下减。
- class／style／dir／lang 属于组件外层；id、name、form、ARIA、data-* 和原生监听属于实际 range input。range 的第二个 id 在首个 id 后加 `-end`。type／value／defaultValue、原生步长与边界由组件管理；不使用它们竞争控制模型。
- 底层采用原生 `input[type=range]`，内部 `step="any"` 避免双手柄动态边界改变浏览器步长基准；数值吸附与键盘步长统一由组件管理。range 始终有值，组件不提供 required／readonly 和空值必填校验。
- 有 name 且未禁用时参加 FormData。range 同名提交两个字符串，依次为下限和上限，可用 `FormData.getAll(name)` 读取；不传 name 不生成隐式字段。支持外部 form、fieldset disabled 与首个 legend 例外。
- 原生 reset 恢复组件创建时的独立模型快照，按当前 min／max／step 整理并同步 v-model；程序赋值不改变基线，取消 reset 时保留当前值。同步发生在 reset 默认动作后的微任务中，读取 Vue 更新后结果时等待 nextTick。

公开方法为 `focus(options?, thumb?)` 与 `blur()`；thumb 为 `'start'` 或 `'end'`，默认 start，普通模式忽略 end。SSR 输出原生数值与稳定 ID；hydration 前用户改值保留的自动化用例已随本轮单测通过。

公共类型：`MdvSliderModelValue`、`MdvSliderVariant`、`MdvSliderSize`、`MdvSliderOrientation`、`MdvSliderColor`、`MdvSliderThumb`。

## MdvChip

按 [Material 3 Chip 规格](https://m3.material.io/components/chips/specs)实现四类纸片及 MdvChipSet。当前约定范围已完成项目检查与开发预览验收；提供行为／SSR／hydration 用例和独立预览，真实安装包消费验证随发布准备安排。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvChip, MdvChipSet } from 'mdv'
import type { MdvChipSetModelValue } from 'mdv'

const filters = ref<MdvChipSetModelValue>(['image'])
const tags = ref(['设计讨论', '发布准备'])
</script>

<template>
  <MdvChipSet label="快捷操作">
    <MdvChip label="查看指南" href="/guide" target="_blank" rel="noopener noreferrer" />
    <MdvChip variant="suggestion" label="稍后回复" />
  </MdvChipSet>

  <MdvChipSet v-model="filters" selection="multiple" label="筛选内容">
    <MdvChip variant="filter" value="image" label="图片" />
    <MdvChip variant="filter" value="video" label="视频" />
    <MdvChip variant="filter" value="recent" label="最近一周" />
  </MdvChipSet>

  <MdvChipSet label="任务标签">
    <MdvChip
      v-for="tag in tags"
      :key="tag"
      variant="input"
      :label="tag"
      @remove="tags = tags.filter((item) => item !== tag)"
    />
  </MdvChipSet>
</template>
```

### MdvChip 属性

| Prop／模型                     | 类型／说明                                                       | 默认值                             |
| ------------------------------ | ---------------------------------------------------------------- | ---------------------------------- |
| `variant`                      | `assist`／`filter`／`input`／`suggestion`，表示用途              | `assist`                           |
| `label`                        | 标签及默认删除名称的来源；默认插槽优先显示                       | `''`                               |
| `elevated`                     | Assist、Filter、Suggestion 的抬升外观；Input 忽略此项            | `false`                            |
| `selected`／`v-model:selected` | Filter／Input 的选中状态                                         | 未提供时内部从 `false` 开始        |
| `selectable`                   | 点击主体请求切换选中；Assist／Suggestion 不参与选择              | Filter 为 `true`，Input 为 `false` |
| `removable`                    | 显示并启用尾部删除；仅 Filter／Input 可用                        | Input 为 `true`，Filter 为 `false` |
| `removeOnly`                   | Input 整颗纸片只执行删除，合为一个焦点目标；须同时允许删除       | `false`                            |
| `removeLabel`                  | 删除动作的独立可访问名称                                         | `删除${label}`                     |
| `disabled`                     | 禁用主体和删除操作                                               | `false`                            |
| `color`                        | 七种现有语义色或 `#RGB`／`#RRGGBB` 种子色                        | 保留官方默认角色                   |
| `value`                        | `string`／`number`；在 ChipSet 的单多选模式中标识可选择的 Filter | 不提供                             |
| `href`                         | Assist／Suggestion 的原生链接地址                                | 不提供                             |

Assist 执行上下文操作，Suggestion 提供建议；Filter 用来筛选，选中时显示前置勾；Input 表示已输入的标签、文件或联系人。Input 默认主体点击只执行外部业务操作；显式开启 `selectable` 后才自动请求切换选中，选中不自动增加 Filter 的勾。普通按钮固定使用 `type="button"`。

独立 Filter 或可选择的 Input 可以绑定 `v-model:selected`。未提供 selected 时内部维护选中；显式传入 selected 后以传入值为准，`update:selected` 请求父级更新，父级拒绝时不会保留虚假的选中状态。使用方的原生 click 监听先于选择处理，可以通过 `preventDefault()` 取消这次选择。关闭 selectable 后仍可通过 selected 呈现业务管理的状态。

`href` 为 Assist／Suggestion 启用 `<a>`；`target`、`rel`、`download` 等原生属性透传，不默认新开页。Filter／Input 忽略 href，并在开发环境提示。禁用链接移除地址，设置 link 语义、aria-disabled 与 tabindex，阻止激活；恢复后还原地址。

### 内容、外观与删除

- 默认插槽自定义标签，接收 `{ selected }`。
- `leading` 提供前置图标，接收 `{ selected }`；Filter 选中后平滑切换为内置 Material Symbols 勾，预留区域随状态展开／收回。
- `avatar` 仅供 Input 使用，优先于 leading，呈现 24px 圆形内容。
- `trailing` 在可删除的 Chip 中替换关闭图形，删除按钮和事件仍由组件管理；在不可删除的 Filter／Input 中作为主体末端的装饰图标，例如菜单箭头。Assist／Suggestion 不提供尾部操作。
- 图标和头像隐藏于辅助技术；插槽内使用 MdvIcon 或图片，不嵌套交互控件。

优先使用简短标签。窄容器中标签单行省略，完整文字仍留在 DOM 中。复杂默认插槽应同时提供准确的 label 或 removeLabel，保证服务端已有明确删除名称；仅有插槽文字时，挂载后从实际文字补全名称，服务端回退“删除此项”。

默认可见高度 32px、圆角 8px、图标 18px，使用现有 Label Large 排版。Assist／Filter／Suggestion 的文字侧为 16px、图标侧为 8px；Input 无前置内容时起始留白 12px，头像侧 4px，内容之间 8px。圆角不随选中或按压改变。

交互区域占据实际布局空间，高度至少 48px。具有主操作与删除操作时，两者各自保留至少 48px 宽度，最小可见宽度 88px；尾端另有透明命中空间，使关闭图标到文字及可见边缘仍各为 8px。相邻 Chip 的交互区域不会相互覆盖，可见间距可能大于 8px。

默认描边使用 outline-variant，Assist 文字使用 on-surface，其他类型使用 on-surface-variant；Filter／Input 选中使用 secondary-container 与 on-secondary-container。color 是 MDV 扩展：显式提供时用局部色系的主色、container 和 on-container，种子色沿用现有 HCT 计算及缓存，不改写全局主题。

hover 状态层为 8%，focus／pressed 为 10%。抬升款常态为 elevation 1（1dp），hover 为 elevation 2（3dp），focus／pressed 回到 elevation 1；普通已选中 Filter hover 时为 elevation 1。禁用内容按 on-surface 38%、适用的描边／容器按 12% 分别处理。支持键盘焦点环、涟漪、reduced-motion 和 forced-colors。

独立删除按钮使用 18px 图标和居中的 24px 圆形状态层；删除焦点环贴着该圆形区域绘制，实际点击区域仍为 48px。

`remove` 接收原始 MouseEvent 或 KeyboardEvent，只表示删除请求，由使用方修改数据。点击关闭按钮不会触发主体 click 或切换选中；组件不会自行删除节点。聚焦 Input 主体或关闭按钮时，可用 Delete／Backspace 请求删除；重复按键与 Ctrl／Alt／Meta 组合不重复请求。removeOnly 开启后，整颗 Input 只有一个可访问名称与焦点目标。

### MdvChipSet

| Prop／模型              | 类型／说明                                                | 默认值                 |
| ----------------------- | --------------------------------------------------------- | ---------------------- |
| `selection`             | `none`／`single`／`multiple`                              | `none`                 |
| `modelValue`／`v-model` | single 为 `string`／`number`／`null`，multiple 为相应数组 | 未选，显示时按模式解释 |
| `label`／`label` 插槽   | 组名称；插槽优先                                          | `''`                   |
| `disabled`              | 禁用所有子 Chip 的操作                                    | `false`                |
| `scrollable`            | 单行水平滚动；关闭时自动换行                              | `false`                |

默认 selection=none 只负责排列与焦点，子项的 selected 各自管理。single／multiple 接管可选择 Filter 的状态，子项须提供唯一 value，不另外绑定子项 selected。Input、Assist、Suggestion 与 selectable=false 的动作不由组模型管理。字符串与数字严格区分；单选允许再次点击取消，取消后为 null；多选每次发出新数组，不修改原数组。不在挂载时补发模型更新。

组使用 toolbar 与原生 button／a 语义，可选择动作使用 aria-pressed。使用 label、label 插槽、aria-label 或 aria-labelledby 提供组名称。Tab 进入组内唯一入口，初始优先已选中项；左右方向键按 DOM 顺序经过主操作及删除操作，跳过禁用项，RTL 反向；Home／End 到首尾。导航只移动焦点，Space／Enter 才激活。独立使用 Chip 时，两个操作分别进入原生 Tab 顺序。

删除当前聚焦项后，等父级实际移除节点，再聚焦下一个可用项，末尾则回到前一个；全部移除后聚焦组容器。使用稳定且唯一的 Vue key。若业务处理器已将焦点转移到其他控件，组尊重该落点。单行滚动模式下，键盘导航会让目标滚入视野。

MdvChip 的 class／style／dir／lang／hidden 属于外层，id／ARIA／data-* 和原生事件属于主体；删除动作通过 remove／removeLabel 管理。MdvChipSet 的原生属性和监听属于组容器。两者公开 `focus(options?)` 与 `blur()`；blur 只影响自身拥有的焦点。

Chip 不生成隐式表单字段，组模型由业务提交；本轮没有 required、原生字段校验、表单 reset 或自动标签输入 API。菜单、标签编辑器和拖拽排序可在后续复合组件中组合。服务端使用稳定 ID 与一个初始入口；hydration 后整理组入口，并保留已经落在组内的用户焦点。

公共类型：`MdvChipVariant`、`MdvChipColor`、`MdvChipValue`、`MdvChipSetSelection`、`MdvChipSetModelValue`。

## MdvSegmentedButton

此组件实现传统 Material 3 Segmented Button，用于在少量相关选项中进行单选或多选。已完成当前约定范围的本地项目检查与开发预览验收，真实包消费另行验证。M3 Expressive 推荐的 Connected Button Group 将作为后续独立组件讨论。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvSegmentedButton, MdvSegmentedButtonItem } from 'mdv'
import type { MdvSegmentedButtonModelValue } from 'mdv'

const period = ref<MdvSegmentedButtonModelValue>('week')
const details = ref<MdvSegmentedButtonModelValue>(['summary'])
</script>

<template>
  <MdvSegmentedButton v-model="period" aria-label="时间范围" name="period">
    <MdvSegmentedButtonItem value="day" label="日" />
    <MdvSegmentedButtonItem value="week" label="周" />
    <MdvSegmentedButtonItem value="month" label="月" />
  </MdvSegmentedButton>

  <MdvSegmentedButton v-model="details" selection="multiple" aria-label="显示内容" name="details">
    <MdvSegmentedButtonItem value="summary" label="摘要" />
    <MdvSegmentedButtonItem value="image" label="图片" />
    <MdvSegmentedButtonItem value="date" label="日期" />
  </MdvSegmentedButton>
</template>
```

### 组属性与选择规则

| Prop／模型              | 类型／说明                                                       | 默认值                    |
| ----------------------- | ---------------------------------------------------------------- | ------------------------- |
| `modelValue`／`v-model` | 单选为 `string`／`number`／`null`；多选为 `(string \| number)[]` | `null`，多选按空数组解释  |
| `selection`             | `single`／`multiple`                                             | `single`                  |
| `selectionRequired`     | 阻止用户取消最后一项；不自动选择、不校验外部模型                 | 单选 `true`，多选 `false` |
| `disabled`              | 禁用全部分段                                                     | `false`                   |
| `fullWidth`             | 撑满可用宽度，所有分段等宽                                       | `false`                   |
| `density`               | `0`／`-1`／`-2`／`-3`，可见高度依次 40／36／32／28px             | `0`                       |
| `showSelectedIcon`      | 显示内置勾或自定义选中图标                                       | `true`                    |
| `name`                  | 组内原生字段的提交名称                                           | 不提供                    |
| `form`                  | 原生外部表单 ID                                                  | 不提供                    |

单选会替换当前值。显式设置 `:selection-required="false"` 后，再次点击选中项会清空为 `null`。多选每次产生新数组，不修改传入数组；设置 `selection-required` 后可以限制至少保留一项。数字与字符串严格区分，例如 `:value="1"` 和 `value="1"` 是两个不同选项。

`selectionRequired` 是交互约束，不等于 HTML `required`。外部传入空值不会被擅自改写，挂载不发出默认选择事件；需要首屏有选中项时，请初始化模型。切换单多选模式时，也应由业务将模型调整为对应类型。删除选项不会自动清理业务模型。

模型更新通过 `update:modelValue` 请求父级接受；父级拒绝更新时，原生 checked 和可见状态会恢复为当前模型。程序赋值不伪造 input／change 事件。

### 分段属性、插槽与图标

| Prop       | 类型／说明                               | 默认值  |
| ---------- | ---------------------------------------- | ------- |
| `value`    | 组内唯一的 `string`／`number` 标识；必需 | 无      |
| `label`    | 可见文字，默认插槽优先                   | `''`    |
| `disabled` | 禁用这一分段                             | `false` |

`MdvSegmentedButtonItem` 必须直接放在 `MdvSegmentedButton` 中，不另设逐项 selected 模型。默认插槽、`leading` 与 `selected-icon` 插槽均接收 `{ selected }`。

- 纯文字项选中时显示前置勾；未选中文字仍居中。
- 图标加文字时，`leading` 图形与选中勾在相同位置切换。
- 纯图标项保留 leading 图形，再在旁边显示选中勾；请提供 `aria-label` 或 `aria-labelledby`。
- `selected-icon` 替换内置勾；组上设置 `:show-selected-icon="false"` 可完全关闭选中图标。
- 切换选中前已预留图标所需宽度，默认插槽只渲染一次。插槽内不要嵌套按钮、链接或输入框等交互控件。

```vue
<MdvSegmentedButton v-model="view" aria-label="显示方式">
  <MdvSegmentedButtonItem value="list" label="列表">
    <template #leading><MdvIcon :icon="listIcon" /></template>
  </MdvSegmentedButtonItem>
  <MdvSegmentedButtonItem value="grid" label="网格">
    <template #leading><MdvIcon :icon="gridIcon" /></template>
  </MdvSegmentedButtonItem>
</MdvSegmentedButton>
```

以上图标变量使用 [MdvIcon](#mdvicon) 的本地图标数据，内置勾无需使用方安装图标集。

### 外观与键盘

建议每组 2～5 个相关选项，标签简短、单行排列。默认可见高度 40px、图标 18px、左右留白至少 12px、图文间距 8px；每段实际命中区域至少 48×48px，降低 density 也保留此目标。全组各段等宽，外端全圆角、内侧直边、分隔线 1px；按压不改变圆角。窄容器保留完整标签及命中区，通过局部水平滚动容纳内容。

默认未选内容使用 on-surface，描边使用 outline，选中使用 secondary-container／on-secondary-container；颜色跟随 MDV 主题角色。hover 状态层 8%，focus／pressed 为 10%；键盘焦点环使用 secondary、3px 厚、偏移 2px，中间项使用 extra-small 小圆角，两端外侧贴合胶囊轮廓。每段独立涟漪，支持 RTL、reduced-motion 与 forced-colors。

单选使用 radiogroup／原生 radio，多选使用 group／原生 checkbox。通过 `aria-label` 或 `aria-labelledby` 为组命名。首次从外部进入第一可用项，与选中位置无关，之后保留当前焦点入口。MDV 支持 Tab 在组内逐项移动。

- Tab／Shift+Tab 按 DOM 顺序向后／向前移动焦点，不改变选中值；跳过禁用、hidden 与 inert 项，到边界时正常离开组。
- 左右键按当前 DOM 顺序移动，RTL 反向；上下键也可导航。
- Home／End 到第一／最后可用项，跳过禁用、hidden 与 inert 内容。
- 单选导航同时选择，多选导航只移动焦点；Space／Enter 激活。
- 导航会将目标滚入视野。删除当前聚焦项后，优先聚焦下一项，到末尾时退到前一项；尊重业务已经转移的外部焦点。

### 原生表单、事件与公开方法

组的原生属性和监听作用于组容器。Item 的 class／style／dir／lang／hidden 属于外层标签；id、ARIA、data-* 与原生监听属于 input。type、checked、value、tabindex、name／form 由组件及组管理；不要在 Item 上单独覆盖组的 name／form。

`click`、`input`、`change`、键盘及焦点监听接收实际 DOM 事件。可在 click 或键盘监听中用 `preventDefault()` 取消激活或导航；祖先取消 click 也会被尊重。允许清空的单选再次点击选中项时，由组件取消 checked 并派发一次 input 和 change，以提供完整的变更通知。组件不发起表单提交。

提供 name 后，FormData 仅包含已选中、可提交的字段；多选使用同名多条记录。原生字段值按 HTML 规则序列化为字符串，组模型仍保留原始类型。不提供 name 时不会生成内部字段名或额外提交项。支持组内表单、外部 form 关联和禁用 fieldset。

原生 reset 恢复组件建立时的模型快照；多选快照使用独立数组。取消 reset 会保留当前值；reset 不派发 input／change。改变 form 关联或卸载时会清理旧 reset 监听。

组和 Item 均公开 `focus(options?)` 与 `blur()`。组 focus 进入当前可用入口，blur 仅影响组内焦点；Item 只操作自身 input。服务端 ID 与初始 Tab 标记稳定，hydration 保留原生节点、已有焦点以及首屏已发生的原生选择。

公共类型：`MdvSegmentedButtonValue`、`MdvSegmentedButtonModelValue`、`MdvSegmentedButtonSelection`、`MdvSegmentedButtonDensity`。

## MdvCard

提供 Material 3 的 Outlined、Filled 与 Elevated 三种外观，默认 Outlined。当前约定范围已通过本地项目检查与开发预览验收；真实包消费另行验证。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvCard } from 'mdv'

const opens = ref(0)
const saved = ref(false)
</script>

<template>
  <!-- 静态容器：内部可以放按钮、链接和选择控件。 -->
  <MdvCard title="周末旅行" subtitle="附近的目的地">
    <p>沿湖边步道寻找一处适合停留的地方。</p>
    <template #actions>
      <MdvButton variant="text" @click="saved = !saved">
        {{ saved ? '已收藏' : '收藏' }}
      </MdvButton>
    </template>
  </MdvCard>

  <!-- 整卡按钮：内容中不再嵌套其他操作。 -->
  <MdvCard variant="filled" title="打开行程" clickable @click="opens++">
    <p>整个表面均可点击。已打开 {{ opens }} 次。</p>
  </MdvCard>

  <!-- 整卡原生链接：保留中键、新标签页和复制地址等能力。 -->
  <MdvCard
    variant="elevated"
    title="旅行指南"
    href="/guide"
    target="_blank"
    rel="noopener noreferrer"
  >
    <p>打开完整指南。</p>
  </MdvCard>
</template>
```

### 属性

| Prop        | 类型／说明                                                   | 默认值     |
| ----------- | ------------------------------------------------------------ | ---------- |
| `variant`   | `outlined`／`filled`／`elevated`                             | `outlined` |
| `title`     | 内置标题；header 插槽存在时由插槽接管                        | `''`       |
| `subtitle`  | 内置副标题；header 插槽存在时由插槽接管                      | `''`       |
| `clickable` | 开启整卡原生按钮操作                                         | `false`    |
| `href`      | 提供地址时开启整卡原生链接，优先于 clickable；空字符串也生效 | 不提供     |
| `disabled`  | 禁用整卡主操作；静态卡片的子控件由各自 disabled 管理         | `false`    |
| `dragged`   | 外部控制的拖动视觉                                           | `false`    |

卡片宽高由使用方布局和内容决定，没有尺寸档位或固定媒体比例。默认圆角 12px，文字与操作区域留白 16px；相邻文字区域不重复叠加纵向留白。标题使用 Title Medium，正文及副标题使用 Body Medium。需要其他标题级别或布局时使用插槽和应用样式。

三种外观分别使用 surface／outline-variant、surface-container-highest、surface-container-low。静态卡片不增加整卡 hover 或涟漪；整卡主操作提供 hover、pressed、focus-visible 和涟漪，按压不改变圆角。hover 状态层为 8%，focus／pressed 为 10%；焦点环使用 secondary、3px 厚、外偏移 2px。

Outlined／Filled 常态、聚焦和按压使用 elevation 0，hover 为 1，dragged 为 3；Elevated 对应为 1、2、4。dragged 状态层为 16%。禁用按变体分别处理背景、文字、描边与阴影，不使用整卡 opacity。所有外观跟随既有主题及动态配色，支持 reduced-motion、forced-colors 和 RTL。

### 插槽与组合

| 插槽      | 用途                                                         |
| --------- | ------------------------------------------------------------ |
| `header`  | 接管内置 title／subtitle 区域，可放自定义标题、头像等        |
| `media`   | 图片、视频或其他媒体，默认不留内边距、不强制比例             |
| 默认插槽  | 正文，默认留白 16px                                          |
| `actions` | 静态卡片内的独立操作；默认末端对齐、间隔 8px、空间不足时换行 |

内容顺序是 header → media → 默认插槽 → actions，未提供的区域不渲染。媒体位于卡片首端或末端时，自动沿对应外角裁切；外部焦点环保留在裁切区域之外。图片默认占满媒体宽度并按自身比例显示，需要裁切或固定比例时由使用方设置。装饰图片应提供空 alt，有信息的图片提供相应替代文本。

```vue
<MdvCard variant="elevated">
  <template #media>
    <img src="/images/lake.jpg" alt="群山环绕的湖泊" />
  </template>
  <h3 class="text-mdv-title-large text-mdv-on-surface">湖畔小屋</h3>
  <p class="mt-2">自然高度的正文与媒体。</p>
  <template #actions>
    <MdvButton variant="text">查看详情</MdvButton>
  </template>
</MdvCard>
```

静态卡片适合包含按钮、链接、输入和选择控件，也允许选择正文。整卡主操作卡片只有一个操作目标；不要在它的任何插槽中再放独立交互控件或带 controls 的媒体。开发环境会提示此类组合，应改用静态卡片及内部独立操作。

`dragged` 只负责状态层与阴影，不添加 HTML draggable，不处理指针拖动、排序、滑动删除或自动选中。拖动生命周期和替代键盘操作由业务或后续专用能力管理。

### 原生语义、名称与属性

未开启 clickable 且未提供 href 时，卡片是普通 div 容器，不添加按钮角色或 Tab 入口。仅绑定 `@click` 不会自动开启整卡交互。需要 article、列表项或其他结构语义时，在外部按内容组织。

clickable 使用原生 button，固定 `type="button"`，避免在表单中意外提交；href 使用原生 a，不默认新开页面，target、rel、download、hreflang、referrerpolicy 等按原生规则透传。组件不引入路由依赖。

主操作在 DOM 中与内容为兄弟节点并覆盖整卡，避免把块级正文和媒体嵌套进 button。内置 title 通过稳定 ID 自动提供主操作的 aria-labelledby；显式 aria-label／aria-labelledby 优先。自定义 header、仅媒体或没有 title 的主操作卡片必须自行提供可访问名称；开发环境会提示缺失名称。默认 title 是段落，不擅自决定页面标题层级，语义标题可在 header 插槽中使用 h2／h3。

交互卡片的属性分流如下：

- id、class、style、dir、lang、hidden、inert 与 data-* 放在外层卡片容器，用于布局、主题与定位。
- ARIA、tabindex、原生操作属性和原生事件监听放在内部主操作 button／a 上。type 始终由组件管理。
- 静态卡片的原生属性和事件监听均位于外层 div。

click、键盘、焦点及指针监听接收原始 DOM 事件，不重复派发 click。可以通过原生 `preventDefault()` 取消点击／导航；键盘激活遵循 button 的 Enter／Space 与链接的 Enter 规则。

disabled 的按钮使用原生 disabled，并支持禁用 fieldset；禁用链接移除 href，保留 link 角色和名称，设置 aria-disabled、tabindex=-1 并阻止激活。恢复时还原链接属性和监听。disabled 不禁用静态卡片内部的按钮，也不对媒体整体降低透明度；内部控件和媒体效果按各自需要处理。

公开 `focus(options?)` 与 `blur()`，只操作卡片自己的主操作；静态卡片调用这两个方法不会移动焦点，禁用主操作不会被 focus() 聚焦。blur() 不影响其他元素的焦点。服务端使用稳定的名称关联与原生操作结构，hydration 保留内容节点及已经落在主操作上的焦点。

公共类型：`MdvCardVariant`。

## MdvDivider

用于内容分组的 Material 3 分割线，提供横竖方向和三种缩进。当前约定范围已完成项目检查与真实浏览器预览验收；真实包消费另行验证。

```vue
<script setup lang="ts">
import { MdvButton, MdvDivider } from 'mdv'
</script>

<template>
  <div class="space-y-4">
    <p>第一组内容</p>
    <MdvDivider />
    <p>第二组内容</p>
    <MdvDivider variant="inset" />
    <p>第三组内容</p>
    <MdvDivider variant="middle-inset" />
    <p>第四组内容</p>
  </div>

  <div class="flex items-center gap-3">
    <MdvButton variant="text">编辑</MdvButton>
    <MdvDivider orientation="vertical" style="height: 32px; align-self: center" />
    <MdvButton variant="text">分享</MdvButton>
  </div>
</template>
```

### 属性与尺寸

| Prop          | 类型／说明                            | 默认值       |
| ------------- | ------------------------------------- | ------------ |
| `orientation` | `horizontal`／`vertical`              | `horizontal` |
| `variant`     | `full-width`／`inset`／`middle-inset` | `full-width` |
| `decorative`  | 是否仅作为视觉装饰                    | `true`       |

默认厚度 1px，颜色使用 `outline-variant`，线端为直角；浅色、深色和种子色配色跟随现有主题。没有 hover、pressed、选中、禁用或加载状态，也没有内置动画。强制颜色模式下使用系统 `CanvasText` 保持线条可见。

| 缩进           | 水平分割线           | 竖向分割线                         |
| -------------- | -------------------- | ---------------------------------- |
| `full-width`   | 两端 0，占满可用宽度 | 上下 0，拉伸至父布局提供的可用高度 |
| `inset`        | 起始端 16px，末端 0  | 顶部 16px，底部 0                  |
| `middle-inset` | 起始端和末端各 16px  | 上下各 16px                        |

水平缩进使用逻辑方向，RTL 下 `inset` 自动变为右侧缩进。竖向缩进是 MDV 将同一 API 沿线条方向映射的约定，不是另一组官方竖向尺寸令牌。缩进以外没有额外外边距；周围留白由使用处的 gap、padding 或 margin 管理。

水平分割线适合普通块布局、纵向 flex 或 grid。它占满父容器的可用内容宽度，单端或双端缩进会从这段宽度中扣除，不要求外层裁切溢出。

竖向分割线适合横向 flex 或 grid，通过自身的 `align-self: stretch` 适应所在行的高度；父级有 `items-center` 时仍可拉伸。它不会测量 DOM 或推测页面高度。单独放在普通块布局中时，应通过 class／style 指定高度；需要居中短线时同时覆盖 align-self，如上例所示。

```vue
<!-- 跟随这一行的内容高度。 -->
<div class="grid grid-cols-[1fr_auto_1fr] gap-4">
  <p>较短内容</p>
  <MdvDivider orientation="vertical" />
  <p>另一侧的内容可以更长，分割线随网格行高拉伸。</p>
</div>

<!-- 普通块布局中明确指定线长。 -->
<MdvDivider orientation="vertical" style="height: 48px" />
```

### 装饰与语义

官方将分割线视为装饰元素，因此默认渲染普通 div，并设置 `aria-hidden="true"`，不向辅助技术重复宣读每条视觉线。

需要表达结构分隔时设置 `:decorative="false"`。此时根节点提供 `role="separator"` 和与实际方向一致的 `aria-orientation`，移除装饰性 aria-hidden；可通过原生属性设置名称或描述。

```vue
<MdvDivider :decorative="false" aria-label="内容与操作区" />
<MdvDivider
  orientation="vertical"
  :decorative="false"
  aria-labelledby="sidebar-heading"
  style="height: 48px"
/>
```

两种模式都不主动添加 tabindex、点击动作或焦点管理。它是非交互分隔线，不能用作可拖动分割面板；内容的标题、列表和分组仍应提供自身的结构语义。

### 原生属性与样式覆盖

class、style、id、dir、lang、hidden、ARIA、data-* 和原生监听均透传到唯一根节点。`role`、`aria-hidden`、`aria-orientation` 由 decorative 与 orientation 管理，优先于同名原生属性；切换模式和方向会同步更新这些属性。组件没有自定义事件、插槽或额外公开方法，服务端可直接渲染相同结构，不依赖浏览器测量。

默认样式位于 CSS 的 components 层，可用 Tailwind 工具类覆盖，例如竖线的 `h-12`、`self-center` 或水平分割线的 `my-4`。也可使用原生 style，特殊颜色与厚度通过局部样式或主题变量控制，不增加 color／size 属性：

```vue
<!-- 水平厚度使用 height，竖向厚度使用 width。 -->
<MdvDivider style="height: 2px; background-color: var(--mdv-sys-color-primary)" />
<MdvDivider orientation="vertical" style="width: 2px; height: 48px" />

<!-- 一组分割线的局部颜色角色。 -->
<div style="--mdv-sys-color-outline-variant: var(--mdv-sys-color-primary)">
  <MdvDivider />
</div>
```

无需单独导入新样式或安装依赖，继续使用统一的 `mdv/theme`、`mdv/styles` 入口。公共类型：`MdvDividerOrientation`、`MdvDividerVariant`。

## MdvBadge

在图标按钮、普通按钮或头像等内容的逻辑右上角显示简短状态。当前实现覆盖 Material 3 的 Small 圆点和 Large 内容两种形态；徽标是包裹内容的视觉指示器，不会抢点击、进入 Tab 顺序或管理焦点。

```vue
<script setup lang="ts">
import { MdvBadge, MdvButton, MdvIcon, MdvIconButton } from 'mdv'
import notifications from '@iconify-icons/material-symbols/notifications-outline'
</script>

<template>
  <MdvBadge aria-label="有未读消息">
    <MdvIconButton variant="standard" aria-label="通知">
      <MdvIcon :icon="notifications" />
    </MdvIconButton>
  </MdvBadge>

  <MdvBadge variant="large" :content="3" aria-label="3 条未读消息">
    <MdvButton variant="tonal">查看消息</MdvButton>
  </MdvBadge>

  <MdvBadge variant="large" content="99+" aria-label="超过 99 条未读消息">
    <span>收件箱</span>
  </MdvBadge>
</template>
```

### 属性与内容

| Prop      | 类型／说明                                                          | 默认值  |
| --------- | ------------------------------------------------------------------- | ------- |
| `variant` | `small` 或 `large`                                                  | `small` |
| `content` | `string` 或 `number`；Large 直接显示传入值，可自行传入 `99+` 等文本 | 不提供  |
| `visible` | 是否渲染徽标指示器；包裹内容始终保留                                | `true`  |

Small 固定为 6px 圆点，不需要 `content`。Large 最小高度为 16px；没有内容时不渲染，数字 `0` 仍是有效内容。组件不提供 `max`、`count`、`showZero`、四角 `position`、`color` 或动画 API，颜色固定使用主题的 `error`／`on-error` 角色，并跟随浅色、深色和种子色主题。

默认定位使用 CSS 逻辑属性 `inset-inline-end`，所以 `dir="rtl"` 时仍位于内容的逻辑 top-end。根节点是 `inline-flex` 的相对定位包装器，默认插槽只承载被包裹内容；可以通过 class、style、id、dir、lang、data-* 和其他原生属性控制包装器布局。

### 无障碍与交互

徽标指示器设置 `pointer-events: none`，不会改变包裹按钮、链接或头像的点击范围，也不会创建额外焦点。没有 `aria-label` 时指示器使用 `aria-hidden="true"`，避免重复朗读；提供非空 `aria-label` 后，标签会放在指示器上并使用 `role="img"`。包裹的交互内容仍必须自行提供可访问名称。

`MdvBadge` 只负责显示状态，不提供 loading、hover、pressed、选中模型或删除操作。需要动态数字、隐藏时机或通知读取状态时，由使用方通过 `content` 与 `visible` 绑定业务状态；徽标本身不管理这些状态。

## MdvList

Material 3 列表，包含 `MdvList`、`MdvListItem` 和 `MdvListSubheader`。提供 `expressive`／`baseline` 两种变体，以及 `standard`／`segmented` 两种布局。

| 组合                 | 普通条目                                               | 选中条目                       | 交互形状                               |
| -------------------- | ------------------------------------------------------ | ------------------------------ | -------------------------------------- |
| Expressive Standard  | 透明背景、4px 圆角                                     | secondary-container、16px 圆角 | hover 8px，focus-visible／pressed 16px |
| Expressive Segmented | surface-container；整组最上、最下外角 16px，其余角 4px | secondary-container、四角 16px | 同上，交互形状覆盖静态分段形状         |
| Baseline Standard    | 透明背景、4px 圆角                                     | secondary-container            | 固定圆角                               |
| Baseline Segmented   | surface-container、4px 圆角                            | secondary-container            | 固定圆角                               |

Segmented 使用 8px 列表内边距与 2px 条目间距。Subheader 或其他非条目节点切断连续分段；增删和重排条目后，首尾形状自动跟随。Selected 的形状优先于 hover。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvList, MdvListItem, MdvListSubheader } from 'mdv'
import person from '@iconify-icons/material-symbols/person-outline'
import security from '@iconify-icons/material-symbols/security'

const selected = ref<string | null>('profile')
</script>

<template>
  <MdvList v-model="selected" selection-mode="single" layout="segmented" aria-label="账户设置">
    <MdvListSubheader>账户</MdvListSubheader>
    <MdvListItem
      value="profile"
      headline="个人资料"
      supporting-text="头像、昵称和公开信息"
      :icon="person"
      trailing="radio"
    />
    <MdvListItem
      value="security"
      headline="安全设置"
      supporting-text="密码和登录验证方式"
      :icon="security"
      trailing="radio"
    />
  </MdvList>
</template>
```

### MdvList 属性与模型

| Prop             | 类型／说明                                      | 默认值       |
| ---------------- | ----------------------------------------------- | ------------ |
| `variant`        | `expressive` 或 `baseline`                      | `expressive` |
| `layout`         | `standard` 或 `segmented`；优先于 `segmented`   | `standard`   |
| `segmented`      | `segmented` 布局的兼容简写                      | `false`      |
| `selection-mode` | `none`、`single` 或 `multiple`                  | `none`       |
| `model-value`    | 单选为 `string`／`number`／`null`，多选为值数组 | `null`       |
| `lines`          | 子条目未指定时的默认行数：`1`、`2` 或 `3`       | 自动推断     |
| `dividers`       | `none`、`full-width` 或 `inset`                 | `none`       |

普通列表使用 `ul[role="list"]`；选择列表使用 `ul[role="listbox"]`，多选附加 `aria-multiselectable="true"`。为选择列表提供 `aria-label` 或 `aria-labelledby`。

单选点击当前项保持选中；多选生成新数组并用 `Object.is` 比较值，因此数字 `1` 和字符串 `'1'` 不相等。禁用项不更新模型。选择项应有唯一的 `value`；没有 `value` 的条目不参与选择。链接保留原生导航用途，不参与 listbox 选择。

选择列表使用单一 roving Tab 停靠点，优先进入选中项；方向键移动焦点，Home／End 跳转首尾，Space／Enter 选择。移动焦点不会自动选中。禁用、hidden 和 inert 项会被跳过；当前焦点项变为不可用或被删除时，焦点转向可用项。取消主操作的 `click` 或选择用的 `keydown` 默认行为可以取消本次选择。

普通列表中的原生按钮、链接和独立操作各自保留 Tab 入口；为单纯选项使用 `selection-mode`，包含多个独立操作的行使用普通列表。

### MdvListItem 属性

| Prop                              | 类型／说明                                                 | 默认值                   |
| --------------------------------- | ---------------------------------------------------------- | ------------------------ |
| `lines`                           | `1`、`2` 或 `3`，覆盖列表默认值                            | 根据内容推断             |
| `overline`                        | 主标题上方的标签                                           | `''`                     |
| `headline`                        | 主标题；默认插槽优先                                       | `''`                     |
| `supporting-text`                 | 辅助文字                                                   | `''`                     |
| `trailing-text`                   | 尾部短文本                                                 | `''`                     |
| `icon`                            | leading 图标数据                                           | 不提供                   |
| `leading`                         | `icon`、`avatar`、`image`、`checkbox`、`radio` 或 `switch` | 根据内容推断             |
| `avatar-name`                     | 头像文字，使用首个 Unicode 字符                            | 不提供                   |
| `image`                           | leading 图片地址；`leading="avatar"` 时作为圆形头像        | 不提供                   |
| `trailing-icon`                   | 尾部图标数据                                               | 不提供                   |
| `trailing`                        | `icon`、`text`、`checkbox`、`radio` 或 `switch`            | 根据内容推断             |
| `leading-value`／`trailing-value` | 选择指示器的显示状态                                       | 跟随条目的 selected 状态 |
| `value`                           | 列表选择值：`string` 或 `number`                           | 不提供                   |
| `selected`                        | 不参与列表模型时的视觉选中状态                             | `false`                  |
| `disabled`                        | 禁用主操作和本行操作激活                                   | `false`                  |
| `interactive`                     | 使用原生 button 作为主操作                                 | `false`                  |
| `href`                            | 使用原生 a 作为主操作，空字符串也生效                      | 不提供                   |
| `type`                            | 原生按钮类型：`button`、`submit`、`reset`                  | `button`                 |

未显式设置 `leading` 时，依次从 `icon`、`avatar-name`、`image` 推断；`trailing` 从 `trailing-icon`、`trailing-text` 推断。显式类型优先。前后图标与图片为装饰内容；有独立信息意义的图片通过插槽提供合适的可访问名称。

便利的 checkbox／radio／switch 是跟随整行选择的**显示指示器**，不嵌套 input，不提供单独的 Tab 入口或变更事件。`leading-value`／`trailing-value` 只覆盖显示值。需要独立切换、表单提交或独立名称时，把真正的 `MdvCheckbox`／`MdvRadio`／`MdvSwitch` 放进 action 插槽。

提供 `href` 时使用原生链接；提供 `interactive` 或点击／键盘监听时使用原生按钮。静态条目保持普通列表项语义。原生链接支持 `target`、`rel`、`download` 等属性；禁用时移除 href 并设置 `aria-disabled`。按钮默认不提交表单，可显式设置 `type`、`name`、`value`、`form` 等原生属性。

`class`、`style`、`dir`、`lang`、`hidden` 和 `inert` 作用于外围 li；交互条目的 id、data 属性、ARIA 和原生事件作用于主 button／a／option。主标题自动关联为可访问名称，辅助文字自动合并到 `aria-describedby`。可以显式提供 `aria-label`／`aria-labelledby` 覆盖名称。

### 插槽与独立操作

| 插槽              | 用途                  |
| ----------------- | --------------------- |
| `leading`         | 替换 leading 展示内容 |
| 默认插槽          | 替换主标题            |
| `overline`        | 替换上方标签          |
| `supporting`      | 替换辅助文字          |
| `content`         | 完全替换正文列        |
| `trailing`        | 完全替换尾部展示内容  |
| `leading-action`  | 独立前置控件或操作    |
| `trailing-action` | 独立尾部控件或操作    |

所有插槽接收 `{ selected, disabled }`。`content` 另外接收 `MdvListItemContentProps` 中的内容属性。

整行共用背景、圆角和状态层。主操作与 action 插槽互为兄弟节点，因此点击独立操作不会触发主操作；主操作只占用正文区域。不要把可交互控件放入默认插槽或普通 leading／trailing 插槽。自定义 action 控件应绑定插槽给出的 `disabled`，使其原生禁用状态和外观与行状态一致。

```vue
<MdvList layout="segmented" aria-label="项目">
  <MdvListItem
    interactive
    headline="项目详情"
    supporting-text="正文与独立操作共享条目背景"
    :selected="saved"
    @click="openProject"
  >
    <template #leading-action="{ disabled }">
      <MdvCheckbox v-model="saved" :disabled="disabled" aria-label="保存项目" />
    </template>
    <template #trailing-action="{ disabled }">
      <MdvIconButton variant="standard" :disabled="disabled" aria-label="更多操作">
        <MdvIcon :icon="moreIcon" />
      </MdvIconButton>
    </template>
  </MdvListItem>
</MdvList>
```

### 尺寸、分隔线与状态

一行／两行／三行条目的**最小高度**为 56／72／88px，媒体和自定义内容可自然撑高。起始端留白 16px，末端 24px，内容区域间距 16px。普通图标 24px，头像 40px，图片 56px；leading 图标不会占用头像宽度。三行内容顶部对齐，其他内容垂直居中。

Headline 和 overline 单行省略。Supporting text 使用 body-medium：三行且无 overline 时最多两行，其余情况一行。Trailing text 使用 label-small。选中时文字和展示图标使用 on-secondary-container。

Standard 的 `full-width` 分隔线铺满相邻条目之间，`inset` 随 leading 图标／头像／图片对齐文字起点；Segmented 通过 2px 间隙分隔，不叠加分隔线。

状态包括默认、hover、pressed、focus-visible、selected、disabled；hover 状态层与 ripple 独立，选中不会清除 ripple。支持主题切换、局部令牌、动态取色、RTL、reduced-motion 与 forced-colors。

`MdvList` 和 `MdvListItem` 均暴露 `focus(options?)`／`blur()`。列表 focus 优先定位选中项或当前停靠项；静态内容不增加 Tab 入口。SSR 使用稳定 ID，分段形状不依赖挂载后的 JavaScript 计算。

`MdvListSubheader` 是展示性的 li，支持默认插槽与 `inset`。`inset` 将起始留白改为 56px，与普通 leading 图标后的正文对齐；它不进入 Tab 顺序。

### 当前范围

当前版本不包含可展开树形列表、拖拽排序、滑动操作、虚拟列表或 sticky subheader。这些能力按独立方案推进。

## MdvLinearProgress 与 MdvCircularProgress

两个组件均支持平直／波浪、确定／不确定进度，默认使用平直外观和确定进度。组件只展示业务传入的状态，完成后保持可见，由业务决定何时隐藏。当前约定范围已完成本地项目检查与开发预览验收，真实包消费另行验证。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvCircularProgress, MdvLinearProgress } from 'mdv'

const uploaded = ref(35)
const waiting = ref(true)
</script>

<template>
  <MdvLinearProgress :value="uploaded" label="文件上传" />
  <MdvCircularProgress :value="uploaded" aria-label="文件上传" />

  <MdvLinearProgress indeterminate variant="wavy" label="正在连接" />
  <MdvCircularProgress
    :indeterminate="waiting"
    :value="uploaded"
    variant="wavy"
    aria-label="文件处理"
  />
</template>
```

### 属性与数值

| 属性            | 类型               | 默认值               | 说明                                                 |
| --------------- | ------------------ | -------------------- | ---------------------------------------------------- |
| `value`         | `number`           | `0`                  | 当前值；限制在 `0–max`，保留小数；非有限数值回退到 0 |
| `max`           | `number`           | `100`                | 正的有限上限；无效时回退到 100                       |
| `indeterminate` | `boolean`          | `false`              | 无法确定实际进度时开启；不据 `value` 猜测模式        |
| `variant`       | `'flat' \| 'wavy'` | `'flat'`             | 平直或波浪                                           |
| `thickness`     | `number`           | `4`                  | 线宽，单位 px；非正数或非有限数值回退到 4            |
| `label`         | `string`           | —                    | 图形上方的可见文字，同时提供默认可访问名称           |
| `size`          | `number`           | 平直 `40`，波浪 `48` | 仅圆形：直径，单位 px；无效时使用对应默认值          |

例如 `value=128`、`max=256` 显示一半进度，ARIA 报告的仍是 `128 / 256`。两个组件没有 `v-model`、值更新事件、插槽或公开方法；业务直接更新 `value` 与 `indeterminate`。

线性组件占满容器宽度，可用外层容器或组件上的 `class`／`style` 限制宽度。平直高度等于 `thickness`；波浪额外预留 6px，因此默认高度为 10px。圆形通过 `size` 改变直径、通过 `thickness` 改变线宽；线宽最多取直径的一半，避免形成无效圆环。

### 形状、轨道与动效

- 活动进度使用主题 `primary`，轨道使用 `secondary-container`；端点均为圆形。线性确定进度在末端保留 4px 停止标记，并在进度靠近完成时收起。
- 圆形确定进度从十二点方向顺时针增长。平直圆形的不确定模式默认没有底环；波浪圆形的不确定模式保留轨道。
- 波浪确定进度在不超过 10% 和达到 95% 时收回为平直，图形容器尺寸保持稳定；不确定模式持续使用波浪。
- 数值变化和波浪收放使用 500ms 过渡。更新目标时从当前显示位置继续过渡，ARIA 立即报告真实业务值，不逐帧播报动画中间值。
- 系统启用 `prefers-reduced-motion: reduce` 后，确定进度直接更新；不确定模式显示静态图形，保留未知进度语义。
- 页面隐藏、图形离开视口或所在 KeepAlive 页面停用时暂停持续动画；卸载时清理动画帧和监听。

### 主题与样式覆盖

组件跟随已有浅色／深色、局部主题和动态取色。可在当前组件或祖先容器上覆盖专用变量：

```vue
<MdvLinearProgress
  :value="60"
  label="文件处理"
  style="--mdv-progress-active-color: var(--mdv-sys-color-tertiary); --mdv-progress-track-color: var(--mdv-sys-color-tertiary-container)"
/>
```

`--mdv-progress-active-color` 同时控制活动进度与线性停止标记，`--mdv-progress-track-color` 控制轨道。没有额外 `color` prop。高对比度模式使用系统 Highlight／GrayText 颜色。

### 无障碍与原生属性

根节点是只读的 `role="progressbar"`，确定模式提供 `aria-valuemin="0"`、规范化后的 `aria-valuemax` 和 `aria-valuenow`；不确定模式省略 `aria-valuenow`。SVG 是装饰内容，不增加 Tab 入口，不抢占焦点。

为每个进度提供名称：优先使用原生 `aria-label` 或 `aria-labelledby`，也可以提供可见 `label`。`aria-describedby`、`aria-valuetext`、`id`、`dir`、`class`、`style` 和原生监听器透传到根节点。组件不自动建立 live region；需要通知完成或失败时，由业务提供独立的状态文字。

RTL 下线性进度从右向左增长，不确定移动方向随之镜像；圆形继续顺时针。服务端输出确定的初始 SVG，挂载后再测量实际宽度并启动动画。

公共类型：`MdvProgressVariant`、`MdvProgressProps`、`MdvCircularProgressProps`。

## MdvDialog

普通模态对话框，提供图标、标题、正文和底部操作。全屏布局由独立的 MdvFullscreenDialog 提供，两款组件均已完成当前约定范围的项目检查与开发预览验收。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvDialog } from 'mdv'

const visible = ref(false)
const result = ref('')
</script>

<template>
  <MdvButton @click="visible = true">打开对话框</MdvButton>
  <MdvDialog
    v-model="visible"
    title="放弃修改？"
    description="尚未保存的修改将会丢失。"
    @closed="result = $event.returnValue"
  >
    <template #actions="{ close }">
      <MdvButton variant="text" @click="close('continue')">继续编辑</MdvButton>
      <MdvButton variant="text" @click="close('discard')">放弃修改</MdvButton>
    </template>
  </MdvDialog>
  <p role="status">{{ result }}</p>
</template>
```

### Props

| Prop                    | 类型                                                      | 默认值  |
| ----------------------- | --------------------------------------------------------- | ------- |
| `modelValue`／`v-model` | `boolean`                                                 | `false` |
| `title`                 | `string`                                                  | `''`    |
| `description`           | `string`                                                  | `''`    |
| `closeOnEsc`            | `boolean`                                                 | `true`  |
| `closeOnScrim`          | `boolean`                                                 | `true`  |
| `beforeClose`           | `(detail) => boolean \| void \| Promise<boolean \| void>` | 不提供  |
| `destroyOnClose`        | `boolean`                                                 | `false` |

普通款不提供 X、全屏切换或底部附加栏；退出操作放入 actions。Esc 和遮罩分别由对应选项控制，同时关闭时应保留操作按钮。

### 插槽

| 插槽                  | 用途                                  |
| --------------------- | ------------------------------------- |
| `icon`                | 顶部 24px 图标                        |
| `title`               | 替代标题文字，保留内置标题容器及其 ID |
| 默认插槽              | 正文或表单，替代 description          |
| `actions="{ close }"` | 底部操作                              |

操作按钮推荐使用 `variant="text"`，按照“取消、确认”的 DOM 顺序书写，通常最多两个。并排空间不足时，确认显示在上、取消显示在下，键盘顺序保持原 DOM 顺序。组件不自动添加按钮或推断业务行为。

普通款默认宽度 280–560px、28px 圆角和 24px 留白，使用 surface-container-high 和 32% 遮罩，可见容器不绘制阴影。有图标时图标与标题居中，正文保持起始对齐。长正文独立滚动，标题和操作区保留。

## MdvFullscreenDialog

独立的全屏模态对话框，提供顶部 X、标题、顶部操作和可选底栏。打开后始终填满视口，不根据窗口尺寸切换成普通款；使用方按场景明确选择组件。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvFullscreenDialog, MdvTextField } from 'mdv'

const visible = ref(false)
const name = ref('')
function save() {
  // 完成业务保存后关闭；失败时保留弹窗和输入。
  visible.value = false
}
</script>

<template>
  <MdvButton @click="visible = true">新建行程</MdvButton>
  <MdvFullscreenDialog v-model="visible" title="新建行程">
    <form id="trip-form" @submit.prevent="save">
      <MdvTextField v-model="name" label="行程名称" required autofocus full-width />
    </form>
    <template #actions>
      <MdvButton variant="text" type="submit" form="trip-form">保存</MdvButton>
    </template>
  </MdvFullscreenDialog>
</template>
```

### Props 与插槽

全屏款具有普通款的 modelValue、title、description、closeOnEsc、beforeClose、destroyOnClose；不提供 closeOnScrim，因为可见容器覆盖整个视口。额外提供：

| Prop         | 类型      | 默认值         |
| ------------ | --------- | -------------- |
| `closable`   | `boolean` | `true`         |
| `closeLabel` | `string`  | `'关闭对话框'` |

| 插槽                  | 用途                         |
| --------------------- | ---------------------------- |
| `title`               | 顶栏标题                     |
| 默认插槽              | 正文或表单，替代 description |
| `actions="{ close }"` | 顶栏末端确认操作             |
| `footer="{ close }"`  | 可选底部操作栏               |

全屏款不提供普通款的顶部装饰图标区域。容器无圆角、无阴影；顶栏与可选底栏各至少 56px，正文独立滚动。通常把保存放在顶栏，X 用于取消或退出；未保存确认可通过 beforeClose 打开普通 MdvDialog，playground 提供组合示例。

### 两款组件共有：关闭与事件

两款组件及操作插槽均提供 `close(returnValue?: string): Promise<boolean>`。返回 true 表示父级已接受关闭请求，退出动画可能尚未结束；等待退出完成请监听 closed。如果父级未接受 update:modelValue，弹窗继续保持打开。

beforeClose 接收只读 `{ reason, returnValue }`，返回 false 阻止关闭，其他正常返回允许关闭；支持异步等待，其间重复请求共用同一个结果。抛错或 Promise 拒绝会保留弹窗并输出错误日志。外部关闭、重新打开或卸载后，旧结果失效。

关闭原因包括 escape、scrim、close-button、action、form、model，其中 scrim 用于普通款，close-button 用于全屏款。Esc、遮罩、X、close() 和原生关闭表单经过拦截；父级直接设置 v-model=false 跳过拦截。确认、保存、删除和提交由业务处理；MdvButton 的 loading 不自动禁止重复点击。

| 事件                | 时机／参数                                                  |
| ------------------- | ----------------------------------------------------------- |
| `update:modelValue` | 请求把模型设为 false                                        |
| `open`              | 原生模态已打开，进入动效开始前                              |
| `opened`            | 进入动效完成                                                |
| `close`             | 父级已接受关闭，退出动效开始前；`{ reason, returnValue }`   |
| `closed`            | 退出动效、原生关闭及资源清理完成；`{ reason, returnValue }` |

destroyOnClose 默认保留内容和内部状态，开启后在退出完成时卸载，不清空外部绑定值。KeepAlive 停用和卸载释放模态与滚动锁，重新激活按当前模型恢复。

### 两款组件共有：表单、焦点和渲染

普通表单继续使用原生提交和约束校验。操作区按钮可通过 `type="submit" form="your-form-id"` 关联正文表单。组件不把 Enter 统一映射为确认，中文输入期间的 Esc 不关闭弹窗。

`method="dialog"` 和提交按钮的 `formmethod="dialog"` 经过关闭拦截和退出动画，按钮 value 成为 returnValue。表单自身的 @submit.prevent 会阻止默认关闭。程序化提交使用 requestSubmit()；直接调用原生 close() 或 form.submit() 会绕过正常请求入口，应使用模型和组件 close()。

普通款默认 role=alertdialog，全屏款默认 role=dialog；普通款用于复杂表单时显式设置 role=dialog。标题自动关联 aria-labelledby，简单 description 自动关联 aria-describedby，复杂正文不自动整体关联。显式 ARIA 优先；没有可见标题时提供 aria-label 或 aria-labelledby。

打开时优先内部 autofocus，再选择首个可操作元素，无交互内容时聚焦容器。Tab／Shift+Tab 在最上层弹窗内循环，关闭后恢复触发位置；嵌套弹窗共享滚动锁计数，全部关闭后才解锁。普通款遮罩要求按下与抬起都在面板外，避免拖出内容时误关闭。

class 和普通 style 作用于可见容器，id、dir、lang、ARIA、data 和原生监听器作用于 dialog。CSS 变量同时应用原生根节点，让遮罩继承局部主题。普通款可用 --mdv-dialog-width、--mdv-dialog-max-width 调整宽度。

两款在原 DOM 位置调用原生 showModal()，保留主题继承，需要支持 dialog 的现代浏览器；open、closedby、tabindex 由组件管理。服务端输出确定的关闭态节点，初始模型为 true 时在 hydration 后建立模态。支持 reduced-motion、快速开关和状态清理；没有新增运行依赖。

公共类型：`MdvDialogProps`、`MdvFullscreenDialogProps`、`MdvDialogBeforeClose`、`MdvDialogCloseReason`、`MdvDialogCloseDetail`、`MdvDialogSlotProps`。

## MdvMenu

菜单已完成当前约定范围的项目检查与用户验收。提供普通菜单 `MdvMenu`、右键入口 `MdvContextMenu`、条目 `MdvMenuItem` 与分组 `MdvMenuGroup`；分隔线复用 `MdvDivider`。用于临时操作和少量选择，表单选项请使用后续独立的 Select／Autocomplete。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvDivider, MdvMenu, MdvMenuGroup, MdvMenuItem } from 'mdv'
import type { MdvMenuModelValue, MdvMenuSelectEvent } from 'mdv'

const styles = ref<MdvMenuModelValue>(['bold'])
function rename() {
  // 打开业务编辑界面。
}
function confirmSelection(event: MdvMenuSelectEvent) {
  if (!window.confirm('执行这个操作？')) event.preventDefault()
}
</script>

<template>
  <MdvMenu>
    <template #trigger="{ triggerProps }">
      <MdvButton v-bind="triggerProps" variant="tonal">文件操作</MdvButton>
    </template>
    <MdvMenuItem label="重命名" @select="rename" />
    <MdvMenuItem label="执行前确认" @select="confirmSelection" />
    <MdvDivider />
    <MdvMenuItem label="打开指南" href="/guide" target="_blank" rel="noopener noreferrer" />
    <MdvMenuItem label="暂不可用" disabled />
  </MdvMenu>

  <MdvMenu layout="grouped" color-scheme="vibrant">
    <template #trigger="{ triggerProps }">
      <MdvButton v-bind="triggerProps">文字格式</MdvButton>
    </template>
    <MdvMenuGroup v-model="styles" selection-mode="multiple" label="样式">
      <MdvMenuItem value="bold" label="粗体" trailing-text="Ctrl+B" />
      <MdvMenuItem value="italic" label="斜体" trailing-text="Ctrl+I" />
    </MdvMenuGroup>
    <MdvMenuGroup label="更多">
      <MdvMenuItem label="导出">
        <template #children>
          <MdvMenuItem label="PDF" />
          <MdvMenuItem label="图片" />
        </template>
      </MdvMenuItem>
    </MdvMenuGroup>
  </MdvMenu>
</template>
```

### 普通／右键入口

`MdvMenu` 与 `MdvContextMenu` 共用以下 Props：

| Prop                    | 类型                                                                | 默认值                       |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------- |
| `modelValue`／`v-model` | `boolean`                                                           | 不绑定时由内部管理，初始关闭 |
| `variant`               | `'expressive' \| 'baseline'`                                        | `'expressive'`               |
| `colorScheme`           | `'standard' \| 'vibrant'`                                           | `'standard'`                 |
| `layout`                | `'standard' \| 'grouped'`                                           | `'standard'`                 |
| `submenuMode`           | `'flyout' \| 'push'`                                                | `'flyout'`                   |
| `placement`             | `'top' \| 'bottom' \| 'left' \| 'right'`，各可追加 `-start`／`-end` | `'bottom-start'`             |
| `offset`                | `number`，非负像素                                                  | `4`                          |

Baseline 固定使用 standard 配色和布局。默认 Expressive 使用 16px 容器圆角、4px 普通条目、12px 选中条目和 20px 图标；Baseline 为 4px 容器圆角和 24px 图标。两套均保留菜单阴影，点击高度至少 48px；辅助文字和长标签可让条目自然增高。Expressive 官网高度令牌 44dp 与测量图／无障碍要求的 48dp 不一致，MDV 选择至少 48px。

`grouped` 是对官方间隙外观的 Web 实现：把直接内容放进 `MdvMenuGroup`，短菜单使用 2px 组间隙、8px 分组圆角；高度不足需要滚动时改用连续容器和分隔线。菜单本地使用细滚动条，不修改全局滚动条。可通过 style 的 `width`、`max-width` 及 `--mdv-menu-max-height` 调整尺寸，仍受视口可用空间限制。

`#trigger="{ triggerProps, open, close }"` 中，`open` 是当前展开布尔值，`close()` 请求关闭。把完整 `triggerProps` 通过 `v-bind` 绑定到一个原生元素或单个原生根元素的 Vue 组件，包括 ref、ID、ARIA 和监听器；适用于 MdvButton／MdvIconButton。非原生可聚焦的右键区域需自行设置 `tabindex="0"`。

普通菜单支持点击、Enter／Space、上／下键；上键从末项进入。右键入口支持鼠标右键、Shift+F10 和上下文菜单键，在指针位置或键盘触发区域下方定位，不接管触屏长按：

```vue
<MdvContextMenu>
  <template #trigger="{ triggerProps }">
    <div v-bind="triggerProps" tabindex="0">在此右键</div>
  </template>
  <MdvMenuItem label="复制" />
  <MdvMenuItem label="粘贴" disabled />
</MdvContextMenu>
```

默认插槽得到 `{ open, close }`。两种入口 expose `open(edge?: 'first' | 'last')`、`close()`、`toggle()`、`focus(edge?: 'first' | 'last')`。绑定 v-model 时，以父级值为准；父级未接受更新请求则保留原状态。

| 事件                | 参数／时机                         |
| ------------------- | ---------------------------------- |
| `update:modelValue` | 请求新的展开布尔值                 |
| `open`              | 进入顶层绘制，开始进入动效         |
| `opened`            | 进入完成                           |
| `close`             | 退出开始，`{ reason }`             |
| `closed`            | 退出完成、释放资源后，`{ reason }` |

reason 为 `escape`、`outside`、`focus-out`、`tab`、`select`、`trigger`、`model` 或 `programmatic`。子菜单逐级开关不重复触发根菜单事件；快速反向时被中断的动效不发送完成事件。

### MdvMenuItem

| Prop                   | 类型               | 默认值                                    |
| ---------------------- | ------------------ | ----------------------------------------- |
| `label`                | `string`           | `''`                                      |
| `supportingText`       | `string`           | `''`                                      |
| `trailingText`         | `string`           | `''`                                      |
| `icon`／`trailingIcon` | `MdvIconData`      | 不提供                                    |
| `value`                | `string \| number` | 不提供                                    |
| `disabled`             | `boolean`          | `false`                                   |
| `href`                 | `string`           | 不提供                                    |
| `keepOpen`             | `boolean`          | 普通操作／链接／单选为 false，多选为 true |

没有 href 时使用不提交表单的原生 button；提供 href 时使用 a，target、rel、download、ARIA 和原生监听器透传。带 children 的条目优先作为子菜单入口，不执行链接或选择组更新。禁用项保留焦点能力，但阻止点击、链接和键盘激活。

`@select` 接收可取消的 `MdvMenuSelectEvent`，detail 包含 `{ value, selected, originalEvent }`。selected 表示本次期望提交的选择状态，普通操作为 false。同步调用 `event.preventDefault()` 同时阻止选择更新、链接导航和默认关闭；异步业务请先取消，再自行控制模型。原生 `@click.prevent` 也会阻止内置激活。

默认、leading、supporting、trailing 插槽均得到 `{ selected, disabled, expanded }`。默认插槽替代 label，supporting 替代辅助文字；leading 替代图标，选中时显示内置勾；trailing 替代尾部文字／图标，可放 Badge。前后图形和尾部内容为装饰，重要计数或快捷键说明应通过 label／ARIA 表达。不要在条目插槽内嵌另一组独立按钮或表单控件。辅助文字自动关联 aria-describedby，保留用户额外描述 ID。

`#children` 内组合下一层 MdvMenuItem／MdvMenuGroup，支持多级。默认 flyout 可通过鼠标悬停、点击或左右键进入；跨向子菜单保留指针走廊容错。push 在同一位置逐级进入，提供可聚焦的返回项，是 MDV 扩展。子菜单继承整棵菜单的外观和主题，选择模型由该层自身的分组管理。条目 expose `focus()` 与 `blur()`。

### MdvMenuGroup

| Prop                    | 类型                                               | 默认值                               |
| ----------------------- | -------------------------------------------------- | ------------------------------------ |
| `selectionMode`         | `'none' \| 'single' \| 'multiple'`                 | `'none'`                             |
| `modelValue`／`v-model` | `string \| number \| (string \| number)[] \| null` | 不绑定时内部管理；单选 null，多选 [] |
| `label`                 | `string`                                           | `''`                                 |

默认插槽放条目，label 插槽替代组标题。none 用于操作分组；single／multiple 自动将有 value 的普通条目标为 menuitemradio／menuitemcheckbox，更新时发出 update:modelValue 与 change。字符串与数字严格区分，不把 `14` 与 `'14'` 视为同一值；多组互不影响。链接和子菜单入口不参与组选择，多选默认保持打开。

### 键盘、焦点与平台

打开后聚焦首项，上下键循环、Home／End 到首尾，输入文字前缀定位；分隔线／组标题不进入导航，禁用项可聚焦但不能执行。左右键进入／返回子菜单，RTL 反转方向；Escape 优先关闭最深层，逐级返回。push 返回项也参与上下导航。Tab／Shift+Tab 关闭整棵菜单并继续菜单外的焦点顺序；不建立菜单焦点循环，位于 Dialog 内时遵守 Dialog 的焦点范围。

选择、Escape 和程序化关闭后合理恢复触发器焦点；点击／聚焦外部或业务主动转移焦点时不抢回。菜单本身不锁页面滚动。Dialog 内的菜单优先处理 Escape；新模态弹窗出现时关闭其范围外的菜单。KeepAlive 停用、卸载、快速开合和 reduced-motion 会清理定位、计时器、动画与文档监听。

面板通过原生 Popover manual top layer 在原 DOM 位置绘制，继承局部浅深色、动态取色和 dir；需要支持 Popover API 的现代浏览器。新增运行依赖 `@floating-ui/dom` 负责定位、边缘翻转、位移、可用空间和滚动更新；没有 Teleport 到 body，也没有 Sheet 或触屏长按的替代实现。SSR 输出关闭态节点，初始 modelValue=true 在 hydration 后打开。

公共类型：`MdvMenuProps`、`MdvMenuVariant`、`MdvMenuColorScheme`、`MdvMenuLayout`、`MdvMenuSubmenuMode`、`MdvMenuPlacement`、`MdvMenuSelectionMode`、`MdvMenuValue`、`MdvMenuModelValue`、`MdvMenuCloseReason`、`MdvMenuCloseDetail`、`MdvMenuSelectDetail`、`MdvMenuSelectEvent`、`MdvMenuSlotProps`、`MdvMenuTriggerProps`、`MdvMenuTriggerSlotProps`、`MdvMenuItemSlotProps`。

## MdvTooltip

普通款 `MdvTooltip` 展示短文字说明；富内容款 `MdvRichTooltip` 支持可选标题、正文、内联链接和最多两个文字按钮。两款已完成当前约定范围的项目检查与用户预览验收，包含默认时长调整；提供行为／SSR／hydration 测试和独立 playground，真实包消费另行验证。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import refresh from '@iconify-icons/material-symbols/refresh'
import { MdvButton, MdvIcon, MdvIconButton, MdvRichTooltip, MdvTooltip } from 'mdv'

const introduction = ref(false)

function refreshContent() {
  // 刷新业务数据。
}
</script>

<template>
  <MdvTooltip text="刷新当前内容">
    <template #trigger="{ triggerProps }">
      <MdvIconButton v-bind="triggerProps" aria-label="刷新" @click="refreshContent">
        <MdvIcon :icon="refresh" />
      </MdvIconButton>
    </template>
  </MdvTooltip>

  <MdvRichTooltip
    v-model="introduction"
    persistent
    title="云端备份"
    text="在其他设备上继续使用你的文件。"
  >
    <template #trigger="{ triggerProps }">
      <MdvButton v-bind="triggerProps" variant="outlined">了解备份</MdvButton>
    </template>
    <template #actions="{ close }">
      <MdvButton variant="text" @click="close">知道了</MdvButton>
    </template>
  </MdvRichTooltip>
</template>
```

### Props、插槽与事件

两款共有：

| Prop         | 类型                  | 默认值                                                          |
| ------------ | --------------------- | --------------------------------------------------------------- |
| `modelValue` | `boolean`             | 省略时内部管理                                                  |
| `text`       | `string`              | 无                                                              |
| `placement`  | `MdvTooltipPlacement` | 普通款 `top`，Rich `bottom-start`                               |
| `offset`     | `number`              | `4`，单位 px                                                    |
| `openDelay`  | `number`              | `600`，单位 ms，仅 hover                                        |
| `closeDelay` | `number`              | 未指定时按场景处理，见下文；显式设置后统一覆盖关闭延迟，单位 ms |
| `disabled`   | `boolean`             | `false`，只禁用提示                                             |

`MdvRichTooltip` 额外提供 `title?: string` 和 `persistent?: boolean`，persistent 默认 false。位置包含 top／bottom／left／right 及其 `-start`／`-end` 对齐；start／end 随 RTL 变化。负距离或延迟规范化为 0，非有限数值使用默认值。

`#trigger` 提供 `{ triggerProps, open, close }`：把整个 triggerProps 绑定到一个原生元素或向控件透传属性／事件的组件；普通 Button／IconButton 可直接使用。不添加触发包装盒。默认插槽替代 text，普通款仅放说明文字，不能放链接或按钮；Rich 可放段落和内联链接。Rich 另有 `#title` 替代 title、`#actions` 放最多两个 `variant="text"` 按钮；这些内容插槽都提供 `{ open, close }`。actions 不自动关闭，由业务调用 close。

普通款保留并合并触发器原有 aria-describedby；Rich 使用 aria-controls、aria-haspopup="dialog" 与 aria-expanded，卸载或禁用时撤销自身关联。关系在客户端绑定真实触发器后建立；SSR 输出关闭态面板，hydration 不修改现有节点或抢焦点。触发器自身的 id、可访问名称、原生行为和通过 Vue 合并绑定的事件保留。`ref` 属于 triggerProps，手写组合多个浮层触发器时，应同时转发各自的 ref 与事件，不能用后一个对象直接覆盖前一个。

事件为 `update:modelValue(boolean)`、`open`、`opened`、`close(detail)`、`closed(detail)`；detail 为 `{ reason }`，区分 leave、focus-out、escape、outside、trigger、replaced、owner、disabled、empty、model、programmatic。open／close 表示进入／退出开始，opened／closed 表示相应动效完成；快速反向时不发送被取消阶段的完成事件。Expose 提供 `open()`、`close()`、`toggle()`。

显式传入 modelValue 后，普通开关请求等待父级接受，父级拒绝时保留现状。为了确保同一 Document 同时只显示一个提示，被另一提示替换或所属浮层关闭时会立即隐藏并请求模型回传 false；父级拒绝也不会让旧提示继续显示。之后可显式调用 open() 或再次切换模型重新打开。disabled／空内容会抑制显示，但保留调用方的模型值；恢复可用后按当前模型同步。

### 触发、键盘与触屏

- 默认两款：hover 等待 openDelay，默认 600ms；键盘或程序聚焦立即显示。进入触发器或面板会取消关闭计时；键盘焦点移出整个区域关闭。
- 桌面关闭：普通款鼠标移开立即开始退场；临时 Rich 从触发器移开预留 120ms，方便跨越间隙进入面板，从面板移开则立即开始退场。显式设置 closeDelay 后，以上离开操作均等待该值。
- Rich persistent：点击触发器切换，也可由模型或公开方法打开。hover／聚焦不自动打开；离开指针区域仍保留，到外部点击／焦点、Escape 或明确关闭为止。
- 触屏普通／临时 Rich：长按 500ms 显示；抬手后默认保留 1500ms，显式设置 closeDelay 后使用该值。移动超过 10px 或 pointercancel 会取消长按，正常短按和滚动保持原行为。识别后的同次 click／contextmenu 被阻止，避免长按误执行按钮业务；持久 Rich 使用正常点击。
- Esc 优先关闭提示，不同时关闭底下 Menu／Dialog，也不会在触发器仍聚焦时自行重开。IME 组合输入期间不处理 Esc。焦点在 Rich 操作内时，Esc 或程序关闭会合理返回触发器；外部交互造成关闭时保留业务的新焦点。
- 普通款 role=tooltip，焦点留在原控件；Rich 使用 role=dialog、aria-modal=false，打开时不抢焦点，不锁 Tab。可从触发器依 DOM 顺序进入链接、操作按钮，再继续到后续页面。Rich 没有标题时可通过 aria-label 命名，默认名称为“帮助信息”。

Tooltip 是附加说明。图标按钮仍需自己的 aria-label／aria-labelledby，已有明确标签的控件无需再重复同文提示；关键错误、必须完成的步骤应直接呈现。原生 disabled 控件可能不派发焦点与指针事件，应提供另一个可聚焦的说明入口，或把提示绑定到具有名称和 tabindex 的外层锚点；提示的 disabled 不会改变业务控件的禁用状态。

官方 Guidelines 建议临时提示离开目标区域后保留 1.5 秒；MDV 的桌面关闭采用上述较短默认值。600ms 出现延迟与桌面关闭时长属于本库的体验选择，均非官方固定令牌；触屏抬手后仍默认保留 1.5 秒。

### 外观、定位与样式

普通款采用 inverse-surface／inverse-on-surface、4px 圆角、12／16／400 正文、左右 8px／上下 4px 留白，单行高 24px，允许自然换行，无阴影。Rich 采用 surface-container／on-surface-variant、12px 圆角和 elevation level2（3dp）；标题 14／20／500、正文 14／20／400，顶部 12px、底部 8px、左右 16px，标题到正文 4px、正文到操作区 12px。文字按钮使用 primary，从逻辑起始侧横向排列，窄容器允许换行。配色跟随主题与动态令牌，两款均没有箭头。

默认最大宽度为普通 200px／Rich 320px；这是 MDV 的布局默认值。class／style 和原生描述／方向属性作用于面板，可覆盖 `--mdv-tooltip-max-width` 或 max-width；最终仍受视口可用空间约束。普通款默认距离有边界的控件 4px，无边界文字可显式传 offset=8。Rich 默认 bottom-start；遇到边缘自动 flip／shift，并跟随滚动、尺寸与 visualViewport 变化，触发器完全被裁切时关闭。

采用原 DOM 中的 Popover manual top layer，保留局部主题和 Dialog 所属关系，需要支持 Popover 的现代浏览器；复用现有 Floating UI 依赖，不添加全局 Provider，不锁页面滚动。淡入／淡出为 MDV 150／100ms 动效，快速反向从当前帧继续，reduced-motion 下即时切换。卸载、KeepAlive 停用、所属浮层关闭和页面失焦会释放计时器、监听、定位与动画。

公共类型：`MdvTooltipProps`、`MdvRichTooltipProps`、`MdvTooltipPlacement`、`MdvTooltipCloseReason`、`MdvTooltipCloseDetail`、`MdvTooltipSlotProps`、`MdvTooltipTriggerProps`、`MdvTooltipTriggerSlotProps`。

## MdvSnackbar

Snackbar 在页面底部显示简短消息和至多一个业务操作，支持受控组件与显式 Provider 队列。

声明式使用：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvSnackbar } from 'mdv'

const visible = ref(false)

function undo() {
  // 执行撤销操作。
}
</script>

<template>
  <MdvButton @click="visible = true">删除</MdvButton>
  <MdvSnackbar
    v-model="visible"
    message="项目已删除。"
    :action="{ label: '撤销', onClick: undo }"
  />
</template>
```

调用式使用时，先在应用中挂载 Provider：

```vue
<script setup lang="ts">
import { MdvSnackbarProvider } from 'mdv'
import PageContent from './PageContent.vue'
</script>

<template>
  <MdvSnackbarProvider>
    <PageContent />
  </MdvSnackbarProvider>
</template>
```

在 Provider 的**子组件** `setup` 中使用：

```vue
<script setup lang="ts">
import { MdvButton, useSnackbar } from 'mdv'

const snackbar = useSnackbar()

function save() {
  snackbar.show({ message: '更改已保存。', color: 'success' })
}
</script>

<template>
  <MdvButton @click="save">保存</MdvButton>
</template>
```

### 属性与内容

| Prop            | 类型                                                       | 默认值与作用                                                                                                   |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `boolean`                                                  | `false`；控制显示，配合 `v-model` 接收关闭请求                                                                 |
| `message`       | `string`                                                   | `''`；默认消息文字                                                                                             |
| `color`         | `MdvSnackbarColor`                                         | 无；支持 `primary`、`secondary`、`tertiary`、`success`、`warning`、`error`、`info` 和 `#RGB`／`#RRGGBB` 种子色 |
| `action`        | `{ label: string; onClick?: () => void \| Promise<void> }` | 无；内置业务操作                                                                                               |
| `duration`      | `number`                                                   | 无操作为 `4000`，有操作为 `0`；单位 ms，`0` 为常驻                                                             |
| `closable`      | `boolean`                                                  | 省略时常驻消息显示关闭按钮，自动关闭消息不显示；显式值可覆盖                                                   |
| `closeLabel`    | `string`                                                   | `'关闭通知'`；关闭按钮的可访问名称                                                                             |
| `actionLayout`  | `'auto' \| 'inline' \| 'stacked'`                          | `'auto'`；操作自动换行、保持同行或另起一行                                                                     |
| `placement`     | `'bottom' \| 'bottom-start'`                               | `'bottom'`；底部居中或逻辑起始侧                                                                               |
| `offset`        | `number`                                                   | `16`；距底部安全区的额外距离，单位 px                                                                          |
| `pauseOnHover`  | `boolean`                                                  | `true`；指针停留时暂停计时                                                                                     |
| `closeOnEsc`    | `boolean`                                                  | `true`；焦点在消息内部时响应 Escape                                                                            |
| `focusShortcut` | `string \| false`                                          | `'Alt+G'`；主动聚焦的快捷键，`false` 关闭                                                                      |

负数 duration／offset 视为 0，非有限 duration 视为常驻，非有限 offset 使用默认值。显式 duration 可覆盖有操作时的常驻默认值；如果常驻消息没有业务操作，建议保留关闭按钮。

默认插槽替代 `message`，提供 `{ close }`；`#action` 替代内置操作，提供 `{ close, pending }`。自定义操作自行执行和关闭，内置操作的自动关闭、异步处理及 `action`／`actionError` 事件不作用于该插槽。为保持可访问性，消息内容应简短，避免在正文中放置交互控件。

### 队列与操作

`useSnackbar()` 返回：

- `show(messageOrOptions)`：接收字符串或 `MdvSnackbarOptions`，返回消息 id。
- `update(id, patch)`：更新当前或等待中的消息，找到时返回 `true`。
- `close(id)`：关闭当前消息或移除等待项，找到时返回 `true`。
- `clear()`：清空等待项并关闭当前消息。

`MdvSnackbarOptions` 使用上述除 `modelValue` 外的属性，`message` 必填，并可传 `key`。`show({ key, ... })` 会更新同 key 的当前或等待消息并返回原 id；否则加入队列。每个 Provider 使用独立 FIFO 队列，当前消息退场完成后展示下一条，等待项不计时。不同 Provider 或声明式实例互不协调，应用应自行避免同时显示多条。`useSnackbar()` 必须在 Provider 后代的 setup 中调用；卸载 Provider 会清理其队列。

内置操作点击后触发 `action`，监听器可对收到的原生事件调用 `preventDefault()` 以阻止自动关闭，但 `action.onClick` 仍会执行。同步执行成功后默认关闭；返回 Promise 时等待结果，期间禁用该按钮并暂停计时，成功后关闭，失败时发出 `actionError` 并恢复剩余计时。消息关闭或消息文字、操作标签／回调变化后的旧异步结果不会再改变当前消息；重新创建内容相同且回调引用不变的操作对象不会中断它。调用式 Provider 不转发 `actionError`，需要处理失败的业务代码应在自身 `onClick` 中捕获并处理错误。

### 事件、焦点与计时

组件事件为 `update:modelValue(boolean)`、`open`、`opened`、`close(detail)`、`closed(detail)`、`action(MouseEvent)` 和 `actionError(error)`。`close`／`closed` 的 detail 为 `{ reason }`，可能是 `timeout`、`escape`、`close-button`、`action`、`programmatic` 或 `model`。组件请求关闭时先发出 `update:modelValue(false)`，父组件接受后才进入关闭流程；父组件可以拒绝。`open`／`close` 表示开始，`opened`／`closed` 表示显示或退场完成。

组件实例暴露 `close()`、`focus()`、`pause()`、`resume()`。计时从消息实际显示、入场结束后开始；hover、焦点在消息内、页面隐藏、手动暂停、MDV Dialog 遮挡、KeepAlive 停用或内置异步操作期间会暂停并保留剩余时间。消息文字、操作标签或时长改变会重新计算计时；恢复后按剩余时间继续。

消息使用 `role="status"` 和 polite live region，不主动抢焦点或限制 Tab。默认按 Alt+G 聚焦消息内首个可用操作，没有操作时聚焦容器；快捷键要求修饰键精确匹配。焦点位于消息内时 Escape 关闭消息并阻止该次事件继续关闭下层 Dialog；其他位置按 Escape 不由 Snackbar 处理。关闭时只有消息实际持有焦点才尝试恢复此前仍有效的焦点。自动消失的信息还应在业务发生的位置提供可访问反馈；真实播报仍受浏览器和辅助技术组合影响。

### 样式与浮层

默认容器使用 inverse-surface／inverse-on-surface，操作使用 inverse-primary。指定 `color` 时，容器使用对应主题色或由种子色生成的局部色，正文、操作和关闭图标使用配对的 on 色；支持浅色和深色主题，不修改全局主题。无效颜色回退默认配色，并在开发模式下发出警告。声明式组件与 `show()`、`update()` 均支持此选项；`update(id, { color: undefined })` 可恢复默认配色。颜色属于 MDV 扩展，默认配色遵循官方规范。

容器圆角 4px，默认单行高度 48px、双行高度 68px，长内容可自然增高。官网 Specs 的双行高度为 68dp，Guidelines 中另有 64dp 描述；本组件按 Specs 处理。默认最大宽度 560px、侧边距至少 16px、进入／退出 200／150ms 为 MDV 的布局和动效选择；支持 reduced-motion、RTL 和底部安全区。需要避让底部导航、悬浮按钮等内容时，由使用方设置 `offset`。

支持 Popover API 的浏览器使用原 DOM 位置的 manual popover，以继承局部主题并进入 top layer；不支持时退回普通 fixed 布局，层级受所在上下文影响。页面消息会在 MDV Dialog 打开时隐藏并暂停，可在 Dialog 内放局部组件或 Provider；对第三方或原生模态框不保证自动协调。

公共类型：`MdvSnackbarProps`、`MdvSnackbarOptions`、`MdvSnackbarColor`、`MdvSnackbarInput`、`MdvSnackbarAction`、`MdvSnackbarActionLayout`、`MdvSnackbarPlacement`、`MdvSnackbarCloseReason`、`MdvSnackbarCloseDetail`、`MdvSnackbarSlotProps`、`MdvSnackbarActionSlotProps`、`MdvSnackbarSlots`、`MdvSnackbarProviderApi`。

## MdvBottomSheet

两款组件分别处理模态浮层和 Standard 页面布局。当前约定范围已完成项目检查与用户验收，包含局部滚动条和全高按钮修订；真实包消费另行验证。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvBottomSheet, MdvBottomSheetScaffold, MdvButton } from 'mdv'
import type { MdvBottomSheetState } from 'mdv'

const open = ref(false)
const expanded = ref(false)
const layoutState = ref<MdvBottomSheetState>('partial')
</script>

<template>
  <MdvButton @click="open = true">打开底部面板</MdvButton>
  <MdvBottomSheet v-model="open" v-model:expanded="expanded" title="分享内容">
    <p>放入分享选项、表单或列表。</p>
    <template #actions="{ close }">
      <MdvButton variant="text" @click="close()">取消</MdvButton>
      <MdvButton @click="close('share')">分享</MdvButton>
    </template>
  </MdvBottomSheet>

  <div style="height: 520px">
    <MdvBottomSheetScaffold v-model="layoutState" title="附近地点" :peek-height="180">
      <p>主页面内容。面板展开后仍可交互。</p>
      <template #sheet><p>地点列表与详情。</p></template>
    </MdvBottomSheetScaffold>
  </div>
</template>
```

### 模态款 Props

| 属性                                           | 类型                        | 默认值与行为                                                                                   |
| ---------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `modelValue` / `v-model`                       | `boolean`                   | `false`，由使用方控制显示                                                                      |
| `expanded` / `v-model:expanded`                | `boolean`                   | `false`；未传此属性时内部管理展开状态，传入后由父级接受更新                                    |
| `partial`                                      | `boolean \| number`         | `true`：半展开高度上限为当前可见视口的 50%；数字为 0–1 比例，超出范围会截取；`false`：直接展开 |
| `title`                                        | `string`                    | 空，生成可访问名称；也可用 `header` 插槽或原生 `aria-label` 命名                               |
| `description`                                  | `string`                    | 空，无默认插槽时显示并关联短描述                                                               |
| `maxHeight`                                    | `string`                    | 无，CSS 长度；默认按响应式顶部留白限制最高高度                                                 |
| `showHandle`                                   | `boolean`                   | `true`，显示顶部手柄；隐藏后仅在有两个可用高度时提供展开／收起按钮                             |
| `draggable`                                    | `boolean`                   | `true`，允许手柄拖动及适用的正文触摸手势；不影响点击与键盘操作                                 |
| `closeOnEsc`                                   | `boolean`                   | `true`                                                                                         |
| `closeOnScrim`                                 | `boolean`                   | `true`，从遮罩开始并在遮罩松手才请求关闭                                                       |
| `closeOnSwipe`                                 | `boolean`                   | `true`，允许下滑到隐藏位置；不禁止手柄点击或其他关闭操作                                       |
| `beforeClose`                                  | `MdvBottomSheetBeforeClose` | 无，返回 `false` 或异步得到 `false` 时拒绝操作关闭；抛错也保留面板                             |
| `destroyOnClose`                               | `boolean`                   | `false`，关闭后保留正文及表单状态                                                              |
| `expandLabel` / `collapseLabel` / `closeLabel` | `string`                    | `展开面板` / `收起面板` / `关闭面板`，可覆盖操作的可访问名称                                   |

短内容按自然高度显示，不为半展开补空白；只有最高高度大于半展开高度时才保留两个锚点。正数的半展开高度至少容纳手柄或替代操作区，避免过小配置裁掉操作；非正数不建立较低锚点。每次打开使用当前 `expanded` 配置；不绑定展开属性时，上次手势不会隐式决定下次初始高度。`change` 报告实际可用的状态，短内容的 `partial` 请求可能合并为 `expanded`。

普通高度保留顶部圆角。`expanded` 表示到达本组件允许的最高高度，仍会保留顶部留白；真正覆盖可见视口全高时使用直角顶部。所有高度都不自动附加关闭按钮。

手柄是原生按钮：从 partial 点击／Enter／Space 展开，在最高档再次操作关闭。`closeOnSwipe=false` 时拖动可在 partial 和 expanded 之间切换，手柄点击仍可关闭。隐藏手柄后，替代按钮只在两个可用高度间展开／收起；只有一个高度时不生成替代按钮。拖动后浏览器随附的 click 不会再触发一次高度变化。

操作关闭、Esc、遮罩、手柄、滑动与原生 `method="dialog"` 表单都经过 `beforeClose`。直接设置 `v-model=false` 表示父级决定关闭，不等待拦截器。异步判定期间重复关闭合并处理；关闭重开或卸载后，旧判定不能关闭新一轮面板。父级拒绝高度更新或关闭时，手势回到已接受的高度。

### Standard 布局款 Props

| 属性                                           | 类型                  | 默认值与行为                                                                       |
| ---------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `modelValue` / `v-model`                       | `MdvBottomSheetState` | `partial`；可为 `hidden`、`partial`、`expanded`；未传入时内部管理                  |
| `peekHeight`                                   | `number`              | `56`，partial 的可见像素高度；这是 MDV 默认值，不是官方强制尺寸                    |
| `hideable`                                     | `boolean`             | `false`，是否允许通过用户拖动／手柄隐藏；程序设为 hidden 与 `close()` 始终可以隐藏 |
| `title` / `description` / `maxHeight`          | 与模态款相同          | 标题用于命名 region，description 在没有 `sheet` 插槽时显示                         |
| `showHandle` / `draggable`                     | `boolean`             | 均为 `true`                                                                        |
| `expandLabel` / `collapseLabel` / `closeLabel` | `string`              | 与模态款相同                                                                       |

Scaffold 作用于有明确高度的页面区域；默认 `height:100%`，父级需要有确定高度。默认槽是主页面，`sheet` 槽是底部面板。主区域为预览高度预留空间，面板展开时覆盖更大区域，背景继续可交互；不锁文档滚动、不建立焦点陷阱、不全局截获 Escape、不主动抢焦点。

默认 56px 主要用于露出 48px 手柄区；若需要展示标题和内容预览，可增加 `peekHeight`。正数预览高度至少容纳手柄或替代操作区。正文可见空间不足 24px 时整块内容暂时隐藏并设为 inert，避免 Tab 进入不可见控件；手柄或替代操作仍可访问。正常预览及展开时，标题、正文和底部操作处于同一滚动区，焦点可以随原生滚动显示，不让固定操作区溢出较矮的面板。

默认手柄在 partial／expanded 间切换；`hideable=true` 时最高档再次操作进入 hidden。所有高度都不自动附加关闭按钮。隐藏手柄后，替代按钮只负责展开／收起，只有一个可用高度时不生成按钮。hidden 不提供页面外的自动唤回入口，使用方需要保留一个主页面按钮或通过模型恢复显示。关闭后保留面板节点与输入内容。

### 事件、插槽与方法

两款均提供 `open`、`opened`、`close(detail)`、`closed(detail)` 和 `change(detail)`。open／opened 对应从隐藏到显示，close／closed 对应进入隐藏；纯高度变化使用 change。Scaffold 初次可见也会触发 open／opened。动效中途被新状态取代时，以最后接受的状态完成。

`MdvBottomSheetChangeDetail` 为 `{ state, previousState, reason }`，reason 为 `model`、`handle`、`swipe`、`action` 或 `resize`。尺寸或内容变化导致锚点合并时也会发出 change。

`MdvBottomSheetCloseDetail` 为 `{ reason, returnValue }`。模态款发出的 reason 包括 `model`、`escape`、`scrim`、`form`、`action`、`handle`、`swipe`；Standard 使用其中适用的 model／action／handle／swipe，returnValue 始终为空字符串。

| 插槽      | 模态款                 | Standard 布局款                |
| --------- | ---------------------- | ------------------------------ |
| `default` | 面板正文               | 主页面，不传入面板操作参数     |
| `sheet`   | 无                     | 面板正文                       |
| `header`  | 替换标题；生成标题关联 | 替换标题；生成 region 名称关联 |
| `actions` | 正文之后的操作         | 正文之后的操作                 |

面板插槽收到 `{ state, expanded, close, expand, collapse }`。`close(returnValue?)`、`expand()`、`collapse()` 返回 `Promise<boolean>`，表示请求是否被接受。模态款的 collapse 在没有较低锚点时返回 false。Standard 的 close 不使用 returnValue。

实例暴露同名 `close`／`expand`／`collapse`，另有 `focus()`。模态款 focus 按 autofocus、首个可用控件、原生 dialog 的顺序聚焦；Standard 优先聚焦手柄，再回退到 region。`update:modelValue` 的类型分别为 boolean 和 MdvBottomSheetState；模态款另有 boolean 的 `update:expanded`。

### 交互、主题与布局

鼠标只从手柄开始拖动；触屏也可从非交互正文开始竖向手势。未展开时上拖先扩大面板，再把多出的距离交给正文滚动；已展开且正文已滚动时保留正文的原生滚动，在内容顶部下拉可收起。不接管横向手势、文本选择、按钮、表单控件、嵌套 Slider 或其他交互控件；自定义交互区域可添加 `data-mdv-sheet-no-drag`。

模态款使用原 DOM 内的原生 dialog top layer，保留局部浅深主题及动态取色；复用 Dialog 的模态栈、嵌套焦点、滚动锁、Tab 循环、IME 与关闭后的焦点恢复。SSR 不输出原生 open，客户端挂载后建立模态，不将内容 Teleport 到 body。Standard 为普通具名 region。动效区分位移／高度与遮罩透明度，支持 reduced-motion；触屏、软键盘与辅助技术组合仍需真实设备验证。

容器使用 surface-container-low、elevation 1、顶部 28px 圆角和直角底部；手柄 32×4px、40% on-surface-variant，上下各 22px，交互区 48px；键盘焦点使用 secondary、3px 描边与 2px offset。默认最大宽 640px；窄屏顶部留白 72px，宽度超过 640px 时顶部和左右留白 56px。Scaffold 依据自身容器宽度切换。正文默认水平留白 24px 是 MDV 内容布局约定。

面板正文和 Scaffold 主区域使用局部细滚动条，滑块为 outline 主题色、轨道透明，保留浏览器原生滚动行为；不会设置全局滚动条样式。

Specs 的宽屏测量图仍标注顶部 72，而表格／替代文本为 56；此实现采用表格的宽屏值。32% 遮罩沿用 MDV 既有模态方案，不将其描述为当前 Bottom Sheet 令牌表的独立硬性数值。`minimized.shape=0` 不套用于普通 partial。

模态款的 class／普通 style 作用于可见面板，CSS 变量同时置于原生 dialog，原生 ARIA／dir 等作用于 dialog。Standard 的 class／style／原生属性作用于 Scaffold 根节点。可以局部覆盖 `--mdv-bottom-sheet-top-gap`、`--mdv-bottom-sheet-side-gap` 和 `--mdv-bottom-sheet-max-width`；这些是 MDV 布局变量。

例如真正全高可组合 `:partial="false"`、`max-height="100%"`，并在 style 设定 `--mdv-bottom-sheet-top-gap:0px; --mdv-bottom-sheet-side-gap:0px; --mdv-bottom-sheet-max-width:100%`。通常应保留默认留白；本组件不会在大屏自动变为 Side Sheet。

公共类型：`MdvBottomSheetProps`、`MdvBottomSheetScaffoldProps`、`MdvBottomSheetState`、`MdvBottomSheetBeforeClose`、`MdvBottomSheetCloseReason`、`MdvBottomSheetCloseDetail`、`MdvBottomSheetChangeReason`、`MdvBottomSheetChangeDetail`、`MdvBottomSheetSlotProps`。

## MdvSideSheet

`MdvSideSheet` 是模态侧边面板；`MdvSideSheetScaffold` 是 Standard 页面布局。两款分别维护模板与生命周期，共用侧边视觉和横向动效，当前约定范围已通过项目检查与用户验收；真实包消费另行验证，没有新增依赖。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvSideSheet, MdvSideSheetScaffold } from 'mdv'

const open = ref(false)
const details = ref(true)
</script>

<template>
  <MdvButton @click="open = true">编辑详情</MdvButton>
  <MdvSideSheet v-model="open" title="编辑详情" width="360px" detached>
    <p>补充信息或表单。</p>
    <template #actions="{ close }">
      <MdvButton variant="text" @click="close('cancel')">取消</MdvButton>
      <MdvButton variant="text" @click="close('save')">保存</MdvButton>
    </template>
  </MdvSideSheet>

  <div class="h-[500px]">
    <MdvSideSheetScaffold v-model="details" title="文件详情">
      <div class="p-6">
        <MdvButton @click="details = !details">切换详情</MdvButton>
        <p>主内容与侧边面板并排显示。</p>
      </div>
      <template #sheet><p>文件信息与操作。</p></template>
    </MdvSideSheetScaffold>
  </div>
</template>
```

### 共用 Props

| Prop | 类型 | 默认值／说明 |
| --- | --- | --- |
| `modelValue` / `v-model` | `boolean` | `false`；受控开关，父级需接受 `update:modelValue` |
| `title` | `string` | 空；没有标题时仍提供关闭按钮 |
| `description` | `string` | 空；正文插槽未提供时显示并关联说明 |
| `width` | `string` | `256px`；CSS 长度，最大 400px，且不超出可用区域 |
| `placement` | `'start' \| 'end'` | `end`；逻辑方向，RTL 镜像 |
| `detached` | `boolean` | `false`；分离式四周留白及四角圆角均为 16px |
| `showBack` | `boolean` | `false`；显示返回按钮，发出 `back`，由应用决定返回行为 |
| `backLabel` / `closeLabel` | `string` | `返回`／`关闭面板`；可覆盖操作名称 |
| `dividers` | `boolean` | `false`；标题／操作区的水平分隔线 |
| `beforeClose` | `MdvSideSheetBeforeClose` | 无；返回 `false`、异步得到 `false` 或抛错均保留面板 |
| `destroyOnClose` | `boolean` | `false`；关闭动画结束后销毁面板内容，默认保留草稿与滚动位置 |

Modal 另有 `closeOnEsc`、`closeOnScrim`、`closeOnSwipe`，均默认为 `true`。Standard 另有 `showDivider=true`，用于贴边面板与主内容之间的竖直边界线，分离时不显示。

### 插槽、事件与实例

Modal 的 `default` 为正文，另有 `header` 和 `actions`。Scaffold 的 `default` 为主内容，`sheet` 为侧边内容，另有 `header` 和 `actions`。`header` 只替换标题区域，关闭和返回按钮仍由组件提供。

所有面板插槽收到 `{ close }`，其中 `close(returnValue?)` 返回 `Promise<boolean>`：`true` 表示父级已接受关闭请求，退出动画可能仍在进行；`false` 表示拒绝、拦截、请求过期或当前无法关闭。实例暴露同名 `close`，以及 `focus()`。Modal 按 autofocus／首个可用控件顺序聚焦；Standard 的 focus 显式聚焦面板容器，打开时不自动抢焦点。

事件为 `update:modelValue`、`open`／`opened`、`close`／`closed`、`back`。open／close 在开始转换时发出，opened／closed 在转换完成后发出；close／closed 参数为 `{ reason, returnValue }`。Modal 的 reason 包括 `model`、`escape`、`scrim`、`close-button`、`action`、`form`、`swipe`；Standard 为其中的 `model`、`close-button`、`action`。`back` 不携带参数，不自动关闭。

`beforeClose` 收到只读关闭详情。相同进行中的操作请求合并；父级直接改变模型是程序状态变更，不经过拦截。原生 `method="dialog"` 表单可在 Modal 中提交关闭，并保留提交按钮的 value；Standard 不劫持表单提交。

### 布局、键盘与手势

Standard 需要有确定高度的父区域。主内容会随着面板开关真实让位，双方独立滚动，关闭后恢复完整宽度；背景不锁定、不进入模态栈。面板使用非模态 `role="dialog"`，Tab 自然进入和离开，Escape 不会被全局截获；关闭时仅当焦点位于面板内才尝试恢复到打开前元素，否则保持当前焦点。

Modal 在原 DOM 中使用原生 dialog top layer，继承局部主题。支持 Tab 焦点约束、最上层 Escape、背景滚动锁、嵌套 Dialog／Menu／Tooltip 和关闭后焦点恢复。内置关闭入口始终存在，遵循 Side Sheet 的官方无障碍要求。

Modal 的面向主内容侧有 12px 手势边缘。横向拖向隐藏方向后释放可关闭，距离不足、取消或请求被拒绝时回弹；纵向手势和正文内交互保留原生行为。左右方向结合 placement 与 RTL 计算，窗口松手、失焦、卸载和 KeepAlive 停用都会清理监听。面板横移、Standard 占位与遮罩分别执行，正文不缩放或整体淡出；减少动态效果时直接定位。

### 视觉与主题

Standard 使用 surface、elevation 0、贴边直角；Modal 使用 surface-container-low、elevation 1、朝内容侧 16px 圆角。分离时均为四角 16px。标题使用 title-large（22／28px、400、on-surface-variant），常规内边距 24px、顶部元素间隔 12px；返回按钮起始边距 16px。操作区起始侧对齐，上方 16px、下方 24px，按钮保留自然宽度并可换行。

正文使用局部 thin／outline／透明轨道滚动条，不改变全局滚动条。Modal 的 class／普通 style 作用于面板，CSS 变量同时放在原生 dialog；ARIA、dir 等原生属性作用于 dialog。Standard 的 class／style／dir 作用于布局根节点，`aria-*` 作用于侧边 dialog；不输出 `aria-modal`。无标题时可通过 aria-label 自定义名称。

尺寸遵循当前 Specs 的 256dp 默认宽度令牌及 400dp 最大宽度表。外围分隔线按组件 divider 令牌使用 outline，内部线为 outline-variant；官网颜色图对外围线标注 outline-variant，与该组件令牌存在差异。32% 遮罩沿用 MDV 已有模态方案。两款不自动按断点互换，由应用选择适合布局的类型。

公共类型：`MdvSideSheetProps`、`MdvSideSheetScaffoldProps`、`MdvSideSheetPlacement`、`MdvSideSheetBeforeClose`、`MdvSideSheetCloseReason`、`MdvSideSheetCloseDetail`、`MdvSideSheetSlotProps`。

## MdvTabs

`MdvTabs` 管理同一页面的内容分类，`MdvTab` 提供分类按钮，`MdvTabPanel` 提供关联内容。Primary／Secondary 两款当前约定范围已完成项目检查与开发预览验收；真实包消费另行验证，没有新增依赖。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvBadge, MdvTab, MdvTabPanel, MdvTabs } from 'mdv'
import type { MdvTabValue } from 'mdv'

const category = ref<MdvTabValue>('overview')
</script>

<template>
  <MdvTabs v-model="category" aria-label="工作内容">
    <MdvTab value="overview" label="概览" />
    <MdvTab value="activity" label="动态">
      <template #badge><MdvBadge variant="large" :content="3" aria-label="3 条新动态" /></template>
    </MdvTab>
    <MdvTab value="archive" label="归档" disabled />
    <template #panels>
      <MdvTabPanel value="overview" class="p-4">项目概览。</MdvTabPanel>
      <MdvTabPanel value="activity" class="p-4">
        <label>备注 <input placeholder="切换分类后保留草稿" /></label>
      </MdvTabPanel>
      <MdvTabPanel value="archive" class="p-4">归档记录。</MdvTabPanel>
    </template>
  </MdvTabs>
</template>
```

### MdvTabs Props

| 属性 | 类型 | 默认值与行为 |
| ---- | ---- | ------------ |
| `modelValue` / `v-model` | `string \| number` | 未传入时内部选择首个可用项；传入后以父级接受的值为准 |
| `variant` | `'primary' \| 'secondary'` | `'primary'` |
| `scrollable` | `boolean` | `false`，固定等宽；`true` 时按内容宽度排列并允许横向滚动 |
| `showDivider` | `boolean` | `true`，显示标签栏底部的 outline-variant 分割线 |
| `iconPosition` | `'top' \| 'leading'` | Primary 默认 `'top'`，Secondary 默认 `'leading'` |
| `activation` | `'manual' \| 'automatic'` | `'manual'`，焦点与选择分开；`'automatic'` 时聚焦可用项即请求选中 |
| `tabNavigation` | `'all' \| 'active'` | `'all'`，每个可用项均可 Tab 访问；`'active'` 时整组一个 Tab 入口 |
| `swipeable` | `boolean` | `false`，显式开启面板正文的触摸横滑切换 |

`default` 插槽直接放置 `MdvTab`，`panels` 插槽放置 `MdvTabPanel`；tablist 与面板是语义上的兄弟区域。每组 value 必须唯一，与面板严格匹配；数字 `1` 与字符串 `'1'` 是两项。嵌套组只关联最近的 `MdvTabs`。

显式受控的无效值不自动改写；父级拒绝更新时保留原选择。内部管理的选中项被移除、隐藏或禁用时，优先选择相邻可用项，不伪造用户事件。程序切换只更新展示，不发送 `change`。

### MdvTab 与 MdvTabPanel Props

| 组件 | 属性 | 类型 | 默认值与行为 |
| ---- | ---- | ---- | ------------ |
| `MdvTab` | `value` | `string \| number` | 必填，组内唯一 |
| `MdvTab` | `label` | `string` | 空；也可用默认插槽提供文字 |
| `MdvTab` | `disabled` | `boolean` | `false`；禁用选择和键盘访问 |
| `MdvTabPanel` | `value` | `string \| number` | 必填，与对应 tab 相同 |
| `MdvTabPanel` | `lazy` | `boolean` | `false`；`true` 时首次选中才挂载正文，之后保留 |
| `MdvTabPanel` | `destroyOnHide` | `boolean` | `false`；`true` 时离开即销毁正文，再选中重新挂载 |

默认隐藏面板保留 DOM、表单草稿及组件状态。即使启用 lazy 或 destroyOnHide，面板语义外壳和关联 ID 仍保留；隐藏时设置 hidden／inert。可用 `class="p-4"` 等自行控制正文留白，组件不预设面板高度。

MdvTab 的默认、`icon`、`badge` 插槽，以及 MdvTabPanel 的默认插槽均收到 `{ active: boolean }`。图标插槽可据此切换描边／填充图形。图标由 `MdvIcon` 或自有图形提供；仅图标项需用原生 `aria-label` 命名。徽标复用 `MdvBadge`，选中时不自动清除通知。

### 事件、实例与原生属性

| 事件 | 参数 | 行为 |
| ---- | ---- | ---- |
| `update:modelValue` | `MdvTabValue` | 用户请求选择另一可用项；同一已选项不重复发出 |
| `change` | `MdvTabValue` | 用户请求被父级接受且选择实际改变后发出一次 |

`MdvTabs` 暴露 `focus(value?)`：无参数时聚焦当前可用项或首个可用项，指定参数时聚焦对应项。`MdvTab` 暴露原生 `focus(options?)`／`blur()`。手动模式下 focus 不改变选择，自动模式仍按聚焦激活规则处理。

MdvTab 渲染 `type="button"`，不提交外层表单。原生事件对象透传；click 监听器调用 `preventDefault()` 可取消该次点击选择，keydown 监听器可取消内置方向键行为。自动模式的聚焦选择是独立动作。组件维护 tab 的 role、type、tabindex、aria-selected、aria-controls，原生属性不能覆盖这些语义。

MdvTabs 的 `aria-label`／`aria-labelledby`／`aria-describedby` 放到实际 tablist，其余 class、style、id、dir 和原生事件作用于外层容器。MdvTab 的原生 id 可自定义，对应面板自动引用；面板 id、role、hidden、inert、aria-labelledby 统一由组管理，忽略同名原生覆盖。MdvTabPanel 其余原生属性透传，tabindex 默认为 0，可显式设为 -1。

### 键盘、滚动与触摸

默认 `tabNavigation="all"` 保留逐项 Tab／Shift+Tab 顺序；方向键和 Home／End 在可用项之间移动焦点，Enter／Space 选择。左右键随 RTL 镜像，上下键保留页面滚动。禁用、hidden、inert 及 disabled fieldset 中的项不参与组内导航。

`tabNavigation="active"` 对应 WAI-ARIA APG 的单入口模式：Tab 进入一项，方向键移动组内焦点，下一次 Tab 离组。手动模式允许焦点移到尚未选中的项；自动模式同时请求选择。组件不拦截原生 Tab，不形成焦点陷阱。

正常切换不强行聚焦面板正文；程序切换或动态移除会在原焦点即将被隐藏或移除时恢复至合理的 tab，外部焦点保持原位。

固定模式等宽，长文字截断；少量内容分类适合该模式。较多项目或长标题建议开启 scrollable：起始侧保留 52px 留白、项目按自然宽度排列，RTL 镜像。保留原生横向触摸／触控板滚动；聚焦或程序选中超出视野的项时，仅滚动条目容器。

开启 swipeable 后，在非交互正文横滑达到阈值再释放，才请求相邻可用项；边界停留，不首尾循环。纵向滚动、输入控件、按钮、链接、Slider、选择文字、原生横向滚动区和内层 Tabs 保留各自操作；自定义交互区可添加 `data-mdv-tab-swipe-ignore`。取消或父级拒绝时保留当前面板；正文不做跟手位移。真实触屏与辅助技术组合仍需验证。

### 视觉与主题

纯文字、横排图标和仅图标高度 48px，上下图文 64px；图标 24px，文字 title-small（14／20px、500）。Tabs 条目区背景透明，呈现父级容器表面，避免嵌入 Dialog 等容器时出现额外色块。`showDivider` 默认 `true`，使用 1px outline-variant 底部分割线；设为 `false` 时隐藏该线。Primary 激活内容为 primary，Secondary 激活为 on-surface，未激活内容为 on-surface-variant。

Primary 指示线高 3px，按可见内容包络两侧各内缩 2px、最小 24px，上方圆角、底部贴齐；Secondary 高 2px、覆盖单项全宽、直角。上下图文的图标徽标不扩展底部文字包络；横排和纯文字徽标计入包络。图文横排间距 8px、文字与徽标 4px，堆叠徽标在图标逻辑末侧重叠 6px。

指示线的位置和宽度分别执行可中断弹簧；字体、徽标或容器尺寸变化后重新校准，reduced-motion 下直接定位。键盘焦点使用 secondary／3px 内描边，与选择指示线独立；状态层、局部浅深主题、动态取色和 forced-colors 使用现有令牌，不额外提供 color 属性。横向滚动条隐藏规则仅作用于 tablist 容器。

公共类型：`MdvTabValue`、`MdvTabsVariant`、`MdvTabsIconPosition`、`MdvTabsActivation`、`MdvTabsTabNavigation`、`MdvTabsProps`、`MdvTabProps`、`MdvTabPanelProps`、`MdvTabSlotProps`。

## MdvNavigationBar

`MdvNavigationBar` 提供贴底的 Flexible 导航栏，`MdvNavigationBarItem` 表示一个目的地。当前约定范围已完成项目检查与开发预览验收；真实包消费另行验证。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvIcon, MdvNavigationBar, MdvNavigationBarItem } from 'mdv'
import home from '@iconify-icons/material-symbols/home-outline'
import bookmark from '@iconify-icons/material-symbols/bookmark-outline'
import person from '@iconify-icons/material-symbols/person-outline'

const current = ref('home')
const destinations = [
  { value: 'home', label: '首页', icon: home },
  { value: 'saved', label: '收藏', icon: bookmark },
  { value: 'profile', label: '个人资料', icon: person },
]
</script>

<template>
  <main class="pb-24">
    <MdvNavigationBar aria-label="主要目的地">
      <MdvNavigationBarItem
        v-for="destination in destinations"
        :key="destination.value"
        :label="destination.label"
        :active="current === destination.value"
        @click="current = destination.value"
      >
        <template #icon>
          <MdvIcon :icon="destination.icon" />
        </template>
      </MdvNavigationBarItem>
    </MdvNavigationBar>
  </main>
</template>
```

示例图标来自 `@iconify-icons/material-symbols`；也可替换为项目自己的本地图标组件。真实链接场景将按钮项改为 `<MdvNavigationBarItem href="/saved" ...>`，由宿主路由更新当前页面后设置对应的 `active`。

### MdvNavigationBar Props

| 属性 | 类型 | 默认值与行为 |
| ---- | ---- | ------------ |
| `orientation` | `'auto' \| 'vertical' \| 'horizontal'` | `'auto'`；导航栏容器宽度小于 600px 时图标与标签纵向排列，达到 600px 时横向排列；另两值强制对应布局 |
| `aria-label`／`aria-labelledby` | 原生 ARIA 属性 | 给导航 landmark 命名；页面有多个导航区时应提供可区分名称 |

`MdvNavigationBar` 渲染原生 `<nav>`；其余 class、style、dir、id 和原生事件透传到该节点。底栏固定于视口底部并处理设备安全区，页面主内容应预留对应底部空间，避免最后一段内容被遮挡。窄屏使用纵向图标／文字项目，中等宽度使用横向项目；宽屏导航由使用方改用 Navigation Rail 等布局。

### MdvNavigationBarItem Props 与插槽

| 属性 | 类型 | 默认值与行为 |
| ---- | ---- | ------------ |
| `label` | `string` | 必填；可见目的地名称，也是默认可访问名称 |
| `active` | `boolean` | `false`；由调用方按当前页面或目的地控制，组件不维护路由／选中模型 |
| `href` | `string` | 未提供时渲染 `type="button"`；提供后渲染原生链接并保留浏览器导航行为 |
| `disabled` | `boolean` | `false`；禁用按钮，或移除链接的 href 并从 Tab 顺序排除 |
| `aria-label` | 原生 ARIA 属性 | 默认可访问名称来自可见 `label`；需要更明确描述时可覆盖 |

`icon` 插槽始终显示并收到 `{ active }`，供调用方切换描边／填充图标；`badge` 插槽也收到 `{ active }`，用于组合现有 `MdvBadge`。图标标为装饰内容，目的地名称由 `label` 提供；标签必须保持可见。支持 3–5 个简短的顶层目的地，组件不限制项目数量，也不提供 swipe、颜色或路由器耦合。

按钮和链接均保留原生语义、click 事件及其他原生属性。active 项标记 `aria-current="page"`；active 状态由使用方在应用导航成功后更新。所有可用项目按原生顺序逐项响应 Tab；按钮由浏览器原生 Space／Enter 激活，链接按浏览器原生键盘规则工作，不使用 tablist 或 roving tabindex。disabled 链接不参与激活。

视觉使用 MD3 主题令牌与局部主题继承。紧凑布局项目高度 56px、容器总高至少 80px；中等布局项目高 48px、容器高至少 64px。激活图标使用 secondary-container 指示背景，图标内颜色为 on-secondary-container；横向布局的指示背景扩展至图标和文字区域。未选项 hover 的 8% 背景胶囊在 200ms 内从中心展开，离开时收回；选中指示器同样按宽度过渡，图标、文字、徽标和点击区域保持稳定。已选项 hover 保持原指示背景，focus-visible／pressed 为 10%；reduced-motion 与 forced-colors 有对应处理。实际内容组合、视口断点、长文字／放大文字、RTL、主题和遮挡情况应在浏览器中验收。

公共类型：`MdvNavigationBarOrientation`、`MdvNavigationBarProps`、`MdvNavigationBarItemProps`、`MdvNavigationBarItemSlotProps`。

## MdvNavigationRail

`MdvNavigationRail` 是在页面布局中展开的标准导航轨；`MdvModalNavigationRail` 用独立模态层展开，保留正文宽度。两款共用 `MdvNavigationRailItem`，按当前 Material 3 Expressive 的 Collapsed／Expanded 规格实现。当前约定范围已完成用户项目检查与组件验收，包含胶囊动画、沉浸模式入口和嵌套弹窗焦点修正；真实包消费另行验证。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import home from '@iconify-icons/material-symbols/home'
import bookmark from '@iconify-icons/material-symbols/bookmark'
import person from '@iconify-icons/material-symbols/person'
import menu from '@iconify-icons/material-symbols/menu'
import { MdvIcon, MdvIconButton, MdvNavigationRail, MdvNavigationRailItem } from 'mdv'

const expanded = ref(false)
const current = ref('home')
const destinations = [
  { value: 'home', label: '首页', icon: home },
  { value: 'saved', label: '已保存', icon: bookmark },
  { value: 'profile', label: '个人资料', icon: person },
]
</script>

<template>
  <div class="flex h-dvh min-w-0">
    <MdvNavigationRail v-model:expanded="expanded" aria-label="主要目的地">
      <template #menu="{ menuAttrs, expanded: open }">
        <MdvIconButton variant="standard" v-bind="menuAttrs" :aria-label="open ? '收起导航' : '展开导航'">
          <MdvIcon :icon="menu" />
        </MdvIconButton>
      </template>
      <MdvNavigationRailItem
        v-for="destination in destinations"
        :key="destination.value"
        :label="destination.label"
        :active="current === destination.value"
        @click="current = destination.value"
      >
        <template #icon><MdvIcon :icon="destination.icon" /></template>
      </MdvNavigationRailItem>
    </MdvNavigationRail>
    <main class="min-w-0 flex-1 overflow-auto p-6">当前目的地：{{ current }}</main>
  </div>
</template>
```

导航轨位于布局的逻辑起始侧，父级应提供明确高度。标准款是普通布局元素，其真实宽度随展开动画变化，主区通过 flex／grid 自然让位；组件不固定整页、不修改正文样式。使用方决定何时使用 Navigation Bar、Rail 或其他导航。推荐收起时保留 3–7 个主要目的地，展开后可提供次要目的地。

### 两款共有 Props

| 属性 | 类型 | 默认值与行为 |
| ---- | ---- | ------------ |
| `expanded`／`v-model:expanded` | `boolean` | `false`；调用方控制，菜单操作发出更新请求，父级不接受则保持当前状态 |
| `alignment` | `'top' \| 'center'` | `'top'`；导航项组的位置，菜单／FAB 始终在顶部 |
| `expandedWidth` | `string` | 省略时按标签与徽标的自然宽度测量；显式 CSS 长度也受 220–360px 和可用空间约束 |
| `transparent` | `boolean` | `false`；移除默认面板填色，便于组合局部表面 |
| `showDivider` | `boolean` | `false`；逻辑末端的 1px outline-variant 分割线 |

标准款的 class、style、id、dir、ARIA 和原生事件作用于 `<nav>`。使用 `aria-label`／`aria-labelledby` 命名导航 landmark；不将导航改成 tablist 或 menu。暴露 `focus(options?)`，聚焦当前可用 active 项或第一个可用目的地。

### 插槽

两款的 `default`、`menu`、`fab` 插槽均收到 `MdvNavigationRailSlotProps`：

| 字段 | 含义 |
| ---- | ---- |
| `expanded` | 当前这份导航内容的展开形态；可用来显示次要目的地与分组说明 |
| `toggle()` | 请求展开／收起 |
| `menuAttrs` | 包含 `aria-controls`、`aria-expanded` 和 `onClick`；直接绑定菜单按钮即可，不必再绑定一次 toggle |

`default` 放导航项，也可组合现有 `MdvDivider` 与分组说明；`menu` 放菜单按钮，`fab` 放主要创建操作。没有对应插槽时不预留顶部空盒。本轮没有新增公共 FAB 组件，插槽可组合现有按钮或应用自己的 FAB。

模态款默认同时保留收起轨与展开层，两份内容复用同一组插槽，`expanded` 分别为 false／true。不要在两份内容中硬编码相同 id；Dialog 等独立浮层建议放在导航外，或只在展开分支实例化。`destroyOnClose` 只控制模态展开内容，收起轨保持挂载。

### MdvNavigationRailItem

| 属性 | 类型 | 默认值与行为 |
| ---- | ---- | ------------ |
| `label` | `string` | 必填，可见目的地名称，允许换行、撑高，不默认省略 |
| `href` | `string` | 提供后为原生 `<a>`；省略时为 `type="button"` |
| `active` | `boolean` | `false`；由应用在导航成功后控制，激活项标记 `aria-current="page"` |
| `disabled` | `boolean` | `false`；禁用按钮或移除链接 href 并退出 Tab 顺序 |

`icon`、`badge` 插槽收到 `{ active, expanded }`。图标为装饰内容，目的地名称由 label 提供；徽标可组合现有 `MdvBadge` 并提供通知说明。单份导航内始终保持一份徽标节点，收起时在图标角落，展开时在文字后，不私自清除通知。不要在导航项内部再嵌套按钮或链接。

原生属性和原始 click 事件透传，链接保留 Ctrl／Meta／Shift、新窗口及下载行为。所有可用项依次进入原生 Tab 顺序；Up／Down、Home／End 只移动焦点并在项目区域内滚动，不改变 active。禁用、hidden、inert 和 CSS 隐藏项跳过，嵌套导航只处理最近一层的按键。按钮的 Space／Enter、链接的 Enter 由浏览器激活。暴露 `focus(options?)`、`blur()`；没有 Router 依赖或另一个选中模型。

### MdvModalNavigationRail

从 `mdv` 额外导入 `MdvModalNavigationRail`，将标准示例的根组件替换为它即可使用模态展开。默认收起轨占据 96px，展开层从逻辑起始侧覆盖正文；页面尺寸不随其展开改变。官方 [Placement 指南](https://m3.material.io/components/navigation-rail/guidelines#5802f97a-4b57-4d32-8e06-5e02a3e78ac2) 允许沉浸场景隐藏展开式导航，正文填满空间，但应保留可访问的菜单按钮；普通收起窄轨仍应常驻。此行为由已有的 `hideOnCollapse` 控制：true 时占位为零，页面外部菜单设置 expanded=true 即可打开，无需另加隐藏属性。

```vue
<MdvIconButton
  variant="standard"
  aria-label="打开导航"
  aria-controls="immersive-navigation"
  :aria-expanded="expanded"
  @click="expanded = true"
>
  <MdvIcon :icon="menu" />
</MdvIconButton>
<MdvModalNavigationRail
  id="immersive-navigation"
  v-model:expanded="expanded"
  hide-on-collapse
  aria-label="主导航"
>
  <template #menu="{ menuAttrs }">
    <MdvIconButton variant="standard" v-bind="menuAttrs" aria-label="收起导航">
      <MdvIcon :icon="menu" />
    </MdvIconButton>
  </template>
  <MdvNavigationRailItem label="首页" :active="current === 'home'" @click="current = 'home'">
    <template #icon><MdvIcon :icon="home" /></template>
  </MdvNavigationRailItem>
</MdvModalNavigationRail>
```

| 模态专有属性 | 类型 | 默认值与行为 |
| ------------ | ---- | ------------ |
| `hideOnCollapse` | `boolean` | `false`；沉浸模式设为 true，收起时不保留窄轨占位，需在导航外提供菜单按钮；可动态切换 |
| `closeOnEsc` | `boolean` | `true`；最上层 Escape 请求收起 |
| `closeOnScrim` | `boolean` | `true`；在遮罩按下并释放后请求收起 |
| `closeOnSelect` | `boolean` | `true`；普通目的地激活后请求收起 |
| `destroyOnClose` | `boolean` | `false`；关闭动画完成后销毁模态内容 |

模态公开 `update:expanded(boolean)`、`open`、`opened`、`close(detail)`、`closed(detail)`。前两对生命周期分别表示状态变化和动效完成；detail.reason 为 `'menu' \| 'escape' \| 'scrim' \| 'select' \| 'model'`。父级拒绝更新时不触发关闭生命周期，也不跳到关闭位置。原生 click 在任一同步冒泡监听中被 preventDefault，或使用新窗口／下载操作时，不按选择关闭。

暴露 `close(): Promise<boolean>`，结果表示父级是否接受收起请求；动画可能尚未完成。`focus()` 聚焦 autofocus 元素或第一个可用交互项。模态通过原生 dialog 进入 top layer，使用已有模态栈、仅锁文档的滚动锁与焦点恢复；最上层 Tab 约束、Escape、嵌套 Menu／Dialog、卸载和 KeepAlive 清理与其他浮层一致。不附加 X，应用应提供可访问的菜单收起按钮。

模态的 class／style 作用于保留布局占位的外壳，CSS 变量同时进入 dialog 继承链；dir 和 data-mdv-theme 同时覆盖收起轨与展开层；id、ARIA 和其他原生事件作用于原生 dialog。默认命名为“主导航”，可提供更具体的 aria-label／aria-labelledby。SSR 始终先渲染关闭的原生 dialog，客户端挂载后再响应初始 expanded，保留稳定节点与关联 ID。

### 视觉与验证范围

收起宽 96px，指示胶囊 56×32px，标签 label-medium（12／16、500、tracking 0.5px）；展开宽 220–360px，胶囊最小高 56px、按内容包络，标签 label-large（14／20、500、tracking 0.1px）。图标 24px，展开图文间距 8px，胶囊左右内边距 16px。标准款 surface／无阴影／直角；模态款 surface-container、3dp elevation、靠内容侧 16px 圆角；可选边界线独立控制。

激活胶囊为 secondary-container，图标及展开标签 on-secondary-container，收起激活标签 secondary；未激活为 on-surface-variant。两种选中状态均有 on-secondary-container 的 8% hover 与 10% focus／pressed 状态层，范围限定在胶囊中。未选项 hover 和选中指示器参考 m3ui MNavigationBar，在 200ms 内从胶囊中心展开／收回，仅改变背景宽度与颜色，图标、文字、徽标及整行点击区域不移动；按下波纹沿用独立裁剪，避免重复叠加状态透明度。焦点轮廓使用 MDV 的 secondary／3px／offset 2px；这组焦点数值是项目实现选择，不冒称 Rail 页面独立令牌。

布局与标签由同一连续进度同步变化，文字不缩放；标准／模态参考 m3ui 的 0.9／700、0.9／1400 弹簧参数，中断保留速度，遮罩独立变化。支持 reduced-motion、forced-colors、RTL、局部主题、字体变化与独立项目滚动。不自动增加手势、密度变体或隐藏标签。

测试规格覆盖原生语义、键盘、取消导航、受控拒绝、焦点／嵌套、缓存、SSR／hydration 和动效中断；布局、hover、长标签、两倍字号、窄区域和真实设备效果仍须在开发预览中验收。真实包消费另行验证。

公共类型：`MdvNavigationRailAlignment`、`MdvNavigationRailProps`、`MdvModalNavigationRailProps`、`MdvNavigationRailCloseReason`、`MdvNavigationRailCloseDetail`、`MdvNavigationRailSlotProps`、`MdvNavigationRailItemProps`、`MdvNavigationRailItemSlotProps`。

## MdvNavigationDrawer

`MdvNavigationDrawer` 为布局内 Standard，`MdvModalNavigationDrawer` 为覆盖正文的 Modal；共用 `MdvNavigationDrawerItem` 和 `MdvNavigationDrawerGroup`。本组按旧版 M3 Navigation Drawer 实现，当前 Expressive 新项目可优先使用 Expanded Navigation Rail。当前约定范围已完成项目检查与用户预览验收，真实包消费另行验证。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  MdvButton,
  MdvNavigationDrawer,
  MdvNavigationDrawerGroup,
  MdvNavigationDrawerItem,
} from 'mdv'

const visible = ref(true)
const current = ref('inbox')
const folders = ref(true)
</script>

<template>
  <div class="flex h-[36rem] min-w-0">
    <MdvNavigationDrawer id="mail-navigation" v-model="visible" title="邮箱">
      <MdvNavigationDrawerItem
        label="收件箱"
        :active="current === 'inbox'"
        :badge="24"
        @click="current = 'inbox'"
      />
      <MdvNavigationDrawerGroup v-model:expanded="folders" label="文件夹" collapsible divider>
        <MdvNavigationDrawerItem
          label="归档"
          :active="current === 'archive'"
          @click="current = 'archive'"
        />
      </MdvNavigationDrawerGroup>
    </MdvNavigationDrawer>
    <main class="min-w-0 flex-1 overflow-auto p-6">
      <MdvButton
        aria-controls="mail-navigation"
        :aria-expanded="visible"
        @click="visible = !visible"
      >切换导航</MdvButton>
      <p>{{ current }}</p>
    </main>
  </div>
</template>
```

Standard 占用父布局中的真实宽度，关闭后占位归零。父级负责高度，推荐使用 flex 布局并令正文 `min-width: 0`；抽屉置于正文之前，逻辑 start 在 RTL 中镜像。初次显示和重新打开均不抢正文焦点，也不锁背景。不会自动依据断点改成 Modal 或折成 Rail。

### 两款共享属性与事件

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `modelValue` | Standard `true`；Modal `false` | boolean v-model；父级决定是否接受状态请求 |
| `title` | `''` | 顶部标题；可用 header 插槽替换 |
| `width` | `'360px'` | CSS 长度，如 `280px`、`24rem`；受父区／视口宽度约束 |
| `beforeClose` | — | 接收只读关闭详情；同步或异步返回 false 阻止本次关闭 |
| `destroyOnClose` | `false` | 默认保留内容；true 时退出完成后销毁 |

两款的 `default`、`header`、`footer` 插槽均提供 `{ close }`。default 放导航 Item／Group；header 和 footer 可以放标题、按钮、输入或嵌套浮层。`close(): Promise<boolean>` 表示父级是否接受关闭请求，返回 true 时退出动画可能尚未结束；`focus()` 聚焦当前可用目的地或首个可用行。外部直接修改模型是程序控制，跳过 `beforeClose`。

事件：`update:modelValue(boolean)`、`open`、`opened`、`close(detail)`、`closed(detail)`。open／close 表示开始进入／退出，opened／closed 表示动效结束。`detail.reason` 为 `'action' | 'escape' | 'scrim' | 'select' | 'swipe' | 'model'`。Standard 使用 action／model；Modal 还可由 Escape、遮罩、目的地选择、滑动发起。异步关闭请求合并；父级拒绝更新时不触发退出生命周期，旧请求不会关闭后来重新打开的抽屉。

### MdvModalNavigationDrawer

替换根组件并令初始模型为 false，即可由外部按钮打开 Modal。始终保留可访问的打开入口，并用 `aria-controls` 指向抽屉 id、`aria-expanded` 表达开关状态。

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `closeOnEsc` | `true` | 最上层 Escape 请求关闭 |
| `closeOnScrim` | `true` | 完整的遮罩按下／释放请求关闭 |
| `closeOnSelect` | `true` | 普通目的地激活后请求关闭 |
| `closeOnSwipe` | `true` | 向逻辑起始边横向滑动关闭 |

Modal 使用原生 dialog 的 top layer、现有模态栈、仅锁文档的滚动锁和焦点恢复。打开优先聚焦显式 autofocus，再选首个可用交互元素；Tab 约束只属于最上层。关闭恢复有效触发器，不覆盖仍在工作的嵌套对话框。未自动添加 X；可通过 footer／header 的 close 方法组合自己的操作。

滑动跟随面板与遮罩，保留纵向滚动及嵌套控件操作；不足阈值、取消或父级拒绝时回弹。位移超过半宽，或朝关闭方向的释放速度超过 400px/s 时请求关闭；这是参考 m3ui 的交互参数，并非官网单独公布的阈值。一次实际滑动后的跟随 click 被取消，键盘激活不受影响。

Standard 的 class、style、id、ARIA 与原生事件透传到 nav，CSS 变量同时用于外层布局。Modal 的 id、dir、ARIA 与原生事件透传到 dialog，class／style 用于可见面板，CSS 变量同时进入遮罩继承链。缺少名称时使用 title／header 或默认“主导航”。SSR 中 Modal 始终关闭，客户端挂载后才响应初始打开模型；内容保留与稳定 ID 支持 hydration。

### MdvNavigationDrawerItem

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `label` | 必填 | 完整目的地文字；视觉单行省略 |
| `href` | — | 存在时渲染原生 a，否则为 type=button |
| `active` | `false` | 由调用方管理，输出 aria-current=page |
| `disabled` | `false` | 禁用激活；禁用链接移除 href 并退出 Tab |
| `badge` | — | string／number 尾部文字计数，含数字 0 |

icon／badge 插槽均读取 `{ active }`，可按 active 切换实心图标。badge 默认是右对齐文字，也可以通过插槽组合 `MdvBadge`；通知的具体可访问描述由应用提供。其余原生属性、class、style 和事件作用于实际按钮／链接；暴露 `focus(options?)`、`blur()`。

导航和 active 状态由调用方决定。普通点击会通知 Modal 选择关闭；同步冒泡过程中取消 click、修饰键、新窗口和下载链接均不触发该关闭。组合路由时由应用处理原生链接导航，不依赖 RouterLink。链接保持原生 Enter、按钮保持 Enter／Space 语义。

### MdvNavigationDrawerGroup

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `label` | 必填 | 分组名称 |
| `collapsible` | `false` | false 为静态分组标题，true 为 disclosure 按钮 |
| `expanded` | 未传时内部 `true` | 可选 v-model:expanded；受控拒绝不改变显示状态 |
| `disabled` | `false` | 禁用折叠按钮，子目的地按各自 disabled 管理 |
| `divider` | `false` | 在该组之前添加内缩分隔线 |

default／label／icon 插槽读取 `{ expanded }`。default 可嵌套 Item 或 Group；label 替换标题内容，icon 为可选前置图标。点击折叠按钮只改变展开状态，不把它当作 active 目的地，也不关闭 Modal。折叠内容保留在 DOM，但以 inert／aria-hidden 移出交互和读屏顺序；仅当焦点位于即将隐藏的后代中时才移回组按钮。参考 MD3 官网导航的层级外观，可折叠组的子项整行向逻辑起始侧内缩，每级 12px；选中背景、hover、波纹及焦点轮廓共用该行边界，胶囊内仍保留 16px 留白，尾侧保持对齐。静态分组不额外增加层级，RTL 自动镜像。这是 MDV 的嵌套导航设计，非 Drawer 规范公布的独立令牌。

整个抽屉为 nav + ul／li；嵌套组为标记了名称的内层列表，不使用 menu、tree 或 tab 角色。Tab／Shift+Tab 逐项访问，上下方向键、Home／End 在可见可用的导航行／分组按钮间移焦点，不改变 active；组内其他控件和嵌套浮层保留自己的键盘操作。

### 外观与验证

默认宽 360px，朝内容侧两角 16px；Standard 为 surface／无阴影，Modal 为 surface-container-low／elevation 1，遮罩沿用 MDV 的 32% scrim。项目最小高 56px，两侧各 12px，胶囊内水平 16px；图标 24px、图文间距 12px。标签与计数 label-large（14／20、500、tracking 0.1px），active 标签 700；字号增大时行高随内容增长。

active 背景 secondary-container，文字／图标 on-secondary-container；未选中及尾计数 on-surface-variant。整行胶囊 hover 8%、focus／pressed 10%，焦点 secondary／3px／offset -3px。分隔线按内容边界两侧 28px 对齐，仅用于分组。内容区独立滚动并使用局部 thin 滚动条；支持浅深、局部令牌、动态主题、RTL、reduced-motion 和 forced-colors，不额外提供 color API。

测试规格覆盖语义、取消激活、分组控制、方向键、模态关闭来源、拦截／拒绝／过期、嵌套焦点、滑动、卸载／KeepAlive、运动中断及 SSR／hydration。用户已确认全部项目指令通过并完成当前范围的预览验收，包含最新子项胶囊与折叠箭头修订；触屏／读屏专项和真实包消费另行记录。

公共类型：`MdvNavigationDrawerProps`、`MdvModalNavigationDrawerProps`、`MdvNavigationDrawerCloseReason`、`MdvNavigationDrawerCloseDetail`、`MdvNavigationDrawerSlotProps`、`MdvNavigationDrawerItemProps`、`MdvNavigationDrawerItemSlotProps`、`MdvNavigationDrawerGroupProps`、`MdvNavigationDrawerGroupSlotProps`。

## MdvAppBar

按当前 [App Bar 规范](https://m3.material.io/components/app-bars/specs) 提供 Small、Medium flexible、Large flexible。默认 Small；旧 Center-aligned 对应 Small 的居中配置。搜索应用栏由下述 MdvSearchAppBar 组合提供，复用本组件的滚动和 Scaffold 协调。

应用布局推荐组合 `MdvAppBarScaffold`：应用栏放在 `appbar` 插槽、正文放在默认插槽，滚动条只出现在正文区，自动关联滚动目标。

```vue
<script setup lang="ts">
import { MdvAppBar, MdvAppBarScaffold, MdvIconButton } from 'mdv'
</script>

<template>
  <MdvAppBarScaffold style="height: 32rem" :content-attrs="{ 'aria-label': '行程正文' }">
    <template #appbar>
      <MdvAppBar
        variant="large"
        title="周末去远足"
        subtitle="收藏沿途的美好风景"
        collapsed-title="远足计划"
        scroll-behavior="exit-until-collapsed"
      >
        <template #leading>
          <MdvIconButton variant="standard" aria-label="返回">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="m20 11-12.17 0 5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20Z" />
            </svg>
          </MdvIconButton>
        </template>
      </MdvAppBar>
    </template>
    <main style="padding: 16px"><!-- 页面正文 --></main>
  </MdvAppBarScaffold>
</template>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `variant` | `'small'` | `small`、`medium`、`large`；中／大对应 Flexible |
| `appearance` | `'default'` | `default` 无阴影／边框；`elevated` 随滚动进度逐步显示 elevation 2 阴影，初始展开时无阴影；`bordered` 添加 1px 底部分隔线 |
| `title` | — | 默认标题；也可使用 title 插槽 |
| `subtitle` | — | 默认副标题；也可使用 subtitle 插槽 |
| `collapsedTitle` | — | Small／收合后的简短默认标题；完整标题仍作为可访问名称 |
| `titleAlignment` | `'start'` | `start`、`center`；居中以整栏为基准，为不对称操作保留空间 |
| `headingLevel` | `1` | `1–6`；按页面层级配置，预览组合通常使用 2 或 3 |
| `scrollBehavior` | `'none'` | 普通布局、固定、收合或自动隐藏，见下表 |
| `scrollTarget` | 省略跟随 Scaffold 正文，否则 Window | Window、HTMLElement、选择器，或返回 Window／HTMLElement／null／undefined 的 getter；显式值优先 |
| `scrolled` | 未提供时自动 | boolean；显式 false／true 将颜色与可选阴影设为初始／完整滚动端点，不改变滚动位置、收合或隐藏 |
| `transparentOnScroll` | `false` | 随滚动逐步透明，并淡出可选阴影；`bordered` 的分隔线保留，浮动操作建议组合 filled／tonal 按钮 |

| `scrollBehavior` | 行为 |
| --- | --- |
| `none` | 普通文档布局；自动滚动外观仍可由 scrolled 覆盖 |
| `pinned` | 在所在滚动区域内 sticky，始终可见 |
| `exit-until-collapsed` | 中／大随正文接近顶部的距离连续收合为 Small；正文仍远离顶部时反向滚动不会展开 |
| `enter-always` | 向下滚动先收合中／大款，再隐藏 Small 操作行；反向滚动立即跟随出现；静止时吸附至最近的展开／Small／隐藏端点 |

`MdvAppBarScaffold` 的父级应提供确定的可用高度，例如上例的 `height:32rem`，或在已有高度的应用布局内使用 `h-full`／`flex-1 min-h-0`。高度需能容纳应用栏和正文，放大文字或长标题时也需留出足够空间。`appbar` 插槽用于一个 `MdvAppBar`，允许中间包装组件；默认插槽不生成 main 地标，由调用方按页面语义组合正文。Scaffold 不设置正文 padding。

| Scaffold API | 说明 |
| --- | --- |
| `contentAttrs?: HTMLAttributes` | 正文滚动区原生属性与事件，例如 `aria-label`、`aria-labelledby`、`id`、`tabindex`、`onScroll`；默认 `role="region"`、`aria-label="正文"`、`tabindex="0"`，可覆盖 |
| `appbar` 插槽 | 放置应用栏，自动跟随本实例的正文滚动；正文里的独立应用栏不继承这个关联，嵌套 Scaffold 各自独立 |
| 默认插槽 | 正文内容；滚动区支持原生方向键、PageUp／PageDown、Home／End |
| `element`（Expose） | Scaffold 根元素；class／style／id／dir 等原生属性透传到根元素 |
| `contentElement`（Expose） | 正文滚动元素；可调用 `scrollTo({ top: 0, behavior: 'smooth' })` 回顶 |

Scaffold 中应用栏位于正文滚动节点之外；收合／隐藏时正文可用高度同步增加，内部起始空间补偿保持滚动范围稳定，正文底端不增加空白。标题、图片和字体尺寸变化由应用栏重新测量。`none` 在这个组合里表示不收合／不隐藏，栏仍由外层布局固定在正文上方；其它滚动行为沿用上表。Scaffold 不锁页面滚动，也不改变导航侧栏高度。

与 Standard Drawer 并排组合时，将 `MdvNavigationDrawer` 放在 `MdvAppBarScaffold` 的紧邻前一个兄弟位置。Scaffold 会把当前应用栏背景延伸到 Drawer 的圆角后方，同步滚动变色、可见高度、透明度和主题；Drawer 自身保留 16px 圆角。共同外层可使用正文底色，无需用相同底色抹平圆角；RTL 会自然镜像。中间不插入其它布局节点，Modal Drawer 保持独立浮层。playground 的导航组合示例采用此结构。

独立使用 `MdvAppBar` 时，省略 scrollTarget 仍跟随 Window；局部滚动可将应用栏置于自己的 `overflow:auto` 容器中，并传入 `:scroll-target="() => content"`（`content` 为模板 ref）。这种结构的滚动条属于外层，会贯穿应用栏；只希望正文出现滚动条时使用 Scaffold。独立模式的 sticky 边界由祖先布局决定，根保留展开高度以稳定 scrollTop。

显式选择器或 getter 没有找到元素时不回退到 Window 或 Scaffold。getter 内的响应式引用变化会切换目标，旧监听会清理；目标稍后由应用外部创建时可调用 refresh()。滚动收合始终以所跟随目标的 scrollTop 为依据。

leading／actions 插槽组合现有 IconButton、Menu 等操作；不自动生成返回按钮或处理路由。title／subtitle 替换文字，image 用于中／大款标题上方的品牌图像；Small 的 logo 放入 title 插槽。全部插槽读取 `{ scrolled, collapsed }`；collapsed 表示中／大款已收合到 Small。插槽只挂载一次，收合不复制自定义标题或按钮。使用 collapsedTitle 时完整标题保持可访问名称，简短副本只用于视觉显示。

右侧尾部自定义内容放入现有 `actions`，例如文字按钮、头像或菜单：

```vue
<MdvAppBar title="行程" appearance="bordered">
  <template #actions>
    <MdvButton variant="text" @click="exportTrip">导出行程</MdvButton>
  </template>
</MdvAppBar>
```

`actions` 容器会参与布局测量，为标题保留空间；不限制其内容必须为图标按钮。playground 的“右侧自定义操作”演示该用法。

class、style、id、ARIA 和原生事件透传到 header；没有额外组件事件或模型。暴露 `element`（header）和 `refresh()`（重新解析目标及测量布局）。首次挂载不抢焦点，Tab／Shift+Tab 按原生顺序访问操作，按钮保持 Enter／Space；键盘焦点进入应用栏会显示完整操作区并保持可见，鼠标操作不因此锁住自动隐藏。图标按钮须提供 aria-label／aria-labelledby，标题插槽应优先使用文字或带可访问名称的品牌图像。

| 尺寸 | 无／有副标题的默认高度 | 标题 | 副标题 |
| --- | --- | --- | --- |
| Small | 64／64px | title-large，22／28、400 | label-medium，12／16、500、tracking 0.5 |
| Medium flexible | 112／136px | headline-medium，28／36、400 | label-large，14／20、500、tracking 0.1 |
| Large flexible | 120／152px | display-small，36／44、400 | title-medium，16／24、500、tracking 0.15 |

默认高度对应标准单行标题。中／大标题建议控制在两行以内；更长内容和放大文字按真实内容增高，展开时不硬裁标题。Small／收合状态为单行省略，可提供简短 collapsedTitle。自定义图片、字体加载、文字、宽度和操作数量变化会触发重新测量；底部保留 12px，标题区域两侧 16px，操作区两侧 4px，按钮间无额外间隔。复用 IconButton 的 48px 交互区及内部 40px 可见容器，图标默认 24px；自定义头像建议为 32px，置于 48px 交互区域内。

初始为 surface，随滚动连续混合至 surface-container；中／大收合模式以实际收合比例驱动颜色，其余模式与 Small 在一个操作行高度的滚动距离内变化。参考 m3ui 的 FastOutLinearIn `cubic-bezier(0.4, 0, 1, 1)`，直接映射滚动进度，反向滚动与吸附过程中同步恢复颜色，不叠加按时间延迟的背景过渡。`scrolled` 插槽状态仍表示目标已经离开顶部，可用来切换操作按钮，颜色不由该布尔状态直接切换。

默认 `appearance="default"` 始终无阴影／边框，`elevated` 开启随滚动进度渐显的 elevation 2（3dp）阴影：初始展开时无阴影，随收合逐步增强，完全收合后完整显示，回到展开端点时消失。Small／固定模式沿用连续配色的距离进度；`bordered` 显示 outline-variant 的 1px 底部分隔线。三种外观均保留连续配色，分隔线和阴影不改变布局高度。默认无阴影是用户确认的 MDV 选择，官网滚动层级仍记录为 elevation 2。透明模式在阴影渐显的基础上同步淡出，完全展开与完全透明时都无阴影，边框保持可见。

容器直角，标题与前置普通图标 on-surface，副标题与尾部普通图标 on-surface-variant。支持浅深色、局部令牌、动态取色、RTL、reduced-motion 和 forced-colors。吸附参考 m3ui 的 150ms 静止检测及 DefaultEffects 临界阻尼／刚度 1600，均为参考实现参数，非官网公布的固定时长。reduced-motion 保留直接滚动映射，关闭吸附补间。

MdvAppBar 与 MdvAppBarScaffold 当前约定范围已完成用户项目检查与开发预览验收，包含连续配色、三外观、独立正文滚动和 Drawer 圆角背景延伸。已提供滚动／目标切换／焦点／测量／KeepAlive、弹簧中断、SSR／hydration、Scaffold 嵌套隔离与节点保留等测试。协作侧真实浏览器检查了正文滚动条起点、收合中滚动范围、底端与短正文、自动隐藏及键盘恢复、窄容器／RTL／深色／放大文字、导航／菜单／对话框组合和背景延伸，控制台无警告或错误。其余设备专项与真实包消费另行验证。

公共类型：`MdvAppBarProps`、`MdvAppBarVariant`、`MdvAppBarAppearance`、`MdvAppBarTitleAlignment`、`MdvAppBarScrollBehavior`、`MdvAppBarScrollTarget`、`MdvAppBarSlotProps`、`MdvAppBarScaffoldProps`。

## MdvSearchBar、MdvSearchView 与 MdvSearchAppBar

依据 [Search 规范](https://m3.material.io/components/search/specs)、Guidelines／Accessibility 和 Search app bar 测量图实现。默认 Contained；Divided 为旧版 M3 样式，按约定一并覆盖。当前约定范围已完成用户项目检查与开发预览验收，真实包消费另行验证。

`MdvSearchBar` 是独立的原生搜索输入；`MdvSearchView` 默认自带搜索栏入口，管理模态展开和结果；`MdvSearchAppBar` 将 SearchView 放入 64px 应用栏，共用既有滚动、焦点显示和 Scaffold 布局。结果数据、过滤、网络请求和历史记录由应用管理。

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { MdvSearchView, MdvList, MdvListItem } from 'mdv'

const query = ref('')
const open = ref(false)
const items = ['旅行计划', '设计评审', '团队分享']
const results = computed(() => items.filter((item) => item.includes(query.value)))
function search(value: string) {
  console.log('提交搜索', value)
}
</script>

<template>
  <MdvSearchView
    v-model="query"
    v-model:open="open"
    placeholder="搜索邮件"
    :status-text="`${results.length} 条结果`"
    @search="search"
  >
    <template #default="{ close }">
      <MdvList>
        <MdvListItem
          v-for="item in results"
          :key="item"
          :headline="item"
          interactive
          @click="query = item; close()"
        />
      </MdvList>
    </template>
  </MdvSearchView>
</template>
```

### 输入与布局

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `v-model` | `''` | 查询字符串；未绑定时由组件管理 |
| `placeholder` | `'搜索'` | 提示文字 |
| `label` | 使用 placeholder | 输入与搜索对话框的可访问名称；原生输入 ARIA 可另外透传 |
| `disabled`／`readonly` | `false` | 禁用不请求展开；只读可查看已有结果，不能编辑或清空 |
| `clearable`／`clearLabel` | `true`／`'清空搜索'` | 查询非空时显示独立清空动作 |
| `loading` | `false` | 输入及结果区域标记忙碌，不自动禁用输入；进度视觉用结果插槽组合 |
| `v-model:open` | `false` | View／AppBar 展开状态；未绑定时由组件管理 |
| `variant` | `'contained'` | View／AppBar 支持 contained／divided |
| `layout` | `'auto'` | auto／docked／fullscreen；auto 小于 600px 全屏，否则 Docked |
| `backLabel` | `'返回'` | 全屏、Divided 或图标入口展开时的返回按钮名称 |
| `inputAttrs` | — | View／AppBar 输入的原生 name、form、maxlength、autocomplete、ARIA 与事件 |
| `statusText` | `''` | View／AppBar 单独的礼貌状态播报文本 |
| `closeOnEsc`／`closeOnScrim` | `true` | 关闭请求策略 |
| `beforeClose` | — | 接收只读 `{ reason }`，返回 false 或 Promise false 拒绝关闭 |
| `destroyOnClose` | `false` | 退出完成后是否销毁展开内容；默认保留节点与结果滚动 |

Bar 的原生 class／style 作用于外层，其余原生输入属性与事件作用于 input。View／AppBar 的原生属性保留在根节点，输入属性使用 inputAttrs；控件 ID 会按当前活动输入分配，避免入口与展开输入重复 ID。两个输入共享查询，并仅让当前输入参与表单；表单在外部时通过 inputAttrs.form 关联已有表单 ID。

搜索栏最小高 56px；独立 Bar 宽度由父级决定。View 的普通栏在 pane 内左右 24px，Contained 展开时向两侧各延展 12px；搜索应用栏使用自身的 4px 外缘和 8px 动作间距。推荐宽度 360–720px，在窄视口内按可用空间缩小。Contained Docked 的栏和结果相隔 2px，结果圆角 12px；Divided Docked 使用 28px 合并容器，全屏头部高 72px。

Docked 和全屏均使用模态遮罩与原生 dialog，背景暂不可交互。输入栏固定，仅结果区滚动；Docked 按视口空间约束，最大约屏高 2/3。全屏跟随 VisualViewport 与安全区。层级令牌与可见阴影分别处理，默认不额外绘制阴影。浅深主题、动态色及局部令牌在原 DOM 继承，无需 Teleport 到 body 复制主题。

### 事件、插槽与实例

- `search(query, originalEvent?)`：Enter 提交；中文 composition 中的 Enter 不提交，按键重复不重复搜索。提交后保留查询并将焦点移到结果区域，默认不关闭。
- `clear()`：清空查询的通知；不关闭，焦点返回输入。
- `open`／`opened`：接受展开／展开动效完成；`close(detail)`／`closed(detail)`：接受关闭／退出完成。`detail.reason` 为 back／escape／scrim／programmatic／model；父级拒绝 v-model:open 请求时不释放模态或触发关闭生命周期。
- Bar 的 `leading`／`trailing`：前后图标或独立动作，动作不嵌套进整栏按钮。
- View 的 `leading`：默认入口前导；`trailing`：入口和展开栏尾部，提供完整搜索状态。`default`：结果，提供 `{ query, expanded, close, search }`。复用插槽会分别实例化入口和展开内容，避免在其中写死重复 ID。
- View 的 `trigger`：提供上述状态和 `triggerProps`，绑定到一个原生按钮或根为按钮的组件；包含 ref、ARIA 关联和原生点击处理，可组合 MdvIconButton。自定义触发器需提供可访问名称。
- Bar 暴露 `element`／`inputElement`／`focus(options?)`／`blur()`；View 另有 `open()`／`close()`，返回 Promise boolean 表示父级是否接受请求；AppBar 同样提供，并另有 `refresh()`。入口切换时通过当前 inputElement 访问实际输入，不缓存旧节点。

返回、Escape 和遮罩保留查询，关闭后恢复原触发器焦点且不自动重开。Tab／Shift+Tab 自然遍历最上层；输入的 Down／Up 进入建议首／尾，MdvListItem 的主操作可用 Up／Down／Home／End 导航，首项 Up 返回输入，跳过禁用项。自定义结果可将 `data-mdv-search-result` 放到原生可聚焦操作上；嵌套输入、筛选按钮和 List 自身已有的键盘模型保持原生行为。结果维持 list／button／link 等实际语义，不默认套 menu／listbox 或 combobox。

### 搜索应用栏

```vue
<MdvAppBarScaffold style="height: 32rem">
  <template #appbar>
    <MdvSearchAppBar v-model="query" scroll-behavior="pinned">
      <template #leading><!-- 导航按钮 --></template>
      <template #actions><!-- 栏外账号或更多操作 --></template>
      <template #search-trailing><!-- 搜索栏内部操作 --></template>
      <template #default="{ close }"><!-- 搜索建议或结果 --></template>
    </MdvSearchAppBar>
  </template>
  <!-- 正文内容 -->
</MdvAppBarScaffold>
```

AppBar 另支持 `appearance='default' | 'elevated' | 'bordered'`、`scrollBehavior='none' | 'pinned' | 'enter-always'`、`scrollTarget` 和 `scrolled`，默认 none／default。配色连续跟随正文滚动，elevated 初始无阴影。leading／actions 是栏外操作，提供 AppBar 的 scrolled／collapsed；search-leading／search-trailing 是栏内插槽，提供搜索状态。输入使用单独的内容区域，不放入标题 heading；结果中嵌套的其它 AppBar 不继承搜索内容。

建议使用已有 Scaffold 让滚动条只在正文出现，省略 scrollTarget 自动关联正文；与相邻 Standard Drawer 的圆角背景延伸规则相同。组件不默认添加全局快捷键、网络防抖、历史存储或路由行为。

已编写输入、IME、模型拒绝、表单字段、焦点、嵌套浮层、响应切换、KeepAlive、动效中断与 SSR／hydration 规格。用户确认当前约定范围的项目指令全部通过，开发预览验收完成。协作侧在现有开发预览核对了四种布局的鼠标／键盘焦点来源和 Tab 焦点框，包含输入栏与结果区的边界；软键盘、触屏、读屏专项和真实包消费另行验证。

公共类型：`MdvSearchVariant`、`MdvSearchLayout`、`MdvSearchCloseReason`、`MdvSearchCloseDetail`、`MdvSearchBeforeClose`、`MdvSearchBarProps`、`MdvSearchViewProps`、`MdvSearchAppBarProps`、`MdvSearchSlotProps`、`MdvSearchTriggerProps`、`MdvSearchTriggerSlotProps`。

## MdvToolbar

按 Material 3 当前 Toolbar 的 Docked／Floating 实现。默认 Docked／Standard／横向；Floating 另支持竖向布局、保留主要操作的展开／收合。旧版 Bottom App Bar 和独立 FAB 不属于这个组件。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MdvButton, MdvToolbar } from 'mdv'

const expanded = ref(true)
</script>

<template>
  <MdvToolbar v-model:expanded="expanded" variant="floating" aria-label="草稿操作">
    <template #leading>
      <MdvButton variant="text">撤销</MdvButton>
    </template>
    <MdvButton>保存草稿</MdvButton>
    <template #trailing>
      <MdvButton variant="text">复制</MdvButton>
    </template>
  </MdvToolbar>
</template>
```

### 属性与布局

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `variant` | `'docked'` | docked／floating |
| `color` | `'standard'` | standard／vibrant |
| `orientation` | `'horizontal'` | horizontal／vertical；竖向仅用于 Floating |
| `align` | `'center'` | start／center／end／between，按主轴排列 |
| `elevated` | Floating 为 true，Docked 为 false | 是否显示柔和阴影，可显式关闭 |
| `position` | `'static'` | static／absolute／fixed |
| `placement` | `'bottom'` | bottom／start／end，逻辑方向；Docked 仅 bottom |
| `v-model:expanded` | 未绑定时 true | Floating 的两侧分组是否展开，绑定时以父级接受值为准 |
| `scrollBehavior` | `'none'` | none／hide／collapse；Docked 支持 none／hide |
| `scrollTarget` | Window | Window、HTMLElement、CSS selector 或返回目标的 getter；显式目标不存在时不回退 |
| `scrollThreshold` | `40` | 同方向累计滚动多少像素后隐藏／收合，反向重新累计；回到顶端恢复 |
| `expandLabel`／`collapseLabel` | `'展开工具栏'`／`'收起工具栏'` | 默认展开入口的可访问名称 |

Docked 默认直角、填满父级宽度，最小高 64px，两端 16px，项目间距默认 32px；可用空间不足时将间距缩小至 4px，操作本身不缩放。`align='between'` 可在可用宽度中均匀安排默认插槽的操作。Floating 横向最小高／竖向最小宽 64px，内边距 8px、操作间距 4px、全圆角，按内容自然占位。文字和控件需要更多高度时自然增高。可覆盖 `--mdv-toolbar-gap`、`--mdv-toolbar-margin`、`--mdv-toolbar-container`、`--mdv-toolbar-content`、`--mdv-toolbar-selected-container` 和 `--mdv-toolbar-selected-content`；调用方 class／style、ARIA 与事件保留在根节点。

Standard 使用 surface-container／on-surface-variant，切换项选中使用 secondary-container／on-secondary-container。Vibrant 使用 primary-container／on-primary-container，切换项选中使用 surface-container／on-surface。直接放入操作插槽的无显式配色 MdvIconButton（standard／tonal）与 MdvButton（text／tonal）会按工具栏适配；filled 保留主操作的强调色，显式 color 或 style 优先。Menu／Tooltip 弹层和其它独立 Toolbar 保持自己的颜色。自定义包装组件可通过这些颜色变量适配。按钮的 hover／pressed／focus-visible 和禁用行为仍由按钮负责，整个 Toolbar 不叠加状态层。

`static` 参与正常页面布局。`absolute` 需要父级 `position:relative` 和足够高度；`fixed` 相对视口。两种贴边模式由组件处理安全区：Floating 横向至少 16px、竖向至少 24px 的边距，Docked 贴底。贴边模式不替正文预留空间，布局时为正文安排必要的底部或侧边空间。竖向 Floating 避免使用 wide 图标按钮；与 Navigation Rail 组合时放在另一侧，Rail 使用居中排列。底部 Toolbar 与底部 Navigation Bar 应在不同页面或状态展示。

Floating 操作数量超过可用宽度时，将次要操作组合进尾部 MdvMenu，可按应用断点选择展示位置；组件不复制插槽、不隐式搬移有状态控件，也不通过横向滚动或裁掉操作模拟溢出菜单。原生自定义控件应有至少 48×48px 的交互目标。

Floating 阴影按官方示例收紧柔光层的扩散范围，避免容器周围出现厚重的灰色光晕；阴影颜色仍跟随主题的 shadow 角色。

### 插槽、展开与键盘

- `default`：主要操作，收合后保留。
- `leading`／`trailing`：主要操作两侧的分组，Floating 收合时裁剪并设为 inert，保留 DOM、输入内容和组件状态。
- `toggle`：自定义展开／收起入口；默认在存在两侧分组的 Floating 中显示图标按钮。必须将 `toggleProps` 绑定到可交互控件。
- 所有插槽提供 `{ expanded, expand, collapse, toggle, toggleProps }`。`toggleProps` 包含 aria-expanded、aria-controls、aria-label 与 onClick。
- 事件 `update:expanded(value)` 请求展开／收合；父级拒绝更新时不改变可见性或焦点。未绑定时由组件自行管理。
- 实例暴露 `element`、`expand()`、`collapse()`、`toggle()`、`refresh()`。前三个状态方法返回 Promise boolean 表示请求是否被接受；refresh 重读分组尺寸与显式滚动目标。

根为 `role='toolbar'`，默认名称“工具栏”，建议提供具体的 aria-label 或 aria-labelledby。挂载不抢焦点；Tab／Shift+Tab 自然遍历所有可访问操作，根本身不额外占 Tab 位。横向左右键（包括 RTL）、竖向上下键、Home／End 在实际可用操作间移动；不更改选中状态，Space／Enter 按原生控件激活。输入框、Slider、嵌套菜单、列表框及其它复杂控件保留自己的按键。

滚动默认关闭。选择 hide 时仅隐藏视觉位置，保留布局与节点，Tab 或焦点进入会恢复整栏；当前有焦点、指针操作或菜单展开时不自动隐藏／收合。选择 collapse 时保留主要操作与展开入口，不再同时移出屏幕。外部接受的收合若影响当前焦点，会先将焦点移至主要操作或展开入口，再使分组不可访问。收合弹簧保留反转速度、只改变分组尺寸，不整体缩放文字；reduced-motion 直接到目标。

```vue
<div style="position: relative; height: 24rem">
  <div ref="content" style="height: 100%; overflow: auto; padding-bottom: 7rem">
    <!-- 正文 -->
  </div>
  <MdvToolbar
    variant="floating"
    color="vibrant"
    position="absolute"
    scroll-behavior="collapse"
    :scroll-target="() => content"
    aria-label="画布编辑"
  >
    <template #leading><!-- 次要操作 --></template>
    <!-- 始终保留的主要操作 -->
    <template #trailing><!-- 更多操作菜单 --></template>
  </MdvToolbar>
</div>
```

`content` 为调用方的模板 ref。目标更换、KeepAlive 停用和卸载会释放旧监听与动画；SSR 不读取浏览器全局，不重新挂载分组来实现收合。

独立 playground 覆盖两款形态与配色、横竖、收合、受控拒绝、滚动目标、菜单／输入、Dialog、Rail、窄容器、RTL、局部主题与放大文字。行为、SSR／hydration、动效规格已编写；用户确认当前约定范围的项目指令全部通过并接受开发预览，包含 Floating 阴影修订。触屏、读屏专项和真实安装包消费另行验证。

公共类型：`MdvToolbarVariant`、`MdvToolbarColor`、`MdvToolbarOrientation`、`MdvToolbarAlignment`、`MdvToolbarPosition`、`MdvToolbarPlacement`、`MdvToolbarScrollBehavior`、`MdvToolbarScrollTarget`、`MdvToolbarProps`、`MdvToolbarToggleProps`、`MdvToolbarSlotProps`。
