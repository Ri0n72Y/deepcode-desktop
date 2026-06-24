import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import MessageItem from "./MessageItem";
import PromptComposer from "./PromptComposer";

export default function ChatPanel() {
  const messages = useChatStore((state) => state.messages);
  const loading = useRuntimeStore((state) => state.loading);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#0f1117]">
      <header className="border-b border-white/10 px-5 py-3">
        <div className="text-sm font-semibold text-slate-100">Chat</div>
        <div className="text-xs text-slate-500">VSCode webview semantics, desktop transport.</div>
      </header>
      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="mx-auto mt-24 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="text-lg font-semibold text-slate-100">Start with a prompt</div>
            <p className="mt-2 text-sm text-slate-400">This PR uses a mock runtime. Tauri host-owned server wiring starts after the UI foundation is stable.</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
      {loading ? <div className="border-t border-sky-400/20 bg-sky-400/10 px-5 py-2 text-xs text-sky-100">DeepCode is working...</div> : null}
      <PromptComposer />
    </section>
  );
}
