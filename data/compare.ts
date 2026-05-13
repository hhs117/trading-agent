/**
 * Phase 5 — Competitor compare-list state.
 *
 * Backed by localStorage. Stores an ordered list of competitor IDs that the
 * user has selected from the /search-products page; consumed by /competitors.
 * Capped at MAX_COMPARE entries (5) to keep the side-by-side table readable.
 */

import { getStorageData, setStorageData } from "@/lib/storage";
import { getMockCompetitors, type Competitor } from "./mockData";

export const COMPARE_STORAGE_KEY = "seapick:competitorCompare";
export const MAX_COMPARE = 5;

export function getCompareIds(): string[] {
  return getStorageData<string[]>(COMPARE_STORAGE_KEY, []);
}

export function getCompareCompetitors(): Competitor[] {
  const ids = getCompareIds();
  if (ids.length === 0) return [];
  const all = getMockCompetitors();
  const byId = new Map(all.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is Competitor => !!c);
}

export interface AddResult {
  ok: boolean;
  reason?: "duplicate" | "full" | "unknown";
}

export function addToCompare(id: string): AddResult {
  const ids = getCompareIds();
  if (ids.includes(id)) return { ok: false, reason: "duplicate" };
  if (ids.length >= MAX_COMPARE) return { ok: false, reason: "full" };
  setStorageData(COMPARE_STORAGE_KEY, [...ids, id]);
  notifyChange();
  return { ok: true };
}

export function removeFromCompare(id: string): void {
  const ids = getCompareIds();
  if (!ids.includes(id)) return;
  setStorageData(
    COMPARE_STORAGE_KEY,
    ids.filter((x) => x !== id)
  );
  notifyChange();
}

export function toggleCompare(id: string): AddResult {
  if (isInCompare(id)) {
    removeFromCompare(id);
    return { ok: true };
  }
  return addToCompare(id);
}

export function isInCompare(id: string): boolean {
  return getCompareIds().includes(id);
}

export function clearCompare(): void {
  setStorageData(COMPARE_STORAGE_KEY, []);
  notifyChange();
}

/* ---------- Cross-page event channel ---------- */

const EVENT_NAME = "seapick:compare-changed";

function notifyChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** Subscribe to compare-list changes. Returns an unsubscribe function. */
export function subscribeCompare(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler); // multi-tab sync
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
