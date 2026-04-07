'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Camera } from '@/types/camera';
import SearchBar from '@/components/SearchBar';
import CameraList from '@/components/CameraList';
import CameraModal from '@/components/CameraModal';
import Map from '@/components/Map';
import styles from './floating-panel.module.css';

type View = 'map' | 'list';

const TYPE_LABEL: Record<Camera['type'], string> = {
  freeway: '國道',
  provincial: '省道',
  county: '縣市',
};

const RANGE_OPTIONS = ['all', 5, 10, 20, 50] as const;
const RANGE_LABEL: Record<typeof RANGE_OPTIONS[number], string> = {
  all: '全部',
  5: '5 公里',
  10: '10 公里',
  20: '20 公里',
  50: '50 公里',
};

export default function HomePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('map');
  const [selected, setSelected] = useState<Camera | null>(null);
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useCallback((node: HTMLDivElement | null) => {
    if (node && isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const maxX = Math.max(0, window.innerWidth - (node.offsetWidth || 400));
        const maxY = Math.max(0, window.innerHeight - (node.offsetHeight || 200));
        const newX = Math.max(0, Math.min(maxX, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(maxY, e.clientY - dragOffset.y));
        setPanelPosition({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handlePanelMouseDown = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
    const node = e.currentTarget;
    if (!node) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y,
    });
  };
  const [typeFilter, setTypeFilter] = useState<Camera['type'] | 'all'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [rangeFilter, setRangeFilter] = useState<'all' | 5 | 10 | 20 | 50>('all');

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
  const handleToggleSelected = useCallback((camera: Camera) => {
    setSelectedCameraIds((ids) =>
      ids.includes(camera.id)
        ? ids.filter((id) => id !== camera.id)
        : [...ids, camera.id]
    );
  }, []);

  useEffect(() => {
    if (!userLocation && rangeFilter !== 'all') {
      setRangeFilter('all');
    }
  }, [userLocation, rangeFilter]);

  useEffect(() => {
    if (showOnlySelected && selectedCameraIds.length === 0) {
      setShowOnlySelected(false);
    }
  }, [showOnlySelected, selectedCameraIds.length]);

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
      const distance = userLocation
        ? getDistance(userLocation.lat, userLocation.lng, c.lat, c.lng)
        : Infinity;
      return {
        camera: c,
        distance,
      };
    });

  const sorted =
    sortByNearest && userLocation
      ? [...filtered].sort((a, b) => a.distance - b.distance)
      : filtered;

  const selectedFiltered = showOnlySelected
    ? sorted.filter((item) => selectedCameraIds.includes(item.camera.id))
    : sorted;

  const rangeFiltered = selectedFiltered.filter((item) =>
    rangeFilter === 'all' || item.distance <= rangeFilter * 1000
  );

  const filteredCameras = rangeFiltered.map((item) => item.camera);

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
          <div
            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer"
            role="button"
            title={isPanelExpanded ? '收起篩選面板' : '展開篩選面板'}
            aria-pressed={isPanelExpanded}
            onClick={() => setIsPanelExpanded((v) => !v)}
          >
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

      {/* Main content */}
      <main className="relative flex-1 overflow-hidden">
        {/* Floating Control Panel */}
        <div
          ref={panelRef}
          className={`${styles.floatingPanel} ${isDragging ? styles.dragging : ''}`}
          style={{
            left: `${panelPosition.x}px`,
            top: `${panelPosition.y}px`,
          }}
        >
          {isPanelExpanded && (
            <div className="w-[calc(100vw-2rem)] max-w-4xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-4 flex flex-col gap-3">
              {/* Drag handle */}
              <div
                onMouseDown={handlePanelMouseDown}
                className="w-full h-2 -m-4 mb-2 cursor-grab active:cursor-grabbing rounded-t-3xl hover:bg-slate-100/30"
              />

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-600">篩選聊天</h3>
                <button
                  onClick={() => setIsPanelExpanded(false)}
                  title="Close panel"
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
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
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {RANGE_OPTIONS.map((range) => (
                    <button
                      key={range}
                      onClick={() => setRangeFilter(range)}
                      disabled={range !== 'all' && !userLocation}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        rangeFilter === range
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${range !== 'all' && !userLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {RANGE_LABEL[range]}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowOnlySelected((v) => !v)}
                    disabled={selectedCameraIds.length === 0}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      showOnlySelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${selectedCameraIds.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {showOnlySelected ? '只顯示勾選' : '顯示勾選'}
                  </button>

                  <button
                    onClick={() => setSelectedCameraIds([])}
                    disabled={selectedCameraIds.length === 0}
                    className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    清除勾選
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500">
                  {selectedCameraIds.length > 0 ? (
                    <span>已勾選 {selectedCameraIds.length} 台。按住 Shift 點選地圖標記以切換勾選。</span>
                  ) : (
                    <span>使用 Shift+點選地圖標記進行勾選，再啟用「只顯示勾選」。</span>
                  )}

                  {userLocation && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-500">
                      目前位置：{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </span>
                  )}

                  {rangeFilter !== 'all' && userLocation && (
                    <span className="px-2 py-1 bg-blue-50 rounded text-blue-600">
                      顯示 {RANGE_LABEL[rangeFilter]} 內監視器
                    </span>
                  )}

                  {loading && <span className="text-gray-400">載入中…</span>}
                  {error && <span className="text-red-500">錯誤：{error}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
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
              onToggleSelect={handleToggleSelected}
              selectedIds={selectedCameraIds}
              userLocation={userLocation}
              rangeKm={rangeFilter === 'all' ? null : rangeFilter}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <CameraList
              items={rangeFiltered}
              query={query}
              onSelect={handleSelect}
              selectedIds={selectedCameraIds}
            />
          </div>
        )}
      </main>

      <CameraModal camera={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
