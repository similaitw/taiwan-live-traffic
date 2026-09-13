'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Camera } from '@/types/camera';
import type { CmsDevice } from '@/types/cms';
import type { RainfallStation } from '@/types/rainfall';
import type { TrafficEvent } from '@/types/traffic-event';
import type { TrafficFlowMapSegment } from '@/types/traffic-flow';
import { getDistance } from '@/lib/geo';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COLORS: Record<Camera['type'], string> = { freeway: '#3b82f6', provincial: '#10b981', county: '#f59e0b' };
const EVENT_COLORS: Record<TrafficEvent['severity'], string> = { info: '#38bdf8', warning: '#f59e0b', serious: '#ef4444' };
const EVENT_LABELS: Record<TrafficEvent['severity'], string> = { info: '道路事件', warning: '注意', serious: '嚴重' };

interface CameraCluster { key: string; cameras: Camera[]; lat: number; lng: number; }
interface RenderedMarker { marker: L.Marker; signature: string; }
interface RenderedFlow { polyline: L.Polyline; signature: string; }
interface NearestCamera { camera: Camera; distance: number; }

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatTime(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDistance(distance: number): string {
  return distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
}

function formatTravelTime(seconds?: number): string | undefined {
  if (seconds === undefined || !Number.isFinite(seconds)) return undefined;
  if (seconds < 60) return `${Math.round(seconds)} 秒`;
  return `${(seconds / 60).toFixed(seconds >= 600 ? 0 : 1)} 分`;
}

function congestionColor(level?: number): string {
  if (level === undefined || level === 0 || level === -99) return '#64748b';
  if (level === 1) return '#22c55e';
  if (level === 2) return '#eab308';
  if (level === 3) return '#f97316';
  if (level === 4) return '#ef4444';
  return '#991b1b';
}

function congestionLabel(level?: number): string {
  if (level === -99) return '資料異常';
  if (level === undefined || level === 0) return '未知';
  if (level === 1) return '順暢';
  if (level === 2) return '車多';
  if (level === 3) return '壅塞';
  if (level === 4) return '嚴重壅塞';
  return '極度壅塞';
}

function cmsStatusLabel(status?: number): string {
  if (status === 0) return '設備正常';
  if (status === 1) return '通訊異常';
  if (status === 2) return '停用／施工';
  if (status === 3) return '設備故障';
  return '狀態未知';
}

function rainfallColor(amount?: number): string {
  if (amount === undefined || amount <= 0) return '#64748b';
  if (amount < 5) return '#38bdf8';
  if (amount < 20) return '#06b6d4';
  if (amount < 40) return '#f59e0b';
  return '#ef4444';
}

function rainfallLabel(amount?: number): string {
  if (amount === undefined) return '?';
  if (amount < 1) return amount.toFixed(1);
  if (amount < 10) return amount.toFixed(1).replace(/\.0$/, '');
  return String(Math.round(amount));
}

function makeIcon(type: Camera['type']): L.DivIcon {
  const color = COLORS[type];
  return L.divIcon({
    className: '',
    html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><defs><filter id="glow-${type}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="blur"/><feFlood flood-color="${color}" flood-opacity="0.4" result="color"/><feComposite in="color" in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 20 12 20S24 20 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="1" filter="url(#glow-${type})"/><circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.9)"/></svg>`,
    iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -34],
  });
}

function makeClusterIcon(count: number): L.DivIcon {
  const size = count >= 100 ? 52 : count >= 25 ? 46 : 40;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'JetBrains Mono',monospace;font-weight:800;font-size:${count >= 100 ? 11 : 12}px;background:linear-gradient(135deg,rgba(59,130,246,.96),rgba(99,102,241,.96));border:2px solid rgba(255,255,255,.65);box-shadow:0 0 0 6px rgba(59,130,246,.14),0 8px 24px rgba(0,0,0,.42)">${count}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

function makeEventIcon(severity: TrafficEvent['severity']): L.DivIcon {
  const color = EVENT_COLORS[severity];
  const size = severity === 'serious' ? 34 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);border-radius:8px;color:#fff;background:${color};border:2px solid rgba(255,255,255,.82);box-shadow:0 0 0 5px ${color}22,0 8px 22px rgba(0,0,0,.42);font-size:15px;font-weight:900"><span style="transform:rotate(-45deg);line-height:1">!</span></div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2 + 6)],
  });
}

