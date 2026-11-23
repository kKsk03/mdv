# Roadmap

Updated: 2026-11-23. Published baseline: **@mdv-ui/mdv 0.1.7**.

MDV has completed its initial component and delivery milestones and is now maintained through versioned releases. This roadmap records current priorities, remaining work, and decisions that future development should preserve. New components and public capabilities are scoped before implementation; candidate work has no assigned release or deadline.

## Current status

| Milestone                           | Status                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Single-package foundation           | Complete: Vue 3, TypeScript, Tailwind CSS v4, playground, library builds, declarations, and package consumption.                                                   |
| Design system                       | Accepted scope complete: light/dark/system and local themes, semantic tokens, typography, shapes, motion, local fonts, icons, and seed-based dynamic color.        |
| Initial official component coverage | Accepted scope across 36 official component families delivered in 0.1.0. Supported variants and limitations remain documented in [COMPONENTS.md](./COMPONENTS.md). |
| Initial integration and delivery    | Form, navigation, and nested-overlay compositions; a real packed-library consumer; and a Button import size comparison were accepted.                              |
| Versioned publishing                | 0.1.7 is public on npm and has a GitHub Release. Changesets and staged npm approval remain in use.                                                                 |
| Select and Autocomplete             | Accepted scope complete and released in 0.1.2, including Expressive/Baseline dropdowns, free-text autocomplete, and remote-search events/loading state.            |

Completion refers to the agreed scope for each component. It does not imply every optional Material variant, browser, device, or assistive technology has been validated. No next component has been selected.

## Next work

### Release process

- [ ] Verify that the next public version's GitHub Release shows its tagged changelog entry and version comparison. Existing Releases are not overwritten.
- Finalize Release still runs once after a successful Release workflow on `main` and supports manual runs without automatic retries. It checks npm availability and tag/package identity, then uses `CHANGELOG.md` from the matching tag as the Release body instead of GitHub's generated pull request list.
- CI uses repository branch pushes and manual runs, avoiding approval-gated pull-request runs for Changesets automation. Every merge to `main` and the Release workflow retain full checks; fork PR validation remains a maintainer responsibility.
- `scripts/finalize-release.spec.mjs` covers tagged notes, comparison links, missing notes, pending npm approval, existing Releases, and manual finalization. Local YAML/JavaScript syntax checks and a dry run with the v0.1.6 changelog passed; the maintainer-run suite and live workflow verification remain pending.

### Formal documentation

- [ ] Create the documentation site in a separate repository.
- [ ] Migrate installation, theme and dynamic-color guidance, component APIs, examples, keyboard/form behavior, and SSR limitations.
- [ ] Establish how documentation identifies the package versions it describes.
- [ ] Retire or reduce `COMPONENTS.md` only after its content is fully covered by the published documentation. Update incoming links and the npm file list at that point.

Until that migration is complete, keep `COMPONENTS.md` as the maintained API and usage reference.

### Application feedback

- [ ] After the Drawer foreground fix is published, update the documentation site and visually verify active Drawer and outline links during palette switches in light and dark modes. Establish visited links first; check default/dynamic palettes, standard/modal drawers, reduced motion, and captured painted frames in Chromium.
- [ ] Use MDV in the consuming application and turn concrete integration problems into reproducible issues.
- [ ] Prioritize fixes and additional components from those needs, agreeing on API scope and release impact before implementation.

The documentation site is now an active integration surface. The selected final menu-item corner fix and theme-color transitions shipped in 0.1.3. The 0.1.4 follow-up keeps the Standard Drawer's App Bar background extension synchronized throughout inherited color transitions, including quick theme reversals, and cancels pending frames on cleanup. The documentation layout uses `surface-container-low` for its content background, matching the playground composition; the Scaffold itself keeps that choice with the consumer.

