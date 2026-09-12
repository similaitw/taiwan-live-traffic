'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { Camera } from '@/types/camera';
import type { CmsDevice, CmsResponse } from '@/types/cms';
import type { RainfallResponse, RainfallStation } from '@/types/rainfall';
import type { TrafficEvent, TrafficEventsResponse } from '@/types/traffic-event';
import type { TrafficFlowMapSegment, TrafficFlowResponse } from '@/types/traffic-flow';
import type { TrafficSectionsResponse } from '@/types/traffic-section';
import { getDistance } from '@/lib/geo';
import { getCameraRoadNumber, normalizeRoadNumber } from '@/lib/roads';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });
const RADAR_IMAGE_URL = 'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-006.png';

type EventFilter = 'all' | 'important' | 'serious';
type FlowFilter = 'all' | 'congested';
type CmsFilter = 'active' | 'all' | 'abnormal';
type RainfallFilter = 'rainy' | 'all';

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function Map({ cameras, query, onSelect, userLocation }: Props) {
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [showTrafficEvents, setShowTrafficEvents] = useState(true);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');

  const [trafficFlow, setTrafficFlow] = useState<TrafficFlowResponse | null>(null);
  const [trafficSections, setTrafficSections] = useState<TrafficSectionsResponse | null>(null);
  const [flowEnabled, setFlowEnabled] = useState(false);
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [flowFilter, setFlowFilter] = useState<FlowFilter>('all');

  const [cmsDevices, setCmsDevices] = useState<CmsDevice[]>([]);
  const [cmsEnabled, setCmsEnabled] = useState(false);
  const [showCms, setShowCms] = useState(true);
  const [cmsFilter, setCmsFilter] = useState<CmsFilter>('active');
  const [cmsRoad, setCmsRoad] = useState('');

  const [rainfallStations, setRainfallStations] = useState<RainfallStation[]>([]);
  const [rainfallEnabled, setRainfallEnabled] = useState(false);
  const [showRainfall, setShowRainfall] = useState(true);
  const [rainfallFilter, setRainfallFilter] = useState<RainfallFilter>('rainy');
  const [showRadar, setShowRadar] = useState(false);
  const [radarVersion, setRadarVersion] = useState(0);

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
      })
      .catch(() => {
        if (cancelled) return;
        setTrafficEnabled(false);
        setTrafficEvents([]);
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
      })
      .catch(() => {
        if (cancelled) return;
        setCmsEnabled(false);
        setCmsDevices([]);
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
      })
      .catch(() => {
        if (cancelled) return;
        setRainfallEnabled(false);
        setRainfallStations([]);
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
        return { ...flow, roadId: section.roadId, roadName: section.roadName, roadDirection: section.roadDirection, sectionName: section.sectionName, start: section.start, end: section.end, paths: section.paths };
      })
      .filter((segment): segment is TrafficFlowMapSegment => segment !== null);
  }, [trafficFlow, trafficSections]);

  const filteredCongestionSegments = useMemo(() => {
    if (flowFilter === 'congested') return congestionSegments.filter((segment) => (segment.congestionLevel ?? 0) >= 3);
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

  const radarImageUrl = showRadar
    ? `${RADAR_IMAGE_URL}?v=${radarVersion}`
    : undefined;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-none md:rounded-xl" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
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
      />

      <div className="absolute right-3 bottom-16 md:bottom-auto md:top-3 z-[900] flex flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end items-center gap-2 max-w-[min(92vw,520px)]">
          {rainfallEnabled && showRainfall && rainfallStations.length > 0 && (
            <select value={rainfallFilter} onChange={(event) => setRainfallFilter(event.target.value as RainfallFilter)} className="h-9 rounded-full px-3 text-[11px] font-bold outline-none backdrop-blur-xl" style={{ background: 'rgba(10,14,26,0.9)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 22px rgba(0,0,0,0.28)' }} aria-label="雨量站篩選">
              <option value="rainy">近1小時有雨</option>
              <option value="all">全部雨量站</option>
            </select>
          )}
          {rainfallEnabled && (
            <button type="button" onClick={() => setShowRainfall((value) => !value)} className="h-9 px-3 rounded-full text-xs font-bold backdrop-blur-xl transition-all" style={{ background: showRainfall ? 'rgba(14,165,233,0.92)' : 'rgba(10,14,26,0.86)', color: '#fff', border: `1px solid ${showRainfall ? 'rgba(56,189,248,0.9)' : 'var(--border-subtle)'}`, boxShadow: '0 8px 22px rgba(0,0,0,0.3)' }} aria-pressed={showRainfall}>
              💧 雨量站 {showRainfall ? filteredRainfallStations.length : rainfallStations.length}
            </button>
          )}
          <button type="button" onClick={() => setShowRadar((value) => !value)} className="h-9 px-3 rounded-full text-xs font-bold backdrop-blur-xl transition-all" style={{ background: showRadar ? 'rgba(99,102,241,0.92)' : 'rgba(10,14,26,0.86)', color: '#fff', border: `1px solid ${showRadar ? 'rgba(129,140,248,0.9)' : 'var(--border-subtle)'}`, boxShadow: '0 8px 22px rgba(0,0,0,0.3)' }} aria-pressed={showRadar}>
            🌦 雷達 {showRadar ? '開' : '關'}
          </button>
        </div>

        {cmsEnabled && (
          <div className="flex flex-wrap justify-end items-center gap-2 max-w-[min(92vw,520px)]">
            {showCms && cmsDevices.length > 0 && (
              <>
                {cmsRoadOptions.length > 1 && (
                  <select value={cmsRoad} onChange={(event) => setCmsRoad(event.target.value)} className="h-9 rounded-full px-3 text-[11px] font-bold outline-none backdrop-blur-xl max-w-36" style={{ background: 'rgba(10,14,26,0.9)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 22px rgba(0,0,0,0.28)' }} aria-label="官方看板道路">
                    <option value="">全部道路</option>
                    {cmsRoadOptions.map((road) => <option key={road} value={road}>{road}</option>)}
                  </select>
                )}
                <select value={cmsFilter} onChange={(event) => setCmsFilter(event.target.value as CmsFilter)} className="h-9 rounded-full px-3 text-[11px] font-bold outline-none backdrop-blur-xl" style={{ background: 'rgba(10,14,26,0.9)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 22px rgba(0,0,0,0.28)' }} aria-label="官方看板篩選">
                  <option value="active">目前顯示</option>
                  <option value="all">全部設備</option>
                  <option value="abnormal">異常設備</option>
                </select>
              </>
            )}
            <button type="button" onClick={() => setShowCms((value) => !value)} className="h-9 px-3 rounded-full text-xs font-bold backdrop-blur-xl transition-all" style={{ background: showCms ? 'rgba(6,182,212,0.92)' : 'rgba(10,14,26,0.86)', color: '#fff', border: `1px solid ${showCms ? 'rgba(34,211,238,0.9)' : 'var(--border-subtle)'}`, boxShadow: '0 8px 22px rgba(0,0,0,0.3)' }} aria-pressed={showCms}>
              📢 官方看板 {showCms ? filteredCmsDevices.length : cmsDevices.length}
            </button>
          </div>
        )}

        {flowEnabled && (
          <div className="flex items-center gap-2">
            {showTrafficFlow && congestionSegments.length > 0 && (
              <select value={flowFilter} onChange={(event) => setFlowFilter(event.target.value as FlowFilter)} className="h-9 rounded-full px-3 text-[11px] font-bold outline-none backdrop-blur-xl" style={{ background: 'rgba(10,14,26,0.9)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 22px rgba(0,0,0,0.28)' }} aria-label="即時路況篩選">
                <option value="all">全部路況</option>
                <option value="congested">只看壅塞</option>
              </select>
            )}
            <button type="button" onClick={() => setShowTrafficFlow((value) => !value)} className="h-9 px-3 rounded-full text-xs font-bold backdrop-blur-xl transition-all" style={{ background: showTrafficFlow ? 'rgba(16,185,129,0.9)' : 'rgba(10,14,26,0.86)', color: '#fff', border: `1px solid ${showTrafficFlow ? 'rgba(52,211,153,0.85)' : 'var(--border-subtle)'}`, boxShadow: '0 8px 22px rgba(0,0,0,0.3)' }} aria-pressed={showTrafficFlow}>
              🚗 即時路況 {showTrafficFlow ? filteredCongestionSegments.length : congestionSegments.length}
            </button>
          </div>
        )}

        {trafficEnabled && (
          <div className="flex items-center gap-2">
            {showTrafficEvents && trafficEvents.length > 0 && (
              <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value as EventFilter)} className="h-9 rounded-full px-3 text-[11px] font-bold outline-none backdrop-blur-xl" style={{ background: 'rgba(10,14,26,0.9)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 22px rgba(0,0,0,0.28)' }} aria-label="交通事件嚴重程度">
                <option value="all">全部事件</option>
                <option value="important">警示以上</option>
                <option value="serious">嚴重事件</option>
              </select>
            )}
            <button type="button" onClick={() => setShowTrafficEvents((value) => !value)} className="h-9 px-3 rounded-full text-xs font-bold backdrop-blur-xl transition-all" style={{ background: showTrafficEvents ? 'rgba(239,68,68,0.92)' : 'rgba(10,14,26,0.86)', color: '#fff', border: `1px solid ${showTrafficEvents ? 'rgba(248,113,113,0.9)' : 'var(--border-subtle)'}`, boxShadow: '0 8px 22px rgba(0,0,0,0.3)' }} aria-pressed={showTrafficEvents}>
              ⚠ 交通事件 {showTrafficEvents ? filteredTrafficEvents.length : trafficEvents.length}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
