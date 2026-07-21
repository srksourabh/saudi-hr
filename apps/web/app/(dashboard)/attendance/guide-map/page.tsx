"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, CardHeader, CardContent, Input } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Trash2, Layers, Clock, Users } from "lucide-react";

const BRIGHT_TILE_URL = "https://tiles.openfreemap.org/styles/bright";

const STATUS_COLORS: Record<string, string> = {
  present: "#22c55e",
  late: "#f59e0b",
  absent: "#ef4444",
  on_leave: "#3b82f6",
  remote: "#8b5cf6",
  half_day: "#f97316",
  default: "#6b7280",
};

interface EmployeeMarker {
  id: string;
  fullName: string;
  department: string | null;
  status: string;
  lat: number;
  lng: number;
  punchInAt: Date | null;
  workLocation: string | null;
}

export default function GuideMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [mapName, setMapName] = useState("");
  const [currentCenter, setCurrentCenter] = useState({ lat: 24.7136, lng: 46.6753 });
  const [currentZoom, setCurrentZoom] = useState("12");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { data: allEmployees } = api.employee.list.useQuery({ status: undefined, pageSize: 500 } as any);
  const { data: guideMaps, refetch: refetchMaps } = api.guideMap.list.useQuery();
  const { data: todayRecords } = api.attendance.list.useQuery({} as any);

  const createMutation = api.guideMap.create.useMutation({
    onSuccess: () => {
      setShowSaveDialog(false);
      setMapName("");
      void refetchMaps();
    },
  });

  const deleteMutation = api.guideMap.delete.useMutation({
    onSuccess: () => { void refetchMaps(); },
  });

  const employeeLocations = (): EmployeeMarker[] => {
    if (!allEmployees || !todayRecords) return [];

    const latestByEmployee = new Map<string, Record<string, unknown>>();
    for (const rec of todayRecords) {
      const existing = latestByEmployee.get(rec.employeeId);
      if (!existing ||
        rec.workDate > (existing.workDate as string) ||
        (rec.workDate === existing.workDate && rec.punchSequence > (existing.punchSequence as number))) {
        latestByEmployee.set(rec.employeeId, rec as Record<string, unknown>);
      }
    }

    const markers: EmployeeMarker[] = [];
    for (const emp of allEmployees) {
      if (emp.employmentStatus !== "active") continue;
      const rec = latestByEmployee.get(emp.id) as Record<string, unknown> | undefined;
      const workLocation = rec?.workLocation as string | undefined;
      if (!workLocation) continue;

      const parts = workLocation.split(",");
      const lat = parseFloat(parts[0]?.trim() ?? "0");
      const lng = parseFloat(parts[1]?.trim() ?? "0");
      if (!lat && !lng) continue;

      markers.push({
        id: emp.id,
        fullName: emp.fullName,
        department: emp.department?.name ?? null,
        status: (rec?.status as string) ?? "present",
        lat,
        lng,
        punchInAt: rec?.punchInAt as Date | null ?? null,
        workLocation,
      });
    }
    return markers;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      await import("maplibre-gl/dist/maplibre-gl.css");

      if (cancelled || !mapContainer.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: BRIGHT_TILE_URL,
        center: [currentCenter.lng, currentCenter.lat],
        zoom: parseInt(currentZoom),
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      map.on("moveend", () => {
        const center = map.getCenter();
        setCurrentCenter({ lat: center.lat, lng: center.lng });
        setCurrentZoom(String(Math.round(map.getZoom())));
      });

      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;
        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const markers = employeeLocations();

    for (const [, marker] of markersRef.current) {
      marker.remove();
    }
    markersRef.current.clear();

    for (const emp of markers) {
      const color = STATUS_COLORS[emp.status] ?? STATUS_COLORS.default;

      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.cssText = `
        width: 32px; height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      `;
      el.innerHTML = `<div style="width:8px;height:8px;background:white;border-radius:50%;"></div>`;

      el.addEventListener("click", () => {
        new (window as unknown as { maplibregl: { Popup: new (opts: object) => { setLngLat: (coords: [number, number]) => { setHTML: (html: string) => { addTo: (map: unknown) => void } } } } }).maplibregl.Popup({ offset: 15 })
          .setLngLat([emp.lng, emp.lat])
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;min-width:180px">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${emp.fullName}</div>
              <div style="font-size:12px;color:#666;margin-bottom:4px">${emp.department ?? "No department"}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:50%"></span>
                <span style="font-size:12px;text-transform:capitalize">${emp.status.replace("_", " ")}</span>
              </div>
              ${emp.punchInAt ? `
              <div style="font-size:11px;color:#888;display:flex;align-items:center;gap:4px">
                <span>⏱</span>
                Last punch: ${new Date(emp.punchInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </div>` : ""}
              ${emp.workLocation ? `<div style="font-size:11px;color:#888;margin-top:2px">${emp.workLocation}</div>` : ""}
            </div>
          `)
          .addTo(map);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const marker = new ((window as unknown as { maplibregl: { Marker: new (opts: object) => any } }).maplibregl.Marker)({ element: el })
        .setLngLat([emp.lng, emp.lat])
        .addTo(map);

      markersRef.current.set(emp.id, marker);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, allEmployees, todayRecords]);

  // Load saved map
  const loadMap = (gm: { centerLat: string; centerLng: string; zoom: string }) => {
    if (!mapRef.current) return;
    const lat = parseFloat(gm.centerLat);
    const lng = parseFloat(gm.centerLng);
    mapRef.current.flyTo({ center: [lng, lat], zoom: parseInt(gm.zoom) ?? 12, duration: 1000 });
    setCurrentCenter({ lat, lng });
    setCurrentZoom(gm.zoom ?? "12");
  };

  const saveMap = () => {
    if (!mapName.trim()) return;
    createMutation.mutate({
      name: mapName.trim(),
      centerLat: currentCenter.lat,
      centerLng: currentCenter.lng,
      zoom: currentZoom,
    });
  };

  const markers = employeeLocations();

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className="w-72 shrink-0 space-y-4 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold mb-1">Guide Map</h1>
          <p className="text-sm text-muted-foreground">
            {markers.length} employees with location data
          </p>
        </div>

        {/* Save current view */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Current View</span>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Lat: {currentCenter.lat.toFixed(5)}, Lng: {currentCenter.lng.toFixed(5)}</div>
              <div>Zoom: {currentZoom}</div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setShowSaveDialog(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Save This View
            </Button>
          </CardContent>
        </Card>

        {/* Saved maps */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Saved Maps</span>
              <span className="text-xs text-muted-foreground">{guideMaps?.length ?? 0}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {!guideMaps?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No saved maps yet. Save a view to share with your team.
              </p>
            ) : (
              guideMaps.map((gm: { id: string; name: string; centerLat: string; centerLng: string; zoom: string }) => (
                <div key={gm.id} className="flex items-center justify-between rounded-md border p-2 hover:bg-slate-50">
                  <button
                    className="flex-1 text-left"
                    onClick={() => loadMap(gm)}
                  >
                    <div className="text-sm font-medium">{gm.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {parseFloat(gm.centerLat).toFixed(2)}, {parseFloat(gm.centerLng).toFixed(2)} · z{gm.zoom}
                    </div>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                    onClick={() => { if (confirm(`Delete map "${gm.name}"?`)) deleteMutation.mutate(gm.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-3">
            <span className="font-medium text-sm">Status Legend</span>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {[
              { label: "Present", color: STATUS_COLORS.present },
              { label: "Late", color: STATUS_COLORS.late },
              { label: "Absent", color: STATUS_COLORS.absent },
              { label: "Remote", color: STATUS_COLORS.remote },
              { label: "On Leave", color: STATUS_COLORS.on_leave },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: color }} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Employee list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Located Employees</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 max-h-64 overflow-y-auto">
            {markers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No employees with location data
              </p>
            ) : (
              markers.slice(0, 20).map((emp) => (
                <button
                  key={emp.id}
                  className="w-full flex items-center gap-2 text-left rounded p-1.5 hover:bg-slate-50 transition"
                  onClick={() => {
                    if (!mapRef.current) return;
                    mapRef.current.flyTo({ center: [emp.lng, emp.lat], zoom: 15, duration: 800 });
                  }}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[emp.status] ?? STATUS_COLORS.default }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{emp.fullName}</div>
                    <div className="text-xs text-muted-foreground truncate">{emp.department ?? "—"}</div>
                  </div>
                  {emp.punchInAt && (
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))
            )}
            {markers.length > 20 && (
              <p className="text-xs text-muted-foreground text-center">
                +{markers.length - 20} more employees
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <div className="flex-1 relative rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />

        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-96">
            <CardHeader>
              <div className="font-medium">Save Map View</div>
              <div className="text-sm text-muted-foreground">
                Lat: {currentCenter.lat.toFixed(5)}, Lng: {currentCenter.lng.toFixed(5)} · Zoom: {currentZoom}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="e.g. Riyadh HQ Morning Shift"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveMap(); }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!mapName.trim() || createMutation.isPending}
                  onClick={saveMap}
                >
                  {createMutation.isPending ? "Saving..." : "Save Map"}
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
