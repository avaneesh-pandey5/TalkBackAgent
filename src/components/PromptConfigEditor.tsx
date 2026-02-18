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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">Agent Prompt</h2>
        <span className="text-xs text-slate-500">
          Last updated: {formatUpdatedAt(updatedAt)}
        </span>
      </div>

      <textarea
        className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading || saving}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSave}
          disabled={loading || saving}
        >
          {saving ? "Saving..." : "Save Prompt"}
        </button>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onReload}
          disabled={loading || saving}
        >
          {loading ? "Loading..." : "Reload Prompt"}
        </button>
      </div>
    </div>
  );
}
