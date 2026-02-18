import type { KbSearchResult } from "../../lib/api";

type KBSearchProps = {
  query: string;
  searching: boolean;
  results: KbSearchResult[];
  hasSearched: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
};

function formatScore(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(4);
}

export function KBSearch({
  query,
  searching,
  results,
  hasSearched,
  onQueryChange,
  onSearch,
}: KBSearchProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">Search</h3>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="min-w-64 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="Search knowledge base..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          disabled={searching}
        />
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSearch}
          disabled={searching || !query.trim()}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {searching ? <p className="text-sm text-slate-500">Searching...</p> : null}
      {!searching && hasSearched && results.length === 0 ? (
        <p className="text-sm text-slate-500">No matching chunks found.</p>
      ) : null}

      {!searching && results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((result) => (
            <li key={result.chunkId} className="rounded-md border border-slate-200 p-3">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{result.docTitle}</p>
                <span className="text-xs text-slate-500">Score: {formatScore(result.score)}</span>
              </div>
              <p className="text-sm text-slate-600">{result.snippet}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
