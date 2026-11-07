# MDV 组件使用说明

本文记录已实现组件的 API、示例与使用注意事项。使用前请先完成 [样式接入](./README.md#使用方样式入口)。

- [MdvButton 按钮](#mdvbutton)

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
