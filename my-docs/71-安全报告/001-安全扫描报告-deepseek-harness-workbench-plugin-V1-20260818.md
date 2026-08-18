# 安全扫描报告 — deepseek-harness-workbench-plugin

## 元信息

| 项 | 值 |
|----|----|
| 扫描时间 | 2026-08-18 20:58:57（系统时间，精确到秒） |
| 文档版本 | **V1**（重扫时递增 V2、V3…） |
| 插件版本 | **0.1.17**（package.json version） |
| 扫描对象 | `projects/dsh-plugins-code/deepseek-harness-workbench-plugin/`（本地 wkj-dev 分支，HEAD 1d3dd15） |
| 扫描类型 | 恶意代码 / 遥测 / 信息窃取 / 无法理解文件 全量静态审查 |
| 总体结论 | **无风险**：未发现恶意代码、遥测代码、窃取信息代码或无关无法理解的文件；源码反而包含多处良好的防御性实现 |

---

## 1. 扫描范围

仓库内全部 172 个文件，逐项覆盖：

| 范围 | 说明 |
|------|------|
| 源码 | `src/` 全部 93 个文件（host 16 + client 46 + shared 27 + types 2 + index 2）逐一阅读 |
| 构建产物 | `lib/index.js`（172 KB）、`lib/client.js`（9.5 MB）—— 与 src 做同源比对 |
| 脚本 | `devops/` 8 个 shell 脚本全部阅读 |
| 配置 | `package.json`、`cordis.patch.yml`、`tsconfig.json`、`tsdown.config.ts`、`vitest.config.ts`、`pnpm-workspace.yaml`、`.mise.toml`、`.gitignore`、`.cursor/rules/*`、`.cursor/skills/*` |
| 依赖 | `pnpm-lock.yaml` 直接依赖清单与 node-pty 来源核验 |
| 文档 | README.md / README.zh-CN.md / README-WAKE.md / LICENSE |
| 二进制 | `docs/img/` 7 张图片、`lib/` 2 份产物（file 命令识别） |
| git 元数据 | remotes / 分支 / tag / 全历史 / 删除文件历史 |

## 2. 扫描方法

1. **全文件盘点**：枚举含隐藏文件在内的全部文件，标记大文件（>100 KB）与二进制文件。
2. **高危模式检索**：对 `src/`、`devops/`、`lib/` 全量 grep —— `child_process`、`exec/spawn/execSync`、`eval`、`new Function`、`atob/btoa`、`sendBeacon`、`WebSocket`、`XMLHttpRequest`、`process.env`、`require('net'/'dgram'/'os')`、`fs.*`、`fetch`、`/dev/tcp`、`\x..` 转义、`navigator`、`document.cookie`、`localStorage/sessionStorage/indexedDB`、URL 域名。
3. **源码逐文件阅读**：host 侧（Node 权限侧）16 个文件全部精读，核对每个进程调用 / 网络调用 / 文件读写的目的与去向。
4. **构建产物同源比对**：lib 头部与 src 对应、域名提取、可疑关键字计数。
5. **git 卫生检查**：remote 指向、分支/标签、全历史、删除文件历史（查隐藏/被删的恶意提交）。
6. **二进制识别**：`file` 命令识别格式与尺寸。

## 3. 发现汇总

| 风险类别 | 结论 | 说明 |
|----------|------|------|
| 恶意代码（后门/命令执行/下载执行/混淆/持久化/挖矿/勒索） | **未发现** | child_process 仅 3 处、全部白名单 + 参数化 |
| 遥测代码（数据上报/日志外发/指纹采集） | **未发现** | 网络请求仅 2 类：npm 官方 registry 版本检查、用户配置的 LLM 服务商余额查询 |
| 信息窃取（密钥/凭证/文件窃取） | **未发现** | API key 仅用于余额查询且不回传；脱敏贯穿全部输出 |
| 无关却无法理解的文件 | **未发现** | 二进制均为文档截图；lib 与 src 同源；无未知脚本/加密内容 |
| 低风险观察项（非恶意，建议知悉） | 3 项 | 见 §4.6 |

---

## 4. 逐项发现

### 4.1 恶意代码排查 —— 未发现

**进程执行（共 3 处，全部合法用途）**

