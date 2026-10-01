"use client";

import { useCallback, useRef, useSyncExternalStore, type SetStateAction } from "react";
import { usePathname } from "next/navigation";

const PREFIX = "soknadsklar:draft:v1:";
const listeners = new Set<() => void>();
const cache = new Map<string, unknown>();
let revision = 0;
let storageFailed = false;
function notify() { revision++; listeners.forEach((fn) => fn()); }
function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = () => { cache.clear(); notify(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}

// Transient network states are never restored after a reload.
function durable(value: unknown): unknown {
  const phase = value as { kind?: string; result?: unknown } | null;
  if (phase?.kind === "loading") return undefined;
  if (phase?.kind === "sending" || phase?.kind === "betaling") return { kind: "result", result: phase.result };
  return value;
}

export function useDraftState<T>(slot: string, initial: T): [T, (value: SetStateAction<T>) => void] {
  const path = usePathname();
  const key = `${PREFIX}${path}:${slot}`;
  const initialRef = useRef(initial);
  const read = useCallback((): T => {
    if (cache.has(key)) return cache.get(key) as T;
    let value = initialRef.current;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const entry = JSON.parse(saved);
        if (entry && typeof entry.value === "object" && entry.value !== null) {
          value = { ...initialRef.current, ...entry.value } as T;
          // Older switches silently meant "no". Ask those questions explicitly
          // after upgrading, while retaining the customer's other draft answers.
          if (slot === "data" && entry.schemaVersion !== 2) {
            const updated = value as Record<string, unknown>;
            for (const [field, fallback] of Object.entries(initialRef.current as object)) {
              if (fallback === null && typeof updated[field] === "boolean") updated[field] = null;
            }
          }
        }
        const propertyId = path.split("/")[2];
        const facts = JSON.parse(localStorage.getItem(`property_confirmed_${propertyId}`) ?? "null");
        if (slot === "phase" && facts?.confirmedAt > entry.updated) value = initialRef.current;
      }
    } catch { /* Corrupt or unavailable storage starts a fresh draft. */ }
    cache.set(key, value);
    return value;
  }, [key, path, slot]);
  const value = useSyncExternalStore(subscribe, read, () => initialRef.current);
  const setValue = useCallback((action: SetStateAction<T>) => {
    const next = typeof action === "function" ? (action as (prev: T) => T)(read()) : action;
    cache.set(key, next);
    const saved = durable(next);
    if (saved !== undefined) {
      try {
        localStorage.setItem(key, JSON.stringify({ value: saved, schemaVersion: 2, updated: new Date().toISOString() }));
        storageFailed = false;
      } catch { storageFailed = true; }
    }
    notify();
  }, [key, read]);
  return [value, setValue];
}

export function invalidateProjectCache() { cache.clear(); notify(); }

export function useStorageFailure() {
  return useSyncExternalStore(subscribe, () => storageFailed, () => false);
}

export function useProjectRevision() {
  return useSyncExternalStore(subscribe, () => revision, () => -1);
}

export function listProjects(propertyId: string) {
  const start = `${PREFIX}/property/${propertyId}/tiltak/`;
  const projects = new Map<string, { path: string; slug: string; updated: string; ready: boolean; caseId?: string }>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (!key.startsWith(start)) continue;
      const path = key.slice(PREFIX.length, key.lastIndexOf(":"));
      const saved = JSON.parse(localStorage.getItem(key)!);
      if (!saved?.updated || typeof saved.updated !== "string") continue;
      const prev = projects.get(path);
      projects.set(path, { path, slug: path.split("/").pop()!, updated: saved.updated > (prev?.updated ?? "") ? saved.updated : prev!.updated, ready: prev?.ready || saved.value?.kind === "sent", caseId: key.endsWith(":caseReceipt") && typeof saved.value?.caseId === "string" ? saved.value.caseId : prev?.caseId });
    }
  } catch { /* Storage is optional. */ }
  return [...projects.values()].sort((a, b) => b.updated.localeCompare(a.updated));
}
