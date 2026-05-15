import { useEffect, useRef, useState } from "react";
import type { SavedStop } from "./savedStops";

type Props = {
  open: boolean;
  selected: SavedStop[];
  onClose: () => void;
  onChange: (next: SavedStop[]) => void;
};

type StopHit = { stopId: string; name: string };

export default function StopPicker({ open, selected, onClose, onChange }: Props) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<StopHit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const needle = q.trim();
    if (needle.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/stops?q=${encodeURIComponent(needle)}`);
        const j = await r.json();
        setHits(j.items || []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [q, open]);

  if (!open) return null;

  const selectedIds = new Set(selected.map(s => s.stopId));

  const add = (s: StopHit) => {
    if (selectedIds.has(s.stopId)) return;
    onChange([...selected, s]);
  };
  const remove = (id: string) => onChange(selected.filter(s => s.stopId !== id));

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Pick your stops">
        <div className="drawer-head">
          <strong>Pick your stops</strong>
          <button className="link-btn" onClick={onClose}>Done</button>
        </div>
        <input
          className="search"
          placeholder="Search stop name or ID (min 2 chars)…"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
        />
        <div className="drawer-sub">
          {selected.length} saved {selected.length === 1 ? "stop" : "stops"}
          {selected.length > 0 && (
            <button className="link-btn" onClick={() => onChange([])}>Clear all</button>
          )}
        </div>

        {selected.length > 0 && (
          <ul className="route-list saved-stops">
            {selected.map(s => (
              <li key={s.stopId}>
                <div className="route-row on">
                  <span className="row-badge">📍</span>
                  <span className="row-name">{s.name}</span>
                  <button className="link-btn" onClick={() => remove(s.stopId)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="drawer-sub" style={{ marginTop: 14 }}>Search results</div>
        <ul className="route-list">
          {loading && <li className="route-list-empty">Searching…</li>}
          {!loading && q.trim().length < 2 && <li className="route-list-empty">Type at least 2 characters</li>}
          {!loading && q.trim().length >= 2 && hits.length === 0 && <li className="route-list-empty">No matches</li>}
          {hits.map(h => {
            const on = selectedIds.has(h.stopId);
            return (
              <li key={h.stopId}>
                <button className={`route-row ${on ? "on" : ""}`} onClick={() => (on ? remove(h.stopId) : add(h))} disabled={on}>
                  <span className="row-badge">{on ? "✓" : "+"}</span>
                  <span className="row-name">{h.name} <span className="muted-id">({h.stopId})</span></span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
