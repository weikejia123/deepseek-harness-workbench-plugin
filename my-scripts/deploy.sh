#!/usr/bin/env bash
# my-scripts/deploy.sh — 一键部署 dsh-workbench-plugin 到 web profile
#
# 与官方 devops/*.sh 的区别：
#   - 不依赖 mise：本机未安装 mise（或不在 PATH）也能用，自动使用 PATH /
#     ~/.nvm 里的 node + pnpm（二开机器实测：无 mise，nvm node 24 + pnpm 11）。
#   - 自动安装依赖：node_modules 缺失或依赖变更时自动 pnpm install，
#     不需要先跑 devops/setup.sh。
#   - 一条命令完成：装依赖 → 构建 → 安装到 web profile。
#
# 用法：
#   bash my-scripts/deploy.sh          部署（不启动 Web，重启 dsh web 后生效）
#   bash my-scripts/deploy.sh start    部署并启动 dsh web（会停掉 3080 再前台启动）
#   bash my-scripts/deploy.sh --help   显示帮助
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
  cat <<'EOF'
用法：
  bash my-scripts/deploy.sh            部署：装依赖 + 构建 + 安装到 web profile（不启动）
  bash my-scripts/deploy.sh start      部署后启动 dsh web（停掉 3080 端口再前台启动）
  bash my-scripts/deploy.sh --help     显示本帮助

说明：
  - 不依赖 mise；自动使用 PATH 或 ~/.nvm 里的 node / pnpm。
  - 安装依赖仅首次或依赖变更时执行；构建产物写入 lib/，随仓库一起提交
    （GitHub 市场安装路径不编译，push 前必须重新构建并提交 lib/）。
  - 安装目标：~/.dsh/profiles/web，dsh-workbench-plugin 将指向本仓库。
EOF
}

case "${1:-}" in
  -h|--help|help)
    usage
    exit 0
    ;;
esac

# ---------- 1. 工具链（node + pnpm，不依赖 mise） ----------
ensure_node() {
  if command -v node >/dev/null 2>&1; then return 0; fi
  local newest
  newest="$(ls -1d "$HOME"/.nvm/versions/node/* 2>/dev/null | sort -V | tail -1 || true)"
  if [[ -n "$newest" && -x "$newest/bin/node" ]]; then
    export PATH="$newest/bin:$PATH"
    return 0
  fi
  echo "❌ 找不到 node。请先安装 Node.js（>=22.19，建议 24），或通过 nvm 安装。" >&2
  return 1
}

find_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    printf '%s\n' "$(command -v pnpm)"
    return 0
  fi
  local newest
  newest="$(ls -1d "$HOME"/.nvm/versions/node/*/bin/pnpm 2>/dev/null | sort -V | tail -1 || true)"
  if [[ -n "$newest" && -x "$newest" ]]; then
    printf '%s\n' "$newest"
    return 0
  fi
  return 1
}

ensure_node
if ! PNPM="$(find_pnpm)"; then
  echo "❌ 找不到 pnpm。请先安装：npm install -g pnpm，或 corepack enable。" >&2
  exit 1
fi
echo "✔ 工具链：node $(node -v)（$(command -v node)）"
PNPM_VERSION="$("$PNPM" -v 2>/dev/null || echo unknown)"
echo "✔ 工具链：pnpm ${PNPM_VERSION}（${PNPM}）"

# ---------- 2. 安装依赖 ----------
echo "▶ 安装 / 校验依赖（pnpm install）…"
"$PNPM" install

# ---------- 3. 构建 ----------
echo "▶ 构建 lib/index.js 与 lib/client.js…"
"$PNPM" build
if [[ ! -f lib/index.js || ! -f lib/client.js ]]; then
  echo "❌ 构建失败：缺少 lib/index.js 或 lib/client.js。" >&2
  exit 1
fi
echo "✔ 构建完成。"

# ---------- 4. 定位 dsh CLI ----------
find_dsh() {
  if command -v dsh >/dev/null 2>&1; then
    printf '%s\n' "$(command -v dsh)"
    return 0
  fi
  local bin="$HOME/.dsh/profiles/node_modules/.bin/dsh"
  if [[ -x "$bin" ]]; then
    printf '%s\n' "$bin"
    return 0
  fi
  local cli="$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh/lib/bin.js"
  if [[ -f "$cli" ]]; then
    printf 'node %s\n' "$cli"
    return 0
  fi
  if [[ -f "$ROOT/deepseek-harness/apps/cli/lib/bin.js" ]]; then
    printf 'node %s\n' "$ROOT/deepseek-harness/apps/cli/lib/bin.js"
    return 0
  fi
  return 1
}

if ! DSH_CMD="$(find_dsh)"; then
  echo "❌ 找不到 dsh CLI。请先安装 DeepSeek Harness，或把 deepseek-harness 源码软链到本仓库根目录并编译。" >&2
  exit 1
fi
read -r -a DSH_ARGS <<< "$DSH_CMD"
echo "✔ dsh CLI：${DSH_CMD}"

# ---------- 5. 安装到 web profile ----------
WEB_PKG="$HOME/.dsh/profiles/web/package.json"
WEB_NM="$HOME/.dsh/profiles/web/node_modules"

# 清理旧包名残留（与官方 dev.sh 一致）：包名从 dsh-git-plugin 迁移后，
# 避免 profile 同时加载两份插件、client.js 只注册新名字。
if [[ -f "$WEB_PKG" ]] && grep -q '"dsh-git-plugin"' "$WEB_PKG"; then
  "${DSH_ARGS[@]}" plugin --profile web remove dsh-git-plugin || true
fi
if [[ -e "$WEB_NM/dsh-git-plugin" || -L "$WEB_NM/dsh-git-plugin" ]]; then
  rm -rf "$WEB_NM/dsh-git-plugin"
fi

echo "▶ 安装本仓库到 web profile（dsh plugin --profile web add）…"
"${DSH_ARGS[@]}" plugin --profile web add "$ROOT"

echo
echo "✔ 部署完成：dsh-workbench-plugin 已指向本仓库（${ROOT}）"
echo "  重启 dsh web（或执行 bash my-scripts/deploy.sh start）后，二开功能即生效。"

# ---------- 6. 可选：启动 ----------
if [[ "${1:-}" == "start" || "${1:-}" == "--start" ]]; then
  echo "▶ 启动 dsh web（前台运行，Ctrl+C 停止）…"
  exec bash "$ROOT/devops/start-web.sh"
fi
