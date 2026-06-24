# Repository Guidelines

## Project Overview

**Tauri 2 + React 19 + TypeScript** desktop application. Frontend in `src/`, Rust backend in `src-tauri/`, built with Vite and **pnpm**.

```
deepcode-desktop/
├── src/                    # React frontend (TypeScript + JSX)
│   ├── main.tsx            # ReactDOM.createRoot entry, StrictMode
│   ├── App.tsx             # Root component (default export)
│   └── assets/             # Static assets (SVGs, etc.)
├── src-tauri/              # Tauri 2 Rust backend
│   ├── src/
│   │   ├── main.rs         # Binary entry — calls lib::run()
│   │   └── lib.rs          # Tauri commands, plugin setup
│   ├── Cargo.toml          # Rust crate deps
│   ├── tauri.conf.json     # Window config, build commands, bundle settings
│   └── capabilities/       # Tauri v2 permission policies
├── public/                 # Unbundled static files (favicon, etc.)
├── index.html              # Vite HTML template
└── vite.config.ts          # Dev server on port 1420, HMR over ws
```

## Build, Test, and Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Vite dev server — frontend only, port 1420 |
| `pnpm build` | `tsc` type-check then `vite build` to `dist/` |
| `pnpm tauri dev` | Full Tauri desktop app with hot reload |
| `pnpm tauri build` | Production desktop installer |

Use `pnpm tauri dev` for daily development — it runs `pnpm dev` under the hood and opens the native window.

## Frontend ↔ Backend Communication

Define Rust commands with the `#[tauri::command]` attribute and register them via `generate_handler!` in `lib.rs::run()`:

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

Call them from the frontend with `invoke` from `@tauri-apps/api/core`:

```ts
import { invoke } from "@tauri-apps/api/core";
const msg = await invoke("greet", { name: "World" });
```

New Tauri commands go in `lib.rs`. New Tauri plugins go in `.plugin()` inside the builder chain.

## Coding Style & Naming

- **TypeScript**: `strict` mode, `noUnusedLocals`, `noUnusedParameters`, JSX via `react-jsx` transform.
- **React components**: `function` declarations, **default exports** (`export default function App()`).
- **Entry files**: `main.tsx`, `lib.rs`, `main.rs` — lowercase.
- **Rust**: Edition 2021. `cargo fmt` for formatting, `cargo clippy` for linting.

## Testing Guidelines

No test runner is configured yet. When adding tests:

- **Frontend**: Use **Vitest** (native Vite integration).
- **Backend**: Add `#[cfg(test)] mod tests { ... }` blocks in `lib.rs`.

## Commit & Pull Request Guidelines

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Keep commits small and focused; one logical change per commit.
- PR descriptions should explain the *what* and the *why*.

## Environment & Prerequisites

- **Node.js** ≥ 18 · **pnpm** (`corepack enable` or `npm i -g pnpm`)
- **Rust** ([rustup](https://rustup.rs))
- **VS Code extensions**: Tauri, rust-analyzer
