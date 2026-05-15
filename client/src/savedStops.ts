const STORAGE_KEY = "att.savedStops";

export type SavedStop = { stopId: string; name: string };

export function loadSavedStops(): SavedStop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((v): v is SavedStop =>
      typeof v === "object" && v !== null &&
      typeof (v as SavedStop).stopId === "string" &&
      typeof (v as SavedStop).name === "string"
    );
  } catch {
    return [];
  }
}

export function saveSavedStops(stops: SavedStop[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
}
