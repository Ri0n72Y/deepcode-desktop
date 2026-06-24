export type RuntimeConnectionStatus = "offline" | "starting" | "connected" | "error";

export type HeadlessResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; requestId?: string };

export type RuntimeStatus = {
  status: RuntimeConnectionStatus;
  baseUrl?: string;
  projectRoot?: string;
  pid?: number;
  lastError?: string;
};

export type SessionSummary = {
  id: string;
  summary: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
};

export type SessionMessage = {
  id: string;
  sessionId?: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  visible?: boolean;
  createTime?: string;
  updateTime?: string;
  meta?: Record<string, unknown>;
};

export type ModelOption = {
  model: string;
  thinkingDefault: boolean;
  supportsMultimodal: boolean;
};

export type ModelConfig = {
  model: string;
  baseURL?: string;
  provider?: {
    baseURL?: string;
    apiKeyConfigured: boolean;
  };
  availableModels: ModelOption[];
  reasoningEfforts: string[];
  thinkingOptions: boolean[];
  thinkingEnabled: boolean;
  reasoningEffort?: string;
  telemetryEnabled?: boolean;
  debugLogEnabled?: boolean;
  webSearchTool?: string | null;
};

export type PermissionRequest = {
  toolCallId?: string;
  scope?: string;
  description?: string;
  [key: string]: unknown;
};

export type ProcessEntry = {
  startTime?: string;
  command?: string;
  timeoutMs?: number;
  deadlineAt?: string;
  timedOut?: boolean;
  stdout?: string;
  [key: string]: unknown;
};

export type ProcessMap = Record<string, ProcessEntry> | null;

export type HeadlessEvent = {
  type: string;
  requestId?: string;
  sequence?: number;
  timestamp?: string;
  sessionId?: string;
  sessions?: SessionSummary[];
  messages?: SessionMessage[];
  message?: SessionMessage;
  content?: string;
  value?: boolean;
  status?: string | null;
  processes?: ProcessMap;
  askPermissions?: PermissionRequest[];
  config?: ModelConfig;
  progress?: Record<string, unknown>;
  pid?: number;
  chunk?: string;
  error?: string;
  [key: string]: unknown;
};

export type PromptInput = {
  text: string;
  imageUrls?: string[];
};

export type RuntimeClient = {
  subscribe(listener: (event: HeadlessEvent) => void): () => void;
  startRuntime(projectRoot?: string): Promise<RuntimeStatus>;
  stopRuntime(): Promise<void>;
  ready(): Promise<void>;
  prompt(input: PromptInput): Promise<{ requestId: string }>;
  interrupt(): Promise<void>;
};
