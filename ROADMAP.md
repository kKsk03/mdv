# Roadmap

Updated: 2026-11-17. Published baseline: **@mdv-ui/mdv 0.1.3**.

MDV has completed its initial component and delivery milestones and is now maintained through versioned releases. This roadmap records current priorities, remaining work, and decisions that future development should preserve. New components and public capabilities are scoped before implementation; candidate work has no assigned release or deadline.

## Current status

| Milestone                           | Status                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Single-package foundation           | Complete: Vue 3, TypeScript, Tailwind CSS v4, playground, library builds, declarations, and package consumption.                                                   |
| Design system                       | Accepted scope complete: light/dark/system and local themes, semantic tokens, typography, shapes, motion, local fonts, icons, and seed-based dynamic color.        |
| Initial official component coverage | Accepted scope across 36 official component families delivered in 0.1.0. Supported variants and limitations remain documented in [COMPONENTS.md](./COMPONENTS.md). |
| Initial integration and delivery    | Form, navigation, and nested-overlay compositions; a real packed-library consumer; and a Button import size comparison were accepted.                              |
| Versioned publishing                | 0.1.0-0.1.3 published; Changesets and npm staged approval remain in use. GitHub Releases are finalized manually after npm publication.                              |
| Select and Autocomplete             | Accepted scope complete and released in 0.1.2, including Expressive/Baseline dropdowns, free-text autocomplete, and remote-search events/loading state.            |

Completion refers to the agreed scope for each component. It does not imply every optional Material variant, browser, device, or assistive technology has been validated. No next component has been selected.

## Next work

### Release process

- [ ] Manually finalize the published `v0.1.3` GitHub Release after this workflow update reaches `main`.
- Finalize Release is workflow-dispatch only. It verifies public npm availability and the tag's package identity before creating a missing Release; it fails before creating Releases when npm has not made a candidate version public, so publish and approve the package before rerunning it.
- Regression coverage for pending npm approval, backfills, existing Releases, tag/package mismatches, manual finalization, and registry failures is provided in `scripts/finalize-release.spec.mjs`; execution remains pending user validation.
- Validate the updated workflow and documentation after implementation; no checks are claimed for this change until run by the maintainer.

### Formal documentation

- [ ] Create the documentation site in a separate repository.
- [ ] Migrate installation, theme and dynamic-color guidance, component APIs, examples, keyboard/form behavior, and SSR limitations.
- [ ] Establish how documentation identifies the package versions it describes.
- [ ] Retire or reduce `COMPONENTS.md` only after its content is fully covered by the published documentation. Update incoming links and the npm file list at that point.

Until that migration is complete, keep `COMPONENTS.md` as the maintained API and usage reference.

### Application feedback

- [ ] Use MDV in the consuming application and turn concrete integration problems into reproducible issues.
- [ ] Prioritize fixes and additional components from those needs, agreeing on API scope and release impact before implementation.

The documentation site is now an active integration surface. The selected final menu-item corner fix and theme-color transitions shipped in 0.1.3. A follow-up fix keeps the Standard Drawer's App Bar background extension synchronized throughout inherited color transitions, including quick theme reversals, and cancels pending frames on cleanup. The documentation layout uses `surface-container-low` for its content background, matching the playground composition; the Scaffold itself keeps that choice with the consumer.

Application feedback takes priority over adding components merely to expand the catalog. Documentation-site work and a new component can be planned independently.

### Validation follow-up

Existing evidence includes component checks and previews, selected SSR/hydration tests, and first-release package consumption with a production preview in Chrome on Windows. That browser version was not recorded.

- [ ] Validate the released 0.1.3 menu corner fix and theme-color transitions in a consuming application; cover light, dark, system, local themes, dynamic colors, and reduced motion.
- [ ] Run the new Drawer/App Bar transition regression in `src/__tests__/MdvAppBarScaffold.spec.ts` and validate the follow-up fix in the playground and a consuming application. The regression covers intermediate colors, reversals, final colors, and frame cleanup; unit execution and package validation remain with the maintainer.
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
