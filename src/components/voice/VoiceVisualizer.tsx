import type { RoomStatus } from "../../lib/livekit";

type VoiceVisualizerProps = {
  status: RoomStatus;
  roomName: string;
  micEnabled: boolean;
  userSpeaking: boolean;
  agentSpeaking: boolean;
};

function buildWaveBars(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

export function VoiceVisualizer({
  status,
  roomName,
  micEnabled,
  userSpeaking,
  agentSpeaking,
}: VoiceVisualizerProps) {
  const isConnected = status === "connected";
  const mode = !isConnected
    ? "offline"
    : agentSpeaking
      ? "agent"
      : userSpeaking
        ? "user"
        : "idle";

  const modeLabel =
    mode === "offline"
      ? "Disconnected"
      : mode === "agent"
        ? "Agent speaking"
        : mode === "user"
          ? "You are speaking"
          : "Listening";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="pointer-events-none absolute inset-0 vv-grid-bg" aria-hidden="true" />
      <div className="relative z-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Voice Visualizer</p>
            <h2 className="text-xl font-semibold text-slate-900">Live Room: {roomName || "-"}</h2>
            <p className="mt-1 text-sm text-slate-600">{modeLabel}</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            Mic: {micEnabled ? "On" : "Muted"}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">User</p>
            <div className="flex h-24 items-end gap-1.5 overflow-hidden">
              {buildWaveBars(24).map((bar) => (
                <span
                  key={bar}
                  className={`vv-wave-bar ${mode === "user" ? "vv-wave-bar--active" : "vv-wave-bar--idle"}`}
                  style={{ animationDelay: `${bar * 80}ms` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Agent</p>
            <div className="flex h-24 items-center justify-center gap-6">
              <div className={`vv-orb ${mode === "agent" ? "vv-orb--active" : "vv-orb--idle"}`}>
                <span className="vv-orb-core" />
                <span className="vv-orb-ring" />
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {buildWaveBars(8).map((bar) => (
                  <span
                    key={bar}
                    className={`vv-eq-bar ${mode === "agent" ? "vv-eq-bar--active" : "vv-eq-bar--idle"}`}
                    style={{ animationDelay: `${bar * 110}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
