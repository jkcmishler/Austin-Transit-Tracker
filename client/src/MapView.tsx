import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Vehicle = {
  vehicleId: string;
  lat: number;
  lng: number;
  bearing: number | null;
  speed: number | null;
  tripId: string | null;
  routeId: string | null;
  routeShortName: string;
  routeLongName: string;
  currentStatus: string | null;
  delayMin: number | null;
  timestamp: number | null;
};

type VehiclesResponse = {
  computedAt: number;
  items: Vehicle[];
};

const REFRESH_MS = 30_000;
const AUSTIN_CENTER: [number, number] = [30.2672, -97.7431];

function colorFor(delayMin: number | null): string {
  if (delayMin == null) return "#9aa3b2";   // on time / unknown — muted
  if (delayMin >= 15) return "#ff4757";     // severe — red
  if (delayMin >= 10) return "#f5b942";     // warn — amber
  if (delayMin >= 5) return "#ff7a45";      // late ≥5 — orange
  return "#34c759";                          // <5 min — green
}

function FitBounds({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap();
  useEffect(() => {
    if (!vehicles.length) return;
    const bounds = L.latLngBounds(vehicles.map(v => [v.lat, v.lng]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  }, [vehicles, map]);
  return null;
}

type Props = {
  filterRouteIds: Set<string>;
  onClose: () => void;
};

export default function MapView({ filterRouteIds, onClose }: Props) {
  const [data, setData] = useState<VehiclesResponse | null>(null);
  const [showOnlyDelayed, setShowOnlyDelayed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/vehicles");
        const j = (await r.json()) as VehiclesResponse;
        if (!cancelled) setData(j);
      } catch { /* swallow */ }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    return data.items.filter(v => {
      if (filterRouteIds.size > 0 && (!v.routeId || !filterRouteIds.has(v.routeId))) return false;
      if (showOnlyDelayed && (v.delayMin == null || v.delayMin < 5)) return false;
      return true;
    });
  }, [data, filterRouteIds, showOnlyDelayed]);

  const delayedCount = useMemo(
    () => visible.filter(v => v.delayMin != null && v.delayMin >= 5).length,
    [visible]
  );

  return (
    <div className="map-page">
      <div className="map-bar">
        <button className="btn btn-outline" onClick={onClose}>← Back to list</button>
        <span className="map-status">
          {data ? `${visible.length} vehicles · ${delayedCount} late` : "Loading…"}
        </span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={showOnlyDelayed}
            onChange={e => setShowOnlyDelayed(e.target.checked)}
          />
          Only late
        </label>
      </div>
      <div className="map-wrap">
        <MapContainer
          center={AUSTIN_CENTER}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds vehicles={visible} />
          {visible.map(v => (
            <CircleMarker
              key={v.vehicleId}
              center={[v.lat, v.lng]}
              radius={v.delayMin != null && v.delayMin >= 5 ? 8 : 5}
              pathOptions={{
                color: colorFor(v.delayMin),
                fillColor: colorFor(v.delayMin),
                fillOpacity: 0.85,
                weight: 1,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <strong>Route {v.routeShortName}</strong>
                  <div style={{ fontSize: 12 }}>{v.routeLongName}</div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {v.delayMin != null && v.delayMin >= 5
                      ? <span style={{ color: colorFor(v.delayMin), fontWeight: 600 }}>{v.delayMin} min late</span>
                      : <span>On time</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    Bus #{v.vehicleId}
                    {v.speed != null && <> · {Math.round(v.speed * 2.237)} mph</>}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
