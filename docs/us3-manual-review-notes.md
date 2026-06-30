# US3 manual review notes

Manual review reported on 2026-06-30.

## Fixed in this branch after the initial frontend validation

- Header title now falls back to the active session summary or first user message instead of always showing `New Conversation`.
- Header now shows the active project/repo name when it can be derived from static history or runtime project root.
- Timeline display preferences are persisted with Zustand persist.
- Default timeline preferences now show both skills and tools.
- Conversation settings labels are now English.
- Timeline skill/tool visibility toggles no longer filter the source list before render; items are kept mounted and toggled by display state.
- Static thinking messages now render as collapsible `thinking` entries using `messageParams.reasoning_content` / `reasoningContent`.
- Tool entries now use a short title containing the tool name and a one-line result summary when available.
- Removed the unused Rust `Path` import reported during `pnpm tauri dev`.

## Still open / needs follow-up

- No workspace switcher yet. Desktop needs an explicit workspace selector instead of relying on VS Code's implicit project binding.
- No first-class debug/log space yet. Runtime stderr is bridged as error events, but there is no dedicated command-line/settings log panel.
- New conversations are not guaranteed to appear in the session list immediately after leaving the conversation; runtime/session list refresh needs to be verified and likely hardened.
- Live backend/session list refresh after prompt/new session needs Tauri/headless integration verification.
- CSS/layout for the new project label in the header may need visual tuning.
- Full `pnpm tauri dev` + configured headless backend test still needs to be rerun after these commits.
- `cd src-tauri && cargo test` still needs to be run.
