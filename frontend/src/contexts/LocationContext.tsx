// ─── LocationContext ──────────────────────────────────────────────────────────
// Centralized state for the user's active location (label + coordinates).
// The provider persists the selection to localStorage and exposes:
//
//   location:        current ResolvedLocation (or null while the user has not
//                     chosen anything).
//   status:          high-level "idle" | "detecting" | "ready" | "error" used
//                     for UX labels.
//   errorMessage:    last error string (permission denied, timeout, etc.).
//   setLocation:     manually set a ResolvedLocation (from search, geolocation
//                     reverse-geocode, or a hardcoded fallback).
//   detectCurrent:   trigger the browser Geolocation flow. Safe to call
//                     multiple times; never throws.
//   clear:           reset to the no-location state.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentCoordinates,
  loadStoredLocation,
  reverseGeocode,
  saveStoredLocation,
  type ResolvedLocation,
} from "../lib/location";

type LocationStatus = "idle" | "detecting" | "ready" | "error";

interface LocationContextValue {
  location: ResolvedLocation | null;
  status: LocationStatus;
  errorMessage: string | null;
  setLocation: (loc: ResolvedLocation | null) => void;
  detectCurrent: () => Promise<void>;
  clear: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<ResolvedLocation | null>(
    () => loadStoredLocation(),
  );
  const [status, setStatus] = useState<LocationStatus>(
    () => (location ? "ready" : "idle"),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const detectingRef = useRef(false);

  // Persist whenever the user explicitly sets a location.
  useEffect(() => {
    saveStoredLocation(location);
    if (location) setStatus("ready");
  }, [location]);

  const setLocation = useCallback((loc: ResolvedLocation | null) => {
    setLocationState(loc);
    setErrorMessage(null);
  }, []);

  const clear = useCallback(() => {
    setLocationState(null);
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  const detectCurrent = useCallback(async () => {
    if (detectingRef.current) return;
    detectingRef.current = true;
    setStatus("detecting");
    setErrorMessage(null);

    try {
      const result = await getCurrentCoordinates();
      if (result.status === "granted" && result.coordinates) {
        const { latitude, longitude } = result.coordinates;
        const resolved = await reverseGeocode(latitude, longitude);
        setLocationState(resolved);
        setStatus("ready");
      } else {
        setStatus("error");
        setErrorMessage(
          result.message ||
            (result.status === "denied"
              ? "Location permission denied. Please choose a location manually."
              : "Could not detect your location. Please choose manually."),
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("Unexpected error detecting location.");
    } finally {
      detectingRef.current = false;
    }
  }, []);

  const value = useMemo<LocationContextValue>(
    () => ({
      location,
      status,
      errorMessage,
      setLocation,
      detectCurrent,
      clear,
    }),
    [location, status, errorMessage, setLocation, detectCurrent, clear],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return ctx;
}
