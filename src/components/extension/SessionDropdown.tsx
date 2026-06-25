import { useMemo, useState } from "react";
import { useRuntimeClient } from "../../app/providers";
import type { SessionSummary } from "../../lib/runtime/types";
import { useSessionStore } from "../../stores/session-store";

type SessionDropdownProps = {
  open: boolean;
  onClose: () => void;
};

export default function SessionDropdown({ open, onClose }: SessionDropdownProps) {
  const client = useRuntimeClient();
  const sessions = useSessionStore((state) => state.list);
  const current = useSessionStore((state) => state.current);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupSessions(sessions, query), [sessions, query]);
  const total = groups.today.length + groups.yesterday.length + groups.pastWeek.length;

  async function selectSession(sessionId: string) {
    await client?.selectSession(sessionId);
    onClose();
  }

  return (
    <div className={`session-dropdown ${open ? "show" : ""}`}>
      <div className="session-search-box">
        <input
          className="session-search-input"
          onChange={(event) => setQuery(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          placeholder="Search sessions..."
          value={query}
        />
      </div>
      <div className="session-dropdown-list">
        {total === 0 ? <div className="session-dropdown-empty">{query ? "No sessions found" : "No sessions yet"}</div> : null}
        <SessionGroup current={current} label="Today" query={query} sessions={groups.today} onSelect={selectSession} />
        <SessionGroup current={current} label="Yesterday" query={query} sessions={groups.yesterday} onSelect={selectSession} />
        <SessionGroup current={current} label="Past Week" query={query} sessions={groups.pastWeek} onSelect={selectSession} />
      </div>
    </div>
  );
}

type SessionGroupProps = {
  label: string;
  sessions: SessionSummary[];
  current: string | null;
  query: string;
  onSelect: (sessionId: string) => Promise<void>;
};

function SessionGroup({ label, sessions, current, query, onSelect }: SessionGroupProps) {
  if (sessions.length === 0) return null;
  return (
    <div className="session-dropdown-group">
      <div className="session-dropdown-group-title">{label}</div>
      {sessions.map((session) => (
        <button
          className={`session-dropdown-item ${session.id === current ? "active" : ""}`}
          key={session.id}
          onClick={() => void onSelect(session.id)}
          type="button"
        >
          <span className="session-dropdown-summary">{highlightText(session.summary || "Untitled", query)}</span>
          <span className="session-dropdown-time">{formatSessionTime(session.updateTime)}</span>
        </button>
      ))}
    </div>
  );
}

function groupSessions(sessions: SessionSummary[], query: string) {
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? sessions.filter((session) => (session.summary || "Untitled").toLowerCase().includes(normalized)) : sessions;
  const today: SessionSummary[] = [];
  const yesterday: SessionSummary[] = [];
  const pastWeek: SessionSummary[] = [];
  const todayDate = startOfDay(new Date());
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const weekDate = new Date(todayDate);
  weekDate.setDate(todayDate.getDate() - 7);

  for (const session of filtered) {
    const updated = session.updateTime ? startOfDay(new Date(session.updateTime)) : todayDate;
    if (updated.getTime() === todayDate.getTime()) today.push(session);
    else if (updated.getTime() === yesterdayDate.getTime()) yesterday.push(session);
    else if (updated > weekDate) pastWeek.push(session);
  }
  return { today, yesterday, pastWeek };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatSessionTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
