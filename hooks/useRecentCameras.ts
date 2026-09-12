'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'taiwan-live-traffic:recent';
const MAX_RECENT = 20;

function readStoredIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((value): value is string => typeof value === 'string' && value.length > 0))]
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private mode, quota, or browser policy).
  }
}

export function useRecentCameras() {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecentIds(readStoredIds());
    setHydrated(true);
  }, []);

  const addRecent = useCallback((cameraId: string) => {
    if (!cameraId) return;
    setRecentIds((current) => {
      const next = [cameraId, ...current.filter((id) => id !== cameraId)].slice(0, MAX_RECENT);
      writeStoredIds(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    writeStoredIds([]);
  }, []);

  return { recentIds, addRecent, clearRecent, hydrated };
}
