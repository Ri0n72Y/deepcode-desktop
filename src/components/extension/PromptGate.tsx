import { useRuntimeClient } from "../../app/providers";
import { usePermissionStore } from "../../stores/permission-store";
import { useRuntimeStore } from "../../stores/runtime-store";

export default function PromptGate() {
  const client = useRuntimeClient();
  const pending = usePermissionStore((state) => state.pending);
  const sessionStatus = useRuntimeStore((state) => state.sessionStatus);
  const item = pending[0];

  if (sessionStatus !== "ask_permission" || !item) {
    return <div className="permission-prompt-host" hidden />;
  }

  return (
    <div className="permission-prompt-host">
      <div className="permission-card">
        <div className="permission-header">
          <div>
            <div className="permission-title">Review required</div>
            <div className="permission-progress">1/{pending.length}</div>
          </div>
          <button className="permission-close" onClick={() => void client?.interrupt()} type="button">×</button>
        </div>
        <div className="permission-tool">{item.name ?? "tool"}</div>
        <div className="permission-command">{item.command ?? "No command"}</div>
        {item.description ? <div className="permission-description">{item.description}</div> : null}
        <div className="permission-scope risk-medium">{item.scope ?? "unknown scope"}</div>
        <div className="permission-question">Proceed?</div>
        <div className="permission-actions">
          <button className="permission-action permission-allow" type="button">Yes</button>
          <button className="permission-action permission-always" type="button">Always allow</button>
          <button className="permission-action permission-deny" type="button">No</button>
        </div>
      </div>
    </div>
  );
}
