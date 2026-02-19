import type { CSSProperties } from "react";
import type { RoomStatus } from "../../lib/livekit";

type OrbStageProps = {
  status: RoomStatus;
  userSpeaking: boolean;
  agentSpeaking: boolean;
  thinking: boolean;
  micEnabled: boolean;
  userTranscript: string;
  userTranscriptFinal: boolean;
  agentTranscript: string;
  agentTranscriptFinal: boolean;
  onConnectDisconnect: () => void;
  onMicToggle: () => void;
  onPromptOpen: () => void;
  onKbOpen: () => void;
  onSourcesOpen: () => void;
  onRoomOpen: () => void;
};

type ControlButton = {
  key: string;
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  angle: number;
  distance: number;
};

function getOrbStateLabel(
  status: RoomStatus,
  userSpeaking: boolean,
  agentSpeaking: boolean,
  thinking: boolean,
): string {
  if (status === "disconnected") return "Disconnected";
  if (status === "connecting") return "Connecting";
  if (agentSpeaking) return "Speaking";
  if (thinking) return "Thinking";
  if (userSpeaking) return "Listening";
  return "Connected";
}

export function OrbStage({
  status,
  userSpeaking,
  agentSpeaking,
  thinking,
  micEnabled,
  userTranscript,
  userTranscriptFinal,
  agentTranscript,
  agentTranscriptFinal,
  onConnectDisconnect,
  onMicToggle,
  onPromptOpen,
  onKbOpen,
  onSourcesOpen,
  onRoomOpen,
}: OrbStageProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const stateLabel = getOrbStateLabel(
    status,
    userSpeaking,
    agentSpeaking,
    thinking,
  );
  const orbModeClass =
    status === "disconnected"
      ? "orb--disconnected"
      : status === "connecting"
        ? "orb--connecting"
        : agentSpeaking
          ? "orb--agent"
          : thinking
            ? "orb--thinking"
            : userSpeaking
              ? "orb--user"
              : "orb--idle";

  const controls: ControlButton[] = [
    {
      key: "connect",
      label: isConnected
        ? "Disconnect"
        : isConnecting
          ? "Connecting..."
          : "Connect",
      icon: isConnected ? "⏹" : "▶",
      onClick: onConnectDisconnect,
      disabled: isConnecting,
      angle: -90,
      distance: 230,
    },
    {
      key: "mic",
      label: micEnabled ? "Mute Mic" : "Unmute Mic",
      icon: micEnabled ? "🎙" : "🔇",
      onClick: onMicToggle,
      disabled: !isConnected,
      angle: -22,
      distance: 240,
    },
    {
      key: "prompt",
      label: "Agent Prompt",
      icon: "✎",
      onClick: onPromptOpen,
      angle: 28,
      distance: 240,
    },
    {
      key: "kb",
      label: "Knowledge Base",
      icon: "⌘",
      onClick: onKbOpen,
      angle: 80,
      distance: 225,
    },
    {
      key: "sources",
      label: "RAG Sources",
      icon: "≣",
      onClick: onSourcesOpen,
      angle: 142,
      distance: 225,
    },
    {
      key: "room",
      label: "Room & Identity",
      icon: "⚙",
      onClick: onRoomOpen,
      angle: -150,
      distance: 225,
    },
  ];

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-12">
      <div className="orb-ambient-glow" aria-hidden="true" />
      <div className={`voice-orb ${orbModeClass}`} aria-hidden="true">
        <div className="voice-orb__core" />
        <div className="voice-orb__ring voice-orb__ring--one" />
        <div className="voice-orb__ring voice-orb__ring--two" />
      </div>

      <div className="absolute z-20 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          TalkBack Agent
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.2em] text-slate-300 sm:text-base">
          {stateLabel}
        </p>
      </div>

      <div className="absolute bottom-[1.2rem] left-4 z-20 w-[min(32vw,22rem)] max-w-[calc(100vw-2rem)] sm:left-6">
        <div
          className={`transcript-chip ${agentTranscriptFinal ? "transcript-chip--final" : "transcript-chip--interim"}`}
        >
          <span className="transcript-chip__label">Agent</span>
          <span className="transcript-chip__text">
            {agentTranscript || "Waiting for agent speech..."}
          </span>
        </div>
      </div>

      <div className="absolute bottom-[1.2rem] right-4 z-20 w-[min(32vw,22rem)] max-w-[calc(100vw-2rem)] sm:right-6">
        <div
          className={`transcript-chip ${userTranscriptFinal ? "transcript-chip--final" : "transcript-chip--interim"}`}
        >
          <span className="transcript-chip__label">You</span>
          <span className="transcript-chip__text">
            {userTranscript || "Start speaking to see live transcript..."}
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 hidden sm:block">
        {controls.map((control) => (
          <button
            key={control.key}
            type="button"
            className="orb-control"
            style={
              {
                "--orb-angle": `${control.angle}deg`,
                "--orb-distance": `${control.distance}px`,
              } as CSSProperties
            }
            onClick={control.onClick}
            disabled={control.disabled}
          >
            <span className="orb-control__icon" aria-hidden="true">
              {control.icon}
            </span>
            <span className="orb-control__label">{control.label}</span>
          </button>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-6 z-30 flex flex-wrap items-center justify-center gap-2 px-4 sm:hidden">
        {controls.map((control) => (
          <button
            key={control.key}
            type="button"
            className="orb-control-mobile"
            onClick={control.onClick}
            disabled={control.disabled}
          >
            <span aria-hidden="true">{control.icon}</span> {control.label}
          </button>
        ))}
      </div>
    </section>
  );
}
