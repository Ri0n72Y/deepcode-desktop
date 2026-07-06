import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { useMemo, useState } from "react";
import { useRuntimeClient } from "../../app/providers";
import { loadStaticSession } from "../../lib/deepcode-static/load-static-session";
import type { StaticProjectHistory, StaticSessionSummary } from "../../lib/deepcode-static/types";
import type { SessionSummary } from "../../lib/runtime/types";
import { cn } from "../../lib/utils/cn";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";
import { useStaticHistoryStore } from "../../stores/static-history-store";

type SessionDropdownProps = {
  open: boolean;
  onClose: () => void;
};

type DropdownSession =
  | { source: "live"; session: SessionSummary }
  | { source: "static"; session: StaticSessionSummary };

export default function SessionDropdown({ open, onClose }: SessionDropdownProps) {
  const client = useRuntimeClient();
  const history = useStaticHistoryStore((state) => state.history);
  const liveSessions = useSessionStore((state) => state.list);
  const current = useSessionStore((state) => state.current);
  const runtimeProjectRoot = useRuntimeStore((state) => state.projectRoot);
  const [query, setQuery] = useState("");
  const liveGroup = useMemo(() => filterLiveSessions(liveSessions, query), [liveSessions, query]);
  const groups = useMemo(() => filterProjects(history?.projects ?? [], query), [history?.projects, query]);
  const active = findActiveSession(liveGroup, groups, current);
  const total = liveGroup.length + groups.reduce((sum, project) => sum + project.sessions.length, 0);

  async function selectSession(option: DropdownSession | null) {
    if (!option) return;
    if (option.source === "live") {
      await client?.selectSession(option.session.id);
    } else {
      await loadStaticSession(option.session.id);
    }
    setQuery("");
    onClose();
  }

  return (
    <Combobox value={active} onChange={(session: DropdownSession | null) => void selectSession(session)}>
      <div className={cn("session-dropdown", open && "show")}>
        <div className="session-search-box">
          <ComboboxInput
            className="session-search-input"
            displayValue={(option: DropdownSession | null) => query || option?.session.summary || ""}
            onChange={(event) => setQuery(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            placeholder="Search sessions..."
          />
        </div>
        <ComboboxOptions static className="session-dropdown-list">
          {total === 0 ? <div className="session-dropdown-empty">{query ? "No sessions found" : "No sessions yet"}</div> : null}
          {liveGroup.length > 0 ? <LiveSessionGroup current={current} name={runtimeProjectRoot || "Current workspace"} query={query} sessions={liveGroup} /> : null}
          {groups.map((project) => (
            <StaticSessionGroup current={current} key={project.projectCode} project={project} query={query} />
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

function LiveSessionGroup({ current, name, query, sessions }: { current: string | null; name: string; query: string; sessions: SessionSummary[] }) {
  return (
    <div className="session-dropdown-group">
      <div className="session-dropdown-group-title">{shortProjectName(name)}</div>
      {sessions.map((session) => (
        <ComboboxOption
          className={cn(
            "session-dropdown-item",
            session.id === current && "active",
          )}
          key={session.id}
          value={{ source: "live", session }}
        >
          <span className="session-dropdown-summary">{highlightText(session.summary || "Untitled", query)}</span>
          <span className="session-dropdown-time">{formatSessionDate(session.updateTime)}</span>
        </ComboboxOption>
      ))}
    </div>
  );
}

type StaticSessionGroupProps = {
  project: StaticProjectHistory;
  current: string | null;
  query: string;
};

function StaticSessionGroup({ project, current, query }: StaticSessionGroupProps) {
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
          value={{ source: "static", session }}
        >
          <span className="session-dropdown-summary">{highlightText(session.summary || "Untitled", query)}</span>
          <span className="session-dropdown-time">{formatSessionDate(session.updateTime)}</span>
        </ComboboxOption>
      ))}
    </div>
  );
}

function filterLiveSessions(sessions: SessionSummary[], query: string): SessionSummary[] {
  const normalized = query.trim().toLowerCase();
  return normalized
    ? sessions.filter((session) => (session.summary || "Untitled").toLowerCase().includes(normalized))
    : sessions;
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

function findActiveSession(liveSessions: SessionSummary[], projects: StaticProjectHistory[], current: string | null): DropdownSession | null {
  if (!current) return null;
  const live = liveSessions.find((item) => item.id === current);
  if (live) return { source: "live", session: live };
  for (const project of projects) {
    const session = project.sessions.find((item) => item.id === current);
    if (session) return { source: "static", session };
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