function makeCmsIcon(status?: number): L.DivIcon {
  const healthy = status === undefined || status === 0;
  const color = healthy ? '#06b6d4' : '#f59e0b';
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:25px;border-radius:5px;display:flex;align-items:center;justify-content:center;background:${color};border:2px solid rgba(255,255,255,.82);box-shadow:0 0 0 5px ${color}22,0 7px 20px rgba(0,0,0,.42);color:white;font-weight:900;font-size:14px">≡</div>`,
    iconSize: [34, 25], iconAnchor: [17, 12], popupAnchor: [0, -16],
  });
}

function makeRainfallIcon(station: RainfallStation): L.DivIcon {
  const amount = station.rainfall.past1Hr;
  const color = rainfallColor(amount);
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:9999px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${color};border:2px solid rgba(255,255,255,.85);box-shadow:0 0 0 5px ${color}22,0 8px 22px rgba(0,0,0,.38);color:white;font-family:'JetBrains Mono',monospace;font-weight:900;line-height:1"><span style="font-size:10px">${rainfallLabel(amount)}</span><span style="font-size:7px;margin-top:2px">1h</span></div>`,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20],
  });
}

function clusterCameras(map: L.Map, cameras: Camera[], zoom: number): CameraCluster[] {
  if (zoom >= 15) return cameras.map((camera) => ({ key: `camera:${camera.id}`, cameras: [camera], lat: camera.lat, lng: camera.lng }));
  const cellSize = zoom <= 7 ? 110 : zoom <= 9 ? 90 : zoom <= 11 ? 72 : zoom <= 13 ? 56 : 42;
  const groups = new Map<string, { cameras: Camera[]; latSum: number; lngSum: number }>();
  for (const camera of cameras) {
    const point = map.project(L.latLng(camera.lat, camera.lng), zoom);
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const group = groups.get(key);
    if (group) { group.cameras.push(camera); group.latSum += camera.lat; group.lngSum += camera.lng; }
    else groups.set(key, { cameras: [camera], latSum: camera.lat, lngSum: camera.lng });
  }
  return [...groups.entries()].map(([gridKey, group]) => ({
    key: group.cameras.length === 1 ? `camera:${group.cameras[0]!.id}` : `cluster:${zoom}:${gridKey}`,
    cameras: group.cameras, lat: group.latSum / group.cameras.length, lng: group.lngSum / group.cameras.length,
  }));
}

function clusterSignature(cluster: CameraCluster): string {
  return cluster.cameras.length === 1 ? cluster.cameras[0]!.id : cluster.cameras.map((camera) => camera.id).sort().join('|');
}

function findNearestCamera(cameras: Camera[], lat: number, lng: number): NearestCamera | null {
  let nearest: NearestCamera | null = null;
  for (const camera of cameras) {
    const distance = getDistance(lat, lng, camera.lat, camera.lng);
    if (!nearest || distance < nearest.distance) nearest = { camera, distance };
  }
  return nearest;
}

function verificationBlock(nearest: NearestCamera | null, onVerify: (camera: Camera) => void): HTMLElement | null {
  if (!nearest || nearest.distance > 15_000) return null;
  const verifier = document.createElement('div');
  verifier.style.marginTop = '10px'; verifier.style.paddingTop = '8px'; verifier.style.borderTop = '1px solid rgba(255,255,255,0.08)';
  const info = document.createElement('div');
  info.textContent = `最近可見 CCTV：${nearest.camera.name} · ${formatDistance(nearest.distance)}`;
  info.style.fontSize = '10px'; info.style.lineHeight = '1.45'; info.style.color = '#9ca3af'; info.style.marginBottom = '7px';
  verifier.appendChild(info);
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = '查看附近監視器'; button.style.width = '100%'; button.style.padding = '7px 10px'; button.style.borderRadius = '9px'; button.style.border = '1px solid rgba(59,130,246,0.5)'; button.style.background = 'rgba(59,130,246,0.16)'; button.style.color = '#93c5fd'; button.style.fontSize = '11px'; button.style.fontWeight = '800'; button.style.cursor = 'pointer';
  button.addEventListener('click', () => onVerify(nearest.camera));
  verifier.appendChild(button);
  return verifier;
}

function eventSignature(event: TrafficEvent, nearest: NearestCamera | null): string {
  return [event.id, event.severity, event.lat, event.lng, event.title, event.description, event.publishTime, nearest?.camera.id, nearest ? Math.round(nearest.distance) : undefined].join('|');
}

