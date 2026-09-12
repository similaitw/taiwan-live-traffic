'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Camera } from '@/types/camera';
import type { TrafficEvent } from '@/types/traffic-event';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COLORS: Record<Camera['type'], string> = {
  freeway: '#3b82f6',
  provincial: '#10b981',
  county: '#f59e0b',
};

const EVENT_COLORS: Record<TrafficEvent['severity'], string> = {
  info: '#38bdf8',
  warning: '#f59e0b',
  serious: '#ef4444',
};

const EVENT_LABELS: Record<TrafficEvent['severity'], string> = {
  info: '道路事件',
  warning: '注意',
  serious: '嚴重',
};

interface CameraCluster {
  key: string;
  cameras: Camera[];
  lat: number;
  lng: number;
}

interface RenderedMarker {
  marker: L.Marker;
  signature: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatEventTime(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeIcon(type: Camera['type']): L.DivIcon {
  const color = COLORS[type];
  return L.divIcon({
    className: '',
    html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-${type}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feFlood flood-color="${color}" flood-opacity="0.4" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 20 12 20S24 20 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="1" filter="url(#glow-${type})"/>
      <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.9)"/>
    </svg>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
    tooltipAnchor: [12, -16],
  });
}

function makeClusterIcon(count: number): L.DivIcon {
  const size = count >= 100 ? 52 : count >= 25 ? 46 : 40;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-family:'JetBrains Mono',monospace;
      font-weight:800;
      font-size:${count >= 100 ? 11 : 12}px;
      background:linear-gradient(135deg,rgba(59,130,246,0.96),rgba(99,102,241,0.96));
      border:2px solid rgba(255,255,255,0.65);
      box-shadow:0 0 0 6px rgba(59,130,246,0.14),0 8px 24px rgba(0,0,0,0.42);
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeEventIcon(severity: TrafficEvent['severity']): L.DivIcon {
  const color = EVENT_COLORS[severity];
  const size = severity === 'serious' ? 34 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      display:flex;
      align-items:center;
      justify-content:center;
      transform:rotate(45deg);
      border-radius:8px;
      color:#fff;
      background:${color};
      border:2px solid rgba(255,255,255,0.82);
      box-shadow:0 0 0 5px ${color}22,0 8px 22px rgba(0,0,0,0.42);
      font-size:15px;
      font-weight:900;
    "><span style="transform:rotate(-45deg);line-height:1">!</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
}

function clusterCameras(map: L.Map, cameras: Camera[], zoom: number): CameraCluster[] {
  if (zoom >= 15) {
    return cameras.map((camera) => ({
      key: `camera:${camera.id}`,
      cameras: [camera],
      lat: camera.lat,
      lng: camera.lng,
    }));
  }

  const cellSize = zoom <= 7 ? 110 : zoom <= 9 ? 90 : zoom <= 11 ? 72 : zoom <= 13 ? 56 : 42;
  const groups = new Map<string, { cameras: Camera[]; latSum: number; lngSum: number }>();

  for (const camera of cameras) {
    const point = map.project(L.latLng(camera.lat, camera.lng), zoom);
    const gridKey = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const existing = groups.get(gridKey);

    if (existing) {
      existing.cameras.push(camera);
      existing.latSum += camera.lat;
      existing.lngSum += camera.lng;
    } else {
      groups.set(gridKey, {
        cameras: [camera],
        latSum: camera.lat,
        lngSum: camera.lng,
      });
    }
  }

  return [...groups.entries()].map(([gridKey, group]) => ({
    key: group.cameras.length === 1
      ? `camera:${group.cameras[0]!.id}`
      : `cluster:${zoom}:${gridKey}`,
    cameras: group.cameras,
    lat: group.latSum / group.cameras.length,
    lng: group.lngSum / group.cameras.length,
  }));
}

function clusterSignature(cluster: CameraCluster): string {
  if (cluster.cameras.length === 1) return cluster.cameras[0]!.id;
  return cluster.cameras.map((camera) => camera.id).sort().join('|');
}

function eventSignature(event: TrafficEvent): string {
  return [
    event.id,
    event.severity,
    event.lat,
    event.lng,
    event.title,
    event.description,
    event.publishTime,
  ].join('|');
}

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
  userLocation?: { lat: number; lng: number } | null;
  trafficEvents?: TrafficEvent[];
}

export default function MapInner({
  cameras,
  query,
  onSelect,
  userLocation,
  trafficEvents = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const eventLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const renderedMarkersRef = useRef<Map<string, RenderedMarker>>(new Map());
  const renderedEventMarkersRef = useRef<Map<string, RenderedMarker>>(new Map());
  const renderFrameRef = useRef<number | null>(null);
  const eventRenderFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([23.9, 121.0], 8);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);
    eventLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (renderFrameRef.current !== null) cancelAnimationFrame(renderFrameRef.current);
      if (eventRenderFrameRef.current !== null) cancelAnimationFrame(eventRenderFrameRef.current);
      renderedMarkersRef.current.clear();
      renderedEventMarkersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }

