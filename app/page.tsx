'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Camera } from '@/types/camera';
import SearchBar from '@/components/SearchBar';
import CameraList from '@/components/CameraList';
import CameraModal from '@/components/CameraModal';
import Map from '@/components/Map';

type View = 'map' | 'list';

const TYPE_LABEL: Record<Camera['type'], string> = {
  freeway: '國道',
  provincial: '省道',
  county: '縣市',
};

const TYPE_ICON: Record<Camera['type'], string> = {
  freeway: '🛣️',
  provincial: '🏔️',
  county: '🏘️',
};

export default function HomePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('map');
  const [selected, setSelected] = useState<Camera | null>(null);
  const [typeFilter, setTypeFilter] = useState<Camera['type'] | 'all'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lng2 - lng1);
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError('此瀏覽器不支援地理定位');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(`定位失敗：${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetch('/api/cameras')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Camera[]) => setCameras(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleSelect = useCallback((c: Camera) => setSelected(c), []);

  const filtered = cameras
    .filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.road?.toLowerCase().includes(q) ?? false)
      );
    })
    .map((c) => {
      if (!userLocation) return { camera: c, distance: Infinity };
      return {
        camera: c,
        distance: getDistance(userLocation.lat, userLocation.lng, c.lat, c.lng),
      };
    });

  const sorted =
    sortByNearest && userLocation
      ? [...filtered].sort((a, b) => a.distance - b.distance)
      : filtered;

  const filteredCameras = sorted.map((item) => item.camera);

  const counts = {
    all: cameras.length,
    freeway: cameras.filter((c) => c.type === 'freeway').length,
    provincial: cameras.filter((c) => c.type === 'provincial').length,
    county: cameras.filter((c) => c.type === 'county').length,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative noise" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="pointer-events-none absolute top-0 right-1/4 w-72 h-72 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      {/* Header */}
      <header className="relative z-30 shrink-0 glass" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-9 h-9 rounded-lg flex items-center justify-center animate-pulse-glow"
              style={{ background: 'linear-gradient(135deg, var(--accent-freeway), #6366f1)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0
                    012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                全台監視器即時查詢
              </h1>
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                LIVE TRAFFIC CAM
              </p>
            </div>
          </div>

          <SearchBar value={query} onChange={setQuery} />

          {/* View toggle */}
          <div className="flex shrink-0 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            {(['map', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all duration-200"
                style={{
                  background: view === v ? 'var(--accent-freeway)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--text-secondary)',
                  boxShadow: view === v ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                {v === 'map' ? '地圖' : '清單'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="relative z-20 shrink-0 px-4 py-2.5 flex flex-wrap items-center gap-2 overflow-x-auto"
        style={{ background: 'rgba(17, 24, 39, 0.6)', borderBottom: '1px solid var(--border-subtle)' }}>
        {(['all', 'freeway', 'provincial', 'county'] as const).map((t, i) => {
          const active = typeFilter === t;
          const colorMap: Record<string, string> = {
            all: 'var(--accent-freeway)',
            freeway: 'var(--accent-freeway)',
            provincial: 'var(--accent-provincial)',
            county: 'var(--accent-county)',
          };
          const color = colorMap[t];
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200"
              style={{
                animationDelay: `${i * 50}ms`,
                background: active ? color : 'rgba(255,255,255,0.04)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
                boxShadow: active ? `0 0 16px ${color}33` : 'none',
              }}
            >
              {t === 'all'
                ? `全部 ${counts.all}`
                : `${TYPE_ICON[t]} ${TYPE_LABEL[t]} ${counts[t]}`}
            </button>
          );
        })}

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />

        <button
          onClick={locateMe}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--accent-provincial)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <span className="inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            定位
          </span>
        </button>

        <button
          onClick={() => setSortByNearest((v) => !v)}
          disabled={!userLocation}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200"
          style={{
            background: sortByNearest ? 'var(--accent-freeway)' : 'rgba(255,255,255,0.04)',
            color: sortByNearest ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${sortByNearest ? 'var(--accent-freeway)' : 'var(--border-subtle)'}`,
            opacity: userLocation ? 1 : 0.3,
            cursor: userLocation ? 'pointer' : 'not-allowed',
          }}
        >
          離我最近
        </button>

        {userLocation && (
          <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)' }}>
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </span>
        )}

        {loading && (
          <span className="text-xs ml-2 animate-pulse" style={{ color: 'var(--accent-freeway)' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: 'var(--accent-freeway)' }} />
              載入中…
            </span>
          </span>
        )}
        {error && (
          <span className="text-xs ml-2" style={{ color: 'var(--accent-pink)' }}>
            {error}
          </span>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--accent-freeway)' }} />
                <div className="absolute inset-2 rounded-full animate-spin"
                  style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} />
                <div className="absolute inset-4 rounded-full"
                  style={{ background: 'var(--accent-freeway)', opacity: 0.2 }} />
              </div>
              <p className="text-sm font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                LOADING CAMERAS...
              </p>
            </div>
          </div>
        ) : view === 'map' ? (
          <div className="h-full p-3">
            <Map
              cameras={filteredCameras}
              query={query}
              onSelect={handleSelect}
              userLocation={userLocation}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <CameraList cameras={filteredCameras} query={query} onSelect={handleSelect} />
          </div>
        )}
      </main>

      <CameraModal camera={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
