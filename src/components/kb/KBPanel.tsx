import { useEffect, useState } from "react";
import {
  kbDeleteDoc,
  kbListDocs,
  kbSearch,
  kbUpload,
  type KbDoc,
  type KbSearchResult,
} from "../../lib/api";
import { KBDocsTable } from "./KBDocsTable";
import { KBSearch } from "./KBSearch";
import { KBUpload } from "./KBUpload";

type KBPanelProps = {
  onError: (message: string) => void;
  onClearError: () => void;
};

export function KBPanel({ onError, onClearError }: KBPanelProps) {
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<KbSearchResult[]>([]);

  const loadDocs = async () => {
    setDocsLoading(true);
    try {
      const response = await kbListDocs();
      setDocs(response.docs);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to load KB documents.");
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocs();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      onError("Choose a .pdf or .txt file first.");
      return;
    }

    onClearError();
    setUploading(true);

    try {
      await kbUpload(selectedFile);
      setSelectedFile(null);
      await loadDocs();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: KbDoc) => {
    const confirmed = window.confirm(`Delete \"${doc.title}\" from the knowledge base?`);
    if (!confirmed) return;

    onClearError();
    setDeletingDocId(doc.id);
    try {
      await kbDeleteDoc(doc.id);
      await loadDocs();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete document.");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      onError("Search query cannot be empty.");
      return;
    }

    onClearError();
    setSearching(true);
    setHasSearched(true);

    try {
      const response = await kbSearch(query.trim(), 5);
      setResults(response.results);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to search knowledge base.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Knowledge Base</h2>
      </header>

      <KBUpload
        uploading={uploading}
        selectedFileName={selectedFile?.name ?? ""}
        onFileChange={setSelectedFile}
        onUpload={handleUpload}
      />

      <KBDocsTable
        docs={docs}
        loading={docsLoading}
        deletingDocId={deletingDocId}
        onDelete={handleDelete}
      />

      <KBSearch
        query={query}
        searching={searching}
        hasSearched={hasSearched}
        results={results}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />
    </section>
  );
}
