type PromptConfigEditorProps = {
  value: string;
  updatedAt: string | null;
  loading: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onReload: () => void;
  onSave: () => void;
};

function formatUpdatedAt(value: string | null): string {
  if (!value) return "Not loaded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function PromptConfigEditor({
  value,
  updatedAt,
  loading,
  saving,
  onChange,
  onReload,
  onSave,
}: PromptConfigEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Agent Prompt</h2>
        <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
          Updated: {formatUpdatedAt(updatedAt)}
        </span>
      </div>

      <textarea
        className="min-h-44 w-full rounded-2xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading || saving}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/55 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSave}
          disabled={loading || saving}
        >
          {saving ? "Saving..." : "Save Prompt"}
        </button>
        <button
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-cyan-300/45 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onReload}
          disabled={loading || saving}
        >
          {loading ? "Loading..." : "Reload Prompt"}
        </button>
      </div>
    </div>
  );
}
