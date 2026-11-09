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

| Prop | 类型／可选值 | 默认值 |
| --- | --- | --- |
| `variant` | `filled`、`tonal`、`outlined`、`standard` | `filled` |
| `color` | `primary`、`secondary`、`tertiary`、`success`、`warning`、`error`、`info` 或 `#RGB`／`#RRGGBB` 种子色 | 不提供 |
| `size` | `xs`、`s`、`m`、`l`、`xl` | `s` |
| `width` | `narrow`、`default`、`wide` | `default` |
| `shape` | `round`、`square`，指定未选中时的形状 | `round` |
| `selected` | `boolean`；提供时进入受控切换模式 | `undefined`（普通模式） |
| `type` | `button`、`submit`、`reset`，仅对原生按钮生效 | `button` |
| `href` | `string`；普通模式中提供时使用原生链接 | 不提供 |
| `disabled` | `boolean` | `false` |
| `loading` | `boolean`；显示居中指示器 | `false` |

省略 `selected` 是普通按钮，不产生 `aria-pressed` 或切换事件；`selected="false"` 应使用布尔绑定 `:selected="false"`。提供布尔 `selected`（包括 false）即进入切换模式；点击发出 `update:selected`，父级更新后才改变选中外观，不维护另一份内部状态。一般使用 `v-model:selected`；也可绑定固定值并监听更新。原生 `@click` 先执行，调用 `event.preventDefault()` 可取消这次切换。键盘激活交给原生按钮，避免重复触发。

普通模式中，`href` 决定是否渲染 `<a>`，与外观无关。支持空字符串及原生 `target`、`rel`、`download`，不自动添加地址或 `_blank`。切换模式始终使用 `<button>`；同时提供 `selected` 与 `href` 时忽略 `href`，并在开发环境提示。

`disabled` 使用原生按钮禁用；链接则移除 `href`，设置 `role="link"`、`aria-disabled="true"`、`tabindex="-1"`，阻止激活与调用方对应的事件处理。恢复启用时恢复地址和监听。`loading` 只把图标替换为居中指示器，宽高保持不变，设置 `aria-busy="true"`，保留原可访问名称；仍能点击、切换或导航，阻止操作需同时传入 `disabled`。隐藏的图标保持挂载，指示器不参与名称。

| 插槽 | 参数 | 用途 |
| --- | --- | --- |
| 默认 | `{ selected: boolean }` | 普通／未选中图标；没有 selected 插槽时，也用于选中状态 |
| `selected` | `{ selected: boolean }`，值为 true | 已选中图标；省略时回退默认插槽 |

也可在默认插槽中读取状态，让已有图标组件切换图形：

```vue
<MdvIconButton v-model:selected="selected" aria-label="收藏">
  <template #default="{ selected: isSelected }">
    <MdvIcon :icon="isSelected ? favorite : favoriteOutline" />
  </template>
</MdvIconButton>
```

普通按钮建议实心图标；切换按钮建议未选空心、选中实心，以颜色之外的方式表达状态。组件不自动把任意 SVG 改成对应实心图形。SVG 推荐 `currentColor` 与 `focusable="false"`；直接放入的 SVG／图片按尺寸填满图标容器。图标容器始终隐藏于辅助技术并禁止内部聚焦，不要在插槽中放置可交互控件。

**必须提供 `aria-label` 或 `aria-labelledby` 描述动作。** 仅图标或 SVG 的 title 不作为组件名称来源。切换按钮自动设置 `aria-pressed`，名称保持稳定，例如始终为“收藏”；不要随选中状态改成“取消收藏”。loading 不移除名称。缺失名称时开发环境会提示；引用的标签元素是否存在仍由使用方保证。可透传原生 `title`，但它不是 MD3 Tooltip；本组件不内置 Tooltip，后续通过独立组件组合。

| size | 可见高度 | 图标 | narrow 宽 | default 宽 | wide 宽 | square 圆角 | outlined 描边 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `xs` | 32px | 20px | 28px | 32px | 40px | 12px | 1px |
| `s` | 40px | 24px | 32px | 40px | 52px | 12px | 1px |
| `m` | 56px | 24px | 48px | 56px | 72px | 16px | 1px |
| `l` | 96px | 32px | 64px | 96px | 128px | 28px | 2px |
| `xl` | 136px | 40px | 104px | 136px | 184px | 28px | 3px |

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

