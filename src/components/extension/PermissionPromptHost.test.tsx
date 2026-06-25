import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePermissionStore } from "../../stores/permission-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import PermissionPromptHost from "./PermissionPromptHost";

describe("PermissionPromptHost", () => {
  afterEach(() => {
    usePermissionStore.getState().clear();
    useRuntimeStore.getState().reset();
  });

  it("clears pending permission when allowed in mock UI", () => {
    useRuntimeStore.getState().setSessionStatus("ask_permission");
    usePermissionStore.getState().setPending([{ toolCallId: "p1", name: "write", command: "edit src/App.tsx", scope: "write-in-cwd" }]);

    render(<PermissionPromptHost />);

    expect(screen.getByText("edit src/App.tsx")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Yes"));
    expect(usePermissionStore.getState().pending).toEqual([]);
  });
});
