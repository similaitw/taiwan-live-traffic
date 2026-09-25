'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { Camera } from '@/types/camera';
import type { CmsDevice, CmsResponse } from '@/types/cms';
import type { RainfallResponse, RainfallStation } from '@/types/rainfall';
import type { TrafficEvent, TrafficEventsResponse } from '@/types/traffic-event';
import type { TrafficFlowMapSegment, TrafficFlowResponse } from '@/types/traffic-flow';
import type { TrafficSectionsResponse } from '@/types/traffic-section';
import type { TravelDirection } from '@/lib/directions';
import { getDistance } from '@/lib/geo';
import { getCameraRoadNumber, groupCamerasByRoad, normalizeRoadNumber } from '@/lib/roads';
import { buildRouteCorridor } from '@/lib/route-corridor';
import MapLayerControls, {
  type CmsLayerFilter,
  type EventLayerFilter,
  type FlowLayerFilter,
  type LayerHealth,
  type LayerHealthStatus,
  type RainfallLayerFilter,
} from '@/components/MapLayerControls';
import TripModeSummary from '@/components/TripModeSummary';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });
const RADAR_IMAGE_URL = 'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-006.png';
const LAYER_PREFERENCES_KEY = 'taiwan-live-traffic:map-layers:v1';

interface Props {
  cameras: Camera[];
  query: string;
  direction?: TravelDirection;
  onSelect: (c: Camera) => void;
  userLocation?: { lat: number; lng: number } | null;
  activeCameraId?: string;
}

interface StoredLayerPreferences {
  showRadar?: boolean;
  showRainfall?: boolean;
  rainfallFilter?: RainfallLayerFilter;
  showCms?: boolean;
  cmsFilter?: CmsLayerFilter;
  showTrafficFlow?: boolean;
  flowFilter?: FlowLayerFilter;
  showTrafficEvents?: boolean;
  eventFilter?: EventLayerFilter;
}

type ApiSourceStatus = 'ok' | 'partial' | 'disabled' | 'error';

function isRainfallFilter(value: unknown): value is RainfallLayerFilter {
  return value === 'rainy' || value === 'all';
}

function isCmsFilter(value: unknown): value is CmsLayerFilter {
  return value === 'active' || value === 'all' || value === 'abnormal';
}

function isFlowFilter(value: unknown): value is FlowLayerFilter {
  return value === 'all' || value === 'congested';
}

function isEventFilter(value: unknown): value is EventLayerFilter {
  return value === 'all' || value === 'important' || value === 'serious';
}

function latestTimestamp(values: Array<string | undefined>): string | undefined {
  let latest: { value: string; time: number } | undefined;
  for (const value of values) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) continue;
    if (!latest || time > latest.time) latest = { value, time };
  }
  return latest?.value;
}

function sourceHealth(
  provider: string,
  status: ApiSourceStatus,
  updatedAt?: string,
  staleAfterMs?: number,
  detail?: string,
): LayerHealth {
  let healthStatus: LayerHealthStatus = status;
  if (status === 'ok' && updatedAt && staleAfterMs) {
    const updatedTime = new Date(updatedAt).getTime();
    if (Number.isFinite(updatedTime) && Date.now() - updatedTime > staleAfterMs) {
      healthStatus = 'stale';
    }
  }
  return { status: healthStatus, provider, updatedAt, detail };
}

function sourceDetail(status: ApiSourceStatus, partialDetail?: string): string | undefined {
  if (status === 'disabled') return '需要 TDX 金鑰';
  if (status === 'error') return '目前無法取得資料';
  if (status === 'partial') return partialDetail ?? '部分來源暫時不可用';
  return undefined;
}

