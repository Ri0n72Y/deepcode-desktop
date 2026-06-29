import { afterEach, describe, expect, it } from "vitest";
import { useChatStore } from "../../stores/chat-store";
import { useModelStore } from "../../stores/model-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";
import { dispatchRuntimeEvent } from "./event-dispatcher";

describe("dispatchRuntimeEvent", () => {
  afterEach(() => {
    useChatStore.getState().clear();
    useRuntimeStore.getState().reset();
    useSessionStore.getState().replaceList([]);
    useSessionStore.getState().choose(null);
    useModelStore.getState().setValue(null);
  });

  it("loads an empty state", () => {
    dispatchRuntimeEvent({ type: "initializeEmpty", sessions: [{ id: "s1", summary: "Session 1" }] });
    expect(useSessionStore.getState().list).toHaveLength(1);
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("appends a message", () => {
    dispatchRuntimeEvent({ type: "appendMessage", message: { id: "m1", role: "assistant", content: "hello" } });
    expect(useChatStore.getState().messages[0]?.content).toBe("hello");
  });

  it("stores runtime status", () => {
    dispatchRuntimeEvent({ type: "runtimeStatus", status: "starting", projectRoot: "/tmp/project" });
    expect(useRuntimeStore.getState().status).toBe("starting");
    expect(useRuntimeStore.getState().projectRoot).toBe("/tmp/project");
  });

  it("stores model config", () => {
    dispatchRuntimeEvent({
      type: "modelConfig",
      config: {
        model: "deepseek-v4-pro",
        availableModels: [],
        reasoningEfforts: ["high", "max"],
        thinkingOptions: [true, false],
        thinkingEnabled: true,
      },
    });
    expect(useModelStore.getState().value?.model).toBe("deepseek-v4-pro");
  });
});
