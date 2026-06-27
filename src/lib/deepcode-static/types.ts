import type { SessionMessage, SkillInfo } from "../runtime/types";

export type StaticSessionSummary = {
  id: string;
  summary?: string | null;
  status?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
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
