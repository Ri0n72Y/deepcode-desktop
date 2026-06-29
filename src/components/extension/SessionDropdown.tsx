import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { useMemo, useState } from "react";
import { loadStaticSession } from "../../lib/deepcode-static/load-static-session";
import type { StaticProjectHistory, StaticSessionSummary } from "../../lib/deepcode-static/types";
import { cn } from "../../lib/utils/cn";
import { useSessionStore } from "../../stores/session-store";
import { useStaticHistoryStore } from "../../stores/static-history-store";

type SessionDropdownProps = {
  open: boolean;
  onClose: () => void;
};

export default function SessionDropdown({ open, onClose }: SessionDropdownProps) {
  const history = useStaticHistoryStore((state) => state.history);
  const current = useSessionStore((state) => state.current);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => filterProjects(history?.projects ?? [], query), [history?.projects, query]);
  const active = findActiveSession(groups, current);
  const total = groups.reduce((sum, project) => sum + project.sessions.length, 0);

  async function selectSession(session: StaticSessionSummary | null) {
    if (!session) return;
    await loadStaticSession(session.id);
    setQuery("");
    onClose();
  }

  return (
    <Combobox value={active} onChange={(session: StaticSessionSummary | null) => void selectSession(session)}>
      <div className={cn("session-dropdown", open && "show")}>
        <div className="session-search-box">
          <ComboboxInput
            className="session-search-input"
            displayValue={(session: StaticSessionSummary | null) => query || session?.summary || ""}
            onChange={(event) => setQuery(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            placeholder="Search sessions..."
          />
        </div>
        <ComboboxOptions static className="session-dropdown-list">
          {total === 0 ? <div className="session-dropdown-empty">{query ? "No sessions found" : "No sessions yet"}</div> : null}
          {groups.map((project) => (
            <SessionGroup current={current} key={project.projectCode} project={project} query={query} />
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

type SessionGroupProps = {
  project: StaticProjectHistory;
  current: string | null;
  query: string;
};

function SessionGroup({ project, current, query }: SessionGroupProps) {
  if (project.sessions.length === 0) return null;
  return (
    <div className="session-dropdown-group">
      <div className="session-dropdown-group-title">{shortProjectName(project.originalPath || project.projectCode)}</div>
      {project.sessions.map((session) => (
        <ComboboxOption
          className={cn(
            "session-dropdown-item",
            session.id === current && "active",
          )}
          key={session.id}
          value={session}
        >
          <span className="session-dropdown-summary">{highlightText(session.summary || "Untitled", query)}</span>
          <span className="session-dropdown-time">{formatSessionDate(session.updateTime)}</span>
        </ComboboxOption>
      ))}
    </div>
  );
}

function filterProjects(projects: StaticProjectHistory[], query: string): StaticProjectHistory[] {
  const normalized = query.trim().toLowerCase();
  return projects
    .map((project) => ({
      ...project,
      sessions: normalized
        ? project.sessions.filter((session) => (session.summary || "Untitled").toLowerCase().includes(normalized))
        : project.sessions,
    }))
    .filter((project) => project.sessions.length > 0);
}

function findActiveSession(projects: StaticProjectHistory[], current: string | null): StaticSessionSummary | null {
  if (!current) return null;
  for (const project of projects) {
    const session = project.sessions.find((item) => item.id === current);
    if (session) return session;
  }
  return null;
}

function shortProjectName(value: string) {
  const normalized = value.replace(/\\/g, "/");
  return normalized.split("/").filter(Boolean).pop() || value;
}

function formatSessionDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function highlightText(text: string, query: string) {
  const normalized = query.trim();
  if (!normalized) return text;
  const index = text.toLowerCase().indexOf(normalized.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + normalized.length)}</mark>
      {text.slice(index + normalized.length)}
    </>
  );
}
