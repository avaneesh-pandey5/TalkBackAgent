import type { ReactNode } from "react";

type OverlayPanelProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function OverlayPanel({
  open,
  title,
  subtitle,
  onClose,
  children,
}: OverlayPanelProps) {
  return (
    <div
      className={`fixed inset-0 z-40 transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/72 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        className={`absolute inset-x-0 bottom-0 top-16 mx-auto w-[min(96vw,980px)] rounded-t-3xl border border-cyan-500/20 bg-neutral-950/95 p-5 text-slate-100 shadow-[0_30px_90px_rgba(0,0,0,0.65)] transition duration-300 sm:top-12 sm:rounded-3xl sm:p-7 ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 sm:translate-y-5"
        }`}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className="max-h-[calc(100vh-11rem)] overflow-auto pr-1">{children}</div>
      </section>
    </div>
  );
}
