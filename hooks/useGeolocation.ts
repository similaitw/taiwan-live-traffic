'use client';

import { useCallback, useEffect, useState } from 'react';

export interface GeoPoint {
  lat: number;
  lng: number;
}

interface UseGeolocationOptions {
  autoLocate?: boolean;
}

export function useGeolocation({ autoLocate = false }: UseGeolocationOptions = {}) {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const requestLocation = useCallback((silent: boolean) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!silent) setError('此瀏覽器不支援地理定位');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
        setLocating(false);
      },
      (geoError) => {
        if (!silent) setError(`定位失敗：${geoError.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const locate = useCallback(() => requestLocation(false), [requestLocation]);

  useEffect(() => {
    if (autoLocate) requestLocation(true);
  }, [autoLocate, requestLocation]);

  return { location, error, locating, locate };
}
