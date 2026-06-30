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
  connectToPrevious,
}: {
  message: SessionMessage;
  connectToPrevious?: boolean;
}) {
  const shouldConnect = Boolean(connectToPrevious || message.shouldConnect);

  if (message.role === "user") {
    return <UserBubble content={message.content ?? ""} />;
  }

  if (message.role === "assistant") {
    if (isThinkingMessage(message)) {
      const thinkingContent = getThinkingContent(message);
      return (
        <CollapsibleBubble
          contentClassName="collapsed"
          dotClass={cn(shouldConnect && "connect-to-prev")}
          label="Thinking"
          params={summarizePlainText(thinkingContent)}
        >
          {thinkingContent}
        </CollapsibleBubble>
      );
    }
    return <AssistantBubble message={message} shouldConnect={shouldConnect} />;
  }

  if (message.role === "system") {
    const skillName =
      getNestedString(message, ["meta", "skill", "name"]) ??
      parseSkillName(message.content) ??
      "Unknown Skill";
    const skillDescription =
      getNestedString(message, ["meta", "skill", "description"]) ??
      message.content ??
      "";
    return (
      <CollapsibleBubble
        contentClassName="collapsed"
        dotClass={cn("system-dot", shouldConnect && "connect-to-prev")}
        label="Skills"
        labelBold
        params={skillName}
      >
        {skillDescription}
      </CollapsibleBubble>
    );
  }

  const tool = parseToolMessage(message);
  return (
    <CollapsibleBubble
      contentClassName={tool.autoExpand ? undefined : "collapsed"}
      dotClass={cn(tool.ok ? "success" : "error", shouldConnect && "connect-to-prev")}
      label={tool.name}
      labelBold
      params={tool.paramsMd}
    >
      {tool.displayContent}
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

function AssistantBubble({ message, shouldConnect }: { message: SessionMessage; shouldConnect: boolean }) {
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
      <span className={cn("bubble-dot", shouldConnect && "connect-to-prev")} />
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
  label,
  params,
  labelBold,
  dotClass,
  contentClassName,
  children,
}: {
  label: string;
  params: string | null;
  labelBold?: boolean;
  dotClass: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Disclosure as="div" className="bubble tool">
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
          <DisclosurePanel className={cn("bubble-collapsible-content", contentClassName)}>
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
  displayContent: string;
  autoExpand: boolean;
} {
  const parsed = parseJsonObject(message.content) ?? {};
  const name = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : "unknown";
  const ok = parsed.ok === true;
  const paramsMd = getNestedString(message, ["meta", "paramsMd"]) ?? inferToolParams(name, parsed);
  const resultMd = getNestedString(message, ["meta", "resultMd"]);
  const displayContent =
    resultMd ??
    stringifyToolOutput(parsed.output) ??
    message.content ??
    "";
  const metadata = parsed.metadata && typeof parsed.metadata === "object" ? parsed.metadata as Record<string, unknown> : null;
  const autoExpand = metadata?.kind === "ask_user_question";
  return { ok, name, paramsMd, displayContent, autoExpand };
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
  const nameLine = content
    .split("\n")
    .find((line) => line.trim().startsWith("name:"));
  return nameLine?.replace(/^\s*name:\s*/u, "").trim() || null;
}

function summarizePlainText(content: string | null): string | null {
  if (!content) return null;
  const line = content.split("\n").map((item) => item.trim()).find(Boolean);
  if (!line) return null;
  return line.length > SUMMARY_LIMIT ? `${line.slice(0, SUMMARY_LIMIT - 3)}...` : line;
}

function stringifyToolOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (output === undefined || output === null) return null;
  return JSON.stringify(output, null, 2);
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
