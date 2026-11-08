# 第三方来源与许可

本文件随 MDV 源码和 npm 包提供，记录当前实际使用的第三方令牌、算法、字体、图标和渲染器。

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

## Material Symbols 图标数据

- 来源：https://github.com/google/material-design-icons
- 数据分发：`@iconify-icons/material-symbols`，当前以 2.0.9 为资源基线；https://github.com/iconify/icon-sets
- 版权：Copyright Google LLC
- 许可：Apache License 2.0
- 使用资源：Material Symbols 的本地 SVG 数据，包括 favorite、home、save、search 等预览图形及其填充／风格变体；文本框内置动作使用 close、visibility、visibility-off。
- 使用位置：`src/components/MdvTextField.vue` 的内置动作、`playground/` 的组件预览、组件测试和 `COMPONENTS.md` 示例。

Iconify 分发包提供可单独导入的图标数据，原始图形版权与许可归上游 Google。该包是本仓库的开发依赖；文本框只导入三个固定图形并随组件构建，MDV 不导入或注册整套数据。使用方无需为文本框内置动作安装图标集；自定义图标按自己的静态导入分发，并保留相应许可。

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
