// ─── SectionHeader (standardized section title + action link) ─────────────────
// Shared header for major sections. Title/subtitle on the left, optional
// action link on the right. Stacks vertically on mobile.

import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
  actionSlot?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionClick,
  className = "",
  actionSlot,
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-7 ${className}`}>
      <div>
        <h2
          className="text-xl sm:text-2xl font-bold text-foreground"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {(actionLabel || actionSlot) && (
        <div className="shrink-0">
          {actionSlot ? (
            actionSlot
          ) : (
            <button
              onClick={onActionClick}
              className="text-primary text-sm font-semibold inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              {actionLabel}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
