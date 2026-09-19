// ─── LocationPicker (modal) ──────────────────────────────────────────────────
// Modal opened from the navbar / hero location buttons. Lets the user either:
//   1. Detect current location via the browser Geolocation API.
//   2. Search for a city/address and pick a suggestion.
//   3. Click on the map to select a location.
// Selecting an option calls onSelect which updates the global LocationContext.

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, X, Loader2, Navigation, AlertCircle } from "lucide-react";
import { searchLocations, reverseGeocode, type ResolvedLocation } from "../../../lib/location";
import { useLocationContext } from "../../../contexts/LocationContext";
import { MapComponent } from "./MapComponent";

export interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (loc: ResolvedLocation) => void;
}

export function LocationPicker({ isOpen, onClose, onSelect }: LocationPickerProps) {
  const ctx = useLocationContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResolvedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const lastQueryRef = useRef("");
  const isMapClickRef = useRef(false);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      lastQueryRef.current = q;
      setIsSearching(true);
      setSearchError(null);
      try {
        const list = await searchLocations(q);
        // Guard against stale responses
        if (lastQueryRef.current === q) {
          setResults(list);
          if (list.length === 0) {
            setSearchError(`No matches for "${q}"`);
          }
        }
      } catch {
        if (lastQueryRef.current === q) {
          setSearchError("Search failed. Please try again.");
        }
      } finally {
        if (lastQueryRef.current === q) setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSearchError(null);
      setMapError(null);
    }
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Sync selected coordinate with context location when not from map click
  useEffect(() => {
    if (!isMapClickRef.current && ctx.location) {
      setSelectedCoord({ latitude: ctx.location.latitude, longitude: ctx.location.longitude });
    }
    isMapClickRef.current = false;
  }, [ctx.location]);

  if (!isOpen) return null;

  const handleSelect = useCallback((loc: ResolvedLocation) => {
    ctx.setLocation(loc);
    onSelect?.(loc);
    onClose();
  }, [ctx, onSelect, onClose]);

  const handleMapClick = useCallback(async (coordinate: { latitude: number; longitude: number }) => {
    isMapClickRef.current = true;
    setIsReverseGeocoding(true);
    try {
      const loc = await reverseGeocode(coordinate.latitude, coordinate.longitude);
      ctx.setLocation(loc);
      setSelectedCoord({ latitude: loc.latitude, longitude: loc.longitude });
      onSelect?.(loc);
      onClose();
    } catch {
      // Keep the coordinate selected even if reverse geocoding fails
      setSelectedCoord({ latitude: coordinate.latitude, longitude: coordinate.longitude });
    } finally {
      setIsReverseGeocoding(false);
      isMapClickRef.current = false;
    }
  }, [ctx, reverseGeocode]);

  const handleSearchSelect = useCallback((loc: ResolvedLocation) => {
    setSelectedCoord({ latitude: loc.latitude, longitude: loc.longitude });
    handleSelect(loc);
  }, [handleSelect]);

  const handleCurrentLocation = useCallback(() => {
    ctx.detectCurrent();
  }, [ctx]);

  const handleMapError = useCallback((err: string) => {
    setMapError(err);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your location"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Choose location
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={16} className="text-foreground" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 h-11">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city or address…"
              className="bg-transparent flex-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {isSearching && <Loader2 size={16} className="text-muted-foreground animate-spin" />}
          </div>

          {/* Detect current location button */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={ctx.status === "detecting"}
            className="mt-3 w-full h-11 rounded-xl bg-primary-soft text-primary text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60"
          >
            {ctx.status === "detecting" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Detecting location...
              </>
            ) : (
              <>
                <Navigation size={16} />
                Use my current location
              </>
            )}
          </button>

          {ctx.errorMessage && ctx.status === "error" && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{ctx.errorMessage}</span>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="border-t border-border">
          <MapComponent
            coordinate={selectedCoord}
            onCoordinateSelect={handleMapClick}
            className="h-[300px]"
            mapError={setMapError}
          />
          {isReverseGeocoding && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-b-2xl">
              <div className="bg-card rounded-xl p-4 flex items-center gap-3 shadow-xl">
                <Loader2 size={18} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-foreground">Resolving address…</span>
              </div>
            </div>
          )}
          {mapError && (
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                {mapError}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3">
          {searchError && query.trim().length >= 2 && !isSearching ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchError}
            </div>
          ) : results.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {results.map((r, i) => (
                <li key={`${r.label}-${i}`}>
                  <button
                    type="button"
                    onClick={() => handleSearchSelect(r)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-muted active:bg-muted transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {r.city && r.state
                          ? `${r.city}, ${r.state}`
                          : r.city
                          ? r.city
                          : r.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.label}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length < 2 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Type a city or address to search.
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationPicker;
