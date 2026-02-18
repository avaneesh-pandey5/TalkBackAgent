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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Room Name
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={roomName}
            onChange={(event) => onRoomNameChange(event.target.value)}
            disabled={isConnected || isConnecting}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Identity
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={identity}
            onChange={(event) => onIdentityChange(event.target.value)}
            disabled={isConnected || isConnecting}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onConnect}
          disabled={isConnected || isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </button>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onMicToggle}
          disabled={!isConnected}
        >
          {micEnabled ? "Mute Mic" : "Unmute Mic"}
        </button>
      </div>
    </div>
  );
}
