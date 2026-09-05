// ─── Location service ──────────────────────────────────────────────────────────
// Provider-agnostic abstraction for browser geolocation and reverse
// geocoding / place search.
//
// Primary provider: Google Maps Geocoding API (client-side key).
//   - Uses VITE_GOOGLE_MAPS_API_KEY from the existing .env (already
//     provisioned in this project).
//   - Restricted by HTTP referrer on the Google Cloud Console; never
//     bundle server-side keys here.
//
// Fallback: OpenStreetMap Nominatim (no API key, rate-limited but fine
// for the public/landing "search a city" UX).
//
// All UI components must call these functions instead of touching
// window.google / fetch directly. The provider implementation can be
// swapped without changing the call sites.

export interface Coordinates {
  latitude: number;
  longitude: number;
  /** Optional accuracy radius in meters. */
  accuracy?: number;
}

export interface ResolvedLocation {
  /** Human-readable short label, e.g. "San Francisco, CA". */
  label: string;
  /** Latitude. 0 when unknown. */
  latitude: number;
  /** Longitude. 0 when unknown. */
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  /** Source of the result. */
  source: "geolocation" | "search" | "stored" | "fallback";
}

export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

export interface GeolocationResult {
  status: GeolocationStatus;
  coordinates?: Coordinates;
  /** Human-readable error message for non-granted states. */
  message?: string;
}

// ─── Storage key ───────────────────────────────────────────────────────────
const STORAGE_KEY = "helpers.selectedLocation.v1";

// ─── Helpers ───────────────────────────────────────────────────────────────
function safeStorageGet(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeStorageSet(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

function getGoogleKey(): string | null {
  // import.meta.env is the Vite-native way to read env vars.
  const key = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_GOOGLE_MAPS_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

function formatLabel(parts: {
  city?: string;
  state?: string;
  country?: string;
}): string {
  const city = parts.city?.trim();
  const state = parts.state?.trim();
  const country = parts.country?.trim();
  if (city && state) return `${city}, ${state}`;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (state) return state;
  if (country) return country;
  return "Unknown location";
}

// ─── 1. getCurrentCoordinates ───────────────────────────────────────────────
/**
 * Request the browser for the user's coordinates.
 * Never throws; always returns a typed result.
 */
export function getCurrentCoordinates(
  timeoutMs: number = 10000,
): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({
        status: "unavailable",
        message: "Geolocation is not supported by this browser.",
      });
      return;
    }

    resolve({ status: "requesting" });

    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({
        status: "timeout",
        message: "Location request timed out.",
      });
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve({
          status: "granted",
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        });
      },
      (err) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (err.code === err.PERMISSION_DENIED) {
          resolve({
            status: "denied",
            message: "Location permission was denied.",
          });
        } else if (err.code === err.TIMEOUT) {
          resolve({ status: "timeout", message: "Location request timed out." });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          resolve({
            status: "unavailable",
            message: "Location information is unavailable.",
          });
        } else {
          resolve({
            status: "error",
            message: err.message || "Failed to detect location.",
          });
        }
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs },
    );
  });
}

// ─── 2. reverseGeocode ──────────────────────────────────────────────────────
/**
 * Convert coordinates into a human-readable ResolvedLocation.
 * Tries Google first (if a key is available), falls back to Nominatim.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ResolvedLocation> {
  const key = getGoogleKey();
  if (key) {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as {
          status: string;
          results: Array<{
            formatted_address: string;
            address_components: Array<{ types: string[]; long_name: string; short_name: string }>;
          }>;
        };
        if (data.status === "OK" && data.results.length > 0) {
          return parseGoogleResult(data.results[0], latitude, longitude, "geolocation");
        }
      }
    } catch {
      /* fall through */
    }
  }

  // Fallback: Nominatim
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        display_name?: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
          region?: string;
          country?: string;
        };
      };
      const a = data.address ?? {};
      const city = a.city || a.town || a.village;
      return {
        label:
          data.display_name || formatLabel({ city, state: a.state, country: a.country }),
        latitude,
        longitude,
        city,
        state: a.state || a.region,
        country: a.country,
        source: "geolocation",
      };
    }
  } catch {
    /* fall through */
  }

  return {
    label: formatLabel({}),
    latitude,
    longitude,
    source: "geolocation",
  };
}

// ─── 3. searchLocations ─────────────────────────────────────────────────────
/**
 * Search for a location by free-text query (city name, address, etc.).
 * Returns up to 5 suggestions.
 */
export async function searchLocations(
  query: string,
): Promise<ResolvedLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = getGoogleKey();
  if (key) {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as {
          status: string;
          results: Array<{
            formatted_address: string;
            geometry: { location: { lat: number; lng: number } };
            address_components: Array<{ types: string[]; long_name: string; short_name: string }>;
          }>;
        };
        if (data.status === "OK" && data.results.length > 0) {
          return data.results
            .slice(0, 5)
            .map((r) => parseGoogleResult(r, r.geometry.location.lat, r.geometry.location.lng, "search"));
        }
      }
    } catch {
      /* fall through */
    }
  }

  // Fallback: Nominatim
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{
        display_name?: string;
        lat: string;
        lon: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
          region?: string;
          country?: string;
        };
      }>;
      return data.map((d) => {
        const a = d.address ?? {};
        const city = a.city || a.town || a.village;
        return {
          label:
            d.display_name || formatLabel({ city, state: a.state, country: a.country }),
          latitude: parseFloat(d.lat),
          longitude: parseFloat(d.lon),
          city,
          state: a.state || a.region,
          country: a.country,
          source: "search",
        };
      });
    }
  } catch {
    /* fall through */
  }

  return [];
}

// ─── Google result parser ──────────────────────────────────────────────────
interface GoogleResult {
  formatted_address: string;
  geometry?: { location?: { lat: number; lng: number } };
  address_components: Array<{ types: string[]; long_name: string; short_name: string }>;
}

function parseGoogleResult(
  result: GoogleResult,
  lat: number,
  lng: number,
  source: ResolvedLocation["source"],
): ResolvedLocation {
  let city: string | undefined;
  let state: string | undefined;
  let country: string | undefined;

  for (const comp of result.address_components ?? []) {
    if (comp.types.includes("locality") && !city) city = comp.long_name;
    if (
      (comp.types.includes("postal_town") || comp.types.includes("administrative_area_level_2")) &&
      !city
    ) {
      city = comp.long_name;
    }
    if (comp.types.includes("administrative_area_level_1") && !state) {
      state = comp.short_name || comp.long_name;
    }
    if (comp.types.includes("country") && !country) country = comp.long_name;
  }

  return {
    label:
      result.formatted_address ||
      formatLabel({ city, state, country }),
    latitude: result.geometry?.location?.lat ?? lat,
    longitude: result.geometry?.location?.lng ?? lng,
    city,
    state,
    country,
    source,
  };
}

// ─── 4. Persisted state helpers ─────────────────────────────────────────────
/** Read the persisted location (if any) from localStorage. */
export function loadStoredLocation(): ResolvedLocation | null {
  const raw = safeStorageGet();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ResolvedLocation;
    if (typeof parsed?.latitude === "number" && typeof parsed?.longitude === "number") {
      return { ...parsed, source: "stored" };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Persist the location to localStorage. */
export function saveStoredLocation(loc: ResolvedLocation | null) {
  if (loc) safeStorageSet(JSON.stringify(loc));
  else safeStorageSet(null);
}
