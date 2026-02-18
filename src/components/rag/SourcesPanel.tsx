import { useEffect, useState } from "react";
import { fetchSessionState, type SessionSource } from "../../lib/api";

type SourcesPanelProps = {
  roomName: string;
  connected: boolean;
  onError: (message: string) => void;
};

export function SourcesPanel({ roomName, connected, onError }: SourcesPanelProps) {
  const [sources, setSources] = useState<SessionSource[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !roomName.trim()) {
      setSources([]);
      setUpdatedAt(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      setLoading(true);
      try {
        const state = await fetchSessionState(roomName.trim());
        if (cancelled) return;

        setSources(state?.sources ?? []);
        setUpdatedAt(state?.updatedAt ?? null);
      } catch (err) {
        if (cancelled) return;
        onError(
          err instanceof Error ? err.message : "Failed to load session sources.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [connected, roomName, onError]);

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">RAG Sources Used</h2>
        <span className="text-xs text-slate-500">
          {updatedAt ? `Updated: ${new Date(updatedAt).toLocaleTimeString()}` : "No data"}
        </span>
      </header>

      {!connected ? (
        <p className="text-sm text-slate-500">Connect to a room to see sources.</p>
      ) : null}

      {connected && loading ? <p className="text-sm text-slate-500">Loading sources...</p> : null}

      {connected && !loading && sources.length === 0 ? (
        <p className="text-sm text-slate-500">No sources were used yet.</p>
      ) : null}

      {connected && sources.length > 0 ? (
        <ul className="space-y-3">
          {sources.map((source) => (
            <li key={source.chunkId} className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-800">{source.docTitle}</p>
              <p className="mt-1 text-sm text-slate-600">{source.snippet}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
