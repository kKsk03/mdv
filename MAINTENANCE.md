# Development and maintenance

This guide covers development, validation, and releases for `@mdv-ui/mdv`. For installation in an application, see [Getting Started](./README.md#getting-started). Component APIs and usage examples are documented in [COMPONENTS.md](./COMPONENTS.md). Current priorities and retained architectural decisions are tracked in [ROADMAP.md](./ROADMAP.md).

Run commands from the repository root unless a step explicitly refers to a separate application.

## Environment and setup

Use the same toolchain as CI:

- Node.js **24.22.1**.
- pnpm **12.14.0**, as declared in `package.json`.
- Git and a modern browser for playground checks.

Keep the pnpm store in its normal user-level or global location. Do not create a store inside this repository.

```sh
git clone https://github.com/kKsk03/mdv.git
cd mdv
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. The playground includes individual component pages, theme controls, and composition examples for forms, navigation, and nested overlays.

## Repository structure

MDV is a single package. The playground is part of the development environment.

| Path                           | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `src/components/`              | Public Vue components, their types, and related internal helpers |
| `src/styles/`                  | Theme tokens, typography, fonts, and component CSS               |
| `src/index.ts`                 | Public component and type exports                                |
| `src/dynamic-color.ts`         | Separate dynamic color entry point                               |
| `src/__tests__/`               | Behavior, motion, SSR, and hydration tests                       |
| `playground/`                  | Development previews and composition checks                      |
| `COMPONENTS.md`                | Public APIs, examples, interactions, and limitations             |
| `ROADMAP.md`                   | Current milestones, open work, and retained decisions            |
| `.changeset/`                  | Pending release notes and versioning configuration               |
| `scripts/stage-publish.mjs`    | npm staging integration for the Release workflow                 |
| `scripts/finalize-release.mjs` | Create missing GitHub Releases for published npm versions        |
| `.github/workflows/`           | CI, release PRs, npm staging, and GitHub Releases                |
| `dist/`                        | Generated JavaScript and declarations; ignored by Git            |

Library source must not import playground or test code. Keep documentation-site work in a separate repository.

## Developing a component or public API

1. Agree on the scope before implementation. Review the relevant [Material Design 3 specification](https://m3.material.io/components), supported variants, value semantics, and intended use cases. Record any deliberate differences from the specification.
2. Define props, events, slots, exposed methods, defaults, controlled state, and form behavior. Include keyboard interaction, focus management, ARIA semantics, and SSR behavior where applicable.
3. Implement the agreed scope with TypeScript and the `Mdv` component prefix. Reuse existing theme and interaction primitives when they fit; add shared infrastructure when there is an actual reuse requirement.
4. Add a playground page or extend an existing example. Include variants, state changes, long content, constrained layouts, and relevant compositions.
5. Add meaningful behavior or regression tests. Use a real browser for layout, pointer interaction, scrolling, clipping, stacking, and animation.
6. Export the public components and types through `src/index.ts`. Add necessary component styles to `src/styles/styles.css`, and update [COMPONENTS.md](./COMPONENTS.md) with examples, defaults, events, and limitations.
7. Run the checks below and review the playground. Record actual results and unresolved limitations before accepting the component, then update the relevant status and next work in [ROADMAP.md](./ROADMAP.md).
8. Add a changeset when the change should ship in a package release. Documentation-only or test-only maintenance can be committed without a new changeset when it does not require a release.

### Styling and theme conventions

Consumers compile Tailwind CSS v4 themselves. Preserve the three imports shown in the README:

```css
@import 'tailwindcss';
@import '@mdv-ui/mdv/theme';
@import '@mdv-ui/mdv/styles';
```

The theme entry provides `--mdv-sys-*` variables, Tailwind mappings, fonts, and `@source '../components'` so Tailwind can scan the installed package. Keep the published source paths and that relative scan path aligned. Use complete utility names that Tailwind can discover.

The JavaScript entry does not import CSS. Keep the ordinary component CSS in the styles entry and the full dynamic color API in its separate entry. Preserve existing CSS import behavior and public export paths when reorganizing files.

Theme modes use `data-mdv-theme="light"`, `"dark"`, or `"system"` on the document or a local container. Validate local theme inheritance, paired foreground/background roles, and reduced motion when changing styles. Roboto 400/500 is supplied through the theme entry; Chinese text uses the configured system fallback stack.

## Checks before committing

```sh
pnpm type-check
pnpm test:unit
pnpm lint:check
pnpm format:check
pnpm build
```

| Command             | What it does                                                               |
| ------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`          | Starts the Vite playground                                                 |
| `pnpm type-check`   | Checks Vue and TypeScript sources                                          |
| `pnpm test:unit`    | Runs all Vitest tests once                                                 |
| `pnpm test:watch`   | Runs Vitest in watch mode                                                  |
| `pnpm lint:check`   | Runs Oxlint and ESLint without applying fixes                              |
| `pnpm format:check` | Checks formatting of source, playground, and root code/configuration files |
| `pnpm build`        | Runs type checking, builds library JavaScript, then emits declarations     |

For a focused regression, pass the affected test file to Vitest:

```sh
pnpm exec vitest run src/__tests__/MdvCard.spec.ts
```

`pnpm lint` and `pnpm format` modify files. Review their diffs before committing. The default formatting scripts do not include Markdown; check changed documentation explicitly:

```sh
pnpm exec prettier --check README.md MAINTENANCE.md
git diff --check
```

Use UTF-8 without a BOM and LF line endings. Keep formatting changes limited to the files being maintained.

### Browser and integration review

Review the states that apply to the component: default, hover, pressed, focus-visible, selected, disabled, loading, and error. Check keyboard navigation and cancellation, focus restoration, native event forwarding, form submission/reset, and disabled fieldsets where relevant.

Inspect light/dark/local themes, custom tokens, long Chinese and English text, narrow containers, RTL, and reduced motion. Check overlays inside other overlays and scrolling containers when the component uses a popup, dialog, or sheet.

For SSR-capable components, keep IDs and initial markup stable and verify hydration preserves existing nodes, user edits, and focus. Browser or assistive-technology support should be described using actual verification results.

### Diagnosing CI-only test failures

Match the CI versions and use `pnpm install --frozen-lockfile` before investigating a different environment. Compare the failing assertion with the component's behavior rather than adding retries or delays.

For ordinary Vue DOM interactions, prefer Vue Test Utils `trigger()`. Mounting a component and immediately calling native `dispatchEvent()` or `.click()` can put Vue's capture and bubbling listeners in the same millisecond and cause callbacks to be skipped. A fixed `Date.now()` regression can make this reproducible.

Keep direct native dispatch when the test needs native behavior, such as forcing an event onto a disabled element. If an event type needs a native constructor, arrange its timing explicitly in the test. Preserve assertions about cancellation, event identity, and duplicate emissions.

## Building and checking the actual package

`pnpm build` produces the library ESM entries and declaration files. It does not build a production playground application.

The public entry points are:

| Import                      | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `@mdv-ui/mdv`               | Components, public types, and shared public APIs     |
| `@mdv-ui/mdv/dynamic-color` | Full color-scheme generation and DOM application     |
| `@mdv-ui/mdv/theme`         | Theme, fonts, Tailwind mappings, and source scanning |
| `@mdv-ui/mdv/styles`        | Component CSS                                        |

The `files` list and `exports` in `package.json` define the package contents and supported imports. npm also includes standard metadata such as the README and license.

When changing exports, packaging, dependencies, styles, or public types, inspect a real tarball and install it in a separate application. For example, on PowerShell:

```powershell
pnpm build
$mdvPackDir = Join-Path ([System.IO.Path]::GetTempPath()) ("mdv-package-check-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $mdvPackDir | Out-Null
pnpm pack --pack-destination "$mdvPackDir"
$mdvTarball = (Get-ChildItem -LiteralPath $mdvPackDir -Filter '*.tgz').FullName
tar -tzf "$mdvTarball"
```

Check that the JavaScript, declarations, published component sources, styles, README, license, and notices are present. Local planning files, tests, playground, caches, and development dependencies should stay outside the tarball.

In a separate Vue 3.5+/Vite/Tailwind v4 application, install the generated tarball using its absolute path:

```sh
pnpm add "/absolute/path/to/package.tgz"
```

Use the README's CSS setup, import representative components and types from the package, and run the application's type check and production build. Inspect the resulting application in a browser, including fonts, themes, overlays, and relevant compositions. Test the installed package rather than importing directly from this checkout.

For tree-shaking comparisons, use identical application settings and record JavaScript, CSS, and font sizes separately. Component JavaScript can be removed by the bundler; the current CSS imports load the complete theme and component styles.

## Versioning with Changesets

Changesets collects release notes and calculates the next version. Normal development commits can be made whenever useful; include a changeset when a public change is ready to enter the next release.

```sh
pnpm changeset
```

Select `@mdv-ui/mdv`, choose a release level, and write an English summary of the user-visible behavior.

| Level   | Typical use                             |
| ------- | --------------------------------------- |
| `patch` | Fixes and compatible corrections        |
| `minor` | New compatible public capabilities      |
| `major` | A deliberately planned breaking release |

During 0.x development, agree on the target version before choosing a level. A release-level decision can explicitly keep a change in a patch release; selecting `major` from 0.x advances to 1.0.0.

Commit the generated `.changeset/*.md` file with the implementation and relevant documentation. Several changesets can be included in one release. An additional test fix for an already-pending release usually does not need another changeset.

Keep `package.json` at its current version during ordinary development. The release PR updates the version and CHANGELOG and consumes the pending changesets. If an unreleased feature is withdrawn, remove its corresponding changeset with an explanation in the commit.

## Release automation setup

The existing workflows publish the public package `@mdv-ui/mdv` from `kKsk03/mdv`. This setup is already represented in the repository; verify platform settings when configuring or repairing publishing.

1. In GitHub **Settings → Actions → General**, allow the workflows to write repository content and create pull requests.
2. In the npm settings for `@mdv-ui/mdv`, configure a GitHub Actions Trusted Publisher with the following identity:

   | Field             | Value                                                |
   | ----------------- | ---------------------------------------------------- |
   | Repository owner  | `kKsk03`                                             |
   | Repository        | `mdv`                                                |
   | Workflow filename | `release.yml`                                        |
   | Environment       | Leave empty; this workflow has no GitHub Environment |

3. Allow `npm stage publish` for that publisher. Keep direct `npm publish` disabled for this workflow.
4. Ensure the maintainer approving the staged package has the required npm organization/package permissions and 2FA.

The Release workflow uses `id-token: write` and npm Trusted Publishing, so staging does not require a long-lived npm token. It installs npm **11.15.0** in CI for the staging command; routine local development uses pnpm.

Reference: [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers/) and [Staged Publishing](https://docs.npmjs.com/staged-publishing/).

## Releasing a version

The release sequence is:

```text
Code and changesets reach main
  → Release PR
  → Maintainer reviews and merges the release PR
  → Checks and library build
  → npm staged package and vX.Y.Z Git tag
  → Automatic Finalize Release attempt (fails if npm approval is still pending)
  → Maintainer reviews and approves the package on npm with 2FA
  → Version becomes publicly available
  → Maintainer reruns Finalize Release if needed
  → GitHub Release with the tagged changelog entry
```

### 1. Submit the change

Run the local checks, review the diff, and commit the code, documentation, and changeset. Use a feature branch and pull request for review, or the maintainer's agreed direct-to-main workflow.

The [CI workflow](./.github/workflows/ci.yml) checks pushes to every repository branch and supports manual runs. It does not subscribe to pull-request events: Changesets PRs created with `GITHUB_TOKEN` otherwise start approval-gated runs that fail if approval expires. Repository branches are checked on push, and the merged commit is checked again on `main`; fork PRs require maintainer-led validation. The [Release workflow](./.github/workflows/release.yml) runs on pushes to `main` and can also be started manually, independently repeating the checks before staging.

When pending changesets exist on `main`, Release creates or updates a PR titled **chore: release packages**, with commits titled **chore: version packages**. Multiple development commits can update the same release PR.

### 2. Review and merge the release PR

Check the proposed package version, CHANGELOG entries, consumed changesets, and workflow results. Each user-visible change should appear only once in the new version's changelog section. For example, a single patch release from `0.1.1` should propose `0.1.2`.

After merging, Release runs the checks again, builds JavaScript and declarations, and invokes `scripts/stage-publish.mjs`. Successful staging causes Changesets to push the corresponding `vX.Y.Z` tag. When Release completes successfully, Finalize Release starts automatically once. If npm approval is still pending, this attempt fails with instructions to approve the package and rerun finalization.

### 3. Review the npm staged package

Open npm's **Staged Packages** view and find the expected package/version. Wait for scanning to finish, inspect the submitted package and its contents, then approve it using 2FA.

A successful Release workflow means the package was staged. Public installation becomes available after npm approval and registry propagation.

### 4. Verify public availability

Replace `X.Y.Z` with the approved version:

```sh
pnpm view @mdv-ui/mdv@X.Y.Z version --registry https://registry.npmjs.org
pnpm view @mdv-ui/mdv dist-tags --registry https://registry.npmjs.org
```

Confirm the version can be queried and the intended default release is listed under `latest`. Registry metadata can take time to propagate immediately after approval; check again before diagnosing a missing release.

### 5. Create the GitHub Release

The [Finalize Release workflow](./.github/workflows/finalize-release.yml) runs once after a successful Release workflow on `main` in this repository. Failed Release runs do not run the finalization job. It also supports manual runs, does not publish npm packages, and has no scheduled checks or automatic retries. A successful Release run that only updated a release PR may finish finalization without changes when no matching Releases are missing.

Each run checks stable `vX.Y.Z` tags against existing GitHub Releases and the public npm registry. It verifies the tag's `package.json` and uses the matching `## X.Y.Z` section of `CHANGELOG.md` from that tag as the Release body. The body links to the comparison with the preceding stable tag whose version is public on npm, when one exists. GitHub's automatic pull request notes are disabled so the release PR title does not replace the actual changes.

Finalization fails before creating Releases if any candidate version is not publicly available on npm or a matching tag lacks readable, nonempty release notes. Historical tags for a different package name or version are reported and skipped after the registry check; an explicitly requested tag must match. Older published tags without Releases can be finalized by leaving the version input empty. A backfilled version is marked latest only if it is the npm `latest` version.

Existing Releases are unchanged. To correct old pull request-only notes, edit the existing Release body using the version's changelog section. Do not recreate the tag or republish the npm package.

If the automatic attempt failed while npm approval was pending, approve the package and verify public availability, then use **Re-run failed jobs** on that Finalize Release run. Alternatively, open [Actions → Finalize Release](https://github.com/kKsk03/mdv/actions/workflows/finalize-release.yml), choose **Run workflow** on `main`, and enter `X.Y.Z` without a leading `v`. Leave the version empty to check all stable version tags. A manually requested version must have a tag and be publicly available on npm. Rerun Finalize Release rather than the npm staging workflow when only the GitHub Release is missing.

### 6. Synchronize and consume the release

From a clean local checkout of `main`:

```sh
git pull --ff-only
git fetch --tags
```

In a business application, install the released version and validate the affected usage:

```sh
pnpm add @mdv-ui/mdv@X.Y.Z
```

## Recovering a failed release

| Failure                                                 | Next step                                                                                                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI or Release fails before staging                      | Fix the failing check, commit, and push. Keep the existing pending changeset or already-merged version.                                                                           |
| No release PR appears                                   | Inspect the Release run and confirm a pending changeset reached `main`. Check Actions pull-request permissions. A `main` push without changesets does not request a version bump. |
| npm returns `OIDC permission denied for this action`    | Check the package's Trusted Publisher identity and `npm stage publish` permission. Direct publish permission is not needed for this workflow.                                     |
| Staging succeeds but the version cannot be installed    | Complete npm scanning/review/approval, then allow for registry propagation.                                                                                                       |
| Finalize Release fails because npm is not public yet   | Complete npm approval and registry propagation, then rerun Finalize Release with that version. No new version or tag is needed.                                                     |
| The npm version is public but no GitHub Release appears | Run Finalize Release manually with that version. Inspect its summary and logs if it still does not create the Release.                                                            |
| The Git tag exists but the package is absent            | Inspect npm's staged packages and the Release logs. The staging script skips versions with existing tags; rerunning it does not resubmit that version.                            |

Before rerunning a failed staging step, check both npm's staged packages and the version's Git tag. npm can accept a submission before a later workflow step fails. A successfully staged package should proceed through npm approval, followed by a manual Finalize Release run.

Keep recovery tied to the intended version. Do not create another version or remove tags merely to retry a failed check. If npm rejected or discarded a staged package, reconcile its registry and tag state before deciding how to submit it again. An already-public npm version is immutable; ship a new version for a correction.

## Ongoing maintenance

- Follow the [documentation language policy](./AGENTS.md#language-and-encoding). Write new and maintained Markdown in English, subject to the stated exception, and preserve upstream license texts verbatim.
- Update dependencies deliberately with pnpm. Commit `package.json` and `pnpm-lock.yaml` together, then check types, tests, lint, formatting, builds, and relevant package consumption.
- Keep workflow toolchain versions aligned with the documented environment. Review public peer dependencies and supported Node ranges separately from the repository's development baseline.
- Keep [COMPONENTS.md](./COMPONENTS.md) accurate when public APIs, defaults, interactions, or limitations change. Keep the README focused on installation and retain release history in [CHANGELOG.md](./CHANGELOG.md).
- Update [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) when third-party code, algorithms, tokens, or fonts require attribution. The project uses the [MIT license](./LICENSE).
- Review Material Design changes as individual maintenance tasks. Preserve intentional compatibility decisions and document migrations for breaking API changes.
- Keep [ROADMAP.md](./ROADMAP.md) focused on current milestones, actual open work, and durable decisions. Record detailed implementation history in commits and pull requests rather than appending a running log to the roadmap.
- Keep `COMPONENTS.md` until the documentation site in its separate repository fully covers the existing API and usage guidance. When retiring it, update incoming links and the npm file list, and make the supported documentation versions clear.
