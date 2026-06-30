import { Button, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { CheckIcon, ChevronRightIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";
import type { SessionMessage } from "../../lib/runtime/types";
import { cn } from "../../lib/utils/cn";

const COLLAPSE_LINE_LIMIT = 20;
const SUMMARY_LIMIT = 96;

export default function MessageBubble({ message }: { message: SessionMessage }) {
  if (message.role === "user") {
    return <UserBubble content={message.content ?? ""} />;
  }

  if (message.role === "assistant") {
    if (isThinkingMessage(message)) {
      const thinkingContent = getThinkingContent(message);
      return (
        <CollapsibleBubble
          dotClass={cn("system-dot", message.shouldConnect && "connect-to-prev")}
          label="Thinking"
          summary={summarizePlainText(thinkingContent)}
        >
          {thinkingContent}
        </CollapsibleBubble>
      );
    }
    return <AssistantBubble message={message} />;
  }

  const label = message.role === "system" ? "Skill" : "Tool";
  const summary = message.role === "system" ? summarizeSkillMessage(message) : summarizeToolMessage(message);
  return (
    <CollapsibleBubble
      dotClass={cn(
        message.role === "tool" ? "success" : "system-dot",
        message.shouldConnect && "connect-to-prev",
      )}
      label={label}
      summary={summary}
    >
      {message.content}
    </CollapsibleBubble>
  );
}

function UserBubble({ content }: { content: string }) {
  const lines = content.split("\n");
  if (lines.length <= COLLAPSE_LINE_LIMIT) {
    return <div className="bubble user">{content}</div>;
  }

  return (
    <Disclosure as="div" className="bubble user long-user-bubble">
      {({ open }) => (
        <>
          <div className="user-bubble-content">{open ? content : lines.slice(0, COLLAPSE_LINE_LIMIT).join("\n")}</div>
          <DisclosureButton className="bubble-expand-button">{open ? "Collapse" : "Expand"}</DisclosureButton>
        </>
      )}
    </Disclosure>
  );
}

function AssistantBubble({ message }: { message: SessionMessage }) {
  const [copied, setCopied] = useState(false);
  const content = message.content ?? "";

  async function copyMessage() {
    try {
      await navigator.clipboard?.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bubble assistant">
      <span
        className={cn(
          "bubble-dot",
          message.shouldConnect && "connect-to-prev",
        )}
      />
      <div className="bubble-normal-content">{content}</div>
      <Button className="bubble-copy-btn" onClick={() => void copyMessage()} type="button" aria-label="Copy assistant message">
        {copied ? <CheckIcon className="bubble-action-icon" /> : <ClipboardDocumentIcon className="bubble-action-icon" />}
      </Button>
    </div>
  );
}

function CollapsibleBubble({ label, summary, dotClass, children }: { label: string; summary: string | null; dotClass: string; children: ReactNode }) {
  return (
    <Disclosure as="div" className="bubble tool">
      {({ open }) => (
        <>
          <DisclosureButton className="bubble-collapsible-header" aria-label={`Toggle ${label} details`}>
            <span className={cn("bubble-dot", dotClass)} />
            <span className="bubble-title">
              <span className="bubble-title-text">
                <span>{label}</span>
                {summary ? (
                  <span
                    className="bubble-summary-text"
                    style={{ opacity: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {summary}
                  </span>
                ) : null}
              </span>
              <ChevronRightIcon
                className={cn(
                  "bubble-toggle-icon",
                  open && "expanded",
                )}
              />
            </span>
          </DisclosureButton>
          <DisclosurePanel className="bubble-collapsible-content">{children}</DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

function isThinkingMessage(message: SessionMessage): boolean {
  return Boolean(message.meta?.asThinking || getNestedString(message, ["messageParams", "reasoning_content"]) || getNestedString(message, ["messageParams", "reasoningContent"]));
}

function getThinkingContent(message: SessionMessage): string {
  return getNestedString(message, ["messageParams", "reasoning_content"]) ?? getNestedString(message, ["messageParams", "reasoningContent"]) ?? message.content ?? "";
}

function summarizeSkillMessage(message: SessionMessage): string | null {
  const skillName = getNestedString(message, ["meta", "skill", "name"]) ?? parseSkillName(message.content);
  return skillName ?? summarizePlainText(message.content);
}

function summarizeToolMessage(message: SessionMessage): string | null {
  const toolName =
    getNestedString(message, ["meta", "function", "name"]) ??
    getNestedString(message, ["messageParams", "tool_name"]) ??
    parseToolName(message.content);
  const resultSummary = summarizeToolContent(message.content);
  return [toolName, resultSummary].filter(Boolean).join(" · ") || null;
}

function parseSkillName(content: string | null): string | null {
  if (!content) return null;
  const nameLine = content.split("\n").find((line) => line.trim().startsWith("name:"));
  return nameLine?.replace(/^\s*name:\s*/u, "").trim() || null;
}

function parseToolName(content: string | null): string | null {
  const parsed = parseJsonObject(content);
  return typeof parsed?.name === "string" ? parsed.name : null;
}

function summarizeToolContent(content: string | null): string | null {
  const parsed = parseJsonObject(content);
  if (!parsed) return summarizePlainText(content);
  const status = parsed.ok === true ? "ok" : parsed.ok === false ? "failed" : null;
  const output = typeof parsed.output === "string" ? firstContentLine(parsed.output) : null;
  const summary = output ? truncate(output, SUMMARY_LIMIT) : status;
  return summary && summary !== parseToolName(content) ? summary : null;
}

function summarizePlainText(content: string | null): string | null {
  const line = firstContentLine(content);
  return line ? truncate(line, SUMMARY_LIMIT) : null;
}

function firstContentLine(content: string | null): string | null {
  if (!content) return null;
  return content.split("\n").map((line) => line.trim()).find(Boolean) ?? null;
}

function parseJsonObject(content: string | null): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function getNestedString(source: unknown, path: string[]): string | null {
  let current = source;
  for (const key of path) {
    if (current === null || typeof current !== "object" || !(key in current)) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current : null;
}

function truncate(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}
