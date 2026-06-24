import ChatPanel from "../chat/ChatPanel";
import ModelPanel from "../model/ModelPanel";
import PermissionPanel from "../permissions/PermissionPanel";
import ProcessPanel from "../processes/ProcessPanel";
import RuntimeStatusBar from "../runtime/RuntimeStatusBar";
import SessionSidebar from "../sessions/SessionSidebar";

export default function AppShell() {
  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#0f1117] text-slate-100">
      <div className="flex min-h-0 flex-1">
        <SessionSidebar />
        <ChatPanel />
        <aside className="hidden w-80 shrink-0 flex-col gap-3 border-l border-white/10 bg-[#141821] p-4 xl:flex">
          <ModelPanel />
          <PermissionPanel />
          <ProcessPanel />
        </aside>
      </div>
      <RuntimeStatusBar />
    </main>
  );
}
