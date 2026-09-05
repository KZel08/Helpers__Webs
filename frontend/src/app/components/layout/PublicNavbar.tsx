// ─── PublicNavbar (public/landing top navigation) ────────────────────────────
// Unauthenticated marketing/landing navbar. Logo on the left, optional
// location selector + search in the centre, and account actions on the right.
// Compact, mobile-first, and responsive.
//
// The location selector reads from LocationContext. When no location has
// been selected, the button shows "Choose location".

import { Search, MapPin, ChevronRight } from "lucide-react";
import { HelpersLogo } from "../brand/HelpersLogo";
import { useLocationContext } from "../../../contexts/LocationContext";

export interface PublicNavbarProps {
  onSignIn?: () => void;
  onRegister?: () => void;
  onLogoClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onLocationClick?: () => void;
  /** Optional click handler for the location chip. */
}

export function PublicNavbar({
  onSignIn,
  onRegister,
  onLogoClick,
  onSearchSubmit,
  onLocationClick,
}: PublicNavbarProps) {
  const { location, status } = useLocationContext();

  const locationLabel = (() => {
    if (status === "detecting") return "Detecting location...";
    if (!location) return "Choose location";
    if (location.city && location.state) return `${location.city}, ${location.state}`;
    if (location.city) return location.city;
    return location.label || "Choose location";
  })();

  return (
    <header className="w-full bg-background/90 backdrop-blur-sm border-b border-border sticky top-0 z-40" style={{ WebkitBackdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center gap-3 sm:gap-4">

        {/* LEFT — Brand */}
        <button
          type="button"
          onClick={onLogoClick}
          aria-label="Helpers home"
          className="flex items-center gap-2 shrink-0 active:scale-[0.98] transition-transform"
        >
          <HelpersLogo size={32} showText />
        </button>

        {/* CENTRE — Location + Search (desktop only; hidden on mobile) */}
        <div className="hidden lg:flex flex-1 items-center gap-3 max-w-[640px] mx-auto">
          <button
            type="button"
            onClick={onLocationClick}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-primary-soft transition-colors shrink-0"
            aria-label="Change location"
          >
            <MapPin size={15} className="text-primary shrink-0" />
            <span className="truncate max-w-[140px]">{locationLabel}</span>
            <ChevronRight size={13} className="rotate-90 shrink-0" />
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget as HTMLFormElement);
              const query = String(data.get("q") || "").trim();
              if (query && onSearchSubmit) onSearchSubmit(query);
            }}
            className="flex items-center gap-2 flex-1 h-10 bg-muted rounded-xl px-3"
          >
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              name="q"
              placeholder="Search cleaning, plumbing, handyman…"
              className="bg-transparent flex-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>

        {/* Mobile spacer */}
        <div className="flex-1 lg:hidden" />

        {/* RIGHT — Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSignIn}
            className="hidden sm:inline-flex h-9 px-3 items-center text-sm font-semibold text-foreground rounded-xl hover:bg-muted transition-colors"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="h-9 px-4 inline-flex items-center justify-center text-sm font-bold text-white rounded-xl active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #7456D0 0%, #6648C2 100%)" }}
          >
            Register
          </button>
        </div>
      </div>
    </header>
  );
}

export default PublicNavbar;
