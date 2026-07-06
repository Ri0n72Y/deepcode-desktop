import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MessageBubble from "./MessageBubble";

describe("MessageBubble", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies assistant message content", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<MessageBubble message={{ id: "m1", role: "assistant", content: "copy me" }} />);

    fireEvent.click(screen.getByLabelText("Copy assistant message"));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("copy me"));
  });

  it("keeps tool details collapsed by default", () => {
    const content = JSON.stringify({ ok: true, name: "bash", output: "tool output" });
    render(<MessageBubble message={{ id: "m2", role: "tool", content }} />);

    expect(screen.queryByText("tool output")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Toggle Bash details"));
    expect(screen.getByText(/tool output/)).toBeInTheDocument();
  });

  it("collapses long user prompts", () => {
    const content = Array.from({ length: 22 }, (_, index) => `line ${index + 1}`).join("\n");

    render(<MessageBubble message={{ id: "m3", role: "user", content }} />);

    expect(screen.queryByText("line 22")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Expand"));
    expect(screen.getByText(/line 22/)).toBeInTheDocument();
  });
});
