// ─── PublicFooter (multi-column public/landing footer) ────────────────────────
// Dark-themed multi-column footer for the public marketing/landing layout.
// Columns: brand + description, popular services, for customers, professionals.
// Bottom bar: copyright (left) and legal links (right).

import { HelpersLogo } from "../brand/HelpersLogo";

export interface PublicFooterLink {
  label: string;
  /** Click handler. If omitted AND `disabled` is true, the link is rendered as plain text. */
  onClick?: () => void;
  /** If true, renders the link as plain muted text with no click behavior. */
  disabled?: boolean;
  href?: string;
}

export interface PublicFooterProps {
  description?: string;
  popularServices?: PublicFooterLink[];
  forCustomers?: PublicFooterLink[];
  forProfessionals?: PublicFooterLink[];
  legalLinks?: PublicFooterLink[];
  copyrightText?: string;
  className?: string;
}

export function PublicFooter({
  description = "The premier modern service marketplace connecting households and businesses with vetted local trade professionals and home-services experts.",
  popularServices = [],
  forCustomers = [],
  forProfessionals = [],
  legalLinks = [],
  copyrightText = `© ${new Date().getFullYear()} Helpers Marketplace, Inc. All rights reserved.`,
  className = "",
}: PublicFooterProps) {
  const renderLink = (link: PublicFooterLink, i: number) => {
    const isInteractive = !link.disabled && typeof link.onClick === "function";
    return (
      <li key={`${link.label}-${i}`}>
        {isInteractive ? (
          <button
            type="button"
            onClick={link.onClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
          >
            {link.label}
          </button>
        ) : (
          <span
            className="text-sm text-muted-foreground/60 select-none"
            aria-disabled="true"
          >
            {link.label}
          </span>
        )}
      </li>
    );
  };

  return (
    <footer className={`bg-[#0F1115] text-foreground ${className}`}>
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand + description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <HelpersLogo size={32} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {description}
            </p>
          </div>

          {/* Popular services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-foreground mb-4">
              Popular services
            </h4>
            <ul className="flex flex-col gap-2.5">
              {popularServices.length > 0 ? (
                popularServices.map(renderLink)
              ) : (
                <li className="text-sm text-muted-foreground/70">—</li>
              )}
            </ul>
          </div>

          {/* For customers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-foreground mb-4">
              For customers
            </h4>
            <ul className="flex flex-col gap-2.5">
              {forCustomers.length > 0 ? (
                forCustomers.map(renderLink)
              ) : (
                <li className="text-sm text-muted-foreground/70">—</li>
              )}
            </ul>
          </div>

          {/* Professionals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-foreground mb-4">
              Professionals
            </h4>
            <ul className="flex flex-col gap-2.5">
              {forProfessionals.length > 0 ? (
                forProfessionals.map(renderLink)
              ) : (
                <li className="text-sm text-muted-foreground/70">—</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgba(255,255,255,0.08)]">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{copyrightText}</p>
          {legalLinks.length > 0 && (
            <ul className="flex items-center gap-5">
              {legalLinks.map((link, i) => {
                const isInteractive = !link.disabled && typeof link.onClick === "function";
                return (
                  <li key={`${link.label}-${i}`}>
                    {isInteractive ? (
                      <button
                        type="button"
                        onClick={link.onClick}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <span
                        className="text-xs text-muted-foreground/60 select-none"
                        aria-disabled="true"
                      >
                        {link.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
