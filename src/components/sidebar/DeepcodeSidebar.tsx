import { Button, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Bars3Icon, ChevronRightIcon, Cog6ToothIcon, FolderIcon, PlusIcon, QueueListIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useRuntimeClient } from "../../app/providers";
import { readStaticHistory } from "../../lib/deepcode-static/static-client";
import type { StaticHistoryResult, StaticProjectHistory, StaticSessionSummary } from "../../lib/deepcode-static/types";
import { cn } from "../../lib/utils/cn";

type DeepcodeSidebarProps = {
  onOpenSettings: () => void;
};

export default function DeepcodeSidebar({ onOpenSettings }: DeepcodeSidebarProps) {
  const client = useRuntimeClient();
  const [collapsed, setCollapsed] = useState(false);
  const [history, setHistory] = useState<StaticHistoryResult | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    void readStaticHistory().then(setHistory);
  }, []);

  async function createNewChat() {
    setActiveId(null);
    await client?.createNewSession();
  }

  function selectSession(session: StaticSessionSummary) {
    setActiveId(session.id);
  }

  return (
    <aside className={cn("deepcode-sidebar", collapsed && "collapsed")}>
      <div className="sidebar-topbar">
        <Button className="sidebar-icon-button" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">
          <Bars3Icon className="sidebar-icon" />
        </Button>
        <span className="sidebar-title">Deep Code</span>
      </div>

      <div className="sidebar-actions">
        <Button className="sidebar-primary-action" onClick={() => void createNewChat()}>
          <PlusIcon className="sidebar-action-icon" />
          <span>New Chat</span>
        </Button>
      </div>

      <nav className="sidebar-history" aria-label="DeepCode history">
        <div className="sidebar-section-title">
          <QueueListIcon className="sidebar-section-icon" />
          <span>History</span>
        </div>
        {(history?.projects ?? []).map((project) => (
          <ProjectGroup key={project.projectCode} activeId={activeId} project={project} onSelect={selectSession} />
        ))}
      </nav>

      <div className="sidebar-footer">
        <Button className="sidebar-footer-button" onClick={onOpenSettings}>
          <Cog6ToothIcon className="sidebar-action-icon" />
          <span>Settings</span>
        </Button>
      </div>
    </aside>
  );
}

type ProjectGroupProps = {
  project: StaticProjectHistory;
  activeId: string | null;
  onSelect: (session: StaticSessionSummary) => void;
};

function ProjectGroup({ project, activeId, onSelect }: ProjectGroupProps) {
  const name = project.originalPath || project.projectCode;
  const sessions = project.sessions.slice(0, 12);

  return (
    <Disclosure defaultOpen>
      {({ open }) => (
        <div className="sidebar-project-group">
          <DisclosureButton className="sidebar-project-button">
            <ChevronRightIcon className={cn("sidebar-project-chevron", open && "open")} />
            <FolderIcon className="sidebar-section-icon" />
            <span className="sidebar-project-name" title={name}>{shortProjectName(name)}</span>
          </DisclosureButton>
          <DisclosurePanel className="sidebar-session-list">
            {sessions.map((session) => (
              <Button
                className={cn("sidebar-session-item", session.id === activeId && "active")}
                key={session.id}
                onClick={() => onSelect(session)}
              >
                <span className="sidebar-session-title">{session.summary || "Untitled session"}</span>
                <span className="sidebar-session-meta">{formatSessionTime(session.updateTime)}</span>
              </Button>
            ))}
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
}

function shortProjectName(value: string) {
  const normalized = value.replace(/\\/g, "/");
  return normalized.split("/").filter(Boolean).pop() || value;
}

function formatSessionTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}
