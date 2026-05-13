import { tokens } from "@/lib/tokens";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{
        background: tokens.colors.danger[50],
        border: `1px solid ${tokens.colors.danger[300]}`,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="mt-0.5 shrink-0"
        style={{ color: tokens.colors.danger[600] }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 8v4m0 4h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p className="flex-1 text-sm" style={{ color: tokens.colors.danger[700] }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium shrink-0"
          style={{ color: tokens.colors.danger[600] }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
