# Changesets

这里记录即将发布的公共变更。完成一项需要进入下个版本的改动后，在仓库根目录执行：

```powershell
pnpm changeset
```

按影响选择 `patch`、`minor` 或 `major`，写清用户能感知的变化，然后把生成的 `.md` 文件和代码一起提交。

普通开发提交不会直接发布 npm。合并到 `main` 后，GitHub Actions 会创建或更新一个发布 PR；审核并合并该发布 PR 后，CI 才会检查、构建、创建标签、创建 GitHub Release，并通过 npm Trusted Publishing 发布包。

不要手动修改版本号或删除尚未发布的 changeset。需要取消一项未发布的改动时，删除对应 changeset 文件并在提交说明中写明原因。
