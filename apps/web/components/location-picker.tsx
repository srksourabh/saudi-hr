"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface Coords { lat: number; lng: number }

const DEFAULT_CENTER: Coords = { lat: 24.7136, lng: 46.6753 };

const SITE_PRESETS: { name: string; coords: Coords; note: string }[] = [
  { name: "Riyadh HQ",       coords: { lat: 24.7136, lng: 46.6753 }, note: "King Fahd Road, Riyadh" },
  { name: "Dhahran Ops",     coords: { lat: 26.3040, lng: 50.2083 }, note: "Dhahran Techno Valley" },
  { name: "Jubail Project",  coords: { lat: 27.0046, lng: 49.6225 }, note: "Jubail Industrial City" },
];

export interface LocationPickerValue {
  lat: number;
  lng: number;
  accuracy?: number;
  siteName?: string;
}

export interface LocationPickerProps {
  value?: LocationPickerValue | null;
  onChange?: (value: LocationPickerValue | null) => void;
  defaultSiteName?: string;
  variant?: "compact" | "full";
  /** Show read-only mode (no capture buttons). */
  readOnly?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  defaultSiteName,
  variant = "compact",
  readOnly = false,
}: LocationPickerProps) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletMod, setLeafletMod] = useState<any>(null);

  // Lazy-load react-leaflet + leaflet on the client only
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rl = await import("react-leaflet");
      const L = (await import("leaflet")).default;
      // Fix Leaflet icon paths inside Next.js (CDN shim).
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/icons/leaflet/marker-icon-2x.png",
        iconUrl: "/icons/leaflet/marker-icon.png",
        shadowUrl: "/icons/leaflet/marker-shadow.png",
      });
      if (!cancelled) {
        setLeafletMod({ ...rl, L });
        setLeafletReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const center = useMemo<Coords>(() => {
    if (value?.lat != null && value?.lng != null) return { lat: value.lat, lng: value.lng };
    if (defaultSiteName) {
      const preset = SITE_PRESETS.find((s) => s.name === defaultSiteName);
      if (preset) return preset.coords;
    }
    return DEFAULT_CENTER;
  }, [value?.lat, value?.lng, defaultSiteName]);

  const heightClass = variant === "compact" ? "h-56" : "h-72";

  function pickPreset(name: string) {
    const preset = SITE_PRESETS.find((s) => s.name === name);
    if (!preset) return;
    onChange?.({ lat: preset.coords.lat, lng: preset.coords.lng, siteName: preset.name });
    setError(null);
  }

  function captureGeolocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setFetching(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange?.({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          siteName: "Current location",
        });
        setFetching(false);
      },
      (err) => {
        setError(`Could not get your location: ${err.message}. Pick a preset instead.`);
        setFetching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={captureGeolocation}
            disabled={fetching}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {fetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            {fetching ? "Locating…" : "Use my current location"}
          </button>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500">Or pick a site:</span>
            {SITE_PRESETS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => pickPreset(s.name)}
                className={`rounded-full border px-2.5 py-0.5 transition ${
                  value?.siteName === s.name
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* `isolate` + `z-0` pin Leaflet's internal panes/controls (which carry
          z-index up to 1000) inside this box's own stacking context, so they
          can no longer paint over the fixed chat window that sits above the page. */}
      <div className={`relative isolate z-0 overflow-hidden rounded-lg border border-slate-200 ${heightClass}`}>
        {leafletReady && leafletMod ? (
          <leafletMod.MapContainer
            center={[center.lat, center.lng]}
            zoom={value?.lat != null ? 14 : 11}
            scrollWheelZoom
            className="h-full w-full"
          >
            <leafletMod.TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {value?.lat != null && value?.lng != null && (
              <>
                <leafletMod.Marker position={[value.lat, value.lng]} />
                {value.accuracy && (
                  <leafletMod.Circle
                    center={[value.lat, value.lng]}
                    radius={value.accuracy}
                    pathOptions={{ color: "#047857", fillColor: "#047857", fillOpacity: 0.1, weight: 1 }}
                  />
                )}
                <FlyTo coords={{ lat: value.lat, lng: value.lng }} useMap={leafletMod.useMap} />
              </>
            )}
          </leafletMod.MapContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-xs text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading map…
          </div>
        )}
      </div>

      {value?.lat != null && value?.lng != null && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            <MapPin className="mr-1 inline h-3 w-3" />
            {value.siteName ?? "Pinned location"}
          </span>
          <span className="font-mono">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            {value.accuracy ? ` · ±${Math.round(value.accuracy)}m` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function FlyTo({ coords, useMap }: { coords: Coords; useMap: any }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 14, { duration: 0.6 });
  }, [coords.lat, coords.lng, map]);
  return null;
}
