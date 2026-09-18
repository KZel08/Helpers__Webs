// ─── Location service ──────────────────────────────────────────────────────────
// Provider-agnostic abstraction for browser geolocation and reverse
// geocoding / place search.
//
// Primary provider: Geoapify Geocoding / Autocomplete API.
//   - Uses VITE_GEOAPIFY_API_KEY from the existing .env (already
//     provisioned in this project).
//   - Restricted by allowed domains/referrers on the Geoapify dashboard.
//   - Restricted to India via filter=countrycode:in for autocomplete.
//   - Never bundle server-side keys here.
//
// All UI components must call these functions instead of touching
// fetch directly. The provider implementation can be
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

function getGeoapifyKey(): string | null {
  // import.meta.env is the Vite-native way to read env vars.
  const key = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_GEOAPIFY_API_KEY;
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
 * Uses Geoapify Reverse Geocoding API.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ResolvedLocation> {
  const key = getGeoapifyKey();
  if (!key) {
    // Missing API key - return controlled error state
    return {
      label: formatLabel({}),
      latitude,
      longitude,
      source: "geolocation",
    };
  }

  try {
    const url =
      `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${key}&countrycodes=in`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Geoapify reverse geocoding failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      features: Array<{
        properties: {
          formatted?: string;
          city?: string;
          city_district?: string;
          city_district_code?: string;
          city_code?: string;
          suburb?: string;
          suburb_code?: string;
          village?: string;
          town?: string;
          city_block?: string;
          borough?: string;
          city_district?: string;
          city_district_code?: string;
          neighbourhood?: string;
          suburb?: string;
          quarter?: string;
          street?: string;
          house_number?: string;
          postcode?: string;
          postcode_locality?: string;
          city_district?: string;
          region?: string;
          region_code?: string;
          state?: string;
          state_code?: string;
          state_district?: string;
          state_district_code?: string;
          state_short_code?: string;
          country?: string;
          country_code?: string;
          country_code_alpha3?: string;
          continent?: string;
          continent_code?: string;
          formatted?: string;
          formatted?: string;
          address_line1?: string;
          address_line2?: string;
          lon?: number;
          lat?: number;
        };
      }>;
    };

    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      const city = props.city || props.town || props.village || props.suburb || props.city_block || props.neighbourhood || props.city_block || props.borough || props.city_district;
      const state = props.state || props.region || props.state_code || props.state_district;
      const country = props.country || "India";

      return {
        label: props.formatted || formatLabel({ city: props.city, state: props.state, country: props.country }),
        latitude,
        longitude,
        city: props.city || props.town || props.village || props.suburb || props.city_block || props.neighbourhood || props.city_block || props.borough || props.city_district,
        state: props.state || props.region || props.state_code || props.state_district,
        country: props.country || "India",
        source: "geolocation",
      };
    }
  } catch {
    /* fall through to fallback */
  }

  // Fallback if Geoapify fails or returns no results
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
 * Returns up to 5 suggestions using Geoapify Address Autocomplete API.
 */
export async function searchLocations(
  query: string,
): Promise<ResolvedLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = getGeoapifyKey();
  if (!key) {
    // Missing API key - return empty results with controlled error
    return [];
  }

  try {
    const url =
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&format=json&apiKey=${encodeURIComponent(key)}&limit=5&filter=countrycode:in`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Geoapify autocomplete failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      results: Array<{
        formatted?: string;
        address_line1?: string;
        address_line2?: string;
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        state?: string;
        state_code?: string;
        country?: string;
        country_code?: string;
        postcode?: string;
        lon?: number;
        lat?: number;
        formatted?: string;
      }>;
    };

    if (data.results && data.results.length > 0) {
      return data.results.map((r) => ({
        label:
          r.formatted ||
          r.address_line1 ||
          formatLabel({
            city: r.city || r.town || r.village || r.suburb,
            state: r.state,
            country: r.country || "India",
          }),
        latitude: r.lat ?? 0,
        longitude: r.lon ?? 0,
        city: r.city || r.town || r.village || r.suburb,
        state: r.state,
        country: r.country || "India",
        source: "search",
      }));
    }
  } catch {
    /* fall through to empty results */
  }

  return [];
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