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
import MapLayerControls, {
  type CmsLayerFilter,
  type EventLayerFilter,
  type FlowLayerFilter,
  type RainfallLayerFilter,
} from '@/components/MapLayerControls';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });
const RADAR_IMAGE_URL = 'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-006.png';

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
  const [eventFilter, setEventFilter] = useState<EventLayerFilter>('all');

  const [trafficFlow, setTrafficFlow] = useState<TrafficFlowResponse | null>(null);
  const [trafficSections, setTrafficSections] = useState<TrafficSectionsResponse | null>(null);
  const [flowEnabled, setFlowEnabled] = useState(false);
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [flowFilter, setFlowFilter] = useState<FlowLayerFilter>('all');

  const [cmsDevices, setCmsDevices] = useState<CmsDevice[]>([]);
  const [cmsEnabled, setCmsEnabled] = useState(false);
  const [showCms, setShowCms] = useState(true);
  const [cmsFilter, setCmsFilter] = useState<CmsLayerFilter>('active');
  const [cmsRoad, setCmsRoad] = useState('');

  const [rainfallStations, setRainfallStations] = useState<RainfallStation[]>([]);
  const [rainfallEnabled, setRainfallEnabled] = useState(false);
  const [showRainfall, setShowRainfall] = useState(true);
  const [rainfallFilter, setRainfallFilter] = useState<RainfallLayerFilter>('rainy');
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

  const radarImageUrl = showRadar
    ? `${RADAR_IMAGE_URL}?v=${radarVersion}`
    : undefined;

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-none md:rounded-xl"
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
      />

      <MapLayerControls
        rainfallEnabled={rainfallEnabled}
        showRainfall={showRainfall}
        onToggleRainfall={() => setShowRainfall((value) => !value)}
        rainfallFilter={rainfallFilter}
        onRainfallFilterChange={setRainfallFilter}
        rainfallCount={filteredRainfallStations.length}
        rainfallTotal={rainfallStations.length}
        showRadar={showRadar}
        onToggleRadar={() => setShowRadar((value) => !value)}
        cmsEnabled={cmsEnabled}
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
        showFlow={showTrafficFlow}
        onToggleFlow={() => setShowTrafficFlow((value) => !value)}
        flowFilter={flowFilter}
        onFlowFilterChange={setFlowFilter}
        flowCount={filteredCongestionSegments.length}
        flowTotal={congestionSegments.length}
        eventsEnabled={trafficEnabled}
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