function cmsSignature(device: CmsDevice, nearest: NearestCamera | null): string {
  return [device.id, device.status, device.messageStatus, device.messages.join('||'), device.dataCollectTime, nearest?.camera.id, nearest ? Math.round(nearest.distance) : undefined].join('|');
}

function rainfallSignature(station: RainfallStation, nearest: NearestCamera | null): string {
  const rain = station.rainfall;
  return [station.id, station.observedAt, rain.now, rain.past10Min, rain.past1Hr, rain.past3Hr, rain.past6Hr, rain.past12Hr, rain.past24Hr, nearest?.camera.id, nearest ? Math.round(nearest.distance) : undefined].join('|');
}

function flowAnchor(segment: TrafficFlowMapSegment): [number, number] | null {
  const path = segment.paths.reduce((longest, current) => current.length > longest.length ? current : longest, segment.paths[0] ?? []);
  if (!path.length) return null;
  return path[Math.floor(path.length / 2)] ?? null;
}

function flowSignature(segment: TrafficFlowMapSegment, nearest: NearestCamera | null): string {
  return [segment.sectionId, segment.travelSpeed, segment.travelTime, segment.congestionLevel, segment.dataCollectTime, nearest?.camera.id, nearest ? Math.round(nearest.distance) : undefined].join('|');
}

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
  userLocation?: { lat: number; lng: number } | null;
  trafficEvents?: TrafficEvent[];
  trafficFlowSegments?: TrafficFlowMapSegment[];
  cmsDevices?: CmsDevice[];
  cmsPreferredCameraIds?: Record<string, string>;
  rainfallStations?: RainfallStation[];
  radarImageUrl?: string;
}

