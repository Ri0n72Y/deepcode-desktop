import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePermissionStore, type PermissionDecisionKind } from "../../stores/permission-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import PermissionPromptHost from "./PermissionPromptHost";

const request = { toolCallId: "p1", name: "write", command: "edit src/App.tsx", scope: "write-in-cwd" };

describe("PermissionPromptHost", () => {
  afterEach(() => {
    usePermissionStore.getState().clear();
    useRuntimeStore.getState().reset();
  });

  it.each<[string, PermissionDecisionKind]>([
    ["Yes", "allow_once"],
    ["Yes, and always allow this scope", "allow_always"],
    ["No", "deny"],
  ])("records %s decision", (label, kind) => {
    useRuntimeStore.getState().setSessionStatus("ask_permission");
    usePermissionStore.getState().setPending([request]);

    render(<PermissionPromptHost />);

    expect(screen.getByText("Permission required")).toBeInTheDocument();
    expect(screen.getByText("Do you want to proceed?")).toBeInTheDocument();
    fireEvent.click(screen.getByText(label));

    expect(usePermissionStore.getState().pending).toEqual([]);
    expect(usePermissionStore.getState().lastDecision?.kind).toBe(kind);
  });
});