export default function Map({ cameras, query, direction, onSelect, userLocation, activeCameraId }: Props) {
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [eventsHealth, setEventsHealth] = useState<LayerHealth>({ status: 'loading', provider: 'TDX' });
  const [showTrafficEvents, setShowTrafficEvents] = useState(true);
  const [eventFilter, setEventFilter] = useState<EventLayerFilter>('all');

  const [trafficFlow, setTrafficFlow] = useState<TrafficFlowResponse | null>(null);
  const [trafficSections, setTrafficSections] = useState<TrafficSectionsResponse | null>(null);
  const [flowEnabled, setFlowEnabled] = useState(false);
  const [flowHealth, setFlowHealth] = useState<LayerHealth>({ status: 'loading', provider: 'TDX' });
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [flowFilter, setFlowFilter] = useState<FlowLayerFilter>('all');

  const [cmsDevices, setCmsDevices] = useState<CmsDevice[]>([]);
  const [cmsEnabled, setCmsEnabled] = useState(false);
  const [cmsHealth, setCmsHealth] = useState<LayerHealth>({ status: 'loading', provider: 'TDX' });
  const [showCms, setShowCms] = useState(true);
  const [cmsFilter, setCmsFilter] = useState<CmsLayerFilter>('active');
  const [cmsRoad, setCmsRoad] = useState('');

  const [rainfallStations, setRainfallStations] = useState<RainfallStation[]>([]);
  const [rainfallEnabled, setRainfallEnabled] = useState(false);
  const [rainfallHealth, setRainfallHealth] = useState<LayerHealth>({ status: 'loading', provider: 'CWA' });
  const [showRainfall, setShowRainfall] = useState(true);
  const [rainfallFilter, setRainfallFilter] = useState<RainfallLayerFilter>('rainy');
  const [showRadar, setShowRadar] = useState(false);
  const [radarVersion, setRadarVersion] = useState(0);
  const [layerPreferencesReady, setLayerPreferencesReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYER_PREFERENCES_KEY);
      if (!raw) return;
      const preferences = JSON.parse(raw) as StoredLayerPreferences;
      if (typeof preferences.showRadar === 'boolean') setShowRadar(preferences.showRadar);
      if (typeof preferences.showRainfall === 'boolean') setShowRainfall(preferences.showRainfall);
      if (isRainfallFilter(preferences.rainfallFilter)) setRainfallFilter(preferences.rainfallFilter);
      if (typeof preferences.showCms === 'boolean') setShowCms(preferences.showCms);
      if (isCmsFilter(preferences.cmsFilter)) setCmsFilter(preferences.cmsFilter);
      if (typeof preferences.showTrafficFlow === 'boolean') setShowTrafficFlow(preferences.showTrafficFlow);
      if (isFlowFilter(preferences.flowFilter)) setFlowFilter(preferences.flowFilter);
      if (typeof preferences.showTrafficEvents === 'boolean') setShowTrafficEvents(preferences.showTrafficEvents);
      if (isEventFilter(preferences.eventFilter)) setEventFilter(preferences.eventFilter);
    } catch {
      // Invalid or unavailable localStorage falls back to safe defaults.
    } finally {
      setLayerPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!layerPreferencesReady) return;
    const preferences: StoredLayerPreferences = {
      showRadar,
      showRainfall,
      rainfallFilter,
      showCms,
      cmsFilter,
      showTrafficFlow,
      flowFilter,
      showTrafficEvents,
      eventFilter,
    };
    try {
      window.localStorage.setItem(LAYER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // Browsing mode or quota restrictions must not affect the map.
    }
  }, [
    cmsFilter,
    eventFilter,
    flowFilter,
    layerPreferencesReady,
    rainfallFilter,
    showCms,
    showRadar,
    showRainfall,
    showTrafficEvents,
    showTrafficFlow,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/traffic-events')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<TrafficEventsResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setTrafficEnabled(payload.enabled);
        setTrafficEvents(payload.enabled ? payload.events : []);
        setEventsHealth(sourceHealth(
          payload.source.provider,
          payload.source.status,
          payload.source.fetchedAt,
          undefined,
          sourceDetail(payload.source.status),
        ));
      })
      .catch(() => {
        if (cancelled) return;
        setTrafficEnabled(false);
        setTrafficEvents([]);
        setEventsHealth({ status: 'error', provider: 'TDX', detail: '無法連線至事件資料' });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/traffic-flow')
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<TrafficFlowResponse>;
        })
        .catch(() => null),
      fetch('/api/traffic-sections')
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<TrafficSectionsResponse>;
        })
        .catch(() => null),
    ]).then(([flow, sections]) => {
      if (cancelled) return;
      setTrafficFlow(flow);
      setTrafficSections(sections);
      setFlowEnabled(Boolean(flow?.enabled && sections?.enabled));

      if (!flow || !sections) {
        setFlowHealth({ status: 'error', provider: 'TDX', detail: '路況或路段資料暫時無法取得' });
        return;
      }

      let status: ApiSourceStatus = 'ok';
      if (flow.source.status === 'disabled' || sections.source.status === 'disabled') status = 'disabled';
      else if (flow.source.status === 'error' || sections.source.status === 'error') status = 'error';
      else if (sections.source.status === 'partial') status = 'partial';

      setFlowHealth(sourceHealth(
        'TDX',
        status,
        flow.source.dataCollectTime ?? flow.source.fetchedAt,
        10 * 60 * 1000,
        sourceDetail(status, '部分路段幾何暫時不可用'),
      ));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/cms')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<CmsResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setCmsEnabled(payload.enabled);
        setCmsDevices(payload.enabled ? payload.devices : []);
        const latestData = latestTimestamp(payload.devices.map((device) => device.dataCollectTime));
        setCmsHealth(sourceHealth(
          payload.source.provider,
          payload.source.status,
          latestData ?? payload.source.fetchedAt,
          15 * 60 * 1000,
          sourceDetail(payload.source.status, '部分 CMS 來源暫時不可用'),
        ));
      })
      .catch(() => {
        if (cancelled) return;
        setCmsEnabled(false);
        setCmsDevices([]);
        setCmsHealth({ status: 'error', provider: 'TDX', detail: '無法連線至 CMS 資料' });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/rainfall')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<RainfallResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setRainfallEnabled(payload.enabled);
        setRainfallStations(payload.enabled ? payload.stations : []);
        setRainfallHealth(sourceHealth(
          payload.source.provider,
          payload.source.status,
          payload.source.observedAt ?? payload.source.fetchedAt,
          25 * 60 * 1000,
          payload.source.status === 'error' ? '目前無法取得雨量資料' : undefined,
        ));
      })
      .catch(() => {
        if (cancelled) return;
        setRainfallEnabled(false);
        setRainfallStations([]);
        setRainfallHealth({ status: 'error', provider: 'CWA', detail: '無法連線至雨量資料' });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const update = () => setRadarVersion(Math.floor(Date.now() / (10 * 60 * 1000)));
    update();
    const timer = window.setInterval(update, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredTrafficEvents = useMemo(() => {
    if (eventFilter === 'serious') return trafficEvents.filter((event) => event.severity === 'serious');
    if (eventFilter === 'important') return trafficEvents.filter((event) => event.severity !== 'info');
    return trafficEvents;
  }, [eventFilter, trafficEvents]);

  const congestionSegments = useMemo<TrafficFlowMapSegment[]>(() => {
    if (!trafficFlow?.enabled || !trafficSections?.enabled) return [];
    const sectionById = new globalThis.Map(
      trafficSections.sections.map((section) => [section.sectionId, section] as const),
    );
    return trafficFlow.segments
      .map((flow): TrafficFlowMapSegment | null => {
        const section = sectionById.get(flow.sectionId);
        if (!section || section.paths.length === 0) return null;
        return {
          ...flow,
          roadId: section.roadId,
          roadName: section.roadName,
          roadDirection: section.roadDirection,
          sectionName: section.sectionName,
          start: section.start,
          end: section.end,
          paths: section.paths,
        };
      })
      .filter((segment): segment is TrafficFlowMapSegment => segment !== null);
  }, [trafficFlow, trafficSections]);

  const filteredCongestionSegments = useMemo(() => {
    if (flowFilter === 'congested') {
      return congestionSegments.filter((segment) => (segment.congestionLevel ?? 0) >= 3);
    }
    return congestionSegments;
  }, [congestionSegments, flowFilter]);

  const cmsRoadOptions = useMemo(() => {
    return [...new Set(
      cmsDevices
        .map((device) => device.roadName ?? device.roadId)
        .filter((value): value is string => Boolean(value)),
    )].sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true }));
  }, [cmsDevices]);

  const filteredCmsDevices = useMemo(() => {
    return cmsDevices.filter((device) => {
      if (typeof device.lat !== 'number' || typeof device.lng !== 'number') return false;
      if (cmsRoad && (device.roadName ?? device.roadId) !== cmsRoad) return false;
      if (cmsFilter === 'active') return device.active;
      if (cmsFilter === 'abnormal') return device.status !== undefined && device.status !== 0;
      return true;
    });
  }, [cmsDevices, cmsFilter, cmsRoad]);

  const cmsPreferredCameraIds = useMemo(() => {
    const preferences: Record<string, string> = {};
    for (const device of filteredCmsDevices) {
      if (typeof device.lat !== 'number' || typeof device.lng !== 'number') continue;
      const roadNumber = normalizeRoadNumber(device.roadName) ?? normalizeRoadNumber(device.roadId);
      if (!roadNumber) continue;
      const sameRoad = cameras.filter((camera) => getCameraRoadNumber(camera) === roadNumber);
      let best: { id: string; distance: number } | null = null;
      for (const camera of sameRoad) {
        const distance = getDistance(device.lat, device.lng, camera.lat, camera.lng);
        if (!best || distance < best.distance) best = { id: camera.id, distance };
      }
      if (best) preferences[device.id] = best.id;
    }
    return preferences;
  }, [cameras, filteredCmsDevices]);

  const filteredRainfallStations = useMemo(() => {
    if (rainfallFilter === 'all') return rainfallStations;
    return rainfallStations.filter((station) => (station.rainfall.past1Hr ?? 0) > 0);
  }, [rainfallFilter, rainfallStations]);

  const corridorRoad = useMemo(() => {
    const groups = groupCamerasByRoad(cameras);
    return groups.length === 1 ? groups[0]?.roadNumber : undefined;
  }, [cameras]);

  const routeCorridor = useMemo(() => {
    if (!corridorRoad) return null;
    return buildRouteCorridor({
      roadNumber: corridorRoad,
      direction,
      cameras,
      trafficFlowSegments: flowEnabled ? congestionSegments : undefined,
      trafficEvents: trafficEnabled ? trafficEvents : undefined,
      cmsDevices: cmsEnabled ? cmsDevices : undefined,
      rainfallStations: rainfallEnabled ? rainfallStations : undefined,
    });
  }, [
    cameras,
    cmsDevices,
    cmsEnabled,
    congestionSegments,
    corridorRoad,
    direction,
    flowEnabled,
    rainfallEnabled,
    rainfallStations,
    trafficEnabled,
    trafficEvents,
  ]);

  const radarImageUrl = showRadar
    ? `${RADAR_IMAGE_URL}?v=${radarVersion}`
    : undefined;

  return (
    <div
      className="relative isolate z-0 w-full h-full overflow-hidden rounded-none md:rounded-xl"
      style={{
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <MapInner
        cameras={cameras}
        query={query}
        onSelect={onSelect}
        userLocation={userLocation}
        trafficEvents={showTrafficEvents ? filteredTrafficEvents : []}
        trafficFlowSegments={showTrafficFlow ? filteredCongestionSegments : []}
        cmsDevices={showCms ? filteredCmsDevices : []}
        cmsPreferredCameraIds={cmsPreferredCameraIds}
        rainfallStations={showRainfall ? filteredRainfallStations : []}
        radarImageUrl={radarImageUrl}
        activeCameraId={activeCameraId}
      />

      {routeCorridor && <TripModeSummary corridor={routeCorridor} />}

      <MapLayerControls
        rainfallEnabled={rainfallEnabled}
        rainfallHealth={rainfallHealth}
        showRainfall={showRainfall}
        onToggleRainfall={() => setShowRainfall((value) => !value)}
        rainfallFilter={rainfallFilter}
        onRainfallFilterChange={setRainfallFilter}
        rainfallCount={filteredRainfallStations.length}
        rainfallTotal={rainfallStations.length}
        showRadar={showRadar}
        onToggleRadar={() => setShowRadar((value) => !value)}
        cmsEnabled={cmsEnabled}
        cmsHealth={cmsHealth}
        showCms={showCms}
        onToggleCms={() => setShowCms((value) => !value)}
        cmsFilter={cmsFilter}
        onCmsFilterChange={setCmsFilter}
        cmsRoad={cmsRoad}
        onCmsRoadChange={setCmsRoad}
        cmsRoadOptions={cmsRoadOptions}
        cmsCount={filteredCmsDevices.length}
        cmsTotal={cmsDevices.length}
        flowEnabled={flowEnabled}
        flowHealth={flowHealth}
        showFlow={showTrafficFlow}
        onToggleFlow={() => setShowTrafficFlow((value) => !value)}
        flowFilter={flowFilter}
        onFlowFilterChange={setFlowFilter}
        flowCount={filteredCongestionSegments.length}
        flowTotal={congestionSegments.length}
        eventsEnabled={trafficEnabled}
        eventsHealth={eventsHealth}
        showEvents={showTrafficEvents}
        onToggleEvents={() => setShowTrafficEvents((value) => !value)}
        eventFilter={eventFilter}
        onEventFilterChange={setEventFilter}
        eventCount={filteredTrafficEvents.length}
        eventTotal={trafficEvents.length}
      />
    </div>
  );
}
