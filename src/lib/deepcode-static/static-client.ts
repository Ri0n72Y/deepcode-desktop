import { invoke } from "@tauri-apps/api/core";
import type { StaticHistoryResult, StaticSessionResult, StaticSettingsResult, StaticSkillInfo } from "./types";

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

const fallbackSkills: StaticSkillInfo[] = [
  { name: "labourboard-advisor", path: "~/.agents/skills/labourboard-advisor/SKILL.md", isLoaded: false },
];

export async function readStaticHistory(): Promise<StaticHistoryResult> {
  if (!isTauriRuntime()) return fallbackHistory;
  return await invoke<StaticHistoryResult>("read_deepcode_history");
}

export async function readStaticSession(sessionId: string): Promise<StaticSessionResult> {
  if (!isTauriRuntime()) {
    return {
      sessionId,
      projectCode: fallbackHistory.projects[0]?.projectCode ?? "demo",
      messages: [
        { id: `${sessionId}-user`, sessionId, role: "user", content: "Open saved conversation", visible: true },
        { id: `${sessionId}-assistant`, sessionId, role: "assistant", content: "Loaded from static DeepCode history.", visible: true },
      ],
    };
  }
  return await invoke<StaticSessionResult>("read_deepcode_session", { sessionId });
}

export async function readStaticSettings(): Promise<StaticSettingsResult> {
  if (!isTauriRuntime()) return fallbackSettings;
  return await invoke<StaticSettingsResult>("read_deepcode_settings");
}

export async function readStaticSkills(): Promise<StaticSkillInfo[]> {
  if (!isTauriRuntime()) return fallbackSkills;
  return await invoke<StaticSkillInfo[]>("read_deepcode_skills");
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
