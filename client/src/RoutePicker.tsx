import { useEffect, useMemo, useState } from "react";

type Route = {
  routeId: string;
  shortName: string;
  longName: string;
  type: string;
};

type Props = {
  open: boolean;
  selected: Set<string>;
  onClose: () => void;
  onChange: (next: Set<string>) => void;
};

export default function RoutePicker({ open, selected, onClose, onChange }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || routes.length) return;
    setLoading(true);
    fetch("/api/routes")
      .then(r => r.json())
      .then(j => setRoutes(j.items || []))
      .finally(() => setLoading(false));
  }, [open, routes.length]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return routes;
    return routes.filter(r =>
      r.shortName.toLowerCase().includes(needle) ||
      r.longName.toLowerCase().includes(needle)
    );
  }, [routes, q]);

  if (!open) return null;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Pick your routes">
        <div className="drawer-head">
          <strong>Pick your routes</strong>
          <button className="link-btn" onClick={onClose}>Done</button>
        </div>
        <input
          className="search"
          placeholder="Search route number or name…"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
        />
        <div className="drawer-sub">
          {selected.size} selected
          {selected.size > 0 && (
            <button className="link-btn" onClick={() => onChange(new Set())}>Clear all</button>
          )}
        </div>
        <ul className="route-list">
          {loading && <li className="route-list-empty">Loading routes…</li>}
          {!loading && filtered.length === 0 && <li className="route-list-empty">No matches</li>}
          {filtered.map(r => {
            const on = selected.has(r.routeId);
            return (
              <li key={r.routeId}>
                <label className={`route-row ${on ? "on" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(r.routeId)} />
                  <span className="row-badge">{r.shortName}</span>
                  <span className="row-name">{r.longName}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
