import type { HeadlessEvent, PromptInput, RuntimeClient, RuntimeStatus } from "./types";

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
    this.emit({ type: "initializeEmpty", sessions: [{ id: "demo", summary: "Desktop UI foundation", status: "completed" }] });
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
    this.emit({ type: "sessionStatus", status: null, processes: null, askPermissions: [] });
  }

  async prompt(input: PromptInput): Promise<{ requestId: string }> {
    this.counter += 1;
    const requestId = `mock-${this.counter}`;
    this.emit({ type: "userMessage", requestId, content: input.text });
    this.emit({ type: "loading", requestId, value: true });
    this.emit({
      type: "appendMessage",
      requestId,
      message: {
        id: `assistant-${requestId}`,
        sessionId: "demo",
        role: "assistant",
        content: "Mock response from the desktop runtime client.",
        visible: true,
        createTime: new Date().toISOString(),
      },
    });
    this.emit({ type: "loading", requestId, value: false });
    return { requestId };
  }

  async interrupt(): Promise<void> {
    this.emit({ type: "loading", value: false });
  }

  private emit(event: HeadlessEvent): void {
    const enriched = { ...event, timestamp: event.timestamp ?? new Date().toISOString() };
    for (const listener of this.listeners) {
      listener(enriched);
    }
  }
}
