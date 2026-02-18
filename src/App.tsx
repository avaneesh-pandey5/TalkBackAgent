import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBanner } from "./components/ErrorBanner";
import { PromptConfigEditor } from "./components/PromptConfigEditor";
import { KBPanel } from "./components/kb/KBPanel";
import { RoomControls } from "./components/RoomControls";
import { StatusBadge } from "./components/StatusBadge";
import {
  dispatchAgent,
  fetchAgentConfig,
  fetchLiveKitToken,
  updateAgentConfig,
} from "./lib/api";
import { LiveKitRoomController, type RoomStatus } from "./lib/livekit";

function App() {
  const [roomName, setRoomName] = useState("agent-room");
  const [identity, setIdentity] = useState("web-user");
  const [status, setStatus] = useState<RoomStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
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
      });

      setMicEnabled(true);
    } catch {
      // Errors are already surfaced through onError callback.
      setStatus("disconnected");
    }
  };

  const handleDisconnect = async () => {
    await roomController.disconnect();
    setStatus("disconnected");
    setMicEnabled(false);
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">TalkBack Agent</h1>
        <StatusBadge status={status} />
      </header>

      <ErrorBanner message={error} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <RoomControls
              roomName={roomName}
              identity={identity}
              status={status}
              micEnabled={micEnabled}
              onRoomNameChange={setRoomName}
              onIdentityChange={setIdentity}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onMicToggle={handleMicToggle}
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <PromptConfigEditor
              value={systemPrompt}
              updatedAt={promptUpdatedAt}
              loading={isPromptLoading}
              saving={isPromptSaving}
              onChange={setSystemPrompt}
              onReload={handlePromptReload}
              onSave={handlePromptSave}
            />
          </section>
        </div>

        <KBPanel
          onError={setError}
          onClearError={() => setError(null)}
        />
      </div>

      <div ref={audioContainerRef} aria-hidden="true" className="hidden" />
    </main>
  );
}

export default App;