export default function MapInner({ cameras, query, onSelect, userLocation, trafficEvents = [], trafficFlowSegments = [], cmsDevices = [], cmsPreferredCameraIds = {}, rainfallStations = [], radarImageUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const cameraLayerRef = useRef<L.LayerGroup | null>(null);
  const rainfallLayerRef = useRef<L.LayerGroup | null>(null);
  const cmsLayerRef = useRef<L.LayerGroup | null>(null);
  const eventLayerRef = useRef<L.LayerGroup | null>(null);
  const flowLayerRef = useRef<L.LayerGroup | null>(null);
  const radarOverlayRef = useRef<L.ImageOverlay | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const renderedMarkersRef = useRef<Map<string, RenderedMarker>>(new Map());
  const renderedRainfallRef = useRef<Map<string, RenderedMarker>>(new Map());
  const renderedCmsRef = useRef<Map<string, RenderedMarker>>(new Map());
  const renderedEventMarkersRef = useRef<Map<string, RenderedMarker>>(new Map());
  const renderedFlowRef = useRef<Map<string, RenderedFlow>>(new Map());
  const cameraFrameRef = useRef<number | null>(null);
  const rainfallFrameRef = useRef<number | null>(null);
  const cmsFrameRef = useRef<number | null>(null);
  const eventFrameRef = useRef<number | null>(null);
  const flowFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([23.9, 121.0], 8);
    mapRef.current = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: 'traffic-basemap-tile',
    }).addTo(map);
    const radarPane = map.createPane('radarPane');
    radarPane.style.zIndex = '250';
    radarPane.style.pointerEvents = 'none';
    flowLayerRef.current = L.layerGroup().addTo(map);
    cameraLayerRef.current = L.layerGroup().addTo(map);
    rainfallLayerRef.current = L.layerGroup().addTo(map);
    cmsLayerRef.current = L.layerGroup().addTo(map);
    eventLayerRef.current = L.layerGroup().addTo(map);
    return () => {
      if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current);
      if (rainfallFrameRef.current !== null) cancelAnimationFrame(rainfallFrameRef.current);
      if (cmsFrameRef.current !== null) cancelAnimationFrame(cmsFrameRef.current);
      if (eventFrameRef.current !== null) cancelAnimationFrame(eventFrameRef.current);
      if (flowFrameRef.current !== null) cancelAnimationFrame(flowFrameRef.current);
      renderedMarkersRef.current.clear(); renderedRainfallRef.current.clear(); renderedCmsRef.current.clear(); renderedEventMarkersRef.current.clear(); renderedFlowRef.current.clear();
      radarOverlayRef.current = null;
      map.remove(); mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (radarOverlayRef.current) {
      map.removeLayer(radarOverlayRef.current);
      radarOverlayRef.current = null;
    }
    if (!radarImageUrl) return;
    const overlay = L.imageOverlay(radarImageUrl, [[20.5, 118], [26.5, 124]], { opacity: 0.5, interactive: false, pane: 'radarPane' }).addTo(map);
    radarOverlayRef.current = overlay;
    return () => {
      if (map.hasLayer(overlay)) map.removeLayer(overlay);
      if (radarOverlayRef.current === overlay) radarOverlayRef.current = null;
    };
  }, [radarImageUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    const userIcon = L.divIcon({ className: '', html: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="rgba(59,130,246,.15)" stroke="rgba(59,130,246,.3)"/><circle cx="14" cy="14" r="6" fill="#3b82f6" stroke="rgba(255,255,255,.6)" stroke-width="2"/><circle cx="14" cy="14" r="2" fill="white"/></svg>`, iconSize: [28, 28], iconAnchor: [14, 14] });
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
    map.setView([userLocation.lat, userLocation.lng], 12, { animate: true });
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current; const layer = cameraLayerRef.current;
    if (!map || !layer) return;
    const createCameraMarker = (camera: Camera): L.Marker => {
      const marker = L.marker([camera.lat, camera.lng], { icon: makeIcon(camera.type), zIndexOffset: 1000, title: camera.name });
      const color = COLORS[camera.type];
      const preview = `<div style="width:200px;font-family:'Noto Sans TC',sans-serif"><div style="position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#0a0e1a;margin-bottom:8px;border-radius:8px;border:1px solid rgba(255,255,255,.06)"><img src="/api/proxy/snapshot?url=${encodeURIComponent(camera.snapshotUrl ?? camera.streamUrl)}" alt="${escapeHtml(camera.name)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/></div><div style="padding:0 2px"><div style="font-weight:700;color:#e8ecf4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;margin-bottom:4px">${escapeHtml(camera.name)}</div><div style="color:#4b5563;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px;font-family:'JetBrains Mono',monospace">${escapeHtml(camera.road ?? '—')}</div><div style="padding-top:8px;border-top:1px solid rgba(255,255,255,.06);color:${color};font-size:10px;font-weight:700;text-align:center">點擊查看</div></div></div>`;
      const popup = L.popup({ maxWidth: 220, className: 'leaflet-camera-preview' }).setContent(preview);
      marker.on('mouseover', () => popup.setLatLng(marker.getLatLng()).openOn(map)); marker.on('mouseout', () => map.closePopup(popup));
      marker.on('click', () => { map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13), { animate: true, duration: 0.8 }); map.closePopup(popup); onSelect(camera); });
      return marker;
    };
    const render = () => {
      const q = query.toLowerCase(); const bounds = map.getBounds().pad(0.35);
      const visible = cameras.filter((camera) => bounds.contains([camera.lat, camera.lng]) && (!query || camera.name.toLowerCase().includes(q) || camera.id.toLowerCase().includes(q) || (camera.road?.toLowerCase().includes(q) ?? false)));
      const zoom = map.getZoom(); const clusters = clusterCameras(map, visible, zoom); const next = new Set<string>();
      for (const cluster of clusters) {
        const signature = clusterSignature(cluster); next.add(cluster.key); const existing = renderedMarkersRef.current.get(cluster.key); if (existing?.signature === signature) continue; if (existing) layer.removeLayer(existing.marker);
        const marker = cluster.cameras.length > 1 ? L.marker([cluster.lat, cluster.lng], { icon: makeClusterIcon(cluster.cameras.length), zIndexOffset: 800, title: `${cluster.cameras.length} 支監視器` }) : createCameraMarker(cluster.cameras[0]!);
        if (cluster.cameras.length > 1) marker.on('click', () => map.setView([cluster.lat, cluster.lng], Math.min(zoom + 2, 16), { animate: true, duration: 0.6 }));
        marker.addTo(layer); renderedMarkersRef.current.set(cluster.key, { marker, signature });
      }
      for (const [key, rendered] of renderedMarkersRef.current) if (!next.has(key)) { layer.removeLayer(rendered.marker); renderedMarkersRef.current.delete(key); }
    };
    const schedule = () => { if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current); cameraFrameRef.current = requestAnimationFrame(() => { cameraFrameRef.current = null; render(); }); };
    schedule(); map.on('moveend', schedule); map.on('zoomend', schedule);
    return () => { map.off('moveend', schedule); map.off('zoomend', schedule); if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current); };
  }, [cameras, query, onSelect]);

  useEffect(() => {
    const map = mapRef.current; const layer = rainfallLayerRef.current;
    if (!map || !layer) return;
    const createPopup = (station: RainfallStation, nearest: NearestCamera | null): HTMLElement => {
      const root = document.createElement('div'); root.style.width = '230px'; root.style.fontFamily = "'Noto Sans TC',sans-serif";
      const badge = document.createElement('span'); badge.textContent = 'CWA 雨量站'; badge.style.fontSize = '10px'; badge.style.fontWeight = '800'; badge.style.color = '#7dd3fc'; badge.style.border = '1px solid rgba(56,189,248,.42)'; badge.style.background = 'rgba(14,165,233,.12)'; badge.style.padding = '2px 7px'; badge.style.borderRadius = '9999px'; root.appendChild(badge);
      const title = document.createElement('div'); title.textContent = station.name; title.style.marginTop = '8px'; title.style.fontSize = '13px'; title.style.fontWeight = '800'; title.style.color = '#e8ecf4'; root.appendChild(title);
      const location = document.createElement('div'); location.textContent = [station.county, station.town].filter(Boolean).join(' · ') || station.id; location.style.fontSize = '10px'; location.style.color = '#94a3b8'; location.style.marginTop = '3px'; root.appendChild(location);
      const grid = document.createElement('div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = '1fr 1fr'; grid.style.gap = '6px'; grid.style.marginTop = '9px';
      const values: Array<[string, number | undefined]> = [['10 分鐘', station.rainfall.past10Min], ['1 小時', station.rainfall.past1Hr], ['3 小時', station.rainfall.past3Hr], ['24 小時', station.rainfall.past24Hr]];
      for (const [label, amount] of values) { const cell = document.createElement('div'); cell.style.padding = '7px'; cell.style.borderRadius = '8px'; cell.style.background = 'rgba(255,255,255,.04)'; const labelEl = document.createElement('div'); labelEl.textContent = label; labelEl.style.fontSize = '9px'; labelEl.style.color = '#64748b'; const valueEl = document.createElement('div'); valueEl.textContent = amount === undefined ? '—' : `${amount.toFixed(1)} mm`; valueEl.style.fontSize = '12px'; valueEl.style.fontWeight = '800'; valueEl.style.color = amount && amount > 0 ? '#7dd3fc' : '#cbd5e1'; cell.appendChild(labelEl); cell.appendChild(valueEl); grid.appendChild(cell); }
      root.appendChild(grid);
      const time = formatTime(station.observedAt); if (time) { const meta = document.createElement('div'); meta.textContent = `測站觀測 ${time}`; meta.style.fontSize = '10px'; meta.style.color = '#6b7280'; meta.style.marginTop = '7px'; root.appendChild(meta); }
      if (nearest && nearest.distance <= 15_000) {
        const note = document.createElement('div'); note.textContent = '下方 CCTV 為附近位置的現場影像，與雨量測站位置不同。'; note.style.fontSize = '9px'; note.style.lineHeight = '1.45'; note.style.color = '#64748b'; note.style.marginTop = '8px'; root.appendChild(note);
      }
      const verify = verificationBlock(nearest, (camera) => { map.closePopup(); onSelect(camera); }); if (verify) root.appendChild(verify);
      return root;
    };
    const render = () => {
      const bounds = map.getBounds().pad(0.35); const visible = rainfallStations.filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lng) && bounds.contains([station.lat, station.lng])); const next = new Set<string>();
      for (const station of visible) { const nearest = findNearestCamera(cameras, station.lat, station.lng); const key = `rain:${station.id}`; const signature = rainfallSignature(station, nearest); next.add(key); const existing = renderedRainfallRef.current.get(key); if (existing?.signature === signature) continue; if (existing) layer.removeLayer(existing.marker); const marker = L.marker([station.lat, station.lng], { icon: makeRainfallIcon(station), zIndexOffset: 1200, keyboard: true, title: `${station.name} 近1小時雨量` }); marker.bindPopup(createPopup(station, nearest), { maxWidth: 260, className: 'leaflet-camera-preview' }); marker.addTo(layer); renderedRainfallRef.current.set(key, { marker, signature }); }
      for (const [key, rendered] of renderedRainfallRef.current) if (!next.has(key)) { layer.removeLayer(rendered.marker); renderedRainfallRef.current.delete(key); }
    };
    const schedule = () => { if (rainfallFrameRef.current !== null) cancelAnimationFrame(rainfallFrameRef.current); rainfallFrameRef.current = requestAnimationFrame(() => { rainfallFrameRef.current = null; render(); }); };
    schedule(); map.on('moveend', schedule); map.on('zoomend', schedule);
    return () => { map.off('moveend', schedule); map.off('zoomend', schedule); if (rainfallFrameRef.current !== null) cancelAnimationFrame(rainfallFrameRef.current); };
  }, [cameras, onSelect, rainfallStations]);

  useEffect(() => {
    const map = mapRef.current; const layer = cmsLayerRef.current;
    if (!map || !layer) return;
    const createPopup = (device: CmsDevice, nearest: NearestCamera | null): HTMLElement => {
      const root = document.createElement('div'); root.style.width = '240px'; root.style.fontFamily = "'Noto Sans TC',sans-serif";
      const heading = document.createElement('div'); heading.style.display = 'flex'; heading.style.alignItems = 'center'; heading.style.gap = '6px'; heading.style.marginBottom = '8px';
      const badge = document.createElement('span'); badge.textContent = '官方看板'; badge.style.fontSize = '10px'; badge.style.fontWeight = '800'; badge.style.color = '#22d3ee'; badge.style.border = '1px solid rgba(34,211,238,.45)'; badge.style.background = 'rgba(6,182,212,.13)'; badge.style.padding = '2px 7px'; badge.style.borderRadius = '9999px'; heading.appendChild(badge);
      const status = document.createElement('span'); status.textContent = cmsStatusLabel(device.status); status.style.fontSize = '10px'; status.style.color = device.status === 0 || device.status === undefined ? '#10b981' : '#f59e0b'; heading.appendChild(status); root.appendChild(heading);
      const road = document.createElement('div'); road.textContent = `${device.roadName ?? device.roadId ?? '高速公路'}${device.roadDirection ? ` · ${device.roadDirection}` : ''}`; road.style.fontSize = '12px'; road.style.fontWeight = '800'; road.style.color = '#e8ecf4'; road.style.marginBottom = '8px'; root.appendChild(road);
      const messageBox = document.createElement('div'); messageBox.style.display = 'flex'; messageBox.style.flexDirection = 'column'; messageBox.style.gap = '5px';
      if (device.messages.length === 0) {
        const line = document.createElement('div'); line.textContent = device.active ? '目前無可解析文字訊息' : '目前未執行循環顯示'; line.style.fontSize = '11px'; line.style.color = '#94a3b8'; messageBox.appendChild(line);
      } else {
        for (const message of device.messages) { const line = document.createElement('div'); line.textContent = message; line.style.fontSize = '12px'; line.style.lineHeight = '1.55'; line.style.padding = '7px 8px'; line.style.borderRadius = '8px'; line.style.background = 'rgba(6,182,212,.08)'; line.style.border = '1px solid rgba(34,211,238,.16)'; line.style.color = '#cffafe'; messageBox.appendChild(line); }
      }
      root.appendChild(messageBox);
      const time = formatTime(device.dataCollectTime); if (time) { const meta = document.createElement('div'); meta.textContent = `資料 ${time}`; meta.style.fontSize = '10px'; meta.style.color = '#6b7280'; meta.style.marginTop = '7px'; root.appendChild(meta); }
      const verify = verificationBlock(nearest, (camera) => { map.closePopup(); onSelect(camera); }); if (verify) root.appendChild(verify); return root;
    };
    const render = () => {
      const bounds = map.getBounds().pad(0.35); const visible = cmsDevices.filter((device) => typeof device.lat === 'number' && typeof device.lng === 'number' && Number.isFinite(device.lat) && Number.isFinite(device.lng) && bounds.contains([device.lat, device.lng])); const next = new Set<string>();
      for (const device of visible) {
        const preferredId = cmsPreferredCameraIds[device.id]; const preferredCamera = preferredId ? cameras.find((camera) => camera.id === preferredId) : undefined;
        const nearest = preferredCamera ? { camera: preferredCamera, distance: getDistance(device.lat!, device.lng!, preferredCamera.lat, preferredCamera.lng) } : findNearestCamera(cameras, device.lat!, device.lng!);
        const key = `cms:${device.id}`; const signature = cmsSignature(device, nearest); next.add(key); const existing = renderedCmsRef.current.get(key); if (existing?.signature === signature) continue; if (existing) layer.removeLayer(existing.marker);
        const marker = L.marker([device.lat!, device.lng!], { icon: makeCmsIcon(device.status), zIndexOffset: 1350, keyboard: true, title: device.messages[0] ?? '官方資訊看板' }); marker.bindPopup(createPopup(device, nearest), { maxWidth: 275, className: 'leaflet-camera-preview' }); marker.addTo(layer); renderedCmsRef.current.set(key, { marker, signature });
      }
      for (const [key, rendered] of renderedCmsRef.current) if (!next.has(key)) { layer.removeLayer(rendered.marker); renderedCmsRef.current.delete(key); }
    };
    const schedule = () => { if (cmsFrameRef.current !== null) cancelAnimationFrame(cmsFrameRef.current); cmsFrameRef.current = requestAnimationFrame(() => { cmsFrameRef.current = null; render(); }); };
    schedule(); map.on('moveend', schedule); map.on('zoomend', schedule);
    return () => { map.off('moveend', schedule); map.off('zoomend', schedule); if (cmsFrameRef.current !== null) cancelAnimationFrame(cmsFrameRef.current); };
  }, [cameras, cmsDevices, cmsPreferredCameraIds, onSelect]);

  useEffect(() => {
    const map = mapRef.current; const layer = eventLayerRef.current; if (!map || !layer) return;
    const createPopup = (event: TrafficEvent, nearest: NearestCamera | null): HTMLElement => {
      const root = document.createElement('div'); root.style.width = '230px'; root.style.fontFamily = "'Noto Sans TC',sans-serif"; const color = EVENT_COLORS[event.severity];
      root.innerHTML = `<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="font-size:10px;font-weight:800;color:${color};border:1px solid ${color}55;background:${color}18;padding:2px 7px;border-radius:9999px">${EVENT_LABELS[event.severity]}</span><span style="font-size:10px;color:#6b7280">TDX</span></div><div style="font-size:13px;font-weight:800;line-height:1.45;color:#e8ecf4;margin-bottom:6px">${escapeHtml(event.title)}</div>${event.road ? `<div style="font-size:11px;color:#9ca3af;margin-bottom:5px">${escapeHtml(event.road)}${event.direction ? ` · ${escapeHtml(event.direction)}` : ''}</div>` : ''}${event.description ? `<div style="font-size:11px;line-height:1.55;color:#cbd5e1;margin-bottom:6px">${escapeHtml(event.description)}</div>` : ''}${formatTime(event.publishTime) ? `<div style="font-size:10px;color:#6b7280;border-top:1px solid rgba(255,255,255,.06);padding-top:6px">發布 ${escapeHtml(formatTime(event.publishTime)!)}</div>` : ''}`;
      const verify = verificationBlock(nearest, (camera) => { map.closePopup(); onSelect(camera); }); if (verify) root.appendChild(verify); return root;
    };
    const render = () => {
      const bounds = map.getBounds().pad(0.35); const visible = trafficEvents.filter((event) => typeof event.lat === 'number' && typeof event.lng === 'number' && Number.isFinite(event.lat) && Number.isFinite(event.lng) && bounds.contains([event.lat, event.lng])); const next = new Set<string>();
      for (const event of visible) { const nearest = findNearestCamera(cameras, event.lat!, event.lng!); const key = `event:${event.id}`; const signature = eventSignature(event, nearest); next.add(key); const existing = renderedEventMarkersRef.current.get(key); if (existing?.signature === signature) continue; if (existing) layer.removeLayer(existing.marker); const marker = L.marker([event.lat!, event.lng!], { icon: makeEventIcon(event.severity), zIndexOffset: 1600, title: event.title }); marker.bindPopup(createPopup(event, nearest), { maxWidth: 260, className: 'leaflet-camera-preview' }); marker.addTo(layer); renderedEventMarkersRef.current.set(key, { marker, signature }); }
      for (const [key, rendered] of renderedEventMarkersRef.current) if (!next.has(key)) { layer.removeLayer(rendered.marker); renderedEventMarkersRef.current.delete(key); }
    };
    const schedule = () => { if (eventFrameRef.current !== null) cancelAnimationFrame(eventFrameRef.current); eventFrameRef.current = requestAnimationFrame(() => { eventFrameRef.current = null; render(); }); };
    schedule(); map.on('moveend', schedule); map.on('zoomend', schedule); return () => { map.off('moveend', schedule); map.off('zoomend', schedule); if (eventFrameRef.current !== null) cancelAnimationFrame(eventFrameRef.current); };
  }, [cameras, onSelect, trafficEvents]);

  useEffect(() => {
    const map = mapRef.current; const layer = flowLayerRef.current; if (!map || !layer) return;
    const createPopup = (segment: TrafficFlowMapSegment, nearest: NearestCamera | null): HTMLElement => {
      const root = document.createElement('div'); root.style.width = '235px'; root.style.fontFamily = "'Noto Sans TC',sans-serif"; const color = congestionColor(segment.congestionLevel); const title = segment.roadName ?? segment.sectionName ?? segment.roadId ?? `路段 ${segment.sectionId}`; const sectionDetail = segment.sectionName ?? [segment.start, segment.end].filter(Boolean).join(' → '); const speed = segment.travelSpeed !== undefined ? `${Math.round(segment.travelSpeed)} km/h` : '—'; const travel = formatTravelTime(segment.travelTime) ?? '—'; const collected = formatTime(segment.dataCollectTime);
      root.innerHTML = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span style="font-size:10px;font-weight:800;color:${color};border:1px solid ${color}66;background:${color}18;padding:2px 7px;border-radius:9999px">${congestionLabel(segment.congestionLevel)}</span><span style="font-size:10px;color:#6b7280">TDX 即時路況</span></div><div style="font-size:13px;font-weight:800;color:#e8ecf4;line-height:1.45;margin-bottom:5px">${escapeHtml(title)}</div>${sectionDetail && sectionDetail !== title ? `<div style="font-size:11px;color:#9ca3af;margin-bottom:8px">${escapeHtml(sectionDetail)}${segment.roadDirection ? ` · ${escapeHtml(segment.roadDirection)}` : ''}</div>` : ''}<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:7px"><div style="padding:7px;border-radius:8px;background:rgba(255,255,255,.04)"><div style="font-size:9px;color:#6b7280">平均速度</div><div style="font-size:13px;font-weight:800;color:#e8ecf4">${speed}</div></div><div style="padding:7px;border-radius:8px;background:rgba(255,255,255,.04)"><div style="font-size:9px;color:#6b7280">旅行時間</div><div style="font-size:13px;font-weight:800;color:#e8ecf4">${travel}</div></div></div>${collected ? `<div style="font-size:10px;color:#6b7280">資料 ${escapeHtml(collected)}</div>` : ''}`;
      const verify = verificationBlock(nearest, (camera) => { map.closePopup(); onSelect(camera); }); if (verify) root.appendChild(verify); return root;
    };
    const render = () => {
      const bounds = map.getBounds().pad(0.35); const visible = trafficFlowSegments.filter((segment) => segment.paths.some((path) => path.length >= 2 && bounds.intersects(L.latLngBounds(path)))); const next = new Set<string>();
      for (const segment of visible) { const anchor = flowAnchor(segment); const nearest = anchor ? findNearestCamera(cameras, anchor[0], anchor[1]) : null; const key = `flow:${segment.sectionId}`; const signature = flowSignature(segment, nearest); next.add(key); const existing = renderedFlowRef.current.get(key); if (existing?.signature === signature) continue; if (existing) layer.removeLayer(existing.polyline); const color = congestionColor(segment.congestionLevel); const polyline = L.polyline(segment.paths, { color, weight: (segment.congestionLevel ?? 0) >= 3 ? 7 : 5, opacity: segment.congestionLevel === -99 || segment.congestionLevel === 0 ? 0.5 : 0.82, lineCap: 'round', lineJoin: 'round', interactive: true }); polyline.bindPopup(createPopup(segment, nearest), { maxWidth: 270, className: 'leaflet-camera-preview' }); polyline.on('mouseover', () => polyline.setStyle({ weight: (segment.congestionLevel ?? 0) >= 3 ? 9 : 7, opacity: 1 })); polyline.on('mouseout', () => polyline.setStyle({ weight: (segment.congestionLevel ?? 0) >= 3 ? 7 : 5, opacity: segment.congestionLevel === -99 || segment.congestionLevel === 0 ? 0.5 : 0.82 })); polyline.addTo(layer); renderedFlowRef.current.set(key, { polyline, signature }); }
      for (const [key, rendered] of renderedFlowRef.current) if (!next.has(key)) { layer.removeLayer(rendered.polyline); renderedFlowRef.current.delete(key); }
    };
    const schedule = () => { if (flowFrameRef.current !== null) cancelAnimationFrame(flowFrameRef.current); flowFrameRef.current = requestAnimationFrame(() => { flowFrameRef.current = null; render(); }); };
    schedule(); map.on('moveend', schedule); map.on('zoomend', schedule); return () => { map.off('moveend', schedule); map.off('zoomend', schedule); if (flowFrameRef.current !== null) cancelAnimationFrame(flowFrameRef.current); };
  }, [cameras, onSelect, trafficFlowSegments]);

  return <div ref={containerRef} className="w-full h-full" />;
}
