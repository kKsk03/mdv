# Changelog

## 0.1.2

### Patch Changes

- bd500e7: Add Select and Autocomplete components with Expressive and Baseline dropdown styles.

## 0.1.1

### Patch Changes

- 50eb5a0: Fix event timing in Chip, IconButton, and Button tests to prevent intermittent CI failures when Vue skips callbacks for events dispatched in the same millisecond as mounting. Add coverage for removal, event forwarding, and cancellation under that timing condition.

## 0.1.0

Release date: 2026-11-15.

### Features

- Material Design Vue (MDV): a Material Design 3 component library for Vue 3, TypeScript, and Tailwind CSS v4, published as `@mdv-ui/mdv` under the MIT license. The initial release was previously published as `@kksk03/mdv`.
- The agreed scope across 36 official component families, including buttons, forms, lists and cards, navigation, overlays, date and time pickers, Carousel, and Loading Indicator. See [COMPONENTS.md](./COMPONENTS.md) for supported variants and limitations.
- Light, dark, and system modes; local themes; semantic colors; typography; shapes; shadows; and reduced-motion support.
- Local Roboto fonts, SVG icon rendering, and a separate `@mdv-ui/mdv/dynamic-color` entry point.
- Composition examples for navigation, native form submission and reset, nested menus, date panels, dialogs, and local notifications.
- ESM, type declarations, and separate theme and component CSS entry points. Consumers generate utility classes with Tailwind.

### Scope and limitations

- The ordinary Button supports actions; a standalone toggle variant is not provided. Icon Button and Button Group have their own selection semantics.
- Segmented Button and Navigation Drawer retain their classic M3 forms. Expressive applications can use Connected Button Group and Expanded Navigation Rail.
- Date ranges use Modal or Fullscreen layouts; time selection uses Modal.
- Project checks, composition acceptance, and consumption of the packed library in a separate application were confirmed, including types, production builds, Node imports, representative SSR, dynamic color, and a production preview in Chrome on Windows. The browser version was not recorded; this does not establish hydration coverage for every component or acceptance across browsers.
- The Button import comparison passed: production application JavaScript decreased from 650413 to 92034 bytes, and gzip size from 189891 to 36671 bytes. The sampled Date Picker, Time Picker, Carousel, and Loading Indicator markers were removed. These figures include Vue, demo code, and dependencies. Both entry points used the full CSS at 332891 bytes, or 53941 bytes gzipped; CSS is not split by component.

### Future releases

Fixes and compatibility improvements are planned for 0.1.x, with new capabilities planned for later minor releases. Breaking public API changes will include migration instructions. The package has moved from `@kksk03/mdv` to `@mdv-ui/mdv`; the previous package remains for migration guidance.
