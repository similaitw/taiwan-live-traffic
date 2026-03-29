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
    const R = 6371e3; // meters
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

    // Auto-locate on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // 定位失敗時靜默，不顯示錯誤
        },
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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0 z-30">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0
                  012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <h1 className="font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap">
            全台監視器即時查詢
          </h1>
        </div>

        <SearchBar value={query} onChange={setQuery} />

        {/* View toggle */}
        <div className="flex shrink-0 rounded-lg border border-gray-300 overflow-hidden">
          {(['map', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'map' ? '地圖' : '清單'}
            </button>
          ))}
        </div>
      </header>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex flex-wrap items-center gap-2 shrink-0 overflow-x-auto">
        {(['all', 'freeway', 'provincial', 'county'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              typeFilter === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? `全部 (${counts.all})` : `${TYPE_LABEL[t]} (${counts[t]})`}
          </button>
        ))}

        <button
          onClick={locateMe}
          className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
        >
          定位我
        </button>

        <button
          onClick={() => setSortByNearest((v) => !v)}
          disabled={!userLocation}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            sortByNearest
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${!userLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          離我最近
        </button>

        {userLocation && (
          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
            目前位置：{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </span>
        )}

        {loading && (
          <span className="text-xs text-gray-400 ml-2">載入中…</span>
        )}
        {error && (
          <span className="text-xs text-red-500 ml-2">錯誤：{error}</span>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm">正在載入監視器資料…</p>
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
