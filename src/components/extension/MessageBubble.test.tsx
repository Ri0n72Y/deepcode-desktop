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

  it("toggles tool details through Headless UI disclosure", () => {
    render(<MessageBubble message={{ id: "m2", role: "tool", content: "tool output" }} />);

    expect(screen.getByText("tool output")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Toggle tool details"));
    expect(screen.queryByText("tool output")).not.toBeInTheDocument();
  });
});