    const userIcon = L.divIcon({
      className: '',
      html: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" stroke-width="1"/>
        <circle cx="14" cy="14" r="6" fill="#3b82f6" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
        <circle cx="14" cy="14" r="2" fill="white"/>
      </svg>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 2000,
    }).addTo(mapRef.current);

    mapRef.current.setView([userLocation.lat, userLocation.lng], 12, { animate: true });
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    const map = mapRef.current;
    const layer = layerRef.current;

    const createCameraMarker = (camera: Camera): L.Marker => {
      const marker = L.marker([camera.lat, camera.lng], {
        icon: makeIcon(camera.type),
        zIndexOffset: 1000,
        title: camera.name,
      });
      const color = COLORS[camera.type];

      const previewContent = `
        <div style="width:200px; font-family:'Noto Sans TC',sans-serif;">
          <div style="position:relative; width:100%; aspect-ratio:16/9; overflow:hidden; background:#0a0e1a; margin-bottom:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
            <img src="/api/proxy/snapshot?url=${encodeURIComponent(camera.snapshotUrl ?? camera.streamUrl)}" alt="${escapeHtml(camera.name)}"
              style="width:100%; height:100%; object-fit:cover;"
              onerror="this.style.display='none'"/>
          </div>
          <div style="padding:0 2px;">
            <div style="font-weight:700; color:#e8ecf4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12px; line-height:1.4; margin-bottom:4px;">
              ${escapeHtml(camera.name)}
            </div>
            <div style="color:#4b5563; font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; font-family:'JetBrains Mono',monospace;">
              ${escapeHtml(camera.road ?? '—')}
            </div>
            <div style="padding-top:8px; border-top:1px solid rgba(255,255,255,0.06); color:${color}; font-size:10px; font-weight:700; text-align:center; letter-spacing:0.05em;">
              點擊查看
            </div>
          </div>
        </div>
      `;

      const popup = L.popup({ maxWidth: 220, className: 'leaflet-camera-preview' })
        .setContent(previewContent);

      marker.on('mouseover', () => {
        popup.setLatLng(marker.getLatLng()).openOn(map);
      });
      marker.on('mouseout', () => map.closePopup(popup));
      marker.on('click', () => {
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13), {
          animate: true,
          duration: 0.8,
        });
        map.closePopup(popup);
        onSelect(camera);
      });

      return marker;
    };

    const createClusterMarker = (cluster: CameraCluster, zoom: number): L.Marker => {
      const marker = L.marker([cluster.lat, cluster.lng], {
        icon: makeClusterIcon(cluster.cameras.length),
        zIndexOffset: 800,
        keyboard: true,
        title: `${cluster.cameras.length} 支監視器`,
      });

      marker.on('click', () => {
        map.setView([cluster.lat, cluster.lng], Math.min(zoom + 2, 16), {
          animate: true,
          duration: 0.6,
        });
      });

      return marker;
    };

    const renderMarkers = () => {
      const q = query.toLowerCase();
      const paddedBounds = map.getBounds().pad(0.35);
      const visible = cameras.filter((camera) => {
        if (!paddedBounds.contains(L.latLng(camera.lat, camera.lng))) return false;
        if (!query) return true;
        return (
          camera.name.toLowerCase().includes(q) ||
          camera.id.toLowerCase().includes(q) ||
          (camera.road?.toLowerCase().includes(q) ?? false)
        );
      });

      const zoom = map.getZoom();
      const clusters = clusterCameras(map, visible, zoom);
      const nextKeys = new Set<string>();

      for (const cluster of clusters) {
        const signature = clusterSignature(cluster);
        nextKeys.add(cluster.key);
        const existing = renderedMarkersRef.current.get(cluster.key);

        if (existing?.signature === signature) continue;

        if (existing) {
          layer.removeLayer(existing.marker);
          renderedMarkersRef.current.delete(cluster.key);
        }

        const marker = cluster.cameras.length > 1
          ? createClusterMarker(cluster, zoom)
          : createCameraMarker(cluster.cameras[0]!);

        marker.addTo(layer);
        renderedMarkersRef.current.set(cluster.key, { marker, signature });
      }

      for (const [key, rendered] of renderedMarkersRef.current.entries()) {
        if (nextKeys.has(key)) continue;
        layer.removeLayer(rendered.marker);
        renderedMarkersRef.current.delete(key);
      }
    };

    const scheduleRender = () => {
      if (renderFrameRef.current !== null) cancelAnimationFrame(renderFrameRef.current);
      renderFrameRef.current = requestAnimationFrame(() => {
        renderFrameRef.current = null;
        renderMarkers();
      });
    };

    scheduleRender();
    map.on('moveend', scheduleRender);
    map.on('zoomend', scheduleRender);

    return () => {
      map.off('moveend', scheduleRender);
      map.off('zoomend', scheduleRender);
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }
    };
  }, [cameras, query, onSelect]);

  useEffect(() => {
    if (!mapRef.current || !eventLayerRef.current) return;

    const map = mapRef.current;
    const layer = eventLayerRef.current;

    const createEventMarker = (event: TrafficEvent): L.Marker => {
      const marker = L.marker([event.lat!, event.lng!], {
        icon: makeEventIcon(event.severity),
        zIndexOffset: 1600,
        keyboard: true,
        title: event.title,
      });

      const color = EVENT_COLORS[event.severity];
      const publishTime = formatEventTime(event.publishTime);
      const popupContent = `
        <div style="width:220px;font-family:'Noto Sans TC',sans-serif;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:10px;font-weight:800;color:${color};border:1px solid ${color}55;background:${color}18;padding:2px 7px;border-radius:9999px;">
              ${EVENT_LABELS[event.severity]}
            </span>
            <span style="font-size:10px;color:#6b7280;">TDX</span>
          </div>
          <div style="font-size:13px;font-weight:800;line-height:1.45;color:#e8ecf4;margin-bottom:6px;">
            ${escapeHtml(event.title)}
          </div>
          ${event.road ? `<div style="font-size:11px;color:#9ca3af;margin-bottom:5px;">${escapeHtml(event.road)}${event.direction ? ` · ${escapeHtml(event.direction)}` : ''}</div>` : ''}
          ${event.description ? `<div style="font-size:11px;line-height:1.55;color:#cbd5e1;margin-bottom:6px;">${escapeHtml(event.description)}</div>` : ''}
          ${publishTime ? `<div style="font-size:10px;color:#6b7280;border-top:1px solid rgba(255,255,255,0.06);padding-top:6px;">發布 ${escapeHtml(publishTime)}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: 'leaflet-camera-preview',
      });
      return marker;
    };

    const renderEvents = () => {
      const paddedBounds = map.getBounds().pad(0.35);
      const visible = trafficEvents.filter((event) => {
        if (typeof event.lat !== 'number' || typeof event.lng !== 'number') return false;
        if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return false;
        return paddedBounds.contains(L.latLng(event.lat, event.lng));
      });
      const nextKeys = new Set<string>();

      for (const event of visible) {
        const key = `event:${event.id}`;
        const signature = eventSignature(event);
        nextKeys.add(key);
        const existing = renderedEventMarkersRef.current.get(key);

        if (existing?.signature === signature) continue;

        if (existing) {
          layer.removeLayer(existing.marker);
          renderedEventMarkersRef.current.delete(key);
        }

        const marker = createEventMarker(event);
        marker.addTo(layer);
        renderedEventMarkersRef.current.set(key, { marker, signature });
      }

      for (const [key, rendered] of renderedEventMarkersRef.current.entries()) {
        if (nextKeys.has(key)) continue;
        layer.removeLayer(rendered.marker);
        renderedEventMarkersRef.current.delete(key);
      }
    };

    const scheduleEventRender = () => {
      if (eventRenderFrameRef.current !== null) cancelAnimationFrame(eventRenderFrameRef.current);
      eventRenderFrameRef.current = requestAnimationFrame(() => {
        eventRenderFrameRef.current = null;
        renderEvents();
      });
    };

    scheduleEventRender();
    map.on('moveend', scheduleEventRender);
    map.on('zoomend', scheduleEventRender);

    return () => {
      map.off('moveend', scheduleEventRender);
      map.off('zoomend', scheduleEventRender);
      if (eventRenderFrameRef.current !== null) {
        cancelAnimationFrame(eventRenderFrameRef.current);
        eventRenderFrameRef.current = null;
      }
    };
  }, [trafficEvents]);

  return <div ref={containerRef} className="w-full h-full" />;
}
