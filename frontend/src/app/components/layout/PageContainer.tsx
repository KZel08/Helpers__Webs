// ─── PageContainer (global content width + horizontal padding) ────────────────
// Standardized centered content container used by the public/landing layout.
// Keeps the page content from stretching edge-to-edge on large desktops and
// provides consistent responsive padding.

import type { HTMLAttributes, ReactNode } from "react";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** When true, removes vertical padding. Useful for full-bleed sections. */
  flush?: boolean;
}

export function PageContainer({
  children,
  flush = false,
  className = "",
  ...rest
}: PageContainerProps) {
  return (
    <div
      className={`w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 ${flush ? "" : "py-8 sm:py-12 lg:py-16"} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default PageContainer;