The unreleased Button link correction adds a default underline and inline text sizing, removes button padding and minimum dimensions, and keeps disabled links transparent. Inline links use their text bounds on touch devices so expanded button targets do not cover adjacent prose or links. Forced-color mode uses the system link color without adding a button border. The Button playground now includes Chinese and English agreement compositions in local light/dark themes, disabled links, and narrow text. Native link semantics and activation remain governed by `href`.

Read-only validation passed for the link correction: Prettier on the changed CSS and playground files, ESLint on the playground file, and `git diff --check`. Runtime tests, browser checks, and builds remain pending under the maintainer-run workflow.

Button palette transitions in 0.1.6 route paint colors through registered, non-animated component properties to address [Chromium issue 569257985](https://issues.chromium.org/issues/569257985) on visited links. Theme token transitions and `href` behavior are unchanged. In-memory Tailwind and Lightning CSS checks passed; visual validation remains open.

Navigation Drawer row foregrounds now use a registered paint alias, including active links. The alias follows the existing theme-token transitions without passing the animation flag directly to visited-link text. A focused source regression covers the alias contract; browser verification during palette changes remains pending.

The shared Drawer and Rail item viewports now reserve a stable gutter for classic scrollbars. In headless Chrome 157 on Windows, an isolated CSS layout probe found a 10px width change before the fix and none after it in standard and modal surfaces, LTR and RTL, including both Rail widths. Native vertical scrolling remained available when content overflowed. Tailwind and Lightning CSS preserved both declarations in an in-memory check.

Unselected Menu edge rows now follow the radius and insets of their painted surface: the whole panel in standard and scrolling layouts, or the individual group in the separated layout. Expressive selected corners and Baseline row shapes are unchanged. An isolated Vue fixture in Chrome 157 on Windows reproduced and verified the font-size hover and line-spacing submenu fixes, including the keyboard focus outline. It also checked separated RTL groups, scroll fallback, headings, push navigation, and dynamic edges with Tailwind and Lightning CSS output.

Expressive Menu hover, pressed, and selected backgrounds now render on a surface inset 2px within the existing 48px item target; the menu's existing 2px viewport padding keeps those states 4px inside the shell. The item hit target and keyboard outline remain full-size, and Baseline surfaces stay full-row. An in-memory Vue/Tailwind/Lightning CSS fixture and Chrome 157 on Windows verified selected and hovered rows, submenu keyboard focus, 48px targets, the 44px state surface, grouped padding, and Baseline geometry. Ripple coordinates now use the inset surface and have a focused unit regression. Full project tests/build and consuming-app theme review remain maintainer follow-up.

Select and Autocomplete share a custom listbox rather than composing MdvMenu. Their expressive option hit targets now stay full-size while selected, hover, pressed, and ripple surfaces inset 2px inside each row, matching the Menu inset while preserving the existing 2px viewport gutter. Baseline options retain full-row selected surfaces. MdvFabMenu's baseline composition already inherits MdvMenu; its expressive action pills, date/time picker grids, and search-result lists are separate interaction designs and were not changed. Focused regression coverage was added for ripple coordinates and status-before-options state; browser verification of option corners and state insets remains pending.

Application feedback takes priority over adding components merely to expand the catalog. Documentation-site work and a new component can be planned independently.

### Validation follow-up

Existing evidence includes component checks and previews, selected SSR/hydration tests, and first-release package consumption with a production preview in Chrome on Windows. That browser version was not recorded.

- [ ] Validate Menu and Select/Autocomplete inset state surfaces, edge and selected corners in the playground and a consuming application. Check Menu variants and grouped layouts, Select/Autocomplete expressive and Baseline appearances, loading-before-results, keyboard focus, ripple alignment, light/dark/local themes, forced colors, and reduced motion. Project tests and production builds remain maintainer-run.
- [ ] Run the focused Select/Autocomplete and Menu regressions, then visually verify the inset surfaces in a browser before release.
- [ ] Run the new Drawer/App Bar transition regression in `src/__tests__/MdvAppBarScaffold.spec.ts` and validate the follow-up fix in the playground and a consuming application. The regression covers intermediate colors, reversals, final colors, and frame cleanup; unit execution and package validation remain with the maintainer.
- [ ] Validate the unreleased inline Button link styling in the playground and a consuming application: default underline, text alignment and wrapping, hover/pressed/focus-visible, disabled/loading, light/dark themes, and touch targets. Button behavior/SSR tests, browser review, and package builds remain pending maintainer execution.
- [ ] Check visited filled and outlined Button links, Navigation Drawer active links, and docs outline links in an affected Chromium build. Inspect painted foregrounds during preset switches, a return to the default palette, and light/dark changes. Use visual frames rather than computed styles for visited colors, and repeat with reduced motion.
- [ ] Verify stable navigation list widths in the running playground: toggle the nested Drawer group and vary the Rail preview height without changing its expanded state. Check keyboard scrolling, overlay scrollbars, and both modal components, then verify the published fix in the documentation site.
- [ ] Define a supported browser/device matrix and record actual versions and results before expanding compatibility claims.
- [ ] Check real touch and screen-reader interactions, especially pickers, Carousel, comboboxes, navigation, and nested overlays.
- [ ] Extend targeted SSR/hydration coverage as consuming applications require it, including stable IDs, request isolation, focus, and edits made before hydration.
- [ ] Measure current consumer output when investigating size or performance, distinguishing JavaScript, full CSS, fonts, and dynamic-color costs.

For overlay follow-up, retain the existing accepted compositions as the baseline and target gaps in focus restoration, topmost Escape handling, theme inheritance, nested scroll locks, positioning under scroll/resize/zoom/RTL, and cleanup on interruption or unmount. These are verification areas, not a claim that the accepted components lack those behaviors.

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

- Prefer native semantics and correct native attribute/form forwarding. Controlled models reflect accepted parent values; keep requests, commits, cancellation, and open-state changes distinct.
- Include keyboard, accessible names, appropriate ARIA, Chinese IME behavior, and focus handling in the agreed contract. Keep imports and initial rendering safe for SSR, and avoid mutable state shared between requests.
- Validate applicable light/dark/local themes, constrained layouts, long content, reduced motion, and lifecycle cleanup. Use meaningful behavior tests and real-browser checks for layout, gestures, scrolling, and motion.
- Preserve intentional scope boundaries: classic Segmented Button/Navigation Drawer, action-only ordinary Button, Modal/Fullscreen date ranges, and Carousel without autoplay or infinite looping. Select is single-choice; Autocomplete permits free text and delegates remote requests to the application. Discuss any expansion before changing these contracts.

## Releases and maintenance

The public package is `@mdv-ui/mdv`, under the MIT license. Follow [MAINTENANCE.md](./MAINTENANCE.md#releasing-a-version) for development checks, actual tarball consumption, Changesets, staging, npm approval, verification, and Finalize Release.

Follow the [documentation language policy](./AGENTS.md#language-and-encoding), and write changeset summaries and [CHANGELOG.md](./CHANGELOG.md) entries in English. Keep released behavior in the changelog and planned work here. A release target is agreed before choosing a changeset level; version updates are generated by the release PR. A 1.0 milestone will be scoped separately.

Review dependency upgrades, Material specification changes, and recurring integration issues as maintenance work. Include migration instructions for breaking public changes and update third-party notices when needed.

## Keeping this roadmap current

Before development, read **Current status**, **Next work**, and the relevant retained decisions. Agree on a concrete task, its acceptance criteria, and any public API changes before implementation.

After a task, update its status, actual validation evidence, unresolved limits, and the next priority. Preserve accepted results without marking unperformed checks as passed. Keep this file concise: detailed implementation history belongs in commits and pull requests, usage in `COMPONENTS.md`, release history in `CHANGELOG.md`, and operational steps in `MAINTENANCE.md`.
