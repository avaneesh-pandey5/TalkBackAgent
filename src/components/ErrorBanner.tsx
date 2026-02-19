type ErrorBannerProps = {
  message: string | null;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      className="rounded-2xl border border-rose-400/35 bg-rose-500/12 px-4 py-3 text-sm text-rose-100 shadow-[0_10px_40px_rgba(127,29,29,0.35)]"
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
