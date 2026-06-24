import { useState } from "react";
import { PaperAirplaneIcon, StopIcon } from "@heroicons/react/24/solid";
import { useRuntimeClient } from "../../app/providers";
import { useRuntimeStore } from "../../stores/runtime-store";

export default function PromptComposer() {
  const [text, setText] = useState("");
  const client = useRuntimeClient();
  const loading = useRuntimeStore((state) => state.loading);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || loading || !client) {
      return;
    }
    setText("");
    await client.prompt({ text: trimmed });
  }

  async function interrupt() {
    await client?.interrupt();
  }

  return (
    <div className="border-t border-white/10 bg-[#11151d] p-4">
      <div className="flex gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
        <textarea
          className="min-h-20 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Ask DeepCode to inspect, edit, or explain this project..."
          value={text}
        />
        <div className="flex flex-col gap-2">
          <button className="rounded-lg bg-sky-500 p-2 text-white disabled:opacity-40" disabled={loading || !text.trim()} onClick={() => void submit()} type="button">
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
          <button className="rounded-lg border border-white/10 p-2 text-slate-300 disabled:opacity-40" disabled={!loading} onClick={() => void interrupt()} type="button">
            <StopIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
