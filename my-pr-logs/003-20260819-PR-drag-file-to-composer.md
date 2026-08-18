# PR 报告 003 — 拖拽文件树节点到消息框追加路径

- **PR**: [#11](https://github.com/loadingvx/deepseek-harness-workbench-plugin/pull/11) `feat(workbench): drag a file-tree node onto the composer to append its path`
- **PR URL**: https://github.com/loadingvx/deepseek-harness-workbench-plugin/pull/11
- **目标仓库**: loadingvx/deepseek-harness-workbench-plugin（上游官方，base=main）
- **提交时间**: 2026-08-19 05:02（UTC 2026-08-18T21:02:10Z）
- **分支**: `weikejia123:feat/drag-file-to-composer` → 上游 `main`
- **commit**: `cfeaaf7`
- **功能分类**: 工作台拖拽交互（单一功能）
- **状态**: OPEN

## 功能描述

将文件树中的文件 / 文件夹节点拖拽到会话消息框（composer），在草稿末尾**追加双引号包裹的完整绝对路径**（按需补空格分隔，光标移至末尾）。拖拽悬停时输入框显示虚线高亮边框。

## 改动文件清单

| 文件 | 变更 |
|------|------|
| `src/client/workbench/Workbench.tsx` | +73：`window` 捕获阶段监听 `dragover` / `dragleave` / `drop`；命中 `[data-composer-seat]` 才放行；原生 textarea setter + 合成 `InputEvent('input')` 写入 React 受控草稿；`data-dsh-drop-target` 标记 |
| `src/client/workbench/FileTree.tsx` | +10/-1：dragstart 改为 `effectAllowed='copyMove'`、补 `text/plain` 兜底数据 |
| `src/client/workbench/ide-host.css.ts` | +6：`[data-composer-seat][data-dsh-drop-target]` 虚线 outline 高亮样式 |

## 设计决策（Why）

- **跨 React 树通信**：composer 是 dsh shell 的 UI（`[data-composer-seat] > textarea`），不在插件 React 树内，故在 `window` 捕获阶段监听，仅当 drop 目标位于 composer 座席内才 `preventDefault`。
- **React 受控 textarea 写入**：直接改 `textarea.value` 会被 React 覆盖，必须用 `HTMLTextAreaElement.prototype.value` 原生 setter 写入 + 派发 `InputEvent('input', { inputType: 'insertText' })`，composer 的 onChange 才能拾取新草稿。
- **`effectAllowed='copyMove'` 而非 `'move'`**：drop 处理器设 `dropEffect='copy'`，按 HTML DnD effect 兼容规则，dropEffect 超出 effectAllowed 会取消 drop（Chrome 显示 no-drop 光标、drop 事件不触发）。
- **dragover 用 `types.includes` 而非 `getData` 门禁**：types 数组在 dragover 阶段全引擎可读，而自定义类型**数据**在 Firefox 不可读（只暴露 text/*）——用 getData 门禁会让 Firefox 永远无法放行 drop。
- **`text/plain` 兜底**：跨文档拖拽 / 原生落点时我们的 drop handler 无法运行，text/plain 至少让原生 textarea 落点得到可用内容（PR 版本用相对路径，避免引入 workspacePath prop 依赖、保持与 PR #10 正交）。
- **不带 lib**：同 PR #9 / #10，构建产物噪声问题，PR 描述已注明维护者合并时自行 build。

## 与二开的关系

- 源自 wkj-dev 二开功能（`28b25c9` 拖拽追加路径 + `806ffda` 的跨浏览器修复：copyMove / types 门禁），本次按「单一功能」规约拆出独立 PR。
- **与 PR #10 正交性设计**：PR 版本 FileTree 的 `text/plain` 用相对路径、不接收 `workspacePath` prop（wkj-dev 版本用绝对路径、依赖 PR #10 的 prop 链路）——保证 #10 / #11 可独立、按任意顺序合并。本地 wkj-dev 保持自己的绝对路径版本不变。
- 上游合并后经常规 upstream merge 自然并入 wkj-dev；合并时 `FileTree.tsx` / `Workbench.tsx` 与本地版本可能存在小差异（text/plain 内容、prop 链路），需在 merge 时留意冲突。

## 后续动作

- [ ] 等待上游维护者 review / 合并
- [ ] 上游合并后：随 `git fetch upstream && git merge upstream/main` 并入 wkj-dev，**留意 FileTree.tsx / Workbench.tsx 合并差异**（本地为绝对路径 text/plain + workspacePath 链路，上游为相对路径版本）
