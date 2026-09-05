// ─── LoadingScreen (Full-page) ────────────────────────────────────────────────
// Full-page loading experience used while the application is resolving
// essential data (e.g. session restoration).
//
// Uses the Helpers logo with a gentle pulse animation.
// Does not render a WebGL canvas, does not block scroll after unmount,
// and respects reduced-motion preferences.

import { HelpersLogo } from "../brand/HelpersLogo";

export interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({
  message = "Loading...",
  className = "",
}: LoadingScreenProps) {
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 bg-background ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <style>{`
        @keyframes helpers-logo-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes helpers-loader-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        .helpers-logo-pulse {
          animation: helpers-logo-pulse 1.6s ease-in-out infinite;
          transform-origin: center;
        }
        .helpers-loader-dot {
          animation: helpers-loader-dot 1.2s ease-in-out infinite both;
        }
        @media (prefers-reduced-motion: reduce) {
          .helpers-logo-pulse,
          .helpers-loader-dot { animation: none; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-6">
        <div className="helpers-logo-pulse">
          <HelpersLogo size={72} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p
            className="text-foreground font-semibold tracking-tight"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "1rem",
            }}
          >
            {message}
          </p>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span
              className="helpers-loader-dot inline-block w-2 h-2 rounded-full"
              style={{ background: "#7456D0", animationDelay: "0s" }}
            />
            <span
              className="helpers-loader-dot inline-block w-2 h-2 rounded-full"
              style={{ background: "#4FC0E8", animationDelay: "0.15s" }}
            />
            <span
              className="helpers-loader-dot inline-block w-2 h-2 rounded-full"
              style={{ background: "#5BE7C4", animationDelay: "0.3s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
