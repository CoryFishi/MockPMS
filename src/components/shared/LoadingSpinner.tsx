export default function LoadingSpinner({ loadingText }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 z-30 min-h-auto"
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
      <p className={loadingText ? "mt-4" : "sr-only"}>{loadingText || "Loading..."}</p>
    </div>
  );
}
