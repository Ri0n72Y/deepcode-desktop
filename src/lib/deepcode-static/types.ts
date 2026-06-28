import type { SessionMessage, SkillInfo } from "../runtime/types";

export type StaticSessionSummary = {
  id: string;
  summary?: string | null;
  status?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
  model?: string | null;
  thinkingEnabled?: boolean | null;
  reasoningEffort?: string | null;
  activeTokens?: number | null;
  compactPromptTokenThreshold?: number | null;
  usage?: Record<string, unknown> | null;
};

export type StaticProjectHistory = {
  projectCode: string;
  projectPath: string;
  originalPath?: string | null;
  sessions: StaticSessionSummary[];
};

export type StaticHistoryResult = {
  rootPath: string;
  projects: StaticProjectHistory[];
};

export type StaticSessionResult = {
  sessionId: string;
  projectCode: string;
  model?: string | null;
  thinkingEnabled?: boolean | null;
  reasoningEffort?: string | null;
  activeTokens?: number | null;
  compactPromptTokenThreshold?: number | null;
  usage?: Record<string, unknown> | null;
  messages: SessionMessage[];
};

export type StaticSkillInfo = SkillInfo;

export type DeepcodeSettingsConfig = {
  env?: {
    API_KEY?: string;
    BASE_URL?: string;
    MODEL?: string;
  };
  thinkingEnabled?: boolean;
  reasoningEffort?: "high" | "max" | string;
  notify?: string;
};

export type StaticSettingsResult = {
  path: string;
  exists: boolean;
  config: DeepcodeSettingsConfig;
};
