import { Button } from "@headlessui/react";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import { useRuntimeClient } from "../../app/providers";
import DeepcodeIcon from "../brand/DeepcodeIcon";
import { cn } from "../../lib/utils/cn";
import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";
import { useStaticHistoryStore } from "../../stores/static-history-store";
import SessionDropdown from "./SessionDropdown";

export default function HeaderBar() {
  const client = useRuntimeClient();
  const sessions = useSessionStore((state) => state.list);
  const current = useSessionStore((state) => state.current);
  const messages = useChatStore((state) => state.messages);
  const runtimeProjectRoot = useRuntimeStore((state) => state.projectRoot);
  const history = useStaticHistoryStore((state) => state.history);
  const [open, setOpen] = useState(false);
  const active = sessions.find((item) => item.id === current);
  const title = active?.summary ?? inferConversationTitle(messages) ?? "New Conversation";
  const workspaceName = useMemo(
    () => resolveProjectName(history?.projects ?? [], current, runtimeProjectRoot),
    [current, history?.projects, runtimeProjectRoot],
  );

  async function createNewChat() {
    await client?.createNewSession();
  }

  return (
    <header className="header-container">
      <div className="header-left">
        <Button
          className={cn(
            "session-selector",
            open && "open",
          )}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span className="session-logo" aria-hidden="true"><DeepcodeIcon className="session-logo-icon" /></span>
          <span className="session-selector-title">
            {workspaceName ? <WorkspaceBadge name={workspaceName} /> : null}
            <span className="session-title-text">{title}</span>
          </span>
          <ChevronDownIcon className="session-selector-icon" />
        </Button>
        <SessionDropdown open={open} onClose={() => setOpen(false)} />
      </div>
      <Button className="header-new-btn" title="New Chat" type="button" onClick={() => void createNewChat()}>
        <PlusIcon className="header-new-icon" />
      </Button>
    </header>
  );
}

function WorkspaceBadge({ name }: { name: string }) {
  return (
    <span
      className="session-workspace-badge"
      title={name}
      style={{
        border: "1px solid color-mix(in srgb, var(--vscode-focusBorder) 65%, transparent)",
        color: "var(--vscode-focusBorder)",
        background: "color-mix(in srgb, var(--vscode-focusBorder) 14%, transparent)",
        borderRadius: 4,
        padding: "1px 6px",
        maxWidth: 120,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flexShrink: 0,
        fontSize: 12,
      }}
    >
      {name}
    </span>
  );
}

function inferConversationTitle(messages: { role: string; content: string | null }[]): string | null {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content?.trim());
  if (!firstUserMessage?.content) return null;
  const singleLine = firstUserMessage.content.trim().split(/\s+/u).join(" ");
  return singleLine.length > 80 ? `${singleLine.slice(0, 77)}...` : singleLine;
}

function resolveProjectName(
  projects: { originalPath?: string | null; projectCode: string; sessions: { id: string }[] }[],
  currentSessionId: string | null,
  runtimeProjectRoot: string | null,
): string | null {
  const activeProject = currentSessionId
    ? projects.find((project) => project.sessions.some((session) => session.id === currentSessionId))
    : null;
  const path = activeProject?.originalPath ?? activeProject?.projectCode ?? runtimeProjectRoot;
  return path ? shortProjectName(path) : null;
}

function shortProjectName(value: string): string {
  const normalized = value.replace(/\\/g, "/");
  return normalized.split("/").filter(Boolean).pop() || value;
}
