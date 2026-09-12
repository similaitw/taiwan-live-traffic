'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Camera } from '@/types/camera';
import { getDistance } from '@/lib/geo';
import { useGeolocation } from '@/hooks/useGeolocation';
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

const TYPE_COLOR: Record<Camera['type'] | 'all', string> = {
  all: 'var(--accent-freeway)',
  freeway: 'var(--accent-freeway)',
  provincial: 'var(--accent-provincial)',
  county: 'var(--accent-county)',
};

export default function HomePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('map');
  const [selected, setSelected] = useState<Camera | null>(null);
  const [typeFilter, setTypeFilter] = useState<Camera['type'] | 'all'>('all');
  const [sortByNearest, setSortByNearest] = useState(false);
  const {
    location: userLocation,
    error: geolocationError,
    locate: locateMe,
  } = useGeolocation({ autoLocate: true });

  useEffect(() => {
    fetch('/api/cameras')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Camera[]) => setCameras(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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

  const typeChips = (compact = false) =>
    (['all', 'freeway', 'provincial', 'county'] as const).map((t, i) => {
      const active = typeFilter === t;
      const color = TYPE_COLOR[t];
      return (
        <button
          key={t}
          type="button"
          onClick={() => setTypeFilter(t)}
          className={`shrink-0 rounded-full font-bold tracking-wide transition-all duration-200 ${compact ? 'px-3 py-2 text-xs backdrop-blur-xl' : 'px-3 py-1.5 text-xs'}`}
          style={{
            animationDelay: `${i * 50}ms`,
            background: active ? color : compact ? 'rgba(10,14,26,0.82)' : 'rgba(255,255,255,0.04)',
            color: active ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
            boxShadow: active ? `0 0 16px ${color}33` : compact ? '0 6px 20px rgba(0,0,0,0.28)' : 'none',
          }}
        >
          {t === 'all'
            ? `全部 ${counts.all}`
            : `${TYPE_ICON[t]} ${TYPE_LABEL[t]} ${counts[t]}`}
        </button>
      );
    });

  return (
    <div className="flex flex-col h-screen overflow-hidden relative noise" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="pointer-events-none absolute top-0 right-1/4 w-72 h-72 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      {/* Desktop / tablet header. Mobile is map-first and uses floating controls. */}
      <header className="relative z-30 shrink-0 glass hidden md:block" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-9 h-9 rounded-lg flex items-center justify-center animate-pulse-glow"
              style={{ background: 'linear-gradient(135deg, var(--accent-freeway), #6366f1)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0
                    012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                全台監視器即時查詢
              </h1>
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                LIVE TRAFFIC CAM
              </p>
            </div>
          </div>

          <SearchBar value={query} onChange={setQuery} />

          <div className="flex shrink-0 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            {(['map', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
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

      {/* Desktop / tablet filters */}
      <div className="relative z-20 shrink-0 px-4 py-2.5 hidden md:flex flex-wrap items-center gap-2 overflow-x-auto"
        style={{ background: 'rgba(17, 24, 39, 0.6)', borderBottom: '1px solid var(--border-subtle)' }}>
        {typeChips()}

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />

        <button
          type="button"
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
          type="button"
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
        {(error || geolocationError) && (
          <span className="text-xs ml-2" style={{ color: 'var(--accent-pink)' }}>
            {error || geolocationError}
          </span>
        )}
      </div>

      <main className="flex-1 overflow-hidden relative">
        {!loading && (
          <>
            {/* Mobile floating search */}
            <div className="md:hidden absolute inset-x-3 top-3 z-40">
              <div className="glass rounded-xl shadow-2xl p-1.5">
                <SearchBar value={query} onChange={setQuery} placeholder="搜尋道路、地點、監視器…" />
              </div>
            </div>

            {/* Mobile horizontal filter chips */}
            <div className="md:hidden absolute left-3 right-3 top-[4.5rem] z-40 flex gap-2 overflow-x-auto pb-1">
              {typeChips(true)}
            </div>

            {/* Mobile map actions */}
            <div className="md:hidden absolute right-3 top-[8.25rem] z-40 flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={locateMe}
                aria-label="定位到目前位置"
                className="w-11 h-11 rounded-full glass shadow-xl flex items-center justify-center"
                style={{ color: 'var(--accent-provincial)' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setSortByNearest((v) => !v)}
                disabled={!userLocation}
                aria-label="依距離排序"
                className="h-10 px-3 rounded-full glass shadow-xl text-xs font-bold"
                style={{
                  color: sortByNearest ? '#fff' : 'var(--text-secondary)',
                  background: sortByNearest ? 'var(--accent-freeway)' : 'var(--bg-glass)',
                  opacity: userLocation ? 1 : 0.45,
                }}
              >
                最近
              </button>
            </div>

            {(error || geolocationError) && (
              <div className="md:hidden absolute left-3 right-3 top-[11.35rem] z-40 rounded-lg px-3 py-2 text-xs glass"
                style={{ color: 'var(--accent-pink)' }}>
                {error || geolocationError}
              </div>
            )}

            {/* Mobile Map/List switch kept compact and out of the map's top controls. */}
            <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex rounded-full overflow-hidden glass shadow-2xl p-1">
              {(['map', 'list'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: view === v ? 'var(--accent-freeway)' : 'transparent',
                    color: view === v ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {v === 'map' ? '地圖' : '清單'}
                </button>
              ))}
            </div>
          </>
        )}

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
          <div className="h-full p-0 md:p-3">
            <Map
              cameras={filteredCameras}
              query={query}
              onSelect={handleSelect}
              userLocation={userLocation}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-3 pt-32 pb-24 md:p-4">
            <CameraList cameras={filteredCameras} query={query} onSelect={handleSelect} />
          </div>
        )}
      </main>

      <CameraModal camera={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
