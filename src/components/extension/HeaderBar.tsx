import { Button } from "@headlessui/react";
import { ChevronDownIcon, CommandLineIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useRuntimeClient } from "../../app/providers";
import { useSessionStore } from "../../stores/session-store";
import SessionDropdown from "./SessionDropdown";

export default function HeaderBar() {
  const client = useRuntimeClient();
  const sessions = useSessionStore((state) => state.list);
  const current = useSessionStore((state) => state.current);
  const [open, setOpen] = useState(false);
  const active = sessions.find((item) => item.id === current);

  return (
    <header className="header-container">
      <div className="header-left">
        <Button className={`session-selector ${open ? "open" : ""}`} onClick={() => setOpen((value) => !value)} type="button">
          <span className="session-logo" aria-hidden="true"><CommandLineIcon className="session-logo-icon" /></span>
          <span className="session-selector-title">
            <span className="session-title-text">{active?.summary ?? "Deep Code"}</span>
          </span>
          <ChevronDownIcon className="session-selector-icon" />
        </Button>
        <SessionDropdown open={open} onClose={() => setOpen(false)} />
      </div>
      <Button className="header-new-btn" title="New Chat" type="button" onClick={() => void client?.createNewSession()}>
        <PlusIcon className="header-new-icon" />
      </Button>
    </header>
  );
}
