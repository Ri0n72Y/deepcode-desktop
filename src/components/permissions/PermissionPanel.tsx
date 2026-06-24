import { usePermissionStore } from "../../stores/permission-store";

export default function PermissionPanel() {
  const pending = usePermissionStore((state) => state.pending);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <h2 className="text-sm font-semibold text-slate-100">Permissions</h2>
      {pending.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No pending items.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-xs text-slate-300">
          {pending.map((item, index) => (
            <li className="rounded-lg bg-amber-400/10 p-2" key={`${item.toolCallId ?? "item"}-${index}`}>
              {item.description ?? item.scope ?? "Review item"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
