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
      <h3 className="text-sm font-semibold text-slate-800">Upload</h3>

      <input
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="block w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onFileChange(file);
        }}
        disabled={uploading}
      />

      <div className="flex items-center gap-3">
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onUpload}
          disabled={uploading || !selectedFileName}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        <span className="text-xs text-slate-500">
          {selectedFileName || "No file selected"}
        </span>
      </div>
    </section>
  );
}