1. `src/host/git-exec.ts:1,66-70` — `spawn('git', args)`。可执行名固定为字面量 `'git'`，参数为调用方构造的字符串数组（无 shell 拼接），带 30s 超时（L87-90）与 SIGTERM 中止（L82-85）。用途：Git 服务。**合法**。
2. `src/host/external-open.ts:1,62-94` — `spawn(bin, [abs])`。bin 只能来自 `CATALOG` 白名单（L15-23：cursor/vscode/codium/windsurf/zed/open/explorer/xdg-open），且经 `looksLikeBareName` 校验（L37-39，拒绝用户提供的命令字符串）与 `whichOnPath` PATH 解析（L42-60）。用途：在外置编辑器打开文件。**合法**。
3. `src/host/terminal.ts:1,202`（PTY 自检子进程 `spawn(process.execPath, ['-e', code])`）、`:261`（`pty.spawn(shell, [], ...)`）。shell 严格白名单：`ALLOWED_ABS = /^\/(bin|usr\/bin|usr\/local\/bin)\/(bash|zsh|sh|dash)$/`（L16）+ `ALLOWED_SHELL` 名称白名单（L15），`pickShell` 只在这些候选里选（L57-86）。自检代码为静态模板 + JSON.stringify 转义，无注入。用途：工作台 PTY 终端。**合法**。

**动态执行 / 混淆 —— 0 处**：`src/` 与 `lib/` 中无 `eval(`、`new Function`、`execSync`、`/dev/tcp`、base64 混淆 payload、`\x..` 转义链。`lib/client.js` 中 2 处 `atob`（L127704、L138030）为 xlsx/表格库的正常 base64 解码，属第三方库代码。

### 4.2 遥测排查 —— 未发现

网络请求完整清单（全部带用途声明，无匿名上报、无第三方收集域名）：

1. **npm 版本检查** — `src/host/update-check.ts:7,35-45`：仅 `fetch('https://registry.npmjs.org/dsh-workbench-plugin/latest')`（官方 registry），4s 超时（L67）、6h 缓存（L8,62），失败静默（L71-72）。只做本插件版本号对比。**合法**。
2. **余额查询** — `src/host/provider-usage.ts:200-243,296-301`：`fetch(billingUrls(baseURL))`，baseURL 默认 `https://api.deepseek.com`（L8）或来自用户自己的 LLM 设置（L119-134）；`billingUrls` 仅构造 `/user/balance`、`/user/info`、`/dashboard/billing/credit_grants` 等已知端点且不含凭据（`usage-format.ts:154-181`）；请求头 user-agent 显式声明 `dsh-workbench-plugin/usage (+github.com/loadingvx/...)`（L219）。**合法**。
3. **浏览器侧同源调用** — `src/client/api.ts:13-31,47-115`：所有 `fetch` 均为相对路径 `/git/*`，即 dsh web 自身（Host 通过 `src/host/http.ts:443` 注册的 `/git` 前缀），无任何绝对 URL 请求第三方。

`src/client/` 全目录无 `WebSocket`、`EventSource`、`navigator.sendBeacon`、`XMLHttpRequest`、`document.cookie`、`postMessage` 外发。浏览器侧**零网络外发、零敏感存储**。

### 4.3 信息窃取排查 —— 未发现

1. **API key 处理** — `src/host/provider-usage.ts:136-157`：key 仅从 harness 的 `credentials` / `launchEnvironment` / `process.env` 读取（env 名须匹配 `^[A-Za-z_][A-Za-z0-9_]*$` 校验），**只用于对用户自己配置的 LLM 服务商发起余额 GET 请求**（L213-221）。返回快照不含任何密钥——注释明确 `Never returns secrets`（L260），`endpointLabel` 输出经 `redactSecrets`（L180-188）。
2. **无凭证文件读取**：全仓库无对 `~/.ssh`、`.npmrc`、`id_rsa`、`~/.dsh` 凭证的读取/外发（lib 中 4 处 `.dsh/` 仅为 node-pty 模块查找路径 `terminal.ts:135-137,155-157`）。
3. **脱敏贯穿输出**：`src/shared/redact.ts:31-39`（token/密码/query 参数/Bearer/userinfo 只留头尾）；`src/host/http.ts:61-71` 对所有失败响应脱敏、`:113-115` 对流式文本脱敏；`src/host/terminal.ts:361-370` 对 PTY 输出脱敏后到浏览器。
4. **浏览器侧无环境变量泄露**：`src/client/shims/node-process.ts` 的 `env` 为空对象（`{}`），`node-module.ts` 的 `createRequire` 直接抛错禁止浏览器加载 Node 模块。
5. **浏览器存储仅存偏好**：localStorage 仅存 UI 偏好/本地余额观察（`git-sync-prefs.ts:39,50`、`editor-mode.ts:36,46`、`usage-ledger.ts:21,38`、`nearby-git.ts:32`），sessionStorage 仅一次性提示标记（`TerminalView.tsx:192,197`）。无敏感信息写入。

