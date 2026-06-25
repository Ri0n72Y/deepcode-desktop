import ChatContainer from "../extension/Conversation";
import HeaderBar from "../extension/HeaderBar";

export default function AppShell() {
  return (
    <main className="app">
      <HeaderBar />
      <ChatContainer />
    </main>
  );
}
