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
    <section className="space-y-3 rounded-2xl border border-white/15 bg-black/25 p-2">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">RAG Sources Used</h2>
        <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
          {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : "No data"}
        </span>
      </header>

      {!connected ? (
        <p className="text-sm text-slate-400">Connect to a room to see sources.</p>
      ) : null}

      {connected && loading ? <p className="text-sm text-slate-400">Loading sources...</p> : null}

      {connected && !loading && sources.length === 0 ? (
        <p className="text-sm text-slate-400">No sources were used yet.</p>
      ) : null}

      {connected && sources.length > 0 ? (
        <ul className="space-y-3">
          {sources.map((source) => (
            <li key={source.chunkId} className="rounded-xl border border-white/15 bg-black/35 p-3">
              <p className="text-sm font-semibold text-slate-100">{source.docTitle}</p>
              <p className="mt-1 text-sm text-slate-300">{source.snippet}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
