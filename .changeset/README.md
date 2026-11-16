# Changesets

This directory records public changes intended for upcoming releases. When a change is ready to enter the next release, run the following from the repository root:

```powershell
pnpm changeset
```

Choose `patch`, `minor`, or `major` according to the agreed release impact. Write an English summary of the user-visible changes, then commit the generated `.md` file with the implementation. Changesets copies the summary into the changelog without translating it.

Ordinary development commits do not publish directly to npm. Once changesets reach `main`, GitHub Actions creates or updates a release PR. After that PR is reviewed and merged, CI runs checks, builds the library, and uses npm Trusted Publishing to submit a staged package and create its Git tag. A successful Release workflow automatically starts **Finalize Release** once. If npm approval is still pending, finalization fails; the maintainer approves the staged package with 2FA, verifies public availability, and reruns the failed Finalize Release job or starts it manually. There are no scheduled checks or automatic retries. See [MAINTENANCE.md](../MAINTENANCE.md#releasing-a-version) for the complete procedure.

Do not manually change the version or remove pending changesets. If an unreleased change is withdrawn, remove its corresponding changeset and explain why in the commit message.
