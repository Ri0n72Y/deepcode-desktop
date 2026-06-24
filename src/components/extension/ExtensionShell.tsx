import ChatContainer from "./ChatContainer";
import HeaderBar from "./HeaderBar";

export default function ExtensionShell() {
  return (
    <main className="app">
      <HeaderBar />
      <ChatContainer />
    </main>
  );
}
