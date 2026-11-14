# 第三方来源与许可

本文件随 MDV 源码和 npm 包提供，记录当前实际使用的第三方令牌、算法、字体、图标和渲染器。

## Material 3 Carousel 规格、关键线与滚动参考

- 官方依据：[Specs](https://m3.material.io/components/carousel/specs)、[Guidelines](https://m3.material.io/components/carousel/guidelines)、[Accessibility](https://m3.material.io/components/carousel/accessibility)。
- 关键线来源：[m3ui-vue _carouselStrategy.ts](https://github.com/SrWither/m3ui-vue/blob/main/src/composables/_carouselStrategy.ts)，TypeScript 移植版权 Copyright (c) 2026 Fadel，MIT；其文件注明部分来自 The Android Open Source Project，Apache License 2.0。
- 上游算法：AndroidX Compose Material3 Carousel 的 Arrangement.kt、KeylineList.kt、Keylines.kt、Strategy.kt 和 KeylineSnapPosition.kt。
- 手势／惯性与弹簧参考：[MCarousel.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MCarousel.vue)，Copyright (c) 2026 Fadel，MIT。
- 使用位置：`src/components/carousel-keylines.ts` 的排列、关键线插值、首尾移位与吸附位置；`carousel-layout.ts` 为四种官方形态统一接入关键线；`MdvCarousel.vue` 与 `carousel-motion.ts` 的连续跟手、轴判断、速度采样、惯性、焦点层级和标签渐显思路。

MDV 增加居中布局、稳定 key 与受控请求、独立焦点、可变宽高比 Uncontained、reduced-motion 的稳定尺寸呈现、SSR／hydration 和资源清理，未引入第三方运行时依赖。186px 首选宽度、205px 默认高度及 400／40 弹簧、4 的惯性系数是参考实现或本库的默认设置，不冒称官网 Carousel 独立令牌。MIT 完整许可见下文“m3ui-vue Tabs 弹簧算法”，Apache License 2.0 完整原文见文末；源文件保留相关版权和来源说明。

## Material 3 Time Picker 规格

- 官方规范：[Specs](https://m3.material.io/components/time-pickers/specs)、[Guidelines](https://m3.material.io/components/time-pickers/guidelines)、[Accessibility](https://m3.material.io/components/time-pickers/accessibility)。
- 使用位置：MdvTimePicker、time-picker-time 与 time-picker.css 的拨盘／输入几何、颜色、小时制及基本交互；time-picker-motion 复用下述 Material Web 普通 Dialog 时序，增加 MDV 的完整内容裁切。

模型、分钟约束、本地化解析、拨盘坐标、Vue 草稿／表单生命周期与 Web slider 键盘由 MDV 自行实现，未复制第三方 Time Picker 源码，未新增运行时依赖。auto 按指针能力、视口和内容空间回退输入是本库的适配决定。24 小时双圈依据 Specs 图示的 00–11 外圈与 12–23 内圈，未采用 Guidelines 正文中与示意图不一致的奇偶分圈表述。

## Material 3 Date Picker 规格与 Web 键盘参考

- 来源：[Specs](https://m3.material.io/components/date-pickers/specs)、[Guidelines](https://m3.material.io/components/date-pickers/guidelines)、[Accessibility](https://m3.material.io/components/date-pickers/accessibility)，Copyright Google LLC。
- Web 日期网格交叉参考：[WAI-ARIA APG Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)。
- 使用位置：`src/styles/date-picker.css`、日期选择器组件及其内部日历的尺寸、颜色角色、状态和键盘操作。

Docked 图示为 360×460dp，Modal 为 360×524dp、28dp 圆角与 6dp elevation；40dp 日期表面和 72×36dp 年份表面置于至少 48dp 的交互目标内。高度随周数、字号与窗口可滚动，图示高度不作为裁切上限。范围中段采用 secondary-container，端点采用 primary；hover 8%，focus／pressed 10%。操作文案与响应阈值属于 MDV 的 API 选择。

输入框与日历图标按 Accessibility 分别可达，聚焦输入不自动打开。官网键盘表中的 Home／End 与 Enter 描述存在缺漏，MDV 结合 APG 实现方向键、周首末、翻月／翻年和 roving Tab 停点。日期运算、文本解析、草稿、表单与 Vue 生命周期由 MDV 自行实现；未复制第三方 Date Picker 源码，没有新增日期运行时依赖。

## Material 3 Split Button 规格与动效参考

- 来源：https://m3.material.io/components/split-button/specs 、Guidelines／Accessibility 及 `TOKEN_TABLE.624e8f2da4007fc8`，官网内容版本 `2026-10-13_06-10-19`。
- 版权：Copyright Google LLC。
- 使用位置：`src/components/MdvSplitButton.vue`、`split-button-motion.ts`、`src/styles/split-button.css` 的五档尺寸、间距、内外角、光学偏移、状态与箭头动效。

五档高度 32／40／56／96／136px；尾表面宽 48／48／56／96／136px；主起始与结束留白分别为 12／16／24／48／64px 和 10／12／24／48／64px。默认内角 4／4／4／8／12px，交互内角 8／12／12／20／20px；展开尾部全圆，箭头偏移归零并向内旋转。Guidelines 明确要求箭头使用 Standard motion scheme，MDV 采用 Standard FastSpatial dampingRatio 0.9／stiffness 1400，沿用既有连续积分与保速反向思路；该方案不使用 Button Group 的 Expressive 参数。

主操作和尾入口的分工参考 [MSplitButton.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MSplitButton.vue)（Copyright (c) 2026 Fadel，MIT，完整许可见下文 m3ui-vue Tabs 弹簧算法一节）。MDV 按官网测量修正参考实现的 XS／S 尾宽、非对称留白、光学校正和交互内角，自行组织原生语义、ref 转交、独立反馈与生命周期；复用 MDV Menu／Floating UI，没有引入第三方自建菜单、路由或新依赖。

## Material 3 Button Group 规格与动效参考

- 来源：https://m3.material.io/components/button-groups/specs 、Overview／Guidelines／Accessibility 及 `TOKEN_TABLE.082d7fd6e058b011`，官网内容版本 `2026-10-13_06-10-19`。
- 版权：Copyright Google LLC。
- 使用位置：`src/styles/button-group.css`、`src/components/button-group-motion.ts` 与两款按钮组组件的尺寸、间距、形状、颜色及键盘规则。

Standard 五档高度采用 32／40／56／96／136px、间距 18／12／8／8／8px，按压增加目标自然宽 15%，邻项以安全内容宽度限制让位；Connected 间距 2px。Connected XS 的测量图和正文均为 4px 内角，令牌却引用 small 的 8px，MDV 采用图文一致的 4px；Square 外角也按图文核对，不把 full token 套到所有方角。

自然宽度、相邻空间分配与连续弹簧的思路参考 [MButtonGroup.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MButtonGroup.vue)、同仓库 `MToggleButton.vue` 和 `src/composables/motion.ts`（Copyright (c) 2026 Fadel，MIT，完整许可见下文 m3ui-vue Tabs 弹簧算法一节）。几何使用当前 MDV 动效体系的 Expressive FastSpatial dampingRatio 0.6／stiffness 800，快速反向保留速度；组的 Standard 变体与 Standard motion scheme 不混为一谈。未沿用参考库的过时尺寸、统一内角、JSON 深比较或 options-only 限制；原生节点、受控选择、表单、焦点和生命周期由 MDV 自行实现，没有引入参考库或新依赖。

## Material 3 FAB／Extended FAB 规格与动效参考

- 来源：https://m3.material.io/components/floating-action-button/specs 、https://m3.material.io/components/extended-fab/specs 以及 Toolbar 配套 FAB 令牌。
- 版权：Copyright Google LLC。
- 使用位置：`src/styles/fab.css`、`src/components/fab.types.ts`、两款 FAB 组件及 Floating Toolbar 的配套布局。

尺寸、图标、间距、形状、颜色与状态层按官网当前内容版本 `2026-10-13_06-10-19` 的两份 TOKEN_TABLE 及测量图核对，旧版 40px Small／Surface 按项目选择保留。Large 图标为 36px，Standard 配套 FAB 为 secondary-container；未照搬参考库在这两处的不同数值。独立 FAB 的层级为默认 3／hover 4，Toolbar 配套为 1→2；CSS 阴影采用贴近官方示例的双层柔光映射。

扩缩、标签淡化与 Toolbar 配套布局的思路参考 [MFab.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MFab.vue)、同仓库 `_MToolbarFab.vue`、`MToolbar.vue` 和 `src/composables/motion.ts`（Copyright (c) 2026 Fadel，MIT，完整许可见下文 m3ui-vue Tabs 弹簧算法一节）。`fab-motion.ts` 的几何采用 FastSpatial dampingRatio 0.6／stiffness 800，透明度采用 FastEffects dampingRatio 1／stiffness 3800；40px 滚动阈值为交互选择，不称为官网 FAB 令牌。MDV 自行组织原生按钮／链接、受控状态、单份插槽测量、焦点、SSR 和生命周期，没有引入参考库、菜单、路由或其它依赖。

## Material 3 Toolbar 规格与令牌

- 来源：https://m3.material.io/components/toolbars/specs 、overview、guidelines、accessibility 的当前 Docked／Floating。
- 版权：Copyright Google LLC。
- 使用位置：`src/styles/toolbar.css` 的尺寸、间距、形状、颜色和 elevation；`src/components/MdvToolbar.vue` 的布局与键盘语义。

官网 Floating Toolbar 的 elevation 令牌解析为 level 3／6dp；该空间层级不直接规定 CSS box-shadow。MDV 根据官方示例采用双层阴影，柔光层为 `0 4px 8px 0`，收去通用 CSS level 3 的 3px 外扩，颜色保持主题 shadow 角色。

收合分组及连续弹簧的思路参考 [MToolbar.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MToolbar.vue) 与同仓库 `src/composables/motion.ts`（Copyright (c) 2026 Fadel，MIT，完整许可见下文 m3ui-vue Tabs 弹簧算法一节）。`toolbar-motion.ts` 使用 Expressive FastSpatial 的 dampingRatio 0.6／stiffness 800，小步积分并保留反转速度；40px 同方向滚动阈值同样为参考交互选择，不声称是官网 Toolbar 独立令牌。MDV 自行组织 Vue 生命周期、受控状态、焦点与滚动监听，不引入参考库或额外依赖。

## Material 3 Search 规格与令牌

- 规格来源：https://m3.material.io/components/search/specs 、overview、guidelines、accessibility，以及 https://m3.material.io/components/app-bars/specs 的 Search app bar。
- 版权：Copyright Google LLC。
- 使用位置：`src/styles/search.css` 的尺寸、形状、颜色角色、状态和排版；`src/components/search-motion.ts` 的 Contained 弹簧参数 damping 0.9／stiffness 1400。

MDV 自行实现 Vue 输入、组合、模态生命周期、定位和动效采样，复用现有 dialog、App Bar、图标和 @floating-ui/dom；未复制 m3ui 的 Search 源码或引入额外 Search 运行时。已只读比较 m3ui 的组件分工，不将其旧版 Docked 形态和尺寸当作当前官网数值。官网 Overview 的默认无阴影与 elevation token 的表面层级分别处理，默认不绘制额外阴影。

## Material Web 设计令牌

- 来源：https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192
- 版权：Copyright 2023 Google LLC
- 许可：Apache License 2.0
- 使用位置：`src/styles/tokens.css`、`src/styles/typography.css`。

MDV 将 v0.192 设计令牌中的默认颜色、排版、圆角和动效数值整理为自己的 CSS 变量与 Tailwind 映射，并增加主题作用域、动态配色、阴影和减少动态效果规则；未将 Material Web 组件纳入运行时依赖。

## Material 3 图标按钮规格与令牌

- 规格来源：https://m3.material.io/components/icon-buttons/specs
- 令牌交叉核对：https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens
- 令牌版权：Copyright 2022 The Android Open Source Project
- 令牌许可：Apache License 2.0
- 使用位置：`src/styles/styles.css` 的图标按钮尺寸、宽度、圆角、颜色角色与状态透明度。

MDV 按现行官方规格整理 CSS 数值并用 AndroidX 的尺寸／颜色令牌核对；未引入 Compose 实现或依赖。按压保持圆角不变是 MDV 的交互选择。

## Material 3 文本框规格与令牌

- 规格来源：https://m3.material.io/components/text-fields/specs
- 令牌与行为交叉核对：https://github.com/material-components/material-web/tree/main/textfield 及其 `tokens/versions/v0_192`、`field` 目录。
- 令牌版权：Copyright 2023 Google LLC
- 令牌许可：Apache License 2.0
- 使用位置：`src/styles/text-field.css` 的标准尺寸、排版、颜色角色、形状和状态数值。

MDV 用 Vue 与原生 input／textarea 实现自己的标签布局、描边缺口、值绑定和表单行为；未引入 Material Web 运行时。聚焦指示线按现行官网的 3dp 令牌实现，不沿用旧版 2dp 数值。

## Material 3 复选框规格、令牌与状态标记

- 规格来源：https://m3.material.io/components/checkbox/specs
- 令牌与动画依据：https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192 及 `checkbox/internal/_checkbox.scss`。
- 版权：Copyright 2022, 2023 Google LLC
- 许可：Apache License 2.0
- 使用位置：`src/styles/checkbox.css` 的尺寸、颜色角色、状态透明度、动效及两段状态标记的几何。

MDV 用 Vue 与原生 checkbox 实现自己的模型、标签、辅助说明、校验和表单生命周期；勾线／横线由 CSS 状态标记表达，尺寸及动画几何依据官方实现整理。未引入 Material Web 运行时或外部图标请求。下文保留 Apache License 2.0 原文。

## Material 3 Slider 规格与令牌

- 规格来源：https://m3.material.io/components/sliders/specs 、https://m3.material.io/components/sliders/guidelines 与 accessibility 页面。
- 默认 XS 令牌交叉核对：https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SliderTokens.kt
- 令牌版权：Copyright 2022 The Android Open Source Project
- 令牌许可：Apache License 2.0
- 使用位置：`src/styles/slider.css` 的五档尺寸、颜色角色、缺口、手柄反馈与禁用状态数值。

MDV 根据现行官方表格与尺寸图整理 CSS 数值，采用自己的 Vue、原生 range 与指针事件实现；未引入 Compose 或其他 Slider 运行时。下文保留 Apache License 2.0 原文。

## Material 3 Chip 规格与令牌

- 规格来源：https://m3.material.io/components/chips/specs 、https://m3.material.io/components/chips/guidelines 与 accessibility 页面。
- 数值依据：官网当前发布的四类 Chip 尺寸图与页面令牌表，交叉核对 Google Material Web 的 chips 目录。
- 版权：Copyright Google LLC
- Google Material Web 许可：Apache License 2.0
- 使用位置：`src/styles/chip.css` 的尺寸、颜色角色、状态透明度、抬升与禁用数值。

MDV 自行实现 Vue 组件、组选择、键盘导航、独立删除操作及焦点恢复；未引入 Material Web 运行时。图形复用下述 Material Symbols 数据，下文保留 Apache License 2.0 原文。

## Material 3 Segmented Button 规格与令牌

- 规格来源：https://m3.material.io/components/segmented-buttons/specs 、https://m3.material.io/components/segmented-buttons/guidelines 与 accessibility 页面。
- 数值依据：官网传统 Segmented Button 尺寸图与 `md.comp.outlined-segmented-button` 令牌表。
- 版权：Copyright Google LLC
- 使用位置：`src/styles/segmented-button.css` 的尺寸、颜色角色、状态透明度、描边、密度与焦点指示器。

MDV 自行实现 Vue 组件、原生 radio／checkbox、组选择、键盘和表单生命周期；没有引入其他组件运行时。内置选中勾使用下述 Material Symbols 数据，遵循 Apache License 2.0。

## Material 3 Card 规格与令牌

- 规格来源：https://m3.material.io/components/cards/specs 、https://m3.material.io/components/cards/guidelines 与 accessibility 页面。
- 数值依据：官网 Elevated、Filled、Outlined Card 的尺寸图及颜色、状态层、elevation 和焦点指示器令牌表。
- 版权：Copyright Google LLC
- 使用位置：`src/styles/card.css` 的颜色角色、圆角、留白、状态透明度、描边与阴影。

MDV 自行实现 Vue 内容插槽、原生按钮／链接主操作、禁用与焦点管理，复用现有主题和涟漪能力；未引入其他 Card 运行时或新依赖。

## Material 3 Divider 规格与令牌

- 规格来源：https://m3.material.io/components/divider/specs 、https://m3.material.io/components/divider/guidelines 与 accessibility 页面。
- 数值依据：官网 Divider 令牌表及 Full-width、Inset、Middle-inset 尺寸图，默认厚度 1dp、outline-variant 色，单端或双端 16dp 缩进。
- 版权：Copyright Google LLC
- 使用位置：`src/styles/divider.css` 的厚度、颜色角色与水平缩进。

MDV 自行实现 Vue 组件、装饰／separator 语义与逻辑方向布局；竖向缩进是沿线条方向映射的 MDV 约定，未引入其他 Divider 运行时或新依赖。

## Material 3 Snackbar 规格与令牌

- 规格来源：https://m3.material.io/components/snackbar/specs 、https://m3.material.io/components/snackbar/guidelines 与 accessibility 页面。
- 数值依据：官网 Snackbar 令牌表、Measurements 与 Configurations 图；双行高度按 Specs 的 68dp 处理。
- 版权：Copyright Google LLC
- 使用位置：`src/styles/snackbar.css` 的颜色角色、圆角、阴影、排版、尺寸和内边距。

MDV 自行实现 Vue 组件、作用域内队列、计时、焦点和模态协调；未引入其他 Snackbar 运行时或新依赖。关闭图标使用下述 Material Symbols 数据。

## Material 3 Bottom Sheet 规格与令牌

- 规格来源：https://m3.material.io/components/bottom-sheets/specs 、https://m3.material.io/components/bottom-sheets/guidelines 与 accessibility 页面。
- 数值依据：Standard／Modal 的容器、手柄、焦点与响应式布局令牌，以及 Guidelines 的初次半屏规则。宽屏顶部留白采用表格的 56dp，记录其与测量图 72 标注的差异。
- 版权：Copyright Google LLC
- 使用位置：`src/styles/bottom-sheet.css` 的颜色角色、形状、阴影、手柄和布局，`src/components/use-bottom-sheet.ts` 的默认高度策略。

MDV 自行实现两款 Vue 组件、尺寸测量、手势、滚动交接及弹簧采样动效，复用既有模态栈；未引入 Sheet 运行时或新依赖。Standard 的 56px peek 默认、正文留白及动效参数属于 MDV 实现选择，不冒称官方强制值。

## Material 3 Side Sheet 规格与令牌

- 规格来源：https://m3.material.io/components/side-sheets/specs 、https://m3.material.io/components/side-sheets/guidelines 与 accessibility 页面。
- 数值依据：Standard／Modal 的容器颜色与 elevation 0／1、256dp 默认宽度与 400dp 最大宽度、分离式 16dp 留白／圆角、标题和焦点令牌，以及内部关闭入口要求。
- 版权：Copyright Google LLC
- 使用位置：`src/styles/side-sheet.css` 的视觉与布局，两款 Side Sheet 的语义和操作结构。

MDV 自行实现两款 Vue 组件、非模态布局占位、模态协调、边缘手势和横向弹簧采样动效。动效参考本地 m3ui 的 spatial／effects 分离思路，并依据 Material 参数实现，未引入其他 Sheet 运行时或依赖。外围分隔线按组件令牌 outline，记录其与颜色图 outline-variant 标注的差异。

## Material 3 Tabs 规格与交互

- 规格来源：https://m3.material.io/components/tabs/specs 、https://m3.material.io/components/tabs/guidelines 与 accessibility 页面。
- Web 语义参考：https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- 数值依据：Primary／Secondary 的尺寸图、颜色／排版／形状／状态令牌，以及滚动布局、图标和徽标测量。
- Material 规格版权：Copyright Google LLC
- 使用位置：`src/styles/tabs.css` 的 48／64px 布局、3／2px 指示线、内容留白和颜色；Tabs 三组件的关联语义与键盘模式。

MDV 自行实现 Vue 三组件、模型、面板生命周期、DOM 测量、滚动和触摸边界。默认逐项 Tab 是 MDV 的交互选择；`tabNavigation="active"` 提供 APG 单入口模式，不把两者混为一种规范。

## m3ui-vue Tabs 弹簧算法

- 来源：https://github.com/SrWither/m3ui-vue/blob/main/src/components/MTabs.vue
- 版权：Copyright (c) 2026 Fadel
- 许可：MIT License
- 使用位置：`src/components/tabs-indicator.ts`。

MDV 改写其独立位置／宽度弹簧和中断时保留速度的实现，沿用 dampingRatio=0.9、stiffness=700，增加小步积分、布局重测和生命周期清理；指示线几何依据上述官方规格独立测量。未引入 m3ui-vue 运行时依赖。

```text
MIT License

Copyright (c) 2026 Fadel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Material 3 Navigation Rail 规格与动效参考

- 官方规格：https://m3.material.io/components/navigation-rail/specs
- 布局／键盘：https://m3.material.io/components/navigation-rail/guidelines 、https://m3.material.io/components/navigation-rail/accessibility
- Material 规格版权：Copyright Google LLC
- 使用位置：`src/styles/navigation-rail.css`，Navigation Rail 三个公开组件及内部 `NavigationRailSurface.vue`。

MDV 独立实现当前 Expressive 的 96px 收起轨、220–360px 展开范围、内容胶囊、徽标位置、状态颜色、Standard 布局与 Modal 生命周期。未沿用早期参考实现中的 80px 默认宽度、文字省略或固定高标签。

动效参考 https://github.com/SrWither/m3ui-vue/blob/main/src/components/MNavigationRail.vue 的弹簧参数与内容衔接思路（Copyright (c) 2026 Fadel，MIT，完整许可见上节），在 `src/components/navigation-rail-motion.ts` 独立实现连续进度、小步积分、中断保留速度及生命周期清理。0.9／700、0.9／1400 是参考实现参数，非官网 Rail 单独列出的运动令牌。未引入参考库运行时或其他新依赖。

Navigation Rail 与 Navigation Bar 的交互胶囊动画另参考同仓库的 [MNavigationBar.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MNavigationBar.vue)：200ms 的背景宽度／颜色过渡。MDV 在 `src/styles/navigation-rail.css` 与 `src/styles/navigation-bar.css` 中将动画独立于内容布局，保持图标、文字、徽标与点击区域稳定，并适用于展开轨及横排底栏。版权与 MIT 许可同上，不将该过渡参数声称为官网规定值。

## Material 3 Navigation Drawer 规格与参考

- 官方规格／布局／无障碍：https://m3.material.io/components/navigation-drawer/specs 、https://m3.material.io/components/navigation-drawer/guidelines 、https://m3.material.io/components/navigation-drawer/accessibility
- 导航 disclosure 语义参考：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
- Material 规格版权：Copyright Google LLC。
- 使用位置：Navigation Drawer 四个公开组件、内部 `NavigationDrawerSurface.vue` 与 `src/styles/navigation-drawer.css`。

MDV 根据旧版 M3 的 Standard／Modal 规格独立实现整行胶囊、文字计数和分组导航。官方 Expressive 已推荐 Expanded Navigation Rail，本组仍按明确选择覆盖旧版 Drawer；不将旧版视觉声明为当前 Expressive Drawer。

布局占位与内容分离、分组及滑动思路参考 [MNavigationDrawer.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MNavigationDrawer.vue) 和 [_MDrawerItemList.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/_MDrawerItemList.vue)（Copyright (c) 2026 Fadel，MIT，完整许可见前节）。沿用 MDV 的 `side-sheet-motion.ts`，增加内部可选的布局变量与跟手遮罩；入场 0.9／700、退出 1／3800、半宽或 400px/s 滑动阈值来自参考实现，不冒称官网独立令牌。未引入参考库或新依赖。

## App Bar 规范与滚动参考

尺寸、排版、形状与颜色依据 [Material Design 3 App Bar](https://m3.material.io/components/app-bars/specs) 当前 Small／Medium flexible／Large flexible。MDV 独立实现单份标题测量、整栏居中、稳定布局占位、滚动目标与生命周期管理。

滚动差值、150ms 静止检测和吸附弹簧参考 [MTopAppBar.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MTopAppBar.vue) 及同仓库的 DefaultEffects（Copyright (c) 2026 Fadel，MIT，完整许可见前节）。`src/components/app-bar-scroll.ts` 使用临界阻尼／刚度 1600 和小步积分，并增加分段隐藏、键盘可见性及清理；这些数值来自参考实现，不声称为官方 App Bar 固定参数。未引入 m3ui-vue 运行时或新增依赖。

连续背景配色另参考该文件对收合比例使用 FastOutLinearIn `cubic-bezier(0.4, 0, 1, 1)` 混合 surface／surface-container 的做法。MDV 独立求解该曲线，并为单行及固定模式提供距离映射；外观按用户要求统一为 default／elevated／bordered，默认无阴影，不把滚动配色与阴影开关绑定。m3ui 原实现的 Small／pinned 布尔配色、elevated／bordered 独立布尔属性不直接照搬。

## Material Symbols 图标数据

- 来源：https://github.com/google/material-design-icons
- 数据分发：`@iconify-icons/material-symbols`，当前以 2.0.9 为资源基线；https://github.com/iconify/icon-sets
- 版权：Copyright Google LLC
- 许可：Apache License 2.0
- 使用资源：Material Symbols 的本地 SVG 数据，包括 favorite、home、save、search 等预览图形及其填充／风格变体；文本框内置动作使用 close、visibility、visibility-off，Chip 使用 check、close，Segmented Button 使用 check，Menu 使用 check、chevron-right、arrow-back，Snackbar 使用 close，Bottom Sheet 使用 unfold-more，Side Sheet 使用 close、arrow-back，Toolbar 使用 more-horiz、chevron-left。
- 使用位置：`src/components/MdvTextField.vue`、`src/components/MdvChip.vue`、`src/components/MdvSegmentedButtonItem.vue`、`src/components/MdvFullscreenDialog.vue`、`src/components/MdvMenuItem.vue`、`src/components/_MdvMenuPanel.vue`、`src/components/MdvSnackbar.vue`、`src/components/MdvBottomSheet.vue`、`src/components/MdvBottomSheetScaffold.vue`、`src/components/MdvSideSheet.vue`、`src/components/MdvSideSheetScaffold.vue`、`src/components/MdvToolbar.vue` 的内置动作、`playground/` 的组件预览、组件测试和 `COMPONENTS.md` 示例。

Iconify 分发包提供可单独导入的图标数据，原始图形版权与许可归上游 Google。该包是本仓库的开发依赖；文本框、Chip、Segmented Button、Dialog、Menu、Snackbar、Bottom Sheet、Side Sheet 与 Toolbar 只导入各自固定图形并随组件构建，MDV 不导入或注册整套数据。使用方无需为内置动作安装图标集；自定义图标按自己的静态导入分发，并保留相应许可。

## Iconify Vue 渲染器

- 软件包：`@iconify/vue`，当前以 5.0.5 为实现基线。
- 来源：https://github.com/iconify/iconify
- 版权：Copyright (c) 2020-PRESENT Vjacheslav Trushkin
- 许可：MIT License
- 使用位置：`src/components/MdvIcon.vue` 使用 `@iconify/vue/offline`，类型来自同一出口。构建将该入口保留为正常运行依赖，不将图标 API 加载器引入 MDV。

```text
MIT License

Copyright (c) 2020-PRESENT Vjacheslav Trushkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Material 3 Progress 规格、令牌与动效时序

- 规格来源：https://m3.material.io/components/progress-indicators/specs
- 令牌与时序核对：https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3 中的 `tokens/ProgressIndicatorTokens.kt`、`tokens/LinearProgressIndicatorTokens.kt`、`tokens/CircularProgressIndicatorTokens.kt`、`ProgressIndicator.kt`、`WavyProgressIndicator.kt` 及相关 internal 绘制文件。
- 版权：Copyright 2022, 2024, 2025 The Android Open Source Project
- 许可：Apache License 2.0
- 使用位置：`src/components/progress-geometry.ts`、`src/components/progress-motion.ts` 与 `src/styles/progress.css` 的标准尺寸、颜色角色、间隙、波长、振幅、缓动和动效时序。

MDV 使用自己的 Vue 与 SVG 几何、动画时钟和资源生命周期实现，未引入 Compose 运行时。线性波浪按官方二次曲线轮廓绘制，圆形波浪通过独立的径向曲线生成；下文保留 Apache License 2.0 原文。

## Material 3 Dialog 规格与动效

- 规格来源：https://m3.material.io/components/dialogs/specs 、https://m3.material.io/components/dialogs/guidelines 与 accessibility 页面。
- 令牌交叉核对：AndroidX Material 3 `tokens/DialogTokens.kt`。
- 动效时序依据：https://github.com/material-components/material-web/blob/main/dialog/internal/animations.ts
- 动效版权：Copyright 2023 Google LLC；AndroidX 令牌版权：Copyright 2022 The Android Open Source Project。
- 许可：Apache License 2.0。
- 使用位置：`src/styles/dialog.css`／`src/styles/fullscreen-dialog.css` 的几何、色彩与排版，以及 `src/components/dialog-motion.ts` 的基本款进入／退出、遮罩与内容分层时序；Date Picker 通过 `use-date-picker-layer.ts` 复用普通款与全屏款动效，Modal 内容裁切与背景展开同步。

MDV 使用 Vue、原生 dialog 与自己的关闭拦截、焦点、滚动锁和生命周期实现；基本款参考官方 Web 时序，全屏纵向过渡为 MDV 的实现选择。未引入 Material Web 或 Compose 运行时；下文保留 Apache License 2.0 原文。

## Material 3 Menu 规格

- 规格来源：https://m3.material.io/components/menus/specs 、https://m3.material.io/components/menus/guidelines 与 accessibility 页面。
- 数值依据：官网 Expressive／Baseline 测量图、Common／Standard 令牌与键盘无障碍说明。
- 版权：Copyright Google LLC。
- 使用位置：`src/styles/menu.css` 的尺寸、颜色角色、圆角、排版、阴影、选择与焦点状态。

MDV 用 Vue、原生 Popover 与独立菜单树实现交互，使用下面的 Floating UI 定位。点击高度采用至少 48px，以协调官网 Common 44dp 令牌与 48dp 测量图／可访问目标的差异。分组间隙的 Web 移植、滚动时退回分隔线、push 子菜单和动效时序属于 MDV 的实现选择；未引入其他 Material 组件运行时。

## Material 3 Tooltip 规格与交互

- Tooltip 规格来源：https://m3.material.io/components/tooltips/specs 、guidelines 与 accessibility 页面；网页交互语义参考 https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/ 。
- 使用位置：`src/styles/tooltip.css` 的普通／富内容形状、颜色角色、排版与留白；`src/components/use-tooltip.ts` 的临时／持久行为。官网建议临时提示离开后保留 1.5 秒；MDV 的桌面关闭采用普通款立即、Rich 触发器 120ms／面板立即的较短默认值，触屏抬手后仍保留 1.5 秒。600ms 出现延迟、淡入／淡出时长及默认宽度上限均为 MDV 实现选择，不作为官方固定令牌。

## Floating UI

- 软件包：`@floating-ui/dom`。
- 来源：https://github.com/floating-ui/floating-ui
- 许可：MIT，Copyright (c) 2021-present Floating UI contributors。
- 使用位置：`src/components/menu-position.ts`、`src/components/tooltip-position.ts`；计算菜单、虚拟右键锚点及 Tooltip 的位置、边缘翻转、位移、可用空间与位置更新。

作为运行时依赖分发，不修改其源码。其原始许可随依赖提供：

```text
MIT License

Copyright (c) 2021-present Floating UI contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Material Color Utilities

- 软件包：`@material/material-color-utilities`，当前以 0.4.0 为实现基线。
- 来源：https://github.com/material-foundation/material-color-utilities
- 软件包许可声明：Copyright 2021 Google LLC；各源码文件保留其对应版权声明。
- 许可：Apache License 2.0
- 使用位置：`src/dynamic-color.ts` 和 `src/components/button-color.ts`；完整主题算法随 `mdv/dynamic-color` 入口构建，Button 与 IconButton 共用 HCT／TonalPalette 生成局部种子色。

`src/styles/tokens.css` 中 success／warning／info 的默认配色由该算法生成，分别使用 #2e7d32、#b26a00 和 #0277bd 种子色，采用 Tonal Spot／2021 primary 色系。它们属于 MDV 的扩展语义角色。

## Roboto

- 软件包：`@fontsource/roboto`，当前以 5.3.0 为资源基线。
- 字体来源：https://github.com/googlefonts/roboto-classic
- 分发来源：https://fontsource.org/fonts/roboto
- 许可：SIL Open Font License 1.1
- 使用位置：`src/styles/fonts.css`；通过依赖引入 400／500 正体。

Roboto 使用下列原始版权和许可声明。MDV 不修改字体文件；消费应用分发字体资源时需保留对应许可。

## Apache License 2.0

下列许可适用于上文注明 Apache License 2.0 的内容。

```text

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   Copyright 2021 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

## Roboto 原始版权与 SIL Open Font License 1.1

```text
Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic) Roboto-Italic[wdth,wght].ttf: Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```
