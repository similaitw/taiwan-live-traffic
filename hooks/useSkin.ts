'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SKIN, isSkinId, type SkinId } from '@/lib/skins';

const STORAGE_KEY = 'taiwan-live-traffic:skin:v1';

export function useSkin() {
  const [skin, setSkinState] = useState<SkinId>(DEFAULT_SKIN);

  useEffect(() => {
    let next: SkinId = DEFAULT_SKIN;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isSkinId(stored)) next = stored;
    } catch {}
    setSkinState(next);
    document.documentElement.dataset.skin = next;
  }, []);

  const setSkin = useCallback((next: SkinId) => {
    setSkinState(next);
    document.documentElement.dataset.skin = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return { skin, setSkin };
}
