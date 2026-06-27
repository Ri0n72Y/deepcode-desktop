import { invoke } from "@tauri-apps/api/core";
import type { StaticHistoryResult, StaticSettingsResult } from "./types";

const fallbackHistory: StaticHistoryResult = {
  rootPath: "~/.deepcode/projects",
  projects: [
    {
      projectCode: "deepcode-desktop-demo",
      projectPath: "~/.deepcode/projects/deepcode-desktop-demo",
      originalPath: "D:/Project/deepcode-desktop",
      sessions: [
        { id: "demo-1", summary: "Replicate VSCode extension UI", status: "completed", updateTime: new Date().toISOString() },
        { id: "demo-2", summary: "Review host-owned runtime boundary", status: "interrupted", updateTime: new Date(Date.now() - 86400000).toISOString() },
      ],
    },
  ],
};

const fallbackSettings: StaticSettingsResult = {
  path: "~/.deepcode/settings.json",
  exists: false,
  config: {
    env: {
      API_KEY: "",
      BASE_URL: "https://api.deepseek.com",
      MODEL: "deepseek-v4-pro",
    },
    thinkingEnabled: true,
    reasoningEffort: "max",
    notify: "",
  },
};

export async function readStaticHistory(): Promise<StaticHistoryResult> {
  if (!isTauriRuntime()) return fallbackHistory;
  return await invoke<StaticHistoryResult>("read_deepcode_history");
}

export async function readStaticSettings(): Promise<StaticSettingsResult> {
  if (!isTauriRuntime()) return fallbackSettings;
  return await invoke<StaticSettingsResult>("read_deepcode_settings");
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
