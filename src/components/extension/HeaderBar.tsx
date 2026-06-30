import { Button } from "@headlessui/react";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import DeepcodeIcon from "../brand/DeepcodeIcon";
import { startStaticChat } from "../../lib/deepcode-static/start-static-chat";
import { cn } from "../../lib/utils/cn";
import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";
import { useStaticHistoryStore } from "../../stores/static-history-store";
import SessionDropdown from "./SessionDropdown";

export default function HeaderBar() {
  const sessions = useSessionStore((state) => state.list);
  const current = useSessionStore((state) => state.current);
  const messages = useChatStore((state) => state.messages);
  const runtimeProjectRoot = useRuntimeStore((state) => state.projectRoot);
  const history = useStaticHistoryStore((state) => state.history);
  const [open, setOpen] = useState(false);
  const active = sessions.find((item) => item.id === current);
  const title = active?.summary ?? inferConversationTitle(messages) ?? "New Conversation";
  const projectName = useMemo(
    () => resolveProjectName(history?.projects ?? [], current, runtimeProjectRoot),
    [current, history?.projects, runtimeProjectRoot],
  );

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
            <span className="session-title-text">{title}</span>
            {projectName ? <span className="session-project-text">{projectName}</span> : null}
          </span>
          <ChevronDownIcon className="session-selector-icon" />
        </Button>
        <SessionDropdown open={open} onClose={() => setOpen(false)} />
      </div>
      <Button className="header-new-btn" title="New Chat" type="button" onClick={startStaticChat}>
        <PlusIcon className="header-new-icon" />
      </Button>
    </header>
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
  const path = activeProject?.originalPath ?? runtimeProjectRoot;
  return path ? shortProjectName(path) : null;
}

function shortProjectName(value: string): string {
  const normalized = value.replaceAll("\\", "/");
  return normalized.split("/").filter(Boolean).pop() || value;
}