| variant | 普通 | 切换未选 | 切换已选 |
| --- | --- | --- | --- |
| `filled` | primary／on-primary | surface-container／on-surface-variant | primary／on-primary |
| `tonal` | secondary-container／on-secondary-container | 同普通 | secondary／on-secondary |
| `outlined` | 透明背景，outline-variant 描边，on-surface-variant 图标 | 同普通 | inverse-surface／inverse-on-surface，无描边 |
| `standard` | 透明背景，on-surface-variant 图标 | 同普通 | 透明背景，primary 图标 |

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

| Prop | 类型 | 默认值 |
| --- | --- | --- |
| `icon` | `MdvIconData`；本地 Iconify SVG 数据对象，必填 | 无 |
| `size` | `MdvIconSize`，即 `number \| string` | 独立使用 24px；按钮插槽内跟随容器 |
| `color` | `string`，CSS 颜色 | 继承 `currentColor` |

`icon` 接收导入的数据对象，不接收 `"material-symbols:home"` 等字符串名称。也可使用其他图标集或自有的 Iconify 格式数据，至少包含 SVG `body`，可提供 `width`、`height` 等数据字段。只传入可信的数据，组件不负责清洗 SVG。无效输入保留空的图标盒子，开发环境提示；不会尝试联网补取。

默认图标盒子为 24×24px。数字 `size` 按 px 处理；字符串支持 `1em`、`2rem`、`var(--my-icon-size)` 等 CSS 长度。在 `MdvButton` 前后插槽或 `MdvIconButton` 中省略 `size`，由按钮的官方尺寸规则控制图标。显式传入 `size` 可覆盖容器填充大小，但不会自动扩大按钮或图标容器；自定义时需一起考虑可用空间。

图形默认使用 `currentColor`，跟随文字色、按钮颜色、禁用态和当前主题。`color` 直接使用 CSS 颜色，也支持 `var(--mdv-sys-color-error)`；它不执行种子色计算，也不把 `success` 等名称转换为语义色。需要使用语义色时传入相应 CSS 变量。用户 `style` 优先于 `size` 和 `color`，支持对象、字符串或数组；可用 `class` 覆盖默认样式，尺寸覆盖建议使用 `size` 或 `style`。

推荐以 Material Symbols 的 **Outlined 风格、400 字重**为基线。风格与填充由导入资源决定，例如：

| 风格 | 空心 | 实心 |
| --- | --- | --- |
| Outlined | `favorite-outline` | `favorite` |
| Rounded | `favorite-outline-rounded` | `favorite-rounded` |
| Sharp | `favorite-outline-sharp` | `favorite-sharp` |

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
  <MdvTextField v-model="name" label="姓名" name="name" autocomplete="name" required clearable :maxlength="20" supporting-text="用于公开显示" />
  <MdvTextField v-model="password" label="密码" type="password" autocomplete="new-password" password-toggle />
  <MdvTextField v-model="notes" variant="filled" label="备注" multiline :rows="4" full-width />
  <MdvTextField v-model.number="quantity" label="数量" type="number" min="0" step="1" />
