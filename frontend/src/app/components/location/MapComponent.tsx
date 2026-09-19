import { useEffect, useRef, useState } from "react";
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

interface MapComponentProps {
  coordinate?: MapCoordinate | null;
  onCoordinateSelect?: (coordinate: { latitude: number; longitude: number }) => void;
  className?: string;
  onMapError?: (err: string) => void;
}

export function MapComponent({
  coordinate,
  onCoordinateSelect,
  className = "",
  onMapError,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const isMountedRef = useRef(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Validate coordinates
  const isValidCoordinate = (coord: MapCoordinate | null): boolean => {
    if (!coord) return false;
    return (
      typeof coord.latitude === "number" &&
      typeof coord.longitude === "number" &&
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
    );
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [77.209, 28.6139], // Default to New Delhi, India
        zoom: 5,
        attributionControl: true,
      });

      mapRef.current = map;

      // Add marker if coordinate is provided
      if (isValidCoordinate(coordinate)) {
        const marker = new Marker({ color: "#7456D0" })
          .setLngLat([coordinate.longitude, coordinate.latitude])
          .addTo(map);
        markerRef.current = marker;
      }

      // Handle map click
      map.on("click", (e) => {
        if (!onCoordinateSelect) return;
        const { lng, lat } = e.lngLat;
        onCoordinateSelect({ latitude: lat, longitude: lng });
      });

      // Handle map errors
      map.on("error", (e) => {
        console.error("MapLibre error:", e);
        const errMsg = "Failed to load map";
        setMapError(errMsg);
        onMapError?.(errMsg);
      });

      // Handle map load
      map.on("load", () => {
        setMapError(null);
      });
    } catch (err) {
      console.error("Failed to initialize map:", err);
      const errMsg = "Failed to initialize map";
      setMapError(errMsg);
      onMapError?.(errMsg);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker and center when coordinate changes
  useEffect(() => {
    if (!mapRef.current || !isValidCoordinate(coordinate)) return;

    const { latitude, longitude } = coordinate!;
    const lngLat = [longitude, latitude] as [number, number];

    // Update marker position
    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat);
    } else {
      const marker = new Marker({ color: "#7456D0" })
        .setLngLat(lngLat)
        .addTo(mapRef.current!);
      markerRef.current = marker;
    }

    // Recenter map (but don't animate to avoid jarring transitions)
    mapRef.current?.jumpTo({ center: lngLat, zoom: 14 });
  }, [coordinate]);

  if (mapError) {
    return (
      <div
        className={`rounded-2xl bg-card border border-border flex items-center justify-center ${className}`}
        style={{ minHeight: "300px" }}
      >
        <div className="text-center p-6 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Unable to load map</p>
          <p className="text-xs text-destructive">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-2xl overflow-hidden bg-muted ${className}`}
      style={{ minHeight: "300px", width: "100%" }}
    />
  );
}

export default MapComponent;