# US3：Tauri 启动本地 headless 后端

本需求在 `deepcode-desktop` 中接入本地 Tauri host-owned DeepCode headless runtime。

## 本地后端来源

后端不是 desktop repo 内部 package，而是本地另一个 `deepcode-headless` 项目。desktop 通过 Tauri Rust host 启动该项目构建出的本地 HTTP/SSE server。

## 环境变量

- `DEEPCODE_HEADLESS_PATH`：本地 `deepcode-headless` 项目根目录。
- `DEEPCODE_SERVER_BINARY`：可选，覆盖 server 启动命令。
- `DEEPCODE_SERVER_ARGS`：可选，追加 server 启动参数。
- `DEEPCODE_SERVER_READY_TIMEOUT_MS`：可选，ready 超时时间，默认 30000。

默认情况下，如果设置了 `DEEPCODE_HEADLESS_PATH` 且没有显式设置 `DEEPCODE_SERVER_BINARY`，desktop 会启动：

```text
node <DEEPCODE_HEADLESS_PATH>/packages/server/dist/server.js --port <auto-port> --project-root <project-root>
```

因此本地联调前需要先在 `deepcode-headless` 中构建 server package。

## PowerShell 示例

```powershell
cd D:\Project\deepcode-headless
npm run build --workspace @vegamo/deepcode-server

cd D:\Project\deepcode-desktop
$env:DEEPCODE_HEADLESS_PATH="D:\Project\deepcode-headless"
$env:DEEPCODE_SERVER_READY_TIMEOUT_MS="30000"
pnpm tauri dev
```

## 安全边界

- token 只保存在 Rust host runtime state 中。
- renderer 不持有 token。
- renderer 不持有后端 endpoint/baseUrl。
- renderer 不直接 fetch headless backend。
- HTTP proxy 与 SSE streaming 均由 Rust host 附带 host-owned token。
