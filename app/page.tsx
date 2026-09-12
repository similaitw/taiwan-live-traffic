'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { Camera } from '@/types/camera';
import { getDistance } from '@/lib/geo';
import { matchesCameraSearch } from '@/lib/camera-search';
import { getCameraRoadNumber, getRoadNeighbors, groupCamerasByRoad } from '@/lib/roads';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentCameras } from '@/hooks/useRecentCameras';
import SearchBar from '@/components/SearchBar';
import CameraList from '@/components/CameraList';
import CameraModal from '@/components/CameraModal';
import CameraBottomSheet from '@/components/CameraBottomSheet';
import CameraShareButton from '@/components/CameraShareButton';
import RoadFilter from '@/components/RoadFilter';
import RoadCameraNavigator from '@/components/RoadCameraNavigator';
import NearbyFilter, { type NearbyRadius } from '@/components/NearbyFilter';
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

function validCameraType(value: string | null): value is Camera['type'] {
  return value === 'freeway' || value === 'provincial' || value === 'county';
}

function parseNearbyRadius(value: string | null): NearbyRadius | null {
  return value === '5' || value === '10' || value === '20' ? Number(value) as NearbyRadius : null;
}

export default function HomePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('map');
  const [mobileSelected, setMobileSelected] = useState<Camera | null>(null);
  const [liveCamera, setLiveCamera] = useState<Camera | null>(null);
  const [typeFilter, setTypeFilter] = useState<Camera['type'] | 'all'>('all');
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState<NearbyRadius | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [urlReady, setUrlReady] = useState(false);
  const pendingCameraIdRef = useRef<string | null>(null);
  const restoredCameraIdRef = useRef<string | null>(null);
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { recentIds, addRecent } = useRecentCameras();
  const {
    location: userLocation,
    error: geolocationError,
    locate: locateMe,
  } = useGeolocation({ autoLocate: true });

  const roadGroups = useMemo(() => groupCamerasByRoad(cameras), [cameras]);
  const mobileRoadNeighbors = useMemo(
    () => (mobileSelected ? getRoadNeighbors(cameras, mobileSelected) : null),
    [cameras, mobileSelected]
  );
  const liveRoadNeighbors = useMemo(
    () => (liveCamera ? getRoadNeighbors(cameras, liveCamera) : null),
    [cameras, liveCamera]
  );

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    const type = params.get('type');
    if (validCameraType(type)) setTypeFilter(type);
    setSelectedRoad(params.get('road'));
    setNearbyRadius(parseNearbyRadius(params.get('nearby')));
    pendingCameraIdRef.current = params.get('camera');
    setUrlReady(true);
  }, []);

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

  useEffect(() => {
    if (!urlReady) return;
    updateUrl({
      q: query.trim() || null,
      type: typeFilter === 'all' ? null : typeFilter,
      road: selectedRoad,
      nearby: nearbyRadius ? String(nearbyRadius) : null,
    });
  }, [nearbyRadius, query, selectedRoad, typeFilter, updateUrl, urlReady]);

  useEffect(() => {
    if (loading || !selectedRoad || roadGroups.length === 0) return;
    if (!roadGroups.some((group) => group.roadNumber === selectedRoad)) {
      setSelectedRoad(null);
    }
  }, [loading, roadGroups, selectedRoad]);

  useEffect(() => {
    if (!urlReady || loading || cameras.length === 0) return;
    const cameraId = pendingCameraIdRef.current;
    if (!cameraId || restoredCameraIdRef.current === cameraId) return;

    const camera = cameras.find((item) => item.id === cameraId);
    if (!camera) {
      pendingCameraIdRef.current = null;
      updateUrl({ camera: null });
      return;
    }

    restoredCameraIdRef.current = cameraId;
    addRecent(camera.id);
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileSelected(camera);
    } else {
      setLiveCamera(camera);
    }
  }, [addRecent, cameras, loading, updateUrl, urlReady]);

  const handleDesktopSelect = useCallback((camera: Camera) => {
    addRecent(camera.id);
    updateUrl({ camera: camera.id });
    setLiveCamera(camera);
  }, [addRecent, updateUrl]);

  const handleMobileSelect = useCallback((camera: Camera) => {
    addRecent(camera.id);
    updateUrl({ camera: camera.id });
    setMobileSelected(camera);
  }, [addRecent, updateUrl]);

  const handleOpenLive = useCallback((camera: Camera) => {
    addRecent(camera.id);
    updateUrl({ camera: camera.id });
    setMobileSelected(null);
    setLiveCamera(camera);
  }, [addRecent, updateUrl]);

  const handleCloseMobile = useCallback(() => {
    setMobileSelected(null);
    updateUrl({ camera: null });
  }, [updateUrl]);

  const handleCloseLive = useCallback(() => {
    setLiveCamera(null);
    updateUrl({ camera: null });
  }, [updateUrl]);

  const handleToggleFavorite = useCallback(
    (camera: Camera) => toggleFavorite(camera.id),
    [toggleFavorite]
  );

  const handleNearbyChange = useCallback((radius: NearbyRadius | null) => {
    setNearbyRadius(radius);
    if (radius && !userLocation) locateMe();
  }, [locateMe, userLocation]);

  const favoriteIdSet = new Set(favoriteIds);
  const recentIdSet = new Set(recentIds);
  const recentRank = new globalThis.Map<string, number>(
    recentIds.map((id, index) => [id, index] as const)
  );

  const filtered = cameras
    .filter((camera) => {
      if (selectedRoad && getCameraRoadNumber(camera) !== selectedRoad) return false;
      if (favoritesOnly && !favoriteIdSet.has(camera.id)) return false;
      if (recentOnly && !recentIdSet.has(camera.id)) return false;
      if (typeFilter !== 'all' && camera.type !== typeFilter) return false;
      if (query && !matchesCameraSearch(camera, query)) return false;
      return true;
    })
    .map((camera) => {
      if (!userLocation) return { camera, distance: Infinity };
      return {
        camera,
        distance: getDistance(userLocation.lat, userLocation.lng, camera.lat, camera.lng),
      };
    })
    .filter((item) => nearbyRadius === null || (userLocation !== null && item.distance <= nearbyRadius * 1000));

  const sorted = nearbyRadius && userLocation
    ? [...filtered].sort((a, b) => a.distance - b.distance)
    : sortByNearest && userLocation
      ? [...filtered].sort((a, b) => a.distance - b.distance)
      : recentOnly
        ? [...filtered].sort(
            (a, b) => (recentRank.get(a.camera.id) ?? Number.MAX_SAFE_INTEGER) - (recentRank.get(b.camera.id) ?? Number.MAX_SAFE_INTEGER)
          )
        : filtered;

  const filteredCameras = sorted.map((item) => item.camera);
  const favoriteCount = cameras.filter((camera) => favoriteIdSet.has(camera.id)).length;
  const recentCount = cameras.filter((camera) => recentIdSet.has(camera.id)).length;

  const counts = {
    all: cameras.length,
    freeway: cameras.filter((c) => c.type === 'freeway').length,
    provincial: cameras.filter((c) => c.type === 'provincial').length,
    county: cameras.filter((c) => c.type === 'county').length,
  };

  const typeChips = (floating = false) =>
    (['all', 'freeway', 'provincial', 'county'] as const).map((type, index) => {
      const active = typeFilter === type;
      const color = TYPE_COLOR[type];
      return (
        <button
          key={type}
          type="button"
          onClick={() => setTypeFilter(type)}
          className={`shrink-0 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${floating ? 'px-3 py-2 backdrop-blur-xl' : 'px-3 py-1.5'}`}
          style={{
            animationDelay: `${index * 50}ms`,
            background: active ? color : floating ? 'rgba(10,14,26,0.82)' : 'rgba(255,255,255,0.04)',
            color: active ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
            boxShadow: active ? `0 0 16px ${color}33` : floating ? '0 6px 20px rgba(0,0,0,0.28)' : 'none',
          }}
        >
          {type === 'all'
            ? `全部 ${counts.all}`
            : `${TYPE_ICON[type]} ${TYPE_LABEL[type]} ${counts[type]}`}
        </button>
      );
    });

  const favoriteChip = (floating = false) => (
    <button
      type="button"
      onClick={() => {
        const next = !favoritesOnly;
        setFavoritesOnly(next);
        if (next) setRecentOnly(false);
      }}
      className={`shrink-0 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${floating ? 'px-3 py-2 backdrop-blur-xl' : 'px-3 py-1.5'}`}
      style={{
        background: favoritesOnly ? 'rgba(245,158,11,0.95)' : floating ? 'rgba(10,14,26,0.82)' : 'rgba(255,255,255,0.04)',
        color: favoritesOnly ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${favoritesOnly ? 'rgba(245,158,11,0.95)' : 'var(--border-subtle)'}`,
        boxShadow: favoritesOnly ? '0 0 16px rgba(245,158,11,0.28)' : floating ? '0 6px 20px rgba(0,0,0,0.28)' : 'none',
      }}
    >
      ★ 收藏 {favoriteCount}
    </button>
  );

  const recentChip = (floating = false) => (
    <button
      type="button"
      onClick={() => {
        const next = !recentOnly;
        setRecentOnly(next);
        if (next) setFavoritesOnly(false);
      }}
      className={`shrink-0 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${floating ? 'px-3 py-2 backdrop-blur-xl' : 'px-3 py-1.5'}`}
      style={{
        background: recentOnly ? 'rgba(99,102,241,0.95)' : floating ? 'rgba(10,14,26,0.82)' : 'rgba(255,255,255,0.04)',
        color: recentOnly ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${recentOnly ? 'rgba(99,102,241,0.95)' : 'var(--border-subtle)'}`,
        boxShadow: recentOnly ? '0 0 16px rgba(99,102,241,0.28)' : floating ? '0 6px 20px rgba(0,0,0,0.28)' : 'none',
      }}
    >
      ◷ 最近 {recentCount}
    </button>
  );

  return (
    <div className="h-screen overflow-hidden relative noise" style={{ background: 'var(--bg-primary)' }}>
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="pointer-events-none absolute top-0 right-1/4 w-72 h-72 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      {loading ? (
        <div className="relative z-10 flex items-center justify-center h-full">
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
      ) : (
        <>
          <div className="hidden md:flex h-full relative z-10">
            <aside
              className="w-[340px] xl:w-[380px] shrink-0 h-full flex flex-col"
              style={{
                background: 'rgba(10,14,26,0.94)',
                borderRight: '1px solid var(--border-subtle)',
                boxShadow: '12px 0 30px rgba(0,0,0,0.18)',
              }}
            >
              <div className="shrink-0 p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow"
                    style={{ background: 'linear-gradient(135deg, var(--accent-freeway), #6366f1)' }}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      全台監視器即時查詢
                    </h1>
                    <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                      TAIWAN LIVE TRAFFIC
                    </p>
                  </div>
                </div>

                <SearchBar value={query} onChange={setQuery} placeholder="搜尋道路、地點、監視器…" />

                <div className="flex flex-wrap gap-2 mt-3">
                  {typeChips()}
                  {favoriteChip()}
                  {recentChip()}
                  <RoadFilter groups={roadGroups} value={selectedRoad} onChange={setSelectedRoad} />
                  <NearbyFilter value={nearbyRadius} onChange={handleNearbyChange} />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={locateMe}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      color: 'var(--accent-provincial)',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    定位
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortByNearest((value) => !value)}
                    disabled={!userLocation || nearbyRadius !== null}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: sortByNearest && nearbyRadius === null ? 'var(--accent-freeway)' : 'rgba(255,255,255,0.04)',
                      color: sortByNearest && nearbyRadius === null ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${sortByNearest && nearbyRadius === null ? 'var(--accent-freeway)' : 'var(--border-subtle)'}`,
                      opacity: userLocation && nearbyRadius === null ? 1 : 0.4,
                    }}
                  >
                    離我最近
                  </button>
                </div>

                {nearbyRadius && !userLocation && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--accent-provincial)' }}>
                    正在取得位置以顯示 {nearbyRadius} km 內監視器…
                  </p>
                )}
                {userLocation && (
                  <p className="mt-2 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </p>
                )}
                {(error || geolocationError) && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--accent-pink)' }}>
                    {error || geolocationError}
                  </p>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                <CameraList
                  cameras={filteredCameras}
                  query={query}
                  onSelect={handleDesktopSelect}
                  variant="sidebar"
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </aside>

            <section className="flex-1 min-w-0 h-full p-3">
              <Map
                cameras={filteredCameras}
                query={query}
                onSelect={handleDesktopSelect}
                userLocation={userLocation}
              />
            </section>
          </div>

          <div className="md:hidden h-full relative z-10">
            <div className="absolute inset-x-3 top-3 z-40">
              <div className="glass rounded-xl shadow-2xl p-1.5">
                <SearchBar value={query} onChange={setQuery} placeholder="搜尋道路、地點、監視器…" />
              </div>
            </div>

            <div className="absolute left-3 right-3 top-[4.5rem] z-40 flex gap-2 overflow-x-auto pb-1">
              {typeChips(true)}
              {favoriteChip(true)}
              {recentChip(true)}
              <RoadFilter groups={roadGroups} value={selectedRoad} onChange={setSelectedRoad} compact />
              <NearbyFilter value={nearbyRadius} onChange={handleNearbyChange} compact />
            </div>

            <div className="absolute right-3 top-[8.25rem] z-40 flex flex-col items-end gap-2">
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
                onClick={() => setSortByNearest((value) => !value)}
                disabled={!userLocation || nearbyRadius !== null}
                aria-label="依距離排序"
                className="h-10 px-3 rounded-full glass shadow-xl text-xs font-bold"
                style={{
                  color: sortByNearest && nearbyRadius === null ? '#fff' : 'var(--text-secondary)',
                  background: sortByNearest && nearbyRadius === null ? 'var(--accent-freeway)' : 'var(--bg-glass)',
                  opacity: userLocation && nearbyRadius === null ? 1 : 0.45,
                }}
              >
                最近距離
              </button>
            </div>

            {(error || geolocationError) && (
              <div className="absolute left-3 right-3 top-[11.35rem] z-40 rounded-lg px-3 py-2 text-xs glass"
                style={{ color: 'var(--accent-pink)' }}>
                {error || geolocationError}
              </div>
            )}

            {!mobileSelected && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex rounded-full overflow-hidden glass shadow-2xl p-1">
                {(['map', 'list'] as const).map((mobileView) => (
                  <button
                    key={mobileView}
                    type="button"
                    onClick={() => setView(mobileView)}
                    className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: view === mobileView ? 'var(--accent-freeway)' : 'transparent',
                      color: view === mobileView ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {mobileView === 'map' ? '地圖' : '清單'}
                  </button>
                ))}
              </div>
            )}

            {view === 'map' ? (
              <div className="h-full">
                <Map
                  cameras={filteredCameras}
                  query={query}
                  onSelect={handleMobileSelect}
                  userLocation={userLocation}
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto px-3 pt-32 pb-24">
                <CameraList
                  cameras={filteredCameras}
                  query={query}
                  onSelect={handleMobileSelect}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}
          </div>
        </>
      )}

      <CameraBottomSheet
        camera={mobileSelected}
        onClose={handleCloseMobile}
        onOpenLive={handleOpenLive}
        favorite={mobileSelected ? isFavorite(mobileSelected.id) : false}
        onToggleFavorite={handleToggleFavorite}
        roadNeighbors={mobileRoadNeighbors}
        onNavigateRoad={handleMobileSelect}
      />
      <CameraModal camera={liveCamera} onClose={handleCloseLive} />
      {liveCamera && (
        <>
          <div className="hidden md:block fixed top-5 right-5 z-[100000]">
            <CameraShareButton camera={liveCamera} />
          </div>
          {liveRoadNeighbors && liveRoadNeighbors.total > 1 && (
            <div className="hidden md:block fixed bottom-5 left-[calc(50%+170px)] xl:left-[calc(50%+190px)] -translate-x-1/2 z-[100000]">
              <RoadCameraNavigator
                neighbors={liveRoadNeighbors}
                onNavigate={handleDesktopSelect}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
