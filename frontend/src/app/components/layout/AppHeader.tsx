// ─── AppHeader (Customer top navigation) ────────────────────────────────────
// Reusable top header for the customer-facing application.
// Shows the brand on the left and contextual actions on the right.
// Designed mobile-first, remains compact and unobtrusive.

import { Bell, User } from "lucide-react";
import { HelpersLogo } from "../brand/HelpersLogo";

export interface AppHeaderProps {
  /** Optional notification button click handler. If omitted, the bell is hidden. */
  onNotificationsClick?: () => void;
  /** Optional profile button click handler. If omitted, the profile button is hidden. */
  onProfileClick?: () => void;
  /** Optional right-side custom node. Rendered before the icon buttons. */
  rightSlot?: React.ReactNode;
  /** Optional additional className. */
  className?: string;
  /** Hide the wordmark text (logo only). */
  compact?: boolean;
}

export function AppHeader({
  onNotificationsClick,
  onProfileClick,
  rightSlot,
  className = "",
  compact = false,
}: AppHeaderProps) {
  return (
    <header
      className={`shrink-0 w-full px-4 py-2.5 bg-background/90 backdrop-blur-sm border-b border-border z-30 ${className}`}
      style={{ WebkitBackdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center justify-between gap-2 max-w-screen-xl mx-auto">
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2 active:scale-[0.98] transition-transform"
          aria-label="Helpers home"
        >
          <HelpersLogo size={32} showText={!compact} />
        </button>

        <div className="flex items-center gap-2">
          {rightSlot}
          {onNotificationsClick && (
            <button
              type="button"
              onClick={onNotificationsClick}
              aria-label="Notifications"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform hover:bg-primary-soft"
            >
              <Bell size={18} className="text-foreground" />
            </button>
          )}
          {onProfileClick && (
            <button
              type="button"
              onClick={onProfileClick}
              aria-label="Open profile"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform hover:bg-primary-soft"
            >
              <User size={18} className="text-foreground" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
