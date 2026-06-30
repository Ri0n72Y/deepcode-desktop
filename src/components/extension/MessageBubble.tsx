import {
  Button,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";
import type { SessionMessage } from "../../lib/runtime/types";
import { cn } from "../../lib/utils/cn";

const COLLAPSE_LINE_LIMIT = 20;
const SUMMARY_LIMIT = 96;

export default function MessageBubble({
  message,
  connectToNext,
  connectToPrevious,
}: {
  message: SessionMessage;
  connectToNext?: boolean;
  connectToPrevious?: boolean;
}) {
  const timelineClassName = cn(
    connectToPrevious && "timeline-connect-prev",
    connectToNext && "timeline-connect-next",
  );

  if (message.role === "user") {
    return <UserBubble content={message.content ?? ""} />;
  }

  if (message.role === "assistant") {
    if (isThinkingMessage(message)) {
      const thinkingContent = getThinkingContent(message);
      return (
        <CollapsibleBubble
          className={timelineClassName}
          dotClass=""
          label="Thinking"
          params={summarizePlainText(thinkingContent)}
        >
          {thinkingContent}
        </CollapsibleBubble>
      );
    }
    return <AssistantBubble className={timelineClassName} message={message} />;
  }

  if (message.role === "system") {
    const skillName =
      getNestedString(message, ["meta", "skill", "name"]) ??
      parseSkillName(message.content) ??
      "Unknown Skill";
    return (
      <CollapsibleBubble
        className={timelineClassName}
        dotClass="system-dot"
        label="Skills"
        labelBold
        params={skillName}
      >
        {message.content ?? ""}
      </CollapsibleBubble>
    );
  }

  const tool = parseToolMessage(message);
  return (
    <CollapsibleBubble
      className={timelineClassName}
      defaultOpen={tool.autoExpand}
      dotClass={tool.ok ? "success" : "error"}
      label={capitalizeLabel(tool.name)}
      labelBold
      params={tool.paramsMd}
    >
      {message.content ?? ""}
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
          <div className="user-bubble-content">
            {open ? content : lines.slice(0, COLLAPSE_LINE_LIMIT).join("\n")}
          </div>
          <DisclosureButton className="bubble-expand-button">
            {open ? "Collapse" : "Expand"}
          </DisclosureButton>
        </>
      )}
    </Disclosure>
  );
}

function AssistantBubble({ className, message }: { className: string; message: SessionMessage }) {
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
    <div className={cn("bubble assistant", className)}>
      <span className="bubble-dot" />
      <div className="bubble-normal-content">{content}</div>
      <Button
        className="bubble-copy-btn"
        onClick={() => void copyMessage()}
        type="button"
        aria-label="Copy assistant message"
      >
        {copied ? (
          <CheckIcon className="bubble-action-icon" />
        ) : (
          <ClipboardDocumentIcon className="bubble-action-icon" />
        )}
      </Button>
    </div>
  );
}

function CollapsibleBubble({
  className,
  label,
  params,
  labelBold,
  dotClass,
  defaultOpen,
  children,
}: {
  className: string;
  label: string;
  params: string | null;
  labelBold?: boolean;
  dotClass: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <Disclosure as="div" className={cn("bubble tool", className)} defaultOpen={defaultOpen}>
      {({ open }) => (
        <>
          <DisclosureButton
            className="bubble-collapsible-header"
            aria-label={`Toggle ${label} details`}
          >
            <span className={cn("bubble-dot", dotClass)} />
            <span className="bubble-title">
              <span className="bubble-title-text whitespace-nowrap">
                {labelBold ? <b>{label}</b> : <span>{label}</span>}
                {params ? <span className="tool-params">{params}</span> : null}
              </span>
              {open ? <ChevronUpIcon className="bubble-toggle-icon" /> : <ChevronDownIcon className="bubble-toggle-icon" />}
            </span>
          </DisclosureButton>
          <DisclosurePanel className="bubble-collapsible-content">
            {children}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

function isThinkingMessage(message: SessionMessage): boolean {
  return Boolean(
    message.meta?.asThinking ||
    getNestedString(message, ["messageParams", "reasoning_content"]) ||
    getNestedString(message, ["messageParams", "reasoningContent"]),
  );
}

function getThinkingContent(message: SessionMessage): string {
  return (
    getNestedString(message, ["messageParams", "reasoning_content"]) ??
    getNestedString(message, ["messageParams", "reasoningContent"]) ??
    message.content ??
    ""
  );
}

function parseToolMessage(message: SessionMessage): {
  ok: boolean;
  name: string;
  paramsMd: string | null;
  autoExpand: boolean;
} {
  const parsed = parseJsonObject(message.content) ?? {};
  const name = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : "unknown";
  const ok = parsed.ok === true;
  const paramsMd = getNestedString(message, ["meta", "paramsMd"]) ?? inferToolParams(name, parsed);
  const metadata = parsed.metadata && typeof parsed.metadata === "object" ? parsed.metadata as Record<string, unknown> : null;
  const autoExpand = metadata?.kind === "ask_user_question";
  return { ok, name, paramsMd, autoExpand };
}

function inferToolParams(name: string, parsed: Record<string, unknown>): string | null {
  const args = getRecord(parsed, "args") ?? getRecord(parsed, "input") ?? getRecord(parsed, "metadata");
  if (name === "bash") return firstString(args, ["command", "cmd", "script"]);
  if (name === "read") return firstString(args, ["path", "filePath", "file_path", "target"]);
  if (name === "edit") return firstString(args, ["path", "filePath", "file_path", "target"]);
  return firstString(args, ["path", "filePath", "file_path", "command", "query"]);
}

function getRecord(source: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = source[key];
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function firstString(source: Record<string, unknown> | null, keys: string[]): string | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseSkillName(content: string | null): string | null {
  if (!content) return null;
  const lines = content.split("\n");
  const nameLine = lines.find((line) => line.trim().startsWith("name:"));
  if (nameLine) return nameLine.replace(/^\s*name:\s*/u, "").trim() || null;
  const headingLine = lines.find((line) => /^#\s+/.test(line.trim()));
  return headingLine?.replace(/^#\s+/u, "").trim() || null;
}

function summarizePlainText(content: string | null): string | null {
  if (!content) return null;
  const line = content.split("\n").map((item) => item.trim()).find(Boolean);
  if (!line) return null;
  return line.length > SUMMARY_LIMIT ? `${line.slice(0, SUMMARY_LIMIT - 3)}...` : line;
}

function parseJsonObject(
  content: string | null,
): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function getNestedString(source: unknown, path: string[]): string | null {
  let current = source;
  for (const key of path) {
    if (current === null || typeof current !== "object" || !(key in current))
      return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function capitalizeLabel(value: string): string {
  if (!value) return value;
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
