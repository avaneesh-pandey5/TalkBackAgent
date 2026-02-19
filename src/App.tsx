import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBanner } from "./components/ErrorBanner";
import { PromptConfigEditor } from "./components/PromptConfigEditor";
import { OverlayPanel } from "./components/layout/OverlayPanel";
import { KBPanel } from "./components/kb/KBPanel";
import { SourcesPanel } from "./components/rag/SourcesPanel";
import { OrbStage } from "./components/voice/OrbStage";
import {
  dispatchAgent,
  fetchAgentConfig,
  fetchLiveKitToken,
  updateAgentConfig,
} from "./lib/api";
import {
  LiveKitRoomController,
  type RoomStatus,
  type VoiceActivity,
} from "./lib/livekit";

function App() {
  const [roomName, setRoomName] = useState("agent-room");
  const [identity, setIdentity] = useState("web-user");
  const [status, setStatus] = useState<RoomStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [voiceActivity, setVoiceActivity] = useState<VoiceActivity>({
    userSpeaking: false,
    agentSpeaking: false,
  });
  const [thinking, setThinking] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showKb, setShowKb] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showRoomConfig, setShowRoomConfig] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [promptUpdatedAt, setPromptUpdatedAt] = useState<string | null>(null);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [isPromptSaving, setIsPromptSaving] = useState(false);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  const roomController = useMemo(() => new LiveKitRoomController(), []);

  useEffect(() => {
    const loadPromptConfig = async () => {
      setIsPromptLoading(true);
      try {
        const config = await fetchAgentConfig();
        setSystemPrompt(config.systemPrompt);
        setPromptUpdatedAt(config.updatedAt);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load agent prompt config.",
        );
      } finally {
        setIsPromptLoading(false);
      }
    };

    void loadPromptConfig();
  }, []);

  useEffect(() => {
    if (status !== "connected") {
      setThinking(false);
      return;
    }
    if (voiceActivity.agentSpeaking || voiceActivity.userSpeaking) {
      setThinking(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setThinking(false);
    }, 2200);
    setThinking(true);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status, voiceActivity.agentSpeaking, voiceActivity.userSpeaking]);

  useEffect(() => {
    return () => {
      void roomController.disconnect();
    };
  }, [roomController]);

  const handleConnect = async () => {
    if (!roomName.trim() || !identity.trim()) {
      setError("Room name and identity are required.");
      return;
    }

    setError(null);
    setStatus("connecting");

    try {
      await dispatchAgent({
        roomName: roomName.trim(),
      });

      const { token, url } = await fetchLiveKitToken({
        roomName: roomName.trim(),
        identity: identity.trim(),
      });

      await roomController.connect({
        token,
        url,
        audioContainer: audioContainerRef.current,
        onStatusChange: setStatus,
        onError: setError,
        onVoiceActivityChange: setVoiceActivity,
      });

      setMicEnabled(true);
    } catch {
      setStatus("disconnected");
      setVoiceActivity({ userSpeaking: false, agentSpeaking: false });
      setThinking(false);
    }
  };

  const handleDisconnect = async () => {
    await roomController.disconnect();
    setStatus("disconnected");
    setMicEnabled(false);
    setVoiceActivity({ userSpeaking: false, agentSpeaking: false });
    setThinking(false);
  };

  const handleMicToggle = async () => {
    const next = !micEnabled;
    try {
      await roomController.setMicrophoneEnabled(next);
      setMicEnabled(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update microphone.");
    }
  };

  const handlePromptReload = async () => {
    setError(null);
    setIsPromptLoading(true);
    try {
      const config = await fetchAgentConfig();
      setSystemPrompt(config.systemPrompt);
      setPromptUpdatedAt(config.updatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload prompt config.");
    } finally {
      setIsPromptLoading(false);
    }
  };

  const handlePromptSave = async () => {
    if (!systemPrompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }

    setError(null);
    setIsPromptSaving(true);
    try {
      const config = await updateAgentConfig(systemPrompt);
      setSystemPrompt(config.systemPrompt);
      setPromptUpdatedAt(config.updatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt config.");
    } finally {
      setIsPromptSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#070707]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,116,140,0.16),rgba(0,0,0,0)_42%),radial-gradient(circle_at_20%_15%,rgba(14,165,233,0.11),rgba(0,0,0,0)_35%)]" />
      <div className="relative z-10">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Voice Workspace</p>
          <p className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-cyan-100">
            {status}
          </p>
        </header>

        <div className="mx-auto w-full max-w-6xl px-3 pb-6 sm:px-6">
          <ErrorBanner message={error} />
        </div>

        <OrbStage
          status={status}
          userSpeaking={voiceActivity.userSpeaking}
          agentSpeaking={voiceActivity.agentSpeaking}
          thinking={thinking}
          micEnabled={micEnabled}
          onConnectDisconnect={() => {
            if (status === "connected") {
              void handleDisconnect();
            } else if (status !== "connecting") {
              void handleConnect();
            }
          }}
          onMicToggle={() => {
            void handleMicToggle();
          }}
          onPromptOpen={() => setShowPrompt(true)}
          onKbOpen={() => setShowKb(true)}
          onSourcesOpen={() => setShowSources(true)}
          onRoomOpen={() => setShowRoomConfig(true)}
        />
      </div>

      <OverlayPanel
        open={showPrompt}
        title="Agent Prompt"
        subtitle="Edit instructions used by the voice agent."
        onClose={() => setShowPrompt(false)}
      >
        <PromptConfigEditor
          value={systemPrompt}
          updatedAt={promptUpdatedAt}
          loading={isPromptLoading}
          saving={isPromptSaving}
          onChange={setSystemPrompt}
          onReload={handlePromptReload}
          onSave={handlePromptSave}
        />
      </OverlayPanel>

      <OverlayPanel
        open={showKb}
        title="Knowledge Base"
        subtitle="Upload files, manage documents, and run retrieval searches."
        onClose={() => setShowKb(false)}
      >
        <KBPanel
          onError={setError}
          onClearError={() => setError(null)}
        />
      </OverlayPanel>

      <OverlayPanel
        open={showSources}
        title="RAG Sources Used"
        subtitle={`Room: ${roomName}`}
        onClose={() => setShowSources(false)}
      >
        <SourcesPanel
          roomName={roomName}
          connected={status === "connected"}
          onError={setError}
        />
      </OverlayPanel>

      <OverlayPanel
        open={showRoomConfig}
        title="Room & Identity"
        subtitle="Update connection details used for dispatch and join."
        onClose={() => setShowRoomConfig(false)}
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Room Name
            <input
              className="rounded-xl border border-white/20 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              disabled={status === "connecting" || status === "connected"}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Identity
            <input
              className="rounded-xl border border-white/20 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              disabled={status === "connecting" || status === "connected"}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/55 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (status === "connected") {
                  void handleDisconnect();
                } else if (status !== "connecting") {
                  void handleConnect();
                }
              }}
              disabled={status === "connecting"}
            >
              {status === "connected" ? "Disconnect" : status === "connecting" ? "Connecting..." : "Connect"}
            </button>
          </div>
        </div>
      </OverlayPanel>

      <div ref={audioContainerRef} aria-hidden="true" className="hidden" />
    </main>
  );
}

export default App;
