import type { HeadlessEvent, PromptInput, RuntimeClient, RuntimeStatus, SessionSummary, SkillInfo } from "./types";

const now = new Date();
const iso = (offsetMinutes: number) => new Date(now.getTime() - offsetMinutes * 60_000).toISOString();

const demoSessions: SessionSummary[] = [
  { id: "demo", summary: "Refactor headless UI contract", status: "completed", createTime: iso(180), updateTime: iso(15) },
  { id: "permissions", summary: "Review file write permissions", status: "ask_permission", createTime: iso(400), updateTime: iso(90) },
  { id: "older", summary: "Investigate process timeout", status: "interrupted", createTime: iso(1600), updateTime: iso(1500) },
];

const demoSkills: SkillInfo[] = [
  { name: "deepcode-headless-frontend", path: "docs/skills/deepcode-headless-frontend/SKILL.md", isLoaded: true },
  { name: "desktop-ui-review", path: "docs/skills/desktop-ui-review/SKILL.md", isLoaded: false },
];

export class MockRuntimeClient implements RuntimeClient {
  private readonly listeners = new Set<(event: HeadlessEvent) => void>();
  private counter = 0;

  subscribe(listener: (event: HeadlessEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async startRuntime(projectRoot = "D:/Project/deepcode-desktop"): Promise<RuntimeStatus> {
    this.emit({ type: "connected" });
    return { status: "connected", projectRoot };
  }

  async stopRuntime(): Promise<void> {
    this.emit({ type: "shutdown" });
  }

  async ready(): Promise<void> {
    this.emitSession();
    await this.requestSkills();
    this.emit({
      type: "modelConfig",
      config: {
        model: "deepseek-v4-pro",
        provider: { apiKeyConfigured: false },
        availableModels: [
          { model: "deepseek-v4-pro", thinkingDefault: true, supportsMultimodal: false },
          { model: "deepseek-v4-flash", thinkingDefault: true, supportsMultimodal: false },
        ],
        reasoningEfforts: ["high", "max"],
        thinkingOptions: [true, false],
        thinkingEnabled: true,
        reasoningEffort: "max",
      },
    });
  }

  async requestSkills(): Promise<void> {
    this.emit({ type: "skillsList", skills: demoSkills });
  }

  async createNewSession(): Promise<void> {
    this.emit({ type: "initializeEmpty", sessions: demoSessions, status: null, tokenTelemetry: this.telemetry() });
  }

  async selectSession(sessionId: string): Promise<void> {
    this.emitSession(sessionId);
  }

  async backToList(): Promise<void> {
    this.emit({ type: "showSessionsList", sessions: demoSessions });
  }

  async prompt(input: PromptInput): Promise<{ requestId: string }> {
    this.counter += 1;
    const requestId = `mock-${this.counter}`;
    this.emit({ type: "userMessage", requestId, content: input.text });
    this.emit({ type: "loading", requestId, value: true, status: "running" });
    this.emit({
      type: "sessionStatus",
      sessionId: "demo",
      status: "running",
      processes: {
        "4217": { startTime: new Date().toISOString(), command: "npm run typecheck", timeoutMs: 120000 },
      },
      askPermissions: [],
      tokenTelemetry: this.telemetry(37),
    });
    this.emit({
      type: "appendMessage",
      requestId,
      shouldConnect: true,
      message: {
        id: `tool-${requestId}`,
        sessionId: "demo",
        role: "tool",
        content: JSON.stringify({ ok: true, name: "updatePlan", metadata: { plan: "- [x] Map webview layout\n- [>] Rebuild React shell\n- [ ] Wire host-owned server" } }),
        visible: true,
        meta: { paramsMd: "replace incorrect desktop shell", resultMd: "Plan updated." },
        createTime: new Date().toISOString(),
      },
    });
    this.emit({
      type: "appendMessage",
      requestId,
      shouldConnect: true,
      message: {
        id: `assistant-${requestId}`,
        sessionId: "demo",
        role: "assistant",
        content: "The desktop UI is now following the VSCode webview structure instead of a custom three-pane shell.",
        visible: true,
        createTime: new Date().toISOString(),
      },
    });
    this.emit({ type: "loading", requestId, value: false, status: "completed" });
    this.emit({ type: "sessionStatus", sessionId: "demo", status: "completed", processes: null, askPermissions: [], tokenTelemetry: this.telemetry(42) });
    return { requestId };
  }

  async interrupt(): Promise<void> {
    this.emit({ type: "loading", value: false, status: "interrupted" });
  }

  async openFile(): Promise<void> {
    this.emit({ type: "openFile" });
  }

  async copyText(text: string): Promise<void> {
    await navigator.clipboard?.writeText(text);
  }

  private emitSession(sessionId = "demo"): void {
    const active = demoSessions.find((item) => item.id === sessionId) ?? demoSessions[0];
    this.emit({
      type: "loadSession",
      sessionId: active.id,
      summary: active.summary,
      status: active.status ?? null,
      sessions: demoSessions,
      tokenTelemetry: this.telemetry(),
      processes: null,
      askPermissions: active.status === "ask_permission" ? [{ toolCallId: "p1", name: "write", command: "edit src/App.tsx", scope: "write-in-cwd" }] : [],
      messages: [
        { id: "m-user-1", sessionId: active.id, role: "user", content: "复刻 VSCode extension 的 webview UI", visible: true, createTime: iso(40) },
        { id: "m-skill-1", sessionId: active.id, role: "system", content: "", visible: true, shouldConnect: false, meta: { skill: { name: "deepcode-headless-frontend", description: "Use the VSCode webview layout and transport semantics." } } },
        { id: "m-tool-1", sessionId: active.id, role: "tool", content: JSON.stringify({ ok: true, name: "read", output: "resources/webview.html and resources/webview.css inspected." }), visible: true, shouldConnect: true, meta: { paramsMd: "lessweb/deepcode/resources/webview.*", resultMd: "Loaded source UI contract." } },
        { id: "m-assistant-1", sessionId: active.id, role: "assistant", content: "确认。当前 PR 必须按 header、session dropdown、timeline bubbles、composer、skills popup 和 context meter 复刻。", visible: true, shouldConnect: true, createTime: iso(12) },
      ],
    });
  }

  private telemetry(percent = 24) {
    return {
      model: "deepseek-v4-pro",
      thinkingEnabled: true,
      reasoningEffort: "max",
      activeTokens: percent * 1000,
      maxTokens: 100000,
      usage: { prompt_tokens: percent * 700, completion_tokens: percent * 120 },
    };
  }

  private emit(event: HeadlessEvent): void {
    const enriched = { ...event, timestamp: event.timestamp ?? new Date().toISOString() };
    for (const listener of this.listeners) {
      listener(enriched);
    }
  }
}
