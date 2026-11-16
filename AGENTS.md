# MDV development and collaboration rules

These rules apply throughout the MDV component library repository. See `ROADMAP.md` for current progress, upcoming work, and retained technical decisions; `MAINTENANCE.md` for development, validation, and release procedures; and `COMPONENTS.md` for public APIs and usage guidance.

## Language and encoding

- Continue replying to the user in Chinese.
- Use UTF-8 encoding and LF line endings for all text files.
- Write all new and maintained Markdown (`.md`) files in English, including this file, READMEs, maintenance guides, roadmaps, changelogs, changeset summaries, and third-party notices. Keep future documentation updates in English as well.
- `COMPONENTS.md` may retain its current language. Leave sealed historical material untouched and keep it out of maintained documentation and routine updates.
- Preserve upstream copyright notices and license texts verbatim when translating explanatory prose.

## Project boundaries

- Build a Material Design 3 component library with Vue 3, TypeScript, and Tailwind CSS v4.
- Keep a single package and a flat project structure, with one root `package.json`. Do not introduce a monorepo, `packages/ui`, `apps/playground`, or nested projects.
- Keep library source in `src/`. Use `playground/` only for development, comparison, debugging, and composition checks.
- Build the formal documentation site in a separate repository; do not create a documentation project here.
- Consumers install and configure Tailwind CSS v4 and generate utility classes themselves. The library does not ship a fixed set of precompiled Tailwind utilities.
- Prefix public component names with `Mdv`, such as `MdvButton` and `MdvDialog`.
- Discuss and implement official Material Design 3 components individually. Additional components need a concrete use case recorded in `ROADMAP.md`.

Long-term theme, font, dynamic-color, and dependency decisions belong in `ROADMAP.md`; operational procedures belong in `MAINTENANCE.md`. Source code and actual configuration files define the current APIs and configuration.

## Collaboration workflow

The user requires discussion and confirmation before implementation:

1. Before starting a new component or public capability, discuss the official scope, proposed API, states, accessibility, themes, and validation plan.
2. Do not modify source, configuration, dependencies, tests, or public documentation until the user explicitly authorizes implementation with "start" or an equivalent instruction.
3. Implement only the agreed scope. Discuss new questions that would change the public API before implementing them.
4. After completing a component, update its current status, relevant open work, and validation limits in `ROADMAP.md`, and keep its API and usage guidance in `COMPONENTS.md` accurate. Do not mark work complete without actual validation results.
5. The user runs installation, development servers, tests, builds, packaging, Git commits, pushes, and publishing. Provide clear commands and expected results, then address issues from the user's feedback.

## Directory boundaries

- `src/components/`: public components and necessary component-specific helpers.
- `src/styles/`: theme tokens, fonts, and ordinary component styles.
- `src/index.ts`: the common entry point for public components, types, and capabilities.
- `playground/`: local development examples, outside the library's public API.
- Add `composables/`, `directives/`, `internal/`, `locales/`, or script directories only when a real reuse requirement exists.
- Library source must not import playground code, planning documents, or test-only code.

## Component acceptance criteria

Check dimensions, color roles, shapes, motion, and applicable states against official Material Design 3 material. Cover the following where relevant:

- Default, hover, pressed, focus-visible, selected, disabled, loading, and error states.
- Keyboard operation, focus management, semantic HTML, ARIA, form association, and native attribute forwarding.
- Light and dark modes, custom tokens, dynamic color, long Chinese and English content, narrow containers, and reduced motion.
- Props, events, slots, exposed methods, defaults, and type declarations.
- Playground examples for variants, edge cases, and compositions.
- Meaningful Vitest and Vue Test Utils behavior tests, with real-browser checks for layout, touch, and visual behavior.
- Package exports, Tailwind scanning, build output, and actual package consumption outside this repository.

Do not copy components in advance merely to increase their count. If the official specification differs from an existing implementation, follow the specification and record the decision in `ROADMAP.md`.

## Tools and execution

- Use Node **24.22.1** and pnpm **12.14.0** as the development baseline. Run commands from the repository root.
- Keep the pnpm store in a user-level or global location. Never create `.pnpm-store`, `pnpm-store`, or another pnpm store inside this repository or its subdirectories, and never use options that redirect the store there.
- Do not reinitialize the existing Vue project or add project layers for routine development.
- Read relevant source and configuration before editing. Preserve existing workspace changes unless the user authorizes changing them.
- Prefer `rg` for searches and patches for manual edits. Avoid unrelated formatting or metadata changes.
- Choose type checks, unit tests, read-only lint/format checks, playground checks, library builds, and external package consumption according to the change's risk. Never claim a check passed without an actual result.
- If the system blocks a production-build test, you may stop retrying it. Record the limitation rather than treating the blocked check as passed.

## Roadmap maintenance

Before development, read **Current status**, **Next work**, and the relevant retained decisions in `ROADMAP.md`, then follow the procedures in `MAINTENANCE.md`. After work, update the following as applicable:

- The current stage and next task.
- Actual changes and validation results.
- Unverified behavior, blockers, and known limitations.
- Changes to public APIs, dependencies, official references, or implementation decisions.

`ROADMAP.md` is public and can be committed with the repository, but stays outside the npm `files` list. Keep concise milestones and actual open work rather than appending a running activity log. Put detailed implementation history in commits and pull requests, and released changes in `CHANGELOG.md`.

The user's latest confirmed decisions take precedence over documentation. Resolve any resulting inconsistency during the next relevant documentation update.
