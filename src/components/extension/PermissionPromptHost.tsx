import { Button } from "@headlessui/react";
import { CheckIcon, NoSymbolIcon, ShieldCheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRuntimeClient } from "../../app/providers";
import { usePermissionStore } from "../../stores/permission-store";
import { useRuntimeStore } from "../../stores/runtime-store";

export default function PermissionPromptHost() {
  const client = useRuntimeClient();
  const pending = usePermissionStore((state) => state.pending);
  const clear = usePermissionStore((state) => state.clear);
  const sessionStatus = useRuntimeStore((state) => state.sessionStatus);
  const item = pending[0];

  function resolveMockPermission() {
    clear();
  }

  async function denyMockPermission() {
    clear();
    await client?.interrupt();
  }

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
          <Button className="permission-close" onClick={() => void denyMockPermission()} type="button" aria-label="Close permission prompt">
            <XMarkIcon className="permission-action-icon" />
          </Button>
        </div>
        <div className="permission-tool">{item.name ?? "tool"}</div>
        <div className="permission-command">{item.command ?? "No command"}</div>
        {item.description ? <div className="permission-description">{item.description}</div> : null}
        <div className="permission-scope risk-medium">{item.scope ?? "unknown scope"}</div>
        <div className="permission-question">Proceed?</div>
        <div className="permission-actions">
          <Button className="permission-action permission-allow" onClick={resolveMockPermission} type="button">
            <CheckIcon className="permission-action-icon" />
            <span>Yes</span>
          </Button>
          <Button className="permission-action permission-always" onClick={resolveMockPermission} type="button">
            <ShieldCheckIcon className="permission-action-icon" />
            <span>Always allow</span>
          </Button>
          <Button className="permission-action permission-deny" onClick={() => void denyMockPermission()} type="button">
            <NoSymbolIcon className="permission-action-icon" />
            <span>No</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
