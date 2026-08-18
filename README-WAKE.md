# README-WAKE — deepseek-harness-workbench-plugin

> V2-20260818

## 定位

`projects/dsh-plugins-code/` 是**专门管理 dsh（DeepSeek Harness）插件的目录**（上级 hub，可容纳多个插件）；本仓库即其下的第一个插件，位于 `projects/dsh-plugins-code/deepseek-harness-workbench-plugin/`。

当前收录：

- **deepseek-harness-workbench-plugin**：DeepSeek Harness Web UI 的 Workbench 插件。三栏布局 —— 左侧对话，中间编辑器 + 终端，右侧文件 / Git / 用量。详见上游 `README.md`（本文件不重复叙述实现）。

## Fork 信息

| 项 | 值 |
|----|----|
| 上游 upstream | https://github.com/loadingvx/deepseek-harness-workbench-plugin |
| 本地 fork origin | https://github.com/weikejia123/deepseek-harness-workbench-plugin |
| 本地路径 | `projects/dsh-plugins-code/deepseek-harness-workbench-plugin/`（**独立 git**，不属于上级目录 repo） |
| 默认分支 | `main`（维持纯净，跟随上游） |
| 开发分支 | `wkj-dev`（所有本地修改 / 文档提交于此） |

## 分支与同步

- 本地修改一律在 `wkj-dev` 上提交；`main` 保持与上游一致。
- 同步上游：`git fetch upstream && git merge upstream/main`（在 `wkj-dev` 上合并）。
- 提交 PR：`gh pr create --repo loadingvx/deepseek-harness-workbench-plugin --base main --head weikejia123:wkj-dev`。

## 项目自身结构

| 路径 | 说明 |
|------|------|
| `src/` | 插件源码（`client/workbench`、`host`、`shared` 等） |
| `tests/` | 测试 |
| `docs/` | 文档与图片 |
| `devops/` | 构建 / 发布相关 |
| `package.json` / `tsdown.config.ts` | pnpm + TypeScript 构建 |

## 修改记录

| 版本 | 日期 | 说明 |
|------|------|------|
| V1-20260818 | 2026-08-18 | 创建入口文档：fork 初始化（upstream + origin + wkj-dev + 独立 git） |
| V2-20260818 | 2026-08-18 | 目录迁移：移至 `projects/dsh-plugins-code/deepseek-harness-workbench-plugin/`（`dsh-plugins-code/` 作为 dsh 插件管理 hub） |
| V3-20260818 | 2026-08-18 | 安全扫描（V1 报告，结论无风险），报告存于 `my-docs/71-安全报告/` |