</template>
```

| Prop | 类型／说明 | 默认值 |
| --- | --- | --- |
| `modelValue`／`v-model` | `string \| number` | `''` |
| `modelModifiers` | Vue 自动传入的 `trim`／`number`／`lazy` 标记 | `{}` |
| `variant` | `outlined`、`filled` | `outlined` |
| `type` | `text`、`password`、`email`、`tel`、`url`、`search`、`number`；单行时生效 | `text` |
| `label` | 浮动标签 | `''` |
| `placeholder` | 原生占位提示，避免与未浮动标签重叠 | `''` |
| `supportingText` | 辅助说明 | `''` |
| `error` | 业务错误状态 | `false` |
| `errorText` | 错误状态下优先显示的说明，替换辅助文字 | `''` |
| `prefixText`／`suffixText` | 仅展示的前缀／后缀，不计入输入值 | `''` |
| `multiline` | 改用原生 `textarea` | `false` |
| `rows` | 多行输入的初始行数 | `3` |
| `disabled`／`readonly`／`required` | 对应原生输入属性 | `false` |
| `clearable` | 有内容且可编辑时提供清除操作 | `false` |
| `passwordToggle` | `type="password"` 单行输入提供显隐操作 | `false` |
| `showCount` | 显示当前字数；省略时有合法 `maxlength` 才显示字数／上限 | 不提供 |
| `fullWidth` | 占满父容器可用宽度 | `false` |

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

| 方法 | 原生行为 |
| --- | --- |
| `focus(options?: FocusOptions)` | 聚焦实际控件，支持 preventScroll |
| `blur()` | 移除输入焦点 |
| `select()` | 选中全部文字；仅在原生类型支持时生效 |
| `checkValidity(): boolean` | 检查原生约束，失败触发 invalid |
| `reportValidity(): boolean` | 检查约束并显示浏览器的校验反馈 |
| `setCustomValidity(message: string)` | 设置自定义原生校验；空字符串解除 |

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

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `modelValue`／`v-model` | `boolean \| (string \| number)[]` | `false` |
| `value` | 数组成员与原生表单提交值，`string \| number` | `'on'` |
| `indeterminate`／`v-model:indeterminate` | 半选状态，横线优先于勾显示 | `false` |
| `label` | 可点击的标签文字 | `''` |
| `supportingText` | 标签下方的辅助说明 | `''` |
| `error` | 外部业务错误状态 | `false` |
| `errorText` | 错误状态下优先显示的说明 | `''` |
| `disabled`／`required` | 原生禁用／本项必选约束 | `false` |
| `color` | 主题／语义色或十六进制种子色 | `'primary'` |

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
    <MdvCheckbox v-for="option in options" :key="option" v-model="selected" :value="option" :label="option" />
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

| 方法 | 行为 |
| --- | --- |
| `focus(options?: FocusOptions)` | 聚焦实际输入，支持 preventScroll |
| `blur()` | 移除输入焦点 |
| `checkValidity(): boolean` | 检查原生约束，失败触发 invalid |
| `reportValidity(): boolean` | 检查约束并显示浏览器的校验反馈 |
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

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `modelValue`／`v-model` | `string \| number \| null`；选中项的值 | `null` |
| `value` | 当前选项的值，数字和字符串严格区分 | 必填 |
| `label` | 可点击的标签文字 | `''` |
| `supportingText` | 单独使用时显示的辅助说明 | `''` |
| `error`／`errorText` | 单独使用时的业务错误及说明 | `false`／`''` |
| `disabled`／`required` | 原生禁用／必选约束 | `false` |
| `color` | 主题／语义色或十六进制种子色 | `primary` |

单独使用时可以像原生 radio 一样传入 `name`：

```vue
<MdvRadio v-model="plan" name="plan" value="basic" label="基础版" />
<MdvRadio v-model="plan" name="plan" value="pro" label="专业版" />
```

`id`、`name`、`form`、ARIA、`data-*` 和原生事件透传到实际 `input[type="radio"]`；`class`／`style` 属于组件外层。没有可见标签时，必须使用 `aria-label` 或 `aria-labelledby`。

### MdvRadioGroup 属性

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `modelValue`／`v-model` | `string \| number \| null` | `null` |
| `name` | 传给组内原生 radio 的表单名称 | 未设置 |
| `label` | `legend` 文字 | `''` |
| `supportingText` | 组级辅助说明 | `''` |
| `error`／`errorText` | 组级业务错误及说明 | `false`／`''` |
| `disabled`／`required` | 禁用整组／至少选择一项 | `false` |
| `color` | 组级默认主题／语义色或种子色 | 未设置 |
| `orientation` | `vertical` 或 `horizontal` | `vertical` |

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

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `modelValue`／`v-model` | `boolean`；开启或关闭 | `false` |
| `label` | 可点击的标签文字；默认插槽优先 | `''` |
| `supportingText` | 辅助说明；错误报告后按错误优先级显示 | `''` |
| `error`／`errorText` | 业务错误及说明；与原生 validity 分开 | `false`／`''` |
| `disabled`／`required` | 原生禁用／必选约束 | `false` |
| `color` | 主题／语义色或 `#RGB`／`#RRGGBB` 种子色 | `primary` |
| `labelPosition` | `start` 或 `end` | `end` |
| `value` | 原生表单提交值 | `'on'` |

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
  <MdvSlider v-model="price" variant="range" name="price" label="价格区间" :step="10" stops value-indicator />
