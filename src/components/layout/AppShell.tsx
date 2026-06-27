import ChatContainerView from "../extension/ChatContainerView";
import HeaderBar from "../extension/HeaderBar";

export default function AppShell() {
  return (
    <main className="app">
      <HeaderBar />
      <ChatContainerView />
    </main>
  );
}
