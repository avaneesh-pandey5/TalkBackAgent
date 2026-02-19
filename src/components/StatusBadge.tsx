import type { RoomStatus } from "../lib/livekit";

type StatusBadgeProps = {
  status: RoomStatus;
};

const statusClassMap: Record<RoomStatus, string> = {
  connected: "border-emerald-200 bg-emerald-50 text-emerald-800",
  connecting: "border-amber-200 bg-amber-50 text-amber-800",
  disconnected: "border-slate-200 bg-slate-100 text-slate-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] ${statusClassMap[status]}`}
    >
      {status}
    </span>
  );
}
