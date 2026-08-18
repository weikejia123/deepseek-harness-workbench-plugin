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
| V4-20260818 | 2026-08-18 | 二开（wkj-dev）：文件树刷新按钮 / 右键复制相对·完整路径 / 拖拽节点到消息框追加完整路径 / 右侧栏「归档」标签页（归档会话列表+归档时间+点击查看）；设计实现报告存于 `my-docs/21-设计与实现/` |
| V5-20260818 | 2026-08-18 | 新增 `my-scripts/deploy.sh` 一键部署（不依赖 mise，自动装依赖→构建→安装到 web profile），本机实测通过 |
| V6-20260818 | 2026-08-18 | 二开版本号规约落地：package.json version → `0.1.17-wkj-1`（官方 0.1.17 基础上的首个二开版本，规约见根目录 AGENTS.md） |
| V7-20260818 | 2026-08-18 | 跟随上游：main fast-forward 到 upstream/main（0.1.18，含 external-open WSL 支持 / graph-layout / StatusBar editorOpen 等 4 个提交），合并到 wkj-dev；冲突解决（package.json version → `0.1.18-wkj-1`，二开版本按规约重新计；lib/client.js 重建为合并产物）；测试无回归（环境固有 23 个失败与基线一致） |
| V8-20260818 | 2026-08-18 | 上游变更记录落地：`my-docs/25-上游变更/001-上游变更-0.1.17至0.1.18-20260818.md`（4 个提交逐项详情 + 与二开关系） |
| V9-20260818 | 2026-08-18 | 二开修复：拖拽文件树节点到消息框真机失效修复（设计报告 001 V3）——effectAllowed 'move'→'copyMove'（与 dragover dropEffect 'copy' 兼容，Chrome 不再取消 drop）+ 补 text/plain 完整路径兜底 + dragover 门禁由 getData 改 types.includes（Firefox 自定义类型 dragover 阶段不可读）；构建与测试通过 |
| V10-20260818 | 2026-08-18 | 归档会话能力**整体回滚删除**（用户决定：点击看不到内容、价值低，避免污染）：删除 ArchivesPanel / archive-times / ArchiveHistory / archive-history 及全部接线（SideDock / Workbench / rail / index / types / icons / auto-open / locales），测试一并删除，lib 重建零残留；根因（dsh 运行时硬清除归档选中 + 无 unarchive API）记录于设计报告 002 V4（降级为根因记录） |
| V11-20260818 | 2026-08-18 | 跟随上游 0.1.19：main ff-only 到 upstream/main（16ba26e，Ultra Slash 自定义斜杠命令并入本插件 + 新依赖 @deepseek-ai/dsh-client-ui-input-trigger + 侧栏「/ 插件命令」标签），合并到 wkj-dev；冲突解决（package.json version → `0.1.19-wkj-1` 重新计；lib 取上游后重建合并产物）；二开拖拽修复与上游 slash 标签共存；上游变更记录 `my-docs/25-上游变更/002-上游变更-0.1.18至0.1.19-20260818.md`；`my-scripts/deploy.sh` 补旧独立 ultra-slash 包清理；测试无回归（环境固有 23 个失败不变） |