</template>
```

### MdvSlider 属性

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `modelValue`／`v-model` | standard／centered 使用 `number`，range 使用 `[number, number]` | standard 从 min 开始；centered 从中心开始；range 为 `[min, max]` |
| `variant` | `standard`／`centered`／`range` | `standard` |
| `min`／`max` | 有限的上下界，max 不小于 min | `0`／`100` |
| `step` | 正数步长，以 min 为起点；支持小数 | `1` |
| `centerValue` | centered 的高亮起点，须位于上下界内 | `0` |
| `stops` | 绘制中间刻度，手柄通过短动画移动到有效档位 | `false` |
| `size` | `xs`／`s`／`m`／`l`／`xl` | `xs` |
| `orientation` | `horizontal`／`vertical` | `horizontal` |
| `valueIndicator` | 连续滑块按压时显示；有刻度时拖动或按住稍久显示；键盘聚焦时立即显示 | `false` |
| `formatValue` | `(value: number) => string`，同时用于提示与 aria-valuetext | 普通数字文字 |
| `label` | 可见标签；默认插槽优先 | `''` |
| `supportingText` | 与原生控件关联的辅助说明 | `''` |
| `disabled` | 禁用交互和表单提交 | `false` |
| `color` | 主题／语义色或 `#RGB`／`#RRGGBB` 种子色 | `primary` |
| `startAriaLabel`／`endAriaLabel` | range 两个手柄的独立无障碍名称 | 从标签与“下限／上限”组合 |

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
      @remove="tags = tags.filter(item => item !== tag)"
    />
  </MdvChipSet>
</template>
```

### MdvChip 属性

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `variant` | `assist`／`filter`／`input`／`suggestion`，表示用途 | `assist` |
| `label` | 标签及默认删除名称的来源；默认插槽优先显示 | `''` |
| `elevated` | Assist、Filter、Suggestion 的抬升外观；Input 忽略此项 | `false` |
| `selected`／`v-model:selected` | Filter／Input 的选中状态 | 未提供时内部从 `false` 开始 |
| `selectable` | 点击主体请求切换选中；Assist／Suggestion 不参与选择 | Filter 为 `true`，Input 为 `false` |
| `removable` | 显示并启用尾部删除；仅 Filter／Input 可用 | Input 为 `true`，Filter 为 `false` |
| `removeOnly` | Input 整颗纸片只执行删除，合为一个焦点目标；须同时允许删除 | `false` |
| `removeLabel` | 删除动作的独立可访问名称 | `删除${label}` |
| `disabled` | 禁用主体和删除操作 | `false` |
| `color` | 七种现有语义色或 `#RGB`／`#RRGGBB` 种子色 | 保留官方默认角色 |
| `value` | `string`／`number`；在 ChipSet 的单多选模式中标识可选择的 Filter | 不提供 |
| `href` | Assist／Suggestion 的原生链接地址 | 不提供 |

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

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `selection` | `none`／`single`／`multiple` | `none` |
| `modelValue`／`v-model` | single 为 `string`／`number`／`null`，multiple 为相应数组 | 未选，显示时按模式解释 |
| `label`／`label` 插槽 | 组名称；插槽优先 | `''` |
| `disabled` | 禁用所有子 Chip 的操作 | `false` |
| `scrollable` | 单行水平滚动；关闭时自动换行 | `false` |

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

  <MdvSegmentedButton
    v-model="details"
    selection="multiple"
    aria-label="显示内容"
    name="details"
  >
    <MdvSegmentedButtonItem value="summary" label="摘要" />
    <MdvSegmentedButtonItem value="image" label="图片" />
    <MdvSegmentedButtonItem value="date" label="日期" />
  </MdvSegmentedButton>
