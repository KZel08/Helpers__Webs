// ─── Loader (Inline / component-level) ──────────────────────────────────────
// Small inline loader used inside cards, lists, sections, etc.
// Designed to be centered, small, and cause minimal layout shift.

export type LoaderSize = "xs" | "sm" | "md" | "lg";

export interface LoaderProps {
  size?: LoaderSize;
  className?: string;
  label?: string;
}

const sizeMap: Record<LoaderSize, number> = {
  xs: 12,
  sm: 20,
  md: 32,
  lg: 48,
};

export function Loader({
  size = "md",
  className = "",
  label = "Loading",
}: LoaderProps) {
  const px = sizeMap[size];

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <style>{`
        @keyframes helpers-loader-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .helpers-inline-loader { animation: none !important; }
        }
      `}</style>
      <div
        className="rounded-full helpers-inline-loader"
        style={{
          width: px,
          height: px,
          border: `${Math.max(2, Math.round(px * 0.1))}px solid #EFEAFB`,
          borderTopColor: "#7456D0",
          borderRightColor: "#4FC0E8",
          animation: "helpers-loader-spin 0.9s linear infinite",
        }}
      />
    </div>
  );
}

export default Loader;
