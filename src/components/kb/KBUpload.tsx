type KBUploadProps = {
  uploading: boolean;
  selectedFileName: string;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
};

export function KBUpload({
  uploading,
  selectedFileName,
  onFileChange,
  onUpload,
}: KBUploadProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-100">Upload</h3>

      <input
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="block w-full cursor-pointer rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-slate-100 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-200 hover:file:bg-white/20"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onFileChange(file);
        }}
        disabled={uploading}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/55 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onUpload}
          disabled={uploading || !selectedFileName}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        <span className="text-xs text-slate-400">
          {selectedFileName || "No file selected"}
        </span>
      </div>
    </section>
  );
}
