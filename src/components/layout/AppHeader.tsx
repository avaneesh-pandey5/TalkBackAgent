import { StatusBadge } from "../StatusBadge";
import type { RoomStatus } from "../../lib/livekit";

type AppHeaderProps = {
  status: RoomStatus;
};

export function AppHeader({ status }: AppHeaderProps) {
  return (
    <header className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Voice Workspace</p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">TalkBack Agent</h1>
          <p className="mt-1 text-sm text-slate-600">Live conversation, prompt controls, and retrieval-backed context.</p>
        </div>
        <StatusBadge status={status} />
      </div>
    </header>
  );
}
