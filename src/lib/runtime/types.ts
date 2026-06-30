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
  status?: string | null;
  createTime?: string;
  updateTime?: string;
};

export type SkillInfo = {
  name: string;
  path: string;
  description?: string;
  isLoaded?: boolean;
};

export type PermissionScope =
  | "read-in-cwd"
  | "read-out-cwd"
  | "write-in-cwd"
  | "write-out-cwd"
  | "delete-in-cwd"
  | "delete-out-cwd"
  | "query-git-log"
  | "mutate-git-log"
  | "network"
  | "mcp";

export type PermissionRequest = {
  toolCallId?: string;
  name?: string;
  command?: string;
  description?: string;
  scope?: PermissionScope | string;
  [key: string]: unknown;
};

export type TokenTelemetry = {
  model?: string;
  thinkingEnabled?: boolean;
  reasoningEffort?: string;
  activeTokens?: number;
  compactPromptTokenThreshold?: number;
  maxTokens?: number;
  usage?: Record<string, unknown> | null;
};

export type SessionMessage = {
  id: string;
  sessionId?: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  html?: string;
  visible?: boolean;
  createTime?: string;
  updateTime?: string;
  shouldConnect?: boolean;
  meta?: Record<string, unknown>;
  messageParams?: Record<string, unknown> | null;
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
  summary?: string;
  sessions?: SessionSummary[];
  messages?: SessionMessage[];
  message?: SessionMessage;
  content?: string;
  value?: boolean;
  status?: string | null;
  processes?: ProcessMap;
  askPermissions?: PermissionRequest[];
  tokenTelemetry?: TokenTelemetry | null;
  skills?: SkillInfo[];
  config?: ModelConfig;
  progress?: Record<string, unknown>;
  pid?: number;
  chunk?: string;
  error?: string;
  [key: string]: unknown;
};

export type PromptInput = {
  text: string;
  skills?: SkillInfo[];
  imageUrls?: string[];
};

export type RuntimeClient = {
  subscribe(listener: (event: HeadlessEvent) => void): () => void;
  startRuntime(projectRoot?: string): Promise<RuntimeStatus>;
  stopRuntime(): Promise<void>;
  ready(): Promise<void>;
  requestSkills(): Promise<void>;
  createNewSession(): Promise<void>;
  selectSession(sessionId: string): Promise<void>;
  backToList(): Promise<void>;
  prompt(input: PromptInput): Promise<{ requestId: string }>;
  interrupt(): Promise<void>;
  openFile(filePath: string, line?: number): Promise<void>;
  copyText(text: string): Promise<void>;
};
