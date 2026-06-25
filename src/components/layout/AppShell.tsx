import ChatContainer from "../extension/ChatContainer";
import HeaderBar from "../extension/HeaderBar";

export default function AppShell() {
  return (
    <main className="app">
      <HeaderBar />
      <ChatContainer />
    </main>
  );
}
