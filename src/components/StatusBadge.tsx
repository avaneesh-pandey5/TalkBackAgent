import type { RoomStatus } from "../lib/livekit";

type StatusBadgeProps = {
  status: RoomStatus;
};

const statusClassMap: Record<RoomStatus, string> = {
  connected: "bg-green-100 text-green-800 border-green-200",
  connecting: "bg-amber-100 text-amber-800 border-amber-200",
  disconnected: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassMap[status]}`}
    >
      {status}
    </span>
  );
}
