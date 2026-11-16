# Third-party sources and licenses

This file accompanies the MDV source and npm package and records the third-party tokens, algorithms, fonts, icons, and renderers currently used.

## Material 3 Loading Indicator specifications and motion references

- Official references: [Specs](https://m3.material.io/components/loading-indicator/specs), [Guidelines](https://m3.material.io/components/loading-indicator/guidelines), and [Accessibility](https://m3.material.io/components/loading-indicator/accessibility).
- Shape sampling, spring, and rotation reference: [m3ui-vue MLoadingIndicator.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MLoadingIndicator.vue), Copyright (c) 2026 Fadel, MIT. A local source copy was used for the implementation study.
- Used in: `src/components/loading-indicator-geometry.ts` for the seven analytic shape contours, shared angular sampling, Catmull-Rom to cubic Bezier morphing, and spring/rotation approach. The file retains source and copyright notices. The full MIT license appears below under "m3ui-vue Tabs spring algorithm".

MDV normalizes contours to a shared circular boundary, normalizes each spring segment's endpoint for a continuous cycle, and constrains control points to prevent clipping during rotation or overshoot. The 650ms morph interval, 4666ms overall rotation, 0.6 damping, and 200 stiffness come from the reference implementation; they are not presented as official component motion tokens or an exact port of official vertex data. The component follows the official 48/38 dimensions, Default/Contained colors, and progressbar semantics. MDV implements SSR, pausing, static reduced motion, visibility and KeepAlive lifecycle handling, themes, and attribute forwarding without adding a third-party runtime dependency.

## Material 3 Carousel specifications, keylines, and scrolling references

- Official references: [Specs](https://m3.material.io/components/carousel/specs), [Guidelines](https://m3.material.io/components/carousel/guidelines), and [Accessibility](https://m3.material.io/components/carousel/accessibility).
- Keyline source: [m3ui-vue _carouselStrategy.ts](https://github.com/SrWither/m3ui-vue/blob/main/src/composables/_carouselStrategy.ts). The TypeScript port is Copyright (c) 2026 Fadel, MIT; its file also attributes portions to The Android Open Source Project under the Apache License 2.0.
- Upstream algorithms: Arrangement.kt, KeylineList.kt, Keylines.kt, Strategy.kt, and KeylineSnapPosition.kt from AndroidX Compose Material3 Carousel.
- Gesture, inertia, and spring reference: [MCarousel.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MCarousel.vue), Copyright (c) 2026 Fadel, MIT.
- Used in: `src/components/carousel-keylines.ts` for arrangements, keyline interpolation, edge shifting, and snap positions; `carousel-layout.ts` for applying keylines to the four official configurations; and `MdvCarousel.vue` and `carousel-motion.ts` for continuous dragging, axis detection, velocity sampling, inertia, focus layers, and label fading.

MDV adds centered layouts, stable keys and controlled requests, independent focus, variable aspect ratios for Uncontained, stable dimensions under reduced motion, SSR/hydration, and resource cleanup without adding a third-party runtime dependency. The preferred width of 186px, default height of 205px, spring settings of 400/40, and inertia coefficient of 4 are defaults from the reference implementation or MDV, not official Carousel-specific tokens. The full MIT license appears below under "m3ui-vue Tabs spring algorithm", and the full Apache License 2.0 appears near the end of this file. Source files retain the relevant copyright and attribution notices.

## Material 3 Time Picker specifications

- Official specifications: [Specs](https://m3.material.io/components/time-pickers/specs), [Guidelines](https://m3.material.io/components/time-pickers/guidelines), and [Accessibility](https://m3.material.io/components/time-pickers/accessibility).
- Used in: MdvTimePicker, time-picker-time, and time-picker.css for dial/input geometry, colors, hour formats, and basic interactions. time-picker-motion reuses the standard Material Web Dialog timing described below, with MDV's full-content clipping.

MDV independently implements the model, minute constraints, localized parsing, dial coordinates, Vue draft/form lifecycles, and Web slider keyboard behavior. No third-party Time Picker source was copied and no runtime dependency was added. The auto mode's input fallback based on pointer capabilities, viewport, and available content space is an MDV adaptation decision. The 24-hour double dial follows the Specs illustration, with 00–11 on the outer ring and 12–23 on the inner ring, rather than the inconsistent odd/even ring description in the Guidelines text.

## Material 3 Date Picker specifications and Web keyboard reference

- Sources: [Specs](https://m3.material.io/components/date-pickers/specs), [Guidelines](https://m3.material.io/components/date-pickers/guidelines), and [Accessibility](https://m3.material.io/components/date-pickers/accessibility), Copyright Google LLC.
- Web calendar-grid cross-reference: [WAI-ARIA APG Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/).
- Used in: `src/styles/date-picker.css`, the date picker components, and their internal calendars for dimensions, color roles, states, and keyboard operation.

The Docked illustration measures 360×460dp; Modal measures 360×524dp with 28dp corners and 6dp elevation. The 40dp date surfaces and 72×36dp year surfaces sit inside interaction targets of at least 48dp. Height and scrolling accommodate the number of weeks, text size, and viewport; illustrated heights are not clipping limits. Range interiors use secondary-container and endpoints use primary, with hover at 8% and focus/pressed at 10%. Action labels and responsive thresholds are MDV API choices.

The input and calendar icon are separately reachable as described in Accessibility; focusing the input does not open the picker automatically. The official keyboard table has gaps in its Home/End and Enter descriptions, so MDV also follows APG for arrow keys, week boundaries, month/year navigation, and roving Tab stops. MDV independently implements date arithmetic, text parsing, drafts, forms, and Vue lifecycles. No third-party Date Picker source was copied and no date runtime dependency was added.

## Material 3 Split Button specifications and motion references

- Sources: https://m3.material.io/components/split-button/specs, Guidelines/Accessibility, and `TOKEN_TABLE.624e8f2da4007fc8`, official content version `2026-10-13_06-10-19`.
- Copyright: Copyright Google LLC.
- Used in: `src/components/MdvSplitButton.vue`, `split-button-motion.ts`, and `src/styles/split-button.css` for the five sizes, spacing, inner/outer corners, optical offsets, states, and arrow motion.

The five heights are 32/40/56/96/136px, with trailing surface widths of 48/48/56/96/136px. Main-action start and end padding are 12/16/24/48/64px and 10/12/24/48/64px respectively. Default inner corners are 4/4/4/8/12px, increasing to 8/12/12/20/20px during interaction. The expanded trailing surface becomes fully rounded, the arrow offset returns to zero, and the arrow rotates inward. The Guidelines explicitly require the Standard motion scheme for the arrow. MDV uses Standard FastSpatial dampingRatio 0.9/stiffness 1400 with its existing continuous integration and velocity-preserving reversal approach, rather than Button Group's Expressive parameters.

The separation between the main action and trailing entry follows [MSplitButton.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MSplitButton.vue), Copyright (c) 2026 Fadel, MIT; the full license appears below under "m3ui-vue Tabs spring algorithm". MDV corrects the reference implementation's XS/S trailing widths, asymmetric padding, optical adjustments, and interaction corners against official measurements. It implements native semantics, ref forwarding, independent feedback, and lifecycles, reusing MDV Menu and Floating UI without adding a third-party custom menu, router, or new dependency.

## Material 3 Button Group specifications and motion references

- Sources: https://m3.material.io/components/button-groups/specs, Overview/Guidelines/Accessibility, and `TOKEN_TABLE.082d7fd6e058b011`, official content version `2026-10-13_06-10-19`.
- Copyright: Copyright Google LLC.
- Used in: `src/styles/button-group.css`, `src/components/button-group-motion.ts`, and both button group components for dimensions, spacing, shapes, colors, and keyboard behavior.

Standard uses five heights of 32/40/56/96/136px and gaps of 18/12/8/8/8px. Pressing increases the target's natural width by 15%, with adjacent items yielding space within safe content-width limits. Connected uses a 2px gap. Connected XS measurements and prose both specify 4px inner corners, while the token references the 8px small shape; MDV follows the consistent 4px measurement and prose. Square outer corners are also checked against the measurements and prose rather than applying the full token to every square shape.

Natural widths, adjacent-space allocation, and continuous springs follow [MButtonGroup.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MButtonGroup.vue), `MToggleButton.vue`, and `src/composables/motion.ts` in the same repository, Copyright (c) 2026 Fadel, MIT; the full license appears below under "m3ui-vue Tabs spring algorithm". Geometry uses MDV's Expressive FastSpatial dampingRatio 0.6/stiffness 800 and preserves velocity during rapid reversals. The Standard group variant is distinct from the Standard motion scheme. MDV does not retain the reference library's outdated dimensions, uniform inner corners, JSON deep comparisons, or options-only restriction. Native nodes, controlled selection, forms, focus, and lifecycles are independently implemented without introducing the reference library or a new dependency.

## Material 3 FAB / Extended FAB specifications and motion references

- Sources: https://m3.material.io/components/floating-action-button/specs, https://m3.material.io/components/extended-fab/specs, and the Toolbar's accompanying FAB tokens.
- Copyright: Copyright Google LLC.
- Used in: `src/styles/fab.css`, `src/components/fab.types.ts`, both FAB components, and Floating Toolbar's accompanying layout.

Dimensions, icons, spacing, shapes, colors, and state layers were checked against both TOKEN_TABLE datasets and measurements in official content version `2026-10-13_06-10-19`. The legacy 40px Small/Surface form is retained by project choice. Large icons are 36px, and the Standard accompanying FAB uses secondary-container, rather than the reference library's different values for these two cases. Standalone FAB elevation is 3 by default and 4 on hover; the Toolbar's accompanying FAB uses 1→2. CSS shadows use two soft layers mapped to the official examples.

Expansion, label fading, and the Toolbar's accompanying layout follow [MFab.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MFab.vue), `_MToolbarFab.vue`, `MToolbar.vue`, and `src/composables/motion.ts` in the same repository, Copyright (c) 2026 Fadel, MIT; the full license appears below under "m3ui-vue Tabs spring algorithm". In `fab-motion.ts`, geometry uses FastSpatial dampingRatio 0.6/stiffness 800, while opacity uses FastEffects dampingRatio 1/stiffness 3800. The 40px scroll threshold is an interaction choice, not an official FAB token. MDV implements native buttons/links, controlled state, single-instance slot measurement, focus, SSR, and lifecycles without adding the reference library, menus, routing, or other dependencies.

## Material 3 Toolbar specifications and tokens

- Sources: the current Docked/Floating specifications at https://m3.material.io/components/toolbars/specs, overview, guidelines, and accessibility.
- Copyright: Copyright Google LLC.
- Used in: `src/styles/toolbar.css` for dimensions, spacing, shapes, colors, and elevation; `src/components/MdvToolbar.vue` for layout and keyboard semantics.

The official Floating Toolbar elevation token resolves to level 3/6dp; that spatial level does not directly prescribe a CSS box-shadow. MDV follows official examples with two shadow layers, using `0 4px 8px 0` for the soft layer and removing the generic CSS level 3 shadow's 3px spread while retaining the theme's shadow color role.

Collapsing groups and continuous springs follow [MToolbar.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MToolbar.vue) and `src/composables/motion.ts` in the same repository, Copyright (c) 2026 Fadel, MIT; the full license appears below under "m3ui-vue Tabs spring algorithm". `toolbar-motion.ts` uses Expressive FastSpatial dampingRatio 0.6/stiffness 800, small integration steps, and velocity-preserving reversals. The 40px same-direction scroll threshold is also a reference interaction choice, not an official Toolbar-specific token. MDV implements Vue lifecycles, controlled state, focus, and scroll listeners without introducing the reference library or an additional dependency.

## Material 3 Search specifications and tokens

- Specification sources: https://m3.material.io/components/search/specs, overview, guidelines, and accessibility, plus the Search app bar at https://m3.material.io/components/app-bars/specs.
- Copyright: Copyright Google LLC.
- Used in: `src/styles/search.css` for dimensions, shapes, color roles, states, and typography; `src/components/search-motion.ts` for Contained spring parameters of damping 0.9/stiffness 1400.

MDV independently implements Vue input, composition, modal lifecycles, positioning, and motion sampling, reusing its existing dialog, App Bar, icons, and @floating-ui/dom. It does not copy m3ui's Search source or add a Search runtime. The component responsibilities were compared with m3ui, but its legacy Docked form and dimensions are not treated as current official values. The Overview's default shadow-free appearance is handled separately from the elevation token's surface level; no extra shadow is drawn by default.

## Material Web design tokens

- Source: https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192
- Copyright: Copyright 2023 Google LLC
- License: Apache License 2.0
- Used in: `src/styles/tokens.css` and `src/styles/typography.css`.

MDV adapts the default colors, typography, corner radii, and motion values from the v0.192 design tokens into its own CSS variables and Tailwind mappings, adding theme scopes, dynamic color, shadows, and reduced-motion rules. Material Web components are not runtime dependencies.

The default light `on-primary-container` role is updated to tone 30 (`#4f378b`) from the older tone 10, following the current Material 3 Loading Indicator specification and Material Color Utilities' standard-contrast role. Dynamic schemes are still generated by Material Color Utilities.

## Material 3 Icon Button specifications and tokens

- Specification source: https://m3.material.io/components/icon-buttons/specs
- Token cross-reference: https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens
- Token copyright: Copyright 2022 The Android Open Source Project
- Token license: Apache License 2.0
- Used in: `src/styles/styles.css` for Icon Button dimensions, widths, corner radii, color roles, and state opacity.

MDV derives CSS values from the current official specification and cross-checks AndroidX dimension/color tokens without introducing a Compose implementation or dependency. Keeping corners unchanged while pressed is an MDV interaction choice.

## Material 3 Text Field specifications and tokens

- Specification source: https://m3.material.io/components/text-fields/specs
- Token and behavior cross-reference: https://github.com/material-components/material-web/tree/main/textfield and its `tokens/versions/v0_192` and `field` directories.
- Token copyright: Copyright 2023 Google LLC
- Token license: Apache License 2.0
- Used in: `src/styles/text-field.css` for standard dimensions, typography, color roles, shapes, and state values.

MDV uses Vue and native input/textarea elements for its own label layout, outline notch, value binding, and form behavior without introducing the Material Web runtime. The focus indicator follows the current official 3dp token rather than the older 2dp value.

## Material 3 Checkbox specifications, tokens, and state marks

- Specification source: https://m3.material.io/components/checkbox/specs
- Token and animation references: https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192 and `checkbox/internal/_checkbox.scss`.
- Copyright: Copyright 2022, 2023 Google LLC
- License: Apache License 2.0
- Used in: `src/styles/checkbox.css` for dimensions, color roles, state opacity, motion, and the two-segment state-mark geometry.

MDV uses Vue and native checkboxes for its own model, labels, supporting descriptions, validation, and form lifecycles. CSS state marks render the check and horizontal line, with dimensions and animation geometry derived from the official implementation. No Material Web runtime or external icon requests are introduced. The original Apache License 2.0 text is preserved below.

## Material 3 Slider specifications and tokens

- Specification sources: https://m3.material.io/components/sliders/specs, https://m3.material.io/components/sliders/guidelines, and the accessibility page.
- Default XS token cross-reference: https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SliderTokens.kt
- Token copyright: Copyright 2022 The Android Open Source Project
- Token license: Apache License 2.0
- Used in: `src/styles/slider.css` for the five sizes, color roles, gaps, handle feedback, and disabled-state values.

MDV derives CSS values from the current official tables and measurements and uses its own Vue, native range, and pointer-event implementation. No Compose or other Slider runtime is introduced. The original Apache License 2.0 text is preserved below.

## Material 3 Chip specifications and tokens

- Specification sources: https://m3.material.io/components/chips/specs, https://m3.material.io/components/chips/guidelines, and the accessibility page.
- Value references: the current official measurements and token tables for the four Chip types, cross-checked against Google Material Web's chips directory.
- Copyright: Copyright Google LLC
- Google Material Web license: Apache License 2.0
- Used in: `src/styles/chip.css` for dimensions, color roles, state opacity, elevation, and disabled-state values.

MDV independently implements the Vue components, group selection, keyboard navigation, independent removal actions, and focus restoration without introducing the Material Web runtime. Icons reuse the Material Symbols data described below. The original Apache License 2.0 text is preserved below.

## Material 3 Segmented Button specifications and tokens

- Specification sources: https://m3.material.io/components/segmented-buttons/specs, https://m3.material.io/components/segmented-buttons/guidelines, and the accessibility page.
- Value references: the official classic Segmented Button measurements and `md.comp.outlined-segmented-button` token table.
- Copyright: Copyright Google LLC
- Used in: `src/styles/segmented-button.css` for dimensions, color roles, state opacity, outlines, density, and focus indicators.

MDV independently implements the Vue components, native radio/checkbox inputs, group selection, keyboard behavior, and form lifecycles without introducing another component runtime. Built-in selection checks use the Material Symbols data described below under the Apache License 2.0.

## Material 3 Card specifications and tokens

- Specification sources: https://m3.material.io/components/cards/specs, https://m3.material.io/components/cards/guidelines, and the accessibility page.
- Value references: the official Elevated, Filled, and Outlined Card measurements and token tables for colors, state layers, elevation, and focus indicators.
- Copyright: Copyright Google LLC
- Used in: `src/styles/card.css` for color roles, corner radii, padding, state opacity, outlines, and shadows.

MDV independently implements Vue content slots, native button/link primary actions, disabled behavior, and focus management, reusing its existing theme and ripple capabilities without introducing another Card runtime or a new dependency.

## Material 3 Divider specifications and tokens

- Specification sources: https://m3.material.io/components/divider/specs, https://m3.material.io/components/divider/guidelines, and the accessibility page.
- Value references: the official Divider token table and Full-width, Inset, and Middle-inset measurements, with default thickness of 1dp, outline-variant color, and 16dp insets at one or both ends.
- Copyright: Copyright Google LLC
- Used in: `src/styles/divider.css` for thickness, color roles, and horizontal insets.

MDV independently implements the Vue component, decorative/separator semantics, and logical-direction layout. Mapping vertical insets along the line direction is an MDV convention. No other Divider runtime or new dependency is introduced.

## Material 3 Snackbar specifications and tokens

- Specification sources: https://m3.material.io/components/snackbar/specs, https://m3.material.io/components/snackbar/guidelines, and the accessibility page.
- Value references: the official Snackbar token table, Measurements, and Configurations illustrations. Two-line height follows the Specs value of 68dp.
- Copyright: Copyright Google LLC
- Used in: `src/styles/snackbar.css` for color roles, corner radii, shadows, typography, dimensions, and padding.

MDV independently implements the Vue components, scoped queue, timing, focus, and modal coordination without introducing another Snackbar runtime or a new dependency. The close icon uses the Material Symbols data described below.

## Material 3 Bottom Sheet specifications and tokens

- Specification sources: https://m3.material.io/components/bottom-sheets/specs, https://m3.material.io/components/bottom-sheets/guidelines, and the accessibility page.
- Value references: Standard/Modal container, handle, focus, and responsive-layout tokens, plus the Guidelines' initial half-screen rule. Wide-screen top spacing follows the table's 56dp, noting the difference from the measurement illustration's 72 annotation.
- Copyright: Copyright Google LLC
- Used in: `src/styles/bottom-sheet.css` for color roles, shapes, shadows, handles, and layout; `src/components/use-bottom-sheet.ts` for the default height strategy.

MDV independently implements both Vue components, measurements, gestures, scroll handoff, and sampled spring motion, reusing its existing modal stack without introducing a Sheet runtime or new dependency. Standard's default 56px peek, content spacing, and motion parameters are MDV implementation choices rather than mandatory official values.

## Material 3 Side Sheet specifications and tokens

- Specification sources: https://m3.material.io/components/side-sheets/specs, https://m3.material.io/components/side-sheets/guidelines, and the accessibility page.
- Value references: Standard/Modal container colors and elevation 0/1, default width of 256dp and maximum width of 400dp, 16dp detached spacing/corners, title and focus tokens, and the internal close-action requirement.
- Copyright: Copyright Google LLC
- Used in: `src/styles/side-sheet.css` for appearance and layout, and both Side Sheet components for semantics and action structure.

MDV independently implements both Vue components, non-modal layout reservation, modal coordination, edge gestures, and horizontal sampled spring motion. Motion follows the local m3ui reference's separation of spatial/effects behavior using Material parameters, without introducing another Sheet runtime or dependency. The outer divider follows the component's outline token, noting its difference from the color illustration's outline-variant annotation.

## Material 3 Tabs specifications and interaction

- Specification sources: https://m3.material.io/components/tabs/specs, https://m3.material.io/components/tabs/guidelines, and the accessibility page.
- Web semantics reference: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Value references: Primary/Secondary measurements, color/typography/shape/state tokens, and measurements for scrolling layouts, icons, and badges.
- Material specification copyright: Copyright Google LLC
- Used in: `src/styles/tabs.css` for 48/64px layouts, 3/2px indicators, content spacing, and colors; the three Tabs components for associated semantics and keyboard modes.

MDV independently implements the three Vue components, model, panel lifecycles, DOM measurements, scrolling, and touch boundaries. The default per-item Tab navigation is an MDV interaction choice; `tabNavigation="active"` provides APG's single-entry mode. These are distinct navigation conventions.

## m3ui-vue Tabs spring algorithm

- Source: https://github.com/SrWither/m3ui-vue/blob/main/src/components/MTabs.vue
- Copyright: Copyright (c) 2026 Fadel
- License: MIT License
- Used in: `src/components/tabs-indicator.ts`.

MDV adapts the independent position/width springs and velocity-preserving interruption behavior, retaining dampingRatio=0.9 and stiffness=700 while adding small integration steps, layout remeasurement, and lifecycle cleanup. Indicator geometry is independently measured against the official specification above. No m3ui-vue runtime dependency is introduced.

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

## Material 3 Navigation Rail specifications and motion references

- Official specification: https://m3.material.io/components/navigation-rail/specs
- Layout/keyboard references: https://m3.material.io/components/navigation-rail/guidelines, https://m3.material.io/components/navigation-rail/accessibility
- Material specification copyright: Copyright Google LLC
- Used in: `src/styles/navigation-rail.css`, the three public Navigation Rail components, and the internal `NavigationRailSurface.vue`.

MDV independently implements the current Expressive 96px collapsed rail, 220–360px expanded range, content capsules, badge positions, state colors, Standard layout, and Modal lifecycles. It does not retain the earlier reference implementation's 80px default width, text truncation, or fixed-height labels.

Motion follows the spring parameters and content-transition approach in https://github.com/SrWither/m3ui-vue/blob/main/src/components/MNavigationRail.vue, Copyright (c) 2026 Fadel, MIT; the full license appears in the preceding section. MDV independently implements continuous progress, small integration steps, velocity-preserving interruptions, and lifecycle cleanup in `src/components/navigation-rail-motion.ts`. The 0.9/700 and 0.9/1400 parameters come from the reference implementation, not separately specified official Rail motion tokens. No reference-library runtime or other new dependency is introduced.

The interaction-capsule animation in Navigation Rail and Navigation Bar also follows [MNavigationBar.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MNavigationBar.vue) in the same repository: a 200ms transition of background width/color. In `src/styles/navigation-rail.css` and `src/styles/navigation-bar.css`, MDV separates that animation from content layout, keeping icons, text, badges, and hit areas stable for expanded rails and horizontal bottom bars. Copyright and MIT licensing are as stated above; this transition parameter is not presented as an official requirement.

## Material 3 Navigation Drawer specifications and references

- Official specification/layout/accessibility: https://m3.material.io/components/navigation-drawer/specs, https://m3.material.io/components/navigation-drawer/guidelines, https://m3.material.io/components/navigation-drawer/accessibility
- Navigation disclosure semantics reference: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
- Material specification copyright: Copyright Google LLC.
- Used in: the four public Navigation Drawer components, the internal `NavigationDrawerSurface.vue`, and `src/styles/navigation-drawer.css`.

MDV independently implements full-row capsules, text counts, and grouped navigation from the classic M3 Standard/Modal specification. Official Expressive guidance now recommends Expanded Navigation Rail; these components deliberately cover the legacy Drawer rather than presenting its appearance as a current Expressive Drawer.

Separation of layout reservation and content, grouping, and swipe behavior follow [MNavigationDrawer.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MNavigationDrawer.vue) and [_MDrawerItemList.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/_MDrawerItemList.vue), Copyright (c) 2026 Fadel, MIT; the full license appears in an earlier section. MDV reuses `side-sheet-motion.ts`, adding optional internal layout variables and a gesture-following scrim. Entry parameters of 0.9/700, exit parameters of 1/3800, and the half-width or 400px/s swipe threshold come from the reference implementation rather than official component-specific tokens. No reference library or new dependency is introduced.

## App Bar specifications and scrolling references

Dimensions, typography, shapes, and colors follow the current Small, Medium flexible, and Large flexible [Material Design 3 App Bar](https://m3.material.io/components/app-bars/specs) specifications. MDV independently implements single-instance title measurement, centering across the full bar, stable layout reservation, scroll targets, and lifecycle management.

Scroll deltas, 150ms idle detection, and the snapping spring follow [MTopAppBar.vue](https://github.com/SrWither/m3ui-vue/blob/main/src/components/MTopAppBar.vue) and DefaultEffects in the same repository, Copyright (c) 2026 Fadel, MIT; the full license appears in an earlier section. `src/components/app-bar-scroll.ts` uses critical damping, stiffness 1600, and small integration steps, adding staged hiding, keyboard visibility, and cleanup. These values come from the reference implementation rather than fixed official App Bar parameters. No m3ui-vue runtime or new dependency is introduced.

Continuous background color also follows that file's use of FastOutLinearIn `cubic-bezier(0.4, 0, 1, 1)` to blend surface/surface-container by the collapse ratio. MDV independently solves the curve and provides distance mapping for single-line and fixed modes. Appearance is unified as default/elevated/bordered by user choice, with no shadow by default and scroll-driven color independent of the shadow setting. The original m3ui implementation's boolean Small/pinned coloring and independent elevated/bordered boolean props are not copied directly.

## Material Symbols icon data

- Source: https://github.com/google/material-design-icons
- Data distribution: `@iconify-icons/material-symbols`, with 2.0.9 as the current resource baseline; https://github.com/iconify/icon-sets
- Copyright: Copyright Google LLC
- License: Apache License 2.0
- Resources used: local Material Symbols SVG data, including preview icons such as favorite, home, save, and search and their fill/style variants. Built-in Text Field actions use close, visibility, and visibility-off; Chip uses check and close; Segmented Button uses check; Menu uses check, chevron-right, and arrow-back; Snackbar uses close; Bottom Sheet uses unfold-more; Side Sheet uses close and arrow-back; Toolbar uses more-horiz and chevron-left.
- Used in: built-in actions in `src/components/MdvTextField.vue`, `src/components/MdvChip.vue`, `src/components/MdvSegmentedButtonItem.vue`, `src/components/MdvFullscreenDialog.vue`, `src/components/MdvMenuItem.vue`, `src/components/_MdvMenuPanel.vue`, `src/components/MdvSnackbar.vue`, `src/components/MdvBottomSheet.vue`, `src/components/MdvBottomSheetScaffold.vue`, `src/components/MdvSideSheet.vue`, `src/components/MdvSideSheetScaffold.vue`, and `src/components/MdvToolbar.vue`; component previews in `playground/`; component tests; and examples in `COMPONENTS.md`.

The Iconify distribution provides individually importable icon data; the original artwork's copyright and license belong to upstream Google. This package is a development dependency of the repository. Text Field, Chip, Segmented Button, Dialog, Menu, Snackbar, Bottom Sheet, Side Sheet, and Toolbar import only their fixed icons for inclusion in component builds; MDV does not import or register the full collection. Consumers do not need to install the icon set for built-in actions. Custom icons are distributed through their own static imports with the appropriate license notices.

## Iconify Vue renderer

- Package: `@iconify/vue`, with 5.0.5 as the current implementation baseline.
- Source: https://github.com/iconify/iconify
- Copyright: Copyright (c) 2020-PRESENT Vjacheslav Trushkin
- License: MIT License
- Used in: `src/components/MdvIcon.vue` uses `@iconify/vue/offline`, with types from the same entry point. The build keeps this entry as a normal runtime dependency without bringing the icon API loader into MDV.

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

## Material 3 Progress specifications, tokens, and motion timing

- Specification source: https://m3.material.io/components/progress-indicators/specs
- Token and timing cross-reference: `tokens/ProgressIndicatorTokens.kt`, `tokens/LinearProgressIndicatorTokens.kt`, `tokens/CircularProgressIndicatorTokens.kt`, `ProgressIndicator.kt`, `WavyProgressIndicator.kt`, and related internal drawing files at https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3.
- Copyright: Copyright 2022, 2024, 2025 The Android Open Source Project
- License: Apache License 2.0
- Used in: `src/components/progress-geometry.ts`, `src/components/progress-motion.ts`, and `src/styles/progress.css` for standard dimensions, color roles, gaps, wavelengths, amplitudes, easing, and motion timing.

MDV uses its own Vue and SVG geometry, animation clock, and resource lifecycles without introducing the Compose runtime. Linear waves follow the official quadratic contour, while circular waves use an independent radial curve. The original Apache License 2.0 text is preserved below.

## Material 3 Dialog specifications and motion

- Specification sources: https://m3.material.io/components/dialogs/specs, https://m3.material.io/components/dialogs/guidelines, and the accessibility page.
- Token cross-reference: AndroidX Material 3 `tokens/DialogTokens.kt`.
- Motion timing source: https://github.com/material-components/material-web/blob/main/dialog/internal/animations.ts
- Motion copyright: Copyright 2023 Google LLC; AndroidX token copyright: Copyright 2022 The Android Open Source Project.
- License: Apache License 2.0.
- Used in: `src/styles/dialog.css` and `src/styles/fullscreen-dialog.css` for geometry, colors, and typography; `src/components/dialog-motion.ts` for standard enter/exit motion and layered scrim/content timing. Date Picker reuses the standard and fullscreen motion through `use-date-picker-layer.ts`, synchronizing Modal content clipping with background expansion.

MDV uses Vue, native dialog elements, and its own close interception, focus, scroll locks, and lifecycles. The standard form follows official Web timing; the fullscreen vertical transition is an MDV implementation choice. No Material Web or Compose runtime is introduced. The original Apache License 2.0 text is preserved below.

## Material 3 Menu specifications

- Specification sources: https://m3.material.io/components/menus/specs, https://m3.material.io/components/menus/guidelines, and the accessibility page.
- Value references: official Expressive/Baseline measurements, Common/Standard tokens, and keyboard accessibility guidance.
- Copyright: Copyright Google LLC.
- Used in: `src/styles/menu.css` for dimensions, color roles, corner radii, typography, shadows, selection, and focus states.

MDV implements interaction with Vue, native Popover, and an independent menu tree, using Floating UI for positioning as described below. Hit targets are at least 48px high to reconcile the official Common 44dp token with the 48dp measurements and accessible targets. The Web adaptation of group gaps, fallback to dividers while scrolling, push submenus, and motion timing are MDV implementation choices. No other Material component runtime is introduced.

## Material 3 Tooltip specifications and interaction

- Tooltip specification sources: https://m3.material.io/components/tooltips/specs, guidelines, and the accessibility page. Web interaction semantics reference: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/.
- Used in: `src/styles/tooltip.css` for plain/rich shapes, color roles, typography, and spacing; `src/components/use-tooltip.ts` for transient/persistent behavior. Official guidance recommends retaining transient tooltips for 1.5 seconds after leaving. MDV uses shorter desktop dismissal defaults: immediate for plain tooltips, 120ms for Rich triggers, and immediate for Rich panels, while retaining the tooltip for 1.5 seconds after touch release. The 600ms show delay, fade durations, and default maximum widths are MDV implementation choices rather than fixed official tokens.

## Floating UI

- Package: `@floating-ui/dom`.
- Source: https://github.com/floating-ui/floating-ui
- License: MIT, Copyright (c) 2021-present Floating UI contributors.
- Used in: `src/components/menu-position.ts` and `src/components/tooltip-position.ts` for menu, virtual context-menu anchor, and Tooltip positions, edge flipping, shifting, available space, and position updates.

Distributed as a runtime dependency without source modifications. Its original license accompanies the dependency:

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

- Package: `@material/material-color-utilities`, with 0.4.0 as the current implementation baseline.
- Source: https://github.com/material-foundation/material-color-utilities
- Package license notice: Copyright 2021 Google LLC. Individual source files retain their corresponding copyright notices.
- License: Apache License 2.0
- Used in: `src/dynamic-color.ts` and `src/components/button-color.ts`. The complete theme algorithm is built through the `@mdv-ui/mdv/dynamic-color` entry point; Button and IconButton share HCT/TonalPalette for local seed colors.

The default success/warning/info colors in `src/styles/tokens.css` are generated by this algorithm from seeds #2e7d32, #b26a00, and #0277bd respectively, using Tonal Spot/2021 primary roles. These are MDV's extended semantic roles.

## Roboto

- Package: `@fontsource/roboto`, with 5.3.0 as the current resource baseline.
- Font source: https://github.com/googlefonts/roboto-classic
- Distribution source: https://fontsource.org/fonts/roboto
- License: SIL Open Font License 1.1
- Used in: `src/styles/fonts.css`, importing upright weights 400/500 through the dependency.

Roboto uses the original copyright and license notices below. MDV does not modify the font files; consuming applications must retain the corresponding license when distributing font resources.

## Apache License 2.0

The following license applies to the material identified above as Apache License 2.0.

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

## Roboto original copyright and SIL Open Font License 1.1

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