</template>
```

### 组属性与选择规则

| Prop／模型 | 类型／说明 | 默认值 |
| --- | --- | --- |
| `modelValue`／`v-model` | 单选为 `string`／`number`／`null`；多选为 `(string \| number)[]` | `null`，多选按空数组解释 |
| `selection` | `single`／`multiple` | `single` |
| `selectionRequired` | 阻止用户取消最后一项；不自动选择、不校验外部模型 | 单选 `true`，多选 `false` |
| `disabled` | 禁用全部分段 | `false` |
| `fullWidth` | 撑满可用宽度，所有分段等宽 | `false` |
| `density` | `0`／`-1`／`-2`／`-3`，可见高度依次 40／36／32／28px | `0` |
| `showSelectedIcon` | 显示内置勾或自定义选中图标 | `true` |
| `name` | 组内原生字段的提交名称 | 不提供 |
| `form` | 原生外部表单 ID | 不提供 |

单选会替换当前值。显式设置 `:selection-required="false"` 后，再次点击选中项会清空为 `null`。多选每次产生新数组，不修改传入数组；设置 `selection-required` 后可以限制至少保留一项。数字与字符串严格区分，例如 `:value="1"` 和 `value="1"` 是两个不同选项。

`selectionRequired` 是交互约束，不等于 HTML `required`。外部传入空值不会被擅自改写，挂载不发出默认选择事件；需要首屏有选中项时，请初始化模型。切换单多选模式时，也应由业务将模型调整为对应类型。删除选项不会自动清理业务模型。

模型更新通过 `update:modelValue` 请求父级接受；父级拒绝更新时，原生 checked 和可见状态会恢复为当前模型。程序赋值不伪造 input／change 事件。

### 分段属性、插槽与图标

| Prop | 类型／说明 | 默认值 |
| --- | --- | --- |
| `value` | 组内唯一的 `string`／`number` 标识；必需 | 无 |
| `label` | 可见文字，默认插槽优先 | `''` |
| `disabled` | 禁用这一分段 | `false` |

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

| Prop | 类型／说明 | 默认值 |
| --- | --- | --- |
| `variant` | `outlined`／`filled`／`elevated` | `outlined` |
| `title` | 内置标题；header 插槽存在时由插槽接管 | `''` |
| `subtitle` | 内置副标题；header 插槽存在时由插槽接管 | `''` |
| `clickable` | 开启整卡原生按钮操作 | `false` |
| `href` | 提供地址时开启整卡原生链接，优先于 clickable；空字符串也生效 | 不提供 |
| `disabled` | 禁用整卡主操作；静态卡片的子控件由各自 disabled 管理 | `false` |
| `dragged` | 外部控制的拖动视觉 | `false` |

卡片宽高由使用方布局和内容决定，没有尺寸档位或固定媒体比例。默认圆角 12px，文字与操作区域留白 16px；相邻文字区域不重复叠加纵向留白。标题使用 Title Medium，正文及副标题使用 Body Medium。需要其他标题级别或布局时使用插槽和应用样式。

三种外观分别使用 surface／outline-variant、surface-container-highest、surface-container-low。静态卡片不增加整卡 hover 或涟漪；整卡主操作提供 hover、pressed、focus-visible 和涟漪，按压不改变圆角。hover 状态层为 8%，focus／pressed 为 10%；焦点环使用 secondary、3px 厚、外偏移 2px。

Outlined／Filled 常态、聚焦和按压使用 elevation 0，hover 为 1，dragged 为 3；Elevated 对应为 1、2、4。dragged 状态层为 16%。禁用按变体分别处理背景、文字、描边与阴影，不使用整卡 opacity。所有外观跟随既有主题及动态配色，支持 reduced-motion、forced-colors 和 RTL。

### 插槽与组合

| 插槽 | 用途 |
| --- | --- |
| `header` | 接管内置 title／subtitle 区域，可放自定义标题、头像等 |
| `media` | 图片、视频或其他媒体，默认不留内边距、不强制比例 |
| 默认插槽 | 正文，默认留白 16px |
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

| Prop | 类型／说明 | 默认值 |
| --- | --- | --- |
| `orientation` | `horizontal`／`vertical` | `horizontal` |
| `variant` | `full-width`／`inset`／`middle-inset` | `full-width` |
| `decorative` | 是否仅作为视觉装饰 | `true` |

默认厚度 1px，颜色使用 `outline-variant`，线端为直角；浅色、深色和种子色配色跟随现有主题。没有 hover、pressed、选中、禁用或加载状态，也没有内置动画。强制颜色模式下使用系统 `CanvasText` 保持线条可见。

| 缩进 | 水平分割线 | 竖向分割线 |
| --- | --- | --- |
| `full-width` | 两端 0，占满可用宽度 | 上下 0，拉伸至父布局提供的可用高度 |
| `inset` | 起始端 16px，末端 0 | 顶部 16px，底部 0 |
| `middle-inset` | 起始端和末端各 16px | 上下各 16px |

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
