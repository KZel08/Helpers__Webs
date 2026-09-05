// ─── ServiceMarketplaceCard ───────────────────────────────────────────────────
// Reusable service card for the public/landing "Most Popular Services" section.
// Displays: optional image (or clean fallback), category badge, title,
// helper name, rating (if available), description, price, and action buttons.
// Bottom action area uses `margin-top: auto` to keep cards aligned.

import { Star, Clock, MapPin, Shield } from "lucide-react";
import type { ServiceData } from "../../lib/api";

export interface ServiceMarketplaceCardProps {
  service: ServiceData;
  onDetails?: (id: string) => void;
  onBook?: (id: string) => void;
}

export function ServiceMarketplaceCard({
  service,
  onDetails,
  onBook,
}: ServiceMarketplaceCardProps) {
  const title = service.title ?? service.name ?? "Service";
  const categoryName = service.category?.name;
  const helperName = service.helper?.user
    ? `${service.helper.user.firstName} ${service.helper.user.lastName ?? ""}`.trim()
    : "";
  const price =
    typeof service.price === "number"
      ? `₹${service.price.toLocaleString()}`
      : service.price ?? "—";
  const priceType = (service.priceType ?? "fixed").toLowerCase();
  const rating =
    typeof service.helper?.rating === "number" ? service.helper.rating : null;
  const hasImage = Boolean(service.media?.[0]?.url);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Image / fallback */}
      <div className="relative w-full aspect-[16/9] bg-muted">
        {hasImage ? (
          <img
            src={service.media![0]!.url}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(116,86,208,0.10) 0%, rgba(79,192,232,0.10) 100%)",
            }}
          >
            <span
              className="text-3xl font-bold text-primary"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {(categoryName ?? "S").charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Category badge */}
        {categoryName && (
          <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.85)] backdrop-blur-sm text-foreground">
            {categoryName}
          </span>
        )}

        {/* Rating badge */}
        {rating !== null && rating > 0 && (
          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground inline-flex items-center gap-1">
            <Star size={10} className="text-[#F59E0B]" fill="#F59E0B" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3
          className="text-base font-bold text-foreground leading-snug line-clamp-2"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h3>

        {helperName && (
          <p className="text-xs text-muted-foreground mt-1.5">by {helperName}</p>
        )}

        {service.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
          {service.duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {service.duration} min
            </span>
          ) : null}
          {rating !== null && rating > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Shield size={11} />
              Verified
            </span>
          ) : null}
        </div>

        {/* Bottom action area */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <div>
            <p
              className="text-foreground font-bold text-lg"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {price}
            </p>
            <p className="text-muted-foreground text-[10px]">per {priceType}</p>
          </div>
          <div className="flex items-center gap-2">
            {onDetails && (
              <button
                type="button"
                onClick={() => onDetails(service.id)}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-foreground bg-muted hover:bg-primary-soft hover:text-primary transition-colors"
              >
                Details
              </button>
            )}
            {onBook && (
              <button
                type="button"
                onClick={() => onBook(service.id)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform"
                style={{
                  background:
                    "linear-gradient(135deg, #7456D0 0%, #6648C2 100%)",
                }}
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceMarketplaceCard;
