'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'taiwan-live-traffic:favorites';

function readStoredIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((value): value is string => typeof value === 'string' && value.length > 0))];
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

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavoriteIds(readStoredIds());
    setHydrated(true);
  }, []);

  const toggleFavorite = useCallback((cameraId: string) => {
    setFavoriteIds((current) => {
      const next = current.includes(cameraId)
        ? current.filter((id) => id !== cameraId)
        : [...current, cameraId];
      writeStoredIds(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (cameraId: string) => favoriteIds.includes(cameraId),
    [favoriteIds]
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
    writeStoredIds([]);
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite, clearFavorites, hydrated };
}
