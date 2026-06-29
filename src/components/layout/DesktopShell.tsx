import { useEffect, useState } from "react";
import { readStaticHistory, readStaticSkills } from "../../lib/deepcode-static/static-client";
import { flattenStaticHistory, useStaticHistoryStore } from "../../stores/static-history-store";
import { useSessionStore } from "../../stores/session-store";
import { useSkillStore } from "../../stores/skill-store";
import ChatContainerView from "../extension/ChatContainerView";
import HeaderBar from "../extension/HeaderBar";
import SettingsDialog from "../settings/SettingsDialog";
import DeepcodeSidebar from "../sidebar/DeepcodeSidebar";
import "./desktop-shell.css";

export default function DesktopShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setHistory = useStaticHistoryStore((state) => state.setHistory);
  const replaceSessions = useSessionStore((state) => state.replaceList);
  const setAvailableSkills = useSkillStore((state) => state.setAvailable);

  useEffect(() => {
    async function loadStaticData() {
      const [history, skills] = await Promise.all([readStaticHistory(), readStaticSkills()]);
      setHistory(history);
      replaceSessions(flattenStaticHistory(history.projects));
      setAvailableSkills(skills);
    }
    void loadStaticData();
  }, [replaceSessions, setAvailableSkills, setHistory]);

  return (
    <main className="desktop-shell">
      <DeepcodeSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <section className="desktop-chat-shell">
        <HeaderBar />
        <ChatContainerView />
      </section>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
