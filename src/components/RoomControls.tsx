type RoomControlsProps = {
  roomName: string;
  identity: string;
  status: "disconnected" | "connecting" | "connected";
  micEnabled: boolean;
  onRoomNameChange: (value: string) => void;
  onIdentityChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onMicToggle: () => void;
};

export function RoomControls({
  roomName,
  identity,
  status,
  micEnabled,
  onRoomNameChange,
  onIdentityChange,
  onConnect,
  onDisconnect,
  onMicToggle,
}: RoomControlsProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Session Controls</h2>
        <p className="mt-1 text-sm text-slate-600">Dispatch the agent, connect to LiveKit, and control your microphone.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Room Name
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            value={roomName}
            onChange={(event) => onRoomNameChange(event.target.value)}
            disabled={isConnected || isConnecting}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Identity
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            value={identity}
            onChange={(event) => onIdentityChange(event.target.value)}
            disabled={isConnected || isConnecting}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onConnect}
          disabled={isConnected || isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </button>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onMicToggle}
          disabled={!isConnected}
        >
          {micEnabled ? "Mute Mic" : "Unmute Mic"}
        </button>
      </div>
    </div>
  );
}
