// ─── Helpers Brand Logo ──────────────────────────────────────────────────────
// Reusable brand logo component recreating the Helpers "H" mark using
// pure CSS / SVG — no external image dependency.
//
// Uses only the locked palette: #7456D0, #4FC0E8, #5BE7C4.

import type { CSSProperties } from "react";

export interface HelpersLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function HelpersLogo({
  size = 40,
  className = "",
  showText = false,
  textClassName = "",
}: HelpersLogoProps) {
  // Letter and inner geometry scale with the icon size.
  const letterFontSize = Math.round(size * 0.6);
  const cornerRadius = Math.round(size * 0.24);
  const strokeWidth = Math.max(2, Math.round(size * 0.08));

  const containerStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: cornerRadius,
    background: "linear-gradient(135deg, #7456D0 0%, #4FC0E8 100%)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(116, 86, 208, 0.15)",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="Helpers"
    >
      <span style={containerStyle} aria-hidden="true">
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer rounded square handled by container. This SVG draws the
              stylized "H" with rounded geometry. */}
          <path
            d={`M ${strokeWidth * 1.2} 6
                A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} ${strokeWidth * 1.2}
                L ${strokeWidth * 1.2} ${size - cornerRadius}
                A ${cornerRadius} ${cornerRadius} 0 0 0 ${cornerRadius} ${size - strokeWidth * 1.2}
                L 12 18
                L 12 30
                L 24 30
                L 24 18
                L ${24 + strokeWidth * 1.2} ${size - cornerRadius}
                A ${cornerRadius} ${cornerRadius} 0 0 0 ${24 + cornerRadius} ${size - strokeWidth * 1.2}
                L ${24 + strokeWidth * 1.2} ${strokeWidth * 1.2}
                A ${cornerRadius} ${cornerRadius} 0 0 1 ${24 - cornerRadius} ${strokeWidth * 1.2}
                L 24 18
                L 24 30
                L 12 30
                L 12 18
                L 12 ${strokeWidth * 1.2}
                A ${cornerRadius} ${cornerRadius} 0 0 1 ${strokeWidth * 1.2} ${strokeWidth * 1.2}
                Z`}
            fill="#FFFFFF"
            fillOpacity="0"
          />
          {/* Simpler, more reliable H geometry using two rounded
              vertical bars + a connecting crossbar. */}
          <rect
            x={size * 0.18}
            y={size * 0.14}
            width={size * 0.16}
            height={size * 0.72}
            rx={size * 0.06}
            ry={size * 0.06}
            fill="#FFFFFF"
          />
          <rect
            x={size * 0.66}
            y={size * 0.14}
            width={size * 0.16}
            height={size * 0.72}
            rx={size * 0.06}
            ry={size * 0.06}
            fill="#FFFFFF"
          />
          <rect
            x={size * 0.18}
            y={size * 0.42}
            width={size * 0.64}
            height={size * 0.16}
            rx={size * 0.06}
            ry={size * 0.06}
            fill="#FFFFFF"
          />
        </svg>
      </span>
      {showText && (
        <span
          className={`text-foreground font-bold tracking-tight ${textClassName}`}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: Math.max(16, Math.round(size * 0.42)),
            lineHeight: 1,
          }}
        >
          Helpers
        </span>
      )}
    </span>
  );
}

export default HelpersLogo;
