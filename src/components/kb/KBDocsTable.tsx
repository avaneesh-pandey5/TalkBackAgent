import type { KbDoc } from "../../lib/api";

type KBDocsTableProps = {
  docs: KbDoc[];
  loading: boolean;
  deletingDocId: string | null;
  onDelete: (doc: KbDoc) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function KBDocsTable({
  docs,
  loading,
  deletingDocId,
  onDelete,
}: KBDocsTableProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-100">Documents</h3>

      {loading ? <p className="text-sm text-slate-400">Loading documents...</p> : null}
      {!loading && docs.length === 0 ? (
        <p className="text-sm text-slate-400">No documents uploaded yet.</p>
      ) : null}

      {!loading && docs.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/20 bg-black/35">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Chunks</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {docs.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-3 py-2 text-slate-100">{doc.title}</td>
                  <td className="px-3 py-2 text-slate-300">{formatDate(doc.createdAt)}</td>
                  <td className="px-3 py-2 text-slate-300">{doc.chunkCount}</td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-rose-300/40 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onDelete(doc)}
                      disabled={deletingDocId === doc.id}
                    >
                      {deletingDocId === doc.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
