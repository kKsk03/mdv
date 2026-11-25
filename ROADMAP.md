# Roadmap

Updated: 2026-11-25. Published baseline: **@mdv-ui/mdv 0.1.10**.

MDV has completed its initial component and delivery milestones. The next stage is adoption in a business application, using the published package and prioritizing fixes from reproducible integration feedback. New components and public capabilities still require an agreed scope; deferred candidates have no assigned release or deadline.

## Current status

| Milestone                        | Status                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-package foundation        | Complete: Vue 3, TypeScript, Tailwind CSS v4, playground, library builds, declarations, and package consumption.                                                                                                                      |
| Design system                    | Accepted scope complete: light/dark/system and local themes, semantic tokens, typography, shapes, motion, local fonts, icons, and seed-based dynamic color.                                                                           |
| Component coverage               | The initial release delivered the agreed scope across 36 official component families; Select and Autocomplete followed in 0.1.2. The current package exports 67 public Vue components.                                                |
| Initial integration and delivery | Form, navigation, and nested overlay compositions; a packed-library consumer; and a Button import size comparison were accepted. See [the initial release record](./CHANGELOG.md#010) for scope and limits.                           |
| Versioned publishing             | 0.1.10 is public on [npm](https://www.npmjs.com/package/@mdv-ui/mdv) and has a [GitHub Release](https://github.com/kKsk03/mdv/releases/tag/v0.1.10). Changesets and staged npm approval remain in use.                                |
| Formal documentation             | The separate [documentation site](https://mdv.kksk03.site/) uses the published 0.1.10 package and covers all 67 components in 41 guides per locale (English and Simplified Chinese), with installation help and interactive examples. |

**Release verification:** [MDV CI](https://github.com/kKsk03/mdv/actions/runs/45210569243) passed type checking, unit tests, lint, formatting, library build, and declaration generation on the `v0.1.10` commit. [Finalize Release](https://github.com/kKsk03/mdv/actions/runs/45210994063) succeeded; the resulting Release contains the tagged changelog entry and version comparison. [Documentation CI](https://github.com/kKsk03/mdv-docs/actions/runs/45355948778) passed type checking, unit tests, and a production build with the published package. These checks do not establish browser, device, or assistive technology coverage for a business application.

**Upgrade consideration:** 0.1.10 removed default text and accessible names from component controls. Applications now supply the copy and names they need; native validation remains in place. See the [0.1.10 changelog entry](./CHANGELOG.md#0110) for migration guidance.

Component completion refers to the agreed scope, not every optional Material variant. No next component has been selected.

## Next work

### Application adoption and feedback

- [ ] Pin the published package in the new application and verify one critical workflow in its production build. Cover navigation, form submission and reset, and overlay composition as applicable. Check caller-supplied text and accessible names, native validation, keyboard focus, and narrow layouts in the application's target browsers.
- [ ] Recheck [reported integration issues](https://github.com/kKsk03/mdv-docs/blob/main/ROADMAP.md#open-mdv-integration-feedback) against the installed package: navigation callbacks firing on disabled `MdvNavigationBarItem` links with a custom `RouterLink`, lingering `MdvRadioGroup` error states after a valid selection, and dropped `MdvRadioGroup` root `class` attributes. Recheck the [reported Date Range Picker clipping](https://github.com/kKsk03/mdv-docs/blob/bb13bd9d68df7c232b2f5d3469d9d1a5e6e4ee55/ROADMAP.md#L156) at narrow widths.
- [ ] Prioritize defects that block business flows or impair accessibility. Record reproducible steps and the affected package and browser versions, agree on API and release impact, add regression coverage for library fixes, and verify the released version in the consuming application. Use concrete application needs to prioritize new component proposals.

### Validation follow-up

Earlier evidence includes selected SSR and hydration tests, first-release package consumption in Chrome on Windows, and isolated Chrome fixtures for Menu geometry and Drawer/Rail scrollbar gutters. Further browser and application checks remain open:

- [ ] Verify Menu, Select, and Autocomplete state surfaces in the playground and a consuming app, including Expressive and Baseline variants, groups and corners, loading before results, keyboard focus, ripple alignment, light/dark/local themes, forced colors, and reduced motion.
- [ ] Recheck inline Button wrapping, interaction states, adjacent touch targets, and forced colors. Verify stable Drawer and Rail widths with classic and overlay scrollbars, keyboard scrolling, and standard and modal layouts.
- [ ] Capture frames for [Chromium visited-link painting](https://issues.chromium.org/issues/569257985) during palette and light/dark changes. Check Button links, active Drawer rows, and documentation outline links, including with reduced motion. Verify Drawer and App Bar background synchronization through rapid theme reversals.
- [ ] Record a target browser and device matrix before expanding compatibility claims. Check real touch and screen-reader behavior, especially pickers, Carousel, comboboxes, navigation, and nested overlays. In composed overlays, verify focus restoration, topmost Escape handling, theme inheritance, scroll locking, positioning under scrolling, resizing, zoom and RTL, and cleanup.
- [ ] Extend SSR and hydration validation as applications require it, including stable IDs, request isolation, focus, and edits made before hydration. Measure the consuming build when investigating size, separating JavaScript, full CSS, fonts, and dynamic color.

### Documentation follow-up

- [ ] Complete the [remaining guides](https://github.com/kKsk03/mdv-docs/blob/main/ROADMAP.md#guide-coverage-beyond-component-batches) for styling and scoped themes, dynamic color, and application integration (forms, accessibility, keyboard and IME behavior, overlays, routing, SSR, and bundle size).
- [ ] Define which library releases the documentation describes. The live landing page already shows its installed package version; long-term version policy remains open.
- [ ] Keep [COMPONENTS.md](./COMPONENTS.md) as a maintained API and usage reference until the published site covers its content. Revisit incoming links and the npm file list only after that coverage is in place.

## Deferred candidates

These items require a concrete use case and a separate scope decision. They are not unfinished requirements of the initial release.

| Candidate                                | Decision needed before implementation                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Form helpers                             | Layout and field association versus validation orchestration; integration with existing validation libraries. |
| Table / DataTable                        | Display, sorting, filtering, selection, and whether virtualization is justified.                              |
| Upload                                   | Ownership of file selection, drag-and-drop, transfer, progress, and errors.                                   |
| Pagination                               | Page-state and navigation semantics for the consuming application.                                            |
| Avatar, Skeleton, Empty State            | Repeated application needs and the required visual/semantic scope.                                            |
| Theme persistence and SSR initialization | Storage ownership, app/request isolation, server initialization, and avoiding a theme flash.                  |
| Shared interaction infrastructure        | Actual repeated behavior that benefits from extraction; preserve current semantics and regression coverage.   |

Maps, charts, rich-text/code editors, diagrams, Gantt views, and PDF viewers remain outside the planned core library. Heavy capabilities need an explicit dependency and entry-point assessment.

## Decisions to preserve

### Package and styling

- Keep one package, one root manifest, and one lockfile. `src/` contains the library and `playground/` supports development; neither is a nested project. Formal documentation belongs in a separate repository.
- Use the `Mdv` prefix for public components and export public components/types through `src/index.ts`. Basic usage requires explicit imports, without a mandatory global plugin or Vue Router dependency.
- Consumers compile Tailwind CSS v4. Preserve the order `tailwindcss`, `@mdv-ui/mdv/theme`, then `@mdv-ui/mdv/styles`; the theme entry supplies package-source scanning. The JavaScript entry does not import CSS.
- Ship ESM and declarations, with separate theme, component CSS, and dynamic-color entry points. Published component sources support Tailwind scanning. JavaScript tree-shaking does not imply component-level CSS splitting.
- Treat `package.json`, the lockfile, and CI configuration as the source of truth for current dependencies and toolchain versions. Follow the setup in [MAINTENANCE.md](./MAINTENANCE.md#environment-and-setup).

### Design system and dependencies

- Follow the relevant official Material Design specification for each component. Record classic/Expressive choices individually. m3ui-vue is a reference implementation; preserve attribution for adapted code and algorithms in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
- Keep system tokens under `--mdv-sys-*` with centralized Tailwind mappings. Use `data-mdv-theme="light"`, `"dark"`, or `"system"` on the document or a local container. Success, warning, and info colors are MDV extensions.
- Register semantic color tokens as interpolable colors and transition them for 250ms when a theme changes; reduced-motion settings use the existing near-zero duration tokens.
- Dynamic color uses Material Color Utilities with Tonal Spot, the `2021` specification, the `phone` platform, and standard contrast. The global API remains under `@mdv-ui/mdv/dynamic-color`; it accepts `#RRGGBB` seeds and supports scoped application and cleanup. Generated colors need not equal the seed or the fixed default palette.
- Load Roboto 400/500 locally through the theme entry, with system CJK fallbacks. `MdvIcon` uses local Iconify data and offline SVG rendering; consumers select their icon data. Do not add a mandatory remote font/icon service or bundle a full CJK font or icon collection.
- Add shared helpers and dependencies for demonstrated needs. Existing Floating UI positioning and overlay lifecycle conventions should be reviewed before introducing another mechanism. Preserve local theme inheritance, focus ownership, and resource cleanup.

### Component contracts

- End-user copy belongs to the consuming application. Built-in controls accept optional text and accessible names. Omitting copy leaves the corresponding text or name empty. Consumers can bind localized strings directly. Date and time `locale` controls regional formatting only. Browsers provide native validation messages, and applications supply custom validation copy. Custom constraints remain effective when copy is absent.
- Prefer native semantics and correct native attribute/form forwarding. Controlled models reflect accepted parent values; keep requests, commits, cancellation, and open-state changes distinct.
- Include keyboard, accessible names, appropriate ARIA, Chinese IME behavior, and focus handling in the agreed contract. Keep imports and initial rendering safe for SSR, and avoid mutable state shared between requests.
- Validate applicable light/dark/local themes, constrained layouts, long content, reduced motion, and lifecycle cleanup. Use meaningful behavior tests and real-browser checks for layout, gestures, scrolling, and motion.
- Keep the App Bar Scaffold content background consumer-owned. Select and Autocomplete use their own listbox, not Menu; keep full hit targets for inset Expressive state surfaces and preserve full-row Baseline states.
- Preserve intentional scope boundaries: classic Segmented Button/Navigation Drawer, action-only ordinary Button, Modal/Fullscreen date ranges, and Carousel without autoplay or infinite looping. Select is single-choice; Autocomplete permits free text and delegates remote requests to the application. Discuss any expansion before changing these contracts.

## Releases and maintenance

The public package is `@mdv-ui/mdv`, under the MIT license. Follow [MAINTENANCE.md](./MAINTENANCE.md#releasing-a-version) for development checks, actual tarball consumption, Changesets, staging, npm approval, verification, and Finalize Release.

CI runs on branch pushes and manual dispatches; Release retains the full checks on `main`. Fork PR validation remains a maintainer responsibility. Finalize Release uses the matching tag's changelog and does not overwrite existing Releases or retry automatically.

Follow the [documentation language policy](./AGENTS.md#language-and-encoding), and write changeset summaries and [CHANGELOG.md](./CHANGELOG.md) entries in English. Keep released behavior in the changelog and planned work here. A release target is agreed before choosing a changeset level; version updates are generated by the release PR. A 1.0 milestone will be scoped separately.

Review dependency upgrades, Material specification changes, and recurring integration issues as maintenance work. Include migration instructions for breaking public changes and update third-party notices when needed.

## Keeping this roadmap current

Before development, read **Current status**, **Next work**, and the relevant retained decisions. Agree on a concrete task, its acceptance criteria, and any public API changes before implementation.

After a task, update its status, actual validation evidence, unresolved limits, and the next priority. Preserve accepted results without marking unperformed checks as passed. Keep this file concise: detailed implementation history belongs in commits and pull requests, usage in `COMPONENTS.md`, release history in `CHANGELOG.md`, and operational steps in `MAINTENANCE.md`.
