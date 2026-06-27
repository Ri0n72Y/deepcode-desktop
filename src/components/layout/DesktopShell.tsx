import { useState } from "react";
import ChatContainerView from "../extension/ChatContainerView";
import HeaderBar from "../extension/HeaderBar";
import SettingsDialog from "../settings/SettingsDialog";
import DeepcodeSidebar from "../sidebar/DeepcodeSidebar";
import "./desktop-shell.css";

export default function DesktopShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);

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
