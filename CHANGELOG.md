# 更新记录

## 0.1.0

定版日期：2026-11-15。

### 功能

- Material Design Vue（MDV）：Vue 3、TypeScript 和 Tailwind CSS v4 的 Material Design 3 组件库，当前 npm 包名为 `@mdv-ui/mdv`，采用 MIT 许可；首版此前曾以 `@kksk03/mdv` 发布。
- 36 个官方组件家族的当前支持范围，包含按钮、表单、列表与卡片、导航、浮层、日期／时间选择、Carousel 和 Loading Indicator。具体变体和限制见 [组件覆盖](./README.md#组件覆盖)。
- 浅色／深色／跟随系统、局部主题、语义颜色、排版、形状、阴影和减少动态效果适配。
- 本地 Roboto 字体与 SVG 图标渲染，独立动态配色入口 `@mdv-ui/mdv/dynamic-color`。
- 组合验收页：导航、原生表单提交／重置、嵌套菜单／日期面板／对话框和局部消息。
- ESM、类型声明、主题与普通 CSS 子路径；由使用方通过 Tailwind 生成工具类。

### 支持边界

- 普通 Button 提供操作按钮，独立 toggle 尚未提供；Icon Button 和 Button Group 提供各自的选择语义。
- Segmented Button 与 Navigation Drawer 保留传统 M3 形态；Expressive 项目可选择 Connected Button Group 和 Expanded Navigation Rail。
- 日期范围采用 Modal／Fullscreen；时间选择采用 Modal。
- 本批项目检查、组合验收与安装包的项目外消费已获确认，包含类型／生产构建、Node 导入、代表性 SSR、动态配色及 Windows Chrome 生产预览（浏览器版本未记录）；不据此声明全部组件 hydration 或跨浏览器验收通过。
- Button 按需导入体积对照通过：生产应用 JS 从 650413 字节降至 92034 字节，gzip 从 189891 字节降至 36671 字节，抽查的 Date Picker／Time Picker／Carousel／Loading Indicator 标识已移除。该结果包含 Vue、演示代码与依赖；两种入口的完整 CSS 均为 332891 字节／gzip 53941 字节，不提供按组件 CSS 裁剪。

### 后续版本

修复和兼容优化进入 0.1.x；新增能力按后续次版本规划。公共 API 的破坏性调整同时记录迁移方式。包名已从 `@kksk03/mdv` 迁移为 `@mdv-ui/mdv`，旧包保留用于迁移提示。