### 4.4 无关 / 无法理解文件 —— 未发现

1. **二进制全为文档截图**：`docs/img/screen_shot_{1-6}.png`（2192-2197×1282-1286 8-bit RGBA，file 确认）、`social-preview.jpg`（1456×720 JFIF）。与 README 引用一一对应。
2. **构建产物与源码同源**：`lib/index.js` 头部即 `src/shared/redact.ts` 的编译输出（逐行对应）；域名提取结果仅 `api.deepseek.com` / `registry.npmjs.org` / `github.com` / `npmjs.com` / `platform.deepseek.com` 及 CodeMirror/Lezer/Mermaid 等库的文档链接（codemirror.net、developer.mozilla.org、w3.org 等，均出自库内 license/注释）。无额外打包内容。
3. **无隐藏可疑文件**：`.cursor/rules/privacy-redact.mdc`（脱敏开发规约）、`.cursor/skills/bump-version/SKILL.md`（版本升级技能）均为正常开发辅助内容；`tests/` 51 个测试文件与 `src/` 对应。
4. **git 卫生**：remotes 仅 origin（weikejia123 fork）+ upstream（loadingvx 上游）；tags v0.1.0–v0.1.17 为正常发布标签；全历史为正常开发提交；删除历史仅 `docs/img/terminal.png`、`workbench.png`（截图替换）。wkj-dev 相对 main 仅新增 `README-WAKE.md`（本地入口文档），**符合目录规约**。

### 4.5 防御性实现亮点（非风险，记录备查）

- 路径 jail：`workspace-fs.ts:54-64`（拒绝 `-` 开头、`..` 穿越）+ `:66-90`（realpath 解析后二次逃逸检查）；`git-service.ts:99-108` 同构。
- 大小/类型护栏：文本 1.5 MB、图片 8 MB 上限（`workspace-fs.ts:8-10`）；图片魔数验证防文本伪装成图片（`:123-154`）；xlsx 容器魔数验证（`:350-353`）。
- git 命令全部参数数组 + 输入校验（分支名 `branch-name.ts`、commit hash 正则 + rev-parse 验证 `git-service.ts:655-668`）；`git_commit` 模型工具经 `tools/pre-execute` 审批钩子（`tools.ts:144-148`）；无 reset --hard / clean 之外的危险操作。
- HTTP 层：请求体 1 MB 上限（`http.ts:28-44`）、`no-store` 缓存头、流式响应断开即中止（`:86-124`）。
- 终端输出脱敏 + buffer 上限（`terminal.ts:13-14,361-370`）。

### 4.6 低风险观察项（建议知悉，非恶意）

| # | 观察项 | 说明 | 分级 |
|---|--------|------|------|
| 1 | `/git` JSON API 无额外鉴权 | 插件注册在 dsh web 的 `webServer`（`http.ts:134-137`），服务本机 3080 端口；任何能访问该端口的进程/浏览器页面均可调用（含终端 shell 写入 `http.ts:387-397`）。这是 dsh web 本机服务模型固有的同源信任，非插件特有缺陷；插件未做额外校验 | 低 |
| 2 | `devops/stop-web.sh` 会 kill 3080 端口进程 | 开发者本机运维脚本，仅开发环境使用 | 低 |
| 3 | `node-pty@1.2.0-beta.15` 原生模块 | npm 官方 integrity（lock 有 hash），`pnpm-workspace.yaml` 显式 `allowBuilds: node-pty: true`；PTY 功能必需 | 低 |

---

## 5. 处置建议

1. **结论**：本插件可正常收录、安装、使用；无需隔离。
2. **保持节奏**：继续 wkj-dev 开发、main 跟随上游；上游每次大更新合并后按本目录规约重扫（生成 V2 报告）。
3. **可选加固**（非必须）：如对局域网/多用户本机暴露有顾虑，可在 host 侧 `/git` handler 增加来源校验（如校验 `Origin`/`Referer` 为 dsh web 自身）；该项属于 dsh 平台安全模型范畴，与插件恶意性无关。
4. **版本钉住**：安装/升级一律使用钉版本命令 `dsh plugin --profile web add dsh-workbench-plugin@0.1.17`，避免 pnpm 24h 延迟导致装到旧版。

---

*本报告依据 AGENTS.md「安全扫描规约」生成；扫描时间精确到秒，文档版本 V1，插件版本 0.1.17。*
